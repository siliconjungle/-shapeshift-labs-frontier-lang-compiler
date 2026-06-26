import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from '../../src/index.js';
import { addProjectGraphDeltaConflictSummary } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';
import './js-ts-safe-project-merge-scope-use-def-default-reexport-alias.mjs';

const sourceText = [
  'export function loadTodo(api, state) {',
  '  const ready = state.ready;',
  '  if (ready) return api.fetch(state.id);',
  '  return api.create(state);',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_output_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/scope.ts': sourceText },
  workerFiles: { 'src/scope.ts': sourceText },
  headFiles: { 'src/scope.ts': sourceText }
});

const graph = project.outputProjectSymbolGraph;
assert.equal(project.status, 'merged');
assert.equal(graph.scopeBindingRecords.length > 0, true);
assert.equal(graph.scopeReferenceRecords.length > 0, true);
assert.equal(project.outputProjectImport.projectSymbolGraph.scopeBindingRecords.length, graph.scopeBindingRecords.length);
assert.equal(graph.remainingFields.includes('scopeBindingRecords'), false);
assert.equal(graph.remainingFields.includes('scopeReferenceRecords'), false);

const publicParam = graph.scopeBindingRecords.find((record) => record.name === 'state' && record.publicOwnerName === 'loadTodo');
assert.equal(Boolean(publicParam?.publicContract), true);
assert.equal((publicParam?.referenceCount ?? 0) >= 2, true);
assert.equal(typeof publicParam?.useHash, 'string');
assert.equal(graph.scopeReferenceRecords.some((record) => record.bindingId === publicParam?.id && record.publicOwnerName === 'loadTodo'), true);

const destructuringAliasSource = destructuringAliasReadSource('local');
const destructuringAliasProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_destructuring_alias_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/destructuring-alias.ts': destructuringAliasSource },
  workerFiles: { 'src/destructuring-alias.ts': destructuringAliasSource },
  headFiles: { 'src/destructuring-alias.ts': destructuringAliasSource }
});
const destructuringAliasGraph = destructuringAliasProject.outputProjectSymbolGraph;
assert.equal(destructuringAliasProject.status, 'merged');
const destructuredAliasBinding = destructuringAliasGraph.scopeBindingRecords.find((record) => record.sourcePath === 'src/destructuring-alias.ts' && record.name === 'local' && record.bindingKind === 'const' && record.publicOwnerName === 'readAlias');
assert.equal(Boolean(destructuredAliasBinding?.publicContract), true);
assert.equal(destructuringAliasGraph.scopeReferenceRecords.some((record) => record.name === 'local' && record.bindingId === destructuredAliasBinding.id && record.publicOwnerName === 'readAlias'), true);
const destructuringAliasOwner = destructuringAliasGraph.scopeBindingRecords.find((record) => record.sourcePath === 'src/destructuring-alias.ts' && record.name === 'readAlias' && record.bindingKind === 'function');
assert.equal(typeof destructuringAliasOwner?.publicOwnerUseHash, 'string');

const aliasProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_import_alias_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: aliasFiles(),
  workerFiles: aliasFiles(),
  headFiles: aliasFiles()
});
const aliasGraph = aliasProject.outputProjectSymbolGraph;
assert.equal(aliasProject.status, 'merged');
const importAlias = aliasGraph.scopeBindingRecords.find((record) => record.sourcePath === 'src/consumer.ts' && record.name === 'localFormat');
assert.equal(importAlias?.importAlias, true);
assert.equal(importAlias.moduleSpecifier, './barrel.js');
assert.equal(importAlias.importedName, 'publicFormat');
assert.equal(importAlias.resolvedSourcePath, 'src/barrel.ts');
assert.equal(importAlias.originSourcePath, 'src/dep.ts');
assert.equal(importAlias.resolvedBindingName, 'formatTodo');
assert.equal(typeof importAlias.resolvedBindingUseHash, 'string');
assert.equal(typeof importAlias.resolvedUseHash, 'string');

const importAliasReference = aliasGraph.scopeReferenceRecords.find((record) => record.bindingId === importAlias.id && record.publicOwnerName === 'viewTodo');
assert.equal(importAliasReference?.importAlias, true);
assert.equal(importAliasReference.originSourcePath, 'src/dep.ts');
assert.equal(typeof importAliasReference.resolvedUseHash, 'string');

const namespaceProject = safeMergeJsTsProject({ id: 'js_ts_project_safe_merge_scope_use_def_namespace_member', language: 'typescript', includeOutputProjectSymbolGraph: true, baseFiles: namespaceFiles('formatTodo'), workerFiles: namespaceFiles('formatTodo'), headFiles: namespaceFiles('formatTodo') });
const namespaceGraph = namespaceProject.outputProjectSymbolGraph;
const namespaceReference = namespaceGraph.scopeReferenceRecords.find((record) => record.name === 'api' && record.referenceKind === 'namespace-property-read');
assert.equal(namespaceReference?.memberName, 'formatTodo');
const namespaceConflict = projectScopeUseDefDeltaConflicts(scopeDelta({ base: namespaceOwner(namespaceGraph), worker: namespaceOwner(safeMergeJsTsProject({ id: 'js_ts_project_safe_merge_scope_use_def_namespace_worker', language: 'typescript', includeOutputProjectSymbolGraph: true, baseFiles: namespaceFiles('formatWorker'), workerFiles: namespaceFiles('formatWorker'), headFiles: namespaceFiles('formatWorker') }).outputProjectSymbolGraph), head: namespaceOwner(safeMergeJsTsProject({ id: 'js_ts_project_safe_merge_scope_use_def_namespace_head', language: 'typescript', includeOutputProjectSymbolGraph: true, baseFiles: namespaceFiles('formatHead'), workerFiles: namespaceFiles('formatHead'), headFiles: namespaceFiles('formatHead') }).outputProjectSymbolGraph) })).find((conflict) => conflict.details?.identityKey?.includes('#viewTodo#function#value#'));
assert.equal(namespaceConflict?.details.reasonCode, 'project-public-scope-use-def-delta-conflict');

const originBinding = aliasGraph.scopeBindingRecords.find((record) => record.sourcePath === 'src/dep.ts' && record.name === 'formatTodo');
assert.equal(originBinding?.exportedNames.includes('renamedFormat'), true);
assert.equal(originBinding.reExportedNames.includes('publicFormat'), true);
const publicOwner = aliasGraph.scopeBindingRecords.find((record) => record.sourcePath === 'src/consumer.ts' && record.name === 'viewTodo');
assert.equal(typeof publicOwner?.publicOwnerUseHash, 'string');

const structuralScopeSource = [
  'export function read(Token: number) {',
  '  type Token = { label: string };',
  '  const typed: Token = { label: String(Token) };',
  '  return typed.label;',
  '}',
  ''
].join('\n');
const structuralScopeImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/structural-scope.ts',
  sourceText: structuralScopeSource,
  metadata: { scopeUseDefEvidence: structuralScopeManagerEvidence(structuralScopeSource) }
});
const structuralScopeProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_structural_estree_evidence',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [structuralScopeImport],
  baseFiles: { 'src/structural-scope.ts': structuralScopeSource },
  workerFiles: { 'src/structural-scope.ts': structuralScopeSource },
  headFiles: { 'src/structural-scope.ts': structuralScopeSource }
});
const structuralScopeGraph = structuralScopeProject.outputProjectSymbolGraph;
assert.equal(structuralScopeProject.status, 'merged');
assert.equal(structuralScopeProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
const typeTokenBinding = structuralScopeGraph.scopeBindingRecords.find((record) => (
  record.name === 'Token'
  && record.namespaces?.includes('type')
  && record.scopeType === 'function'
));
const valueTokenBinding = structuralScopeGraph.scopeBindingRecords.find((record) => (
  record.name === 'Token'
  && record.bindingKind === 'param'
  && record.scopeType === 'function'
));
assert.equal(typeTokenBinding?.scopeEvidenceKind, 'estree-scope-manager');
assert.equal(typeTokenBinding.definitionType, 'Type');
assert.equal(valueTokenBinding?.definitionType, 'Parameter');
const typeTokenReference = structuralScopeGraph.scopeReferenceRecords.find((record) => (
  record.name === 'Token'
  && record.namespace === 'type'
  && record.scopeEvidenceKind === 'estree-scope-manager'
));
const valueTokenReference = structuralScopeGraph.scopeReferenceRecords.find((record) => (
  record.name === 'Token'
  && record.namespace === 'value'
  && record.scopeEvidenceKind === 'estree-scope-manager'
));
assert.equal(typeTokenReference?.bindingId, typeTokenBinding.id);
assert.equal(valueTokenReference?.bindingId, valueTokenBinding.id);
assert.equal(typeTokenReference.bindingId !== valueTokenReference.bindingId, true);
assert.equal(structuralScopeGraph.scopeReferenceRecords.some((record) => record.reasonCodes?.includes('scope-manager-unresolved-reference')), false);

const delta = scopeDelta({
  base: scopeBinding('base', 'scope:base', 2),
  worker: scopeBinding('worker', 'scope:worker', 3),
  head: scopeBinding('head', 'scope:head', 1),
  output: scopeBinding('output', 'scope:output', 4)
});
const conflicts = projectScopeUseDefDeltaConflicts(delta);
const summarized = addProjectGraphDeltaConflictSummary(delta, conflicts);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].code, 'project-public-scope-use-def-delta-conflict');
assert.equal(conflicts[0].details.identityKey, 'scope-binding#src/scope.ts#loadTodo#state#param#value#2');
assert.equal(conflicts[0].details.worker.useHash, 'scope:worker');
assert.equal(summarized.summary.scopeUseDefConflicts, 1);

const unchangedHeadDelta = scopeDelta({
  base: scopeBinding('base', 'scope:base', 2),
  worker: scopeBinding('worker', 'scope:worker', 3),
  head: scopeBinding('head', 'scope:base', 2)
});
assert.equal(projectScopeUseDefDeltaConflicts(unchangedHeadDelta).length, 0);

const resolvedUseDelta = scopeDelta({
  base: scopeBinding('base', 'scope:same', 2, { resolvedUseHash: 'resolved:base', publicOwnerUseHash: 'owner:base' }),
  worker: scopeBinding('worker', 'scope:same', 2, { resolvedUseHash: 'resolved:worker', publicOwnerUseHash: 'owner:worker' }),
  head: scopeBinding('head', 'scope:same', 2, { resolvedUseHash: 'resolved:head', publicOwnerUseHash: 'owner:head' })
});
const resolvedUseConflicts = projectScopeUseDefDeltaConflicts(resolvedUseDelta);
assert.equal(resolvedUseConflicts.length, 1);
assert.equal(resolvedUseConflicts[0].details.worker.resolvedUseHash, 'resolved:worker');
assert.equal(resolvedUseConflicts[0].details.head.publicOwnerUseHash, 'owner:head');

const destructuringAliasConflicts = projectScopeUseDefDeltaConflicts(scopeDelta({
  base: destructuringAliasOwner,
  worker: destructuringAliasOwnerRecord('workerLocal'),
  head: destructuringAliasOwnerRecord('headLocal')
}));
const destructuringAliasConflict = destructuringAliasConflicts.find((conflict) => conflict.details?.identityKey?.includes('#readAlias#function#value#'));
assert.equal(destructuringAliasConflict?.details.reasonCode, 'project-public-scope-use-def-delta-conflict');
assert.notEqual(destructuringAliasConflict.details.worker.publicOwnerUseHash, destructuringAliasConflict.details.head.publicOwnerUseHash);

function aliasFiles() {
  return {
    'src/dep.ts': [
      'export function formatTodo(todo) {',
      '  return todo.title;',
      '}',
      'export { formatTodo as renamedFormat };',
      ''
    ].join('\n'),
    'src/barrel.ts': "export { renamedFormat as publicFormat } from './dep.js';\n",
    'src/consumer.ts': [
      "import { publicFormat as localFormat } from './barrel.js';",
      'export function viewTodo(todo) {',
      '  return localFormat(todo);',
      '}',
      ''
    ].join('\n')
  };
}

function namespaceFiles(memberName) {
  return { 'src/dep.ts': 'export function formatTodo(todo) { return todo.title; }\nexport function formatWorker(todo) { return todo.id; }\nexport function formatHead(todo) { return todo.status; }\n', 'src/ns-consumer.ts': `import * as api from './dep.js';\nexport function viewTodo(todo) {\n  return api.${memberName}(todo);\n}\n` };
}

function namespaceOwner(graph) {
  return graph.scopeBindingRecords.find((record) => record.name === 'viewTodo' && record.bindingKind === 'function');
}

function destructuringAliasReadSource(localName) {
  return ['export function readAlias(source) {', `  const { remote: ${localName} } = source;`, `  return ${localName};`, '}', ''].join('\n');
}

function destructuringAliasOwnerRecord(localName) {
  const sourceText = destructuringAliasReadSource(localName);
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_scope_use_def_destructuring_alias_delta_${localName}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/destructuring-alias.ts': sourceText },
    workerFiles: { 'src/destructuring-alias.ts': sourceText },
    headFiles: { 'src/destructuring-alias.ts': sourceText }
  });
  assert.equal(project.status, 'merged');
  return project.outputProjectSymbolGraph.scopeBindingRecords.find((record) => record.name === 'readAlias' && record.bindingKind === 'function');
}

function scopeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { scopeBindingRecords: record ? [record] : [] },
      summary: { scopeBindingRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function scopeBinding(stage, useHash, referenceCount, fields = {}) {
  return {
    id: `scope_${stage}`,
    sourcePath: 'src/scope.ts',
    name: 'state',
    bindingKind: 'param',
    namespaces: ['value'],
    ordinal: 2,
    publicContract: true,
    publicOwnerName: 'loadTodo',
    referenceCount,
    closureReferenceCount: 0,
    signatureHash: 'binding:state',
    useHash,
    sourceHash: `source:${stage}`,
    ...fields
  };
}

function structuralScopeManagerEvidence(sourceText) {
  const read = scopeVariable('read', 'FunctionName', nthRange(sourceText, 'read', 0), { isValueVariable: true });
  const paramToken = scopeVariable('Token', 'Parameter', nthRange(sourceText, 'Token', 0), { isValueVariable: true });
  const localTypeToken = scopeVariable('Token', 'Type', nthRange(sourceText, 'Token', 1), { isTypeVariable: true });
  const typed = scopeVariable('typed', 'Variable', nthRange(sourceText, 'typed', 0), { isValueVariable: true });
  return {
    format: 'typescript-estree-scope-manager',
    kind: 'estree-scope-manager',
    evidenceId: 'evidence_ts_estree_scope_manager_shadow_type_value',
    scopes: [
      { type: 'module', depth: 0, variables: [read], references: [] },
      {
        type: 'function',
        depth: 1,
        variables: [paramToken, localTypeToken, typed],
        references: [
          scopeReference('Token', nthRange(sourceText, 'Token', 2), localTypeToken, { isTypeReference: true }),
          scopeReference('Token', nthRange(sourceText, 'Token', 3), paramToken, { isValueReference: true }),
          scopeReference('typed', nthRange(sourceText, 'typed', 1), typed, { isValueReference: true })
        ]
      }
    ]
  };
}

function scopeVariable(name, type, range, fields = {}) {
  const identifier = { name, range };
  return {
    name,
    defs: [{ type, name: identifier }],
    identifiers: [identifier],
    ...fields
  };
}

function scopeReference(name, range, resolved, fields = {}) {
  return {
    identifier: { name, range },
    resolved,
    ...fields
  };
}

function nthRange(sourceText, needle, occurrence) {
  let start = -1;
  let searchFrom = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    start = sourceText.indexOf(needle, searchFrom);
    searchFrom = start + needle.length;
  }
  return [start, start + needle.length];
}
