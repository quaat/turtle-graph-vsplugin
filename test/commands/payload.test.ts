import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPreview } from '../../src/commands/payload';
import { normalizeConfig } from '../../src/rdf/config';

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8');
}

const config = normalizeConfig({});

describe('buildPreview', () => {
  it('produces a graph message for valid Turtle', () => {
    const { message } = buildPreview({ text: fixture('simple.ttl'), config });
    expect(message.type).toBe('graph');
    if (message.type === 'graph') {
      expect(message.model.nodes).toHaveLength(3);
    }
  });

  it('annotates edges with source references', () => {
    const { message } = buildPreview({ text: fixture('simple.ttl'), config });
    if (message.type === 'graph') {
      expect(message.model.edges[0].sourceRefs.length).toBeGreaterThan(0);
    }
  });

  it('returns an error message when nothing parses', () => {
    const { message, parsed } = buildPreview({ text: '@@@ not turtle @@@', config });
    expect(message.type).toBe('error');
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  it('expands preferred-label CURIEs using the document prefixes', () => {
    const text = [
      '@prefix ex: <http://example.org/> .',
      'ex:Thing ex:name "Custom Name" .',
    ].join('\n');
    const customConfig = normalizeConfig({ preferredLabels: ['ex:name'] });
    const { message } = buildPreview({ text, config: customConfig });
    expect(message.type).toBe('graph');
    if (message.type === 'graph') {
      const node = message.model.nodes.find((n) => n.id === 'http://example.org/Thing');
      expect(node?.label).toBe('Custom Name');
    }
  });
});
