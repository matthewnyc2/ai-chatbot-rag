import { useState, useRef, useEffect } from 'react';
import type { Message, Document } from '../lib/types';
import { MessageBubble } from './MessageBubble';
import { DocumentUpload } from './DocumentUpload';
import { search, getChunkCount } from '../lib/vectorStore';
import { streamChat, generateDemoResponse, getSettings } from '../lib/ollama';

interface Props {
  messages: Message[];
  onSendMessage: (message: Message) => void;
  onUpdateMessage: (id: string, updates: Partial<Message>) => void;
  documents: Document[];
  onUpload: (files: FileList) => void;
  onRemoveDocument: (docId: string) => void;
  isProcessingDocs: boolean;
  demoMode: boolean;
}

export function ChatWindow({
  messages,
  onSendMessage,
  onUpdateMessage,
  documents,
  onUpload,
  onRemoveDocument,
  isProcessingDocs,
  demoMode,
}: Props) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Create user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    onSendMessage(userMsg);

    // Search the vector store for relevant chunks
    const sources = search(trimmed, 3);

    // Create placeholder assistant message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      sources: sources.length > 0 ? sources : undefined,
      timestamp: Date.now(),
      isStreaming: true,
    };
    onSendMessage(assistantMsg);
    setIsGenerating(true);

    if (demoMode) {
      // Simulate typing in demo mode
      const fullResponse = generateDemoResponse(trimmed, sources);
      let current = '';
      for (let i = 0; i < fullResponse.length; i += 3) {
        current = fullResponse.slice(0, i + 3);
        onUpdateMessage(assistantMsg.id, { content: current, isStreaming: true });
        await new Promise((r) => setTimeout(r, 10));
      }
      onUpdateMessage(assistantMsg.id, {
        content: fullResponse,
        isStreaming: false,
      });
      setIsGenerating(false);
    } else {
      // Stream from Ollama
      let accumulated = '';
      await streamChat(
        trimmed,
        sources,
        messages,
        (token) => {
          accumulated += token;
          onUpdateMessage(assistantMsg.id, {
            content: accumulated,
            isStreaming: true,
          });
        },
        () => {
          onUpdateMessage(assistantMsg.id, { isStreaming: false });
          setIsGenerating(false);
        },
        (error) => {
          onUpdateMessage(assistantMsg.id, {
            content: `**Error:** ${error}\n\n*Tip: Switch to Demo Mode in Settings to test without Ollama.*`,
            isStreaming: false,
          });
          setIsGenerating(false);
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const chunkCount = getChunkCount();
  const currentSettings = getSettings();
  const currentModel = currentSettings.model.split('/').pop() ?? currentSettings.model; // show short name
  const hasKey = !!currentSettings.apiKey;

  return (
    <div className="chat-window">
      {/* Mobile doc toggle */}
      <button
        className="mobile-doc-toggle"
        onClick={() => setShowDocs(!showDocs)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Docs ({documents.length})
      </button>

      {/* Document panel (collapsible on mobile) */}
      <div className={`doc-panel ${showDocs ? 'doc-panel-open' : ''}`}>
        <DocumentUpload
          documents={documents}
          onUpload={onUpload}
          onRemove={onRemoveDocument}
          isProcessing={isProcessingDocs}
        />
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {/* Model selector bar */}
        <div className="model-selector-bar">
          <div className="model-selector-pill">
            {demoMode ? (
              <>
                <span className="demo-dot" />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <span className="live-dot" />
                <span>{currentModel}{!hasKey ? ' (no key)' : ''}</span>
              </>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2V6a4 4 0 0 1 4-4z" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <line x1="12" y1="14" x2="12" y2="18" />
                </svg>
              </div>
              <h2>AI-Powered RAG Chatbot</h2>
              <p>Upload documents to build your knowledge base, then ask questions to get answers with source citations.</p>
              <div className="empty-chat-features">
                <div className="feature-card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload PDFs, text, or markdown</span>
                </div>
                <div className="feature-card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Semantic search across your docs</span>
                </div>
                <div className="feature-card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>Answers cite their sources</span>
                </div>
                <div className="feature-card">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span>Runs locally via Ollama ($0 cost)</span>
                </div>
              </div>
              {demoMode && (
                <div className="demo-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Demo Mode Active
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <div className="input-status">
            {chunkCount > 0 && (
              <span className="chunk-status">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {chunkCount} chunks indexed
              </span>
            )}
            {demoMode && (
              <span className="demo-indicator">DEMO</span>
            )}
          </div>
          <div className="input-row">
            {/* Attach button */}
            <button
              className="attach-btn"
              onClick={() => attachInputRef.current?.click()}
              title="Attach documents"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={attachInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.csv,.json,.html,.xml"
              onChange={(e) => e.target.files && onUpload(e.target.files)}
              style={{ display: 'none' }}
            />
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                documents.length === 0
                  ? 'Upload documents first, then ask questions...'
                  : 'Ask a question about your documents...'
              }
              rows={1}
              disabled={isGenerating}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              title="Send message"
            >
              {isGenerating ? (
                <div className="spinner spinner-sm" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
