import * as React from 'react';

export interface ToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  predicate: string;
  predicates: string[];
  onPredicate: (value: string) => void;
  onFit: () => void;
  onReset: () => void;
  showLiterals: boolean;
  onShowLiterals: (value: boolean) => void;
  onExportJson: () => void;
  onExportPng: () => void;
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
      <label className="toolbar-check"><input type="checkbox" checked={props.showLiterals} onChange={(e) => props.onShowLiterals(e.target.checked)} /> Show literal properties</label>
      <button type="button" title="Export current graph as JSON" onClick={props.onExportJson}>Export JSON</button>
      <button type="button" title="Export current graph canvas as PNG" onClick={props.onExportPng}>Export PNG</button>
      <button type="button" title="Fit graph to view" onClick={props.onFit}>
        Fit
      </button>
      <button type="button" title="Reset graph layout" onClick={props.onReset}>
        Reset layout
      </button>
      <button type="button" title="Refresh graph from source" onClick={props.onRefresh}>
        Refresh
      </button>
    </div>
  );
}
