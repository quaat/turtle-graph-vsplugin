import type { ParseError } from '../rdf/types';

export interface NormalizedDiagnostic {
  /** 0-based line for VS Code ranges. */
  line: number;
  /** 0-based start column. */
  column: number;
  /** 0-based end column (exclusive). */
  endColumn: number;
  message: string;
}

/** Convert parser errors into 0-based, range-friendly diagnostics. */
export function normalizeParseErrors(errors: ParseError[]): NormalizedDiagnostic[] {
  return errors.map((error) => {
    const line = Math.max((error.line ?? 1) - 1, 0);
    const column = Math.max((error.column ?? 1) - 1, 0);
    return {
      line,
      column,
      endColumn: column + 1,
      message: error.message,
    };
  });
}
