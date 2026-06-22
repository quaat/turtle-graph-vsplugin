import type { GraphModel, ParseError } from '../rdf/types';

export const PROTOCOL_VERSION = 1;

export interface WebviewConfig {
  maxInitialNodes: number;
}

export interface GraphMessage {
  type: 'graph';
  version: number;
  model: GraphModel;
  sourceFile?: string;
  config: WebviewConfig;
}

export interface ErrorMessage {
  type: 'error';
  version: number;
  message: string;
  errors: ParseError[];
}

export type ExtensionToWebview = GraphMessage | ErrorMessage;

export interface RevealTarget {
  kind: 'node' | 'edge' | 'literal';
  /** Identifying values used by the best-effort source locator. */
  subject?: string;
  predicate?: string;
  object?: string;
  value?: string;
}

export type WebviewToExtension =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'reveal'; target: RevealTarget }
  | { type: 'copy'; text: string };

export function buildGraphMessage(
  model: GraphModel,
  config: WebviewConfig,
  sourceFile?: string,
): GraphMessage {
  return { type: 'graph', version: PROTOCOL_VERSION, model, sourceFile, config };
}

export function buildErrorMessage(message: string, errors: ParseError[] = []): ErrorMessage {
  return { type: 'error', version: PROTOCOL_VERSION, message, errors };
}

export function isWebviewToExtension(value: unknown): value is WebviewToExtension {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  if (type === 'ready' || type === 'refresh') {
    return true;
  }
  if (type === 'copy') {
    return typeof (value as { text?: unknown }).text === 'string';
  }
  if (type === 'reveal') {
    const target = (value as { target?: unknown }).target;
    return (
      !!target &&
      typeof target === 'object' &&
      ['node', 'edge', 'literal'].includes((target as { kind?: unknown }).kind as string)
    );
  }
  return false;
}
