import { describe, expect, it, vi } from 'vitest';
import { PreviewManager } from '../src/commands/openPreview';

vi.mock('vscode', () => ({
  window: {
    createWebviewPanel: vi.fn(() => ({
      webview: { html: '', postMessage: vi.fn(), onDidReceiveMessage: vi.fn(), asWebviewUri: vi.fn((uri) => uri) },
      onDidDispose: vi.fn(),
      reveal: vi.fn(),
    })),
    showWarningMessage: vi.fn(async () => undefined),
    setStatusBarMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({ get: vi.fn((key: string) => key === 'maxFileBytes' ? 1 : undefined) })),
  },
  Uri: { joinPath: vi.fn(() => ({})), file: vi.fn((fsPath: string) => ({ fsPath })) },
  ViewColumn: { Beside: 2 },
}));

import * as vscode from 'vscode';

describe('large-file parse confirmation', () => {
  it('cancels parsing visibly and leaves the previous graph intact', async () => {
    const manager = new PreviewManager({ extensionUri: {}, subscriptions: [] } as never, { set: vi.fn() } as never);
    const editor = { document: { uri: { toString: () => 'file:///large.ttl' }, getText: () => '@prefix ex: <http://example.org/> .\nex:a ex:b ex:c .', fileName: 'large.ttl', languageId: 'turtle' } } as never;
    manager.open(editor);
    await Promise.resolve();
    expect(vscode.window.showWarningMessage).toHaveBeenCalled();
    expect(vscode.window.setStatusBarMessage).toHaveBeenCalledWith(expect.stringMatching(/parsing cancelled/i), 5000);
    const panel = vi.mocked(vscode.window.createWebviewPanel).mock.results[0].value;
    expect(panel.webview.postMessage).not.toHaveBeenCalled();
  });
});
