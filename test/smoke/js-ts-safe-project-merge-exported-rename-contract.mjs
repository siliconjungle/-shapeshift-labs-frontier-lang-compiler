import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const directExportBase = 'export function oldName() { return 1; }\n';
const directExportProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_direct_exported_rename_still_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: { 'src/rename.ts': directExportBase },
  workerFiles: { 'src/rename.ts': 'export function newName() { return 1; }\n' },
  headFiles: { 'src/rename.ts': directExportBase }
});
assert.equal(directExportProject.status, 'blocked');
assert.equal(directExportProject.projectGraphDelta, undefined);
assert.equal(directExportProject.admission.reasonCodes.includes('top-level-rename-public-export-contract'), true);

const aliasPreservingBase = [
  'function oldName() { return 1; }',
  'export function keep() { return 0; }',
  'export { oldName };',
  ''
].join('\n');
const aliasPreservingWorker = [
  'function newName() { return 1; }',
  'export function keep() { return 0; }',
  'export { newName as oldName };',
  ''
].join('\n');
const aliasPreservingHead = aliasPreservingBase.replace('return 0;', 'return 2;');
const aliasPreservingExpected = [
  'function newName() { return 1; }',
  'export function keep() { return 2; }',
  'export { newName as oldName };',
  ''
].join('\n');

const sourceLevelAliasRename = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_export_alias_rename_without_project_evidence_blocked',
  language: 'typescript',
  sourcePath: 'src/api.ts',
  baseSourceText: aliasPreservingBase,
  workerSourceText: aliasPreservingWorker,
  headSourceText: aliasPreservingHead
});
assert.equal(sourceLevelAliasRename.status, 'blocked');
assert.equal(sourceLevelAliasRename.admission.reasonCodes.includes('top-level-rename-public-export-contract'), true);

const projectLevelAliasRename = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_export_alias_rename_contract_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: { 'src/api.ts': aliasPreservingBase },
  workerFiles: { 'src/api.ts': aliasPreservingWorker },
  headFiles: { 'src/api.ts': aliasPreservingHead }
});
assert.equal(projectLevelAliasRename.status, 'merged');
assert.equal(projectLevelAliasRename.files[0].outputSourceText, aliasPreservingExpected);
assert.equal(projectLevelAliasRename.files[0].result.metadata.composed.topLevelRenameAdmission.deferredToProjectGraph, true);
assert.equal(projectLevelAliasRename.summary.projectGraphPublicContractConflicts, 0);
assert.equal(projectLevelAliasRename.projectGraphDelta.summary.publicContractConflicts, 0);
