import type { WebviewToExtension } from '../protocol/messages';

export interface VsCodeApi {
  postMessage(message: WebviewToExtension): void;
}

declare global {
  // Provided by the VS Code webview runtime.
  function acquireVsCodeApi(): VsCodeApi;
}

export function getVsCodeApi(): VsCodeApi | undefined {
  return typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
}
