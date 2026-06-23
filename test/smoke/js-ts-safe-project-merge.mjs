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

const aliasProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_alias_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  moduleResolution: { baseUrl: '.', paths: { '@app/*': ['src/*'] } },
  baseFiles: {
    'src/index.ts': "import { thing } from '@app/thing';\nexport const used = thing;\n",
    'src/thing.ts': 'export const thing = 1;\n'
  },
  workerFiles: {
    'src/index.ts': "import { thing } from '@app/thing';\nexport const used = thing;\nexport const workerOnly = 1;\n",
    'src/thing.ts': 'export const thing = 1;\n'
  },
  headFiles: {
    'src/index.ts': "import { thing } from '@app/thing';\nexport const used = thing;\n",
    'src/thing.ts': 'export const thing = 1;\n'
  }
});
const aliasEdge = aliasProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@app/thing' && edge.importedName === 'thing');
assert.equal(aliasProject.status, 'merged');
assert.equal(aliasEdge.resolvedModulePath, 'src/thing.ts');
assert.equal(aliasEdge.resolutionKind, 'path-alias-source');
assert.equal(aliasEdge.packageName, undefined);
assert.equal(aliasEdge.resolvedTargetSymbolId, 'symbol:typescript:export:thing');

const packageGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_package_graph',
  language: 'typescript',
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
  baseFiles: {
    'src/index.ts': "import { util } from '@pkg/core/utils';\nexport const used = util;\n",
    'packages/core/src/utils.ts': 'export const util = 1;\n'
  },
  workerFiles: {
    'src/index.ts': "import { util } from '@pkg/core/utils';\nexport const used = util;\nexport const workerOnly = 1;\n",
    'packages/core/src/utils.ts': 'export const util = 1;\n'
  },
  headFiles: {
    'src/index.ts': "import { util } from '@pkg/core/utils';\nexport const used = util;\n",
    'packages/core/src/utils.ts': 'export const util = 1;\n'
  }
});
const packageGraphEdge = packageGraphProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '@pkg/core/utils' && edge.importedName === 'util');
assert.equal(packageGraphProject.status, 'merged');
assert.equal(packageGraphEdge.packageName, '@pkg/core');
assert.equal(packageGraphEdge.packageSubpath, './utils');
assert.equal(packageGraphEdge.packageExportCondition, 'import');
assert.equal(packageGraphEdge.resolvedModulePath, 'packages/core/src/utils.ts');
assert.equal(packageGraphEdge.resolvedTargetSymbolId, 'symbol:typescript:export:util');

const packageImportsGraphProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_package_imports_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  moduleResolution: {
    imports: { '#internal/*': { import: './src/internal/*.ts', default: './src/internal/*.js' } },
    packageExportConditions: ['import', 'default']
  },
  baseFiles: {
    'src/index.ts': "import { internal } from '#internal/thing';\nexport const used = internal;\n",
    'src/internal/thing.ts': 'export const internal = 1;\n'
  },
  workerFiles: {
    'src/index.ts': "import { internal } from '#internal/thing';\nexport const used = internal;\nexport const workerOnly = internal;\n",
    'src/internal/thing.ts': 'export const internal = 1;\n'
  },
  headFiles: {
    'src/index.ts': "import { internal } from '#internal/thing';\nexport const used = internal;\n",
    'src/internal/thing.ts': 'export const internal = 1;\n'
  }
});
const packageImportGraphEdge = packageImportsGraphProject.outputProjectSymbolGraph.importEdges.find((edge) => edge.moduleSpecifier === '#internal/thing' && edge.importedName === 'internal');
assert.equal(packageImportsGraphProject.status, 'merged');
assert.equal(packageImportGraphEdge.resolutionKind, 'package-import-source');
assert.equal(packageImportGraphEdge.packageImportKey, '#internal/*');
assert.equal(packageImportGraphEdge.packageImportCondition, 'import');
assert.equal(packageImportGraphEdge.packageImportTarget, './src/internal/thing.ts');
assert.equal(packageImportGraphEdge.resolvedModulePath, 'src/internal/thing.ts');
assert.equal(packageImportGraphEdge.resolvedTargetSymbolId, 'symbol:typescript:export:internal');

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
