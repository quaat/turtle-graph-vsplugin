import type { PrefixMap } from './types';

/** Compact an IRI to `prefix:local` using the longest matching namespace. */
export function compactIri(iri: string, prefixes: PrefixMap): string {
  let bestPrefix = '';
  let bestNamespace = '';
  for (const [prefix, namespace] of Object.entries(prefixes)) {
    if (namespace && iri.startsWith(namespace) && namespace.length > bestNamespace.length) {
      bestNamespace = namespace;
      bestPrefix = prefix;
    }
  }
  if (bestNamespace) {
    const local = iri.slice(bestNamespace.length);
    return bestPrefix ? `${bestPrefix}:${local}` : local;
  }
  return iri;
}

/** Extract the local name (after the last `#` or `/`) of an IRI. */
export function localName(iri: string): string {
  const hash = iri.lastIndexOf('#');
  const slash = iri.lastIndexOf('/');
  const idx = Math.max(hash, slash);
  if (idx >= 0 && idx < iri.length - 1) {
    return iri.slice(idx + 1);
  }
  return iri;
}
