import { env } from '../config/env.js';
import { geminiProvider } from './gemini.js';
import { mockProvider } from './mock.js';
import { openaiProvider } from './openai.js';

const providers = {
  gemini: geminiProvider,
  openai: openaiProvider,
  mock: mockProvider
};

export function getLlmProvider() {
  if (env.RAG_MOCK || env.LLM_PROVIDER === 'mock') return mockProvider;
  return providers[env.LLM_PROVIDER] ?? mockProvider;
}
