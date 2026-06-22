import { localName } from './compactIri';
import type { GraphModel, ParsedTerm, SourceRef } from './types';

/**
 * Best-effort source navigation. RDF parsing does not expose exact source spans, so these
 * helpers locate statements by searching for identifying tokens in the original Turtle text.
 * Matches are approximate and may point at the first similar statement.
 */

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/** Return the 1-based line where every token appears as a substring, or undefined. */
export function findTokenLine(text: string, tokens: string[]): SourceRef | undefined {
  const meaningful = tokens.filter((t) => t.length > 0);
  if (meaningful.length === 0) {
    return undefined;
  }
  const lines = splitLines(text);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (meaningful.every((token) => line.includes(token))) {
      const column = line.indexOf(meaningful[0]) + 1;
      return { line: i + 1, column };
    }
  }
  return undefined;
}

/** Locate a triple by trying progressively weaker token combinations. */
export function findStatementRef(
  text: string,
  subjectToken: string,
  predicateToken: string,
  objectToken: string,
): SourceRef | undefined {
  return (
    findTokenLine(text, [subjectToken, predicateToken, objectToken]) ??
    findTokenLine(text, [predicateToken, objectToken]) ??
    findTokenLine(text, [objectToken]) ??
    findTokenLine(text, [subjectToken])
  );
}

function tokenForNodeId(nodeId: string): string {
  if (nodeId.startsWith('_:')) {
    return nodeId.slice(2);
  }
  return localName(nodeId);
}

function tokenForTermValue(value: string): string {
  return /^https?:\/\//i.test(value) ? localName(value) : value;
}

/** Annotate a graph model with best-effort source line references, mutating it in place. */
export function locateSourceRefs(model: GraphModel, text: string, sourceFile?: string): GraphModel {
  for (const edge of model.edges) {
    const ref = findStatementRef(
      text,
      tokenForNodeId(edge.source),
      tokenForTermValue(edge.predicate),
      tokenForNodeId(edge.target),
    );
    edge.sourceRefs = ref ? [{ ...ref, file: sourceFile }] : [];
  }

  for (const node of model.nodes) {
    const subjectToken = tokenForNodeId(node.id);
    for (const property of node.properties) {
      const ref =
        findTokenLine(text, [subjectToken, property.value]) ??
        findTokenLine(text, [property.value]);
      property.sourceRefs = ref ? [{ ...ref, file: sourceFile }] : [];
    }
  }

  return model;
}

/** Resolve a parsed term to the token used for source lookup (exposed for reuse/tests). */
export function tokenForTerm(term: ParsedTerm): string {
  if (term.termType === 'BlankNode') {
    return term.value;
  }
  if (term.termType === 'Literal') {
    return term.value;
  }
  return localName(term.value);
}
