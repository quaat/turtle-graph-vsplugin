import { describe, expect, it } from 'vitest';
import { compactIri, localName } from '../src/rdf/compactIri';

const prefixes = {
  ex: 'http://example.org/',
  exsub: 'http://example.org/sub/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
};

describe('compactIri', () => {
  it('compacts a known IRI', () => {
    expect(compactIri('http://example.org/Alice', prefixes)).toBe('ex:Alice');
  });

  it('prefers the longest matching namespace', () => {
    expect(compactIri('http://example.org/sub/Thing', prefixes)).toBe('exsub:Thing');
  });

  it('returns the IRI unchanged when no prefix matches', () => {
    expect(compactIri('http://other.org/X', prefixes)).toBe('http://other.org/X');
  });
});

describe('localName', () => {
  it('takes the fragment after a hash', () => {
    expect(localName('http://www.w3.org/2000/01/rdf-schema#label')).toBe('label');
  });

  it('takes the last path segment', () => {
    expect(localName('http://example.org/Alice')).toBe('Alice');
  });
});
