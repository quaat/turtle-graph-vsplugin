import { describe, expect, it } from 'vitest';
import { normalizeParseErrors } from '../../src/diagnostics/normalize';

describe('normalizeParseErrors', () => {
  it('converts 1-based parser positions to 0-based ranges', () => {
    expect(normalizeParseErrors([{ message: 'bad token', line: 3, column: 5 }])).toEqual([
      { line: 2, column: 4, endColumn: 5, message: 'bad token' },
    ]);
  });

  it('defaults missing positions to the document start', () => {
    expect(normalizeParseErrors([{ message: 'oops' }])).toEqual([
      { line: 0, column: 0, endColumn: 1, message: 'oops' },
    ]);
  });

  it('returns an empty array for no errors', () => {
    expect(normalizeParseErrors([])).toEqual([]);
  });
});
