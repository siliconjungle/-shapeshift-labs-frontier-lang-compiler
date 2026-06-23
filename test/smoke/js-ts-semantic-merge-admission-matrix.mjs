import { assert } from './helpers.mjs';
import { JsTsSafeMergeConflictCodes } from '../../src/js-ts-safe-merge.js';
import { safeMergeJsTsSource } from '../../src/js-ts-semantic-merge.js';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from '../../src/index.js';

const semanticMergeMatrixCells = [
  {
    id: 'class-method-rename/admitted',
    status: 'done',
    evidence: 'js-ts-safe-merge-rename-move-fallback',
    note: 'composed safe merge admits class method rename when head changes a sibling method'
  },
  {
    id: 'top-level-rename/semantic-edit-admitted',
    status: 'done',
    evidence: 'semantic-edit-rename-move-source-replay',
    note: 'semantic edit projection can replay a top-level rename over an independent sibling edit'
  },
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
  }
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
