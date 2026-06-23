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
and rejected unsafe cases such as stale
ledger spans, import specifier reordering, computed keys, duplicate exported
names, duplicate object members, decorators, overload anchors, and same-anchor
edit conflicts. Fixture failures include the fixture id and the actual
reason-code or gate values so distributed swarm evidence can point at a stable
case instead of an agent transcript.

Successful `safeMergeJsTsImportsAndDeclarations` and `safeMergeJsTsSource`
results also include `semanticArtifacts`. These artifacts convert the
JS/TS ledger-approved head-to-merged source edits into a semantic edit script,
projection, replay, and already-applied replay. This is intentionally different
from asking the generic three-way edit classifier to bless every JS/TS case:
simultaneous import specifier additions are safe only because the JS/TS ledger
gates proved independent additions, stable anchors, and source replay. The
artifacts keep `autoMergeClaim: false` and `semanticEquivalenceClaim: false`,
but give coordinators machine-readable proof that the projected source matches
the merge output and that applying the same projection again is a no-op.

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
`moduleResolution.imports` applies from `packageRoot`/`root`, while
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

Named re-export identities also include symbol links when the project graph has
enough evidence. For `export { thing as renamedThing } from './thing.js'`,
`reExportIdentities[]` records the source module, imported/exported names,
`originSymbolId`, `exportedSymbolId`, and `localSymbolId`.
Public contract regions include `apiSurfaceKind`, `signatureHash`, and
`contractHash`, giving merge admission a stable API surface fingerprint.
For `export * from './module.js'`, project graphs fan out re-export identities
for each named export in the resolved target document and omit `default`, which
matches JavaScript module semantics.

When using `createTypeScriptCompilerNativeImporterAdapter`, compiler AST imports
emit the same binding-level module facts instead of only statement-level module
edges. Default, namespace, named, type-only, side-effect, re-export, export-star,
local export, `export default`, and `export =` declarations carry `importKind`,
`exportKind`, `localName`, `importedName`, `exportedName`, `isTypeOnly`, and
public-contract metadata into the semantic index and project symbol graph.

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

When `sourceText` is present, hashes are computed from the actual text. Caller-provided hashes are recorded as declared metadata and cannot make stale text project as exact source. Use `includeTokens`, `includeTrivia`, `includeDirectives`, and `max*` options to keep preservation records compact for large files.

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
