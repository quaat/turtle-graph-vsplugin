import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('renderWebviewHtml', () => {
  it('defines a restrictive nonce-based CSP', () => {
    const source = readFileSync('src/webviewHtml.ts', 'utf8');
    expect(source).toContain("default-src 'none'");
    expect(source).toContain('Content-Security-Policy');
    expect(source).toContain('script nonce="${n}"');
    expect(source).toContain('style-src ${webview.cspSource}`');
    expect(source).not.toContain("'unsafe-inline'");
  });
});
