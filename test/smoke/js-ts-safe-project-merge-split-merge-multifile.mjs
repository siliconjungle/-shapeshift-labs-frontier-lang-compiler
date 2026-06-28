import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const tsModule = await import('typescript');
const typescript = tsModule.default ?? tsModule;

const accountBase = [
  'export class Account {',
  '  read() { return 1; }',
  '  write() { return 2; }',
  '}',
  ''
].join('\n');
const accountReader = [
  'export class AccountReader {',
  '  read() { return 1; }',
  '}',
  ''
].join('\n');
const accountWriter = [
  'export class AccountWriter {',
  '  write() { return 2; }',
  '}',
  ''
].join('\n');

const splitMergeEvidence = {
  language: 'typescript',
  allowProjectSplitMerges: true,
  includeOutputProjectSymbolGraph: true,
  requireOutputDiagnostics: true,
  requireDeclarationOutput: true,
  typescript
};

const multiFileClassSplit = project({
  ...splitMergeEvidence,
  id: 'js_ts_project_safe_merge_worker_multifile_class_split_admitted',
  files: [
    { sourcePath: 'src/account.ts', baseSourceText: accountBase, workerDeleted: true, headSourceText: accountBase },
    { sourcePath: 'src/account-reader.ts', workerSourceText: accountReader },
    { sourcePath: 'src/account-writer.ts', workerSourceText: accountWriter }
  ]
});
assert.equal(multiFileClassSplit.status, 'merged');
assert.equal(multiFileClassSplit.summary.projectClassSplitClassifications, 1);
assert.equal(multiFileClassSplit.summary.projectClassSplitAdmissions, 1);
assert.equal(multiFileClassSplit.summary.projectSplitMergeAdmissions, 1);
assert.equal(multiFileClassSplit.outputFiles.some((file) => file.sourcePath === 'src/account.ts'), false);
assert.equal(multiFileClassSplit.outputFiles.some((file) => file.sourcePath === 'src/account-reader.ts'), true);
assert.equal(multiFileClassSplit.outputFiles.some((file) => file.sourcePath === 'src/account-writer.ts'), true);
assert.equal(multiFileClassSplit.outputDiagnosticsGate.status, 'passed');
assert.equal(multiFileClassSplit.outputDeclarationGate.status, 'passed');
assert.equal(multiFileClassSplit.evidence.some((record) => (
  record.kind === 'js-ts-project-split-merge-admission'
  && record.structuralEditKind === 'class-split'
  && record.details.exactStructuralPartition === true
  && record.details.presentRequiredEvidence.includes('member-lineage-evidence')
)), true);

const multiFileClassMerge = project({
  ...splitMergeEvidence,
  id: 'js_ts_project_safe_merge_worker_multifile_class_merge_admitted',
  files: [
    { sourcePath: 'src/account-reader.ts', baseSourceText: accountReader, workerDeleted: true, headSourceText: accountReader },
    { sourcePath: 'src/account-writer.ts', baseSourceText: accountWriter, workerDeleted: true, headSourceText: accountWriter },
    { sourcePath: 'src/account.ts', workerSourceText: accountBase }
  ]
});
assert.equal(multiFileClassMerge.status, 'merged');
assert.equal(multiFileClassMerge.summary.projectClassMergeClassifications, 1);
assert.equal(multiFileClassMerge.summary.projectClassMergeAdmissions, 1);
assert.equal(multiFileClassMerge.summary.projectSplitMergeAdmissions, 1);
assert.equal(multiFileClassMerge.outputFiles.length, 1);
assert.equal(multiFileClassMerge.outputFiles[0].sourcePath, 'src/account.ts');
assert.equal(multiFileClassMerge.outputDiagnosticsGate.status, 'passed');
assert.equal(multiFileClassMerge.outputDeclarationGate.status, 'passed');
assert.equal(multiFileClassMerge.evidence.some((record) => (
  record.kind === 'js-ts-project-split-merge-admission'
  && record.structuralEditKind === 'class-merge'
  && record.details.exactStructuralPartition === true
  && record.details.presentRequiredEvidence.includes('class-lineage-evidence')
)), true);

const moduleExtraTarget = [
  'export function readUser() {',
  '  return 1;',
  '}',
  'export function auditUser() {',
  '  return 3;',
  '}',
  ''
].join('\n');
const nonExactModuleSplit = project({
  ...splitMergeEvidence,
  id: 'js_ts_project_safe_merge_worker_extra_module_split_blocked',
  files: [
    {
      sourcePath: 'src/user.ts',
      baseSourceText: [
        'export function readUser() {',
        '  return 1;',
        '}',
        'export function writeUser() {',
        '  return 2;',
        '}',
        ''
      ].join('\n'),
      workerDeleted: true,
      headSourceText: [
        'export function readUser() {',
        '  return 1;',
        '}',
        'export function writeUser() {',
        '  return 2;',
        '}',
        ''
      ].join('\n')
    },
    { sourcePath: 'src/user-read.ts', workerSourceText: moduleExtraTarget },
    { sourcePath: 'src/user-write.ts', workerSourceText: 'export function writeUser() {\n  return 2;\n}\n' }
  ]
});
assert.equal(nonExactModuleSplit.status, 'blocked');
assert.equal(nonExactModuleSplit.summary.projectModuleSplitAdmissions, 0);
const conflict = nonExactModuleSplit.conflicts.find((entry) => entry.code === 'project-worker-module-split-blocked');
assert.notEqual(conflict, undefined);
assert.equal(conflict.details.exactStructuralPartition, false);
assert.equal(conflict.details.structuralPartitionBlockers.includes('extra-target-structural-key'), true);
assert.equal(conflict.details.extraTargetDeclarationKeys.includes('function:auditUser'), true);
assert.equal(conflict.details.missingRequiredEvidence.includes('exact-structural-partition-proof'), true);

function project(input) {
  return safeMergeJsTsProject({ language: 'typescript', ...input });
}
