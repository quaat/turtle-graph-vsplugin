import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseTurtleDocument } from '../src/rdf/parser';
import { buildGraphModel } from '../src/rdf/model';
import { DCTERMS_TITLE, RDFS_LABEL, SKOS_PREFLABEL } from '../src/rdf/vocab';
import type { ParsedQuad } from '../src/rdf/types';

const PREFERRED = [RDFS_LABEL, SKOS_PREFLABEL, DCTERMS_TITLE];

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

function modelFor(name: string) {
  const parsed = parseTurtleDocument(fixture(name));
  return buildGraphModel(parsed.quads, parsed.prefixes, { preferredLabels: PREFERRED });
}

describe('buildGraphModel', () => {
  it('creates resource nodes and object-property edges', () => {
    const model = modelFor('simple.ttl');
    expect(model.nodes.map((n) => n.id)).toEqual([
      'http://example.org/Alice',
      'http://example.org/Bob',
      'http://example.org/Carol',
    ]);
    expect(model.edges).toHaveLength(2);
    const alice = model.nodes.find((n) => n.id === 'http://example.org/Alice')!;
    expect(alice.outgoing).toHaveLength(1);
    expect(alice.incoming).toHaveLength(0);
    expect(alice.compactId).toBe('ex:Alice');
  });

  it('groups literals as node properties with datatype and language', () => {
    const model = modelFor('literals.ttl');
    const alice = model.nodes.find((n) => n.id === 'http://example.org/Alice')!;
    expect(model.stats.literalCount).toBe(3);
    const age = alice.properties.find((p) => p.value === '30')!;
    expect(age.datatypeLabel).toBe('xsd:integer');
    const greeting = alice.properties.find((p) => p.value === 'Hello')!;
    expect(greeting.language).toBe('en');
  });

  it('uses preferred-label precedence (rdfs:label over skos:prefLabel)', () => {
    const model = modelFor('ontology.ttl');
    const alice = model.nodes.find((n) => n.id === 'http://example.org/Alice')!;
    expect(alice.label).toBe('Alice');
    expect(alice.types).toContain('ex:Person');
    expect(model.edges).toHaveLength(0); // rdf:type is a badge, not an edge
  });

  it('represents blank nodes and their edges', () => {
    const model = modelFor('blank-nodes.ttl');
    expect(model.nodes).toHaveLength(2);
    expect(model.edges).toHaveLength(1);
    const blank = model.nodes.find((n) => n.kind === 'blankNode')!;
    expect(blank.properties.some((p) => p.value === 'Oslo')).toBe(true);
  });

  it('is deterministic for the same input', () => {
    expect(JSON.stringify(modelFor('simple.ttl'))).toBe(JSON.stringify(modelFor('simple.ttl')));
  });

  it('produces a bounded overview when maxNodes is exceeded', () => {
    const quads: ParsedQuad[] = [];
    for (let i = 0; i < 10; i += 1) {
      quads.push({
        subject: { termType: 'NamedNode', value: `http://example.org/n${i}` },
        predicate: { termType: 'NamedNode', value: 'http://example.org/next' },
        object: { termType: 'NamedNode', value: `http://example.org/n${i + 1}` },
      });
    }
    const model = buildGraphModel(quads, { ex: 'http://example.org/' }, { maxNodes: 3 });
    expect(model.stats.truncated).toBe(true);
    expect(model.stats.nodeCount).toBe(3);
    expect(model.stats.totalNodeCount).toBe(11);
    // Every retained edge references only retained nodes.
    const ids = new Set(model.nodes.map((n) => n.id));
    expect(model.edges.every((e) => ids.has(e.source) && ids.has(e.target))).toBe(true);
  });
});
