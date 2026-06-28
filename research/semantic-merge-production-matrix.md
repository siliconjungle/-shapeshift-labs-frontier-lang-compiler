# Semantic Merge Production Matrix

Date: 2026-06-28

This matrix is the current production-readiness denominator for JS, TS, JSX, TSX,
HTML, CSS, and CSS Modules semantic merging. It distinguishes executable proof
from language completeness. A row is `high` when the merge route has positive
fixtures, negative/fail-closed fixtures, and default smoke coverage. A row is
`partial` when the route exists but needs broader proof, live corpus evidence, or
runtime evidence before it can be called production-complete. A row is `missing`
when the current package has no first-class proof route.

## Source Anchors

| Surface | Requirement sources |
| --- | --- |
| JavaScript syntax and runtime semantics | ECMA-262, ESTree, Babel parser, Acorn |
| TypeScript symbols, types, and diagnostics | TypeScript compiler API and TypeScript source behavior |
| JSX/TSX parser and React-like layout hazards | Babel parser, TypeScript JSX/TSX AST behavior, React component/runtime conventions |
| HTML tree construction and runtime boundaries | WHATWG HTML parsing and tree-construction rules, parse5 behavior |
| CSS syntax, selectors, cascade, and at-rules | W3C CSS Syntax, Selectors, Cascade, CSSOM, PostCSS/css-tree-style parser behavior |
| CSS Modules contracts | CSS Modules local scope/composition rules, PostCSS/bundler transform behavior |

Primary external links: https://tc39.es/ecma262/,
https://github.com/estree/estree, https://babeljs.io/docs/babel-parser,
https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API,
https://html.spec.whatwg.org/multipage/parsing.html,
https://parse5.js.org/, https://www.w3.org/TR/css-syntax-3/,
https://www.w3.org/TR/selectors-4/, https://www.w3.org/TR/css-cascade-5/,
https://postcss.org/api/, https://github.com/css-modules/css-modules.

## Current Matrix

| Area | Status | Current executable evidence | Remaining work |
| --- | --- | --- | --- |
| JS/TS parser, source spans, and trivia | high | Default smoke includes parser/source-span/trivia fixtures and source-map/comment boundaries. | Map each row to exact ECMA/ESTree/Babel/TypeScript source requirements; expand real syntax corpus. |
| JS/TS scope and use-def graph | high | Binding patterns, parameters, closures, receiver/member references, template literals, namespace/default re-export aliases, and ambiguous evidence all have smoke coverage. | Add more live-repo proof and keep fail-closed cases mapped to source-backed requirements. |
| JS/TS module/export/import graph | high | Imports, removals, new imports, re-exports, default/alias edges, import attributes, dynamic import evidence, package/runtime ambiguity, and CommonJS interop bridges have smoke coverage. | Run against live TypeScript/Vite/Next/React/Prettier checkouts and record git/build/test evidence. |
| JS/TS public API and type graph | partial | Compiler public contract, callable signatures, class shape, private accessors, decorators, index signatures, template inference, and declaration gates have fixtures. | Prove behavior across project references, declaration emit, composite builds, and live repositories. |
| JS/TS control-flow and effect graph | partial | Runtime order, switch/conditional order, async generators, yield delegation, promise/effect/resource evidence, and runtime target proofs exist. | Increase autonomy for safe control-flow edits; add source-backed negative cases for every effect hazard. |
| Generic semantic edit admission and replay | high | Semantic edit scripts, projection replay, already-applied checks, source edit dedupe, and fallback routes are covered. | Broaden stale/reanchor lineage cases and require live corpus replay evidence for production completion. |
| Symbol move between files | partial | Narrow exact exported symbol moves with complete import rewrites and graph/declaration gates are admitted. | Generalize multiple moves, ambiguous moves, generated-output boundaries, and broader caller-reviewed move evidence. |
| Split/merge modules and classes | partial | Exact structural partitions for module/class split-merge can be admitted under opt-in proof. | Support non-exact partitions, multi-file class/module reshapes, and richer move lineage. |
| JSX/TSX prop graph | high | Prop values, spread props, component prop contracts, prop flows, and dynamic blockers are covered. | Add more real component corpus cases and stronger spread/effective-prop admission proofs. |
| JSX/TSX child order and render layout | partial | Child-order helper coverage exists and aggregate conflict wiring is now covered by focused smoke. Render return, keyed collection, branch, and fragment fixtures exist. | Finish branch proof evidence normalization, event-handler proof bridge, hook-dependency proof bridge, and context/wrapper render proofs. |
| JSX/TSX hook/context/render-risk graph | partial | Hooks, effects, context providers/consumers, render returns, wrapper blockers, and collection proofs have fixtures. | Keep render/runtime equivalence false unless source-bound or browser/runtime proof exists; add more public component corpus coverage. |
| HTML static structure | high | HTML structural identity, class tokens, token lists, duplicate identity blockers, parser source evidence, and runtime boundary scanning exist. | Map rows to WHATWG parse/tree rules and add broader malformed/implicit tree construction fixtures. |
| HTML runtime/browser boundaries | partial | Runtime boundary proof records are source-bound and fail closed without evidence. | Execute browser/DOM/runtime proof bundles with artifact hashes and stale-proof rejection. |
| CSS selectors, cascade, and static declarations | high | Selector target rebases, specificity gates, shorthands, duplicate cascade keys, scoped at-rules, and parser evidence are covered. | Add spec-mapped denominator rows and more complex nested/cascade fixture families. |
| CSS dependencies and runtime descriptors | partial | Custom-property proofs, keyframe/font/url/runtime descriptor blockers, and descriptor evidence exist. | Add non-custom-property auto-proofs, starting with keyframes plus animation-name references. |
| Nested/scoped CSS | partial | Scoped cascade blocks are represented and unsafe nesting fails closed. | Add parser-backed nesting expansion and source-bound declaration spans before admitting nested scoped merges. |
| CSS Modules import/use-site graph | partial | Default/namespace/named imports, JSX className, helper calls, static bracket access, bounded dynamic access, ICSS/composition, generated map hashes, and contract blockers exist. | Add helper alias flow, string/template class name policy, preprocessor/query handling, and broader bundler cases. |
| CSS Modules transform/source-map identity | partial | Generated-map, bundler-transform, and source-map proof presence are checked. | Validate source-map mappings against original source spans, generated output, and class-map hashes. |
| Real-repo corpus | partial | Manifest-only corpus has 5 repos, 14 oracle cases, 5 matrix rows, synthetic checkout proof, and synthetic command execution proof. | Add opt-in live checkout prepare/proof and opt-in build/test proof without vendoring third-party source. |
| Source-backed completeness matrix | partial | This file names the denominator and links evidence areas to sources. | Add row-level citations, generated status extraction, and CI assertion that every source row maps to proof files and remaining work. |

## Current Remaining Work Table

| Priority | Work item | Why it matters | Suggested first proof |
| --- | --- | --- | --- |
| P0 | Live real-repo checkout proof | Synthetic proof does not prove upstream repos work. | External cache runner using `FRONTIER_REAL_REPO_CORPUS_ROOT`, git identity, path-glob match, lockfile metadata. |
| P0 | HTML/CSS browser runtime proof | Static parse/cascade evidence cannot prove DOM/layout/runtime behavior. | One Playwright-backed proof bundle with DOM/cascade artifact hashes and stale-proof rejection. |
| P1 | JSX branch proof generic evidence lookup | Proof handling should be consistent with hook-effect and collection proofs. | Direct `projectGraphDeltaConflicts(..., { evidence: [branchProof] })` fixture. |
| P1 | CSS Modules source-map identity | Presence of a source-map hash is weaker than mapping identity. | Structured proof tying original spans, generated output, generated class map, and mappings. |
| P1 | JS/TS live project diagnostics/declaration proof | Type/API rows need real project-level proof. | Opt-in build/typecheck/declaration evidence on prepared live corpus checkouts. |
| P2 | Keyframes/animation dependency proof | CSS dependency support is custom-property heavy. | Rename `@keyframes` plus `animation-name` fixture with stale-proof rejection. |
| P2 | Hook dependency proof bridge | Static dependency-array edits are currently conservative. | Source-bound preservation proof for non-overlapping dependency additions. |
| P2 | Event-handler proof bridge | Static handler additions can be safe but still route to review. | Proof for independent static handler declarations with runtime-equivalence claim false. |
| P3 | Row-level source citations and CI extraction | Percent complete is not rigorous without a checked denominator. | Generate a JSON matrix from this file plus smoke/bench proof metadata and fail CI on unmapped rows. |
