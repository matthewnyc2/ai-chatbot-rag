import type { Document } from './types';

/**
 * Split text into overlapping chunks for better retrieval.
 * Uses a sliding window approach with configurable size and overlap.
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep the overlap from the end of the current chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Parse a text file into a Document object.
 */
export async function parseTextFile(file: File): Promise<Document> {
  const content = await file.text();
  const chunks = chunkText(content);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    content,
    chunks,
    uploadedAt: Date.now(),
  };
}

/**
 * Parse a PDF file by extracting text content.
 * Uses a lightweight approach that reads PDF text layers.
 */
export async function parsePdfFile(file: File): Promise<Document> {
  const buffer = await file.arrayBuffer();
  const text = extractTextFromPdf(new Uint8Array(buffer));
  const chunks = chunkText(text);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    content: text,
    chunks,
    uploadedAt: Date.now(),
  };
}

/**
 * Basic PDF text extraction.
 * Handles common PDF text encodings by parsing the raw PDF stream.
 */
function extractTextFromPdf(data: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(data);
  const textBlocks: string[] = [];

  // Extract text between BT (Begin Text) and ET (End Text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textBlocks.push(tjMatch[1]);
    }

    // Extract text from TJ arrays
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const items = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(items)) !== null) {
        textBlocks.push(strMatch[1]);
      }
    }
  }

  const extracted = textBlocks.join(' ').replace(/\s+/g, ' ').trim();

  if (extracted.length < 50) {
    return 'PDF text extraction produced limited results. For best results, use text (.txt) or markdown (.md) files. The PDF may contain scanned images rather than selectable text.';
  }

  return extracted;
}

/**
 * Parse any supported file type.
 */
export async function parseFile(file: File): Promise<Document> {
  const ext = file.name.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return parsePdfFile(file);
    case 'md':
    case 'txt':
    case 'csv':
    case 'json':
    case 'html':
    case 'xml':
      return parseTextFile(file);
    default:
      return parseTextFile(file);
  }
}
