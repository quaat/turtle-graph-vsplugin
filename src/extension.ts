import * as vscode from 'vscode';
import { PreviewManager, isTurtleDocument } from './commands/openPreview';
import { createDiagnosticCollection } from './diagnostics/turtleDiagnostics';

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = createDiagnosticCollection();
  context.subscriptions.push(diagnostics);

  const manager = new PreviewManager(context, diagnostics);

  context.subscriptions.push(
    vscode.commands.registerCommand('ttlGraph.openPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showInformationMessage(
          'Turtle Graph: open a Turtle (.ttl) file first.',
        );
        return;
      }
      if (!isTurtleDocument(editor.document)) {
        void vscode.window.showWarningMessage(
          'Turtle Graph: the active editor is not a recognized Turtle/RDF file.',
        );
      }
      manager.open(editor);
    }),
    vscode.workspace.onDidSaveTextDocument((document) => manager.handleDidSave(document)),
    vscode.workspace.onDidChangeTextDocument((event) => manager.handleDidChange(event.document)),
    vscode.window.onDidChangeActiveTextEditor((editor) =>
      manager.handleActiveEditorChange(editor),
    ),
  );
}

export function deactivate(): void {
  // Subscriptions are disposed by VS Code via context.subscriptions.
}
