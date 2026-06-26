import { assert } from './helpers.mjs';
import { JsTsSafeMergeConflictCodes } from '../../src/js-ts-safe-merge.js';
import { safeMergeJsTsSource } from '../../src/js-ts-semantic-merge.js';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection, safeMergeJsTsProject } from '../../src/index.js';
const semanticMergeMatrixCells = [
  { id: 'class-method-rename/admitted', status: 'done', evidence: 'js-ts-safe-merge-rename-move-fallback', note: 'composed safe merge admits class method rename when head changes a sibling method' },
  { id: 'top-level-rename/semantic-edit-admitted', status: 'done', evidence: 'semantic-edit-rename-move-source-replay', note: 'semantic edit projection can replay a top-level rename over an independent sibling edit' },
  {
    id: 'top-level-rename/exported-composed-safe-merge-blocked',
    status: 'done',
    evidence: 'js-ts-safe-merge-rename-move-fallback',
    note: 'composed safe merge still blocks exported top-level rename without project contract evidence'
  },
  {
    id: 'top-level-rename/exported-project-contract-admitted',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-exported-rename-contract',
    note: 'project graph delta admits alias-preserving exported rename when public contract evidence stays stable'
  },
  {
    id: 'top-level-rename/private-composed-safe-merge-admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-rename-move-fallback',
    note: 'composed safe merge admits a narrow unexported top-level rename with an independent sibling edit'
  },
  {
    id: 'independent-deletion/internal-admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-independent-deletion-fallback',
    note: 'internal top-level deletion replays when the head keeps the deleted anchor unchanged'
  },
  {
    id: 'exported-deletion/blocked',
    status: 'done',
    evidence: 'js-ts-safe-merge-independent-deletion-fallback',
    note: 'exported top-level deletion remains review-required'
  },
  {
    id: 'namespace-module-declarations/sibling-edits-admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-top-level-sibling-semantic-edits',
    note: 'namespace and module declaration body siblings merge through semantic fallback'
  },
  {
    id: 'interface-type-alias-edits/admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-top-level-sibling-semantic-edits',
    note: 'interface and type alias sibling member edits merge through semantic fallback'
  },
  {
    id: 'enum-members/admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-enum-members',
    note: 'enum member sibling value edits and additions merge'
  },
  {
    id: 'variable-declarators/admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-variable-declarators',
    note: 'sibling declarators inside one statement merge'
  },
  {
    id: 'binding-patterns/classified',
    status: 'done',
    evidence: 'binding-pattern-classification-next',
    note: 'binding-pattern declarators merge only for stable simple object bindings and otherwise block with precise reasons'
  },
  {
    id: 'tsx-jsx-attribute/shifted-head-admitted',
    status: 'done',
    evidence: 'semantic-edit-tsx-jsx-attributes',
    note: 'attribute value edit replays when the head preserves the JSX control-flow anchor'
  },
  {
    id: 'tsx-jsx-attribute/same-region-field-merge',
    status: 'done',
    evidence: 'semantic-edit-tsx-jsx-attributes',
    note: 'field-level JSX attribute merge admits disjoint attribute changes in the same JSX region'
  },
  {
    id: 'tsx-jsx-expression/same-parent-disjoint-admitted',
    status: 'done',
    evidence: 'semantic-edit-tsx-jsx-attributes',
    note: 'direct JSX expression-container edits merge when child order and parent identity are stable'
  },
  {
    id: 'tsx-jsx-children/distinct-gap-additions-admitted',
    status: 'done',
    evidence: 'semantic-edit-tsx-jsx-attributes',
    note: 'direct JSX child element additions merge when they target different stable insertion gaps'
  },
  { id: 'tsx-jsx-children/keyed-fragment-additions-admitted', status: 'done', evidence: 'semantic-edit-tsx-jsx-attributes', note: 'keyed named Fragment additions merge as opaque keyed children while duplicate keys, spreads, same-gap conflicts, data-key, and shorthand fragments stay blocked' },
  { id: 'jsx-tsx-element-prop-graph/event-handler-local-declaration-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-jsx-event-handlers', note: 'static JSX event-handler props carry same-owner local declaration hashes when a local function or handler variable is available' },
  { id: 'jsx-tsx-element-prop-graph/render-return-branch-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-jsx-graph', note: 'public JSX component return expressions carry static render-return records and branch-control blockers for conditional returns' },
  { id: 'scope-use-def-graph/public-reference-delta-conflict', status: 'done', evidence: 'js-ts-safe-project-merge-scope-use-def-reference-conflicts', note: 'public scope reference sites now emit explicit delta and ambiguous-evidence conflicts instead of relying only on binding aggregation' },
  { id: 'scope-use-def-graph/compiler-receiver-member-reference-proof', status: 'done', evidence: 'js-ts-safe-project-merge-scope-use-def-receiver-members', note: 'TypeScript checker reference proof attaches to this/super receiver member references, including private identifiers, through full receiver-access spans' },
  {
    id: 'import-removal/project-diagnostics-admitted',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-diagnostics-gate',
    note: 'one worker-side named import specifier removal can merge only with project output diagnostics proof'
  },
  { id: 'project-admission/missing-graph-proof-review', status: 'done', evidence: 'generic-admission-proof-policy', note: 'project admission keeps missing graph-delta proof signals visible without claiming semantic equivalence' },
  { id: 'project-admission/semantic-replay-clean-proof-routing', status: 'done', evidence: 'js-ts-safe-project-merge-semantic-replay-proof', note: 'generic semantic edit admission has a first-class replay-clean proof level and routes failed replay diagnostics to produce-semantic-edit-replay-proof' },
  { id: 'project-admission/structural-admission-route-records', status: 'done', evidence: 'js-ts-safe-project-merge-admission-routes', note: 'project admission emits normalized route records for apply, review, reject, rerun, and rebase decisions across symbol rename, symbol move, split/merge, replay-proof, and missing-evidence paths' },
  { id: 'module-export-import-graph/package-null-target-fail-closed', status: 'done', evidence: 'project-symbol-graph-package-manifests', note: 'package exports/imports null targets fail closed and wildcard export edges retain package export key/target evidence' }, { id: 'module-export-import-graph/namespace-ambient-export-assignment-shape-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-namespace-ambient-export-assignment-shape', note: 'namespace, ambient module/global augmentation, and export-assignment graph records carry static shape hashes and fail closed on incompatible branch deltas without claiming runtime equivalence' },
  { id: 'project-admission/proof-level-routing-review', status: 'done', evidence: 'js-ts-safe-project-merge-admission-proof-policy', note: 'project summaries expose source-span roundtrip proof, focused-test proof, unsupported-surface routing, and next missing diagnostics proof signal without semantic-equivalence claims' },
  { id: 'project-admission/quality-gate-rerun-routing', status: 'done', evidence: 'js-ts-safe-project-merge-quality-gates', note: 'failed quality gates keep project output blocked while confidence recommends rerun with a stable quality-gate route' },
  {
    id: 'required-syntax-gate/project-output-syntax-blocked',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-diagnostics-gate',
    note: 'required JS/TS output diagnostics classify syntax failures with a stable project-output-syntax-diagnostic reason code'
  },
  { id: 'call-argument/effectful-stable-callee-blocked', status: 'done', evidence: 'semantic-callsite-regions', note: 'effectful call argument edits remain blocked without explicit order/effect evidence' },
  { id: 'call-argument/rest-callee-pure-append-admitted', status: 'done', evidence: 'semantic-callsite-regions', note: 'rest-parameter callsites merge pure trailing argument appends with explicit replacement evidence' },
  { id: 'call-argument/adversarial-append-blocked', status: 'done', evidence: 'semantic-callsite-regions', note: 'nested calls, method and optional callees, comments, duplicate object literals, spread, stale spans, and signature false positives stay blocked or reanchored' },
  { id: 'compiler-type-graph/inferred-factory-signature-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-type-graph', note: 'caller-injected TypeScript compiler graph records exported inferred factory call signatures as public API evidence' },
  { id: 'compiler-type-graph/overload-equivalence-unsupported-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-type-graph', note: 'exported overload records carry declaration/signature counts and unsupported type-equivalence reason codes' }, { id: 'compiler-type-graph/index-signature-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-index-signatures', note: 'public index signatures emit key/value/readonly checker records, proof hashes, and missing-proof blockers without claiming broad type equivalence' }, { id: 'compiler-type-graph/composite-type-shape-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-composite-type-shapes', note: 'public union, intersection, and tuple type shapes emit member/element checker records, proof hashes, and missing-proof blockers without claiming broad type equivalence' }, { id: 'compiler-type-graph/enum-runtime-shape-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-enum-shape', note: 'exported enums emit compiler-backed member value/runtime-shape records and fail closed when enum shape proof is missing or computed runtime values are unproven' }, { id: 'compiler-type-graph/inference-syntax-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-inference-syntax', note: 'satisfies, as const, and const type parameters emit compiler-backed static inference syntax records/proof hashes without claiming broad inference equivalence' }, { id: 'compiler-type-graph/template-infer-type-shape-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-template-infer-type-shapes', note: 'template literal type spans and infer type parameters emit compiler-backed shape hashes and fail closed when required evidence is missing' }, { id: 'compiler-type-graph/class-private-accessor-shape-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-compiler-class-private-accessor-shape', note: 'public class compiler records include private member/accessor-field static shape records, proof hashes, and missing-proof admission blockers without claiming runtime equivalence' },
  { id: 'source-span/source-url-generated-boundary-evidence', status: 'done', evidence: 'js-ts-safe-project-merge-source-span-graph', note: 'JS/TS source ledger classifies sourceURL boundaries and shebang file-entrypoint directives with deterministic ownership evidence' },
  { id: 'semantic-replay/applied-already-applied-overlap-blocked', status: 'done', evidence: 'semantic-edit-bundle-auto-merge', note: 'replay blocks overlaps between already-applied ranges and edits that would still write source' },
  { id: 'semantic-replay/output-binding-spoof-blocked', status: 'done', evidence: 'js-ts-safe-project-merge-semantic-replay-proof', note: 'replay output source/hash binding blocks spoofed expected outputs before admission' }
];
assert.equal(semanticMergeMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}

const oracleTopLevelRenameBase = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const oracleTopLevelRenameWorker = oracleTopLevelRenameBase.replace('function step', 'function renamedStep');
const oracleTopLevelRenameHead = oracleTopLevelRenameBase.replace('return 0;', 'return 10;');
const oracleTopLevelRenameExpected = [
  'export function renamedStep(v: number) {',
  '  return v + 1;',
  '}',
  'export function keep() {',
  '  return 10;',
  '}',
  ''
].join('\n');
const oracleTopLevelRenameScript = createSemanticEditScript({
  id: 'oracle_semantic_edit_top_level_rename_admitted',
  language: 'typescript',
  sourcePath: 'src/oracles/top-level-rename.ts',
  baseSourceText: oracleTopLevelRenameBase,
  workerSourceText: oracleTopLevelRenameWorker,
  headSourceText: oracleTopLevelRenameHead
});
assert.equal(oracleTopLevelRenameScript.admission.status, 'auto-merge-candidate');
assert.equal(oracleTopLevelRenameScript.summary.byKind.removeBody, 1);
assert.equal(oracleTopLevelRenameScript.summary.byKind.addBody, 1);

const oracleTopLevelRenameProjection = projectSemanticEditScriptToSource({
  script: oracleTopLevelRenameScript,
  workerSourceText: oracleTopLevelRenameWorker,
  headSourceText: oracleTopLevelRenameHead
});
assert.equal(oracleTopLevelRenameProjection.status, 'projected');
assert.equal(oracleTopLevelRenameProjection.sourceText, oracleTopLevelRenameExpected);

const oracleTopLevelRenameReplay = replaySemanticEditProjection({
  projection: oracleTopLevelRenameProjection,
  currentSourceText: oracleTopLevelRenameHead
});
assert.equal(oracleTopLevelRenameReplay.status, 'accepted-clean');
assert.equal(oracleTopLevelRenameReplay.outputSourceText, oracleTopLevelRenameExpected);
const oracleTopLevelRenameSafeMerge = safeMergeJsTsSource({
  id: 'oracle_safe_merge_top_level_rename_blocked',
  language: 'typescript',
  sourcePath: 'src/oracles/top-level-rename.ts',
  baseSourceText: oracleTopLevelRenameBase,
  workerSourceText: oracleTopLevelRenameWorker,
  headSourceText: oracleTopLevelRenameHead
});
assert.equal(oracleTopLevelRenameSafeMerge.status, 'blocked');
assert.equal(oracleTopLevelRenameSafeMerge.semanticArtifacts, undefined);
assert.equal(oracleTopLevelRenameSafeMerge.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged), true);
assert.equal(oracleTopLevelRenameSafeMerge.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.changedExistingDeclaration), true);

const oracleClassMethodRenameBase = [
  'export class Service {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '  keep() {',
  '    return 0;',
  '  }',
  '}',
  ''
].join('\n');
const oracleClassMethodRenameWorker = oracleClassMethodRenameBase.replace('step(v: number)', 'renamedStep(v: number)');
const oracleClassMethodRenameHead = oracleClassMethodRenameBase.replace('return 0;', 'return 10;');
const oracleClassMethodRenameExpected = [
  'export class Service {',
  '  renamedStep(v: number) {',
  '    return v + 1;',
  '  }',
  '  keep() {',
  '    return 10;',
  '  }',
  '}',
  ''
].join('\n');
const oracleClassMethodRenameSafeMerge = safeMergeJsTsSource({
  id: 'oracle_safe_merge_class_method_rename_admitted',
  language: 'typescript',
  sourcePath: 'src/oracles/service.ts',
  baseSourceText: oracleClassMethodRenameBase,
  workerSourceText: oracleClassMethodRenameWorker,
  headSourceText: oracleClassMethodRenameHead
});
assert.equal(oracleClassMethodRenameSafeMerge.status, 'merged');
assert.equal(oracleClassMethodRenameSafeMerge.mergedSourceText, oracleClassMethodRenameExpected);
assert.equal(oracleClassMethodRenameSafeMerge.semanticArtifacts.status, 'verified');

const oracleTsxAttributeBase = 'export function View() {\n  return <Button tone="base" size="m" />;\n}\n';
const oracleTsxAttributeWorker = oracleTsxAttributeBase.replace('tone="base"', 'tone="worker"');
const oracleTsxAttributeHead = `// shifted by head\n${oracleTsxAttributeBase}`;
const oracleTsxAttributeSafeMerge = safeMergeJsTsSource({
  id: 'oracle_safe_merge_tsx_attribute_admitted',
  language: 'tsx',
  sourcePath: 'src/oracles/view.tsx',
  baseSourceText: oracleTsxAttributeBase,
  workerSourceText: oracleTsxAttributeWorker,
  headSourceText: oracleTsxAttributeHead
});
assert.equal(oracleTsxAttributeSafeMerge.status, 'merged');
assert.equal(oracleTsxAttributeSafeMerge.mergedSourceText, `// shifted by head\n${oracleTsxAttributeWorker}`);
assert.equal(oracleTsxAttributeSafeMerge.semanticArtifacts.status, 'verified');

const oracleTsxAttributeSameRegionMerged = safeMergeJsTsSource({
  id: 'oracle_safe_merge_tsx_attribute_same_region_merged',
  language: 'tsx',
  sourcePath: 'src/oracles/view.tsx',
  baseSourceText: oracleTsxAttributeBase,
  workerSourceText: oracleTsxAttributeWorker,
  headSourceText: oracleTsxAttributeBase.replace('size="m"', 'size="l"')
});
assert.equal(oracleTsxAttributeSameRegionMerged.status, 'merged');
assert.equal(oracleTsxAttributeSameRegionMerged.mergedSourceText, 'export function View() {\n  return <Button tone="worker" size="l" />;\n}\n');
assert.equal(oracleTsxAttributeSameRegionMerged.semanticArtifacts.status, 'verified');

const oracleTsxExpressionBase = 'export function View({ a, b }) {\n  return <div>{a}<span data-id="x">x</span>{b}</div>;\n}\n';
const oracleTsxExpressionWorker = oracleTsxExpressionBase.replace('{a}', '{a + 1}');
const oracleTsxExpressionHead = oracleTsxExpressionBase.replace('{b}', '{b + 1}');
const oracleTsxExpressionSafeMerge = safeMergeJsTsSource({
  id: 'oracle_safe_merge_tsx_expression_same_parent_disjoint',
  language: 'tsx',
  sourcePath: 'src/oracles/view.tsx',
  baseSourceText: oracleTsxExpressionBase,
  workerSourceText: oracleTsxExpressionWorker,
  headSourceText: oracleTsxExpressionHead
});
assert.equal(oracleTsxExpressionSafeMerge.status, 'merged');
assert.equal(oracleTsxExpressionSafeMerge.mergedSourceText, 'export function View({ a, b }) {\n  return <div>{a + 1}<span data-id="x">x</span>{b + 1}</div>;\n}\n');
assert.equal(oracleTsxExpressionSafeMerge.semanticArtifacts.status, 'verified');
assert.equal(oracleTsxExpressionSafeMerge.summary.jsxChildExpressionEdits, 1);

const oracleTsxExpressionConflict = safeMergeJsTsSource({
  id: 'oracle_safe_merge_tsx_expression_same_expression_blocked',
  language: 'tsx',
  sourcePath: 'src/oracles/view.tsx',
  baseSourceText: oracleTsxExpressionBase,
  workerSourceText: oracleTsxExpressionWorker,
  headSourceText: oracleTsxExpressionBase.replace('{a}', '{a + 2}')
});
assert.equal(oracleTsxExpressionConflict.status, 'blocked');

const oracleTsxChildAdditionBase = 'export function View() {\n  return <div><span>A</span></div>;\n}\n';
const oracleTsxChildAdditionSafeMerge = safeMergeJsTsSource({
  id: 'oracle_safe_merge_tsx_child_additions_distinct_gaps',
  language: 'tsx',
  sourcePath: 'src/oracles/view.tsx',
  baseSourceText: oracleTsxChildAdditionBase,
  workerSourceText: 'export function View() {\n  return <div><span>B</span><span>A</span></div>;\n}\n',
  headSourceText: 'export function View() {\n  return <div><span>A</span><span>C</span></div>;\n}\n'
});
assert.equal(oracleTsxChildAdditionSafeMerge.status, 'merged');
assert.equal(oracleTsxChildAdditionSafeMerge.mergedSourceText, 'export function View() {\n  return <div><span>B</span><span>A</span><span>C</span></div>;\n}\n');
assert.equal(oracleTsxChildAdditionSafeMerge.summary.jsxChildAdditions, 1);

const oracleImportRemovalProject = safeMergeJsTsProject({
  id: 'oracle_project_import_removal_diagnostics_admitted',
  language: 'typescript',
  outputDiagnostics: [],
  baseFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  },
  workerFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used } from './dep.js';\nexport const value = used;\n"
  },
  headFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = used;\n"
  }
});
const oracleImportRemovalFile = oracleImportRemovalProject.files.find((file) => file.sourcePath === 'src/consumer.ts');
assert.equal(oracleImportRemovalProject.status, 'merged');
assert.equal(oracleImportRemovalFile.operation, 'merged-import-removal-usage-proof');
assert.equal(oracleImportRemovalFile.metadata.importRemovalUsageProof.removedSpecifier, 'unused');
assert.equal(oracleImportRemovalProject.proofEvidence.records.find((record) => record.level === 'source-span-roundtrip').status, 'passed');
assert.equal(oracleImportRemovalProject.summary.nextMissingEvidenceRouteId, 'emit-output-declarations');
assert.equal(oracleImportRemovalProject.summary.confidenceDimensions.proof, 'partial');
assert.equal(oracleImportRemovalProject.summary.confidenceDimensions.semanticEquivalence, 'unknown');
assert.equal(oracleImportRemovalProject.summary.missingEvidenceMatrix.byRoute['produce-source-span-roundtrip-evidence'], undefined);
