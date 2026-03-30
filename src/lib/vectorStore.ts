import type { Document, SourceChunk } from './types';

/**
 * A lightweight in-memory vector store using TF-IDF and cosine similarity.
 * No external dependencies required — pure TypeScript implementation.
 */

interface IndexedChunk {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  tfidf: Map<string, number>;
}

// Global vocabulary for IDF computation
const documentFrequency: Map<string, number> = new Map();
let totalDocuments = 0;
const indexedChunks: IndexedChunk[] = [];

/**
 * Tokenize and normalize text for TF-IDF computation.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word));
}

/**
 * Compute term frequency for a list of tokens.
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by document length
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/**
 * Compute TF-IDF vector for a chunk.
 */
function computeTFIDF(tf: Map<string, number>): Map<string, number> {
  const tfidf = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    const df = documentFrequency.get(term) || 1;
    const idf = Math.log(totalDocuments / df);
    tfidf.set(term, tfVal * idf);
  }
  return tfidf;
}

/**
 * Compute cosine similarity between two TF-IDF vectors.
 */
function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, valA] of a) {
    const valB = b.get(term) || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
  }

  for (const [, valB] of b) {
    normB += valB * valB;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Index a document into the vector store.
 */
export function indexDocument(doc: Document): void {
  for (let i = 0; i < doc.chunks.length; i++) {
    const tokens = tokenize(doc.chunks[i]);
    const tf = computeTF(tokens);

    // Update document frequency
    const seenTerms = new Set(tokens);
    for (const term of seenTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
    totalDocuments++;

    indexedChunks.push({
      documentId: doc.id,
      documentName: doc.name,
      chunkIndex: i,
      content: doc.chunks[i],
      tfidf: computeTFIDF(tf),
    });
  }

  // Recompute TF-IDF for all chunks with updated IDF values
  for (const chunk of indexedChunks) {
    const tokens = tokenize(chunk.content);
    const tf = computeTF(tokens);
    chunk.tfidf = computeTFIDF(tf);
  }
}

/**
 * Remove a document from the index.
 */
export function removeDocument(docId: string): void {
  const toRemove = indexedChunks.filter((c) => c.documentId === docId);
  for (const chunk of toRemove) {
    const tokens = tokenize(chunk.content);
    const seenTerms = new Set(tokens);
    for (const term of seenTerms) {
      const current = documentFrequency.get(term) || 0;
      if (current <= 1) {
        documentFrequency.delete(term);
      } else {
        documentFrequency.set(term, current - 1);
      }
    }
    totalDocuments--;
  }

  const removeIds = new Set(toRemove.map((_, i) => indexedChunks.indexOf(toRemove[i])));
  for (let i = indexedChunks.length - 1; i >= 0; i--) {
    if (removeIds.has(i)) {
      indexedChunks.splice(i, 1);
    }
  }
}

/**
 * Search the vector store for the most relevant chunks.
 */
export function search(query: string, topK: number = 3): SourceChunk[] {
  if (indexedChunks.length === 0) return [];

  const tokens = tokenize(query);
  const tf = computeTF(tokens);
  const queryTfidf = computeTFIDF(tf);

  const scored = indexedChunks.map((chunk) => ({
    documentName: chunk.documentName,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    score: cosineSimilarity(queryTfidf, chunk.tfidf),
  }));

  // Sort by score descending and return top K
  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, topK)
    .filter((s) => s.score > 0.01)
    .map((s) => ({
      documentName: s.documentName,
      content: s.content,
      score: Math.round(s.score * 1000) / 1000,
      chunkIndex: s.chunkIndex,
    }));
}

/**
 * Get the total number of indexed chunks.
 */
export function getChunkCount(): number {
  return indexedChunks.length;
}

/**
 * Clear all indexed data.
 */
export function clearIndex(): void {
  indexedChunks.length = 0;
  documentFrequency.clear();
  totalDocuments = 0;
}

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'was', 'are', 'has', 'had', 'been', 'did',
  'were', 'is', 'am', 'does', 'doing', 'done', 'being', 'having',
]);
