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

## Current Local Outcomes

- Implemented source preservation in `importNativeSource` and projection readiness through `projectNativeImportToSource`.
- Implemented `classifyNativeImportRoundtripReadiness` to classify native imports as `exact`, `preserved-source`, `stub-only`, `blocked`, or `needs-review`.
- Added `unverifiedNativeAst` so caller-provided AST blobs no longer become exact semantic evidence unless explicit `exactAst` or adapter coverage is present.
- Added `NativeImportRegionTaxonomyKinds` and sidecar region taxonomy so merge admission can distinguish declaration, import, body, type, effect, call, and generated-output surfaces.
- Added `createNativeImportResultContract` so swarms and CLI tools can consume one compact merge/admission summary instead of scraping nested import results.

## Next Research To Implementation Links

- Build adapter packages or optional integrations for exact CST/AST import per language family rather than expanding the lightweight scanner forever.
- Add query-pack support for tree-sitter scanners so declaration/call/effect regions are grammar-backed instead of regex-backed.
- Add loss taxonomies for macros, generated code, conditional compilation, overload/type inference, source generators, and runtime reflection.
- Add roundtrip corpora per language: parse native source, import to Frontier, project preserved source and stubs, verify hashes/readiness, and record unsupported constructs.
- Add semantic patch bundles that can target `regionKind` rather than whole files.
