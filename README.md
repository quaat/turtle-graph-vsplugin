# Turtle Graph Viewer (`ttl-graph-viewer`)

An IDE-native VS Code extension that renders Turtle/RDF files as an interactive graph, lets you
inspect nodes and edges, and navigates back to the Turtle source.

This is the **MVP / first milestone**: a working local `.ttl` graph preview with clickable
nodes/edges and an inspector panel.

## Features

- **Command `Turtle Graph: Open Preview`** — parses the active Turtle document and opens a graph
  webview beside the editor.
- **Interactive graph** (Cytoscape.js) — pan/zoom, fit, reset layout, refresh.
- **Inspector** — click a node or edge to see IRIs, compact labels, RDF types, literal properties
  (with datatype/language), and incoming/outgoing edge counts. Copy IRI / compact name.
- **Search & predicate filter** — find nodes by label/IRI and filter edges by predicate.
- **Diagnostics** — Turtle parse errors are reported in the Problems panel and as a webview error
  state.
- **Live refresh** — re-renders on save, on Refresh, on active-editor change, and (debounced) on
  document change when `ttlGraphViewer.refreshOnChange` is enabled.
- **Best-effort source navigation** — `Reveal in Turtle` jumps to the most likely source line.
- **Bounded overview** — graphs larger than `ttlGraphViewer.maxInitialNodes` render a capped subset
  to avoid freezing.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `ttlGraphViewer.refreshOnChange` | `true` | Debounced refresh as the document changes. |
| `ttlGraphViewer.maxInitialNodes` | `500` | Node cap before a bounded overview is shown. |
| `ttlGraphViewer.preferredLabels` | `["rdfs:label","skos:prefLabel","dcterms:title"]` | Label predicates in priority order (CURIE or IRI). |

## Development

```bash
npm install
npm run build       # tsc (extension host) + vite (webview bundle)
npm run lint
npm test            # Vitest unit + component tests
```

### Run in the Extension Development Host

1. `npm run build`
2. Open this folder in VS Code and press **F5** (uses `.vscode/launch.json`).
3. In the new window, open a `.ttl` file and run **Turtle Graph: Open Preview** from the command
   palette.

### Manual verification checklist

- Open `test/fixtures/simple.ttl` → graph renders beside the editor.
- Click a node / edge → the inspector updates with details and literal datatype/language.
- Open `test/fixtures/invalid.ttl` → a diagnostic appears and the webview shows an error state.
- Edit and save a `.ttl` file → the graph refreshes.

## Limitations / known issues

- **Source navigation is best-effort.** RDF parsing does not expose exact source spans, so
  `Reveal in Turtle` uses token-based text search and may land on the first similar statement.
  Compact Turtle syntax, repeated triples, and complex blank-node structures can be imprecise.
- Graph rendering is not covered by automated VS Code UI tests; the manual checklist above is the
  source of truth for end-to-end behavior.
- Large graphs are capped to `maxInitialNodes`; full-graph exploration and a workspace index are
  planned for later phases.

## Scope

In scope (MVP): single-file Turtle preview, inspector, diagnostics, refresh, best-effort source
navigation. Out of scope for now: workspace indexing, Sculpin integration, SHACL/SPARQL, visual
diff, and exact source maps (see `plan.md`).
