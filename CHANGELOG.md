# Changelog

## 0.1.1 - Unreleased

- Added VS Code Extension Host test harness coverage for activation, command execution, diagnostics, refresh safety, unsupported RDF/XML policy, and source-position behavior.
- Wired safe graph layout configuration through extension messages into the webview canvas and reset layout action.
- Hardened PNG export payload validation before writing files.
- Added visible large-file parse cancellation behavior.
- Added CI package validation and release workflow documentation for VSIX artifacts.

## 0.1.0

- Hardened supported RDF formats to Turtle, TriG, N-Triples, and N-Quads.
- Removed implied `.rdf` / RDF/XML support.
- Added format-aware parser selection, stricter protocol validation, export controls, richer inspector details, bounded graph/model handling, keyboard-accessible lists, packaging scripts, and CI configuration.
