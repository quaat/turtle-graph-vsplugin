export type NodeKind = 'resource' | 'blankNode';

export interface PrefixMap {
  [prefix: string]: string;
}

export interface ParseError {
  message: string;
  /** 1-based line, when the parser reports one. */
  line?: number;
  /** 1-based column, when the parser reports one. */
  column?: number;
}

export interface ParsedTurtleDocument {
  quads: ParsedQuad[];
  prefixes: PrefixMap;
  errors: ParseError[];
}

export interface ParsedTerm {
  termType: 'NamedNode' | 'BlankNode' | 'Literal';
  value: string;
  datatype?: string;
  language?: string;
}

export interface ParsedQuad {
  subject: ParsedTerm;
  predicate: ParsedTerm;
  object: ParsedTerm;
  graph?: string;
}

export interface SourceRef {
  /** 1-based line in the source document. */
  line: number;
  /** 1-based column where the match starts, when known. */
  column?: number;
}

export interface LiteralProperty {
  id: string;
  predicate: string;
  predicateLabel: string;
  value: string;
  datatype?: string;
  datatypeLabel?: string;
  language?: string;
  sourceRefs: SourceRef[];
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  iri?: string;
  blankNodeId?: string;
  label: string;
  compactId: string;
  types: string[];
  typeIris: string[];
  properties: LiteralProperty[];
  incoming: string[];
  outgoing: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  label: string;
  graph?: string;
  sourceRefs: SourceRef[];
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  literalCount: number;
  truncated: boolean;
  totalNodeCount: number;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
  prefixes: PrefixMap;
  stats: GraphStats;
}
