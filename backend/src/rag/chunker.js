const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP = 80;

export function countTokens(text) {
  return (text.match(/\S+/g) ?? []).length;
}

/**
 * Split text into overlapping word windows. Word count is a deliberate rough
 * token estimate; the ingestion script does not need a tokenizer dependency.
 */
export function chunkText(
  text,
  { maxTokens = DEFAULT_MAX_TOKENS, overlap = DEFAULT_OVERLAP } = {}
) {
  const words = (text ?? '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const step = Math.max(1, maxTokens - overlap);
  const chunks = [];

  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + maxTokens);
    if (slice.length === 0) break;
    chunks.push(slice.join(' '));
    if (start + maxTokens >= words.length) break;
  }

  return chunks;
}
