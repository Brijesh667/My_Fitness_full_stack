import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';
import { parseJsonText } from './parse.js';

const BASE_URL = 'https://api.openai.com/v1';

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
        Authorization: `Bearer ${env.LLM_API_KEY}`
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
        ? 'OpenAI took too long to respond. Please try again.'
        : 'OpenAI could not be reached. Please try again.'
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(502, 'AI_PROVIDER_ERROR', `OpenAI request failed (${response.status})`, {
      provider: detail.slice(0, 300)
    });
  }

  return response.json();
}

export const openaiProvider = {
  name: 'openai',

  async embed(texts) {
    const data = await request('embeddings', {
      model: env.EMBEDDING_MODEL,
      input: texts
    });
    return (data.data ?? [])
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.embedding ?? []);
  },

  async generate({ system, user }) {
    const data = await request('chat/completions', {
      model: env.LLM_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });

    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonText(text);
    if (!parsed) {
      throw new AppError(502, 'AI_PROVIDER_ERROR', 'OpenAI returned a response that was not JSON');
    }
    return parsed;
  }
};
