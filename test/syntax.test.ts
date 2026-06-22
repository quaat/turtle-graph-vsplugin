import { describe, expect, it } from 'vitest';
import { resolveRdfSyntax, isSupportedRdfDocument } from '../src/rdf/syntax';

describe('RDF syntax resolution', () => {
  it('supports ttl trig nt and nq', () => {
    expect(resolveRdfSyntax({ fileName: 'a.ttl' })).toBe('Turtle');
    expect(resolveRdfSyntax({ fileName: 'a.trig' })).toBe('TriG');
    expect(resolveRdfSyntax({ fileName: 'a.nt' })).toBe('N-Triples');
    expect(resolveRdfSyntax({ fileName: 'a.nq' })).toBe('N-Quads');
  });
  it('does not treat rdf/xml as supported', () => {
    expect(resolveRdfSyntax({ fileName: 'a.rdf' })).toBeUndefined();
    expect(isSupportedRdfDocument({ languageId: 'xml', fileName: 'a.rdf' })).toBe(false);
  });
});
