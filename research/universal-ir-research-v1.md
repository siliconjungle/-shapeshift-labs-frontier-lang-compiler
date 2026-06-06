# Universal IR Research V1

Date: 2026-06-06

## Scope

This note harvests primary-source lessons from compiler IRs, language tooling
protocols, semantic indexes, language workbenches, and polyglot runtime
frameworks for Frontier Lang's universal AST and semantic merge model. It is
implementation-facing: the goal is to keep this facade as an orchestration
layer while parser, checker, projection, and proof authority stay in their
owning packages or host tools.

Local hooks read in this pass:

- `src/universal-dialect-layer.js`
- `src/semantic-import-layers.js`
- `src/semantic-import-regions.js`
- `src/internal/index-impl/createSemanticImportSidecarAdmission.js`
- `src/internal/index-impl/ExternalSemanticIndexFormats.js`
- `research/universal-ast-ecosystems-v3.md`
- `research/scip-lsif-glean-semantic-index.md`
- `research/universal-language-import-references.md`

## Primary-Source Lessons

| Ecosystem | Primary lesson | Frontier transfer | Merge-admission limit |
| --- | --- | --- | --- |
| MLIR | Operations are extensible through dialects; regions, block arguments, open types, attributes, and verifier traits let multiple abstraction levels coexist in one module. Region semantics are owned by the containing operation. | Keep `universalAst.layers` and `createUniversalDialectLayer` as the preservation path for language-specific constructs. Add lowering records and verifier/proof obligations instead of forcing every construct into a flat AST kind. | An MLIR-like dialect record is not proof that source syntax, macro expansion, type binding, or target lowering is valid. Admission needs source hash, adapter version, diagnostics, verifier status, and lowering evidence. |
| LLVM IR | LLVM IR is typed, SSA-based, low-level, equivalent across memory/bitcode/text forms, and guarded by verifier well-formedness. It also has target-sensitive undefined behavior, poison, memory, provenance, and metadata semantics. | Treat LLVM-like IR as a projection or low-level semantic layer, not the universal source AST. Use it for target lowering, optimizer evidence, debug/source-map metadata, and backend contracts. | LLVM IR erases high-level source shape and many merge anchors. It cannot approve source-level semantic merges without host checker evidence for memory model, aliasing, ABI, debug locations, and source-map fidelity. |
| GCC GENERIC/GIMPLE | GENERIC is a language-independent tree for whole functions; GIMPLE lowers it into a restrictive three-address form. High GIMPLE can retain containers; Low GIMPLE exposes control and exception jumps. Front ends can lower directly through hooks. | Model `irPhase` or `loweringStage` in dialect/lowering records: native syntax -> high semantic tree -> lowered three-address/control-flow form -> target projection. Preserve front-end hook identity as evidence. | A lowered form is useful for analysis but not source preservation. Merge admission must distinguish high-level syntax ownership from low-level optimizer facts and generated temporaries. |
| Tree-sitter | Tree-sitter produces concrete syntax trees with byte/point spans, named and anonymous nodes, field names, efficient tree cursors, incremental edits, included ranges for mixed-language files, and queryable `ERROR`/`MISSING` nodes. | Use Tree-sitter as the generic scanner tier for changed ranges, declarations, imports, calls, embedded-language slices, and syntax-loss evidence. Store grammar id/version, source hash, edit ranges, included ranges, errors, missing nodes, and query-pack id. | Tree-sitter is syntax evidence only. It does not prove symbols, types, overload binding, macro expansion, build-variant closure, or semantics-preserving rewrites. Default readiness should stay `needs-review` until compiler/index evidence upgrades it. |
| LSP and language servers | LSP exposes live JSON-RPC requests for definitions, references, document symbols, diagnostics, semantic tokens, rename, and code actions through negotiated capabilities. Results are snapshots over synchronized document versions. | Add or keep LSP imports as snapshot evidence: server name/version, workspace root, document URI/version, method, params hash, response hash, diagnostics, and capability set. Persist normalized results through `importExternalSemanticIndex`. | LSP responses are not a stable database unless captured and versioned. They can validate a merge candidate or refactor preview, but stale server state or missing capabilities should force review. |
| SCIP | SCIP indexes have metadata, documents, occurrences over source ranges, symbols, relationships, documentation, diagnostics, and snapshot-testing tooling. Sourcegraph recommends running the compiler pipeline through semantic analysis before emitting occurrences. | Continue mapping SCIP into documents, symbols, occurrences, relations, facts, source maps, ownership regions, and merge candidates. Require deterministic emission and snapshot evidence when host adapters produce SCIP. | SCIP is semantic index evidence, not lossless AST. It usually omits trivia, inactive branches, local parser recovery details, and target generated code. |
| LSIF | LSIF is a graph dump of LSP-like vertices and edges. Ranges act as request-sensitive areas and navigation targets; result sets and monikers link local ranges to package-level identities. | Keep LSIF graph identity as provenance on semantic relations. Use monikers/package information as strong cross-file and cross-package merge keys when present. | LSIF graph shape can be incomplete or tool-specific. Without monikers, stable symbol identity may be only range/result-set local and should not be promoted to global ownership. |
| SemanticDB | SemanticDB centers on `TextDocument`, ranges, symbols, symbol information, occurrences, diagnostics, signatures, annotations, synthetics, and language-specific mappings. Its spec notes limited official language coverage and missing compiler-version fields. | Treat SemanticDB as a Scala/Java semantic sidecar with rich type/signature facts. Record producer/compiler version separately because the payload model may not carry enough toolchain identity. | Symbols are not guaranteed globally unique in every category, macro implementation info is incomplete, and occurrence mappings are language-specific. Merge admission needs toolchain metadata and freshness checks. |
| Glean | Glean stores unique facts typed by versioned predicates; predicate keys can have values, and JSON batches can reference earlier fact ids or inline nested facts. Queryable predicate layers make large semantic stores composable. | Preserve Glean predicate, schema version, input fact id, assigned fact caveat, key/value, nested references, and source ranges as semantic facts. Use predicate/fact identity for reviewable merge keys, not just prose evidence. | Input ids are local to a JSON file and not final database ids. Facts without source ranges or schema provenance are useful for analysis but weak for source-addressable merge admission. |
| Rascal M3 | M3 models source analytics as typed relations over logical name locations and physical source locations: declarations, uses, containment, types, messages, documentation, modifiers, and language metadata. | Frontier semantic sidecars should stay relation-friendly. Store logical symbol ids and physical spans separately, and allow derived dependency facts from relation composition. | M3 facts are only as authoritative as the extractor/checker that populated them. Relation composition can infer dependencies, but cannot prove target rewrite correctness by itself. |
| Spoofax | SDF3 specifies syntax for parsing ASTs, highlighting, pretty printing, disambiguation, layout sensitivity, and recovery. Statix specifies static semantics with constraints and scope graphs; Stratego supplies rewrite rules and strategies. | Use Spoofax as a reference for separating syntax specs, static-semantic specs, and rewrite/lowering specs. A Frontier adapter should attach grammar/spec version, Statix constraint results, scope graph facts, and Stratego rewrite evidence as distinct records. | A rewrite rule or syntax spec does not prove semantic preservation unless the host workbench executed the constraints and transformation with recorded inputs, diagnostics, and open obligations. |
| Graal/Truffle | Truffle languages are interpreters over self-modifying ASTs. Specializations use guards, assumptions, caches, and re-specialization; InteropLibrary defines cross-language messages, source locations, scopes, metaobjects, identity, executable/member/array traits, and checked exceptions. | Model runtime and interop facts in `paradigmSemantics`: evaluation models, object models, reflection boundaries, interop messages, source locations, scopes, identities, and assumptions. Dynamic specialization evidence can explain runtime behavior but should be separate from static syntax. | Runtime specialization and interop traits do not imply static type proof or source rewrite safety. Admission needs host runtime evidence, exception/interop contracts, and any assumptions that could invalidate specialization. |

## Frontier Shape

The strongest common pattern is not one universal syntax taxonomy. It is a
layered, evidence-rich envelope:

1. Source layer: exact source text/hash, encoding, line endings, comments,
   directives, tokens/trivia, generated markers, inactive branches.
2. Native syntax layer: host AST/CST nodes, parser id/version, spans, recovery
   nodes, diagnostics, adapter coverage.
3. Semantic sidecar layer: symbols, occurrences, types, references, facts,
   diagnostics, relations, source maps, ownership regions, and patch hints.
4. Dialect and IR layer: MLIR-style dialect constructs, compiler IR phases,
   lowering records, verifier results, and loss records.
5. Proof and workbench layer: typechecker/prover/workbench obligations,
   assumptions, facts, constraints, scope graphs, rewrite evidence, and stale
   status.
6. Projection layer: target adapter output, generated ranges, source maps,
   target losses, emitted helper code, and backend verification.
7. Merge-history layer: before/after source hashes, region keys, semantic
   conflict keys, previous import/projection hashes, admission action, and
   readiness.

This aligns with current local surfaces: `createUniversalDialectLayer`,
`summarizeSemanticImportSidecarParadigmSemantics`,
`summarizeSemanticImportSidecarProofSpec`,
`semanticRegionMergePolicy`, and
`createSemanticImportSidecarAdmission`.

## Actionable Recommendations

1. Add an explicit `irPhase` or `loweringStage` field to dialect/lowering
   records when hosts provide MLIR, LLVM IR, GCC GENERIC/GIMPLE, workbench IR,
   or runtime AST evidence. Suggested values: `native-syntax`, `high-ir`,
   `semantic-ir`, `lowered-control-flow`, `ssa`, `target-ir`,
   `runtime-specialized`, `generated-output`.
2. Require all external IR imports to carry `producer`, `producerVersion`,
   `languageVersion`, `projectRoot`, `sourceHash`, `sourceMapCoverage`,
   `diagnosticCount`, and `freshness` metadata. For live LSP evidence, include
   document version and request/response hashes.
3. Extend semantic sidecar facts with stable provenance fields for
   `scipSymbol`, `lsifMoniker`, `semanticdbSymbol`, `gleanPredicate`,
   `gleanFactId`, `rascalLogicalLocation`, `spoofaxScope`, and
   `truffleInteropTrait` where present.
4. Keep Tree-sitter query packs as scanner adapters that produce region
   evidence and syntax losses. They should not upgrade readiness above
   `needs-review` without compiler, language-server, semantic-index, or proof
   evidence.
5. Add merge-admission warnings for phase mismatches: for example a patch that
   edits a source `body` region but only has LLVM IR evidence, or a target
   projection that has generated helper ranges without source-map provenance.
6. Treat workbench rewrites and Truffle specialization as evidence with
   assumptions. They can upgrade understanding of a change, but only a pinned
   checker/proof/runtime run over the same source hash should discharge merge
   obligations.
7. Prefer relation/fact storage over prose summaries for semantic sidecars.
   Rascal M3 and Glean both show that typed relations and predicates stay
   queryable, composable, and reviewable across large projects.

## Impossible Without Host Evidence

Frontier cannot soundly infer these from a universal AST envelope alone:

- Name binding, overload resolution, trait/interface implementation, macro
  expansion, generated-source provenance, source-generator output, compiler
  plugin effects, build-variant closure, conditional compilation, and package
  graph closure.
- Type inference, nullability, effect/control/dataflow facts, borrow/lifetime
  facts, memory/alias/provenance properties, concurrency semantics, runtime
  reflection, dynamic loading, and interop behavior.
- Semantics-preserving lowering into LLVM IR, GIMPLE, target source, or runtime
  bytecode without verifier/checker/proof evidence.
- Lossless source roundtrip without exact source text or token/trivia-preserving
  CST evidence.
- Automatic semantic merge admission when the only evidence is syntax ranges,
  stale language-server output, unversioned fact stores, or lowered IR without
  source maps.

## Short-Term Backlog

1. Add sidecar fixtures for one source file imported through Tree-sitter plus
   LSP/SCIP/SemanticDB/Glean evidence, and assert the admission ladder:
   syntax-only `needs-review`, semantic-index evidence `review` or `admit`
   depending on warnings, failed proof `reject-failed-proof`.
2. Add a small dialect/lowering fixture with two phases, such as
   `native-syntax -> lowered-control-flow`, and verify source-region patches do
   not become admissible from low-level IR alone.
3. Add provenance aliases for language-workbench and runtime evidence:
   `rascal-m3`, `spoofax-sdf3`, `spoofax-statix`, `spoofax-stratego`,
   `truffle-ast`, and `graal-interop`.
4. Add quality warnings for missing producer version, missing source hash,
   stale document version, missing source-map coverage, and unscoped generated
   output.
5. Keep parser/checker/projection implementation out of this facade; expose
   contracts for host packages to attach evidence that the facade can compose.

## Sources

- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/
- LLVM IR Language Reference: https://www.llvm.org/docs/LangRef.html
- GCC GENERIC internals: https://gcc.gnu.org/onlinedocs/gccint/GENERIC.html
- GCC GIMPLE internals: https://gcc.gnu.org/onlinedocs/gccint/GIMPLE.html
- GCC Tree SSA internals: https://gcc.gnu.org/onlinedocs/gccint/Tree-SSA.html
- Tree-sitter basic parsing: https://tree-sitter.github.io/tree-sitter/using-parsers/2-basic-parsing.html
- Tree-sitter advanced parsing: https://tree-sitter.github.io/tree-sitter/using-parsers/3-advanced-parsing.html
- Tree-sitter query syntax: https://tree-sitter.github.io/tree-sitter/using-parsers/queries/1-syntax.html
- LSP 3.17 specification: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
- LSIF index format: https://github.com/microsoft/language-server-protocol/blob/main/indexFormat/specification.md
- Sourcegraph SCIP indexer guide: https://sourcegraph.com/docs/code-navigation/writing-an-indexer
- SCIP protobuf schema: https://github.com/scip-code/scip/blob/main/scip.proto
- SemanticDB specification: https://scalameta.org/docs/semanticdb/specification.html
- Glean schema basics: https://glean.software/docs/schema/basic/
- Glean write docs: https://glean.software/docs/write/
- Rascal M3 core model: https://www.rascal-mpl.org/docs/Library/analysis/m3/Core/
- Spoofax SDF3 reference: https://spoofax.dev/references/sdf3/
- Spoofax Statix reference: https://spoofax.dev/references/statix/
- Spoofax Statix scope graphs: https://spoofax.dev/references/statix/scope-graphs/
- Spoofax Stratego rewrite rules: https://spoofax.dev/references/stratego/rewrite-rules/
- GraalVM Truffle language framework: https://www.graalvm.org/jdk22/graalvm-as-a-platform/language-implementation-framework/
- GraalVM Truffle InteropLibrary: https://www.graalvm.org/truffle/javadoc/com/oracle/truffle/api/interop/InteropLibrary.html
- GraalVM Truffle Specialization API: https://www.graalvm.org/truffle/javadoc/com/oracle/truffle/api/dsl/Specialization.html
