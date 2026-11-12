import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';
import { parseJsonText } from './parse.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function assertConfigured() {
  if (
    !env.LLM_API_KEY ||
    env.LLM_API_KEY.startsWith('dummy') ||
    env.LLM_MODEL === 'set_me_later' ||
    env.EMBEDDING_MODEL === 'set_me_later'
  ) {
    throw new AppError(
      500,
      'LLM_NOT_CONFIGURED',
      'Set LLM_API_KEY, LLM_MODEL and EMBEDDING_MODEL, or keep RAG_MOCK=true.'
    );
  }
}

async function request(path, body) {
  assertConfigured();
  let response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.LLM_API_KEY
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(env.LLM_TIMEOUT_MS)
    });
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new AppError(
      502,
      'AI_PROVIDER_ERROR',
      timedOut
        ? 'Gemini took too long to respond. Please try again.'
        : 'Gemini could not be reached. Please try again.'
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(502, 'AI_PROVIDER_ERROR', `Gemini request failed (${response.status})`, {
      provider: detail.slice(0, 300)
    });
  }

  return response.json();
}

export const geminiProvider = {
  name: 'gemini',

  async embed(texts) {
    const data = await request(`models/${env.EMBEDDING_MODEL}:batchEmbedContents`, {
      requests: texts.map((text) => ({
        model: `models/${env.EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        ...(env.EMBEDDING_DIMENSIONS
          ? { outputDimensionality: env.EMBEDDING_DIMENSIONS }
          : {})
      }))
    });
    return (data.embeddings ?? []).map((entry) => entry.values ?? []);
  },

  async generate({ system, user }) {
    const data = await request(`models/${env.LLM_MODEL}:generateContent`, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    const parsed = parseJsonText(text);
    if (!parsed) {
      throw new AppError(502, 'AI_PROVIDER_ERROR', 'Gemini returned a response that was not JSON');
    }
    return parsed;
  }
};
