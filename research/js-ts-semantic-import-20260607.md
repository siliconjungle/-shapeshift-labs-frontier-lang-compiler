# JS/TS Semantic Import Source Pass

Date: 2026-06-07

## Scope

This pass targeted empty or weak semantic sidecars from source-text JS/TS imports in agent copy workspaces. The goal was not to add parser dependencies. The dependency-free scanner should provide useful merge evidence when a host has not injected ESTree, Babel, TypeScript compiler API, SCIP, LSIF, Glean, or another exact semantic source.

## References Checked

- ESTree spec: https://github.com/estree/estree
- TypeScript compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- SCIP indexer guide: https://sourcegraph.com/docs/code_navigation/explanations/writing_an_indexer
- SemanticDB specification: https://scalameta.org/docs/semanticdb/specification.html
- Kythe schema overview: https://kythe.io/docs/schema-overview.html
- Glean source-code facts overview: https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/
- Glean syntax schema: https://glean.software/docs/schema/syntax/
- Pandoc API/readers/writers model: https://pandoc.org/using-the-pandoc-api.html

## Transfer

- ESTree and the TypeScript compiler API remain exact-parser adapter tiers. They should be host-injected, not hard dependencies of this package.
- SCIP, SemanticDB, Kythe, and Glean reinforce the same core shape Frontier already uses: documents, symbols, occurrences/anchors, facts, relations, and source ranges should be preserved as separate evidence layers.
- Pandoc's reader/core/writer split remains the right analogy for Frontier Lang, but programming languages need explicit loss/readiness/proof records where document conversion normally accepts lossy output.

## Local Changes

- `frontier-lang-compiler`: the lightweight JS/TS scanner now imports `export default class Foo` as a class symbol with ownership and source-map evidence. It also treats common wrapper initializers such as `React.forwardRef(...)`, `memo(...)`, `lazy(...)`, and `observer(...)` as function-like declarations.
- `frontier-swarm-codex`: semantic import now resolves safe suffix path variants before marking selected copied-workspace refs as `not-a-file`. A selected parent-root path such as `snes/packages/domain/src/runtime/action.ts` can import the existing minimal-workspace file `src/runtime/action.ts` while preserving `requestedPath`.

## Cautions

- These changes improve merge evidence, not semantic equivalence. Source-text scanning remains declaration-level and review-required.
- Exact JS/TS semantics still require an injected parser/compiler/indexer adapter with source ranges, diagnostics, tokens/trivia when needed, and symbol/reference evidence.
