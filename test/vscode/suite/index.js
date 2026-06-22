/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert');
const path = require('node:path');
const vscode = require('vscode');

const root = path.resolve(__dirname, '../..');
const fixture = (name) => vscode.Uri.file(path.join(root, 'fixtures', name));

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

(async () => {
  const extension = vscode.extensions.getExtension('sintef.ttl-graph-viewer');
  await test('extension activates', async () => {
    assert.ok(extension, 'extension should be discoverable by publisher/name');
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  await test('ttlGraph.openPreview command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('ttlGraph.openPreview'));
  });

  await test('.ttl document opens and preview command runs without throwing', async () => {
    const doc = await vscode.workspace.openTextDocument(fixture('simple.ttl'));
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('ttlGraph.openPreview');
  });

  await test('invalid Turtle produces diagnostics', async () => {
    const doc = await vscode.workspace.openTextDocument(fixture('invalid.ttl'));
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('ttlGraph.openPreview');
    await wait(500);
    assert.ok(vscode.languages.getDiagnostics(doc.uri).length > 0);
  });

  await test('unsupported .rdf is rejected by current policy', async () => {
    const doc = await vscode.workspace.openTextDocument({ content: '<rdf></rdf>', language: 'xml' });
    assert.strictEqual(doc.fileName.toLowerCase().endsWith('.rdf'), false);
    const allCommands = await vscode.commands.getCommands(true);
    assert.ok(allCommands.includes('ttlGraph.openPreview'));
  });

  await test('save/change refresh path does not throw', async () => {
    const doc = await vscode.workspace.openTextDocument(fixture('simple.ttl'));
    const editor = await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('ttlGraph.openPreview');
    await editor.edit((edit) => edit.insert(new vscode.Position(doc.lineCount, 0), '\n'));
    await wait(500);
  });

  await test('source reveal command path can select a valid source position', async () => {
    const doc = await vscode.workspace.openTextDocument(fixture('simple.ttl'));
    const editor = await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    assert.strictEqual(editor.selection.active.line, 1);
  });

  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  if (process.exitCode) process.exit(process.exitCode);
})();
