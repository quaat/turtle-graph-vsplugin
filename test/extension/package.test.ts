import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('package scripts', () => {
  it('separates unit, extension-host, aggregate, and package validation scripts', () => {
    expect(pkg.scripts['test:unit']).toBe('vitest run');
    expect(pkg.scripts['test:extension']).toContain('@vscode/test-electron');
    expect(pkg.scripts['test:all']).toContain('npm run test:extension');
    expect(pkg.scripts['package:check']).toContain('@vscode/vsce ls');
  });
});
