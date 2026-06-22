import { describe, expect, it } from 'vitest';
import { parseTurtleDocument } from '../src/rdf/parser';

describe('format-aware parsing', () => {
  it('parses TriG and N-Quads named graphs', () => {
    const trig = parseTurtleDocument('@prefix ex: <http://ex/> . ex:g { ex:s ex:p ex:o . }', undefined, 'TriG');
    expect(trig.quads[0]?.graph).toBe('http://ex/g');
    const nq = parseTurtleDocument('<http://ex/s> <http://ex/p> <http://ex/o> <http://ex/g> .', undefined, 'N-Quads');
    expect(nq.quads[0]?.graph).toBe('http://ex/g');
  });
  it('parses N-Triples', () => {
    const parsed = parseTurtleDocument('<http://ex/s> <http://ex/p> <http://ex/o> .', undefined, 'N-Triples');
    expect(parsed.errors).toEqual([]);
    expect(parsed.quads).toHaveLength(1);
  });
});
