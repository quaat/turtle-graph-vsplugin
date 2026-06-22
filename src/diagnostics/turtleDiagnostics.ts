import * as vscode from 'vscode';
import { normalizeParseErrors } from './normalize';
import type { ParseError } from '../rdf/types';

export function createDiagnosticCollection(): vscode.DiagnosticCollection {
  return vscode.languages.createDiagnosticCollection('ttlGraph');
}

export function updateDiagnostics(
  collection: vscode.DiagnosticCollection,
  uri: vscode.Uri,
  errors: ParseError[],
): void {
  if (errors.length === 0) {
    collection.delete(uri);
    return;
  }
  const diagnostics = normalizeParseErrors(errors).map((d) => {
    const range = new vscode.Range(d.line, d.column, d.line, d.endColumn);
    return new vscode.Diagnostic(range, d.message, vscode.DiagnosticSeverity.Error);
  });
  collection.set(uri, diagnostics);
}
