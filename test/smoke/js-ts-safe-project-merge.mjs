import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const baseFiles = {
  'src/index.ts': [
    "import { readFile } from 'node:fs';",
    'export function stable() {',
    '  return readFile;',
    '}',
    ''
  ].join('\n'),
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '}',
    ''
  ].join('\n')
};

const workerFiles = {
  'src/index.ts': [
    "import { readFile, writeFile } from 'node:fs';",
    'export function stable() {',
    '  return readFile;',
    '}',
    'export function workerOnly() {',
    '  return writeFile;',
    '}',
    ''
  ].join('\n'),
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '  label?: string;',
    '}',
    ''
  ].join('\n'),
  'src/worker-added.ts': 'export const workerAdded = true;\n'
};

const headFiles = {
  'src/index.ts': [
    "import { readFile, stat } from 'node:fs';",
    'export function stable() {',
    '  return readFile;',
    '}',
    'export const headOnly = stat;',
    ''
  ].join('\n'),
  'src/options.ts': [
    'export interface Options {',
    '  enabled: boolean;',
    '  retries: number;',
    '}',
    ''
  ].join('\n'),
  'src/head-only.ts': 'export const headOnlyFile = true;\n'
};

const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_smoke',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles,
  workerFiles,
  headFiles,
  policyByPath: {
    'src/options.ts': { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
  }
});

assert.equal(project.kind, 'frontier.lang.jsTsProjectSafeMerge');
assert.equal(project.status, 'merged');
assert.equal(project.admission.status, 'auto-merge-candidate');
assert.equal(project.admission.autoMergeClaim, false);
assert.equal(project.admission.semanticEquivalenceClaim, false);
assert.equal(project.summary.files, 4);
assert.equal(project.summary.blockedFiles, 0);
assert.equal(project.summary.outputFiles, 4);
assert.equal(project.summary.semanticArtifactFiles, 2);
assert.equal(project.summary.operations['merged-source'], 1);
assert.equal(project.summary.operations['merged-source-and-members'], 1);
assert.equal(project.summary.operations['worker-added'], 1);
assert.equal(project.summary.operations['head-only'], 1);
assert.equal(project.outputProjectSymbolGraph.kind, 'frontier.lang.projectSymbolGraph');
assert.equal(project.outputProjectSymbolGraph.fileHashes.length, 4);
assert.equal(project.outputProjectImport.projectSymbolGraph, project.outputProjectSymbolGraph);

const outputByPath = new Map(project.outputFiles.map((file) => [file.sourcePath, file]));
assert.equal(outputByPath.get('src/index.ts').sourceText, [
  "import { readFile, stat, writeFile } from 'node:fs';",
  'export function stable() {',
  '  return readFile;',
  '}',
  'export const headOnly = stat;',
  'export function workerOnly() {',
  '  return writeFile;',
  '}',
  ''
].join('\n'));
assert.equal(outputByPath.get('src/options.ts').sourceText, [
  'export interface Options {',
  '  enabled: boolean;',
  '  retries: number;',
  '  label?: string;',
  '}',
  ''
].join('\n'));
assert.equal(outputByPath.get('src/worker-added.ts').operation, 'worker-added');
assert.equal(outputByPath.get('src/head-only.ts').operation, 'head-only');
assert.equal(project.files.find((file) => file.sourcePath === 'src/index.ts').semanticArtifacts.status, 'verified');
assert.equal(project.files.find((file) => file.sourcePath === 'src/options.ts').semanticArtifacts.status, 'verified');

const spanLedger = { spans: [{ id: 'source-span', span: { start: 0, end: 1 } }] };
const ledgerRequired = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_with_source_ledgers',
  language: 'typescript',
  requireSourceLedgerSpans: true,
  files: [{
    sourcePath: 'src/ledger.ts',
    baseSourceText: 'export const stable = 1;\n',
    workerSourceText: 'export const stable = 1;\nexport const workerOnly = 1;\n',
    headSourceText: 'export const stable = 1;\n'
  }],
  sourceLedgersByPath: { 'src/ledger.ts': { base: spanLedger, worker: spanLedger, head: spanLedger } }
});
assert.equal(ledgerRequired.status, 'merged');
assert.equal(ledgerRequired.files[0].semanticArtifacts.status, 'verified');

const conflict = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_conflicting_addition',
  language: 'typescript',
  workerFiles: { 'src/new.ts': 'export const value = 1;\n' },
  headFiles: { 'src/new.ts': 'export const value = 2;\n' }
});

assert.equal(conflict.status, 'blocked');
assert.equal(conflict.summary.blockedFiles, 1);
assert.equal(conflict.admission.reasonCodes.includes('file-add-conflict'), true);
assert.equal(conflict.conflicts[0].code, 'file-add-conflict');
