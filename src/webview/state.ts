import type { ExtensionToWebview } from '../protocol/messages';
import type { GraphModel, ParseError } from '../rdf/types';

export type Selection = { kind: 'node' | 'edge'; id: string } | null;
export type Status = 'loading' | 'graph' | 'empty' | 'error';

export interface AppState {
  status: Status;
  model?: GraphModel;
  errorMessage?: string;
  errors: ParseError[];
  selection: Selection;
  query: string;
  predicate: string;
  sourceFile?: string;
}

export type AppAction =
  | { type: 'message'; message: ExtensionToWebview }
  | { type: 'select'; selection: Selection }
  | { type: 'query'; query: string }
  | { type: 'predicate'; predicate: string };

export const initialState: AppState = {
  status: 'loading',
  errors: [],
  selection: null,
  query: '',
  predicate: '',
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'message': {
      const message = action.message;
      if (message.type === 'error') {
        return {
          ...state,
          status: 'error',
          errorMessage: message.message,
          errors: message.errors,
          model: undefined,
          selection: null,
        };
      }
      const model: GraphModel = message.model;
      return {
        ...state,
        status: model.nodes.length === 0 ? 'empty' : 'graph',
        model,
        errorMessage: undefined,
        errors: [],
        selection: null,
        sourceFile: message.sourceFile,
      };
    }
    case 'select':
      return { ...state, selection: action.selection };
    case 'query':
      return { ...state, query: action.query };
    case 'predicate':
      return { ...state, predicate: action.predicate };
    default:
      return state;
  }
}
