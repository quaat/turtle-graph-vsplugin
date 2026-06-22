import * as React from 'react';
import { reducer, initialState } from './state';
import { computeVisible, listPredicates } from './filtering';
import { Toolbar } from './Toolbar';
import { GraphCanvas, type GraphActions } from './GraphCanvas';
import { InspectorPanel } from './InspectorPanel';
import type { ExtensionToWebview } from '../protocol/messages';
import type { VsCodeApi } from './vscodeApi';

export interface AppProps {
  api?: VsCodeApi;
  initialMessage?: ExtensionToWebview;
}

export function App(props: AppProps): React.ReactElement {
  const { api } = props;
  const [state, dispatch] = React.useReducer(reducer, initialState, (base) =>
    props.initialMessage ? reducer(base, { type: 'message', message: props.initialMessage }) : base,
  );
  const actionsRef = React.useRef<GraphActions | undefined>(undefined);
  const [showLiterals, setShowLiterals] = React.useState(true);

  React.useEffect(() => {
    function onMessage(event: MessageEvent): void {
      dispatch({ type: 'message', message: event.data as ExtensionToWebview });
    }
    window.addEventListener('message', onMessage);
    api?.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, [api]);

  if (state.status === 'loading') {
    return (
      <div className="app">
        <div className="status-message">Loading Turtle graph…</div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="app">
        <div className="status-message error">
          <h2>Could not parse Turtle</h2>
          <p>{state.errorMessage}</p>
          {state.errors.length > 0 && (
            <ul className="error-list">
              {state.errors.map((e, i) => (
                <li key={i}>
                  {e.line ? `Line ${e.line}: ` : ''}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => api?.postMessage({ type: 'refresh' })}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const model = state.model!;
  const predicates = listPredicates(model);
  const visible = computeVisible(model, state.query, state.predicate);

  return (
    <div className="app">
      <Toolbar
        query={state.query}
        onQuery={(q) => dispatch({ type: 'query', query: q })}
        predicate={state.predicate}
        predicates={predicates}
        onPredicate={(p) => dispatch({ type: 'predicate', predicate: p })}
        showLiterals={showLiterals}
        onShowLiterals={setShowLiterals}
        onExportJson={() => api?.postMessage({ type: 'export', format: 'json' })}
        onExportPng={() => api?.postMessage({ type: 'export', format: 'png', payload: actionsRef.current?.png() })}
        onFit={() => actionsRef.current?.fit()}
        onReset={() => actionsRef.current?.resetLayout()}
        onRefresh={() => api?.postMessage({ type: 'refresh' })}
      />
      {model.stats.truncated && (
        <div className="overview-banner">
          Showing {model.stats.renderedNodeCount} of {model.stats.totalNodeCount} nodes and {model.stats.renderedEdgeCount} of {model.stats.totalEdgeCount} edges from {model.stats.totalTripleCount} triples (bounded overview).
        </div>
      )}
      <div className="main">
        {state.status === 'empty' ? (
          <div className="status-message">No triples to display.</div>
        ) : (
          <GraphCanvas
            model={model}
            visible={visible}
            selection={state.selection}
            onSelect={(selection) => dispatch({ type: 'select', selection })}
            registerActions={(actions) => {
              actionsRef.current = actions;
            }}
          />
        )}
        <AccessibleGraphList model={model} visible={visible} onSelect={(selection) => dispatch({ type: 'select', selection })} />
        <InspectorPanel
          model={model}
          selection={state.selection}
          showLiterals={showLiterals}
          onSelect={(selection) => dispatch({ type: 'select', selection })}
          api={api}
        />
      </div>
    </div>
  );
}

function AccessibleGraphList({ model, visible, onSelect }: { model: import('../rdf/types').GraphModel; visible: import('./filtering').VisibleSet; onSelect: (selection: import('./state').Selection) => void }): React.ReactElement {
  return <aside className="accessible-list" aria-label="Graph elements"><h2>Graph elements</h2><h3>Nodes</h3><ul>{model.nodes.filter(n => visible.nodeIds.has(n.id)).map(n => <li key={n.id}><button type="button" onClick={() => onSelect({ kind: 'node', id: n.id })}>{n.label}</button></li>)}</ul><h3>Edges</h3><ul>{model.edges.filter(e => visible.edgeIds.has(e.id)).map(e => <li key={e.id}><button type="button" onClick={() => onSelect({ kind: 'edge', id: e.id })}>{e.label}</button></li>)}</ul></aside>;
}
