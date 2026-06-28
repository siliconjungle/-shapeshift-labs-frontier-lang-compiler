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
| JS/TS parser, source spans, and trivia | high | Default smoke includes parser/source-span/trivia fixtures and source-map/comment boundaries. | Keep expanding the broad syntax corpus as new parser-source-span families are admitted. |
| JS/TS scope and use-def graph | high | Binding patterns, parameters, closures, receiver/member references, template literals, namespace/default re-export aliases, and ambiguous evidence all have smoke coverage. | Keep fail-closed cases mapped to source-backed requirements. |
| JS/TS module/export/import graph | high | Imports, removals, new imports, re-exports, default/alias edges, import attributes, dynamic import evidence, package/runtime ambiguity, CommonJS interop bridges, prepared real-git checkout proof, and opt-in live-project diagnostics/declaration proof have smoke coverage. | Broaden prepared upstream samples without vendoring third-party source. |
| JS/TS public API and type graph | high | Compiler public contract, callable signatures, class shape, private accessors, decorators, index signatures, template inference, declaration gates, declaration emit parity, project-reference composite proof, stale project-reference proof rejection, and opt-in live-project diagnostics/declaration proof have fixtures. | Keep project-reference/composite autonomy limited to source/declaration-bound host proof; full `tsc --build` equivalence remains fail-closed without host evidence. |
| JS/TS control-flow and effect graph | high | Runtime order, switch/conditional order, async generators, yield delegation, promise/effect/resource evidence, resource disposal proof, isolated control/effect autonomy, and runtime target hazards are covered with source-bound fail-closed fixtures. | None for the current bounded control/effect denominator; add new rows when broader runtime-equivalence or host-environment claims are admitted. |
| Generic semantic edit admission and replay | high | Semantic edit scripts, projection replay, already-applied checks, source edit dedupe, fallback routes, and prepared-checkout source-hash evidence are covered. | Broaden stale/reanchor lineage cases as new replay modes are admitted. |
| Symbol move between files | high | Exact exported symbol moves with complete import rewrites and graph/declaration gates are admitted for single and multiple independent moves; duplicate exports, stale imports, generated-output boundaries, and missing graph proof all fail closed with explicit evidence. | None for the current bounded cross-file symbol-move denominator; add new rows when new move/refactor families are admitted. |
| Split/merge modules and classes | high | Exact module/class split-merge partitions can be admitted under opt-in graph, diagnostics, and declaration proof; multi-file class split/merge, stale other-branch proof, duplicate partitions, extra target keys, generated-output boundaries, and admission routes all have fixtures. | None for the current bounded split/merge denominator; add new rows when non-structural refactors or broader runtime equivalence claims are admitted. |
| JSX/TSX prop graph | high | Prop values, spread props, component prop contracts, prop flows, static event-handler source-preservation proofs, and dynamic blockers are covered. | Add more component corpus cases and stronger spread/effective-prop admission proofs. |
| JSX/TSX child order and render layout | high | Child-order, render return, keyed collection, branch, generic branch, fragment, wrapper, static source-proof, and canonical source-bound runtime-proof bridge fixtures exist with stale source, missing layout telemetry, and broad-claim rejection. | None for the current bounded JSX layout/runtime-proof denominator; add new rows when new framework/runtime render families are admitted. |
| JSX/TSX hook/context/render-risk graph | high | Hooks, dependency arrays, effects, context providers/consumers, render returns, wrapper blockers, source proof bridges, and canonical source-bound runtime proof bridges have fixtures with fail-closed stale-proof and telemetry-negative cases. | None for the current bounded hook/context/runtime-proof denominator; add new rows when dynamic hook order, framework context, or live React runtime families are admitted. |
| HTML static structure | high | HTML structural identity, class tokens, token lists, duplicate identity blockers, parser source evidence, runtime boundary scanning, and source-bound browser proof corpus coverage exist. | None for the current bounded structural/runtime denominator; add new rows when new HTML parser or browser boundary families are introduced. |
| HTML runtime/browser boundaries | high | Runtime boundary proof records are source-bound, fail closed without evidence, accept canonical `frontier-runtime-proof` source-bound capsules through the compiler bridge, and have DOM/style/layout/event/screenshot/CLS/stale-proof corpus coverage. | None for the current bounded source-bound browser/runtime proof corpus; add new rows when new runtime boundary families are introduced. |
| CSS selectors, cascade, and static declarations | high | Selector target rebases, specificity gates, shorthands, duplicate cascade keys, scoped at-rules, parser evidence, and CSS cascade runtime capsule corpus coverage are covered. | None for the current static cascade/browser-runtime denominator; add new rows when new cascade semantics are admitted. |
| CSS dependencies and runtime descriptors | high | Custom-property, keyframes plus animation-name, font-face plus font-family, URL asset auto-proofs, graph-bound @property/@page runtime descriptor proof bundles, and shared browser runtime proof corpus coverage exist with stale-proof rejection. | None for the current bounded descriptor/runtime denominator; add new rows when new CSS runtime descriptor shapes are admitted. |
| Nested/scoped CSS | high | Scoped cascade blocks are represented, parser-backed nested selectors expand to source-bound semantic records, nested declaration spans are checked, stale expansion proofs are rejected, and nested scoped merges require source-bound scoped-cascade proof before admission. | None for the current bounded nested/scoped CSS denominator; add new rows when nested at-rules, broader nesting grammar, or browser-equivalence claims are admitted. |
| CSS Modules import/use-site graph | high | Default/namespace/named imports, JSX className, helper calls, static bracket access, bounded dynamic access, string-literal blockers, ICSS/composition, generated map hashes, contract blockers, and css-loader/PostCSS-shaped bundler source-map corpus coverage exist. | None for the current bounded CSS Modules denominator; add new rows when new helper alias, framework class helper, or transform families are admitted. |
| CSS Modules transform/source-map identity | high | Generated-map, bundler-transform, structured source-map identity proof, original/generated span mapping validation, output source hash binding, generated class-map hash binding, loader request/query hash binding, source-map artifact/source-content hash binding, and stale proof rejection are covered. | None for the current bounded transform/source-map denominator; add new rows when real bundler execution, Sass/Less preprocessors, or new loader contracts are admitted. |
| Real-repo corpus | high | Manifest-only corpus has 5 repos, 14 oracle cases, 5 matrix rows, synthetic checkout proof, synthetic command execution proof, prepared real-git checkout proof, and opt-in live TypeScript diagnostics/declaration proof without vendored third-party source text. | None for the current manifest-only/prepared-checkout denominator; actual upstream cache/publish remains manual ops. |
| Source-backed completeness matrix | high | Focused smoke extracts this denominator, asserts every production row maps to source-anchor rows, evidence files, remaining-work rows, and generated JSON status rows with exact source-anchor URLs, and CI publishes the generated JSON status artifact. | None for the current denominator; add new source-anchor rows as the denominator grows. |

## Current Remaining Work Table

| Priority | Work item | Why it matters | Suggested first proof |
| --- | --- | --- | --- |
