import React, { useState } from 'react';
import type { Message, SourceChunk } from '../lib/types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const isUser = message.role === 'user';
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      <div className={`message-avatar ${isUser ? 'avatar-user' : 'avatar-assistant'}`}>
        {isUser ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2V6a4 4 0 0 1 4-4z" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <line x1="12" y1="14" x2="12" y2="18" />
          </svg>
        )}
      </div>
      <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        <div className="message-content">
          {message.isStreaming && message.content === '' ? (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          ) : (
            <FormattedText text={message.content} />
          )}
        </div>
        {hasSources && (
          <div className="source-chips">
            {message.sources!.map((source, i) => (
              <SourceChip
                key={i}
                source={source}
                index={i + 1}
                isExpanded={expandedSource === i}
                onClick={() => setExpandedSource(expandedSource === i ? null : i)}
              />
            ))}
          </div>
        )}
        {expandedSource !== null && hasSources && (
          <SourceDetail source={message.sources![expandedSource]} index={expandedSource + 1} />
        )}
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

function SourceChip({
  source,
  index,
  isExpanded,
  onClick,
}: {
  source: SourceChunk;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <span
      className="source-chip"
      onClick={onClick}
      style={{ cursor: 'pointer', opacity: isExpanded ? 1 : 0.85 }}
      title={`Click to ${isExpanded ? 'collapse' : 'expand'} source`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {source.documentName}
      <span className="source-chip-score">{(source.score * 100).toFixed(0)}%</span>
    </span>
  );
}

function SourceDetail({ source, index }: { source: SourceChunk; index: number }) {
  const relevanceColor =
    source.score > 0.5 ? '#22c55e' : source.score > 0.2 ? '#eab308' : '#94a3b8';

  return (
    <div className="source-detail">
      <div className="source-detail-header">
        <span className="source-detail-badge">Source {index}</span>
        <span className="source-detail-name">{source.documentName}</span>
        <span className="source-detail-relevance" style={{ color: relevanceColor }}>
          {(source.score * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="source-detail-content">
        {source.content.length > 200
          ? source.content.slice(0, 200) + '...'
          : source.content}
      </div>
    </div>
  );
}

/**
 * Render markdown-like formatted text (bold, italic, code, lists).
 */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h3 key={i}>{formatInline(line.slice(2))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h4 key={i}>{formatInline(line.slice(3))}</h4>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="md-list-item">
          <span className="md-bullet">&bull;</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="md-blockquote">
          {formatInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="md-hr" />);
    } else if (line.startsWith('```')) {
      // Collect code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="md-code-block">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="md-spacer" />);
    } else {
      elements.push(<p key={i} className="md-paragraph">{formatInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Process bold, italic, inline code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);

    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch } : null,
      italicMatch ? { type: 'italic', match: italicMatch } : null,
      codeMatch ? { type: 'code', match: codeMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.match.index! - b!.match.index!);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const beforeIdx = first.match.index!;

    if (beforeIdx > 0) {
      parts.push(remaining.slice(0, beforeIdx));
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++}>{first.match[1]}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={key++}>{first.match[1]}</em>);
    } else if (first.type === 'code') {
      parts.push(<code key={key++} className="md-inline-code">{first.match[1]}</code>);
    }

    remaining = remaining.slice(beforeIdx + first.match[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
