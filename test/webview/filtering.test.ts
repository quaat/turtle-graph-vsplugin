import { describe, expect, it } from 'vitest';
import { parseTurtleDocument } from '../../src/rdf/parser';
import { buildGraphModel } from '../../src/rdf/model';
import { computeVisible, listPredicates } from '../../src/webview/filtering';
import { fixture } from './fixtures';

function model() {
  const parsed = parseTurtleDocument(fixture('simple.ttl'));
  return buildGraphModel(parsed.quads, parsed.prefixes);
}

describe('listPredicates', () => {
  it('lists unique predicate labels', () => {
    expect(listPredicates(model())).toEqual(['foaf:knows']);
  });
});

describe('computeVisible', () => {
  it('shows everything with no filters', () => {
    const visible = computeVisible(model(), '', '');
    expect(visible.nodeIds.size).toBe(3);
    expect(visible.edgeIds.size).toBe(2);
  });

  it('restricts to matching nodes when searching', () => {
    const visible = computeVisible(model(), 'Alice', '');
    expect([...visible.nodeIds]).toEqual(['http://example.org/Alice']);
    expect(visible.edgeIds.size).toBe(0);
  });

  it('filters edges by predicate', () => {
    expect(computeVisible(model(), '', 'foaf:knows').edgeIds.size).toBe(2);
    expect(computeVisible(model(), '', 'ex:missing').edgeIds.size).toBe(0);
  });
});
