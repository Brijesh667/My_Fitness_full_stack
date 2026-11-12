import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLlmProvider } from '../llm/index.js';
import { countTokens, chunkText } from './chunker.js';
import { vectorStore } from './vectorStore.js';
import { logger } from '../utils/logger.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DOCUMENTS_DIR = path.join(HERE, 'documents');

const SUPPORTED = new Set(['.md', '.txt']);

export async function ingestDocuments({ dir = DOCUMENTS_DIR, provider = getLlmProvider() } = {}) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && SUPPORTED.has(path.extname(entry.name).toLowerCase()))
    .filter((entry) => entry.name.toLowerCase() !== 'readme.md')
    .map((entry) => entry.name)
    .sort();

  const sources = [];
  let total = 0;

  for (const filename of files) {
    const fullPath = path.join(dir, filename);
    const text = await fs.readFile(fullPath, 'utf8');
    await vectorStore.removeBySource(filename);

    const pieces = chunkText(text, { maxTokens: 500, overlap: 80 });
    if (pieces.length === 0) {
      sources.push({ sourceName: filename, chunks: 0 });
      continue;
    }

    const embeddings = await provider.embed(pieces);
    await vectorStore.upsert(
      pieces.map((piece, index) => ({
        sourceName: filename,
        sourceDoc: path.relative(dir, fullPath),
        text: piece,
        embedding: embeddings[index] ?? [],
        tokenCount: countTokens(piece)
      }))
    );

    total += pieces.length;
    sources.push({ sourceName: filename, chunks: pieces.length });
  }

  logger.info({ sources, total }, 'rag documents ingested');
  return { total, sources };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const { connectDatabase, disconnectDatabase } = await import('../config/db.js');
  try {
    await connectDatabase();
    await ingestDocuments();
  } catch (error) {
    logger.error({ err: error }, 'rag ingestion failed');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}
