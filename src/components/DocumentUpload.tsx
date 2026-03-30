import React, { useCallback, useRef } from 'react';
import type { Document } from '../lib/types';

interface Props {
  documents: Document[];
  onUpload: (files: FileList) => void;
  onRemove: (docId: string) => void;
  isProcessing: boolean;
}

export function DocumentUpload({ documents, onUpload, onRemove, isProcessing }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="document-upload-section">
      <div className="section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>Knowledge Base</span>
        <span className="doc-count">{documents.length}</span>
      </div>

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="drop-zone-processing">
            <div className="spinner" />
            <span>Processing...</span>
          </div>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="upload-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="drop-zone-text">Drop files here</span>
            <span className="drop-zone-subtext">PDF, TXT, MD, CSV, JSON</span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.html,.xml"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      <div className="document-list">
        {documents.length === 0 ? (
          <div className="empty-docs">
            <p>No documents uploaded yet.</p>
            <p className="empty-docs-hint">Upload documents to build your knowledge base for RAG-powered answers.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="doc-icon">
                {getFileIcon(doc.name)}
              </div>
              <div className="doc-info">
                <span className="doc-name" title={doc.name}>
                  {doc.name}
                </span>
                <span className="doc-meta">
                  {doc.chunks.length} chunks &middot;{' '}
                  {formatSize(doc.content.length)}
                </span>
              </div>
              <button
                className="doc-remove-btn"
                onClick={() => onRemove(doc.id)}
                title="Remove document"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getFileIcon(name: string): React.JSX.Element {
  const ext = name.split('.').pop()?.toLowerCase();
  const color = ext === 'pdf' ? '#ef4444' : ext === 'md' ? '#3b82f6' : ext === 'json' ? '#eab308' : '#94a3b8';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  if (chars < 100000) return `${(chars / 1000).toFixed(1)}K chars`;
  return `${(chars / 1000000).toFixed(1)}M chars`;
}
