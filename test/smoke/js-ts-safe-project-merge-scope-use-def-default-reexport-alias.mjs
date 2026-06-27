import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const defaultAliasProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_default_reexport_alias_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: defaultReExportAliasFiles(),
  workerFiles: defaultReExportAliasFiles(),
  headFiles: defaultReExportAliasFiles()
});
const defaultAliasGraph = defaultAliasProject.outputProjectSymbolGraph;
assert.equal(defaultAliasProject.status, 'merged');
const defaultImportAlias = defaultAliasGraph.scopeBindingRecords
  .find((record) => record.sourcePath === 'src/default-consumer.ts' && record.name === 'renderTodo');
assert.equal(defaultImportAlias?.importAlias, true);
assert.equal(defaultImportAlias.importKind, 'default');
assert.equal(defaultImportAlias.importedName, 'default');
assert.equal(defaultImportAlias.resolvedSourcePath, 'src/default-barrel.ts');
assert.equal(defaultImportAlias.originSourcePath, 'src/default-dep.ts');
assert.equal(defaultImportAlias.originExportedName, 'default');
assert.equal(defaultImportAlias.resolvedBindingName, 'formatTodo');
assert.equal(typeof defaultImportAlias.resolvedBindingUseHash, 'string');
assert.equal(typeof defaultImportAlias.resolvedUseHash, 'string');
const defaultImportAliasReference = defaultAliasGraph.scopeReferenceRecords
  .find((record) => record.bindingId === defaultImportAlias.id && record.publicOwnerName === 'viewTodo');
assert.equal(defaultImportAliasReference?.importAlias, true);
assert.equal(defaultImportAliasReference.originSourcePath, 'src/default-dep.ts');
assert.equal(typeof defaultImportAliasReference.resolvedUseHash, 'string');

const ambiguousDefaultAliasProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_default_reexport_alias_ambiguous',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  includeProjectGraphDelta: true,
  baseFiles: defaultReExportAliasFiles({ anonymousDefault: true }),
  workerFiles: defaultReExportAliasFiles({ anonymousDefault: true }),
  headFiles: defaultReExportAliasFiles({ anonymousDefault: true })
});
const anonymousDefaultImportAlias = ambiguousDefaultAliasProject.outputProjectSymbolGraph.scopeBindingRecords
  .find((record) => record.sourcePath === 'src/default-consumer.ts' && record.name === 'renderTodo');
const ambiguousDefaultAliasReference = ambiguousDefaultAliasProject.outputProjectSymbolGraph.scopeReferenceRecords
  .find((record) => record.sourcePath === 'src/default-consumer.ts' && record.name === 'renderTodo');
assert.equal(ambiguousDefaultAliasProject.status, 'merged');
assert.equal(ambiguousDefaultAliasProject.admission.reasonCodes.includes('project-public-scope-use-def-ambiguous-evidence'), false);
assert.equal(anonymousDefaultImportAlias?.aliasResolutionEvidenceKind, 'source-bound-default-export');
assert.equal(anonymousDefaultImportAlias.originSourcePath, 'src/default-dep.ts');
assert.equal(anonymousDefaultImportAlias.originExportedName, 'default');
assert.equal(anonymousDefaultImportAlias.originSourceSymbolKind, 'function');
assert.equal(typeof anonymousDefaultImportAlias.originSourceHash, 'string');
assert.equal(typeof anonymousDefaultImportAlias.resolvedExportUseHash, 'string');
assert.equal(typeof anonymousDefaultImportAlias.resolvedUseHash, 'string');
assert.equal(ambiguousDefaultAliasReference?.aliasResolutionEvidenceKind, 'source-bound-default-export');
assert.equal(ambiguousDefaultAliasReference.originSourcePath, 'src/default-dep.ts');
assert.equal(ambiguousDefaultAliasReference.originSourceSymbolKind, 'function');
assert.equal(ambiguousDefaultAliasReference.aliasResolutionStatus, undefined);
assert.equal(typeof ambiguousDefaultAliasReference.resolvedExportUseHash, 'string');
assert.equal(typeof ambiguousDefaultAliasReference.resolvedUseHash, 'string');

function defaultReExportAliasFiles(options = {}) {
  return {
    'src/default-dep.ts': options.anonymousDefault
      ? 'export default function (todo) { return todo.title; }\n'
      : 'export default function formatTodo(todo) { return todo.title; }\n',
    'src/default-barrel.ts': "export { default } from './default-dep.js';\n",
    'src/default-consumer.ts': [
      "import renderTodo from './default-barrel.js';",
      'export function viewTodo(todo) {',
      '  return renderTodo(todo);',
      '}',
      ''
    ].join('\n')
  };
}
