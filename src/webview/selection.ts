import type { GraphEdge, GraphModel, GraphNode } from '../rdf/types';

export function findNode(model: GraphModel, id: string): GraphNode | undefined {
  return model.nodes.find((node) => node.id === id);
}

export function findEdge(model: GraphModel, id: string): GraphEdge | undefined {
  return model.edges.find((edge) => edge.id === id);
}

export interface EdgeDetails {
  edge: GraphEdge;
  source?: GraphNode;
  target?: GraphNode;
}

export function edgeDetails(model: GraphModel, id: string): EdgeDetails | undefined {
  const edge = findEdge(model, id);
  if (!edge) {
    return undefined;
  }
  return {
    edge,
    source: findNode(model, edge.source),
    target: findNode(model, edge.target),
  };
}

export interface NeighborCounts {
  incoming: number;
  outgoing: number;
}

export function neighborCounts(node: GraphNode): NeighborCounts {
  return { incoming: node.incoming.length, outgoing: node.outgoing.length };
}
