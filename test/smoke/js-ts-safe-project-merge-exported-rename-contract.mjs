import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

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

const crossFileRenameBaseFiles = {
  'src/api.ts': 'export function oldName() { return 1; }\n',
  'src/consumer.ts': "import { oldName } from './api.js';\nexport const total = oldName();\n"
};
const crossFileRenameWorkerFiles = {
  'src/api.ts': 'export function newName() { return 1; }\n',
  'src/consumer.ts': "import { newName } from './api.js';\nexport const total = newName();\n"
};
const workerCrossFileRenameDefaultAdmission = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_default_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: crossFileRenameWorkerFiles,
  headFiles: crossFileRenameBaseFiles
});
assert.equal(workerCrossFileRenameDefaultAdmission.status, 'merged');
assert.notEqual(workerCrossFileRenameDefaultAdmission.projectGraphDelta, undefined);
assert.equal(workerCrossFileRenameDefaultAdmission.outputFiles.find((file) => file.sourcePath === 'src/api.ts').sourceText, crossFileRenameWorkerFiles['src/api.ts']);
assert.equal(workerCrossFileRenameDefaultAdmission.outputFiles.find((file) => file.sourcePath === 'src/consumer.ts').sourceText, crossFileRenameWorkerFiles['src/consumer.ts']);
assert.equal(workerCrossFileRenameDefaultAdmission.summary.projectCrossFileSymbolRenameClassifications, 1);
assert.equal(workerCrossFileRenameDefaultAdmission.summary.projectCrossFileSymbolRenameAdmissions, 1);
assert.equal(workerCrossFileRenameDefaultAdmission.outputDiagnosticsGate.status, 'passed');
assert.equal(workerCrossFileRenameDefaultAdmission.outputDeclarationGate.status, 'passed');
assert.equal(workerCrossFileRenameDefaultAdmission.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-rename-admission'
  && record.defaultAdmission === true
  && record.details.defaultAdmissionProof.route === 'default-exact-cross-file-symbol-rename'
)), true);
assert.deepEqual(workerCrossFileRenameDefaultAdmission.files[0].metadata.projectSymbolRenameAdmissions[0].details.requiredEvidence, [
  'import-export-rewrite-evidence',
  'output-diagnostics-gate',
  'output-declaration-gate'
]);
assert.equal(workerCrossFileRenameDefaultAdmission.metadata.projectSymbolRenameClassifications.crossFileSymbolRenames, 1);
assert.equal(workerCrossFileRenameDefaultAdmission.metadata.projectSymbolRenameClassifications.crossFileSymbolRenameAdmissions, 1);

const renameWithoutProjectGraphStillBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_without_graph_blocked',
  language: 'typescript',
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: crossFileRenameWorkerFiles,
  headFiles: crossFileRenameBaseFiles
});
assert.equal(renameWithoutProjectGraphStillBlocked.status, 'blocked');
assert.equal(renameWithoutProjectGraphStillBlocked.summary.projectCrossFileSymbolRenameAdmissions, 0);
assert.equal(renameWithoutProjectGraphStillBlocked.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-rename-admission'
)), false);

const renameWithoutGatesStillBlocked = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_without_gates_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  allowProjectSymbolRenames: true,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: crossFileRenameWorkerFiles,
  headFiles: crossFileRenameBaseFiles
});
assert.equal(renameWithoutGatesStillBlocked.status, 'blocked');
assert.equal(renameWithoutGatesStillBlocked.admission.reasonCodes.includes('project-worker-cross-file-symbol-rename-blocked'), true);
assert.equal(renameWithoutGatesStillBlocked.summary.projectCrossFileSymbolRenameAdmissions, 0);
assert.equal(renameWithoutGatesStillBlocked.conflicts.every((conflict) => (
  conflict.details.requiredEvidence.includes('output-diagnostics-gate')
    && conflict.details.requiredEvidence.includes('output-declaration-gate')
)), true);

const admittedWorkerCrossFileRename = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  allowProjectSymbolRenames: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: crossFileRenameWorkerFiles,
  headFiles: crossFileRenameBaseFiles
});
assert.equal(admittedWorkerCrossFileRename.status, 'merged');
assert.equal(admittedWorkerCrossFileRename.outputFiles.find((file) => file.sourcePath === 'src/api.ts').sourceText, crossFileRenameWorkerFiles['src/api.ts']);
assert.equal(admittedWorkerCrossFileRename.outputFiles.find((file) => file.sourcePath === 'src/consumer.ts').sourceText, crossFileRenameWorkerFiles['src/consumer.ts']);
assert.equal(admittedWorkerCrossFileRename.summary.projectCrossFileSymbolRenameClassifications, 1);
assert.equal(admittedWorkerCrossFileRename.summary.projectCrossFileSymbolRenameAdmissions, 1);
assert.equal(admittedWorkerCrossFileRename.metadata.projectSymbolRenameClassifications.crossFileSymbolRenameAdmissions, 1);
assert.equal(admittedWorkerCrossFileRename.outputDiagnosticsGate.status, 'passed');
assert.equal(admittedWorkerCrossFileRename.outputDeclarationGate.status, 'passed');
assert.equal(admittedWorkerCrossFileRename.evidence.some((record) => record.kind === 'js-ts-project-symbol-rename-admission'), true);
assert.equal(admittedWorkerCrossFileRename.confidence.evidenceIds.some((id) => id.includes('cross_file_symbol_rename')), true);

const partialWorkerCrossFileRename = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_partial_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  allowProjectSymbolRenames: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: { ...crossFileRenameWorkerFiles, 'src/consumer.ts': crossFileRenameBaseFiles['src/consumer.ts'] },
  headFiles: crossFileRenameBaseFiles
});
assert.equal(partialWorkerCrossFileRename.status, 'blocked');
assert.equal(partialWorkerCrossFileRename.admission.reasonCodes.includes('top-level-rename-public-export-contract'), true);
assert.equal(partialWorkerCrossFileRename.summary.projectCrossFileSymbolRenameAdmissions, 0);

const stalePartialImportBaseFiles = {
  'src/api.ts': crossFileRenameBaseFiles['src/api.ts'],
  'src/a.ts': "import { oldName } from './api.js';\nexport const a = oldName();\n",
  'src/b.ts': "import { oldName } from './api.js';\nexport const b = oldName();\n"
};
const stalePartialImportWorkerFiles = {
  'src/api.ts': crossFileRenameWorkerFiles['src/api.ts'],
  'src/a.ts': "import { newName } from './api.js';\nexport const a = newName();\n",
  'src/b.ts': stalePartialImportBaseFiles['src/b.ts']
};
const stalePartialImportRename = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_stale_partial_import_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: stalePartialImportBaseFiles,
  workerFiles: stalePartialImportWorkerFiles,
  headFiles: stalePartialImportBaseFiles
});
assert.equal(stalePartialImportRename.status, 'blocked');
assert.equal(stalePartialImportRename.summary.projectCrossFileSymbolRenameClassifications, 1);
assert.equal(stalePartialImportRename.summary.projectCrossFileSymbolRenameAdmissions, 0);
assert.equal(stalePartialImportRename.admission.reasonCodes.includes('project-worker-cross-file-symbol-rename-blocked'), true);
assert.equal(stalePartialImportRename.conflicts.some((conflict) => (
  conflict.code === 'project-worker-cross-file-symbol-rename-blocked'
  && conflict.details.defaultAdmissionProof === undefined
)), true);

const duplicateRenamedExport = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_worker_cross_file_symbol_rename_duplicate_export_blocked',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: {
    'src/api.ts': 'export function newName() { return 1; }\nexport function newName() { return 2; }\n',
    'src/consumer.ts': crossFileRenameWorkerFiles['src/consumer.ts']
  },
  headFiles: crossFileRenameBaseFiles
});
assert.equal(duplicateRenamedExport.status, 'blocked');
assert.equal(duplicateRenamedExport.summary.projectCrossFileSymbolRenameAdmissions, 0);
assert.equal(duplicateRenamedExport.admission.reasonCodes.includes('duplicate-name'), true);
assert.equal(duplicateRenamedExport.conflicts.some((conflict) => conflict.code === 'duplicate-name'), true);

const headCrossFileRename = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_head_cross_file_symbol_rename_default_admitted',
  language: 'typescript',
  includeProjectGraphDelta: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript,
  baseFiles: crossFileRenameBaseFiles,
  workerFiles: crossFileRenameBaseFiles,
  headFiles: crossFileRenameWorkerFiles
});
assert.equal(headCrossFileRename.status, 'merged');
assert.equal(headCrossFileRename.outputFiles.find((file) => file.sourcePath === 'src/api.ts').sourceText, crossFileRenameWorkerFiles['src/api.ts']);
assert.equal(headCrossFileRename.outputFiles.find((file) => file.sourcePath === 'src/consumer.ts').sourceText, crossFileRenameWorkerFiles['src/consumer.ts']);
assert.equal(headCrossFileRename.summary.projectCrossFileSymbolRenameAdmissions, 1);
assert.equal(headCrossFileRename.evidence.some((record) => (
  record.kind === 'js-ts-project-symbol-rename-admission'
  && record.branch === 'head'
  && record.defaultAdmission === true
)), true);

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
const aliasPreservingConsumer = "import { oldName } from './api.js';\nexport const total = oldName();\n";

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
  requireOutputDiagnostics: true,
  typescript,
  baseFiles: {
    'src/api.ts': aliasPreservingBase,
    'src/consumer.ts': aliasPreservingConsumer
  },
  workerFiles: {
    'src/api.ts': aliasPreservingWorker,
    'src/consumer.ts': aliasPreservingConsumer
  },
  headFiles: {
    'src/api.ts': aliasPreservingHead,
    'src/consumer.ts': aliasPreservingConsumer
  }
});
assert.equal(projectLevelAliasRename.status, 'merged');
assert.equal(projectLevelAliasRename.files[0].outputSourceText, aliasPreservingExpected);
assert.equal(projectLevelAliasRename.files[1].outputSourceText, aliasPreservingConsumer);
assert.equal(projectLevelAliasRename.files[0].result.metadata.composed.topLevelRenameAdmission.deferredToProjectGraph, true);
assert.equal(projectLevelAliasRename.outputDiagnosticsGate.status, 'passed');
assert.equal(projectLevelAliasRename.outputDiagnosticsGate.diagnostics.length, 0);
assert.equal(projectLevelAliasRename.summary.projectGraphPublicContractConflicts, 0);
assert.equal(projectLevelAliasRename.projectGraphDelta.summary.publicContractConflicts, 0);
