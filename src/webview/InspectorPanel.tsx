import * as React from 'react';
import type { GraphModel } from '../rdf/types';
import type { Selection } from './state';
import { edgeDetails, findNode, neighborCounts } from './selection';
import type { VsCodeApi } from './vscodeApi';

export interface InspectorPanelProps {
  model: GraphModel;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  api?: VsCodeApi;
}

function CopyButton({ api, text, label }: { api?: VsCodeApi; text: string; label: string }) {
  return (
    <button type="button" className="copy-btn" onClick={() => api?.postMessage({ type: 'copy', text })}>
      {label}
    </button>
  );
}

export function InspectorPanel(props: InspectorPanelProps): React.ReactElement {
  const { model, selection, api } = props;

  if (!selection) {
    return (
      <aside className="inspector" aria-label="Inspector">
        <p className="inspector-hint">Select a node or edge to inspect it.</p>
      </aside>
    );
  }

  if (selection.kind === 'node') {
    const node = findNode(model, selection.id);
    if (!node) {
      return (
        <aside className="inspector" aria-label="Inspector">
          <p className="inspector-hint">Selection not found.</p>
        </aside>
      );
    }
    const counts = neighborCounts(node);
    const fullId = node.iri ?? node.blankNodeId ?? node.id;
    return (
      <aside className="inspector" aria-label="Inspector">
        <h2 className="inspector-title">{node.label}</h2>
        <div className="inspector-row">
          <span className="inspector-key">Compact</span>
          <code>{node.compactId}</code>
        </div>
        <div className="inspector-row">
          <span className="inspector-key">{node.kind === 'blankNode' ? 'Blank node' : 'IRI'}</span>
          <code className="inspector-iri">{fullId}</code>
        </div>
        {node.types.length > 0 && (
          <div className="inspector-row">
            <span className="inspector-key">Types</span>
            <span>
              {node.types.map((t) => (
                <span key={t} className="badge">
                  {t}
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="inspector-row">
          <span className="inspector-key">Edges</span>
          <span>
            {counts.incoming} in · {counts.outgoing} out
          </span>
        </div>
        {node.properties.length > 0 && (
          <div className="inspector-section">
            <h3>Properties</h3>
            <ul className="property-list">
              {node.properties.map((prop) => (
                <li key={prop.id}>
                  <span className="property-predicate">{prop.predicateLabel}</span>
                  <span className="property-value">{prop.value}</span>
                  {prop.datatypeLabel && <span className="property-meta">^^{prop.datatypeLabel}</span>}
                  {prop.language && <span className="property-meta">@{prop.language}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="inspector-actions">
          {node.iri && <CopyButton api={api} text={node.iri} label="Copy IRI" />}
          <CopyButton api={api} text={node.compactId} label="Copy compact" />
          <button
            type="button"
            onClick={() => api?.postMessage({ type: 'reveal', target: { kind: 'node', subject: node.id } })}
          >
            Reveal in Turtle
          </button>
        </div>
      </aside>
    );
  }

  const details = edgeDetails(model, selection.id);
  if (!details) {
    return (
      <aside className="inspector" aria-label="Inspector">
        <p className="inspector-hint">Selection not found.</p>
      </aside>
    );
  }
  const { edge, source, target } = details;
  const sourceFull = source?.iri ?? source?.blankNodeId ?? edge.source;
  const targetFull = target?.iri ?? target?.blankNodeId ?? edge.target;
  return (
    <aside className="inspector" aria-label="Inspector">
      <h2 className="inspector-title">{edge.label}</h2>
      <div className="inspector-row">
        <span className="inspector-key">Subject</span>
        <button
          type="button"
          className="link"
          onClick={() => props.onSelect({ kind: 'node', id: edge.source })}
        >
          {source?.compactId ?? edge.source}
        </button>
      </div>
      <div className="inspector-row">
        <span className="inspector-key">Subject IRI</span>
        <code className="inspector-iri">{sourceFull}</code>
      </div>
      <div className="inspector-row">
        <span className="inspector-key">Predicate</span>
        <code>{edge.label}</code>
      </div>
      <div className="inspector-row">
        <span className="inspector-key">Predicate IRI</span>
        <code className="inspector-iri">{edge.predicate}</code>
      </div>
      <div className="inspector-row">
        <span className="inspector-key">Object</span>
        <button
          type="button"
          className="link"
          onClick={() => props.onSelect({ kind: 'node', id: edge.target })}
        >
          {target?.compactId ?? edge.target}
        </button>
      </div>
      <div className="inspector-row">
        <span className="inspector-key">Object IRI</span>
        <code className="inspector-iri">{targetFull}</code>
      </div>
      {edge.graph && (
        <div className="inspector-row">
          <span className="inspector-key">Graph</span>
          <code>{edge.graph}</code>
        </div>
      )}
      <div className="inspector-actions">
        {source?.iri && <CopyButton api={api} text={source.iri} label="Copy subject IRI" />}
        <CopyButton api={api} text={edge.predicate} label="Copy predicate IRI" />
        {target?.iri && <CopyButton api={api} text={target.iri} label="Copy object IRI" />}
        <button
          type="button"
          onClick={() =>
            api?.postMessage({
              type: 'reveal',
              target: {
                kind: 'edge',
                subject: edge.source,
                predicate: edge.predicate,
                object: edge.target,
              },
            })
          }
        >
          Reveal in Turtle
        </button>
      </div>
    </aside>
  );
}
