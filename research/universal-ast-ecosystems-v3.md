# Universal AST Ecosystems V3

Date: 2026-06-06

## Scope

This note compares document IRs, compiler IRs, parser AST/CST ecosystems, semantic indexes, code property graphs, and language-server protocols as references for Frontier Lang's universal programming-language AST. It is intentionally implementation-facing: each reference is mapped to import layers, target adapters, source preservation, proof obligations, and semantic merge history.

## Source Snapshots

Primary references used:

- Pandoc filters and AST: https://pandoc.org/filters.html, https://pandoc.org/using-the-pandoc-api.html, https://hackage-content.haskell.org/package/pandoc-types-1.23.1/docs/Text-Pandoc-Definition.html
- MLIR language reference: https://mlir.llvm.org/docs/LangRef/
- LLVM IR language reference: https://llvm.org/docs/LangRef.html
- ESTree spec: https://github.com/estree/estree
- Babel parser and generator docs: https://babeljs.io/docs/babel-parser, https://babeljs.io/docs/babel-generator
- Roslyn compiler API model and syntax docs: https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/compiler-api-model, https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/work-with-syntax
- SwiftSyntax repo docs: https://github.com/swiftlang/swift-syntax
- Kotlin Analysis API and PSI docs: https://kotlin.github.io/analysis-api/fundamentals.html, https://plugins.jetbrains.com/docs/intellij/psi.html, https://plugins.jetbrains.com/docs/intellij/uast.html
- Tree-sitter repo and query docs: https://github.com/tree-sitter/tree-sitter, https://tree-sitter.github.io/tree-sitter/using-parsers/queries/1-syntax.html
- SCIP and LSIF: https://sourcegraph.com/docs/code-search/code-navigation/writing_an_indexer, https://github.com/sourcegraph/scip, https://github.com/microsoft/lsif-node, https://github.com/microsoft/language-server-protocol/blob/main/indexFormat/specification.md
- Glean facts and schema: https://glean.software/docs/schema/basic/, https://glean.software/docs/write/, https://glean.software/docs/schema/changing/
- CodeQL and CPG: https://codeql.github.com/docs/codeql-overview/about-codeql/, https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/, https://cpg.joern.io/
- Language Server Protocol 3.17: https://github.com/Microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/specification.md

Reference names captured where visible from the public docs: `pandoc-types-1.23.1`, LLVM `23.0.0git` LangRef, LSP `3.17` on `gh-pages`, SwiftSyntax `main`, `sourcegraph/scip` `main`, `microsoft/lsif-node` default branch, `microsoft/language-server-protocol` `main`/`gh-pages`, and `tree-sitter/tree-sitter` default branch. Exact upstream commit SHAs were not captured in this pass; use pinned commit URLs before promoting these references into a normative spec.

Local Frontier hooks read in this pass:

- `src/internal/index-impl/createUniversalAstFromDocument.js`
- `src/internal/index-impl/importExternalSemanticIndex.js`
- `src/internal/index-impl/createSemanticImportSidecar.js`
- `src/native-parser-ast-format-profiles.js`
- `src/universal-capability-matrix.js`
- `src/universal-dialect-layer.js`
- `src/semantic-import-layers.js`
- `src/semantic-import-regions.js`
- `research/universal-language-import-references.md`
- `research/scip-lsif-glean-semantic-index.md`

## Architectural Decision

Frontier should not define one flat "universal AST" that pretends all languages share one syntax tree. The durable shape should be a layered universal envelope:

1. Source layer: exact text, source hash, comments, whitespace, directives, generated-source markers, and token/trivia evidence when available.
2. Native syntax layer: parser-specific AST/CST nodes with stable native node ids, spans, diagnostics, and adapter coverage.
3. Semantic index layer: symbols, occurrences, references, types, diagnostics, facts, source maps, and ownership hints from compiler/indexer tools.
4. Dialect layer: MLIR-style language or domain constructs that are not safely lowered into the common semantic graph yet.
5. Proof and paradigm layer: contracts, invariants, type/control/dataflow/effect facts, macro/generator facts, runtime assumptions, and lowering evidence.
6. Projection layer: target adapter outputs, source maps, target losses, unsupported features, and generated-range evidence.
7. Merge-history layer: conflict keys, source hashes, semantic region taxonomy, readiness, proof status, and previous projection/import hashes.

That shape matches the current `createUniversalAstEnvelope`, dialect registry, semantic sidecar, source-preservation, native import loss, external semantic-index, and capability-matrix surfaces.

## Ecosystem Comparison

| Reference | Useful pattern | Do not copy blindly | Frontier implementation hook |
| --- | --- | --- | --- |
| Pandoc document IR | Reader/core/writer split. A typed intermediate `Pandoc Meta [Block]` model lets many document formats meet at one stable core. | Pandoc accepts conversion loss as normal for documents; programming-language imports need explicit proof/readiness before merge. | Keep source readers and target writers as adapters around the kernel. Use capability rows to report reader coverage, writer coverage, and unsupported constructs instead of expanding the facade into every language. |
| MLIR | Dialects, operations, regions, values, attributes, and verifiers let one IR host multiple abstraction levels without erasing domain semantics. | MLIR is compiler-IR-centric; it does not preserve arbitrary source trivia or language-server history by default. | Use `universalAst.layers` plus `createUniversalDialectLayer` for language-specific constructs, lowering records, and verifier/proof obligations. Do not lower macros, generated code, result builders, contracts, or DSL constructs until evidence exists. |
| LLVM IR | Typed SSA, modules, metadata, debug locations, and a clear target-lowering contract are strong for optimizer and backend work. | LLVM IR is intentionally low-level; using it as the universal programming AST would discard source structure, unresolved overloads, comments, language-specific semantics, and many merge anchors. | Treat LLVM-like IR as a projection target or low-level semantic layer only. Add proof obligations for memory model, undefined behavior, calling convention, aliasing, atomics, and debug/source-map fidelity. |
| ESTree and Babel | A shared JavaScript AST vocabulary plus parser options for locations, tokens, comments, error recovery, and source filenames is practical for tools. | Babel generator output shape is not guaranteed, and ESTree/Babel ASTs are syntax evidence, not complete type or control-flow proof. | Keep `estree` and `babel` as exact parser-AST import tiers. Require `sourceText` or token/trivia evidence for exact roundtrip; require TypeScript compiler or language-server/index evidence for symbols, types, and references. |
| Roslyn | Immutable syntax trees, full-fidelity tokens/trivia, diagnostics, symbols, semantic model, compilation, and emit are separated but composable. | A syntax tree alone does not prove nullable flow, overload binding, generated source, partial type stitching, analyzer semantics, or project-reference closure. | Continue modeling Roslyn syntax and semantic evidence separately. Add explicit evidence keys for `SemanticModel`, nullable context, source generators, directives, project references, analyzer diagnostics, and generated spans. |
| SwiftSyntax | Source-accurate SwiftSyntax trees preserve tokens/trivia and model missing/unexpected nodes. Swift macros are also SwiftSyntax-shaped. | SwiftSyntax is syntax-first; SourceKit, compiler type checking, macro expansion, package graph, and conditional compilation are separate evidence. | Use SwiftSyntax for CST/source preservation. Gate macro expansion, result builders, availability, conditional branches, generated nodes, and type facts behind SourceKit/compiler evidence and proof obligations. |
| Kotlin PSI | Kotlin exposes PSI syntax on top of IntelliJ PSI, while Analysis API supplies semantic information. PSI supports source ranges, error recovery, and IDE-grade edit context. | Kotlin syntax does not imply FIR/K2 analysis, compiler-plugin generated declarations, expect/actual matching, contracts, coroutine lowering, or build-variant closure. | Keep Kotlin PSI imports source-accurate but review-required unless Analysis API/FIR, build variant, compiler plugin, generated-source, and expect/actual evidence is attached. |
| Tree-sitter | Cross-language concrete syntax trees, incremental parsing, error nodes, and query packs make it a strong fallback scanner. | It is not a compiler. Grammar quality and query conventions vary, and names/types/references are language-specific or absent. | Use tree-sitter as the generic scanner tier for declarations, calls, imports, and rough changed-region anchoring. Keep readiness review-required until compiler/indexer evidence upgrades symbols, references, types, or control flow. |
| SCIP, LSIF, and Glean | Semantic indexes and fact stores carry project-wide symbols, occurrences, relationships, diagnostics, and source ranges without embedding every compiler in Frontier. | They are not lossless native ASTs and usually omit comments/trivia, exact edit trees, inactive code, unresolved syntactic constructs, and target code generation. | Keep `importExternalSemanticIndex` as the bridge. Map facts and occurrences to `SemanticIndexRecord`, source maps, ownership regions, merge candidates, and evidence. Add matrix profiles for `lsp`, `semanticdb`, and `glean` so capability reports show semantic-index coverage consistently with `scip` and `lsif`. |
| CodeQL and CPG | Queryable code databases/property graphs merge AST, CFG, dataflow, call, type, and security-analysis facts. They are excellent proof/evidence stores. | CodeQL database schemas are language-specific. CPG nodes are analysis graphs, not source-preserving projection ASTs. Security flow facts are not proof that a source rewrite is semantics-preserving. | Add optional `codeql`/`cpg` external-index formats that normalize AST/CFG/dataflow/call edges into semantic facts, relations, `paradigmSemantics`, and proof artifacts. Use them to block or upgrade merge readiness, not as target emitters. |
| LSP | A standard JSON-RPC surface exposes document symbols, definitions, references, hover, semantic tokens, diagnostics, rename, code actions, and call/type hierarchy from live tools. | LSP responses are snapshots from a server over synchronized documents; they are not a stable database unless versioned and captured with server metadata. | Treat LSP as live validation/import evidence. Store server name/version, workspace root, document URI/version, request method, response hash, and diagnostics. Use LSP for merge admission and refactor preview, then persist normalized semantic-index records. |

## Implementation Hooks

### Import Layers

- Keep parser/checker/projection logic in owning packages and let this facade compose imported evidence.
- Define an adapter-run envelope that always records parser/indexer name, version, language version, project root, source hash, generated-at time, and adapter coverage.
- Add semantic-index matrix profiles for `lsp`, `semanticdb`, and `glean`; add optional aliases for `codeql`, `codeql-db`, `cpg`, and `joern-cpg` as evidence-only external semantic formats.
- Require high-risk features to attach explicit evidence keys: macro expansion, conditional compilation, source generation, compiler plugins, partial declarations, reflection, runtime dynamic loading, overload/type inference, nullable/dataflow analysis, build variants, package/module graph, and analyzer diagnostics.
- Keep tree-sitter query packs per language as scanner adapters. A successful query pack should create declaration/call/import/effect regions and loss records, not lossless AST claims.

### Target Adapters

- Target adapters should consume the layered universal envelope, not only the semantic document. They need native source ids, source maps, dialect records, proof obligations, and loss summaries.
- Adapter outputs must return generated ranges and source-map links for declarations and generated helper code. Generated code without a source or generator-input map should be `needs-review`.
- Lowering from dialect-specific records to target code should include a lowering record with source dialect id, target construct, obligations discharged/open, losses, and tests/proofs used.
- LLVM-like low-level projections should be separate from source-language projections and should never claim source-preserving roundtrip by themselves.

### Source Preservation

- Use a four-tier source-preservation ladder: exact source text/hash, CST token/trivia, AST locations, semantic-index ranges. Only the first two can support source-preserving roundtrip claims.
- Store comments, whitespace, directives, shebangs, doc comments, generated markers, macro call sites, inactive branches, and original line endings as source evidence.
- Keep parser diagnostics and recovery/missing nodes as first-class losses. Error-tolerant syntax trees are useful for editing, but they should lower merge readiness until fixed or justified.

### Proof Obligations

- Syntax proof: parser version, source hash, diagnostics, exact AST/CST coverage, error recovery status.
- Semantic proof: symbol/reference/type/control-flow evidence, project graph closure, build flags, language version, and analyzer status.
- Source proof: exact source hash or token/trivia-preserving CST, source-map coverage, generated-range provenance.
- Lowering proof: dialect or semantic construct lowered to target, target feature support, unsupported feature losses, and verification command/test evidence.
- Merge proof: ownership region keys, before/after source hashes, stale checks, changed source maps, conflict class, and readiness classification.

### Semantic Merge History

- Region keys should stay source-addressable: `sourcePath`, normalized `regionKind`, symbol/fact id, and source hash. External facts may add stable ids such as SCIP symbol, LSIF moniker, Glean predicate/fact id, CodeQL relation id, or LSP document/version/request hash.
- Store changed-region projection metadata with before/after imports, source hashes, source-map links, dialect records, target projections, and proof-obligation status.
- Never treat a syntax merge as an automatic semantic merge. Tree-sitter, Roslyn/SwiftSyntax/Kotlin PSI, and source-preserving CSTs reduce conflict noise; semantic sidecars and proof status decide merge admission.

## Short-Term Backlog

1. Add parser AST/semantic-index profiles for `lsp`, `semanticdb`, and `glean`; add profile aliases for `codeql`/`cpg` as evidence-only formats.
2. Extend `importExternalSemanticIndex` with optional `codeql`/`cpg` normalizers that preserve AST, CFG, call, dataflow, and taint facts as semantic facts/relations plus `paradigmSemantics`.
3. Add LSP snapshot evidence helpers that capture request method, server/version, workspace root, document version, response hash, and diagnostic severity.
4. Add per-language tree-sitter query-pack fixtures that produce declaration/import/call/effect regions and verify that readiness remains review-required without compiler/indexer evidence.
5. Add target-adapter contract tests requiring generated-range source maps for helper code and explicit losses for dialect constructs that are not lowered.

## Bottom Line

The strongest reference model is Pandoc's adapter boundary plus MLIR's dialect/lowering discipline plus Roslyn/SwiftSyntax/Kotlin PSI source fidelity plus SCIP/Glean/CodeQL-style semantic evidence. Frontier's universal AST should be an evidence-rich layered envelope for merge admission and projection, not a single AST taxonomy that erases native syntax, source trivia, or unresolved semantics.
