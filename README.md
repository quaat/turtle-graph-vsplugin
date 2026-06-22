# Turtle Graph Viewer

`ttl-graph-viewer` is a VS Code extension for visualizing local RDF files as an interactive graph. It keeps the MVP architecture intentionally small: the extension host parses RDF with `n3`, builds a typed graph model, sends typed protocol messages to a React/Vite webview, and renders the graph with Cytoscape plus an inspector and source navigation.

## Supported formats

This production-hardening pass supports syntaxes that `n3` can parse reliably:

| Extension | Syntax |
| --- | --- |
| `.ttl` | Turtle |
| `.trig` | TriG |
| `.nt` | N-Triples |
| `.nq` | N-Quads |

`.rdf` / RDF/XML is intentionally **not supported**. RDF/XML requires a different parser and is future scope.

## Features

- Open the **Turtle Graph: Open Preview** command for supported RDF documents.
- Format-aware parsing and diagnostics for Turtle, TriG, N-Triples, and N-Quads.
- Graph canvas with search, predicate filtering, fit, reset layout, and refresh controls.
- Toggle literal properties in the inspector.
- Export JSON through a save dialog.
- Export PNG from the current Cytoscape canvas through a save dialog.
- Inspector details for nodes, blank nodes, predicates, source lines, literal values, named graphs, and reconstructed raw edge statements.
- Reveal-source actions prefer stored source references and fall back to best-effort token search.
- Keyboard-accessible fallback lists for visible nodes and edges.
- Theme-aware CSS using VS Code color variables for light, dark, and high-contrast themes.

## Large-file behavior

The extension is bounded by configuration:

- `ttlGraphViewer.maxInitialNodes` (default `500`) limits initially rendered nodes.
- `ttlGraphViewer.maxFileBytes` (default `2000000`) warns before parsing very large files.
- `ttlGraphViewer.maxTriples` (default `20000`) bounds model-building input for an overview.
- `ttlGraphViewer.layout` (default `cose`) records the intended graph layout.

When the graph is truncated, the webview shows rendered and total node/edge/triple counts. Node selection favors typed classes/properties, then high-degree nodes, then deterministic IDs instead of simple lexicographic first-N selection.

## Current limitations

- RDF/XML (`.rdf`) is unsupported.
- Source navigation is best effort; it uses stored line references where available and token search otherwise, not a full RDF source map.
- SVG export is deferred to avoid adding a large dependency.
- Full graphical assertions for Cytoscape rendering remain manual; React/jsdom tests cover UI behavior where practical.
- Sculpin-specific behavior is planned future scope and is not implemented in this extension yet.

## Development

```bash
npm install
npm run lint
npm run build
npm test
npm run test:extension
```

Package locally with:

```bash
npm run package
```

The package script uses `npx --yes @vscode/vsce package`; it requires registry access to download `@vscode/vsce` if it is not already cached.

## Manual verification checklist

1. Open a `.ttl`, `.trig`, `.nt`, and `.nq` file and run **Turtle Graph: Open Preview**.
2. Confirm `.rdf` is not treated as supported.
3. Confirm invalid Turtle produces diagnostics and an error message.
4. Use search and predicate filtering.
5. Select nodes and edges from both the canvas and accessible lists.
6. Toggle literal properties.
7. Export JSON and PNG and confirm VS Code prompts for save locations.
8. Use reveal-source from node, literal, and edge inspector entries.
9. Try a file larger than `ttlGraphViewer.maxFileBytes` and confirm the warning prompt.

## Packaging and CI

The repository includes `vscode:prepublish`, `.vscodeignore`, and a GitHub Actions workflow that runs:

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm test`

Do not publish to the Marketplace from this repository without a separate release review.
