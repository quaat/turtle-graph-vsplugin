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
- `ttlGraphViewer.layout` (default `cose`) selects the graph layout. Supported safe values are `cose`, `grid`, `circle`, `breadthfirst`, and `concentric`; unknown values are normalized to `cose`.

When the graph is truncated, the webview shows rendered and total node/edge/triple counts. Node selection favors typed classes/properties, then high-degree nodes, then deterministic IDs instead of simple lexicographic first-N selection.

## Current limitations

- RDF/XML (`.rdf`) is unsupported.
- Source navigation is best effort; it uses stored line references where available and token search otherwise, not a full RDF source map.
- SVG export is deferred to avoid adding a large dependency.
- Full graphical assertions for Cytoscape rendering remain manual; React/jsdom tests cover UI behavior where practical.
- Sculpin-specific behavior is planned future scope and is not implemented in this extension yet.

## Production installation

The extension identifier is `sintef.ttl-graph-viewer` (`publisher` + `name` from `package.json`).

### Install from GitHub Releases

Download `ttl-graph-viewer-<version>.vsix` from a GitHub Release, then run:

```bash
code --install-extension ttl-graph-viewer-<version>.vsix
code --list-extensions | grep ttl-graph-viewer
```

Uninstall with:

```bash
code --uninstall-extension sintef.ttl-graph-viewer
```

### Install from a locally built VSIX

```bash
npm ci
npm run package
code --install-extension ./ttl-graph-viewer-<version>.vsix
```

Upgrade an installed VSIX with:

```bash
code --install-extension ttl-graph-viewer-<new-version>.vsix --force
```

## Development mode

```bash
npm ci
npm run lint
npm run build
npm run test:unit
npm run test:extension
```

## Release build

```bash
npm ci
npm run lint
npm run build
npm run test:unit
npm run test:extension
npm run package
npm run package:check
```

Expected VSIX contents include `package.json`, `README.md`, `CHANGELOG.md`, `out/**`, and `dist/webview/**`; source, tests, CI files, coverage, `node_modules`, source maps, and `plan.md` are excluded. The generated filename pattern is `ttl-graph-viewer-<version>.vsix`.

### Maintainer versioning

```bash
npm version patch
npm version minor
npm version major
git push --follow-tags
```

Pushing a tag such as `v0.1.1` triggers the release workflow. The workflow builds and uploads a VSIX artifact and creates or updates the GitHub Release for tag builds. Marketplace and Open VSX publishing are future scope unless publisher secrets are added and reviewed.

## Production verification checklist

1. Open VS Code.
2. Open a `.ttl`, `.trig`, `.nt`, or `.nq` file.
3. Run **Turtle Graph: Open Preview**.
4. Confirm graph renders.
5. Confirm inspector works.
6. Confirm invalid Turtle creates diagnostics.
7. Confirm JSON/PNG export works.
8. Confirm `.rdf` is not treated as supported.

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

CI runs on pushes and pull requests with `npm ci`, lint, build, unit tests, VS Code Extension Host tests under `xvfb-run`, package creation, and package content validation. Release CI runs on manual dispatch and `v*` tags, uploads `ttl-graph-viewer-<version>.vsix`, and attaches it to tag releases.

## Known production limitations

- RDF/XML (`.rdf`) is unsupported.
- Large files may still block the extension host after the user confirms synchronous parsing.
- Source navigation is best-effort.
- Sculpin integration is future scope.
- Marketplace/Open VSX publishing is not yet configured.
