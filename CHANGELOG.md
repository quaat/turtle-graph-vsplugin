# Changelog

## [Unreleased]

### Added

- Initial MVP of the Turtle Graph Viewer extension.
- `Turtle Graph: Open Preview` command rendering a `.ttl` document as an interactive Cytoscape graph
  in a webview beside the editor.
- RDF parsing (N3.js) with structured, non-throwing parse errors and prefix extraction.
- Deterministic RDF-to-graph model: resource/blank nodes, object-property edges, literal properties,
  `rdf:type` badges, preferred-label selection, and a bounded overview for large graphs.
- Inspector panel for nodes and edges, including literal datatype/language, copy actions, search,
  and predicate filtering.
- Turtle parse diagnostics surfaced in the Problems panel and as a webview error state.
- Live refresh on save, active-editor change, manual refresh, and debounced document changes.
- Best-effort `Reveal in Turtle` source navigation.
- `ttlGraphViewer.refreshOnChange`, `ttlGraphViewer.maxInitialNodes`, and
  `ttlGraphViewer.preferredLabels` settings.
