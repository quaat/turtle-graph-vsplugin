import { compactIri, localName } from './compactIri';
import { RDF_TYPE } from './vocab';
import type {
  GraphEdge,
  GraphModel,
  GraphNode,
  LiteralProperty,
  ParsedQuad,
  ParsedTerm,
  PrefixMap,
} from './types';

export interface BuildGraphOptions {
  /** Preferred label predicates as full IRIs, in priority order. */
  preferredLabels?: string[];
  /** Cap the number of rendered nodes; larger graphs become a bounded overview. */
  maxNodes?: number;
}

function termId(term: ParsedTerm): string {
  return term.termType === 'BlankNode' ? `_:${term.value}` : term.value;
}

interface MutableNode extends GraphNode {
  labelRank: number;
}

function ensureNode(
  nodes: Map<string, MutableNode>,
  term: ParsedTerm,
  prefixes: PrefixMap,
): MutableNode {
  const id = termId(term);
  let node = nodes.get(id);
  if (!node) {
    const isBlank = term.termType === 'BlankNode';
    node = {
      id,
      kind: isBlank ? 'blankNode' : 'resource',
      iri: isBlank ? undefined : term.value,
      blankNodeId: isBlank ? term.value : undefined,
      label: isBlank ? id : localName(term.value),
      compactId: isBlank ? id : compactIri(term.value, prefixes),
      types: [],
      typeIris: [],
      properties: [],
      incoming: [],
      outgoing: [],
      labelRank: Number.POSITIVE_INFINITY,
    };
    nodes.set(id, node);
  }
  return node;
}

/** Convert parsed RDF quads into a deterministic node/edge/property graph model. */
export function buildGraphModel(
  quads: ParsedQuad[],
  prefixes: PrefixMap,
  options: BuildGraphOptions = {},
): GraphModel {
  const preferredLabels = options.preferredLabels ?? [];
  const nodes = new Map<string, MutableNode>();
  const edges = new Map<string, GraphEdge>();
  let literalCount = 0;

  for (const quad of quads) {
    const { subject, predicate, object } = quad;
    if (subject.termType === 'Literal') {
      continue; // not valid in RDF; skip defensively
    }
    const subjectNode = ensureNode(nodes, subject, prefixes);
    const predicateIri = predicate.value;
    const predicateLabel = compactIri(predicateIri, prefixes);

    if (object.termType === 'Literal') {
      if (predicateIri === RDF_TYPE) {
        continue;
      }
      const property: LiteralProperty = {
        id: `${subjectNode.id}|${predicateIri}|${subjectNode.properties.length}`,
        predicate: predicateIri,
        predicateLabel,
        value: object.value,
        datatype: object.datatype,
        datatypeLabel: object.datatype ? compactIri(object.datatype, prefixes) : undefined,
        language: object.language,
        sourceRefs: [],
      };
      subjectNode.properties.push(property);
      literalCount += 1;

      const rank = preferredLabels.indexOf(predicateIri);
      if (rank !== -1 && rank < subjectNode.labelRank) {
        subjectNode.labelRank = rank;
        subjectNode.label = object.value;
      }
      continue;
    }

    if (predicateIri === RDF_TYPE && object.termType === 'NamedNode') {
      if (!subjectNode.typeIris.includes(object.value)) {
        subjectNode.typeIris.push(object.value);
        subjectNode.types.push(compactIri(object.value, prefixes));
      }
      continue;
    }

    const objectNode = ensureNode(nodes, object, prefixes);
    const edgeId = `${subjectNode.id}=>${predicateIri}=>${objectNode.id}`;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, {
        id: edgeId,
        source: subjectNode.id,
        target: objectNode.id,
        predicate: predicateIri,
        label: predicateLabel,
        graph: quad.graph,
        sourceRefs: [],
      });
      if (!subjectNode.outgoing.includes(edgeId)) {
        subjectNode.outgoing.push(edgeId);
      }
      if (!objectNode.incoming.includes(edgeId)) {
        objectNode.incoming.push(edgeId);
      }
    }
  }

  const sortedNodes = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  const totalNodeCount = sortedNodes.length;
  const maxNodes = options.maxNodes;
  const truncated = typeof maxNodes === 'number' && totalNodeCount > maxNodes;
  const keptNodes = truncated ? sortedNodes.slice(0, maxNodes) : sortedNodes;
  const keptIds = new Set(keptNodes.map((n) => n.id));

  const keptEdges = [...edges.values()]
    .filter((edge) => keptIds.has(edge.source) && keptIds.has(edge.target))
    .sort((a, b) => a.id.localeCompare(b.id));
  const keptEdgeIds = new Set(keptEdges.map((e) => e.id));

  const finalNodes: GraphNode[] = keptNodes.map((node) => {
    const { labelRank: _labelRank, ...rest } = node;
    return {
      ...rest,
      incoming: rest.incoming.filter((id) => keptEdgeIds.has(id)),
      outgoing: rest.outgoing.filter((id) => keptEdgeIds.has(id)),
    };
  });

  return {
    nodes: finalNodes,
    edges: keptEdges,
    prefixes,
    stats: {
      nodeCount: finalNodes.length,
      edgeCount: keptEdges.length,
      literalCount,
      truncated,
      totalNodeCount,
    },
  };
}
