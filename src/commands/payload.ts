import { buildGraphModel } from '../rdf/model';
import { parseTurtleDocument } from '../rdf/parser';
import { expandCurie, type ViewerConfig } from '../rdf/config';
import { locateSourceRefs } from '../rdf/sourceLocator';
import {
  buildErrorMessage,
  buildGraphMessage,
  type ExtensionToWebview,
} from '../protocol/messages';
import type { ParsedTurtleDocument } from '../rdf/types';
import { resolveRdfSyntax, type RdfSyntax } from '../rdf/syntax';

export interface PreviewInput {
  text: string;
  config: ViewerConfig;
  baseIRI?: string;
  sourceFile?: string;
  languageId?: string;
  syntax?: RdfSyntax;
}

export interface PreviewResult {
  message: ExtensionToWebview;
  parsed: ParsedTurtleDocument;
}

/**
 * Parse Turtle and produce the webview message plus the raw parse result (for diagnostics).
 * Returns an error message only when nothing could be parsed; partial graphs are still shown.
 */
export function buildPreview(input: PreviewInput): PreviewResult {
  const syntax = input.syntax ?? resolveRdfSyntax({ languageId: input.languageId, fileName: input.sourceFile }) ?? 'Turtle';
  const parsed = parseTurtleDocument(input.text, input.baseIRI, syntax);

  if (parsed.quads.length === 0 && parsed.errors.length > 0) {
    return {
      message: buildErrorMessage(`Failed to parse ${syntax} document.`, parsed.errors),
      parsed,
    };
  }

  // Re-expand preferred-label settings against the document's own prefixes so a
  // CURIE like `ex:name` resolves using `@prefix ex:` declared in the Turtle.
  // expandCurie is idempotent for already-expanded IRIs.
  const preferredLabels = input.config.preferredLabels.map((label) =>
    expandCurie(label, parsed.prefixes),
  );

  const model = buildGraphModel(parsed.quads, parsed.prefixes, {
    preferredLabels,
    maxNodes: input.config.maxInitialNodes,
    maxTriples: input.config.maxTriples,
  });
  locateSourceRefs(model, input.text, input.sourceFile);

  return {
    message: buildGraphMessage(
      model,
      { maxInitialNodes: input.config.maxInitialNodes, layout: input.config.layout },
      input.sourceFile,
    ),
    parsed,
  };
}
