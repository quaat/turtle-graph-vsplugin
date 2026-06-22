import { DEFAULT_PREFERRED_LABEL_CURIES, KNOWN_PREFIXES } from './vocab';
import type { PrefixMap } from './types';

export interface ViewerConfig {
  refreshOnChange: boolean;
  maxInitialNodes: number;
  /** Preferred label predicates as full IRIs, in priority order. */
  preferredLabels: string[];
  maxFileBytes: number;
  maxTriples: number;
  layout: GraphLayout;
}

export interface RawViewerConfig {
  refreshOnChange?: unknown;
  maxInitialNodes?: unknown;
  preferredLabels?: unknown;
  maxFileBytes?: unknown;
  maxTriples?: unknown;
  layout?: unknown;
}

export const DEFAULT_MAX_INITIAL_NODES = 500;
export const DEFAULT_MAX_FILE_BYTES = 2_000_000;
export const DEFAULT_MAX_TRIPLES = 20_000;
export const SUPPORTED_LAYOUTS = ['cose', 'grid', 'circle', 'breadthfirst', 'concentric'] as const;
export type GraphLayout = (typeof SUPPORTED_LAYOUTS)[number];
export const DEFAULT_LAYOUT: GraphLayout = 'cose';

export function normalizeLayout(value: unknown): GraphLayout {
  if (typeof value !== 'string') return DEFAULT_LAYOUT;
  const normalized = value.trim().toLowerCase();
  return (SUPPORTED_LAYOUTS as readonly string[]).includes(normalized) ? (normalized as GraphLayout) : DEFAULT_LAYOUT;
}

/** Expand a CURIE (e.g. `rdfs:label`) to an IRI using the given prefixes; pass IRIs through. */
export function expandCurie(value: string, prefixes: PrefixMap = {}): string {
  if (/^https?:\/\//i.test(value) || value.startsWith('urn:')) {
    return value;
  }
  const colon = value.indexOf(':');
  if (colon <= 0) {
    return value;
  }
  const prefix = value.slice(0, colon);
  const local = value.slice(colon + 1);
  const namespace = prefixes[prefix] ?? KNOWN_PREFIXES[prefix];
  return namespace ? `${namespace}${local}` : value;
}

/** Normalize untrusted configuration into a complete, valid ViewerConfig. */
export function normalizeConfig(raw: RawViewerConfig = {}, prefixes: PrefixMap = {}): ViewerConfig {
  const refreshOnChange = typeof raw.refreshOnChange === 'boolean' ? raw.refreshOnChange : true;

  let maxInitialNodes = DEFAULT_MAX_INITIAL_NODES;
  if (typeof raw.maxInitialNodes === 'number' && Number.isFinite(raw.maxInitialNodes)) {
    maxInitialNodes = Math.max(1, Math.floor(raw.maxInitialNodes));
  }

  const maxFileBytes = typeof raw.maxFileBytes === 'number' && Number.isFinite(raw.maxFileBytes) ? Math.max(1, Math.floor(raw.maxFileBytes)) : DEFAULT_MAX_FILE_BYTES;
  const maxTriples = typeof raw.maxTriples === 'number' && Number.isFinite(raw.maxTriples) ? Math.max(1, Math.floor(raw.maxTriples)) : DEFAULT_MAX_TRIPLES;
  const layout = normalizeLayout(raw.layout);

  const curies =
    Array.isArray(raw.preferredLabels) && raw.preferredLabels.length > 0
      ? raw.preferredLabels.filter((v): v is string => typeof v === 'string')
      : DEFAULT_PREFERRED_LABEL_CURIES;
  const preferredLabels = curies.map((curie) => expandCurie(curie, prefixes));

  return { refreshOnChange, maxInitialNodes, preferredLabels, maxFileBytes, maxTriples, layout };
}
