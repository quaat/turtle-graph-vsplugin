import * as React from 'react';

export interface ToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  predicate: string;
  predicates: string[];
  onPredicate: (value: string) => void;
  onFit: () => void;
  onReset: () => void;
  onRefresh: () => void;
}

export function Toolbar(props: ToolbarProps): React.ReactElement {
  return (
    <div className="toolbar" role="toolbar" aria-label="Graph toolbar">
      <input
        className="toolbar-search"
        type="search"
        placeholder="Search nodes…"
        aria-label="Search nodes"
        value={props.query}
        onChange={(e) => props.onQuery(e.target.value)}
      />
      <select
        className="toolbar-predicate"
        aria-label="Filter by predicate"
        value={props.predicate}
        onChange={(e) => props.onPredicate(e.target.value)}
      >
        <option value="">All predicates</option>
        {props.predicates.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <button type="button" onClick={props.onFit}>
        Fit
      </button>
      <button type="button" onClick={props.onReset}>
        Reset layout
      </button>
      <button type="button" onClick={props.onRefresh}>
        Refresh
      </button>
    </div>
  );
}
