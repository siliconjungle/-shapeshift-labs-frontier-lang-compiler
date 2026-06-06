# Universal Language Import References

Date: 2026-06-05

This note harvests sources for Frontier Lang's universal import goal: preserve source truth, import native language structure into a semantic Frontier graph, classify loss/readiness, and project back to target-language AST/code.

## Reference Families

- Pandoc: https://pandoc.org/
  - Transfer: use a stable, typed intermediate document/program model with many readers and writers. Frontier Lang should follow the reader/kernel/writer split rather than hard-code every language into one package.
- Babel parser and generator: https://babel.dev/docs/babel-parser and https://babel.dev/docs/babel-generator
  - Transfer: parser options for tokens/comments and generator source-shape preservation show why Frontier imports need explicit source preservation, token/trivia evidence, and projection-readiness status.
- Tree-sitter queries: https://tree-sitter.github.io/tree-sitter/cli/query.html
  - Transfer: a broad, language-neutral declaration/call/effect harvesting layer can use grammar-specific query packs. Tree-sitter is not enough for full semantic import, but it is a practical scanner adapter tier.
- LibCST: https://libcst.readthedocs.io/en/latest/nodes.html
  - Transfer: concrete syntax trees are the right model for lossless edit/roundtrip paths. Frontier's source-preservation records should remain first-class alongside AST semantics.
- MLIR language reference: https://mlir.llvm.org/docs/LangRef/
  - Transfer: dialects make a universal IR extensible without flattening every language feature into one lowest-common-denominator AST. Frontier should treat language-specific constructs as dialect/extern records that can lower into portable semantic regions when proven.
- Roslyn syntax model: https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/work-with-syntax
  - Transfer: immutable syntax trees, symbol tables, semantic models, and emit APIs are separate evidence layers. Frontier imports need to say which layers were observed.
- Clang AST matchers: https://clang.llvm.org/docs/LibASTMatchers.html
  - Transfer: C/C++ import needs AST matcher style region extraction and a separate preprocessor/macro loss model; source-visible regions must remain review-required unless parser/preprocessor evidence is attached.
- Spoon Java transformation library: https://github.com/INRIA/spoon
  - Transfer: Java imports should eventually use a compiler-accurate model for transformations, not only line scanners.
- OpenRewrite: https://github.com/openrewrite/rewrite and https://www.moderne.ai/openrewrite
  - Transfer: the Lossless Semantic Tree idea matches Frontier's direction: preserve formatting/comments while carrying semantic facts and repeatable recipes.
- SwiftSyntax: https://github.com/swiftlang/swift-syntax
  - Transfer: Swift import should prefer syntax-preserving adapters and avoid pretending declaration scanners cover macros, result builders, or availability semantics.
- SCIP Code Intelligence Protocol: https://github.com/scip-code/scip
  - Transfer: semantic indexes are a practical bridge for many languages because they carry documents, symbols, occurrences, and relationships without requiring every worker to invoke a compiler. Frontier imports should accept SCIP-shaped sidecars directly and preserve source maps back to changed files.
- Glean fact schemas: https://glean.software/docs/schema/basic/ and https://glean.software/docs/schema/changing/
  - Transfer: a fact-store shape is useful for large codebases and evolving indexers because facts are predicate/key/value records with schema identity and compatibility rules. Frontier should import predicate facts into semantic-index facts and occurrences so swarms can query “who touched this semantic predicate/region?” instead of reading prose handoffs.
- Mergiraf structured merge: https://mergiraf.org/architecture.html
  - Transfer: tree-sitter parsing plus GumTree-style matching gives a generic fallback for syntax-aware merge admission, but Frontier needs richer symbol/evidence overlays to avoid treating formatting-preserving syntax merges as correctness proof.
- Spork structured merge paper: https://arxiv.org/abs/2202.05329
  - Transfer: structured merge can reduce text conflicts but formatting and runtime are practical risks. Frontier merge admission should score formatting/source-preservation loss and keep structured merge as an evidence layer rather than an unconditional auto-merge step.
- diffTree / hybrid syntax trees: https://www.microsoft.com/en-us/research/wp-content/uploads/2015/02/paper-full.pdf
  - Transfer: stable semantic/node identities across edits are central to continuous and offline merge. Frontier sidecars should prefer persistent symbol/region ids and source hashes over broad dirty-worktree checks.

## Current Local Outcomes

- Implemented source preservation in `importNativeSource` and projection readiness through `projectNativeImportToSource`.
- Implemented `classifyNativeImportRoundtripReadiness` to classify native imports as `exact`, `preserved-source`, `stub-only`, `blocked`, or `needs-review`.
- Added `unverifiedNativeAst` so caller-provided AST blobs no longer become exact semantic evidence unless explicit `exactAst` or adapter coverage is present.
- Added `NativeImportRegionTaxonomyKinds` and sidecar region taxonomy so merge admission can distinguish declaration, import, body, type, effect, call, and generated-output surfaces.
- Added `createNativeImportResultContract` so swarms and CLI tools can consume one compact merge/admission summary instead of scraping nested import results.
- Added Glean-style external semantic index import so predicate fact stores can produce Frontier semantic documents, symbols, occurrences, relations, source maps, and fact records instead of falling back to evidence-only payload hashes.

## Next Research To Implementation Links

- Build adapter packages or optional integrations for exact CST/AST import per language family rather than expanding the lightweight scanner forever.
- Add query-pack support for tree-sitter scanners so declaration/call/effect regions are grammar-backed instead of regex-backed.
- Add loss taxonomies for macros, generated code, conditional compilation, overload/type inference, source generators, and runtime reflection.
- Add roundtrip corpora per language: parse native source, import to Frontier, project preserved source and stubs, verify hashes/readiness, and record unsupported constructs.
- Add semantic patch bundles that can target `regionKind` rather than whole files.
