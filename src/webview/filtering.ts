import type { GraphModel } from '../rdf/types';

export interface VisibleSet {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/** Unique predicate labels present in the graph, sorted for stable display. */
export function listPredicates(model: GraphModel): string[] {
  const labels = new Set<string>();
  for (const edge of model.edges) {
    labels.add(edge.label);
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}

function nodeMatchesQuery(
  node: GraphModel['nodes'][number],
  query: string,
): boolean {
  const haystack = `${node.label}\n${node.compactId}\n${node.iri ?? node.id}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * Compute which nodes/edges should be visible given a free-text search and a predicate filter.
 * Search restricts nodes (and edges to those between matching nodes); the predicate filter
 * restricts edges to a single predicate label.
 */
export function computeVisible(
  model: GraphModel,
  query: string,
  predicate: string,
): VisibleSet {
  const normalizedQuery = query.trim().toLowerCase();
  const matched = new Set<string>();
  for (const node of model.nodes) {
    if (normalizedQuery === '' || nodeMatchesQuery(node, normalizedQuery)) {
      matched.add(node.id);
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of model.edges) {
    const predicateOk = predicate === '' || edge.label === predicate;
    const searchOk = matched.has(edge.source) && matched.has(edge.target);
    if (predicateOk && searchOk) {
      edgeIds.add(edge.id);
    }
  }

  return { nodeIds: matched, edgeIds };
}
