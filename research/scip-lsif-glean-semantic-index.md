# SCIP, LSIF, and Glean Semantic Index Mapping

Date: 2026-06-06

## Scope

This note maps public SCIP, LSIF, and Glean fact models into Frontier Lang's `importExternalSemanticIndex` pipeline. The goal is to preserve external semantic evidence as documents, symbols, occurrences, relations, facts, source-map links, ownership hints, and merge-admission candidates without making the facade own each ecosystem's parser or checker.

## Source Model Summary

- SCIP: Sourcegraph's indexer guide describes a top-level `Index` with metadata and documents. Each document has a project-root-relative path, occurrences attached to source ranges, and symbols defined in that document.
- LSIF: the language-server index format is a graph of vertices and edges. Documents contain ranges; ranges connect through result sets, monikers, and definition/reference/declaration result edges.
- Glean: Glean stores predicate-typed facts with ids, keys, and optional values. JSON write batches group facts by predicate; schema evolution uses versioned schemas or new predicates when compatibility changes.

## Frontier Mapping

| Frontier surface | SCIP mapping | LSIF mapping | Glean mapping |
| --- | --- | --- | --- |
| Documents | `Document.relative_path`, language, metadata project root, text encoding, optional source hash. | `document` vertices with `uri` and `languageId`; fallback to caller source path for memory dumps. | File-like fields in fact keys/values, grouped into one document per normalized path. |
| Symbols | `SymbolInformation.symbol`, display name, kind, signature docs, and document-local symbols. | Moniker identifiers when present; otherwise stable result-set/range ids. | Fact key names, declaration/function/class/module predicates, and relation targets become `glean` symbols. |
| Occurrences | `Occurrence.symbol`, role bitset, syntax kind, diagnostics, and packed or typed ranges. | `range` vertices become definition or reference occurrences through item edges. | Facts with source ranges become definition/reference/import occurrences using predicate-name heuristics. |
| Relations | `SymbolInformation.relationships` become definition, reference, implementation, type, or related edges. | Definition/reference/declaration edges are retained as graph relations; next/moniker edges inform symbol identity. | Callee/target/parent fields become `calls`, `extends`, or `references` relations. |
| Facts | Documentation, signatures, relationships, diagnostics, and ownership-region hints become semantic facts. | Raw graph metadata is kept on relation records; hover/diagnostic imports are next hooks. | Predicate/key/value records are preserved as semantic facts with schema/fact-id metadata. |
| Source maps | Occurrences with spans become source-map mappings. | Range vertices with document containment become mappings. | Fact ranges become mappings; per-file hashes are carried from fact file keys when present. |
| Merge candidates | Symbols plus ownership facts define semantic conflict keys. | Moniker-backed symbols are strong cross-file/cross-repo merge anchors. | Predicate/fact id plus file/range forms a stable candidate for fact-store-driven merge review. |

## Current Hooks

- `src/internal/index-impl/importExternalSemanticIndex.js` creates the semantic index record, source-map records, universal AST envelope, evidence, normalized losses, readiness, and summary.
- `normalizeScipPayload.js` imports SCIP documents, symbols, occurrences, relationships, diagnostics, generated-role losses, and symbol facts.
- `normalizeLsifPayload.js` imports LSIF document/range/moniker basics and definition/reference/declaration graph edges.
- `normalizeGleanPayload.js` imports Glean predicate facts into documents, symbols, occurrences, relations, and fact records.
- `externalSemanticSourceMapMappings.js` converts occurrence spans into source-map mappings and carries ownership-region metadata when symbols provide it.

## Implementation Update

This pass added dependency-free support for Glean JSON write-batch payloads shaped as:

```json
[
  {
    "predicate": "typescript.FunctionDeclaration.1",
    "facts": [{ "id": 1, "key": { "name": "loadUser" } }]
  }
]
```

The normalizer expands each predicate group into individual Frontier semantic facts, and format inference recognizes arrays of predicate fact groups as `glean`. Existing `facts`, `results`, `predicates`, and `factsByPredicate` payload shapes remain supported.

## References

- Sourcegraph SCIP indexer guide: https://sourcegraph.com/docs/code-navigation/writing-an-indexer
- SCIP protobuf schema: https://github.com/sourcegraph/scip/blob/main/scip.proto
- LSIF index-format specification: https://github.com/microsoft/language-server-protocol/blob/main/indexFormat/specification.md
- LSIF protocol vertex/edge definitions: https://github.com/microsoft/lsif-node/blob/main/protocol/src/protocol.ts
- Glean schema basics: https://glean.software/docs/schema/basic/
- Glean Thrift/JSON mapping: https://glean.software/docs/schema/thrift/
- Glean JSON writing docs: https://glean.software/docs/write/
- Glean schema evolution docs: https://glean.software/docs/schema/changing/

## Next Hooks

- LSIF: consume `range.tag` metadata to refine symbol names, kinds, declaration roles, and ownership-region kinds when result-set/item edges are absent.
- SCIP: preserve `Metadata.tool_info`, document embedded `text`, and typed enclosing ranges as evidence/source-preservation metadata.
- Glean: support expanded nested fact references by resolving `{ "id": N }` references inside one JSON batch before deriving relations.
- Merge admission: expose a compact semantic merge-candidate summary from external semantic imports, keyed by format, document path, symbol id, predicate, and range.
