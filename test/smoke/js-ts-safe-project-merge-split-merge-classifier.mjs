import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const splitModuleBase = [
  'export function readUser() {',
  '  return 1;',
  '}',
  'export function writeUser() {',
  '  return 2;',
  '}',
  ''
].join('\n');

const classSplitBase = [
  'export class Account {',
  '  read() {',
  '    return 1;',
  '  }',
  '  write() {',
  '    return 2;',
  '  }',
  '}',
  ''
].join('\n');

const classSplitWorker = [
  'export class AccountReader {',
  '  read() {',
  '    return 1;',
  '  }',
  '}',
  'export class AccountWriter {',
  '  write() {',
  '    return 2;',
  '  }',
  '}',
  ''
].join('\n');

const duplicateMemberClassSplitWorker = [
  'export class AccountReader {',
  '  read() {',
  '    return 1;',
  '  }',
  '  write() {',
  '    return 2;',
  '  }',
  '}',
  'export class AccountWriter {',
  '  write() {',
  '    return 2;',
  '  }',
  '}',
  ''
].join('\n');

const classMergeBase = classSplitWorker;
const classMergeWorker = [
  'export class Account {',
  '  read() {',
  '    return 1;',
  '  }',
  '  write() {',
  '    return 2;',
  '  }',
  '}',
  ''
].join('\n');

const fullEvidence = {
  language: 'typescript',
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  includeOutputProjectSymbolGraph: true,
  allowProjectSplitMerges: true,
  typescript
};

function project(input) {
  return safeMergeJsTsProject({ language: 'typescript', ...input });
}

function splitFiles(prefix = 'src') {
  return [
    {
      sourcePath: `${prefix}/user.ts`,
      baseSourceText: splitModuleBase,
      workerDeleted: true,
      headSourceText: splitModuleBase
    },
    {
      sourcePath: `${prefix}/user-read.ts`,
      workerSourceText: 'export function readUser() {\n  return 1;\n}\n'
    },
    {
      sourcePath: `${prefix}/user-write.ts`,
      workerSourceText: 'export function writeUser() {\n  return 2;\n}\n'
    }
  ];
}

function duplicateModuleSplitFiles() {
  return [
    {
      sourcePath: 'src/user.ts',
      baseSourceText: splitModuleBase,
      workerDeleted: true,
      headSourceText: splitModuleBase
    },
    {
      sourcePath: 'src/user-read.ts',
      workerSourceText: splitModuleBase
    },
    {
      sourcePath: 'src/user-write.ts',
      workerSourceText: 'export function writeUser() {\n  return 2;\n}\n'
    }
  ];
}

function mergeFiles() {
  return [
    {
      sourcePath: 'src/user-read.ts',
      baseSourceText: 'export function readUser() {\n  return 1;\n}\n',
      workerDeleted: true,
      headSourceText: 'export function readUser() {\n  return 1;\n}\n'
    },
    {
      sourcePath: 'src/user-write.ts',
      baseSourceText: 'export function writeUser() {\n  return 2;\n}\n',
      workerDeleted: true,
      headSourceText: 'export function writeUser() {\n  return 2;\n}\n'
    },
    { sourcePath: 'src/user.ts', workerSourceText: splitModuleBase }
  ];
}

function singleClassFile(base, worker, head = base) {
  return [{ sourcePath: 'src/account.ts', baseSourceText: base, workerSourceText: worker, headSourceText: head }];
}

function requireConflict(result, code, requiredEvidence = []) {
  assert.equal(result.status, 'blocked');
  assert.equal(result.admission.reasonCodes.includes(code), true);
  const conflict = result.conflicts.find((entry) => entry.code === code);
  assert.equal(Boolean(conflict), true);
  for (const evidence of requiredEvidence) {
    assert.equal(conflict.details.missingRequiredEvidence.includes(evidence), true);
  }
  return conflict;
}

const moduleSplitProject = project({
  id: 'js_ts_project_safe_merge_worker_module_split_blocked',
  files: splitFiles()
});
assert.equal(moduleSplitProject.summary.projectModuleSplitClassifications, 1);
assert.equal(moduleSplitProject.summary.operations['blocked-worker-module-split'], 3);
requireConflict(moduleSplitProject, 'project-worker-module-split-blocked', [
  'module-lineage-evidence',
  'public-api-contract-evidence',
  'output-diagnostics-gate'
]);

const moduleSplitAdmitted = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_module_split_admitted',
  files: splitFiles()
});
assert.equal(moduleSplitAdmitted.status, 'merged');
assert.equal(moduleSplitAdmitted.outputFiles.some((file) => file.sourcePath === 'src/user.ts'), false);
assert.equal(moduleSplitAdmitted.summary.projectModuleSplitAdmissions, 1);
assert.equal(moduleSplitAdmitted.summary.projectSplitMergeAdmissions, 1);
assert.equal(moduleSplitAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(moduleSplitAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(Boolean(moduleSplitAdmitted.outputProjectSymbolGraph), true);
assert.equal(moduleSplitAdmitted.evidence.some((record) => record.kind === 'js-ts-project-split-merge-admission'), true);

const moduleMergeProject = project({
  id: 'js_ts_project_safe_merge_worker_module_merge_blocked',
  files: mergeFiles()
});
assert.equal(moduleMergeProject.summary.projectModuleMergeClassifications, 1);
assert.equal(moduleMergeProject.summary.operations['blocked-worker-module-merge'], 3);
requireConflict(moduleMergeProject, 'project-worker-module-merge-blocked', [
  'import-export-rewrite-evidence',
  'output-diagnostics-gate',
  'output-declaration-gate'
]);

const moduleMergeAdmitted = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_module_merge_admitted',
  files: mergeFiles()
});
assert.equal(moduleMergeAdmitted.status, 'merged');
assert.equal(moduleMergeAdmitted.outputFiles.length, 1);
assert.equal(moduleMergeAdmitted.outputFiles[0].sourcePath, 'src/user.ts');
assert.equal(moduleMergeAdmitted.summary.projectModuleMergeAdmissions, 1);
assert.equal(moduleMergeAdmitted.summary.projectSplitMergeAdmissions, 1);
assert.equal(moduleMergeAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(moduleMergeAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(Boolean(moduleMergeAdmitted.outputProjectSymbolGraph), true);

const classSplitProject = project({
  id: 'js_ts_project_safe_merge_worker_class_split_blocked',
  files: singleClassFile(classSplitBase, classSplitWorker)
});
assert.equal(classSplitProject.summary.projectClassSplitClassifications, 1);
assert.equal(classSplitProject.summary.operations['blocked-worker-class-split'], 1);
requireConflict(classSplitProject, 'project-worker-class-split-blocked', [
  'class-lineage-evidence',
  'member-lineage-evidence',
  'public-api-contract-evidence'
]);

const classSplitAdmitted = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_class_split_admitted',
  files: singleClassFile(classSplitBase, classSplitWorker)
});
assert.equal(classSplitAdmitted.status, 'merged');
assert.equal(classSplitAdmitted.outputFiles[0].sourceText, classSplitWorker);
assert.equal(classSplitAdmitted.summary.projectClassSplitAdmissions, 1);
assert.equal(classSplitAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(classSplitAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(Boolean(classSplitAdmitted.outputProjectSymbolGraph), true);

const classMergeProject = project({
  id: 'js_ts_project_safe_merge_worker_class_merge_blocked',
  files: singleClassFile(classMergeBase, classMergeWorker)
});
assert.equal(classMergeProject.summary.projectClassMergeClassifications, 1);
assert.equal(classMergeProject.summary.operations['blocked-worker-class-merge'], 1);
requireConflict(classMergeProject, 'project-worker-class-merge-blocked', [
  'class-lineage-evidence',
  'member-lineage-evidence',
  'public-api-contract-evidence',
  'output-diagnostics-gate',
  'output-declaration-gate'
]);

const classMergeAdmitted = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_class_merge_admitted',
  files: singleClassFile(classMergeBase, classMergeWorker)
});
assert.equal(classMergeAdmitted.status, 'merged');
assert.equal(classMergeAdmitted.outputFiles[0].sourceText, classMergeWorker);
assert.equal(classMergeAdmitted.summary.projectClassMergeAdmissions, 1);
assert.equal(classMergeAdmitted.summary.projectSplitMergeAdmissions, 1);
assert.equal(classMergeAdmitted.outputDiagnosticsGate.status, 'passed');
assert.equal(classMergeAdmitted.outputDeclarationGate.status, 'passed');
assert.equal(Boolean(classMergeAdmitted.outputProjectSymbolGraph), true);

const missingEvidenceClassMerge = project({
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  allowProjectSplitMerges: true,
  typescript,
  id: 'js_ts_project_safe_merge_worker_class_merge_missing_project_graph_blocked',
  files: singleClassFile(classMergeBase, classMergeWorker)
});
assert.equal(missingEvidenceClassMerge.summary.projectClassMergeAdmissions, 0);
requireConflict(missingEvidenceClassMerge, 'project-worker-class-merge-blocked', ['output-project-symbol-graph']);

const bothSidesChangedClassSplit = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_class_split_head_changed_blocked',
  files: singleClassFile(classSplitBase, classSplitWorker, classSplitBase.replace('return 1;', 'return 10;'))
});
assert.equal(bothSidesChangedClassSplit.summary.projectClassSplitAdmissions, 0);
const staleClassSplitConflict = requireConflict(bothSidesChangedClassSplit, 'project-worker-class-split-blocked', ['other-branch-unchanged-proof']);
assert.equal(staleClassSplitConflict.details.staleStructuralEditProof, true);
assert.equal(staleClassSplitConflict.details.otherBranch, 'head');

const duplicateModuleSplit = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_duplicate_module_split_blocked',
  files: duplicateModuleSplitFiles()
});
assert.equal(duplicateModuleSplit.status, 'blocked');
assert.equal(duplicateModuleSplit.summary.projectModuleSplitAdmissions, 0);
assert.equal(duplicateModuleSplit.summary.operations['blocked-worker-module-split'], 3);
const duplicateModuleConflict = requireConflict(duplicateModuleSplit, 'project-worker-module-split-blocked', ['exact-structural-partition-proof']);
assert.equal(duplicateModuleConflict.details.exactStructuralPartition, false);
assert.equal(duplicateModuleConflict.details.structuralPartitionBlockers.includes('duplicate-moved-structural-key'), true);
assert.equal(duplicateModuleConflict.details.duplicateMovedDeclarationKeys.includes('function:writeUser'), true);
assert.equal(duplicateModuleSplit.admission.autoApplyCandidate, false);

const duplicateClassSplit = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_duplicate_class_split_blocked',
  files: singleClassFile(classSplitBase, duplicateMemberClassSplitWorker)
});
assert.equal(duplicateClassSplit.status, 'blocked');
assert.equal(duplicateClassSplit.summary.projectClassSplitAdmissions, 0);
const duplicateClassConflict = requireConflict(duplicateClassSplit, 'project-worker-class-split-blocked', ['exact-structural-partition-proof']);
assert.equal(duplicateClassConflict.details.exactStructuralPartition, false);
assert.equal(duplicateClassConflict.details.structuralPartitionBlockers.includes('duplicate-moved-structural-key'), true);
assert.equal(duplicateClassConflict.details.duplicateMovedMemberKeys.includes('method:write'), true);

const generatedModuleSplit = project({
  ...fullEvidence,
  id: 'js_ts_project_safe_merge_worker_generated_module_split_blocked',
  files: splitFiles('dist')
});
assert.equal(generatedModuleSplit.summary.projectModuleSplitAdmissions, 0);
const generatedConflict = requireConflict(generatedModuleSplit, 'project-worker-module-split-blocked');
assert.equal(generatedConflict.details.generatedOutputBoundary, true);
assert.equal(generatedConflict.details.generatedSourcePaths.includes('dist/user.ts'), true);
