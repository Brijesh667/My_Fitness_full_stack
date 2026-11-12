import { env } from '../config/env.js';
import { getLlmProvider } from '../llm/index.js';
import { parseJsonText } from '../llm/parse.js';
import { DISCLAIMER, SYSTEM_PROMPT, buildPrompt, buildQuery, responseShape } from '../rag/prompts.js';
import { vectorStore } from '../rag/vectorStore.js';
import { mealResponseSchema, planResponseSchema } from '../validators/assistant.js';
import { AppError } from '../utils/appError.js';

function retrievedCitations(chunks) {
  const seen = new Set();
  const citations = [];

  for (const chunk of chunks) {
    const chunkId = String(chunk._id ?? '');
    if (!chunkId || seen.has(chunkId)) continue;
    seen.add(chunkId);
    citations.push({ source: chunk.sourceName ?? 'knowledge base', chunkId });
  }

  return citations.slice(0, 5);
}

async function generateValidated(provider, schema, prompt, mode) {
  let currentPrompt = prompt;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const output = await provider.generate({
      system: SYSTEM_PROMPT,
      user: currentPrompt,
      jsonSchema: responseShape(mode)
    });
    const parsed = parseJsonText(output);
    const result = schema.safeParse(parsed);

    if (result.success) return result.data;

    const details = result.error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    currentPrompt = `${prompt}\n\nYour previous response was invalid (${details}). Return corrected JSON only, matching the required shape.`;
  }

  throw new AppError(
    502,
    'AI_INVALID_OUTPUT',
    'The assistant could not produce a valid response. Please try again.'
  );
}

export async function runAssistant(user, input, deps = {}) {
  const provider = deps.provider ?? getLlmProvider();
  const store = deps.vectorStore ?? vectorStore;
  const topK = deps.topK ?? env.RAG_TOP_K;

  const query = buildQuery(input, user);
  const embedding = await provider.embed([query]);
  const chunks = await store.search(embedding[0] ?? [], topK);
  const prompt = buildPrompt({ input, user, chunks, mode: input.mode });
  const schema = input.mode === 'meal' ? mealResponseSchema : planResponseSchema;

  const parsed = await generateValidated(provider, schema, prompt, input.mode);
  const citations = retrievedCitations(chunks);
  const warnings = [...(parsed.warnings ?? [])];
  const assumptions = [...(parsed.assumptions ?? [])];

  if (chunks.length === 0) {
    assumptions.push('No knowledge-base context matched this request, so the plan is general.');
  }

  if (input.mode === 'plan') {
    const calories = parsed.dailyTargets.calories;
    if (calories < 1200 || calories > 5000) {
      warnings.push('Daily calories are outside the 1200–5000 range; review before adopting.');
    }

    return {
      mode: 'plan',
      plan: {
        ...parsed,
        assumptions,
        warnings,
        citations,
        disclaimer: DISCLAIMER
      },
      meta: { chunks: chunks.length, provider: provider.name ?? 'unknown' }
    };
  }

  return {
    mode: 'meal',
    meal: parsed.meal,
    assumptions,
    warnings,
    citations,
    disclaimer: DISCLAIMER,
    meta: { chunks: chunks.length, provider: provider.name ?? 'unknown' }
  };
}
