import { describe, it, expect, beforeEach } from 'vitest';
import { api, signupUser } from './helpers.js';
import { chunkText, countTokens } from '../src/rag/chunker.js';
import { ingestDocuments } from '../src/rag/ingest.js';
import { vectorStore } from '../src/rag/vectorStore.js';
import { RagChunk } from '../src/models/RagChunk.js';
import { mockEmbedding, mockProvider } from '../src/llm/mock.js';
import { runAssistant } from '../src/services/assistantService.js';

const planInput = {
  mode: 'plan',
  goal: 'fat_loss',
  mealsPerDay: 3,
  dietPreference: 'veg',
  allergies: ['peanuts'],
  cuisine: 'indian',
  notes: 'quick meals'
};

describe('chunking and vector search', () => {
  it('splits long text into overlapping windows', () => {
    const words = Array.from({ length: 900 }, (_, index) => `word${index}`);
    const chunks = chunkText(words.join(' '), { maxTokens: 500, overlap: 80 });

    expect(chunks).toHaveLength(2);
    expect(countTokens(chunks[0])).toBe(500);
    const first = chunks[0].split(' ');
    const second = chunks[1].split(' ');
    expect(first.slice(-80).join(' ')).toBe(second.slice(0, 80).join(' '));
    expect(countTokens(chunks.at(-1))).toBeLessThanOrEqual(500);
    expect(chunks.at(-1).split(' ').at(-1)).toBe('word899');
  });

  it('produces deterministic normalised embeddings', () => {
    const first = mockEmbedding('protein and muscle repair');
    const second = mockEmbedding('protein and muscle repair');
    expect(first).toEqual(second);
    expect(first).toHaveLength(384);
    expect(Math.sqrt(first.reduce((sum, value) => sum + value * value, 0))).toBeCloseTo(1, 5);
    expect(mockEmbedding('protein')).not.toEqual(mockEmbedding('hydration'));
  });
});

describe('rag assistant', () => {
  beforeEach(async () => {
    await ingestDocuments();
  });

  it('ingests idempotently and stores embeddings', async () => {
    const firstCount = await RagChunk.countDocuments({});
    expect(firstCount).toBeGreaterThan(0);

    const sourceCount = await RagChunk.countDocuments({ sourceName: 'sample-protein.txt' });
    expect(sourceCount).toBeGreaterThan(0);

    await ingestDocuments();
    expect(await RagChunk.countDocuments({})).toBe(firstCount);

    const chunk = await RagChunk.findOne({ sourceName: 'sample-protein.txt' });
    expect(chunk.embedding).toHaveLength(384);
    expect(chunk.tokenCount).toBeGreaterThan(0);
  });

  it('returns the closest chunks in score order', async () => {
    const embedding = await mockProvider.embed(['protein muscle repair']);
    const results = await vectorStore.search(embedding[0], 2);

    expect(results).toHaveLength(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[0].text.length).toBeGreaterThan(0);
  });

  it('generates a validated plan with citations and a disclaimer', async () => {
    const { cookie } = await signupUser();
    const res = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send(planInput);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.mode).toBe('plan');
    expect(data.plan.days).toHaveLength(7);
    expect(data.plan.days.every((day) => day.meals.length === 3)).toBe(true);
    expect(data.plan.dailyTargets.calories).toBeGreaterThanOrEqual(800);
    expect(data.plan.citations.length).toBeGreaterThan(0);
    expect(data.plan.disclaimer).toMatch(/not medical advice/i);
    expect(Array.isArray(data.plan.warnings)).toBe(true);
    expect(data.meta.provider).toBe('mock');

    for (const citation of data.plan.citations) {
      expect(await RagChunk.findById(citation.chunkId)).toBeTruthy();
    }
  });

  it('generates a single meal for meal mode', async () => {
    const { cookie } = await signupUser();
    const res = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, mode: 'meal', day: 'mon', mealType: 'lunch' });

    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('meal');
    expect(res.body.data.meal.type).toBe('lunch');
    expect(res.body.data.meal.items.length).toBeGreaterThan(0);
    expect(res.body.data.citations.length).toBeGreaterThan(0);
  });

  it('validates the request body', async () => {
    const { cookie } = await signupUser();
    const tooFewMeals = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, mealsPerDay: 2 });
    expect(tooFewMeals.status).toBe(400);

    const missingDay = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, mode: 'meal', mealType: 'lunch' });
    expect(missingDay.status).toBe(400);
    expect(missingDay.body.error.fields.day).toBeTruthy();

    const tooManyAllergies = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, allergies: Array.from({ length: 11 }, (_, i) => `allergy${i}`) });
    expect(tooManyAllergies.status).toBe(400);

    const longNotes = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, notes: 'x'.repeat(301) });
    expect(longNotes.status).toBe(400);

    const unknown = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send({ ...planInput, extra: true });
    expect(unknown.status).toBe(400);

    const anonymous = await api().post('/api/diet/assistant/generate').send(planInput);
    expect(anonymous.status).toBe(401);
  });

  it('retries once and then reports invalid output', async () => {
    let calls = 0;
    const badProvider = {
      name: 'bad',
      embed: async () => [[1, 0, 0]],
      generate: async () => {
        calls += 1;
        return '{"summary": "too short"}';
      }
    };

    await expect(
      runAssistant(
        { profile: {} },
        planInput,
        { provider: badProvider, vectorStore: { search: async () => [] }, topK: 2 }
      )
    ).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT' });
    expect(calls).toBe(2);
  });

  it('accepts a corrected response on the retry', async () => {
    let calls = 0;
    const flaky = {
      name: 'flaky',
      embed: async () => [[1, 0, 0]],
      generate: async ({ user }) => {
        calls += 1;
        if (calls === 1) return 'not json';
        return mockProvider.generate({ user });
      }
    };

    const result = await runAssistant(
      { profile: {} },
      planInput,
      { provider: flaky, vectorStore: { search: async () => [] }, topK: 2 }
    );
    expect(calls).toBe(2);
    expect(result.plan.days).toHaveLength(7);
    expect(result.plan.assumptions.join(' ')).toMatch(/knowledge-base/i);
  });
});
