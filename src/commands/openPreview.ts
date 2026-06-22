import * as vscode from 'vscode';
import { buildPreview } from './payload';
import { renderWebviewHtml } from '../webviewHtml';
import { updateDiagnostics } from '../diagnostics/turtleDiagnostics';
import { normalizeConfig, type ViewerConfig } from '../rdf/config';
import { isSupportedRdfDocument, resolveRdfSyntax } from '../rdf/syntax';
import { isWebviewToExtension, type RevealTarget } from '../protocol/messages';
import { findStatementRef, findTokenLine } from '../rdf/sourceLocator';
import { localName } from '../rdf/compactIri';
import { decodePngDataUri } from '../exportPayload';
import type { ExtensionToWebview } from '../protocol/messages';

const CHANGE_DEBOUNCE_MS = 300;

export function isTurtleDocument(document: vscode.TextDocument): boolean {
  return isSupportedRdfDocument(document);
}

function readConfig(): ViewerConfig {
  const cfg = vscode.workspace.getConfiguration('ttlGraphViewer');
  return normalizeConfig({
    refreshOnChange: cfg.get('refreshOnChange'),
    maxInitialNodes: cfg.get('maxInitialNodes'),
    preferredLabels: cfg.get('preferredLabels'),
    maxFileBytes: cfg.get('maxFileBytes'),
    maxTriples: cfg.get('maxTriples'),
    layout: cfg.get('layout'),
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
          if (this.debounce) clearTimeout(this.debounce);
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
    void this.render(editor.document);
  }

  private async render(document: vscode.TextDocument): Promise<void> {
    if (!this.panel) {
      return;
    }
    const config = readConfig();
    const bytes = Buffer.byteLength(document.getText(), 'utf8');
    if (bytes > config.maxFileBytes) {
      const answer = await vscode.window.showWarningMessage(
        `Turtle Graph: ${document.fileName} is ${bytes.toLocaleString()} bytes, above the configured ${config.maxFileBytes.toLocaleString()} byte limit. Parsing is synchronous and may temporarily block the extension host. Continue parsing?`,
        { modal: true },
        'Continue',
      );
      if (answer !== 'Continue') {
        void vscode.window.setStatusBarMessage('Turtle Graph: parsing cancelled; keeping the previous graph.', 5000);
        return;
      }
    }
    const { message, parsed } = buildPreview({
      text: document.getText(),
      config,
      sourceFile: document.uri.fsPath,
      languageId: document.languageId,
      syntax: resolveRdfSyntax(document),
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
      void this.render(document);
    }
  }

  handleDidSave(document: vscode.TextDocument): void {
    if (this.panel && this.docUri && document.uri.toString() === this.docUri.toString()) {
      void this.render(document);
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
    this.debounce = setTimeout(() => void this.render(document), CHANGE_DEBOUNCE_MS);
  }

  handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!this.panel || !editor) {
      return;
    }
    if (isTurtleDocument(editor.document)) {
      this.docUri = editor.document.uri;
      void this.render(editor.document);
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
    } else if (raw.type === 'export') {
      void this.exportGraph(raw.format, raw.payload);
    }
  }

  private async exportGraph(format: 'json' | 'png', payload?: string): Promise<void> {
    const document = this.activeDocument();
    const panel = this.panel;
    if (!document || !panel) return;
    const base = document.uri.path.split('/').pop()?.replace(/\.[^.]+$/, '') || 'ttl-graph';
    const defaultUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd()), `${base}.${format}`);
    const target = await vscode.window.showSaveDialog({ defaultUri, filters: format === 'json' ? { JSON: ['json'] } : { PNG: ['png'] } });
    if (!target) return;
    try {
      const bytes = format === 'png'
        ? decodePngDataUri(payload)
        : Buffer.from(JSON.stringify(this.lastMessage?.type === 'graph' ? this.lastMessage.model : {}, null, 2), 'utf8');
      await vscode.workspace.fs.writeFile(target, bytes);
      void vscode.window.showInformationMessage(`Turtle Graph: exported ${format.toUpperCase()} to ${target.fsPath}.`);
    } catch (error) {
      void vscode.window.showErrorMessage(`Turtle Graph: export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async reveal(target: RevealTarget): Promise<void> {
    const document = this.activeDocument();
    if (!document) {
      return;
    }
    const text = document.getText();
    let ref = target.sourceRef;
    if (!ref && target.kind === 'edge') {
      ref = findStatementRef(
        text,
        tokenForId(target.subject),
        localName(target.predicate ?? ''),
        tokenForId(target.object),
      );
    } else if (!ref && target.kind === 'literal') {
      ref = findTokenLine(text, [target.value ?? '']);
    } else if (!ref) {
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
