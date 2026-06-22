import type * as vscode from 'vscode';

export type RdfSyntax = 'Turtle' | 'TriG' | 'N-Triples' | 'N-Quads';

const EXTENSION_SYNTAX: Record<string, RdfSyntax> = {
  '.ttl': 'Turtle',
  '.trig': 'TriG',
  '.nt': 'N-Triples',
  '.nq': 'N-Quads',
};

const LANGUAGE_SYNTAX: Record<string, RdfSyntax> = {
  turtle: 'Turtle',
  trig: 'TriG',
  ntriples: 'N-Triples',
  nquads: 'N-Quads',
};

export const SUPPORTED_RDF_EXTENSIONS = Object.keys(EXTENSION_SYNTAX);

export function syntaxFromPath(fileName: string): RdfSyntax | undefined {
  const lower = fileName.toLowerCase();
  return Object.entries(EXTENSION_SYNTAX).find(([ext]) => lower.endsWith(ext))?.[1];
}

export function syntaxFromLanguageId(languageId: string): RdfSyntax | undefined {
  return LANGUAGE_SYNTAX[languageId.toLowerCase()];
}

export function resolveRdfSyntax(input: { languageId?: string; fileName?: string }): RdfSyntax | undefined {
  return (input.languageId ? syntaxFromLanguageId(input.languageId) : undefined) ??
    (input.fileName ? syntaxFromPath(input.fileName) : undefined);
}

export function isSupportedRdfDocument(document: Pick<vscode.TextDocument, 'languageId' | 'fileName'>): boolean {
  return !!resolveRdfSyntax(document);
}
