import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseTurtleDocument } from '../src/rdf/parser';
import { buildGraphModel } from '../src/rdf/model';
import { findStatementRef, findTokenLine, locateSourceRefs } from '../src/rdf/sourceLocator';

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

describe('findTokenLine', () => {
  it('finds a single-line statement', () => {
    const ref = findStatementRef(fixture('simple.ttl'), 'Alice', 'knows', 'Bob');
    expect(ref?.line).toBe(4);
  });

  it('returns undefined when no token matches', () => {
    expect(findTokenLine(fixture('simple.ttl'), ['Nonexistent'])).toBeUndefined();
  });

  it('falls back across lines for multi-line statements', () => {
    const ref = findStatementRef(fixture('multiline.ttl'), 'Alice', 'knows', 'Bob');
    expect(ref?.line).toBe(4);
  });
});

describe('locateSourceRefs', () => {
  it('annotates edges and literal properties with best-effort lines', () => {
    const text = fixture('multiline.ttl');
    const parsed = parseTurtleDocument(text);
    const model = buildGraphModel(parsed.quads, parsed.prefixes);
    locateSourceRefs(model, text);

    const edge = model.edges[0];
    expect(edge.sourceRefs[0]?.line).toBe(4);

    const alice = model.nodes.find((n) => n.id === 'http://example.org/Alice')!;
    const age = alice.properties.find((p) => p.value === '42')!;
    expect(age.sourceRefs[0]?.line).toBe(5);
  });
});
