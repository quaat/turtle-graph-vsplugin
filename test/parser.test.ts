import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseTurtleDocument } from '../src/rdf/parser';

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

describe('parseTurtleDocument', () => {
  it('parses simple Turtle into quads and prefixes', () => {
    const result = parseTurtleDocument(fixture('simple.ttl'));
    expect(result.errors).toHaveLength(0);
    expect(result.quads).toHaveLength(2);
    expect(result.prefixes.ex).toBe('http://example.org/');
    expect(result.prefixes.foaf).toBe('http://xmlns.com/foaf/0.1/');
  });

  it('captures typed and language-tagged literals', () => {
    const result = parseTurtleDocument(fixture('literals.ttl'));
    expect(result.errors).toHaveLength(0);
    const objects = result.quads.map((q) => q.object);

    const typed = objects.find((o) => o.value === '30');
    expect(typed?.datatype).toBe('http://www.w3.org/2001/XMLSchema#integer');

    const tagged = objects.find((o) => o.value === 'Hello');
    expect(tagged?.language).toBe('en');
  });

  it('handles blank nodes', () => {
    const result = parseTurtleDocument(fixture('blank-nodes.ttl'));
    expect(result.errors).toHaveLength(0);
    const hasBlank = result.quads.some(
      (q) => q.object.termType === 'BlankNode' || q.subject.termType === 'BlankNode',
    );
    expect(hasBlank).toBe(true);
  });

  it('reports errors for invalid Turtle without throwing', () => {
    const result = parseTurtleDocument(fixture('invalid.ttl'));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toBeTruthy();
  });

  it('is deterministic for the same input', () => {
    const a = parseTurtleDocument(fixture('simple.ttl'));
    const b = parseTurtleDocument(fixture('simple.ttl'));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
