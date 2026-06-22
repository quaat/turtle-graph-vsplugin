import * as vscode from 'vscode';
import { buildPreview } from './payload';
import { renderWebviewHtml } from '../webviewHtml';
import { updateDiagnostics } from '../diagnostics/turtleDiagnostics';
import { normalizeConfig, type ViewerConfig } from '../rdf/config';
import { isWebviewToExtension, type RevealTarget } from '../protocol/messages';
import { findStatementRef, findTokenLine } from '../rdf/sourceLocator';
import { localName } from '../rdf/compactIri';
import type { ExtensionToWebview } from '../protocol/messages';

const TURTLE_EXTENSIONS = ['.ttl', '.rdf', '.nt', '.nq', '.trig'];
const CHANGE_DEBOUNCE_MS = 300;

export function isTurtleDocument(document: vscode.TextDocument): boolean {
  if (document.languageId === 'turtle') {
    return true;
  }
  const name = document.fileName.toLowerCase();
  return TURTLE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function readConfig(): ViewerConfig {
  const cfg = vscode.workspace.getConfiguration('ttlGraphViewer');
  return normalizeConfig({
    refreshOnChange: cfg.get('refreshOnChange'),
    maxInitialNodes: cfg.get('maxInitialNodes'),
    preferredLabels: cfg.get('preferredLabels'),
  });
}

function tokenForId(id: string | undefined): string {
  if (!id) {
    return '';
  }
  return id.startsWith('_:') ? id.slice(2) : localName(id);
}

export class PreviewManager {
  private panel?: vscode.WebviewPanel;
  private docUri?: vscode.Uri;
  private debounce?: ReturnType<typeof setTimeout>;
  private lastMessage?: ExtensionToWebview;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly diagnostics: vscode.DiagnosticCollection,
  ) {}

  open(editor: vscode.TextEditor): void {
    this.docUri = editor.document.uri;
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'ttlGraph',
        'Turtle Graph',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
        },
      );
      this.panel.webview.html = renderWebviewHtml(this.panel.webview, this.context.extensionUri);
      this.panel.onDidDispose(
        () => {
          this.panel = undefined;
        },
        null,
        this.context.subscriptions,
      );
      this.panel.webview.onDidReceiveMessage(
        (message) => this.handleMessage(message),
        null,
        this.context.subscriptions,
      );
    } else {
      this.panel.reveal(vscode.ViewColumn.Beside);
    }
    this.render(editor.document);
  }

  private render(document: vscode.TextDocument): void {
    if (!this.panel) {
      return;
    }
    const config = readConfig();
    const { message, parsed } = buildPreview({
      text: document.getText(),
      config,
      sourceFile: document.uri.fsPath,
    });
    updateDiagnostics(this.diagnostics, document.uri, parsed.errors);
    this.lastMessage = message;
    void this.panel.webview.postMessage(message);
  }

  private activeDocument(): vscode.TextDocument | undefined {
    if (this.docUri) {
      const open = vscode.workspace.textDocuments.find(
        (d) => d.uri.toString() === this.docUri!.toString(),
      );
      if (open) {
        return open;
      }
    }
    return vscode.window.activeTextEditor?.document;
  }

  refreshFromActive(): void {
    const document = this.activeDocument();
    if (document) {
      this.render(document);
    }
  }

  handleDidSave(document: vscode.TextDocument): void {
    if (this.panel && this.docUri && document.uri.toString() === this.docUri.toString()) {
      this.render(document);
    }
  }

  handleDidChange(document: vscode.TextDocument): void {
    if (!this.panel || !this.docUri) {
      return;
    }
    if (document.uri.toString() !== this.docUri.toString()) {
      return;
    }
    if (!readConfig().refreshOnChange) {
      return;
    }
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    this.debounce = setTimeout(() => this.render(document), CHANGE_DEBOUNCE_MS);
  }

  handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!this.panel || !editor) {
      return;
    }
    if (isTurtleDocument(editor.document)) {
      this.docUri = editor.document.uri;
      this.render(editor.document);
    }
  }

  private handleMessage(raw: unknown): void {
    if (!isWebviewToExtension(raw)) {
      return;
    }
    if (raw.type === 'ready') {
      // The webview registered its message listener after we set the HTML; replay
      // the latest payload so the first graph is not lost to the load race.
      if (this.lastMessage && this.panel) {
        void this.panel.webview.postMessage(this.lastMessage);
      }
    } else if (raw.type === 'refresh') {
      this.refreshFromActive();
    } else if (raw.type === 'copy') {
      void vscode.env.clipboard.writeText(raw.text);
    } else if (raw.type === 'reveal') {
      void this.reveal(raw.target);
    }
  }

  private async reveal(target: RevealTarget): Promise<void> {
    const document = this.activeDocument();
    if (!document) {
      return;
    }
    const text = document.getText();
    let ref;
    if (target.kind === 'edge') {
      ref = findStatementRef(
        text,
        tokenForId(target.subject),
        localName(target.predicate ?? ''),
        tokenForId(target.object),
      );
    } else if (target.kind === 'literal') {
      ref = findTokenLine(text, [target.value ?? '']);
    } else {
      ref = findTokenLine(text, [tokenForId(target.subject)]);
    }
    if (!ref) {
      void vscode.window.showInformationMessage('Turtle Graph: source location not found.');
      return;
    }
    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    const line = Math.max(ref.line - 1, 0);
    const position = new vscode.Position(line, Math.max((ref.column ?? 1) - 1, 0));
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter,
    );
  }
}
