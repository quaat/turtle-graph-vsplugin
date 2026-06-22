import { Parser, type Quad, type Term } from 'n3';
import type { ParseError, ParsedQuad, ParsedTerm, ParsedTurtleDocument, PrefixMap } from './types';

function toParsedTerm(term: Term): ParsedTerm {
  if (term.termType === 'Literal') {
    const literal = term as Term & {
      datatype?: { value: string };
      language?: string;
    };
    return {
      termType: 'Literal',
      value: term.value,
      datatype: literal.datatype?.value,
      language: literal.language ? literal.language : undefined,
    };
  }
  if (term.termType === 'BlankNode') {
    return { termType: 'BlankNode', value: term.value };
  }
  // NamedNode (and, defensively, anything else) is treated as a NamedNode.
  return { termType: 'NamedNode', value: term.value };
}

function normalizeError(error: Error): ParseError {
  const message = error.message ?? String(error);
  const lineMatch = /line\s+(\d+)/i.exec(message);
  const columnMatch = /column\s+(\d+)/i.exec(message);
  return {
    message,
    line: lineMatch ? Number(lineMatch[1]) : undefined,
    column: columnMatch ? Number(columnMatch[1]) : undefined,
  };
}

/**
 * Parse Turtle text into RDF quads, a prefix map, and structured parse errors.
 * Never throws on malformed input; parse failures are returned in `errors`.
 */
export function parseTurtleDocument(text: string, baseIRI?: string): ParsedTurtleDocument {
  const quads: ParsedQuad[] = [];
  const prefixes: PrefixMap = {};
  const errors: ParseError[] = [];

  const parser = new Parser({ baseIRI });

  const onPrefix = (prefix: string, iri: unknown) => {
    const value =
      iri && typeof iri === 'object' && 'value' in iri
        ? String((iri as { value: string }).value)
        : String(iri);
    prefixes[prefix] = value;
  };

  try {
    // The no-callback form parses synchronously and returns the quads as an
    // array, throwing on malformed input. The async callback form is unreliable
    // for our synchronous use here.
    const parsed = parser.parse(text, null, onPrefix) as Quad[];
    for (const quad of parsed) {
      quads.push({
        subject: toParsedTerm(quad.subject),
        predicate: toParsedTerm(quad.predicate),
        object: toParsedTerm(quad.object),
        graph: quad.graph && quad.graph.value ? quad.graph.value : undefined,
      });
    }
  } catch (error) {
    errors.push(normalizeError(error instanceof Error ? error : new Error(String(error))));
  }

  return { quads, prefixes, errors };
}
