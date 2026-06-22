import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_INITIAL_NODES, expandCurie, normalizeConfig, normalizeLayout, SUPPORTED_LAYOUTS } from '../src/rdf/config';
import { DCTERMS_TITLE, RDFS_LABEL, SKOS_PREFLABEL } from '../src/rdf/vocab';

describe('normalizeConfig', () => {
  it('applies defaults for an empty object', () => {
    const config = normalizeConfig({});
    expect(config.refreshOnChange).toBe(true);
    expect(config.maxInitialNodes).toBe(DEFAULT_MAX_INITIAL_NODES);
    expect(config.preferredLabels).toEqual([RDFS_LABEL, SKOS_PREFLABEL, DCTERMS_TITLE]);
  });

  it('clamps and floors invalid maxInitialNodes', () => {
    expect(normalizeConfig({ maxInitialNodes: -5 }).maxInitialNodes).toBe(1);
    expect(normalizeConfig({ maxInitialNodes: Number.NaN }).maxInitialNodes).toBe(
      DEFAULT_MAX_INITIAL_NODES,
    );
    expect(normalizeConfig({ maxInitialNodes: 12.9 }).maxInitialNodes).toBe(12);
    expect(normalizeConfig({ maxInitialNodes: 'lots' as unknown }).maxInitialNodes).toBe(
      DEFAULT_MAX_INITIAL_NODES,
    );
  });

  it('falls back to true for a non-boolean refreshOnChange', () => {
    expect(normalizeConfig({ refreshOnChange: 'yes' as unknown }).refreshOnChange).toBe(true);
  });

  it('normalizes layout values to safe Cytoscape layout names', () => {
    for (const layout of SUPPORTED_LAYOUTS) {
      expect(normalizeConfig({ layout }).layout).toBe(layout);
      expect(normalizeLayout(layout.toUpperCase())).toBe(layout);
    }
    expect(normalizeConfig({ layout: 'evil' }).layout).toBe('cose');
    expect(normalizeConfig({ layout: '' }).layout).toBe('cose');
  });

  it('expands custom CURIE preferred labels', () => {
    const config = normalizeConfig({ preferredLabels: ['skos:prefLabel'] });
    expect(config.preferredLabels).toEqual([SKOS_PREFLABEL]);
  });
});

describe('expandCurie', () => {
  it('expands a known CURIE', () => {
    expect(expandCurie('rdfs:label')).toBe(RDFS_LABEL);
  });

  it('passes IRIs through unchanged', () => {
    expect(expandCurie('http://example.org/x')).toBe('http://example.org/x');
  });

  it('passes unknown prefixes through unchanged', () => {
    expect(expandCurie('zzz:thing')).toBe('zzz:thing');
  });

  it('uses document prefixes when provided', () => {
    expect(expandCurie('ex:name', { ex: 'http://example.org/' })).toBe('http://example.org/name');
  });
});
