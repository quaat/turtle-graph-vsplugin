import { describe, expect, it } from 'vitest';
import {
  buildErrorMessage,
  buildGraphMessage,
  isWebviewToExtension,
  PROTOCOL_VERSION,
} from '../../src/protocol/messages';
import type { GraphModel } from '../../src/rdf/types';

const emptyModel: GraphModel = {
  nodes: [],
  edges: [],
  prefixes: {},
  stats: { nodeCount: 0, edgeCount: 0, literalCount: 0, truncated: false, totalNodeCount: 0 },
};

describe('message builders', () => {
  it('builds a versioned graph message', () => {
    const msg = buildGraphMessage(emptyModel, { maxInitialNodes: 500 }, '/tmp/a.ttl');
    expect(msg).toMatchObject({
      type: 'graph',
      version: PROTOCOL_VERSION,
      sourceFile: '/tmp/a.ttl',
      config: { maxInitialNodes: 500 },
    });
  });

  it('builds an error message', () => {
    const msg = buildErrorMessage('boom', [{ message: 'bad', line: 2 }]);
    expect(msg.type).toBe('error');
    expect(msg.errors).toHaveLength(1);
  });
});

describe('isWebviewToExtension', () => {
  it('accepts known control messages', () => {
    expect(isWebviewToExtension({ type: 'ready' })).toBe(true);
    expect(isWebviewToExtension({ type: 'refresh' })).toBe(true);
    expect(isWebviewToExtension({ type: 'copy', text: 'x' })).toBe(true);
    expect(isWebviewToExtension({ type: 'reveal', target: { kind: 'node' } })).toBe(true);
  });

  it('rejects malformed or unknown messages', () => {
    expect(isWebviewToExtension({ type: 'copy' })).toBe(false);
    expect(isWebviewToExtension({ type: 'reveal', target: { kind: 'bogus' } })).toBe(false);
    expect(isWebviewToExtension({ type: 'nope' })).toBe(false);
    expect(isWebviewToExtension(null)).toBe(false);
    expect(isWebviewToExtension('ready')).toBe(false);
  });
});
