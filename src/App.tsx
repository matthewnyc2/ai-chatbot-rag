import { useState, useCallback, useRef } from 'react';
import type { Message, Document, Conversation } from './lib/types';
import { parseFile } from './lib/documentParser';
import { indexDocument, removeDocument } from './lib/vectorStore';
import { getSettings } from './lib/ollama';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessingDocs, setIsProcessingDocs] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Start in live mode if a saved API key already exists, otherwise demo mode
  const [demoMode, setDemoMode] = useState(() => !getSettings().apiKey);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use a ref to track the active conversation ID for use inside callbacks
  const activeConvIdRef = useRef(activeConvId);
  activeConvIdRef.current = activeConvId;

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const messages = activeConversation?.messages || [];

  const createNewConversation = useCallback((): string => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    activeConvIdRef.current = conv.id;
    setSidebarOpen(false);
    return conv.id;
  }, []);

  const ensureConversation = useCallback((): string => {
    if (activeConvIdRef.current) return activeConvIdRef.current;
    return createNewConversation();
  }, [createNewConversation]);

  const handleSendMessage = useCallback(
    (message: Message) => {
      const convId = ensureConversation();

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updatedMessages = [...c.messages, message];
          const title =
            c.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
              : c.title;
          return { ...c, messages: updatedMessages, title };
        })
      );
    },
    [ensureConversation]
  );

  const handleUpdateMessage = useCallback(
    (id: string, updates: Partial<Message>) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }))
      );
    },
    []
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvIdRef.current === id) {
        setActiveConvId(null);
        activeConvIdRef.current = null;
      }
    },
    []
  );

  const handleUpload = useCallback(async (files: FileList) => {
    setIsProcessingDocs(true);
    try {
      const newDocs: Document[] = [];
      for (let i = 0; i < files.length; i++) {
        const doc = await parseFile(files[i]);
        indexDocument(doc);
        newDocs.push(doc);
      }
      setDocuments((prev) => [...prev, ...newDocs]);
    } catch (err) {
      console.error('Failed to process documents:', err);
    } finally {
      setIsProcessingDocs(false);
    }
  }, []);

  const handleRemoveDocument = useCallback((docId: string) => {
    removeDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  return (
    <div className="app">
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => {
            setActiveConvId(id);
            activeConvIdRef.current = id;
            setSidebarOpen(false);
          }}
          onNew={() => {
            createNewConversation();
            setSidebarOpen(false);
          }}
          onDelete={handleDeleteConversation}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        onUpdateMessage={handleUpdateMessage}
        documents={documents}
        onUpload={handleUpload}
        onRemoveDocument={handleRemoveDocument}
        isProcessingDocs={isProcessingDocs}
        demoMode={demoMode}
      />

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        demoMode={demoMode}
        onDemoModeChange={setDemoMode}
      />
    </div>
  );
}

export default App;
