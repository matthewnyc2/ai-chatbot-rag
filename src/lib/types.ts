export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceChunk[];
  timestamp: number;
  isStreaming?: boolean;
}

export interface SourceChunk {
  documentName: string;
  content: string;
  score: number;
  chunkIndex: number;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  chunks: string[];
  uploadedAt: number;
}

export interface OllamaSettings {
  baseUrl: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
