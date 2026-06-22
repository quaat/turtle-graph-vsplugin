import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/webview/App';
import { buildErrorMessage, buildGraphMessage } from '../../src/protocol/messages';
import { parseTurtleDocument } from '../../src/rdf/parser';
import { buildGraphModel } from '../../src/rdf/model';
import { fixture } from './fixtures';

vi.mock('cytoscape', () => {
  const cy = {
    on: () => {},
    fit: () => {},
    layout: () => ({ run: () => {} }),
    batch: (fn: () => void) => fn(),
    nodes: () => [],
    edges: () => [],
    elements: () => ({ removeClass: () => {} }),
    getElementById: () => ({ addClass: () => {} }),
    destroy: () => {},
  };
  return { default: () => cy };
});

function graphMessage(name: string) {
  const parsed = parseTurtleDocument(fixture(name));
  const model = buildGraphModel(parsed.quads, parsed.prefixes);
  return buildGraphMessage(model, { maxInitialNodes: 500 });
}

describe('App', () => {
  it('renders the toolbar, graph canvas, and inspector for a graph', () => {
    render(<App initialMessage={graphMessage('simple.ttl')} api={{ postMessage: vi.fn() }} />);
    expect(screen.getByLabelText('Search nodes')).toBeInTheDocument();
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(screen.getByText('Select a node or edge to inspect it.')).toBeInTheDocument();
  });

  it('renders an error state for a parse error message', () => {
    render(
      <App
        initialMessage={buildErrorMessage('Failed to parse', [{ message: 'bad', line: 1 }])}
        api={{ postMessage: vi.fn() }}
      />,
    );
    expect(screen.getByText('Could not parse Turtle')).toBeInTheDocument();
    expect(screen.getByText(/bad/)).toBeInTheDocument();
  });

  it('shows an empty state when the graph has no nodes', () => {
    const empty = buildGraphMessage(
      { nodes: [], edges: [], prefixes: {}, stats: { nodeCount: 0, edgeCount: 0, literalCount: 0, truncated: false, totalNodeCount: 0 } },
      { maxInitialNodes: 500 },
    );
    render(<App initialMessage={empty} api={{ postMessage: vi.fn() }} />);
    expect(screen.getByText('No triples to display.')).toBeInTheDocument();
  });
});
