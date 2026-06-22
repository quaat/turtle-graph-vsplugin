import { runTests } from '@vscode/test-electron';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
await runTests({
  extensionDevelopmentPath: resolve(__dirname, '../..'),
  extensionTestsPath: resolve(__dirname, 'suite/index.js'),
  launchArgs: [resolve(__dirname, '../fixtures'), '--disable-workspace-trust'],
});
