import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// jsdom's import.meta.url is not a file:// URL, so resolve fixtures from the project root.
export function fixture(name: string): string {
  return readFileSync(join(process.cwd(), 'test', 'fixtures', name), 'utf8');
}
