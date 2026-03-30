import type { Message, OllamaSettings, SourceChunk } from './types';

const DEFAULT_SETTINGS: OllamaSettings = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
  temperature: 0.7,
  systemPrompt: `You are a helpful AI assistant with access to a knowledge base. When answering questions:
1. Use the provided context to give accurate, detailed answers.
2. Always cite your sources by referencing the document name and relevant section.
3. If the context doesn't contain enough information, say so honestly.
4. Format your responses clearly with paragraphs and bullet points where appropriate.
5. Be concise but thorough.`,
};

let settings: OllamaSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): OllamaSettings {
  return { ...settings };
}

export function updateSettings(newSettings: Partial<OllamaSettings>): void {
  settings = { ...settings, ...newSettings };
}

export function resetSettings(): void {
  settings = { ...DEFAULT_SETTINGS };
}

/**
 * Build the prompt with RAG context injected.
 */
function buildPrompt(
  userMessage: string,
  sources: SourceChunk[],
  conversationHistory: Message[]
): { messages: Array<{ role: string; content: string }> } {
  const contextBlock =
    sources.length > 0
      ? sources
          .map(
            (s, i) =>
              `[Source ${i + 1}: ${s.documentName} (relevance: ${(s.score * 100).toFixed(0)}%)]\n${s.content}`
          )
          .join('\n\n')
      : 'No relevant documents found in the knowledge base.';

  const systemMessage = `${settings.systemPrompt}\n\n--- KNOWLEDGE BASE CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemMessage },
  ];

  // Include recent conversation history (last 10 messages)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  return { messages };
}

/**
 * Check if Ollama is running and accessible.
 */
export async function checkOllamaStatus(): Promise<{
  running: boolean;
  models: string[];
}> {
  try {
    const response = await fetch(`${settings.baseUrl}/api/tags`);
    if (!response.ok) throw new Error('Not OK');
    const data = await response.json();
    const models = (data.models || []).map(
      (m: { name: string }) => m.name
    );
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  }
}

/**
 * Stream a chat completion from Ollama.
 */
export async function streamChat(
  userMessage: string,
  sources: SourceChunk[],
  conversationHistory: Message[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const { messages } = buildPrompt(userMessage, sources, conversationHistory);

  try {
    const response = await fetch(`${settings.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        messages,
        stream: true,
        options: {
          temperature: settings.temperature,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      onError(`Ollama error (${response.status}): ${errText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response body from Ollama');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            onToken(data.message.content);
          }
          if (data.done) {
            onDone();
            return;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    onDone();
  } catch (err) {
    onError(
      `Failed to connect to Ollama at ${settings.baseUrl}. Make sure Ollama is running.\n\nError: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Generate a simple response without streaming (for fallback/demo mode).
 */
export function generateDemoResponse(
  userMessage: string,
  sources: SourceChunk[]
): string {
  if (sources.length === 0) {
    return `I don't have any relevant documents in the knowledge base to answer your question about "${userMessage}". Please upload some documents first using the upload panel on the left, then ask me again.`;
  }

  const topSource = sources[0];
  const otherSources = sources.slice(1);

  let response = `Based on the documents in the knowledge base, here's what I found:\n\n`;
  response += `**From ${topSource.documentName}** (${(topSource.score * 100).toFixed(0)}% relevance):\n\n`;
  response += `> ${topSource.content.slice(0, 300)}${topSource.content.length > 300 ? '...' : ''}\n\n`;

  if (otherSources.length > 0) {
    response += `**Additional relevant sources:**\n`;
    for (const src of otherSources) {
      response += `- *${src.documentName}* (${(src.score * 100).toFixed(0)}% match): "${src.content.slice(0, 100)}..."\n`;
    }
    response += '\n';
  }

  response += `---\n*This is a demo response. Connect to Ollama for AI-generated answers that synthesize information from your documents.*`;

  return response;
}
