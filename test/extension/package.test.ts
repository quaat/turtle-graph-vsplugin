import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('extension manifest readiness', () => {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  it('registers the preview command and supported activation languages', () => {
    expect(manifest.contributes.commands.some((c: { command: string }) => c.command === 'ttlGraph.openPreview')).toBe(true);
    expect(manifest.activationEvents).toEqual(expect.arrayContaining([
      'onCommand:ttlGraph.openPreview', 'onLanguage:turtle', 'onLanguage:trig', 'onLanguage:ntriples', 'onLanguage:nquads',
    ]));
  });
  it('does not contribute rdf/xml as a supported language', () => {
    const extensions = manifest.contributes.languages.flatMap((l: { extensions: string[] }) => l.extensions);
    expect(extensions).toEqual(expect.arrayContaining(['.ttl', '.trig', '.nt', '.nq']));
    expect(extensions).not.toContain('.rdf');
  });
});
