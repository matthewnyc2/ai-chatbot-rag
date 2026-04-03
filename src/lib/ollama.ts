/**
 * OpenRouter API integration for the RAG chatbot.
 * Compatible with OpenAI streaming format.
 * https://openrouter.ai/docs
 */
import type { Message, OpenRouterSettings, SourceChunk } from './types';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const SETTINGS_KEY = 'rag-chatbot-settings';

export const OPENROUTER_MODELS = [
  { label: 'Claude 3.5 Sonnet (Anthropic)',  value: 'anthropic/claude-3.5-sonnet' },
  { label: 'Claude 3 Haiku (Anthropic)',      value: 'anthropic/claude-3-haiku' },
  { label: 'GPT-4o (OpenAI)',                 value: 'openai/gpt-4o' },
  { label: 'GPT-4o Mini (OpenAI)',            value: 'openai/gpt-4o-mini' },
  { label: 'Gemini Flash 1.5 (Google)',       value: 'google/gemini-flash-1.5' },
  { label: 'Llama 3.1 8B — FREE',            value: 'meta-llama/llama-3.1-8b-instruct:free' },
  { label: 'Mistral 7B — FREE',              value: 'mistralai/mistral-7b-instruct:free' },
  { label: 'Qwen 3.6 Plus — FREE',           value: 'qwen/qwen3.6-plus:free' },
  { label: 'Step 3.5 Flash — FREE',          value: 'stepfun/step-3.5-flash:free' },
];

const DEFAULT_SETTINGS: OpenRouterSettings = {
  apiKey: '',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  systemPrompt: `You are a helpful AI assistant with access to a knowledge base. When answering questions:
1. Use the provided context to give accurate, detailed answers.
2. Always cite your sources by referencing the document name and relevant section.
3. If the context doesn't contain enough information, say so honestly.
4. Format your responses clearly with paragraphs and bullet points where appropriate.
5. Be concise but thorough.`,
};

// ── Persistence in localStorage ───────────────────────────────────────────────

function loadSettings(): OpenRouterSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

let settings: OpenRouterSettings = loadSettings();

export function getSettings(): OpenRouterSettings {
  return { ...settings };
}

export function updateSettings(newSettings: Partial<OpenRouterSettings>): void {
  settings = { ...settings, ...newSettings };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function resetSettings(): void {
  settings = { ...DEFAULT_SETTINGS };
  try { localStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildMessages(
  userMessage: string,
  sources: SourceChunk[],
  conversationHistory: Message[]
): Array<{ role: string; content: string }> {
  const contextBlock =
    sources.length > 0
      ? sources
          .map(
            (s, i) =>
              `[Source ${i + 1}: ${s.documentName} (relevance: ${(s.score * 100).toFixed(0)}%)]\n${s.content}`
          )
          .join('\n\n')
      : 'No relevant documents found in the knowledge base.';

  const systemContent = `${settings.systemPrompt}\n\n--- KNOWLEDGE BASE CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemContent },
  ];

  for (const msg of conversationHistory.slice(-10)) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

// ── API status check ──────────────────────────────────────────────────────────

/**
 * Verify the API key is set and valid by hitting /auth/key on OpenRouter.
 * Returns { valid: true, label: 'Usage: ...' } or { valid: false, error: '...' }
 */
export async function checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
  if (!settings.apiKey) {
    return { running: false, models: [] };
  }
  try {
    const resp = await fetch(`${OPENROUTER_BASE}/auth/key`, {
      headers: { Authorization: `Bearer ${settings.apiKey}` },
    });
    if (resp.ok) {
      return { running: true, models: OPENROUTER_MODELS.map((m) => m.value) };
    }
    return { running: false, models: [] };
  } catch {
    return { running: false, models: [] };
  }
}

// ── Streaming chat ────────────────────────────────────────────────────────────

/**
 * Stream a chat completion from OpenRouter using SSE.
 * OpenRouter is OpenAI-compatible: `data: {"choices":[{"delta":{"content":"..."}}]}`
 */
export async function streamChat(
  userMessage: string,
  sources: SourceChunk[],
  conversationHistory: Message[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  if (!settings.apiKey) {
    onError(
      'No OpenRouter API key set.\n\nOpen **Settings** and paste your key from https://openrouter.ai/keys'
    );
    return;
  }

  const messages = buildMessages(userMessage, sources, conversationHistory);

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RAG Chatbot',
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        stream: true,
        temperature: settings.temperature,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.error?.message ?? errText;
      } catch { /* ignore */ }
      onError(`OpenRouter error (${response.status}): ${detail}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response body from OpenRouter');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6); // strip "data: "
        if (payload === '[DONE]') {
          onDone();
          return;
        }

        try {
          const chunk = JSON.parse(payload);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) onToken(content);
          if (chunk.choices?.[0]?.finish_reason === 'stop') {
            onDone();
            return;
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }

    onDone();
  } catch (err) {
    onError(
      `Failed to reach OpenRouter: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ── Demo fallback (no API key) ────────────────────────────────────────────────

export function generateDemoResponse(userMessage: string, sources: SourceChunk[]): string {
  if (sources.length === 0) {
    return `I don't have any relevant documents to answer about "${userMessage}". Upload documents first, then ask me again.`;
  }

  const top = sources[0];
  const rest = sources.slice(1);

  let response = `Based on the documents in the knowledge base:\n\n`;
  response += `**From ${top.documentName}** (${(top.score * 100).toFixed(0)}% relevance):\n\n`;
  response += `> ${top.content.slice(0, 300)}${top.content.length > 300 ? '...' : ''}\n\n`;

  if (rest.length > 0) {
    response += `**Additional sources:**\n`;
    for (const src of rest) {
      response += `- *${src.documentName}* (${(src.score * 100).toFixed(0)}% match): "${src.content.slice(0, 100)}..."\n`;
    }
    response += '\n';
  }

  response += `---\n*Add your OpenRouter API key in **Settings** to get real AI answers.*`;
  return response;
}
