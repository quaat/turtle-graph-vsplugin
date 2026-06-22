import { describe, expect, it } from 'vitest';
import { parseTurtleDocument } from '../../src/rdf/parser';
import { buildGraphModel } from '../../src/rdf/model';
import { edgeDetails, findEdge, findNode, neighborCounts } from '../../src/webview/selection';
import { fixture } from './fixtures';

function model() {
  const parsed = parseTurtleDocument(fixture('simple.ttl'));
  return buildGraphModel(parsed.quads, parsed.prefixes);
}

describe('selection helpers', () => {
  it('finds nodes and edges by id', () => {
    const m = model();
    expect(findNode(m, 'http://example.org/Bob')?.compactId).toBe('ex:Bob');
    expect(findEdge(m, m.edges[0].id)).toBeDefined();
  });

  it('resolves edge endpoints', () => {
    const m = model();
    const details = edgeDetails(m, m.edges[0].id)!;
    expect(details.source).toBeDefined();
    expect(details.target).toBeDefined();
  });

  it('counts neighbors', () => {
    const m = model();
    const bob = findNode(m, 'http://example.org/Bob')!;
    expect(neighborCounts(bob)).toEqual({ incoming: 1, outgoing: 1 });
  });
});
