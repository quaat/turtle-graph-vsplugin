import type { GraphModel, ParseError, SourceRef } from '../rdf/types';

export const PROTOCOL_VERSION = 1;
const MAX_TEXT_LENGTH = 1_000_000;
const MAX_EXPORT_PAYLOAD = 15_000_000;

export interface WebviewConfig { maxInitialNodes: number; }
export interface GraphMessage { type: 'graph'; version: number; model: GraphModel; sourceFile?: string; config: WebviewConfig; }
export interface ErrorMessage { type: 'error'; version: number; message: string; errors: ParseError[]; }
export type ExtensionToWebview = GraphMessage | ErrorMessage;

export interface RevealTarget {
  kind: 'node' | 'edge' | 'literal';
  subject?: string; predicate?: string; object?: string; value?: string; sourceRef?: SourceRef;
}

export type WebviewToExtension =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'reveal'; target: RevealTarget }
  | { type: 'copy'; text: string }
  | { type: 'export'; format: 'json' | 'png'; payload?: string };

export function buildGraphMessage(model: GraphModel, config: WebviewConfig, sourceFile?: string): GraphMessage {
  return { type: 'graph', version: PROTOCOL_VERSION, model, sourceFile, config };
}
export function buildErrorMessage(message: string, errors: ParseError[] = []): ErrorMessage {
  return { type: 'error', version: PROTOCOL_VERSION, message, errors };
}

function boundedString(value: unknown, max = MAX_TEXT_LENGTH): value is string {
  return typeof value === 'string' && value.length <= max;
}
function validSourceRef(value: unknown): value is SourceRef {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const ref = value as { line?: unknown; column?: unknown; file?: unknown };
  return typeof ref.line === 'number' && Number.isFinite(ref.line) && ref.line >= 1 &&
    (ref.column === undefined || (typeof ref.column === 'number' && ref.column >= 1)) &&
    (ref.file === undefined || boundedString(ref.file, 4096));
}
function validRevealTarget(target: unknown): target is RevealTarget {
  if (!target || typeof target !== 'object') return false;
  const t = target as RevealTarget;
  if (!validSourceRef(t.sourceRef)) return false;
  if (t.kind === 'node') return boundedString(t.subject ?? (t as { id?: unknown }).id, 4096);
  if (t.kind === 'edge') return boundedString(t.subject, 4096) && boundedString(t.predicate, 4096) && boundedString(t.object, 4096);
  if (t.kind === 'literal') return boundedString(t.subject, 4096) && boundedString(t.predicate, 4096) && boundedString(t.value, MAX_TEXT_LENGTH);
  return false;
}

export function isWebviewToExtension(value: unknown): value is WebviewToExtension {
  try {
    if (!value || typeof value !== 'object') return false;
    const message = value as { type?: unknown; text?: unknown; target?: unknown; format?: unknown; payload?: unknown };
    if (message.type === 'ready' || message.type === 'refresh') return true;
    if (message.type === 'copy') return boundedString(message.text);
    if (message.type === 'reveal') return validRevealTarget(message.target);
    if (message.type === 'export') {
      return (message.format === 'json' || message.format === 'png') &&
        (message.payload === undefined || boundedString(message.payload, MAX_EXPORT_PAYLOAD));
    }
    return false;
  } catch {
    return false;
  }
}
