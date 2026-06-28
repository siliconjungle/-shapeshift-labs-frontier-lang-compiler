# @shapeshift-labs/frontier-lang-compiler

Compiler facade for Frontier Lang. It composes the parser, checker, semantic kernel, and projection adapters for TypeScript, JavaScript, Rust, Python, and C.

## Benchmarks

Run the package-local benchmark with:

```sh
npm run bench
```

These are Frontier-only package measurements for @shapeshift-labs/frontier-lang-compiler. They exercise the package's own parser, checker, compiler, projection, CLI, fuzz, or semantic-kernel surface without making competitor comparison claims.

## Vision

Frontier Lang and Frontier Swarm are two parts of the same system: a semantic programming substrate for agent teams.

Frontier Lang is the universal code representation. It imports source from native languages into a replayable semantic graph: AST layers, symbols, ownership regions, source maps, effects, proof obligations, runtime assumptions, tests, traces, and merge history. It preserves exact native source where needed, imports parser/compiler facts where available, and projects semantic programs back out through target-language adapters.

Frontier Swarm is the coordination layer for many agents working on that graph. It breaks large engineering goals into owned semantic regions, assigns workers isolated slices of context, collects machine-readable evidence, scores merge readiness, and lets the coordinator integrate patches without reading every worker transcript manually.

The shared goal is semantic merging for code. A worker output should say what it changed, what semantic region it owns, what source hashes it depended on, what tests or traces prove the change, what assumptions it conflicts with, and whether it is ready to merge, needs porting, or is discovery-only.

```js
import { compileFrontierSource } from '@shapeshift-labs/frontier-lang-compiler';

const result = compileFrontierSource(source, { target: 'typescript' });
if (result.ok) console.log(result.output);
```

Run a small end-to-end demo after installing or building the package:

```sh
npm run build
node examples/native-js-to-rust-demo.mjs
```

Run the interactive Frontier-style workbench with a submitted TypeScript source pane,
Frontier graph/JSON pane, and independent Rust/Python projection panes:

```sh
npm run demo:ts-rust -- --port 4177
```

The workbench converts only when `Run` is pressed. TypeScript edits project through
the Frontier semantic graph into Rust and Python scaffolding. The middle pane shows
symbols, relations, source maps, readiness, losses, patch hints, and the explicit
supported/review-only/unsupported bounds for the projection. Run
`npm run demo:ts-rust:smoke` to verify the conversion output and layout scaffold
without starting the server.

The demo prints JavaScript source, the Frontier universal AST/semantic-index summary,
Rust declaration stubs, a host-adapter Rust projection, and a direct Frontier-source
to Rust projection. Native JavaScript projection remains loss-aware: without a
target adapter the compiler emits review-required stubs rather than claiming a
lossless JS-to-Rust transpilation.

Emit code with declaration-level source-map sidecars for semantic review and merge admission:

```js
import { emitForTargetWithSourceMap } from '@shapeshift-labs/frontier-lang-compiler';

const { code, sourceMap, ast } = emitForTargetWithSourceMap(document, 'javascript', {
  sourcePath: 'todo.frontier',
  targetPath: 'todo.js',
  semanticIndexId: 'semantic_index_todo'
});
```

Resolve target-specific capability bindings without hardcoding one runtime into the source graph:

```js
import { compileFrontierSource, resolveCapabilityAdapters } from '@shapeshift-labs/frontier-lang-compiler';

const result = compileFrontierSource(source, { target: 'rust' });
const bindings = resolveCapabilityAdapters(result.document, 'rust', { platform: 'native' });
console.log(bindings[0].status); // "bound", "unbound", or "unsupported"
```

Create a loss-aware import bundle from a native parser or agent-produced AST:

```js
import { importNativeSource } from '@shapeshift-labs/frontier-lang-compiler';

const imported = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/todo.js',
  rootId: 'program',
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program' }
  }
});

console.log(imported.nativeSource.ast.rootId);
console.log(imported.patch.operations.length);
```

Import external code-intelligence payloads into Frontier semantic evidence when a project already has language tooling such as SCIP, LSIF, LSP, or SemanticDB:

```js
import { importExternalSemanticIndex } from '@shapeshift-labs/frontier-lang-compiler';

const importedIndex = importExternalSemanticIndex({
  format: 'scip',
  language: 'typescript',
  payload: {
    metadata: { project_root: '/repo' },
    documents: [{
      relative_path: 'src/todo.ts',
      occurrences: [{
        symbol: 'scip-typescript npm todo 1.0.0 src/todo.ts/ addTodo().',
        range: [0, 16, 23],
        symbol_roles: 1
      }]
    }]
  }
});

console.log(importedIndex.semanticIndex.symbols.length);
console.log(importedIndex.ownershipRegions[0]?.key);
console.log(importedIndex.summary.sourceMapMappings);
console.log(importedIndex.readiness.readiness); // "ready-with-losses" or review-required
```

External semantic-index imports create Frontier `SemanticIndexRecord`, `SourceMapRecord`, evidence, losses, ownership facts, first-class `ownershipRegions`, and a universal AST envelope. They are a bridge from existing language servers/indexers into semantic merge tooling; they do not claim full parser AST coverage, macro expansion, type checking, comments/trivia preservation, or lossless cross-language code generation by themselves.

Native imports include source maps, semantic merge candidates, and a loss summary for admission queues and dashboards. Informational losses produce `ready-with-losses`, warning losses produce `needs-review`, and error losses or failed import evidence produce `blocked`:

```js
import { classifyNativeImportReadiness, summarizeNativeImportLosses } from '@shapeshift-labs/frontier-lang-compiler';

const summary = summarizeNativeImportLosses(imported.losses, { evidence: imported.evidence });
const readiness = classifyNativeImportReadiness(imported.losses, { evidence: imported.evidence });

console.log(summary.categories);
console.log(readiness.readiness);
```

The loss taxonomy separates broad scanner limits from specific round-trip risks such as conditional compilation, reflection, overload/type-inference gaps, comments/trivia preservation, source-map approximation, parser diagnostics, and target projection loss. These records are evidence labels for merge admission; they are not claims that the lightweight scanner expanded macros, evaluated inactive branches, resolved overloads, or ran a type checker.

Semantic merge candidates also expose compiler-normalized admission records for coordinator queues:

```js
import {
  createSemanticMergeCandidateAdmissionRecord,
  querySemanticMergeCandidateAdmissionOverlaps,
  sortSemanticMergeCandidateAdmissionRecords
} from '@shapeshift-labs/frontier-lang-compiler';

const record = createSemanticMergeCandidateAdmissionRecord(changeSet);

console.log(record.changedSemanticRegions);
console.log(record.sourceHashes.baseHash, record.sourceHashes.targetHash);
console.log(record.conflictKeys, record.evidenceIds);
console.log(record.projectionRisk, record.readiness, record.readinessSortKey);

const queue = sortSemanticMergeCandidateAdmissionRecords([record, otherRecord]);
const overlaps = querySemanticMergeCandidateAdmissionOverlaps(queue);
```

These candidate records are compact merge-admission evidence. They preserve changed semantic regions, source/base/target hashes, conflict keys, evidence IDs, projection risk, readiness, and overlap pairs so swarm coordinators can sort likely-ready candidates first and detect conflicting regions before patch review.

The JS/TS semantic merge smoke corpus lives at
`test/fixtures/js-ts-semantic-merge/corpus.json` and is exercised by
`test/smoke/js-ts-fixture-corpus.mjs` plus
`test/smoke/js-ts-semantic-merge-oracles.mjs`. The fixtures are deliberately
small and dependency-free. They cover accepted projection/replay cases, exact
source preservation, generated/source-map boundaries, safe import/declaration
merges, safe unordered member merges, composed top-level/member safe merges,
existing import binding-shape additions, React-style TSX child insertions, and
rejected unsafe cases such as stale ledger spans, import specifier removals,
computed keys, duplicate exported names, duplicate object members, decorators with static metadata evidence,
overload anchors, and same-anchor edit conflicts.

### Real-Repo Corpus Proof Phases

Manifest-only real-repo entries link those fixtures to TypeScript, Vite,
Prettier, Next, and React patterns without committing third-party source. The
manifest phase records repository identity, shallow fetch commands, source
shape, path globs, byte budgets, oracle fixture links, and
`committedSourceBytes: 0`; it is metadata, not vendored code.

`bench/real-repo-corpus-suite.mjs` emits a network-free local checkout proof. By
default it reports skipped entries under `tmp/js-ts-semantic-merge-real-repos`;
callers can point `FRONTIER_REAL_REPO_CORPUS_ROOT` at already-existing local
checkouts. The checkout phase stats only the declared path globs and reads
`.git` metadata for identity booleans such as checkout identity status, manifest
remote match, manifest ref match, metadata kind, gitdir pointer presence, git
config presence, and origin URL presence. It does not clone, install
dependencies, or read third-party source text. Each row also records
`checkoutRootPresent`, `checkoutDirPresent`, `checkoutPresenceStatus`, and
`checkoutProofReason`, so a skipped row distinguishes a missing root from a
missing checkout directory and an executed row distinguishes matched declared
globs from a present checkout with no proof match.

The dependency install phase is default-off. Evidence rows report lockfile
presence, package managers present, and the npm/pnpm/yarn command matrix as
`metadata-only`; `dependencyInstallExecution` remains
`not-run-default-network-free` until a caller supplies an explicit opt-in
runner.

The repository command phase is also default-off. Build/test command proof is
kept separate from checkout and dependency metadata through
`repositoryCommandProofStatus`, `repositoryCommandExecution`,
`repositoryCommandDefaultOffReason`, and `repositoryCommandOptInRequired`.
Repository commands remain `not-run-default-network-free` unless a caller passes
`realRepoCommandExecution.enabled`. The opt-in runner reuses the checkout proof,
verifies checkout realpath containment, declared proof-glob matches, git
identity, a single lockfile-backed package manager, and an allowlisted
npm/pnpm/yarn argv with `shell: false` and an allowlisted environment. It records
per-phase exit code, signal, duration, timeout, stdout/stderr byte counts,
SHA-256 hashes, capped previews, and truncation flags. Dependency installation
still requires a separate `allowDependencyInstall` opt-in. Fixture failures
include the fixture id and the actual reason-code or gate values so distributed
swarm evidence can point at a stable case instead of an agent transcript.

Successful `safeMergeJsTsImportsAndDeclarations` and `safeMergeJsTsSource`
results also include `semanticArtifacts`. These artifacts convert the
JS/TS ledger-approved head-to-merged source edits into a semantic edit script,
projection, replay, and already-applied replay. This is intentionally different
from asking the generic three-way edit classifier to bless every JS/TS case:
simultaneous import specifier additions are safe only because the JS/TS ledger
gates proved independent additions, compatible import binding expansions,
stable anchors, and source replay. The
artifacts keep `autoMergeClaim: false` and `semanticEquivalenceClaim: false`,
but give coordinators machine-readable proof that the projected source matches
the merge output and that applying the same projection again is a no-op.

When the top-level JS/TS ledger blocks only because an existing declaration
body or semantic fact changed, `safeMergeJsTsSource` can fall back to the
generic semantic edit script path. The fallback admits the merge only after the
script is an auto-merge candidate, the source projection succeeds, replay on
current head is `accepted-clean`, and replay on the projected source is
`already-applied`. Same-anchor head edits, stale anchors, and non-body conflicts
remain blocked for review. The same fallback composes with declared unordered
member-addition regions, so a verified body edit can still merge alongside safe
interface, type, class, or object member additions. Existing class/object method
or property body edits inside the declared member region are preserved for
semantic replay while added members are neutralized; object member additions are
re-emitted with safe commas when both sides add final properties.
When head changed an existing sibling declaration or sibling member,
`safeMergeJsTsSource` prefers the direct semantic edit projection over a
neutralized staged projection, and admits the merge only when replay still
verifies cleanly. That direct path projects onto a staged top-level output with
head declaration changes replayed first, so safe import/declaration additions
are preserved without dropping the head-side sibling edit.

Project-level JS/TS safe merges compose the same file-level gates across a
base/worker/head file set. They preserve head-only files, admit worker-only
file additions when file additions are enabled, block conflicting same-path
additions, and attach per-file semantic artifacts for files merged through the
JS/TS source merger:

```js
import { safeMergeJsTsProject } from '@shapeshift-labs/frontier-lang-compiler';

const project = safeMergeJsTsProject({
  language: 'typescript',
  moduleResolution: { baseUrl: '.', paths: { '@app/*': ['src/*'] } },
  baseFiles: { 'src/index.ts': 'export const stable = 1;\n' },
  workerFiles: { 'src/index.ts': 'export const stable = 1;\nexport const workerOnly = 1;\n' },
  headFiles: { 'src/index.ts': 'export const stable = 1;\n' }
});

console.log(project.status); // "merged"
console.log(project.outputFiles[0].sourcePath); // "src/index.ts"
console.log(project.files[0].semanticArtifacts.status); // "verified"
```

When `includeOutputProjectSymbolGraph` is enabled, the same
`moduleResolution` shape is used for output graph artifacts. Resolution is
runtime-neutral: `baseUrl`, `paths`, `aliases`, and `compilerOptions.paths`
are matched against the supplied project files, not the host filesystem.
Bare package imports also get explicit package identity. If `packages` is
provided, package export maps can resolve back to supplied workspace sources
and record the selected export condition:

```js
const project = safeMergeJsTsProject({
  includeOutputProjectSymbolGraph: true,
  moduleResolution: {
    packages: {
      '@pkg/core': {
        root: 'packages/core',
        exports: { './utils': { import: './src/utils.ts', default: './dist/utils.js' } }
      }
    },
    packageExportConditions: ['import', 'default']
  },
  baseFiles,
  workerFiles,
  headFiles
});

console.log(project.outputProjectSymbolGraph.importEdges[0].packageName); // "@pkg/core"
console.log(project.outputProjectSymbolGraph.importEdges[0].packageExportCondition); // "import"
```

NodeNext-style JS extension specifiers can resolve to supplied TS source files.
For example, `import './runtime.js'` can resolve to `src/runtime.ts` when that is
the available project document. Graph edges record `resolutionPathVariant` as
`"extension-substitution"` so coordinators can distinguish exact source matches
from source-extension substitutions during stale checks and merge admission.

Package `imports` maps are also modeled for `#internal` specifiers. Top-level
`moduleResolution.imports` applies from `packageRoot`/`root`, while importers
outside that root fail closed as `package-import-scope-missing`.
`packages[name].imports` applies to the nearest configured package root. Graph
edges record `packageImportKey`, `packageImportCondition`, and
`packageImportTarget` so merge admission can distinguish private aliases from
external or unresolved imports:

```js
const project = safeMergeJsTsProject({
  includeOutputProjectSymbolGraph: true,
  moduleResolution: {
    imports: { '#internal/*': { import: './src/internal/*.ts', default: './src/internal/*.js' } },
    packageExportConditions: ['import', 'default']
  },
  baseFiles,
  workerFiles,
  headFiles
});

console.log(project.outputProjectSymbolGraph.importEdges[0].resolutionKind); // "package-import-source"
console.log(project.outputProjectSymbolGraph.importEdges[0].packageImportKey); // "#internal/*"
```

Matched package `imports` entries also fail closed when none of the configured
conditions selects a target. Those graph edges record `resolutionKind` as
`"package-import-condition-missing"` with `packageImportKey` and no resolved
module path, even when a matching source file exists in the supplied project.
When `import` and `require` branches resolve to different targets but the
importer path is runtime-ambiguous, graph edges fail closed as
`"package-import-runtime-ambiguous-missing"` or
`"package-export-runtime-ambiguous-missing"` with condition evidence
`"import|require"` instead of choosing whichever condition appears first.
Static edge evidence can also disambiguate runtime condition selection without
crawling the host filesystem: ESM import/re-export edges select `import`,
CommonJS `require` / TypeScript `import = require` edges select `require`,
literal dynamic `import()` selects `import`, and static `import.meta.resolve`
or `require.resolve` host edges select the matching package branch while still
recording no host-runtime resolution claim. Edges record
`packageRuntimeConditionEvidenceSource`, `packageRuntimeConditionEdgeKind`, and
`packageRuntimeConditionReasonCode`; contradictory hard evidence fails closed as
`"package-runtime-condition-conflict-missing"` with
`packageRuntimeConditionCandidates`. Caller-supplied package type metadata also
disambiguates runtime condition selection for `.js`/`.ts` importers. Use
`moduleResolution.packageType`, `moduleResolution.packageTypeByRoot`,
`moduleResolution.packageTypes`, or `packages[name].type` / `packageType` for
package-local `imports`; resolved graph edges record `packageRuntimeCondition`
as `"import"` or `"require"` and include the matched `packageType`.
Non-resolver host dependency edges such as `Worker`, `SharedWorker`,
`serviceWorker.register`, worklet `addModule`, `importScripts`, and
`new URL(specifier, import.meta.url)` do not inherit package type metadata to
choose divergent package `import` / `require` targets. When those host package
specifier targets differ, graph edges fail closed with
`packageRuntimeConditionEvidenceSource: "host-runtime-ambiguous"` and reason code
`"package-runtime-condition-host-ambiguous-missing"` while keeping
`hostDependencyRuntimeResolutionClaim: false`.
When a coordinator already has package manifest data, use
`createNativeProjectModuleResolutionFromPackageManifests` to convert in-memory
`package.json` objects or text into the same runtime-neutral module-resolution
shape:

```js
const manifestResolution = createNativeProjectModuleResolutionFromPackageManifests({
  packageExportConditions: ['import', 'require', 'default'],
  manifests: [{
    sourcePath: 'packages/app/package.json',
    packageJson: {
      name: '@pkg/app',
      type: 'module',
      exports: { './feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' } },
      imports: { '#feature': { import: './esm/feature.mjs', require: './cjs/feature.cjs' } }
    }
  }]
});

const project = safeMergeJsTsProject({
  includeOutputProjectSymbolGraph: true,
  moduleResolution: manifestResolution.moduleResolution,
  baseFiles,
  workerFiles,
  headFiles
});
```

Configured package `exports` maps fail closed for blocked subpaths. If a package
declares `exports` but the requested package subpath is not present, graph edges
record `resolutionKind` as `"package-subpath-not-exported-missing"` with
`packageName` and `packageSubpath` instead of falling through to source-root
probing. This keeps package visibility distinct from local file presence,
including type-only imports. Matched package export edges also retain
`packageExportKey` and `packageExportTarget`, including wildcard keys such as
`"./features/*"` resolved to concrete targets such as
`"./esm/features/button.mjs"`.

Named re-export identities also include symbol links when the project graph has
enough evidence. For `export { thing as renamedThing } from './thing.js'`,
`reExportIdentities[]` records the source module, imported/exported names,
`originSymbolId`, `exportedSymbolId`, and `localSymbolId`.
Public contract regions include `apiSurfaceKind`, `signatureHash`, and
`contractHash`, giving merge admission a stable API surface fingerprint.
For `export * from './module.js'`, project graphs fan out re-export identities
for each named export in the resolved target document and omit `default`, which
matches JavaScript module semantics.
Output graph admission can use those expanded identities to accept disjoint
export-star additions while blocking incompatible duplicate exported names as
`project-output-re-export-identity-conflict`.

When using `createTypeScriptCompilerNativeImporterAdapter`,
`createEstreeNativeImporterAdapter`, or `createBabelNativeImporterAdapter`,
parser AST imports emit the same binding-level module facts instead of only
statement-level module edges. Default, namespace, named, type-only, side-effect,
re-export, export-star, local export, `export default`, and TypeScript
`export =` declarations carry `importKind`, `exportKind`, `localName`,
`importedName`, `exportedName`, `isTypeOnly`, and public-contract metadata into
the semantic index and project symbol graph.
Binding-level import and re-export identities preserve import-attribute /
import-assertion key/value records, counts, and hashes so attribute-only deltas
remain visible to merge admission without relying on hashes alone.
Dynamic `import()` calls with non-literal targets are recorded with the stable
`<dynamic-import>` pseudo-specifier and project graph `resolutionKind`
`"dynamic-import-non-literal-missing"` so merge gates fail closed without host
filesystem or package crawling.
CommonJS `require()` bindings are runtime-neutral graph edges: destructured
requires resolve to matching named `exports.foo` records, a default `require()`
binding resolves to the target document's `module.exports` record when that
export assignment is present, and `exports.__esModule = true` is ignored as
interop metadata instead of treated as a public export.
Static TypeScript-style CommonJS import helpers, including bare
`__importDefault(require("./dep"))` / `__importStar(require("./dep"))` calls and
`tslib_1.__importDefault(require("./dep"))` /
`tslib_1.__importStar(require("./dep"))` member-form calls, are recorded as
default and namespace import edges in lightweight and parser-backed project
graphs, while non-literal helper targets remain fail-closed. For conditional
package `exports` / `imports`, those helper edges keep their binding-level
default/namespace shape but select the `require` branch from the inner static
`require()` evidence; contradictory source-extension or package-type evidence
still fails closed instead of claiming runtime interop equivalence.
Static TypeScript-style CommonJS re-export helpers, including bare
`__exportStar(require("./dep"), exports)` /
`__createBinding(exports, require("./dep"), "name", "alias")` calls and
`tslib_1.__exportStar(require("./dep"), exports)` /
`tslib_1.__createBinding(exports, require("./dep"), "name", "alias")`
member-form calls, are also recorded as export-star or named re-export module
edges and fan out through the same project re-export identity graph as ESM
`export * from "./dep"` and `export { name as alias } from "./dep"`.
TypeScript-style CommonJS named getter re-exports that pair a static
`const dep = require("./dep")` alias with
`Object.defineProperty(exports, "name", { get: function () { return dep.name; } })`,
named function descriptors such as `Object.defineProperty(exports, "name", { get: function getName() { return dep.name; } })`,
shorthand `Object.defineProperty(exports, "name", { get() { return dep.name; } })`,
or block-bodied arrow getter `Object.defineProperty(exports, "name", { get: () => { return dep.name; } })`
are stitched into re-export identities when the alias and getter member are
static in the same source document.
Parser-backed ESTree/Babel imports also normalize no-expression
`TemplateLiteral` nodes as static CommonJS `require`, computed export keys, and
`Object.defineProperty` / `Object.defineProperties` export specifiers, while
template literals with expressions stay unresolved instead of being guessed.
The same static-literal rule applies to parser-backed dynamic `import()` and
TypeScript-style CommonJS helper re-export specifiers such as
``__exportStar(require(`./dep`), exports)``.
Host dependency APIs such as `new URL(specifier, import.meta.url)`, `Worker`,
`import.meta.resolve`, `require.resolve`, and `importScripts` also accept
no-substitution/static template specifiers as evidence while expression templates
emit `<host-dependency>` edges with expression hashes and proof-required
unresolved evidence.

`safeMergeJsTsProject` stays synchronous. When a caller already has parser-backed
native import results for merged output files, pass them as `outputProjectImports`
with `includeOutputProjectSymbolGraph`. The graph builder matches supplied
imports by `sourcePath` and `sourceHash`, requires hash-verified matches when
the merged source has a hash, uses them for output graph artifacts, and falls
back to the lightweight scanner for missing or stale files.

For admission queues that need bounded cross-branch API checks, enable
`includeProjectGraphDelta`. This additionally builds base, worker, head, and
output project graph stages and blocks the merge when worker and head both
change the same public contract, re-export identity, or import target in
incompatible ways. Parser-backed stage imports can be supplied with
`baseProjectImports`, `workerProjectImports`, `headProjectImports`, and
`outputProjectImports`; missing or hash-stale stages fall back to the synchronous
lightweight scanner. This is a conservative admission gate only: results still
keep `autoMergeClaim: false` and `semanticEquivalenceClaim: false`.

When a coordinator has a caller-owned TypeScript compiler API available, project
merge can also require output diagnostics before admitting the candidate:

```js
import ts from 'typescript';
import { safeMergeJsTsProject } from '@shapeshift-labs/frontier-lang-compiler';

const project = safeMergeJsTsProject({
  requireOutputDiagnostics: true,
  typescript: ts,
  baseFiles,
  workerFiles,
  headFiles
});

console.log(project.outputDiagnosticsGate.status); // "passed" or "blocked"
console.log(project.summary.outputDiagnosticErrors);
```

The diagnostics gate checks merged output files with TypeScript syntactic and
semantic diagnostics, blocks on error diagnostics, and stores the normalized
diagnostics/conflicts under `outputDiagnosticsGate`. The package does not import
TypeScript from its runtime root; callers inject the compiler module or supply
precomputed `outputDiagnostics`.

The same caller-owned TypeScript module can emit declaration-output evidence for
the merged project boundary:

```js
const project = safeMergeJsTsProject({
  includeDeclarationOutput: true,
  typescript: ts,
  baseFiles,
  workerFiles,
  headFiles
});

console.log(project.outputDeclarationGate.status); // "passed" or "blocked"
console.log(project.outputDeclarationGate.declarationFiles[0].sourceHash);
```

Use `requireDeclarationOutput: true` to fail closed when no compiler or supplied
`outputDeclarations` are available. The gate records normalized declaration
files, hashes, diagnostics, and conflicts under `outputDeclarationGate`; it is
public-boundary evidence, not a semantic-equivalence claim.

When project graph delta evidence is included, declaration output can also act
as a public API admission proof. `safeMergeJsTsProject` records
`declarationEmitParityProof` with worker/head/output declaration boundary
hashes. If a public compiler type changes to the same fingerprint on worker and
head, the graph delta admission can use that proof to verify the merged output
emits the same declaration boundary; a missing or mismatched supplied proof
fails closed with `typescript-public-api-declaration-emit-*` reason codes. The
proof is still only public-boundary evidence and does not claim runtime or full
semantic equivalence.

Current JS/TS semantic-merge status matrix:

| Surface | Status | Current evidence |
| --- | --- | --- |
| Source-text merge candidate | baseline | Project admission records the conservative concrete source merge candidate before semantic proof rows run. `sourceTextMergeCandidateStatus`, `sourceTextMergeCandidateFiles`, `sourceTextMergeBlockedFiles`, `sourceTextMergeOutputFiles`, `source-text-merge-candidate` evidence, and the `confidence.admissionMatrixAudit` `source-text-merge-candidate` surface make the baseline machine-checkable. Failed source-text candidates block before semantic admission; this row is not a semantic-equivalence or browser-runtime claim. |
| HTML parser/source evidence | bounded-evidence | HTML project files are counted separately through `htmlFiles`, `htmlMergedFiles`, `htmlBlockedFiles`, parser evidence counters, and `html-parser-source-evidence` matrix proof statuses. Current evidence is parser/source-span bounded around parse5-style source locations, parser-backed spans, exact `base` / `worker` / `head` side records, facade base/worker/head source-hash binding for merged evidence, parser-side source-hash mismatch blockers when supplied, and fail-closed parser evidence failures; it does not claim browser DOM, hydration, or render equivalence. |
| CSS parser/source evidence | bounded-evidence | CSS project files are counted separately through `cssFiles`, `cssMergedFiles`, `cssBlockedFiles`, parser evidence counters, and `css-parser-source-evidence` matrix proof statuses. Current evidence is parser/source-span bounded around PostCSS-style rule/declaration spans, raw trivia hashes, exact `base` / `worker` / `head` side records, facade base/worker/head source-hash binding for merged evidence, parser-side source-hash mismatch blockers when supplied, parse-error blockers, and source preservation; it does not claim cascade or browser runtime equivalence. |
| HTML identity evidence | bounded-evidence | HTML identity proof uses `htmlIdentityEvidenceFiles`, explicit/path identity residual counters, duplicate identity counters, runtime/framework boundary counters including Angular `[prop]`, `(event)`, `[(model)]`, `*structural`, and `#ref` directive attributes, `htmlProofGapBlockedFiles`, and the `html-identity-evidence` proof status. Parser-backed stable identity can support later structural admission, while duplicate identity, runtime boundaries, framework boundaries, or missing proof gaps stay review/blocking evidence. |
| CSS selector target evidence | bounded-evidence | CSS selector target proof uses `cssSelectorTargetEvidenceFiles`, selector target graph/specificity/move counters, selector conflict/rebase counters, and the `css-selector-target-evidence` proof status. Target evidence remains bounded to parser-backed selector/target/rebase facts; selector-target rebases involving selector-list functional pseudos now admit only when the source-bound target proof carries exact parser-backed Selectors Level 4 specificity metadata and matching base/worker/head source hashes. This row does not claim cascade or browser runtime equivalence. |
| HTML structural merge admission | partial | HTML structural admission uses `html-structural-merge` proof statuses plus parser and identity evidence. It can admit bounded structural source merges when files merge cleanly and required identity/parser evidence is present; blocked files route to `admit-html-structural-merge` and browser/runtime proof remains a separate row. |
| CSS cascade merge admission | partial | CSS cascade admission uses `css-cascade-merge` proof statuses plus parser, selector, shape-keyed scoped cascade, dependency, and CSS Module use-site evidence. It remains partial: source-bound scoped cascade proof with scope shape keys, dependency proof, generated class maps, bundler transform identity, source-map proof, and dynamic use sites stay fail-closed when absent. CSS Module transform gaps are exposed by separate rows below; none of these rows claims browser, render, or cascade equivalence. |
| CSS dependency graph evidence | bounded-evidence | CSS dependency graph proof uses `cssDependencySurfaceFiles`, `cssDependencyGraphEvidenceFiles`, missing-proof/blocker counters, and the `css-dependency-graph` proof status for custom property, `var()` fallback, animation, font, asset, `@property`, and `@page` dependency surfaces. Project-synthesized custom property reference proofs that change a `var()` fallback chain are labeled `css-var-fallback-dependency-graph-project-source-bound` and carry fallback reference hashes; missing or stale dependency graph hashes stay on the `prove-css-dependency-graph` review route. It is absent when no dependency surface is present and does not claim cascade/browser equivalence. |
| CSS runtime descriptor evidence | bounded-evidence | CSS runtime descriptor proof uses `cssRuntimeDescriptorFiles`, `cssRuntimeDescriptorEvidenceFiles`, property/page descriptor counters, and the `css-runtime-descriptor-evidence` proof status for parser-backed `@font-face` font-family/src records, `@property` syntax/inherits/initial-value evidence, and `@page` descriptor and margin-box records. It is source/shape-key evidence only; browser cascade, render, and runtime equivalence remain in the separate browser proof row. |
| CSS Module use-site graph proof | partial | CSS Module use-site graph proof is tracked by the `css-modules-use-site-graph` surface with the `css-module-use-site-graph` proof status. It counts use-site proof blockers separately from transform blockers through `projectGraphCssModuleUseSiteProofBlockers`; default, namespace, static helper, and scope/use-def-bound named CSS Module imports can emit bounded use-site records, including `named-import-reference` records tied to `scopeReferenceRecordId`. Dynamic member reads, member writes, unsupported helper calls, unresolved imports, missing named-import scope references, and literal class-name ambiguity stay fail-closed without making generated class-name map, bundler transform, or source-map proof claims. |
| CSS Module generated class-name map proof | bounded-evidence | CSS Module generated class-name map proof is tracked by the `css-modules-generated-class-name-map` surface and `css-module-generated-class-name-map` proof status. Missing maps are counted with `projectGraphCssModuleGeneratedClassNameMapBlockers`, route to `prove-css-module-generated-class-name-map`, and keep admission blocked until source-bound transform evidence supplies the generated names used by JS/TS use sites. |
| CSS Module bundler transform identity proof | bounded-evidence | CSS Module bundler transform identity proof is tracked by the `css-modules-bundler-transform-identity` surface and `css-module-bundler-transform-identity` proof status. Missing transform identity is counted with `projectGraphCssModuleBundlerTransformIdentityBlockers`, routes to `prove-css-module-bundler-transform-identity`, and fails closed when the bundler transform hash or equivalent source-bound proof is absent. |
| CSS Module source-map identity proof | bounded-evidence | CSS Module source-map identity proof is tracked by the `css-modules-source-map-identity` surface and `css-module-source-map-identity` proof status. Missing source-map proof is counted with `projectGraphCssModuleSourceMapIdentityBlockers`, routes to `prove-css-module-source-map-identity`, and fails closed when CSS Module generated output cannot be tied back to source through the required source-map identity evidence. |
| HTML/CSS browser runtime proof | bounded-evidence | HTML/CSS browser proof is an explicit separate row tracked by `htmlCssBrowserRuntimeProofs`, the `html-css-browser-runtime-proof` surface, and the `browser-runtime-proof` proof status. Structural source merges keep browser/render/cascade equivalence claims false unless a bounded browser proof bundle is attached; HTML runtime-boundary proofs cover event handler, inline style, iframe/srcdoc, form, form submitter, form control, anchor/area navigation (`a`/`area` `href`, `target`, `download`, `ping`, and `referrerpolicy`), base, meta, and resource-loading attribute families. Resource-loading coverage includes responsive `img`/`source` `srcset` and `sizes`, preload/modulepreload image metadata such as `imagesrcset`, `imagesizes`, `media`, `integrity`, `crossorigin`, and `referrerpolicy`; script fetch metadata is covered by the script runtime boundary, iframe `sandbox`/`allow` by the iframe runtime boundary, and CSS cascade runtime proofs are tracked separately. The project wrapper accepts the HTML package source-bound browser/runtime proof aliases (`htmlBrowserRuntimeProofsByPath`, `htmlSourceBoundRuntimeProofsByPath`, `htmlRuntimeBoundaryProofsByPath`, and generic browser/runtime proof inputs) when the proof kind is source-bound, source/output hash bound, boundary metadata is supplied through `boundary`/`boundaries` and `boundaryAttributes`/`changedBoundaryAttributes`/`attributeName`/`attributeNames`, runtime evidence is bound, and the proof does not self-claim broad semantic/render/auto-merge equivalence. These proofs must include source hashes, a runtime command, probe id, evidence hash, and the required runtime signal. Missing proof routes to `prove-html-css-browser-runtime`. |
| Parser/source-span/trivia evidence | Partial | Source preservation, source hashes, runtime directive-prologue entries, directives, comments/trivia summaries, project `sourceFileRecords` / `sourceSpanRecords`, protected-span hashes, shebang file-entrypoint directive ownership anchors, `sourceMappingURL` and `sourceURL` generated-boundary source-map spans, deterministic source-map generated-boundary ownership keys from supplied exact source/generated spans and hashes, generated-boundary position conflict evidence, deterministic ownership anchors, source-span/trivia ownership blockers, exact parser-trivia ownership records for directive prologues plus leading/trailing comments and JSDoc/block-comment spans when parser evidence matches the source hash, TypeScript `SourceFile` compiler-scanner exact token/trivia source-preservation evidence for JS/TS/JSX/TSX imports, ESTree/Babel parser token/comment range evidence plus first-class `parserSpanCoverageProof` records when the supplied AST covers every non-whitespace byte of the current source, project source file/span parser-span coverage status/evidence fields, fail-closed scanner/ledger spoof blockers, source-span delta conflicts, parser roundtrip proof records, source/output-hash-bound source-span roundtrip proof records, failed source-span roundtrip proof admission blockers, project-merge stage parser-trivia evidence from supplied parser-backed imports for base/worker/head/output, metadata-only exactness blockers for scanner fallbacks, and fixture corpus checks. Parser-backed exactness also requires contiguous current-source token/comment/trivia coverage with no gaps, overlaps, truncation, or text mismatches; truncated coverage blocks exact token/comment ownership. Adapters without token/comment ranges remain approximate/caller evidence, not exact parser trivia. |
| Scope/use-def graph | Partial | Lightweight lexical scope/use-def scans, destructuring alias binding records, object/array/nested/rest/default-initializer parameter binding evidence for function and arrow parameters, default import alias reads through re-export chains when a stable default-export local binding is observed, source-bound anonymous default export fallback evidence for resolved default re-export chains with source hash/span and source symbol hashes, fail-closed `lexical-scope-import-alias-target-unresolved` records when an alias target cannot be tied to either lexical binding or source-bound anonymous default evidence, namespace import dot and literal/static-template computed member-read evidence, blocked evidence for ambiguous computed namespace reads and namespace member writes, `this`/`super` receiver member read/write evidence including computed string and static-template members, optional chaining markers, and TypeScript checker-backed receiver-member reference proof for full `this`/`super` access spans including private identifiers, template-literal interpolation live-reference records with expression hashes plus tagged-template site/tag root/member metadata, caller-supplied ESTree/scope-manager structural evidence normalization, closure-capture depth/owner/reference hashes, binding-level closure capture hashes, project `scopeBindingRecords` / `scopeReferenceRecords`, public owner use hashes, public scope-use and reference-site delta conflicts with alias target route/use-hash evidence, TypeScript compiler reference relations when a checker is supplied, exact compiler reference-site proof hashes on scope reference records, fail-closed `typescript-compiler-reference-site-ambiguous`, `typescript-compiler-reference-lexical-binding-mismatch`, and `typescript-compiler-reference-import-alias-target-mismatch` records when compiler alias evidence cannot be reconciled with the lexical route or re-export/import target, nested `aliasResolutionStatus` and `compilerReferenceStatus` blockers routed to ambiguous public scope/use-def evidence even when top-level status fields are not mirrored, and dependency-sensitive fixture coverage. Full whole-program binding/control-flow resolution is still caller/compiler-evidence bounded. |
| Module/export/import graph | Partial | Project graph stages, module resolution, runtime-neutral package manifest conversion from in-memory `package.json` objects/text, duplicate workspace-root package-name ambiguity diagnostics and fail-closed `package-workspace-root-ambiguous-missing` edges with `packageWorkspaceRoots` evidence, package exports/imports including wildcard package export key/target evidence, fail-closed package `imports` condition misses, runtime-ambiguous `import`/`require` condition blockers, caller-supplied package type runtime-condition evidence for `.js`/`.ts` package exports/imports, caller-supplied package environment-condition evidence such as `browser`, fail-closed `package-export-environment-ambiguous-missing` / `package-import-environment-ambiguous-missing` blockers with condition candidates when environment targets such as `browser` and `node` diverge without explicit evidence, and fail-closed host-runtime ambiguity blockers for non-resolver host package specifiers with divergent `import`/`require` targets, re-export identities including static TypeScript-style CommonJS bare and `tslib_1.__...` member-form `__exportStar(require("./dep"), exports)` fanout and `__createBinding(exports, require("./dep"), "name", "alias")` named re-export fanout, same-document CommonJS require-alias getter re-export identities for descriptor `get: function () { return dep.name; }`, named descriptor `get: function getName() { return dep.name; }`, shorthand `get() { return dep.name; }`, and block-bodied arrow `get: () => { return dep.name; }`, TypeScript-style CommonJS bare and `tslib_1.__...` member-form `__importDefault(require("./dep"))` and `__importStar(require("./dep"))` helper import edges, CommonJS `module.exports` default-import interop when no direct `default` export exists, literal computed CommonJS export properties such as `exports["default"]`, static `module.exports = { named }`, `Object.assign(exports, { named })`, `Object.defineProperty(exports, "named", { value/get })`, and `Object.defineProperties(exports, { named: { value/get } })` export maps in lightweight and AST-backed imports, ESTree/Babel no-expression `TemplateLiteral` normalization for CommonJS `require`, computed export keys, descriptor export specifiers, dynamic `import()`, CommonJS helper re-export specifiers, and host dependency specifiers while expression-bearing templates stay unresolved, TypeScript compiler no-substitution dynamic import and host dependency template evidence, `exports.__esModule` marker filtering, import-target deltas for head-introduced CommonJS export assignments, namespace/ambient module/global augmentation/export-assignment static shape records with proof hashes and no runtime-equivalence claim, fail-closed namespace/export-assignment shape delta conflicts, non-literal dynamic `import()` pseudo-specifiers with expression kind/text/hash evidence and fail-closed resolution evidence, static `new URL(specifier, import.meta.url)`, `Worker`, `SharedWorker`, `serviceWorker.register`, worklet `addModule`, `importScripts`, `import.meta.resolve`, and `require.resolve` host dependency edges with expression hashes and no runtime-resolution claim, dynamic host dependency targets emitted as `<host-dependency>` with expression hashes, `hostDependencyStaticSpecifierEvidence: false`, and proof-required unresolved evidence, import-attribute/import-assertion normalized key/value/count/hash evidence on static imports, dynamic imports, and re-exports, import-attribute delta conflicts, output graph unresolved-module conflicts that preserve edge-level fail-closed package, host, dynamic import, and import-attribute value evidence, and output graph resolved-module missing-export conflicts that preserve edge-level package and import-attribute evidence. Host filesystem/package graph crawling, namespace runtime evaluation, ambient/global compatibility, and CommonJS runtime interop equivalence remain out of the root API. |
| Type/public API graph | Partial | Public-contract regions, signature/contract hashes, TypeScript compiler symbol/type records, source-bound checker proof source path/hash requirements, compiler-backed type-reference target proof that binds public API type references to resolved target symbols, declaration spans, and declaration source text hashes, inferred exported factory call-signature evidence, compiler-backed public call/construct signature shape evidence and proof hashes, exported overload declaration/signature counts, compiler-backed overload signature-set proof, compiler-backed generic type-parameter/default proof, compiler-backed public member property/method property-set proof, compiler-backed public index-signature key/value/readonly evidence and proof hashes, stable public-surface hashes that ignore transient TypeScript symbol flags, compiler-backed class heritage and constructor-signature evidence/proof hashes, compiler-backed private class member and accessor-field static shape records/proof hashes plus source- and required-signal-bound private/accessor runtime proof binding with command/trace/evidence hashes, private brand, private method, private accessor, static private, subclass brand-boundary, and accessor descriptor trace slots, and false claim flags, compiler-backed class/member/parameter decorator target and expression static metadata records/proof hashes plus source-bound decorator runtime execution proof binding with trace hashes and false claim flags, compiler-backed enum runtime-shape/member-value evidence and proof hashes, TypeScript compiler importer support for source-bound computed enum evaluated-value traces with emitted-shape hashes, trace/evidence hashes, and false claim flags, compiler-backed conditional, indexed-access, mapped, `keyof`, template-literal, `infer`, union, intersection, tuple, and mixed known advanced/composite type-shape proof hashes, static compiler-backed inference syntax evidence/proof hashes for `satisfies`, `as const`, and const type parameters, bounded TypeChecker `isTypeAssignableTo` oracle proof for simple public type aliases with source path/hash binding and fail-closed `typescript-public-api-type-equivalence-proof-missing` for missing or ambiguous oracle evidence, class private/accessor/decorator/class/enum/advanced-shape/composite-shape/inference-syntax/index-signature/callable-signature/type-reference-target hashes in public compiler-type delta fingerprints, fail-closed missing-proof blockers for missing public API source hashes, type-reference target proof hashes, call/construct signature return/parameter evidence, constructor/class-heritage/private-class-member/accessor-field/index-signature value-type/enum runtime-shape/conditional-branch/indexed-access object-index-result/mapped constraint-value/`keyof` target/template-literal span/`infer` type-parameter/union member/intersection member/tuple element evidence, fail-closed computed enum runtime-value blockers when source-bound evaluated-value proof is missing, stale, trace-incomplete, value-incomplete, or claim-bearing, fail-closed private/accessor and decorator runtime execution blockers when source-bound trace proof is missing, stale, trace-incomplete, schema/kind-mismatched, required-signal-incomplete, commandless, or claim-bearing, fail-closed unknown advanced type-shape evidence, unsupported type-equivalence reason codes, public compiler-type delta conflicts, declaration-output gate, TypeScript declaration emit parity proof for worker/head/output public boundaries, and project graph delta conflicts. Full type-equivalence, broad decorator execution equivalence beyond source-bound trace proofs, broad enum runtime evaluation beyond source-bound computed-value traces, broad runtime equivalence for private/accessor execution beyond source-bound trace proofs, or broad inference-semantics proof beyond these focused compiler-backed cases is not claimed. |
| JSX/TSX element and prop graph | Partial | JSX attribute/child-expression safe-merge fallbacks, conditional child-expression blockers, keyed-child insertion evidence, keyed named Fragment insertion evidence, planned-output duplicate-key checks, top-level `key` attribute scanning that does not treat `data-key` as stable identity, deterministic shorthand-fragment/spread/reorder/same-gap blockers, spread-attribute records/expression hashes, spread/explicit prop precedence blockers, component prop diagnostic gates, project `jsxElementRecords` / `jsxPropRecords`, public owner prop and keyed child-order hashes, typed public key/fragment evidence, literal/shorthand/reference/static optional-chain JSX prop-value callsite records/hashes with `jsx-render-prop-value-literal-evidence`, `jsx-render-prop-value-static-reference-evidence`, and `jsx-render-prop-value-static-optional-reference-evidence`, dynamic prop-value blockers such as `jsx-render-prop-value-computed-reference-unsupported`, `jsx-render-prop-value-call-expression-unsupported`, and `jsx-render-prop-value-optional-reference-unsupported`, same-file plain/member and project-local named/default/barrel-import plain/member static component prop passthrough evidence with `jsx-render-component-prop-flow-static-passthrough-evidence`, dynamic component prop passthrough blockers with `jsx-render-component-prop-flow-dynamic-value-unsupported`, component prop render-flow blockers with `jsx-render-component-prop-flow-unsupported`, provider ancestor path/count/hash evidence for context-provider nesting, context provider value prop records/hashes with literal provider value evidence, static identifier/member reference-binding evidence, static optional-chain reference-binding evidence, static call-free object/array value evidence, or `jsx-render-context-provider-value-unsupported` plus provider-value dynamic blocker metadata (`dynamicBlockerReasonCode` values such as `jsx-render-context-provider-value-call-expression-unsupported` and `jsx-render-context-provider-value-computed-reference-unsupported`) for call/computed/optional/spread values, context consumer target records/hashes with static identifier/member target evidence, static optional target evidence, or `jsx-render-context-consumer-target-unsupported` plus dynamic-target blockers for computed/call targets, static lexical provider-ancestor lookup records/hashes for matching context consumers with `jsx-render-context-consumer-provider-lookup-static-evidence`, same-file direct component provider lookup evidence for plain identifier callsites and same-file member component provider lookup evidence for static object-literal callsites such as `UI.Child` with `jsx-render-context-consumer-provider-component-lookup-static-evidence`, same-file `{children}` / `props.children` / `this.props.children` provider-flow evidence for components that render children directly inside a static provider with `jsx-render-context-consumer-provider-component-flow-static-evidence`, project-local named/aliased named/default component-import and member-object provider lookup evidence plus explicit named/default, member-object, and unique star barrel re-export component evidence with `jsx-render-context-consumer-provider-project-component-lookup-static-evidence`, project-import children-flow evidence with `jsx-render-context-consumer-provider-project-component-flow-static-evidence`, while dynamic/ambiguous member, unresolved, external-runtime, and ambiguous-star component targets emit `jsx-render-context-consumer-provider-component-target-unsupported`, hook call-order/count/hash render-risk evidence, hook dependency-array records/counts/hashes with per-item literal/reference/static optional-reference evidence, dynamic computed/call blocker reason codes, static dependency-set evidence, or `jsx-render-hook-dependency-array-unsupported` for dynamic dependency expressions, effect-hook callback/cleanup records/counts/hashes with static callback/cleanup source evidence, callback reference-path metadata, static optional callback/cleanup evidence, dynamic callback/cleanup blocker reason codes, runtime-equivalence-unproved evidence, or `jsx-render-hook-effect-unsupported` for dynamic effect factories and cleanup returns, public component render-return records/counts/hashes with static return-expression evidence, static array/fragment return collection child records/hashes, plus `jsx-render-return-branch-unsupported` for branchy/conditional returns, static `memo` / `forwardRef` / `observer` / `React.lazy` component-wrapper render-risk records including lazy import-factory evidence and lazy-load/runtime proof gaps, event-handler prop records/counts/hashes with static handler-reference evidence, static optional handler-reference evidence, static inline handler expression evidence, same-owner local handler declaration hashes via `jsx-render-event-handler-local-declaration-evidence`, or `jsx-render-event-handler-prop-unsupported` with computed/call blocker metadata for handler factory/call expressions, and public JSX prop/spread/child-order/render-risk delta conflicts produce review/blocking evidence with reason codes such as `jsx-render-context-provider-nesting-unsupported`, `jsx-render-prop-value-literal-evidence`, `jsx-render-prop-value-static-reference-evidence`, `jsx-render-prop-value-static-optional-reference-evidence`, `jsx-render-prop-value-unsupported`, `jsx-render-component-prop-flow-static-passthrough-evidence`, `jsx-render-component-prop-flow-dynamic-value-unsupported`, `jsx-render-component-prop-flow-unsupported`, `jsx-render-context-provider-value-literal-evidence`, `jsx-render-context-provider-value-static-reference-evidence`, `jsx-render-context-provider-value-static-optional-reference-evidence`, `jsx-render-context-provider-value-static-data-evidence`, `jsx-render-context-provider-value-unsupported`, `jsx-render-context-consumer-target-static-evidence`, `jsx-render-context-consumer-target-static-optional-reference-evidence`, `jsx-render-context-consumer-provider-lookup-static-evidence`, `jsx-render-context-consumer-provider-component-lookup-static-evidence`, `jsx-render-context-consumer-provider-component-flow-static-evidence`, `jsx-render-context-consumer-provider-project-component-lookup-static-evidence`, `jsx-render-context-consumer-provider-project-component-flow-static-evidence`, `jsx-render-context-consumer-provider-component-target-unsupported`, `jsx-render-context-consumer-target-unsupported`, `jsx-render-hook-call-order-unsupported`, `jsx-render-hook-dependency-array-static-evidence`, `jsx-render-hook-dependency-array-unsupported`, `jsx-render-hook-effect-static-callback-evidence`, `jsx-render-hook-effect-static-optional-callback-evidence`, `jsx-render-hook-effect-static-cleanup-evidence`, `jsx-render-hook-effect-static-optional-cleanup-evidence`, `jsx-render-hook-effect-runtime-equivalence-unproved`, `jsx-render-hook-effect-unsupported`, `jsx-render-return-static-evidence`, `jsx-render-return-array-static-evidence`, `jsx-render-return-fragment-static-evidence`, `jsx-render-return-branch-unsupported`, `jsx-render-component-wrapper-lazy-boundary-evidence`, `jsx-render-component-wrapper-lazy-runtime-equivalence-unproved`, `jsx-render-event-handler-prop-static-evidence`, `jsx-render-event-handler-prop-static-optional-reference-evidence`, `jsx-render-event-handler-prop-static-inline-evidence`, `jsx-render-event-handler-local-declaration-evidence`, and `jsx-render-event-handler-prop-unsupported`. Full component render equivalence, lazy-load/runtime equivalence, dynamic context value semantics beyond value-expression identity, provider lookup across external/runtime/ambiguous imported component boundaries, arbitrary prop/render flow beyond bounded static passthrough evidence, optional-chain render equivalence beyond callsite identity evidence, executable hook effect equivalence, and framework template semantics are not proved. |
| Control-flow/effect graph | Partial | Lightweight dependency/effect regions, same-line short-circuit guard evidence including logical assignment operators, static mutation target/operator/mutator evidence for assignment/update/delete/mutating-call regions including literal-computed mutation key evidence such as `state["visible"]` while dynamic computed targets remain marked dynamic, bounded same-line repeated assignment/update/delete/mutating-call mutation occurrence regions with per-occurrence target evidence, direct/receiver/literal-computed/same-scope const-bound computed/dynamic-computed/optional-receiver/optional-call/constructor/dotted-tagged-template/computed-tagged-template effect target evidence for recognized network/scheduler/storage/host/browser/tagged-template effect regions with false runtime-equivalence claims, global bracket-call ranges for `window`/`globalThis`/`self` calls such as `window["fetch"]`, `globalThis["setTimeout"]`, and `self["queueMicrotask"]`, optional global effect-call ranges for nullish-boundary calls such as `window?.fetch?.(api)`, `globalThis?.["setTimeout"]?.(api)`, and `self?.queueMicrotask?.(api)`, full scheduler API target ranges for timer/cancel/idle/immediate calls such as `clearTimeout`, `cancelAnimationFrame`, `requestIdleCallback`, `setImmediate`, and `clearImmediate`, exact constructor expression ranges for browser/network constructors such as `new Worker`, `new SharedWorker`, and `new WebSocket`, bounded same-line repeated named network/scheduler call occurrence regions, bounded same-line repeated constructor occurrence regions, bounded same-line repeated tagged-template occurrence regions, bounded same-line repeated await occurrence regions with per-await target and prefix-order evidence, bounded same-line repeated yield occurrence regions with per-yield target evidence, bounded storage/host/browser/import.meta token effect occurrence regions, same-line await-prefix order evidence, Promise combinator concurrency/settlement evidence for `Promise.all`/`allSettled`/`race`/`any` with direct array element position and false runtime-equivalence claims, module-scope top-level await runtime-scope evidence, source-bound top-level await proof binding for project runtime-region conflicts that validates source hashes, region identity, suspension-order hash, module/suspension trace evidence, signature hash, and false claim flags before suppressing the conflict, class static block initialization-order evidence, source-bound class static block proof binding for project runtime-region conflicts that validates source hashes, region identity, static-initialization order hash, execution trace evidence, signature hash, and false claim flags before suppressing the conflict, explicit resource-management `using`/`await using` acquisition and reverse lexical disposal-order evidence with no disposal-effect equivalence claim, source-bound resource-management disposal proof binding for project runtime-region conflicts that validates source hashes, region identity, disposal-order hash, async-disposal trace evidence, signature hash, and false claim flags before suppressing the conflict, static `import.meta` host-context member evidence, host-context member-path evidence in semantic sidecars, source-bound import.meta host-context proof binding for project runtime-region conflicts that validates source hashes, region identity, host-context member hash, host-resolution trace evidence, signature hash, and false claim flags before suppressing the conflict, host-dependent `import.meta` divergence fixture coverage, optional-chain/nullish-boundary order evidence for optional mutating calls, same-line conditional-expression guard/branch evidence for runtime-sensitive regions, structured same-line throw expression/order evidence for exception regions, structured loop-iteration evidence for `for`/`for-of`/`for-await-of`/`for-in`/`while`/`do` effects and mutations, `break`/`continue` transfer evidence for loop/switch exit and next-iteration order including lexical labeled-transfer target records, return/yield completion-value evidence for exit regions, `yield*` iterator-delegation evidence with delegated iterable text plus false iterator-protocol and completion-propagation equivalence claims, source-bound generator protocol proof binding for project runtime-region conflicts that validates source hashes, yield-star region identity, generator protocol order hash, iterator/completion trace evidence, signature hash, and false claim flags before suppressing the conflict, source-bound async-generator protocol proof binding that additionally requires async iterator, cancellation, and backpressure traces plus false async-protocol claim flags, bounded same-block unreachable-after-return/throw/break/continue evidence, simple exhaustive `if`/`else` plus `if`/`else if`/`else` completion evidence, bounded tail-position nested block/control completion evidence, and `try`/`catch`/`finally` finalizer return-or-throw completion evidence for later runtime-sensitive regions without a full path-reachability claim, switch/case/default dispatch evidence plus switch fallthrough/prior-case completion evidence for effects and mutations inside case arms, try/catch throw-path evidence, try/finally completion-order evidence for runtime-order-sensitive effects and mutations, bounded nested path reachability records with `reachabilityOrder`, typed public runtime-order evidence records, source-bound runtime-order proof evidence that rejects boolean/status-only and stale source proofs, project runtime-region records, public runtime-region delta conflicts with runtime-order admission reason codes, unsafe control-flow fixtures, rest-callee pure call-argument append admission with explicit same-language replacement evidence, and adversarial blockers for nested calls, method/optional callees, comments, duplicate object literals, spread arguments, stale spans, and spoofed callee-signature evidence. Executable effect equivalence, iterator-protocol equivalence, disposal side-effect equivalence, dynamic computed effect target equivalence, dynamic nested-path reachability, and full path reachability are not proved. |
| Generic semantic edit admission | Partial | Semantic edit scripts, projection/replay, offset and line/column source-span roundtrip proof, output source/hash-bound replay-clean project proof records, replay IDs/statuses/diagnostic categories, replay overlap diagnostics, patch bundles, lineage records, JS/TS safe-merge fallbacks, and shared exact-branch project admission helpers carry admission evidence with `autoMergeClaim: false`. Positive bundle admission now requires every accepted-clean replay to carry the bounded `admit-independent-semantic-edit-current-head-commutation` proof route with replay id, source path, applied operation metadata, exact current/output/projection hash bindings, and false broad-claim flags; summary-only or hash-only accepted-clean counters route to review with `semantic-edit-replay-current-head-proof-missing`. Bundle comparisons also expose `semantic-patch-bundle-non-overlap` proof metadata, `nonOverlapProof`, `autoApplyBlocker`, and replay-current-only diagnostics before multiple bundles can be treated as independent. Clean current-head replay proof can route through bounded `admit-independent-semantic-edit-current-head-commutation` when current-source and output hashes are exact-bound. Missing or partial clean replay proof routes to `produce-semantic-edit-replay-proof`, stale current-head proof routes to `rerun-semantic-edit-replay-current-head`, and output-mismatched replay proof routes to `reject-semantic-edit-replay-output-mismatch` instead of becoming a broad equivalence claim. Project admission also emits normalized structural route records for missing-evidence review, semantic replay reject/rerun, symbol rename/move/split-merge apply paths, and stale split/merge rebase paths. |
| Unsupported JS/TS surface coverage | Partial | `proofEvidence` records `unsupported-js-ts-surface-review`, masked-code observed-surface metadata with source spans, line/column, excerpts, `observedSurfaceKind`, focused `boundedEvidence`, and explicit `remainingProofGap` / `proofGapCode` fields so known bounded surfaces no longer collapse into stale generic partial reason codes. Current focused evidence metadata covers explicit resource-management acquisition/disposal order with disposal effects still unproved, decorator static target/expression metadata with source-bound runtime proof binding when supplied while missing/stale/trace-incomplete decorator runtime proof stays fail-closed, accessor/private class static shape with source- and required-signal-bound runtime proof binding when supplied while missing, stale, trace-incomplete, schema/kind-mismatched, required-signal-incomplete, commandless, or claim-bearing proof stays fail-closed, class static block initialization-order evidence with source-bound static-initialization proof binding when supplied while missing/stale/trace-incomplete proof stays fail-closed, enum runtime-shape/member-value evidence plus source-bound computed-value traces while broad enum runtime evaluation remains unproved, namespace/ambient/global/`export =` static module-shape evidence with runtime or compatibility equivalence still unproved, `import.meta` host-context member evidence with source-bound host-resolution proof binding when supplied while missing, stale, trace-incomplete, or claim-bearing proof stays fail-closed, inference-syntax evidence for `satisfies`, `as const`, and const type parameters with broad inference semantics still unproved, generator and async-generator yield/await ordering evidence with source-bound generator/async-generator protocol proof binding when supplied while missing, stale, trace-incomplete, or claim-bearing proof stays fail-closed, and top-level `await` runtime-scope evidence with source-bound suspension/module-evaluation proof binding when supplied while missing/stale/trace-incomplete proof stays fail-closed. The review routes remaining proof gaps to `prove-unsupported-js-ts-surface`, focused resource-management disposal proof, focused private/accessor runtime proof, focused generator protocol routes, and focused decorator runtime proof routes, keeps `autoMergeClaim: false` and `semanticEquivalenceClaim: false`, and does not claim executable semantic equivalence. |
| Semantic equivalence proof | Bounded evidence | `proofEvidence` records syntax identity, parser roundtrip, diagnostics, declaration output, focused tests, explicit `semantic-equivalence-unknown` by default, and opt-in source/output/gate-bound external `semantic-equivalence-external` proof records. A valid external proof can set aggregate `semanticEquivalenceClaim: true` for the exact project binding while `autoMergeClaim` remains false; stale, schema/kind-mismatched, output-hash-mismatched, gate-mismatched, or auto-merge-claiming proofs fail closed and retain unknown equivalence. |
| Cross-file symbol rename | Partial | Default admission now covers the narrow exact worker/head branch case when a single exported symbol rename has every project import rewritten, no stale or duplicate import/export evidence, project graph delta evidence is requested, and diagnostics/declaration gates pass. Opt-in `allowProjectSymbolRenames` remains available for broader caller-reviewed exact branch admissions. |
| Symbol move between files | Partial | Default admission now covers the narrow exact worker/head branch case when a single exported symbol move has every project import rewritten, no ambiguous/multiple/stale move evidence, project graph delta evidence is requested, and diagnostics/declaration gates pass. Opt-in `allowProjectSymbolMoves` remains available for broader caller-reviewed exact branch admissions. |
| Split/merge modules/classes | Partial | Default path still blocks, but opt-in `allowProjectSplitMerges` admits exact branch output/deletions for module/class split and merge classifications only when moved declarations or class members form a one-to-one source/target partition, the other branch is unchanged, output project graph evidence is requested, diagnostics/declaration evidence passes, and generated-output boundaries are absent. Duplicate, missing, or extra structural keys route to `exact-structural-partition-proof` instead of becoming an admission. |
| Real-repo benchmark suite | Partial | Manifest-only TypeScript/Vite/Prettier/Next/React corpus is validated and emitted by `bench/smoke.mjs`; compact synthetic Vite import-shape, Vite `import.meta` host-context divergence, and React TSX child-addition fixtures are asserted, comments/source-map boundary fixtures cover the parser/source-span row, and no third-party source is vendored. The real-repo bench asserts and emits 14 oracle cases across 5 matrix rows (`control-flow-effect`, `jsx-tsx-element-prop`, `module-export-import`, `parser-source-span-trivia`, `type-public-api`), maps those rows to production admission audit surfaces (`control-flow-effect-graph`, `jsx-tsx-element-prop-graph`, `module-export-import-graph`, `parser-source-span-trivia`, `type-public-api-graph`), requires all oracle fixtures and expected admission statuses to match corpus fixtures, exposes `realRepoCorpusOracleCoverageRatio` with basis `entriesWithOracleCases/entries`, and keeps the non-matrix route-policy surface `order-sensitive-member-regions` explicit through `realRepoCorpusOracleUnmappedSurfaceIds`. Every declared real-repo merge surface now emits a matrix row or exact fail-closed route: `object-members` and `order-sensitive-member-regions` are counted in `realRepoCorpusMergeSurfaceFailClosedSurfaceIds`, routed through `parse-ledger` and `preserve-base-order` with fixture-bound reasons `object-region-kind-not-safe-listed` and `order-sensitive-region-kind:route`, and `realRepoCorpusMergeSurfaceUnroutedSurfaces` is asserted at 0; per-entry local checkout proof rows plus explicit evidence rows separate manifest metadata, checkout root/dir presence, checkout proof status/reason, proof execution, dependency-install proof/execution, repository-command proof/execution, `.git` metadata kind, gitdir pointer/config/origin presence, and lockfile/package-manager metadata under `tmp/js-ts-semantic-merge-real-repos` or `FRONTIER_REAL_REPO_CORPUS_ROOT`, offline npm/pnpm/yarn command-matrix metadata, per-entry `commandDryRunPhases` for dependency-install/build/test with skipped, ready-local-checkout, and opt-in-required assertions, and guarded opt-in `commandRunPhases` that verify realpath containment, proof-glob match, git identity, single package manager, allowlisted argv/env, timeout, exit, hash, capped-output, skipped-checkout, failed-command, and truncation evidence. Dependency installation and checked-out repository build/test execution remain default-off unless explicitly enabled, but the local runner and proof artifacts now exist. |
| Telemetry/confidence routing | Partial | Project merge results now include compact `evidence`, `confidence`, confidence score/level, confidence dimensions, missing signals, next missing evidence route IDs, summary/matrix counters, missing-evidence `byLane` counters, `confidence.routingCalibration` route/lane/action/proof-level counters with next-route metadata, deterministic `routeWorklist` / `nextRouteWork` coordinator work items that merge missing evidence with focused proof gaps, and proof-summary unsupported-surface counts/kinds/reason codes for coordinator routing; failed quality gates remain blocked but promote `rerun` confidence with `rerun-project-quality-gate` evidence. |

Recent residual closures represented in the matrix shards:

- HTML/CSS browser runtime proof admission now accepts the HTML package source-bound browser/runtime proof aliases and boundary/attribute metadata aliases at project level, while still rejecting broad self-claiming proofs and requiring exact source/output hashes, runtime command, probe id, evidence hash, and required runtime signals.
- Parser/source-span/trivia now exposes source-map generated-boundary gate fields on project source file/span records and blocks position-only or missing exact generated-boundary ownership evidence as `project-generated-source-boundary-ownership-blocked`.
- Parser/source-span/trivia now promotes failed `source-span-roundtrip` proof records into `project-source-span-roundtrip-proof-failed` project admission blockers so trivia-loss output cannot remain `merged`.
- Parser/source-span/trivia now fails `source-span-roundtrip` proof when verified artifacts do not bind replay current-source hashes and projected/replayed output hashes to the changed project output.
- Module/export/import graph now treats top-level `moduleResolution.imports` as scoped to `packageRoot`/`root`; importers outside that root fail closed with `package-import-scope-missing`.
- Module/export/import graph now keeps non-resolver host package specifiers fail-closed when package `import` / `require` targets diverge, using `host-runtime-ambiguous` evidence instead of inheriting caller package type.
- Module/export/import graph now attaches module-resolution proof routes and explicit false auto/semantic/runtime equivalence claim flags to unresolved output module edges, including package `imports` host-runtime ambiguity routed to `prove-package-import-host-runtime-resolution`.
- Scope/use-def graph now records exact compiler reference-site proof hashes and blocks ambiguous or compiler/lexical-mismatched reference evidence.
- Scope/use-def graph now attaches TypeScript checker proof hashes to full `this`/`super` receiver-member access spans, including private identifiers.
- Scope/use-def graph now collects object, nested object, array, alias, default-initializer, and rest bindings from function and arrow parameter lists without treating property keys as parameter bindings.
- Type/public API proof records now bind source path/hash for public compiler evidence and fail closed when source-bound proof is missing.
- Type/public API proof records now bind public type references to TypeScript checker target symbols, declaration spans, and declaration source text hashes, and fail closed when target proof hashes are missing.
- Type/public API and unsupported-surface evidence now separate static decorator metadata proof from decorator runtime execution equivalence with the `prove-decorator-runtime-execution-equivalence` route and a source-bound decorator runtime proof bridge for trace-backed evidence.
- Type/public API and unsupported-surface evidence now harden private/accessor runtime proof binding with derived required signals, exact schema/kind checks, command/trace/evidence hashes, and trace slots for private brand checks, private method calls, private accessors, static private access, subclass brand boundaries, and accessor descriptors.
- JSX/TSX graph evidence now includes imported provider-wrapper children-flow lookup hashes and keeps wrappers that do not render children unsupported.
- JSX/TSX graph evidence now records literal, boolean shorthand, static-reference, and static optional-chain prop-value callsites plus static optional-chain context provider value bindings while blocking optional computed/call expressions and component prop render flow.
- JSX/TSX graph evidence now records per-item hook dependency records for literals, references, static optional references, and dynamic computed/call blockers.
- JSX/TSX graph evidence now records `useContext` target reference paths, static optional target paths, and dynamic computed/call blocker reason codes.
- JSX/TSX graph evidence now records hook-effect callback reference paths, static optional callback/cleanup references, and dynamic callback/cleanup blocker reason codes.
- JSX/TSX graph evidence now records static optional event-handler references while keeping computed handlers and handler factory calls on dynamic blocker routes.
- Control-flow/effect evidence includes bounded exhaustive `switch`/`case`/`default` return-or-throw reachability, bounded tail-position nested completion reachability, and `try`/`catch`/`finally` finalizer return-or-throw reachability for later runtime-sensitive regions, without a full path-reachability claim.
- Generic semantic edit admission binds replay proof to the current project head hash, requires bounded replay proof with replay/source identity and applied-operation metadata before positive bundle admission, records non-overlap proof metadata on bundle comparisons, routes summary-only or hash-only clean replay claims to `semantic-edit-replay-current-head-proof-missing`, routes stale replay artifacts to `rerun-semantic-edit-replay-current-head`, and routes output-mismatched replay proof to `reject-semantic-edit-replay-output-mismatch`.
- Generic semantic edit admission now counts semantic operation line/column spans as source-span roundtrip evidence, so clean current-head replay fixtures no longer route to `produce-source-span-roundtrip-evidence` solely because they lack raw offset spans.
- Split/merge module and class admissions now require exact structural partition evidence; duplicate moved declarations or members stay blocked with `exact-structural-partition-proof`, while stale other-branch output records an `other-branch-unchanged-proof` blocker.
- Project admission now exposes `admission.routes` / `routeSummary` records for structural apply/review/reject/rerun/rebase decisions across cross-file symbol rename, symbol move, split/merge, replay-proof, and missing-evidence paths, while keeping `autoMergeClaim: false` and `semanticEquivalenceClaim: false`.
- Semantic equivalence proof now accepts source/output/gate-bound external proof records for exact JS/TS project bindings, removes the external-proof missing route only when the proof validates, and keeps stale, malformed, or overclaiming proofs fail-closed with `semantic-equivalence-unknown`.
- Parser/source-span/trivia now requires contiguous parser-backed current-source token/comment/trivia coverage with no gaps, overlaps, truncation, or text mismatches before claiming exact token/comment ownership, including distinct JSDoc and block-comment ownership relations.
- Parser/source-span/trivia now emits first-class ESTree/Babel `parserSpanCoverageProof` evidence from token/comment ranges, threads it into parser-trivia exactness, source file/span records, ownership anchors, and source-span roundtrip summaries, and keeps truncated syntax-AST coverage fail-closed.
- HTML/CSS parser/source evidence now requires facade base/worker/head source-hash binding before merged parser evidence counts, and rejects supplied parser-side source-hash aliases that do not match the bound side hash.
- Scope/use-def graph now blocks compiler/lexical import-alias re-export target disagreement with `typescript-compiler-reference-import-alias-target-mismatch`.
- Scope/use-def graph now routes nested alias-resolution and compiler reference-site blocker statuses to public ambiguous-evidence conflicts even when stale records omit mirrored top-level blocker fields.
- Scope/use-def graph now treats no-expression template literals in namespace-import and `this`/`super` computed member reads as static member evidence while expression templates remain blocked.
- JSX/TSX prop-flow graph now admits same-file component prop passthrough for static optional-chain callsite evidence, while optional computed members remain blocked and render equivalence stays unproved.
- Module/export/import graph now treats duplicate package names across different workspace roots as `ambiguous-package-workspace-root` and emits fail-closed `package-workspace-root-ambiguous-missing` edges.
- Module/export/import graph now preserves edge-specific fail-closed module evidence through `project-output-module-unresolved` conflicts instead of collapsing package, host, dynamic import, and import-attribute blockers into a generic module miss.
- Module/export/import graph now preserves edge-specific package/import-attribute evidence through `project-output-symbol-unresolved` conflicts when a module resolves but the requested export is missing.
- Module/export/import graph now preserves normalized import-attribute key/value records through static imports, dynamic imports, re-export identities, graph delta conflicts, and unresolved-edge evidence instead of relying on hashes alone.
- Module/export/import graph now stitches CommonJS `Object.defineProperty` getter re-exports through block-bodied arrow getter descriptors when they statically return a require-alias member.
- Module/export/import graph now stitches CommonJS `Object.defineProperty` getter re-exports through named function getter descriptors when they statically return a require-alias member.
- Module/export/import graph now normalizes ESTree/Babel no-expression `TemplateLiteral` nodes as static CommonJS `require` and export specifiers while leaving dynamic template expressions unresolved.
- Module/export/import graph now records no-substitution template dynamic imports and parser-backed CommonJS helper `require` templates as static module edges while keeping expression templates proof-required.
- Module/export/import graph now records no-substitution/static template host dependencies for `new URL`, workers, resolver calls, and `importScripts` while leaving expression templates unsupported.
- Module/export/import graph now emits dynamic host dependency targets as `<host-dependency>` edges with expression hashes and proof-required unresolved evidence instead of omitting them.
- CSS Modules graph records now infer local class export evidence, source-local composition graph hashes, export-only ICSS graph hashes, project-source graph hashes for cross-file `composes` / ICSS imports when every referenced `.module.css` source is present and source-inferred, and source-bounded class helper token graph hashes for single top-level `className` helper calls whose CSS Module reads are statically enumerable; package/bundler-only composition, unresolved ICSS imports, generated class-name maps, bundler transform identity, source-map proof, dynamic member access, writes, nested helper calls, and arbitrary helper runtime equivalence remain fail-closed without host evidence.
- CSS Modules use-site graph evidence now suppresses `css-module-helper-call-unproved` only for source-bounded helper calls with deterministic token enumeration, while preserving transform proof blockers and keeping nested calls/dynamic keys on review routes.
- CSS Modules use-site graph evidence now admits named CSS Module imports only when source-bound scope/use-def reference records tie the local identifier back to the imported CSS export, while preserving generated class-name map, bundler transform identity, and source-map proof blockers.
- CSS Modules admission matrix reporting now separates generated class-name map, bundler transform identity, and source-map identity proof boundaries from non-transform use-site graph blockers; stale declared generated map hashes remain generated-map blockers, and these source/transform evidence rows stay fail-closed without claiming browser, render, or cascade equivalence.
- Type/public API graph now includes bounded TypeChecker assignability oracle proof for simple public type aliases while keeping semantic/runtime equivalence claims false.
- JSX/TSX graph now records same-file and project-local named/default/barrel-import static component prop passthrough as `jsx-render-component-prop-flow-static-passthrough-evidence` and blocks dynamic callsite values with `jsx-render-component-prop-flow-dynamic-value-unsupported`.
- JSX/TSX graph now records static `memo` / `forwardRef` / `observer` / `React.lazy` component wrapper chains as component-wrapper render-risk evidence while keeping render, lazy-load, and runtime equivalence explicitly unproved.
- JSX/TSX graph now records public const-arrow components with implicit JSX expression returns as static render-return evidence without treating them as branch control flow.
- JSX/TSX graph now records top-level conditional JSX return condition/consequent/alternate branch arms as static evidence while still routing branchy render equivalence to review.
- JSX/TSX graph now records top-level logical JSX return operators and left/right guard arms as static evidence while still routing branchy render equivalence to review.
- JSX/TSX graph now accepts source-bound branch-arm/guard preservation proof for single top-level conditional/logical render returns, including explicit conditional condition origins, suppressing only the matching render-risk conflict while stale hashes, condition/arm mismatches, non-render risks, and broad render/runtime equivalence claims remain blocked.
- JSX/TSX graph now records static JSX array-return and fragment-return collection evidence, including child/item counts, texts, hashes, and collection hashes while keeping render equivalence review-only.
- Control-flow/effect evidence now records same-line `then` / `catch` / `finally` promise-chain handler order, nested handler-step attribution, rejection/finalizer markers, and false handler/runtime equivalence claims for order-sensitive effect admission.
- Control-flow/effect evidence now adds a source-bound promise runtime proof bridge for `Promise.all`/`allSettled`/`race`/`any` combinator order and `then`/`catch`/`finally` chain order, requiring concurrency, settlement, element-order, handler, rejection-flow, and finalizer traces plus false promise equivalence claims before suppressing project runtime-region conflicts.
- Control-flow/effect evidence now records effect target order for direct, receiver, literal-computed, same-scope const-bound computed, dynamic-computed, constructor, dotted tagged-template, and computed tagged-template effect targets while keeping runtime equivalence false.
- Control-flow/effect evidence now adds a source-bound effect-target proof bridge for project runtime-region conflicts, requiring target-order hashes, target-resolution traces, dynamic computed-key, bound literal, optional-call, tagged-template, and constructor traces when applicable, command/trace/evidence hashes, source hashes, signature hash, and false equivalence claims.
- Control-flow/effect evidence now includes bounded nested path reachability records with `reachabilityOrder`; unsupported or dynamic nested paths omit reachability proof instead of broadening the claim.
- Control-flow/effect evidence now records static literal-computed mutation keys separately from dynamic computed mutation targets while keeping runtime equivalence false.
- Control-flow/effect evidence now records literal-computed mutator method calls such as `queue["push"](value)`, optional-call boundaries, computed method names, and false runtime-equivalence claims.
- Unsupported-surface review records generator and async-generator functions as focused yield/await-order evidence and keeps broad iterator/async-iterator protocol equivalence unclaimed unless a source-bound protocol proof is supplied.
- Control-flow/effect evidence now records `yield*` as iterator delegation with delegated iterable text and explicit iterator-protocol/completion-propagation proof gaps, plus source-bound generator and async-generator protocol proof bridges for project runtime-region conflict admission.
- Control-flow/effect evidence now adds a source-bound class static block proof bridge for static-initialization order and execution-trace evidence before suppressing project runtime-region conflicts.
- Control-flow/effect evidence now adds a source-bound top-level await proof bridge for suspension order and module-evaluation trace evidence before suppressing project runtime-region conflicts.
- Generic semantic edit admission now has a bounded `admit-independent-semantic-edit-current-head-commutation` route for clean current-head replay proofs while stale and output-mismatched proof routes remain rerun/reject.
- Symbol move admission now has a narrow default path for exact exported moves with complete import rewrites, graph evidence, and diagnostics/declaration gates; ambiguous and multiple moves stay blocked.
- Real-repo corpus evidence now exposes per-entry `commandDryRunPhases` plus guarded opt-in `commandRunPhases` for dependency-install/build/test with default-off, skipped-checkout, executed, failed, and truncated-output proof coverage.
- Telemetry/confidence routing now includes lane-level missing-evidence counters, compact `confidence.routingCalibration` route/lane/action/proof-level counters, and a deterministic route worklist for the next coordinator action.

`confidence.admissionMatrixAudit` turns the partial JS/TS matrix rows into a
compact serializable audit. Each row is keyed by a stable surface id, lists the
current proof levels and statuses for that surface, and records both applicable
route IDs and currently missing route IDs such as `include-project-graph-delta`,
`emit-output-declarations`, `produce-semantic-edit-replay-proof`, and
`external-semantic-equivalence-proof`. The audit
keeps `autoMergeClaim: false` and `semanticEquivalenceClaim: false`; unknown
semantic equivalence remains explicit until an external proof exists.

Artifact-size and runtime note: these graph options are deliberately opt-in.
On a local Node v26.1.0 smoke fixture with 10 small JS/TS files and 36 scanned
stage files for the delta case, baseline project merge JSON was 115 KB at a
21.6 ms median. `includeOutputProjectSymbolGraph` raised the returned JSON to
17.8 MB at a 303.1 ms median, and `includeProjectGraphDelta` raised it to
83.0 MB at a 1,466.8 ms median. Pass `projectGraphLimits` for admission queues:
`maxFiles`, `maxSourceBytes`, `maxSourceSpans`, `maxImportEdges`, `maxExportEdges`, and
`maxSerializedBytes` produce `project-graph-limit-exceeded` conflicts with the
stage, limit kind, actual value, and configured limit. Limit failures block
admission and omit oversized project graph artifacts from the returned result.
Invalid limits such as negative numbers, `NaN`, or infinity fail closed with
`project-graph-limit-invalid`.

High-risk native features also have explicit evidence policies. These policies are advisory in this package: they tell a swarm or admission queue what evidence is missing without silently changing the existing readiness classification.

```js
import {
  getNativeImportFeatureEvidencePolicy,
  summarizeNativeImportFeatureEvidence
} from '@shapeshift-labs/frontier-lang-compiler';

const policy = getNativeImportFeatureEvidencePolicy('preprocessor');
console.log(policy.requiredEvidenceKeys); // ["preprocessedOutputHash", "definesHash"]

const featureEvidence = summarizeNativeImportFeatureEvidence(imported.losses, {
  evidence: imported.evidence
});

console.log(featureEvidence.highestRisk);
console.log(featureEvidence.missingRequiredEvidence);
```

Ask the compiler what is actually covered before sending native imports into a merge queue:

```js
import {
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createProjectionTargetLossMatrix,
  createUniversalCapabilityMatrix,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionPlan,
  importNativeSource
} from '@shapeshift-labs/frontier-lang-compiler';

const imported = importNativeSource({
  language: 'python',
  sourcePath: 'todo.py',
  sourceText: 'def add_todo(title):\n    return title\n'
});

const matrix = createNativeImportCoverageMatrix({ imports: [imported] });
const python = matrix.languages.find((entry) => entry.language === 'python');

console.log(python.imports.readiness); // scanner imports are intentionally review-required
console.log(python.parserAdapters); // host-owned exact parsers such as LibCST can be injected

const parserMatrix = createNativeParserAstFormatMatrix({ imports: [imported] });
console.log(parserMatrix.formats.find((entry) => entry.id === 'python-ast')?.adapters.total ?? 0);

const projectionMatrix = createProjectionTargetLossMatrix({ imports: [imported] });
const pythonProjection = projectionMatrix.languages.find((entry) => entry.language === 'python');

console.log(pythonProjection.sourceProjection.exactSource.lossClass); // "exactSourceProjection"
console.log(pythonProjection.sourceProjection.stubs.lossClass); // "nativeSourceStubs"
console.log(pythonProjection.targets.find((entry) => entry.target === 'rust').lossClass); // "missingAdapter"

const universalMatrix = createUniversalCapabilityMatrix({
  imports: [imported],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
const pythonUniversal = universalMatrix.languages.find((entry) => entry.language === 'python');

console.log(pythonUniversal.readiness); // combined import/parser/projection readiness
console.log(pythonUniversal.blockers); // missing evidence/adapters that prevent merge admission

const conversionPlan = createUniversalConversionPlan({
  imports: [imported],
  targets: ['python', 'rust'],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
const pythonToRust = queryUniversalConversionPlan(conversionPlan, {
  sourceLanguage: 'python',
  target: 'rust'
}).bestRoute;

console.log(pythonToRust.mode); // "semantic-index-only", "target-adapter", "stub-only", etc.
console.log(pythonToRust.missingEvidence); // adapter/proof/source-map gaps for swarm workers
console.log(pythonToRust.mergeScore.value); // sortable merge-review score, not a proof

const conversionArtifacts = createUniversalConversionArtifacts(conversionPlan);
console.log(conversionArtifacts.historyRecords[0].kind); // "frontier.lang.semanticHistoryRecord"
console.log(conversionArtifacts.patchBundleRecords[0].admission.autoMergeClaim); // false
console.log(conversionArtifacts.admissionRecords[0].admissionBucket); // "blocked", "needs-evidence", "merge-ready", etc.
console.log(conversionArtifacts.index.semanticOperationKinds); // sourcePreservation/projection/merge
console.log(conversionArtifacts.routeArtifacts[0].semanticOperations.summary.conflictKeys);
```

The projection target matrix separates five runtime/API classes:

- `exactSourceProjection`: exact source can be emitted when the import carries matching source text or source-preservation evidence.
- `nativeSourceStubs`: declaration stubs can be emitted, but bodies, resolved types, and executable semantics are review-required.
- `unsupportedTargetFeatures`: a target slot exists, but the source profile or import evidence declares features such as macros, preprocessors, dynamic runtime behavior, generated code, unsupported syntax, or unresolved inference that this facade cannot prove lossless.
- `targetAdapterProjection`: a host-owned native-to-target adapter is present and produced target output with its own evidence/readiness.
- `missingAdapter`: no native-to-target projection adapter is declared; preserve or stub the original source language instead, or inject host-owned parser/semantic adapter evidence.

`createUniversalCapabilityMatrix` composes the import coverage, parser AST format, parser feature, and projection target matrices into a single language row per source language. It is the coordinator-facing view for universal-language work: it shows imports, symbols, source-map mappings, parser feature readiness, projection targets, missing adapters, unsupported target features, blockers, and review reasons without claiming lossless conversion where evidence is absent.

`createUniversalConversionPlan` turns that capability evidence into coordinator tasks: preserve exact source, run a target adapter, emit stubs, attach semantic-index evidence, or block the route until missing parser/adapter/proof evidence exists. Every route carries `autoMergeClaim: false`, `semanticEquivalenceClaim: false`, missing evidence, task hints, and a `frontier.lang.semanticMergeScore.v1` score for swarm merge admission.

`createUniversalConversionArtifacts` materializes those route refs into compact `SemanticHistoryRecord`, `SemanticPatchBundleRecord`, semantic operation sets, and `UniversalConversionAdmissionRecord` rows that swarm collectors can index by route, history ID, patch-bundle ID, admission-record ID, admission bucket, risk, operation kind, source path, ownership key, conflict key, evidence, proof, readiness, and admission status. It is still review evidence, not target-code proof: blocked and semantic-index-only routes stay blocked/needs-review, and every artifact keeps `autoMergeClaim: false` plus `semanticEquivalenceClaim: false`.

Preserve exact native source text, token/trivia hashes, comments, whitespace, and source directives as evidence. This does not claim full semantic understanding; it keeps round-trip material available while exact parser adapters catch up:

```js
import {
  createNativeSourcePreservation,
  importNativeSource
} from '@shapeshift-labs/frontier-lang-compiler';

const sourceText = '// kept\nexport function step(frame) { return frame + 1; }\n';
const preservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/runtime.js',
  sourceText
});
const imported = importNativeSource({ language: 'javascript', sourcePath: 'src/runtime.js', sourceText });

console.log(preservation.summary.comments); // comments and whitespace are tracked
console.log(imported.metadata.sourcePreservation.sourceHash);
```

When `sourceText` is present, hashes are computed from the actual text. Caller-provided hashes are recorded as declared metadata and cannot make stale text project as exact source. Scanner/ledger trivia is recorded as `parserTriviaExactnessStatus: "approximate"` with stable review reason codes; exact parser-trivia evidence must include a matching source hash and parser-backed token/comment/trivia evidence on the preservation record. An adapter id or non-lightweight `parserEvidence` string alone cannot upgrade scanner/ledger tokens to exact parser proof. Lightweight scanner/ledger evidence is blocked with `exact-parser-trivia-scanner-evidence-not-parser` instead of satisfying exact parser proof, and metadata-only exactness is blocked with `exact-parser-trivia-token-comment-evidence-missing`. Verified exact parser-trivia evidence is threaded into native import metadata, project source file/span records, and source ownership anchors; metadata-only exactness cannot override the computed scanner/ledger exactness record. Use `includeTokens`, `includeTrivia`, `includeDirectives`, and `max*` options to keep preservation records compact for large files.

Create a compact semantic sidecar for swarm merge admission. This is the artifact a coordinator can index instead of reading a worker directory by hand:

```js
import {
  createSemanticImportSidecar,
  importNativeSource
} from '@shapeshift-labs/frontier-lang-compiler';

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceText: `
    export class Runtime {
      step(frame: number) { return frame + 1; }
    }
  `
});

const sidecar = createSemanticImportSidecar(imported);

console.log(sidecar.summary.emptySemanticIndex); // false when symbols were found
console.log(sidecar.ownershipRegions[0].key); // source#src/runtime.ts#type#Runtime
console.log(sidecar.patchHints[0].supportedOperations); // source-region patch operations
console.log(sidecar.semanticImpact.records[0].verificationPlan); // dependency/source-map/proof checks for a region
console.log(sidecar.proofSpec.obligations); // proof/spec obligations when the import carries a universal AST proof layer
console.log(sidecar.paradigmSemantics.hasLowering); // true when source import preserved lowering/paradigm records
```

The built-in JavaScript/TypeScript lightweight scanner also emits review-required ownership regions for clear route/config/content/property shapes in exported objects and arrays:

```js
const importedConfig = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/routes.ts',
  sourceText: `
    export const appRoutes = [
      { path: "/home", component: Home }
    ];
    export const siteContent = {
      docs: { title: "Docs" }
    };
  `
});

const configSidecar = createSemanticImportSidecar(importedConfig);
console.log(configSidecar.regionTaxonomy.presentKinds); // includes "route" and "content"
```

Compare before/after native source imports from a worker patch and emit a semantic change set for admission scoring:

```js
import { diffNativeSources } from '@shapeshift-labs/frontier-lang-compiler';

const changeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/runtime.js',
  beforeSourceText: 'export function step(frame) { return frame + 1; }\n',
  afterSourceText: 'export function step(frame) { return frame + 2; }\n'
});

console.log(changeSet.changedSymbols[0]?.changeKind); // "modified"
console.log(changeSet.changedRegions[0]?.conflictKey); // semantic ownership key
console.log(changeSet.changedRegions[0]?.metadata.changedRegionProjection.reviewRequired); // true
console.log(changeSet.metadata.changedRegionProjectionSummary.autoMergeClaims); // 0
console.log(changeSet.mergeCandidate.readiness); // merge-admission classification
```

Use `diffNativeSourceImports` when the worker or runner already produced `importNativeSource` results. Changed regions include a `metadata.changedRegionProjection` envelope with before/after source hashes, source-map links, ownership keys, readiness, and `autoMergeClaim: false` so swarm admission tools can score or port patches without treating semantic metadata as proof. Body-only edits that the lightweight scanner cannot anchor to a symbol are still reported as file-level changed regions instead of being silently treated as safe.

Build a three-way semantic edit script when a coordinator has base, worker, and current-head source text. This is the first deterministic bridge from semantic sidecars to automatic merge admission:

```js
import { createSemanticEditScript } from '@shapeshift-labs/frontier-lang-compiler';

const script = createSemanticEditScript({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: 'export function step(v) { return v + 1; }\n',
  workerSourceText: 'export function step(v) { return v + 2; }\n',
  headSourceText: 'export function step(v) { return v + 1; }\n'
});

console.log(script.operations[0].kind); // "replaceBody"
console.log(script.operations[0].status); // "portable"
console.log(script.admission.status); // "auto-merge-candidate"
console.log(script.admission.autoMergeClaim); // false
```

If the current head already changed the same semantic anchor, the script reports `conflict`; if the anchor moved or was renamed, it reports `needs-port` with a `reanchor` target; if no current head is supplied, it reports a review-only candidate. The script is intentionally an edit/admission record, not a proof of semantic equivalence.

Bundle a native diff into a compact semantic patch record when a coordinator needs hashes, changed semantic regions, source-map links, proof/history/evidence IDs, and merge-admission status without loading whole source files:

```js
import {
  createSemanticPatchBundleRecord,
  diffNativeSources,
  querySemanticPatchBundleRecords
} from '@shapeshift-labs/frontier-lang-compiler';

const changeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/runtime.js',
  beforeSourceText: 'export function step(frame) { return frame + 1; }\n',
  afterSourceText: 'export function step(frame, delta) { return frame + delta; }\n'
});

const bundle = createSemanticPatchBundleRecord(changeSet, {
  proofIds: ['proof_worker_replay'],
  historyIds: ['history_worker_run'],
  admission: { status: 'queued', readiness: changeSet.readiness }
});

console.log(bundle.changedRegions[0].key); // compact semantic region key
console.log(bundle.sourceMapLinks[0].sourceMapMappingId); // source-map link, not source text
console.log(bundle.admission.autoMergeClaim); // false
console.log(querySemanticPatchBundleRecords([bundle], { sourcePath: 'src/runtime.js' }).length); // 1
```

Semantic patch bundle records keep compact refs and query indexes for base/target/source hashes, source paths, changed region keys, conflict keys, source-map IDs, evidence IDs, proof IDs, history IDs, readiness, and admission status. They intentionally omit `before`/`after` import payloads and source text; use the original diff result when a worker needs to re-read or re-project source.

Map an edited target-language file back to source-language semantic anchors for review. This is the reverse direction a swarm needs when a worker changes generated Rust/Python/etc. and the coordinator wants source-port evidence:

```js
import {
  createBidirectionalTargetChangeRecord,
  importNativeSource
} from '@shapeshift-labs/frontier-lang-compiler';

const source = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  sourceText: 'export function add(count: number) { return count + 1; }\n'
});

const targetChange = createBidirectionalTargetChangeRecord({
  source,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32) -> i32 { count + 1 }\n'
  },
  editedTarget: {
    language: 'rust',
    sourcePath: 'src/counter.rs',
    sourceText: 'pub fn add(count: i32, step: i32) -> i32 { count + step }\n'
  },
  sourceAnchorMappings: [{ targetSymbolName: 'add', sourceSymbolName: 'add' }]
});

console.log(targetChange.sourceAnchorMatches[0].status); // "matched"
console.log(targetChange.sourcePatchBundle.admission.reviewRequired); // true
console.log(targetChange.historyRecord.index.ownershipKeys);
console.log(targetChange.metadata.semanticEquivalenceClaim); // false
```

Bidirectional target-change records are merge-admission evidence, not transpiler proof. They keep target diffs, source anchor matches, optional lineage resolutions, source patch-bundle records, semantic history records, evidence IDs, readiness, and reason codes. They always keep `autoMergeClaim: false` and `semanticEquivalenceClaim: false`; unmatched or deleted anchors block the source-port route, while matched and ambiguous anchors still require human or verifier review.

When the target source came from a Frontier/native projection, pass the generated-output `sourceMaps` back into `createBidirectionalTargetChangeRecord`. The record will match target changed regions by generated span or generated name, emit `sourceMapLinks`, include `sourceMapBackedMatches` in the summary/evidence, and carry source-map mapping IDs into the source patch bundle index:

```js
const sourceMapBacked = createBidirectionalTargetChangeRecord({
  source,
  targetLanguage: 'rust',
  targetPath: 'src/counter.rs',
  baseTarget,
  editedTarget,
  sourceMaps: [projection.sourceMap]
});

console.log(sourceMapBacked.summary.sourceMapBackedMatches);
console.log(sourceMapBacked.sourcePatchBundle.index.sourceMapMappingIds);
```

Store worker outputs as compact semantic history records when a coordinator needs to compare distributed changes without merging whole files:

```js
import {
  createSemanticHistoryRecord,
  querySemanticHistoryRecordOverlaps
} from '@shapeshift-labs/frontier-lang-compiler';

const left = createSemanticHistoryRecord({
  id: 'worker_left',
  baseHash: 'source_base_hash',
  importId: 'import_left',
  sourcePath: 'src/runtime.ts',
  ownershipRegions: [{ key: 'source#src/runtime.ts#function#step', granularity: 'symbol' }],
  semanticCandidates: [{ id: 'candidate_left', conflictKeys: ['source#src/runtime.ts#function#step'] }],
  evidenceIds: ['evidence_left_test'],
  proofIds: ['proof_left_replay'],
  admission: { status: 'queued', readiness: 'needs-review' },
  replayLinks: [{ id: 'replay_left', kind: 'patch', path: 'patches/left.json' }]
});

const right = createSemanticHistoryRecord({
  id: 'worker_right',
  baseHash: 'different_source_base_hash',
  importId: 'import_right',
  sourcePath: 'src/runtime.ts',
  ownershipRegions: [{ key: 'source#src/runtime.ts#function#step', granularity: 'symbol' }],
  semanticCandidates: [{ id: 'candidate_right', conflictKeys: ['source#src/runtime.ts#function#step'] }]
});

console.log(querySemanticHistoryRecordOverlaps([left, right])[0].conflict); // true
```

The record stores base/target hashes, source and import IDs, ownership-region keys, semantic candidate IDs and conflict keys, evidence/proof IDs, reviewer and admission status, plus replay links. Overlap queries compare those compact indexes directly, so centralized and distributed swarms can find shared regions, stale-base conflicts, and replay targets without loading source text.

Resolve old semantic anchors through move/rename/split/delete lineage before a coordinator decides whether a worker bundle still touches the current code shape:

```js
import {
  createSemanticLineageEvent,
  createSemanticLineageMap,
  resolveSemanticLineage
} from '@shapeshift-labs/frontier-lang-compiler';

const lineage = createSemanticLineageMap([
  createSemanticLineageEvent({
    eventKind: 'moved',
    from: { key: 'source#src/runtime.ts#function#step' },
    to: { key: 'source#src/runtime-core.ts#function#step' },
    evidenceIds: ['evidence_source_scan']
  }),
  createSemanticLineageEvent({
    eventKind: 'renamed',
    from: { key: 'source#src/runtime-core.ts#function#step' },
    to: { key: 'source#src/runtime-core.ts#function#advance' }
  })
]);

const resolution = resolveSemanticLineage(lineage, 'source#src/runtime.ts#function#step');

console.log(resolution.status); // "resolved"
console.log(resolution.currentAnchors[0].key); // current semantic anchor
console.log(resolution.traversedEventIds); // compact history path
```

Infer conservative lineage events from two native imports when a file was moved,
a parser reports a rename, or an anchor disappeared:

```js
import {
  importNativeSource,
  inferSemanticLineageEvents
} from '@shapeshift-labs/frontier-lang-compiler';

const before = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  sourceText: 'export function step(value) { return value + 1; }\n'
});
const after = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/runtime-core.ts',
  sourceText: 'export function step(value) { return value + 1; }\n'
});

const inference = inferSemanticLineageEvents({ before, after });

console.log(inference.summary.moved); // 1
console.log(inference.events[0].metadata.autoMergeClaim); // false
console.log(inference.lineageMap.byAnchorKey); // old/current anchor index
```

The inference API is intentionally conservative. Ambiguous matches are reported
as blocked, additions are kept separate from recreated lineage, and inferred
events always require review; richer parser adapters can improve confidence by
supplying stable signature hashes and source-map spans.

Resolver output is merge-admission evidence: it helps a swarm compare old worker bundles against current semantic anchors after code moved, split, or was deleted. It is not proof that the projected code is correct or semantically equivalent; admission still needs tests, source evidence, review status, and conflict scoring.

Extract a surgical semantic slice when a worker only needs one symbol, region, native AST node, or source path:

```js
import {
  createSemanticSliceAdmissionRecord,
  createSemanticSlice,
  importNativeSource,
  testSemanticSlice,
  writeSemanticSliceJson
} from '@shapeshift-labs/frontier-lang-compiler';

const sourceText = 'export function parseExpression(input) { return input; }\n';
const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/parser.ts',
  sourceText
});

const slice = createSemanticSlice(imported, {
  entryRefs: ['symbol:parseExpression'],
  includeDependencies: true,
  expectedSymbols: ['parseExpression'],
  expectedSourceHashes: { 'src/parser.ts': imported.nativeSource.sourceHash },
  focusedCommands: ['npm test -- parser-expression'],
  fixtureHints: ['operator precedence corpus']
});

console.log(slice.kind); // "frontier.lang.semanticSlice"
console.log(slice.mergeAdmission.conflictKeys); // semantic ownership keys
console.log(slice.sourceFiles[0].sourceHash); // stale-check input for admission

const gate = testSemanticSlice(slice, {
  currentSources: { 'src/parser.ts': sourceText },
  expectedRegions: [slice.ownershipRegions[0].key]
});

console.log(gate.status); // "passed", "needs-review", or "failed"
const admission = createSemanticSliceAdmissionRecord(slice, { testResult: gate });
console.log(admission.mergeScore.value); // sortable 0-100 semantic merge score
console.log(admission.selectedSurface.sourceHashes); // compact selected-surface evidence
console.log(admission.autoMergeClaim); // always false
console.log(writeSemanticSliceJson(slice)); // stable JSON for worker inputs
```

A semantic slice is the small unit a swarm can hand to a worker instead of copying a full repository. It carries the selected symbols, ownership regions, native nodes, relations, occurrences, source-map links, source spans, source excerpts, source hashes, focused verification commands, fixture hints, and merge-admission metadata. Slice tests can assert exact selected symbols, regions, source-file hashes, and expected counts; admission records also include a compact `selectedSurface` plus `semantic-slice-selected-surface` evidence with hashes and spans but no whole-repository source copy. It does not claim the patch is correct; it makes the context and conflicts machine-readable so admission scoring can combine changed ownership, focused test status, stale/source-hash checks, evidence, and semantic risk in one sortable record.

Slice admission records add a compact `frontier.lang.semanticMergeScore.v1` score with semantic-selection, source-freshness, ownership-isolation, verification-evidence, and review-risk components. They are built for coordinator queues and dashboards: sort likely useful slices first, reject stale or empty slices early, and keep correctness proof separate from merge metadata.

Compile native source imports through the same reader/IR/writer facade that swarms use for sidecar evidence. Same-language targets preserve exact source when hashes match; cross-language targets emit declaration stubs until a real adapter provides stronger evidence:

```js
import { compileNativeSource } from '@shapeshift-labs/frontier-lang-compiler';

const compiledJs = compileNativeSource({
  language: 'javascript',
  sourcePath: 'src/runtime.js',
  sourceText: 'export function step(frame) { return frame + 1; }\n'
});

console.log(compiledJs.outputMode); // "preserved-source"
console.log(compiledJs.readiness.readiness); // scanner imports can still be "needs-review"

const rustCandidate = compileNativeSource(compiledJs.importResult, {
  target: 'rust',
  targetPath: 'dist/runtime.rs',
  emitOnBlocked: true
});

console.log(rustCandidate.outputMode); // "target-stubs"
console.log(rustCandidate.targetCoverage.lossClass); // "missingAdapter" without a JS-to-Rust adapter
console.log(rustCandidate.ok); // true only because emitOnBlocked requested code anyway
console.log(rustCandidate.sourceMap.targetPath); // "dist/runtime.rs"
console.log(rustCandidate.sourceMap.mappings[0]?.semanticSymbolId); // generated span -> source symbol
```

`compileNativeSource` returns the import result, projection, target loss matrix cell, combined losses, readiness, evidence, output hash, and generated-output source maps. Same-language preserved output uses exact source mappings when the hash matches; generated stubs use declaration-level spans; adapter output uses adapter-supplied maps when present and otherwise gets an estimated fallback. Admission queues should treat `ok` as "code was emitted", not as merge approval; `readiness`, `targetCoverage`, and source-map precision carry the merge signal.

Native projections and compile results also carry a `frontier.lang.nativeRoundtripEvidence` record under `evidence[].metadata.roundtripEvidence` and `metadata.roundtripEvidence`. That payload records import readiness/loss counts, universal AST validation and source-map precision, projection mode/hash verification, target adapter identity, target coverage, output source-map precision, blocking/review loss ids, and a compact audit signal in one coordinator-sortable JSON shape:

```js
const roundtrip = rustCandidate.metadata.roundtripEvidence;
console.log(roundtrip.status); // "blocked", "stub-only", "preserved-source", or "target-adapter"
console.log(roundtrip.audit.disposition); // "reversible", "preserved-source", "stub-only", or "adapter-projected"
console.log(roundtrip.audit.claim); // bounded evidence label, not a semantic equivalence proof
console.log(roundtrip.audit.semanticEquivalenceClaim); // false
console.log(roundtrip.output.sourceMaps.precision); // "exact", "declaration", "estimated", or "none"
console.log(roundtrip.losses.blockingLossIds);
```

`roundtrip.audit` separates what was emitted from whether it can be merged: hash-verified same-language output with exact generated source maps is marked `reversible`, preserved source without generated exact maps stays `preserved-source`, generated declarations are `stub-only`, and host-owned target adapters are `adapter-projected`. Blocked and needs-review readiness still flow through `status`, `semanticMergeReadiness`, `reviewRequired`, loss ids, and source-map precision; the audit signal always keeps `autoMergeClaim: false` and `semanticEquivalenceClaim: false`.

Provide a target projection adapter when the host owns real native-to-target translation semantics:

```js
const jsToRustAdapter = {
  id: 'app-js-to-rust',
  sourceLanguage: 'javascript',
  target: 'rust',
  coverage: {
    readiness: 'needs-review',
    handledLossKinds: ['dynamicRuntime']
  },
  project(input) {
    return {
      output: `// projected from ${input.sourceLanguage}\npub fn add_todo() {}\n`,
      readiness: 'needs-review',
      evidence: [{
        id: 'evidence_app_js_to_rust',
        kind: 'projection',
        status: 'passed',
        summary: 'Host JS-to-Rust adapter emitted declaration-compatible Rust.'
      }]
    };
  }
};

const rustWithAdapter = compileNativeSource(compiledJs.importResult, {
  target: 'rust',
  targetPath: 'dist/runtime.rs',
  targetAdapters: [jsToRustAdapter]
});

console.log(rustWithAdapter.outputMode); // "target-adapter"
console.log(rustWithAdapter.targetCoverage.lossClass); // "targetAdapterProjection"
console.log(rustWithAdapter.targetProjection.adapter.id); // "app-js-to-rust"
console.log(rustWithAdapter.sourceMaps.length); // adapter maps or compiler fallback map
```

Project a native import back to source. Exact source is preserved when the import carries matching source-preservation evidence or when supplied text matches the import hash; otherwise the compiler emits declaration stubs with review-required loss evidence:

```js
import {
  importNativeSource,
  projectNativeImportToSource
} from '@shapeshift-labs/frontier-lang-compiler';

const sourceText = 'export function step(frame) { return frame + 1; }\n';
const imported = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/runtime.js',
  sourceText
});

const projection = projectNativeImportToSource(imported);

console.log(projection.mode); // "preserved-source"
console.log(projection.readiness.readiness); // "ready"
```

Use injected parser adapters when a real language parser is available but should not become a compiler runtime dependency:

```js
import {
  createBabelNativeImporterAdapter,
  createClangAstNativeImporterAdapter,
  createCSharpRoslynNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  createJavaAstNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSwiftSyntaxNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from '@shapeshift-labs/frontier-lang-compiler';

const babelAdapter = createBabelNativeImporterAdapter({
  parserModule: await import('@babel/parser')
});
const pythonAstAdapter = createPythonAstNativeImporterAdapter({
  parserModule: hostPythonAstParser
});
const rustSynAdapter = createRustSynNativeImporterAdapter({
  parserModule: hostRustSynParser,
  rustEdition: '2021'
});
const clangAstAdapter = createClangAstNativeImporterAdapter({
  parserModule: hostClangJsonParser,
  cStandard: 'c11',
  compileFlags: ['-std=c11']
});
const goAstAdapter = createGoAstNativeImporterAdapter({
  parserModule: hostGoAstParser,
  goVersion: '1.22'
});
const javaAstAdapter = createJavaAstNativeImporterAdapter({
  parserModule: hostJavaAstParser,
  javaVersion: '21',
  sourceLevel: '21'
});
const kotlinPsiAdapter = createKotlinPsiNativeImporterAdapter({
  parserModule: hostKotlinPsiParser,
  kotlinVersion: '2.1',
  analysisApiEvidence: { hash: kotlinAnalysisApiIndexHash }
});
const csharpRoslynAdapter = createCSharpRoslynNativeImporterAdapter({
  parserModule: hostRoslynParser,
  languageVersion: '12',
  nullableContext: 'enabled'
});
const swiftSyntaxAdapter = createSwiftSyntaxNativeImporterAdapter({
  parserModule: hostSwiftSyntaxParser,
  swiftVersion: '6',
  sourceKitEvidence: { hash: sourceKitIndexHash }
});

const imported = await runNativeImporterAdapter(babelAdapter, {
  sourcePath: 'src/todo.ts',
  sourceText
});

const project = await importNativeProject({
  projectRoot: 'src',
  moduleResolution: { baseUrl: '.', paths: { '@app/*': ['src/*'] } },
  adapters: [babelAdapter, pythonAstAdapter, rustSynAdapter, clangAstAdapter, goAstAdapter, javaAstAdapter, kotlinPsiAdapter, csharpRoslynAdapter, swiftSyntaxAdapter],
  sources: [
    { language: 'typescript', adapter: babelAdapter.id, sourcePath: 'src/todo.ts', sourceText },
    { language: 'python', adapter: pythonAstAdapter.id, sourcePath: 'tools/todo.py', sourceText: pythonSource },
    { language: 'rust', adapter: rustSynAdapter.id, sourcePath: 'src/todo.rs', sourceText: rustSource },
    { language: 'c', adapter: clangAstAdapter.id, sourcePath: 'native/todo.c', sourceText: cSource },
    { language: 'go', adapter: goAstAdapter.id, sourcePath: 'cmd/todo/main.go', sourceText: goSource },
    { language: 'java', adapter: javaAstAdapter.id, sourcePath: 'src/main/java/Todo.java', sourceText: javaSource },
    { language: 'kotlin', adapter: kotlinPsiAdapter.id, sourcePath: 'src/main/kotlin/Todo.kt', sourceText: kotlinSource },
    { language: 'csharp', adapter: csharpRoslynAdapter.id, sourcePath: 'src/Todo.cs', sourceText: csharpSource },
    { language: 'swift', adapter: swiftSyntaxAdapter.id, sourcePath: 'Sources/Todo.swift', sourceText: swiftSource }
  ]
});

console.log(imported.universalAst.sourceMaps.length);
console.log(project.semanticIndex.symbols.length);
console.log(imported.adapter.coverage.exactness);
console.log(imported.adapter.coverage.capabilityEvidence.declared.exactness);
console.log(imported.adapter.coverage.capabilityEvidence.observed.sourceRanges);
console.log(imported.adapter.coverage.capabilityEvidence.gaps);
console.log(imported.adapter.coverage.semanticCoverage.level);
console.log(project.metadata.sourcePreservationSummary.total);
console.log(project.metadata.projectAdmission.mergeScore.value); // sortable readiness score
console.log(project.metadata.projectAdmission.mergeScore.components.targetProjectionCoverage.score);
```

The built-in adapter factories are dependency-light wrappers for caller-owned parsers or ASTs:

- `createEstreeNativeImporterAdapter`
- `createBabelNativeImporterAdapter`
- `createTypeScriptCompilerNativeImporterAdapter`
- `createPythonAstNativeImporterAdapter`
- `createRustSynNativeImporterAdapter`
- `createClangAstNativeImporterAdapter`
- `createGoAstNativeImporterAdapter`
- `createJavaAstNativeImporterAdapter`
- `createKotlinPsiNativeImporterAdapter`
- `createCSharpRoslynNativeImporterAdapter`
- `createSwiftSyntaxNativeImporterAdapter`
- `createTreeSitterNativeImporterAdapter`

Adapter summaries include a structured `coverage` record so merge queues can distinguish exact parser AST imports from declaration scans. The record declares exactness, parser token/trivia support, diagnostics support, source-range and generated-range support, and semantic coverage. Built-in wrappers normalize native AST/CST nodes and declaration-level semantic indexes; they do not claim resolved references, types, control flow, generated ranges, or token/trivia fidelity unless the host adapter supplies that evidence.

Coverage records also keep declared, observed, and effective capability evidence separate. `coverage.capabilityEvidence.gaps` highlights missing exact AST, token/trivia, parser diagnostics, source range, generated range, reference, type, and control-flow evidence for the current adapter/import. `observedOnly` means the import produced evidence the adapter did not declare, while `declaredOnly` means the adapter declared support that this run did not exercise.

Project import admission records include `mergeScore`, a `frontier.lang.semanticMergeScore.v1` object with a 0-100 sortable value where higher is more admission-ready. The component scores combine semantic evidence density, source preservation, stale source hashes, changed ownership regions, proof/readiness evidence, and target projection coverage, so coordinators can sort imports while still seeing the specific evidence behind a low score.

Release trains and semantic merge planners can inspect adapter package contracts without importing the adapter packages themselves:

```js
import {
  getLanguageAdapterPackageContract,
  queryLanguageAdapterPackageContracts
} from '@shapeshift-labs/frontier-lang-compiler';

const rust = getLanguageAdapterPackageContract('@shapeshift-labs/frontier-lang-rust');
console.log(rust.sourceParser.format); // "rust-syn"
console.log(rust.targetProjection.targets); // ["rust"]
console.log(rust.releaseReadiness.releaseReady); // true

const platformImporters = queryLanguageAdapterPackageContracts({
  packageClass: 'platform-importer',
  importsAdapterPackage: false
});
console.log(platformImporters.map((entry) => entry.package.name));
```

Each static contract exposes package name/version, version source, source parser languages/formats, parser caveats, target projection support/caveats, semantic-index formats, proof/evidence requirements, release readiness signals, and `runtime.importsAdapterPackage: false`. Standalone source-language importer packages such as Java, Kotlin, Swift, C#, Go, and Clang now carry their published package versions and release readiness, while still declaring that host parser, build graph, and semantic evidence are required before an import is high-confidence.

## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers, and tiny dependency-free runtime budget/scheduler primitives.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-dataflow`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dataflow): Serializable incremental dataflow and materialized-view graphs for Frontier apps, including selectors, dependency DAGs, filters, joins, aggregations, stale paths, recompute budgets, output patches, provenance records, and proof of why derived views changed.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, scheduled persistence, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots and durable change logs.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema): JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and query/table schema helpers.
- [`@shapeshift-labs/frontier-migrations`](https://www.npmjs.com/package/@shapeshift-labs/frontier-migrations): Boundary-first data migrations, import normalization, plugin/API version mapping, versioned envelopes, graph diagnostics, patch path rewrites, dry-run reports, and current-shape rehydration.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-inspect`](https://www.npmjs.com/package/@shapeshift-labs/frontier-inspect): Cross-package inspection/evidence bundles, registry graph snapshots, feature/resource impact reports, timeline/event normalization, redaction, JSONL import/export, and AI-readable app feature maps.
- [`@shapeshift-labs/frontier-scheduler`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scheduler): Deterministic work scheduling, lanes, cancellation, backpressure, frame policies, replay snapshots, and work graphs.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, scheduled sinks, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): Explicit mutation and selector plans compiled to Frontier patches or CRDT operations.
- [`@shapeshift-labs/frontier-effects`](https://www.npmjs.com/package/@shapeshift-labs/frontier-effects): Serializable effect descriptors and resource graphs for Frontier apps, including fetch, storage, timers, navigation, workers, clipboard, broadcast, WebSocket, stream, policy metadata, runtime records, redaction, JSONL, proof helpers, and registry graph output.
- [`@shapeshift-labs/frontier-auth`](https://www.npmjs.com/package/@shapeshift-labs/frontier-auth): Frontier-native auth contracts for providers, sessions, profile completeness, route and resource gates, account-linking policy, token issue/verify plans, runtime grants, audit events, registry graphs, lint resources, and auth evidence without owning app secrets, crypto, storage, or provider SDKs.
- [`@shapeshift-labs/frontier-policy`](https://www.npmjs.com/package/@shapeshift-labs/frontier-policy): Serializable policy and capability decisions for Frontier apps, effects, views, sync, routes, traces, and AI tools.
- [`@shapeshift-labs/frontier-flags`](https://www.npmjs.com/package/@shapeshift-labs/frontier-flags): Patchable policy-aware feature flag state for Frontier apps, including targeting, deterministic rollouts, experiment variants, kill switches, exposure records, audit logs, and replay evidence.
- [`@shapeshift-labs/frontier-tools`](https://www.npmjs.com/package/@shapeshift-labs/frontier-tools): Serializable app action/tool manifests for AI-operable Frontier apps, including availability, validation, dry-run plans, patch previews, effect/tool constraints, execution records, rollback links, and registry graph output.
- [`@shapeshift-labs/frontier-sandbox`](https://www.npmjs.com/package/@shapeshift-labs/frontier-sandbox): Runtime-agnostic sandbox contracts for Frontier patch-producing actions, including manifests, declared reads/writes/capabilities, host-validated patch/effect/event/log results, dynamic source modules, source event replay, and structural runtime adapters.
- [`@shapeshift-labs/frontier-sandbox-quickjs`](https://www.npmjs.com/package/@shapeshift-labs/frontier-sandbox-quickjs): QuickJS/WebAssembly runtime adapter for Frontier sandbox actions, including invocation/runtime isolation modes, deadline and memory limits, dynamic source execution, and patch/effect result normalization.
- [`@shapeshift-labs/frontier-workflow`](https://www.npmjs.com/package/@shapeshift-labs/frontier-workflow): Serializable durable workflow/process manifests for Frontier apps, including steps, waits, approvals, timers, retries, expected patches, compensation, records, timelines, and registry graph output.
- [`@shapeshift-labs/frontier-worker`](https://www.npmjs.com/package/@shapeshift-labs/frontier-worker): Serializable worker and edge task descriptors for Frontier apps, including queues, idempotency keys, retry and timeout policy, declared reads/writes/effects, snapshots, patch outputs, produced assets, execution records, logs, trace links, proof hashes, dedupe indexes, and registry graph output.
- [`@shapeshift-labs/frontier-queue`](https://www.npmjs.com/package/@shapeshift-labs/frontier-queue): Serializable durable queue state, leases, retries, dedupe keys, patch-carrying jobs, dead-letter records, replay evidence, and queue inspection for Frontier apps.
- [`@shapeshift-labs/frontier-swarm`](https://www.npmjs.com/package/@shapeshift-labs/frontier-swarm): Hierarchical swarm plans, lanes, compute profiles, ownership policy, semantic ownership regions, task queues, event streams, run records, merge bundles, merge indexes, queue overlays, merge admission, coordinator dashboards, changed-path checks, and proof artifacts for Frontier agent work.
- [`@shapeshift-labs/frontier-swarm-codex`](https://www.npmjs.com/package/@shapeshift-labs/frontier-swarm-codex): Node Codex CLI adapter for Frontier swarm plans, including prompt rendering, worktree and snapshot workspaces, Codex argument compatibility, browser resource allocation, JSONL capture, verification commands, pid-backed stop, collect/apply workflows, merge indexes, queue overlays, merge bundles, normalized job evidence, coordinator query artifacts, and result artifacts.
- [`@shapeshift-labs/frontier-lang-kernel`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-kernel): Runtime-neutral semantic source graph, type/lattice/extern declarations, patch bundles, replay, hashing, evidence records, and merge-admission kernel for Frontier Lang.
- [`@shapeshift-labs/frontier-lang-parser`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-parser): Dependency-light Frontier Lang parser for modules, entities, state, actions, effects, types, externs, targets, and lattice declarations.
- [`@shapeshift-labs/frontier-lang-checker`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-checker): Checker and diagnostics for Frontier Lang semantic documents, including type symbols, effects, regions, lattice laws, CRDT metadata, and patch evidence.
- [`@shapeshift-labs/frontier-lang-typescript`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-typescript): TypeScript projection adapter for Frontier Lang semantic documents, including type/entity/state/action/extern declarations and CRDT lattice descriptors.
- [`@shapeshift-labs/frontier-lang-javascript`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-javascript): JavaScript projection adapter for Frontier Lang semantic documents, including ESM action stubs and schema/lattice descriptors.
- [`@shapeshift-labs/frontier-lang-rust`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-rust): Rust projection adapter for Frontier Lang semantic documents, including structs, aliases, and action stubs.
- [`@shapeshift-labs/frontier-lang-python`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-python): Python projection adapter for Frontier Lang semantic documents, including dataclasses, typed patch records, and action stubs.
- [`@shapeshift-labs/frontier-lang-c`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-c): C header projection adapter for Frontier Lang semantic documents, including structs and action prototypes.
- [`@shapeshift-labs/frontier-lang-swift`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-swift): Swift source-language importer package for Frontier Lang semantic documents, including package-level metadata, SwiftSyntax adapter helpers, native import results, and semantic sidecar generation for SwiftSyntax/SwiftParser-shaped syntax trees.
- [`@shapeshift-labs/frontier-lang-kotlin`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-kotlin): Kotlin PSI source-language importer package for Frontier Lang semantic documents, including package-level metadata, Kotlin PSI adapter helpers, native import results, and semantic sidecar generation for Kotlin PSI/KtFile-shaped syntax trees.
- [`@shapeshift-labs/frontier-lang-java`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-java): Java source-language importer package for Frontier Lang semantic documents, including package-level metadata, Java AST adapter helpers, native import results, and semantic sidecar generation for javac/JDT/JavaParser-shaped ASTs.
- [`@shapeshift-labs/frontier-lang-go`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-go): Go source-language importer package for Frontier Lang semantic documents, including package-level metadata, Go AST adapter helpers, native import results, and semantic sidecar generation for go/ast File or Package trees.
- [`@shapeshift-labs/frontier-lang-csharp`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-csharp): C# Roslyn source-language importer package for Frontier Lang semantic documents, including package-level metadata, Roslyn adapter helpers, native import results, and semantic sidecar generation for SyntaxTree/SyntaxNode-shaped ASTs.
- [`@shapeshift-labs/frontier-lang-clang`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-clang): Clang AST source-language importer package for Frontier Lang semantic documents, including package-level metadata, Clang AST JSON adapter helpers, native import results, and semantic sidecar generation for C/C++ translation units.
- [`@shapeshift-labs/frontier-lang-cli`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang-cli): Command line interface for parsing, checking, hashing, emitting, native source import/projection, semantic slicing, and corpus roundtrip evidence for Frontier Lang projects.
- [`@shapeshift-labs/frontier-lang`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lang): Umbrella package for Frontier Lang kernel, parser, checker, compiler facade, universal AST helpers, projection adapters, and source-language importer adapters.
- [`@shapeshift-labs/frontier-kv`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv): Serializable in-memory key/value state for Frontier apps, including TTL, versioned compare-and-set, batched patch mutations, scans, watchers, snapshots, JSONL event evidence, and replay verification.
- [`@shapeshift-labs/frontier-kv-locks`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-locks): Lease-style lock records on top of Frontier KV, including acquire, renew, release, fencing tokens, expiration, owner evidence, and replayable lock events.
- [`@shapeshift-labs/frontier-kv-rate-limit`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-rate-limit): Patch-native rate limit buckets for Frontier KV, including fixed windows, sliding windows, token buckets, deterministic refill, consume evidence, and reset records.
- [`@shapeshift-labs/frontier-kv-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-file): Node file persistence adapter for Frontier KV snapshots and append-only JSONL event logs, including atomic writes, compaction, replay loading, and adapter evidence.
- [`@shapeshift-labs/frontier-kv-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-idb): IndexedDB persistence adapter for Frontier KV snapshots and event logs, with structural IDB interfaces, upgrade planning, compact event storage, and replay loading.
- [`@shapeshift-labs/frontier-kv-redis`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-redis): Redis-compatible command planning and structural client adapter for Frontier KV operations, including key mapping, TTL commands, optimistic CAS scripts, and replay evidence without bundling Redis drivers.
- [`@shapeshift-labs/frontier-kv-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-kv-server): Small Node HTTP server adapter for Frontier KV, including request planning, JSON endpoints for get/set/delete/scan/batch, optional rate-limit hooks, and replayable response evidence.
- [`@shapeshift-labs/frontier-assets`](https://www.npmjs.com/package/@shapeshift-labs/frontier-assets): Serializable asset and content provenance graphs for Frontier apps, including source files, generated variants, thumbnails, LOD chunks, shader/material dependencies, transforms, hashes, owners, runtime consumers, review plans, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-blueprint`](https://www.npmjs.com/package/@shapeshift-labs/frontier-blueprint): Serializable Blueprint/Prefab flyweight templates for Frontier apps, including parameterized instantiation, deterministic ID/path remapping, compact overrides, variants, effective-state materialization, scene/state patch emission, dependency metadata, and registry graph output.
- [`@shapeshift-labs/frontier-triggers`](https://www.npmjs.com/package/@shapeshift-labs/frontier-triggers): Capability-gated event trigger registry, scoped event envelopes, listener/reaction rules, structured rejection, deterministic event-to-action scheduling, replay/provenance records, and registry graph output.
- [`@shapeshift-labs/frontier-virtual`](https://www.npmjs.com/package/@shapeshift-labs/frontier-virtual): DOM-neutral virtualization, layout providers, range materialization, grids, spatial/frustum indexes, patch invalidation, camera anchors, and serializable layout state.
- [`@shapeshift-labs/frontier-table`](https://www.npmjs.com/package/@shapeshift-labs/frontier-table): Renderer-neutral data grid and table primitives for Frontier apps, including stable row identity, sorting, filtering, selection, virtual ranges, patch-driven edits, cache/dataflow descriptors, and CRDT-compatible row and cell operation frames.
- [`@shapeshift-labs/frontier-scene`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scene): Patch-native 2D/3D scene graph, transform propagation, bounds queries, virtual/culling adapters, spatial invalidation, and camera/frustum materialization.
- [`@shapeshift-labs/frontier-pathfinding`](https://www.npmjs.com/package/@shapeshift-labs/frontier-pathfinding): Patch-native grid pathfinding, typed-array A*/Dijkstra search, flow fields, connected components, line-of-sight smoothing, dirty-cell invalidation, and scheduler-friendly path jobs.
- [`@shapeshift-labs/frontier-lod`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lod): Patch-native level-of-detail and significance selection for rendering and computation workloads, compact typed hot paths, multi-observer selection, budget degradation, materialization frames, and scheduler work plans.
- [`@shapeshift-labs/frontier-route`](https://www.npmjs.com/package/@shapeshift-labs/frontier-route): DOM-neutral app/game route resources, route and scene manifests, match/resolve/transition planning, dependency metadata, sessions, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-trace`](https://www.npmjs.com/package/@shapeshift-labs/frontier-trace): Serializable traces, spans, events, causal links, W3C trace context helpers, timeline/resource/path queries, critical-path analysis, registry graph output, JSONL/proof helpers, Chrome trace export, and redaction for app-wide feature observability.
- [`@shapeshift-labs/frontier-manifest`](https://www.npmjs.com/package/@shapeshift-labs/frontier-manifest): Build/static feature manifests for owners, routes, actions, states, migrations, tests, source files, assets, resources, tasks, dependency metadata, registry graph output, feature maps, JSONL export, and impact queries.
- [`@shapeshift-labs/frontier-view`](https://www.npmjs.com/package/@shapeshift-labs/frontier-view): Renderer-neutral view manifests, type defaults, validation frames, action bindings, visual channels, virtual/LOD hints, and data-to-representation mapping for Frontier apps.
- [`@shapeshift-labs/frontier-icons`](https://www.npmjs.com/package/@shapeshift-labs/frontier-icons): Renderer-neutral icon records, icon sets, lookup aliases, SVG frames, string rendering, and registry evidence for Frontier apps.
- [`@shapeshift-labs/frontier-design`](https://www.npmjs.com/package/@shapeshift-labs/frontier-design): Renderer-neutral design-system tokens, semantic roles, recipes, target style frames, CSS variable output, and registry graph evidence for Frontier apps.
- [`@shapeshift-labs/frontier-canvas`](https://www.npmjs.com/package/@shapeshift-labs/frontier-canvas): Renderer-neutral infinite canvas surfaces for Frontier apps, including camera and viewport math, pan/zoom plans, grid materialization, snapping, hit testing, selection handles, extensible tool dispatch, frame records, registry graph output, and impact/proof helpers.
- [`@shapeshift-labs/frontier-canvas-tools`](https://www.npmjs.com/package/@shapeshift-labs/frontier-canvas-tools): Renderer-neutral editor tools, state machines, transform handles, permissions, async records, and AI action bridges for Frontier canvas surfaces.
- [`@shapeshift-labs/frontier-dnd`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dnd): Renderer-neutral drag-and-drop sessions, sensor descriptors, collision ranking, drop planning, reorder patches, state partitioning, and registry evidence for Frontier apps.
- [`@shapeshift-labs/frontier-dom`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dom): Patch-native DOM and host renderer bindings, manifest hydration, JSX runtime/compiler helpers, SSR, devtools, and logging bridges.
- [`@shapeshift-labs/frontier-playwright`](https://www.npmjs.com/package/@shapeshift-labs/frontier-playwright): Playwright/headless automation probes for Frontier state, DOM, devtools, marks, and timeline queries.
- [`@shapeshift-labs/frontier-test`](https://www.npmjs.com/package/@shapeshift-labs/frontier-test): Serializable test/spec evidence manifests for Frontier apps, including fixtures, commands, expected patches/effects/routes/policies, coverage declarations, run plans, run records, report adapters, replay proofs, fuzzers, benchmarks, registry graph output, and impact queries.
- [`@shapeshift-labs/frontier-fixtures`](https://www.npmjs.com/package/@shapeshift-labs/frontier-fixtures): Deterministic fixture and scenario generation for Frontier apps, including schema-valid sample state, related entity collections, actor personas, route states, replay-verified patch streams, event records, JSONL bundles, and evidence summaries.
- [`@shapeshift-labs/frontier-component-preview`](https://www.npmjs.com/package/@shapeshift-labs/frontier-component-preview): Frontier-native component preview books, generated preview manifests, stateful variants, Vite virtual modules, standalone browser preview shells, inspector bridges, and preview harness evidence for Frontier apps.
- [`@shapeshift-labs/frontier-documentation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-documentation): Frontier-native documentation manifests, generated documentation books, package/API/source discovery, Vite virtual modules, standalone browser docs shells, inspector bridges, search indexes, and documentation harness evidence for Frontier apps and packages.
- [`@shapeshift-labs/frontier-ast-walk`](https://www.npmjs.com/package/@shapeshift-labs/frontier-ast-walk): Dependency-light source graph, import/export/declaration/call analysis, Frontier package-use discovery, and business-logic placement findings for Frontier tools, apps, docs, fuzzers, benchmarks, and agent evidence.
- [`@shapeshift-labs/frontier-history`](https://www.npmjs.com/package/@shapeshift-labs/frontier-history): Serializable temporal explanation and causality records for Frontier apps, including field-change explanations, action/workflow/policy/effect/trace/test provenance, audit windows, undo planning, registry/provenance graph output, JSONL replay bundles, and proof hashes.
- [`@shapeshift-labs/frontier-application`](https://www.npmjs.com/package/@shapeshift-labs/frontier-application): Serializable whole-application graph and impact queries for Frontier apps, including features, owners, packages, routes, views, actions, mutations, state paths, effects, workers, assets, tests, traces, policies, workflows, migrations, benchmarks, registry graph output, feature maps, JSONL bundles, and proof hashes.
- [`@shapeshift-labs/frontier-linter`](https://www.npmjs.com/package/@shapeshift-labs/frontier-linter): Serializable Frontier lint rules, diagnostics, fixes, reports, and fast rule execution for package catalogs, registry graphs, application maps, manifests, traces, policies, workflows, workers, assets, tests, benchmarks, and source snippets.
- [`@shapeshift-labs/frontier-framework`](https://www.npmjs.com/package/@shapeshift-labs/frontier-framework): High-level app framework package for Frontier applications, including configuration, CLI scaffolding, Vite builds, monorepo layout, TSX route builds, split frontend/backend deploy artifacts, backend-neutral Fetch handler and sync transport contracts, runtime data-source migrations, devtools, harness gates, agent MCP/tool manifests, CI evidence gates, workflow manifests, SARIF/linter output, replay scripts, and evidence manifest output.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, scheduled sync work, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.
- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): Shared realtime command, tick, snapshot, prediction, reconciliation, interpolation, rollback, message, and delta primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): Authoritative realtime room, tick, command validation, rate-limit, session, and snapshot-history runtime.
- [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket): WebSocket client, wire, and Node room-server transport for Frontier realtime.
- [`@shapeshift-labs/frontier-game`](https://www.npmjs.com/package/@shapeshift-labs/frontier-game): Game-facing entity, component, player, room, ownership, spatial interest, rollback, physics, and replication helpers above realtime.
- [`@shapeshift-labs/loom`](https://www.npmjs.com/package/@shapeshift-labs/loom): Repo-level semantic collaboration CLI for .loom workspaces, including init, scan, status, graph snapshots, projection plans, Frontier Lang delegation, Frontier Swarm delegation, and Frontier Framework delegation.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-dataflow`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dataflow)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-migrations`](https://github.com/siliconjungle/-shapeshift-labs-frontier-migrations)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-inspect`](https://github.com/siliconjungle/-shapeshift-labs-frontier-inspect)
- [`siliconjungle/-shapeshift-labs-frontier-scheduler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scheduler)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-effects`](https://github.com/siliconjungle/-shapeshift-labs-frontier-effects)
- [`siliconjungle/-shapeshift-labs-frontier-auth`](https://github.com/siliconjungle/-shapeshift-labs-frontier-auth)
- [`siliconjungle/-shapeshift-labs-frontier-policy`](https://github.com/siliconjungle/-shapeshift-labs-frontier-policy)
- [`siliconjungle/-shapeshift-labs-frontier-flags`](https://github.com/siliconjungle/-shapeshift-labs-frontier-flags)
- [`siliconjungle/-shapeshift-labs-frontier-tools`](https://github.com/siliconjungle/-shapeshift-labs-frontier-tools)
- [`siliconjungle/-shapeshift-labs-frontier-sandbox`](https://github.com/siliconjungle/-shapeshift-labs-frontier-sandbox)
- [`siliconjungle/-shapeshift-labs-frontier-sandbox-quickjs`](https://github.com/siliconjungle/-shapeshift-labs-frontier-sandbox-quickjs)
- [`siliconjungle/-shapeshift-labs-frontier-workflow`](https://github.com/siliconjungle/-shapeshift-labs-frontier-workflow)
- [`siliconjungle/-shapeshift-labs-frontier-worker`](https://github.com/siliconjungle/-shapeshift-labs-frontier-worker)
- [`siliconjungle/-shapeshift-labs-frontier-queue`](https://github.com/siliconjungle/-shapeshift-labs-frontier-queue)
- [`siliconjungle/-shapeshift-labs-frontier-swarm`](https://github.com/siliconjungle/-shapeshift-labs-frontier-swarm)
- [`siliconjungle/-shapeshift-labs-frontier-swarm-codex`](https://github.com/siliconjungle/-shapeshift-labs-frontier-swarm-codex)
- [`siliconjungle/-shapeshift-labs-frontier-lang-kernel`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-kernel)
- [`siliconjungle/-shapeshift-labs-frontier-lang-parser`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-parser)
- [`siliconjungle/-shapeshift-labs-frontier-lang-checker`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-checker)
- [`siliconjungle/-shapeshift-labs-frontier-lang-typescript`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-typescript)
- [`siliconjungle/-shapeshift-labs-frontier-lang-javascript`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-javascript)
- [`siliconjungle/-shapeshift-labs-frontier-lang-rust`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-rust)
- [`siliconjungle/-shapeshift-labs-frontier-lang-python`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-python)
- [`siliconjungle/-shapeshift-labs-frontier-lang-c`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-c)
- [`siliconjungle/-shapeshift-labs-frontier-lang-compiler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-compiler)
- [`siliconjungle/-shapeshift-labs-frontier-lang-swift`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-swift)
- [`siliconjungle/-shapeshift-labs-frontier-lang-kotlin`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-kotlin)
- [`siliconjungle/-shapeshift-labs-frontier-lang-java`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-java)
- [`siliconjungle/-shapeshift-labs-frontier-lang-go`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-go)
- [`siliconjungle/-shapeshift-labs-frontier-lang-csharp`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-csharp)
- [`siliconjungle/-shapeshift-labs-frontier-lang-clang`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-clang)
- [`siliconjungle/-shapeshift-labs-frontier-lang-cli`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang-cli)
- [`siliconjungle/-shapeshift-labs-frontier-lang`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lang)
- [`siliconjungle/-shapeshift-labs-frontier-kv`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv)
- [`siliconjungle/-shapeshift-labs-frontier-kv-locks`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-locks)
- [`siliconjungle/-shapeshift-labs-frontier-kv-rate-limit`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-rate-limit)
- [`siliconjungle/-shapeshift-labs-frontier-kv-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-file)
- [`siliconjungle/-shapeshift-labs-frontier-kv-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-idb)
- [`siliconjungle/-shapeshift-labs-frontier-kv-redis`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-redis)
- [`siliconjungle/-shapeshift-labs-frontier-kv-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-kv-server)
- [`siliconjungle/-shapeshift-labs-frontier-assets`](https://github.com/siliconjungle/-shapeshift-labs-frontier-assets)
- [`siliconjungle/-shapeshift-labs-frontier-blueprint`](https://github.com/siliconjungle/-shapeshift-labs-frontier-blueprint)
- [`siliconjungle/-shapeshift-labs-frontier-triggers`](https://github.com/siliconjungle/-shapeshift-labs-frontier-triggers)
- [`siliconjungle/-shapeshift-labs-frontier-virtual`](https://github.com/siliconjungle/-shapeshift-labs-frontier-virtual)
- [`siliconjungle/-shapeshift-labs-frontier-table`](https://github.com/siliconjungle/-shapeshift-labs-frontier-table)
- [`siliconjungle/-shapeshift-labs-frontier-scene`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scene)
- [`siliconjungle/-shapeshift-labs-frontier-pathfinding`](https://github.com/siliconjungle/-shapeshift-labs-frontier-pathfinding)
- [`siliconjungle/-shapeshift-labs-frontier-lod`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lod)
- [`siliconjungle/-shapeshift-labs-frontier-route`](https://github.com/siliconjungle/-shapeshift-labs-frontier-route)
- [`siliconjungle/-shapeshift-labs-frontier-trace`](https://github.com/siliconjungle/-shapeshift-labs-frontier-trace)
- [`siliconjungle/-shapeshift-labs-frontier-manifest`](https://github.com/siliconjungle/-shapeshift-labs-frontier-manifest)
- [`siliconjungle/-shapeshift-labs-frontier-view`](https://github.com/siliconjungle/-shapeshift-labs-frontier-view)
- [`siliconjungle/-shapeshift-labs-frontier-icons`](https://github.com/siliconjungle/-shapeshift-labs-frontier-icons)
- [`siliconjungle/-shapeshift-labs-frontier-design`](https://github.com/siliconjungle/-shapeshift-labs-frontier-design)
- [`siliconjungle/-shapeshift-labs-frontier-canvas`](https://github.com/siliconjungle/-shapeshift-labs-frontier-canvas)
- [`siliconjungle/-shapeshift-labs-frontier-canvas-tools`](https://github.com/siliconjungle/-shapeshift-labs-frontier-canvas-tools)
- [`siliconjungle/-shapeshift-labs-frontier-dnd`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dnd)
- [`siliconjungle/-shapeshift-labs-frontier-dom`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dom)
- [`siliconjungle/-shapeshift-labs-frontier-playwright`](https://github.com/siliconjungle/-shapeshift-labs-frontier-playwright)
- [`siliconjungle/-shapeshift-labs-frontier-test`](https://github.com/siliconjungle/-shapeshift-labs-frontier-test)
- [`siliconjungle/-shapeshift-labs-frontier-fixtures`](https://github.com/siliconjungle/-shapeshift-labs-frontier-fixtures)
- [`siliconjungle/-shapeshift-labs-frontier-component-preview`](https://github.com/siliconjungle/-shapeshift-labs-frontier-component-preview)
- [`siliconjungle/-shapeshift-labs-frontier-documentation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-documentation)
- [`siliconjungle/-shapeshift-labs-frontier-ast-walk`](https://github.com/siliconjungle/-shapeshift-labs-frontier-ast-walk)
- [`siliconjungle/-shapeshift-labs-frontier-history`](https://github.com/siliconjungle/-shapeshift-labs-frontier-history)
- [`siliconjungle/-shapeshift-labs-frontier-application`](https://github.com/siliconjungle/-shapeshift-labs-frontier-application)
- [`siliconjungle/-shapeshift-labs-frontier-linter`](https://github.com/siliconjungle/-shapeshift-labs-frontier-linter)
- [`siliconjungle/-shapeshift-labs-frontier-framework`](https://github.com/siliconjungle/-shapeshift-labs-frontier-framework)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)
- [`siliconjungle/-shapeshift-labs-frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game)
- [`siliconjungle/-shapeshift-labs-loom`](https://github.com/siliconjungle/-shapeshift-labs-loom)
