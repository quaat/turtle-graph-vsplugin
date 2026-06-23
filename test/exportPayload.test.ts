import { describe, expect, it } from 'vitest';
import { decodePngDataUri } from '../src/exportPayload';

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1, 2]);
const valid = `data:image/png;base64,${pngBytes.toString('base64')}`;

describe('decodePngDataUri', () => {
  it('decodes a valid PNG data URI', () => {
    expect(decodePngDataUri(valid)).toEqual(pngBytes);
  });
  it('rejects a missing payload', () => {
    expect(() => decodePngDataUri(undefined)).toThrow(/missing/i);
  });
  it('rejects a non-PNG data URI', () => {
    expect(() => decodePngDataUri('data:image/jpeg;base64,AAAA')).toThrow(/data:image\/png/);
  });
  it('rejects invalid base64', () => {
    expect(() => decodePngDataUri('data:image/png;base64,not base64')).toThrow(/base64/i);
  });
  it('rejects decoded non-PNG bytes', () => {
    expect(() => decodePngDataUri(`data:image/png;base64,${Buffer.from('hello').toString('base64')}`)).toThrow(/PNG data/);
  });
});
