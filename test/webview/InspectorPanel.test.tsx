import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InspectorPanel } from '../../src/webview/InspectorPanel';
import { parseTurtleDocument } from '../../src/rdf/parser';
import { buildGraphModel } from '../../src/rdf/model';
import { fixture } from './fixtures';

function modelFor(name: string) {
  const parsed = parseTurtleDocument(fixture(name));
  return buildGraphModel(parsed.quads, parsed.prefixes);
}

describe('InspectorPanel', () => {
  it('shows literal datatype and language for a node', () => {
    const model = modelFor('literals.ttl');
    render(
      <InspectorPanel
        model={model}
        selection={{ kind: 'node', id: 'http://example.org/Alice' }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('^^xsd:integer')).toBeInTheDocument();
    expect(screen.getByText('@en')).toBeInTheDocument();
  });

  it('copies the IRI via the host API', () => {
    const model = modelFor('literals.ttl');
    const postMessage = vi.fn();
    render(
      <InspectorPanel
        model={model}
        selection={{ kind: 'node', id: 'http://example.org/Alice' }}
        onSelect={vi.fn()}
        api={{ postMessage }}
      />,
    );
    fireEvent.click(screen.getByText('Copy IRI'));
    expect(postMessage).toHaveBeenCalledWith({ type: 'copy', text: 'http://example.org/Alice' });
  });

  it('shows full subject and object IRIs and copies them for an edge', () => {
    const model = modelFor('simple.ttl');
    const postMessage = vi.fn();
    render(
      <InspectorPanel
        model={model}
        selection={{ kind: 'edge', id: model.edges[0].id }}
        onSelect={vi.fn()}
        api={{ postMessage }}
      />,
    );
    expect(screen.getByText('http://example.org/Alice')).toBeInTheDocument();
    expect(screen.getByText('http://example.org/Bob')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Copy subject IRI'));
    expect(postMessage).toHaveBeenCalledWith({ type: 'copy', text: 'http://example.org/Alice' });
    fireEvent.click(screen.getByText('Copy object IRI'));
    expect(postMessage).toHaveBeenCalledWith({ type: 'copy', text: 'http://example.org/Bob' });
  });

  it('requests source reveal for an edge', () => {
    const model = modelFor('simple.ttl');
    const postMessage = vi.fn();
    render(
      <InspectorPanel
        model={model}
        selection={{ kind: 'edge', id: model.edges[0].id }}
        onSelect={vi.fn()}
        api={{ postMessage }}
      />,
    );
    fireEvent.click(screen.getByText('Reveal in Turtle'));
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reveal', target: expect.objectContaining({ kind: 'edge' }) }),
    );
  });
});
