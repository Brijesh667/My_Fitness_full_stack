import { RagChunk } from '../models/RagChunk.js';

function cosine(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * MongoDB-backed vector store for a few thousand chunks. Swapping in Atlas
 * Vector Search only requires replacing this object's methods.
 */
export const vectorStore = {
  async upsert(chunks) {
    if (!chunks.length) return 0;
    const inserted = await RagChunk.insertMany(chunks);
    return inserted.length;
  },

  async removeBySource(sourceName) {
    const result = await RagChunk.deleteMany({ sourceName });
    return result.deletedCount ?? 0;
  },

  async search(embedding, topK = 6) {
    const chunks = await RagChunk.find({}).limit(5000).lean();
    return chunks
      .map((chunk) => ({ ...chunk, score: cosine(embedding, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  async count() {
    return RagChunk.countDocuments({});
  }
};
