import type { SourceChunk } from '../lib/types';

interface Props {
  source: SourceChunk;
  index: number;
}

export function SourceCitation({ source, index }: Props) {
  const relevanceColor =
    source.score > 0.5 ? '#22c55e' : source.score > 0.2 ? '#eab308' : '#94a3b8';

  return (
    <div className="source-citation">
      <div className="source-header">
        <span className="source-badge">Source {index}</span>
        <span className="source-doc-name">{source.documentName}</span>
        <span className="source-relevance" style={{ color: relevanceColor }}>
          {(source.score * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="source-content">
        {source.content.length > 200
          ? source.content.slice(0, 200) + '...'
          : source.content}
      </div>
    </div>
  );
}
