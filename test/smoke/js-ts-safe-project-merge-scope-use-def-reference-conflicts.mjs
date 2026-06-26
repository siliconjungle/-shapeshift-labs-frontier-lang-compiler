import { assert } from './helpers.mjs';
import { addProjectGraphDeltaConflictSummary } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { createProjectScopeUseDefRecords } from '../../src/internal/index-impl/projectSymbolGraphScopeUseDefRecords.js';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';

const referenceDelta = scopeDelta({
  base: referenceRecord('base', 'formatBase', 'ref:base'),
  worker: referenceRecord('worker', 'formatWorker', 'ref:worker'),
  head: referenceRecord('head', 'formatHead', 'ref:head'),
  output: referenceRecord('output', 'formatWorker', 'ref:worker')
});
const referenceConflicts = projectScopeUseDefDeltaConflicts(referenceDelta);
const referenceConflict = referenceConflicts.find((conflict) => conflict.code === 'project-public-scope-reference-delta-conflict');
const summarizedReferenceDelta = addProjectGraphDeltaConflictSummary(referenceDelta, referenceConflicts);
assert.equal(referenceConflicts.length, 1);
assert.equal(referenceConflict?.details.reasonCode, 'project-public-scope-reference-delta-conflict');
assert.equal(referenceConflict.details.identityKey, 'scope-reference#src/scope.ts#viewTodo#api#value#42');
assert.equal(referenceConflict.details.worker.memberName, 'formatWorker');
assert.equal(referenceConflict.details.head.memberName, 'formatHead');
assert.equal(summarizedReferenceDelta.summary.scopeUseDefConflicts, 1);

const aliasTargetUseDelta = scopeDelta({
  base: aliasReferenceRecord('base', 'target:base'),
  worker: aliasReferenceRecord('worker', 'target:worker'),
  head: aliasReferenceRecord('head', 'target:head')
});
const aliasTargetUseConflicts = projectScopeUseDefDeltaConflicts(aliasTargetUseDelta);
const aliasTargetUseConflict = aliasTargetUseConflicts.find((conflict) => conflict.code === 'project-public-scope-reference-delta-conflict');
assert.equal(aliasTargetUseConflicts.length, 1);
assert.equal(aliasTargetUseConflict?.details.reasonCode, 'project-public-scope-reference-delta-conflict');
assert.equal(aliasTargetUseConflict.details.identityKey, 'scope-reference#src/scope.ts#viewTodo#renderTodo#value#42');
assert.equal(aliasTargetUseConflict.details.worker.importAlias, true);
assert.equal(aliasTargetUseConflict.details.worker.moduleSpecifier, './barrel.js');
assert.equal(aliasTargetUseConflict.details.worker.importedName, 'publicFormat');
assert.equal(aliasTargetUseConflict.details.worker.resolvedSourcePath, 'src/barrel.ts');
assert.equal(aliasTargetUseConflict.details.worker.resolvedExportName, 'publicFormat');
assert.equal(aliasTargetUseConflict.details.worker.resolvedBindingUseHash, 'target:worker');
assert.equal(aliasTargetUseConflict.details.head.resolvedBindingUseHash, 'target:head');

const unchangedHeadConflicts = projectScopeUseDefDeltaConflicts(scopeDelta({
  base: referenceRecord('base', 'formatBase', 'ref:base'),
  worker: referenceRecord('worker', 'formatWorker', 'ref:worker'),
  head: referenceRecord('head', 'formatBase', 'ref:base')
}));
assert.equal(unchangedHeadConflicts.length, 0);

const ambiguousReferenceConflicts = projectScopeUseDefDeltaConflicts({
  stages: {
    output: {
      projectSymbolGraph: {
        scopeBindingRecords: [],
        scopeReferenceRecords: [referenceRecord('output', undefined, 'ref:blocked', {
          status: 'blocked',
          reasonCodes: ['lexical-scope-namespace-computed-member-unsupported']
        })]
      },
      summary: { scopeReferenceRecords: 1 }
    }
  },
  summary: { stages: 1 }
});
const ambiguousReferenceConflict = ambiguousReferenceConflicts.find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
assert.equal(ambiguousReferenceConflicts.length, 1);
assert.equal(ambiguousReferenceConflict?.details.reasonCode, 'project-public-scope-reference-ambiguous-evidence');
assert.equal(ambiguousReferenceConflict.details.reasonCodes.includes('lexical-scope-namespace-computed-member-unsupported'), true);

const compilerShadowSource = [
  "import { target as renderTodo } from './dep.js';",
  'export function viewTodo(todo) {',
  '  {',
  "    const renderTodo = () => 'shadow';",
  '    renderTodo;',
  '  }',
  '  return renderTodo(todo);',
  '}',
  ''
].join('\n');
const compilerShadowStart = compilerShadowSource.lastIndexOf('renderTodo(todo)');
const compilerShadowGraph = createProjectScopeUseDefRecords(
  compilerShadowSemanticIndex(compilerShadowSource, compilerShadowStart, compilerShadowStart + 'renderTodo'.length),
  compilerShadowImports(compilerShadowSource),
  []
);
const compilerShadowReference = compilerShadowGraph.scopeReferenceRecords.find((record) => (
  record.sourcePath === 'src/consumer.ts' && record.start === compilerShadowStart
));
assert.equal(compilerShadowReference?.bindingKind, 'const');
assert.equal(compilerShadowReference.compilerReferenceStatus, 'blocked');
assert.equal(compilerShadowReference.compilerReferenceAliased, true);
assert.equal(compilerShadowReference.compilerReferenceTargetName, 'target');
assert.equal(compilerShadowReference.reasonCodes.includes('typescript-compiler-reference-lexical-binding-mismatch'), true);
assert.equal(typeof compilerShadowReference.compilerReferenceProofHash, 'string');
const compilerShadowConflicts = projectScopeUseDefDeltaConflicts({
  stages: { output: { projectSymbolGraph: compilerShadowGraph, summary: { scopeReferenceRecords: compilerShadowGraph.scopeReferenceRecords.length } } },
  summary: { stages: 1 }
});
const compilerShadowConflict = compilerShadowConflicts.find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
assert.equal(compilerShadowConflict?.details.reasonCodes.includes('typescript-compiler-reference-lexical-binding-mismatch'), true);
assert.equal(compilerShadowConflict.details.output.compilerReferenceTargetName, 'target');

const compilerReExportMismatchSource = [
  "import { publicFormat as renderTodo } from './barrel.js';",
  'export function viewTodo(todo) {',
  '  const formatTodo = (value) => value.shadow;',
  '  return renderTodo(todo);',
  '}',
  ''
].join('\n');
const compilerReExportMismatchStart = compilerReExportMismatchSource.lastIndexOf('renderTodo(todo)');
const compilerReExportMismatchGraph = createProjectScopeUseDefRecords(
  compilerReExportMismatchSemanticIndex(
    compilerReExportMismatchSource,
    compilerReExportMismatchStart,
    compilerReExportMismatchStart + 'renderTodo'.length
  ),
  compilerReExportMismatchImports(compilerReExportMismatchSource),
  []
);
const compilerReExportMismatchReference = compilerReExportMismatchGraph.scopeReferenceRecords.find((record) => (
  record.sourcePath === 'src/consumer.ts' && record.start === compilerReExportMismatchStart
));
assert.equal(compilerReExportMismatchReference?.bindingKind, 'import');
assert.equal(compilerReExportMismatchReference.importAlias, true);
assert.equal(compilerReExportMismatchReference.resolvedSourcePath, 'src/barrel.ts');
assert.equal(compilerReExportMismatchReference.originSourcePath, 'src/dep.ts');
assert.equal(compilerReExportMismatchReference.resolvedBindingName, 'formatTodo');
assert.equal(compilerReExportMismatchReference.compilerReferenceStatus, 'blocked');
assert.equal(compilerReExportMismatchReference.compilerReferenceTargetName, 'formatHead');
assert.equal(compilerReExportMismatchReference.reasonCodes.includes('typescript-compiler-reference-import-alias-target-mismatch'), true);
const compilerReExportMismatchConflicts = projectScopeUseDefDeltaConflicts({
  stages: {
    output: {
      projectSymbolGraph: compilerReExportMismatchGraph,
      summary: { scopeReferenceRecords: compilerReExportMismatchGraph.scopeReferenceRecords.length }
    }
  },
  summary: { stages: 1 }
});
const compilerReExportMismatchConflict = compilerReExportMismatchConflicts.find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
assert.equal(compilerReExportMismatchConflict?.details.reasonCodes.includes('typescript-compiler-reference-import-alias-target-mismatch'), true);
assert.equal(compilerReExportMismatchConflict.details.output.resolvedBindingName, 'formatTodo');
assert.equal(compilerReExportMismatchConflict.details.output.compilerReferenceTargetName, 'formatHead');

function scopeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: {
        scopeBindingRecords: [],
        scopeReferenceRecords: record ? [record] : []
      },
      summary: { scopeReferenceRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function referenceRecord(stage, memberName, signatureHash, fields = {}) {
  return {
    id: `scope_ref_${stage}`,
    sourcePath: 'src/scope.ts',
    sourceHash: `source:${stage}`,
    name: 'api',
    namespace: 'value',
    bindingName: 'api',
    bindingKind: 'import',
    bindingOrdinal: 1,
    publicContract: true,
    publicOwnerName: 'viewTodo',
    referenceKind: 'namespace-property-read',
    memberName,
    ordinal: 42,
    signatureHash,
    ...fields
  };
}

function aliasReferenceRecord(stage, resolvedBindingUseHash) {
  return referenceRecord(stage, undefined, 'ref:alias-target', {
    name: 'renderTodo',
    bindingName: 'renderTodo',
    bindingKind: 'import',
    importAlias: true,
    moduleSpecifier: './barrel.js',
    importedName: 'publicFormat',
    resolvedSourcePath: 'src/barrel.ts',
    resolvedExportName: 'publicFormat',
    originSourcePath: 'src/dep.ts',
    resolvedBindingId: 'scope_binding_formatTodo',
    resolvedBindingName: 'formatTodo',
    resolvedBindingUseHash
  });
}

function compilerShadowImports(sourceText) {
  return [
    { sourcePath: 'src/dep.ts', sourceText: 'export function target(todo) { return todo.title; }\n', nativeSource: { sourceHash: 'hash:dep' } },
    { sourcePath: 'src/consumer.ts', sourceText, nativeSource: { sourceHash: 'hash:consumer' } }
  ];
}

function compilerShadowSemanticIndex(sourceText, start, end) {
  const compilerSymbolId = 'symbol:typescript:compiler:dep_target';
  return {
    documents: [{ id: 'doc_dep', path: 'src/dep.ts' }, { id: 'doc_consumer', path: 'src/consumer.ts' }],
    symbols: [
      { id: 'symbol_export_target', kind: 'export', name: 'target', definitionSpan: { path: 'src/dep.ts' }, metadata: { localName: 'target', exportedName: 'target' } },
      { id: 'symbol_export_viewTodo', kind: 'export', name: 'viewTodo', definitionSpan: { path: 'src/consumer.ts' }, metadata: { localName: 'viewTodo', exportedName: 'viewTodo' } },
      { id: 'symbol_import_renderTodo', kind: 'import', name: 'renderTodo', definitionSpan: { path: 'src/consumer.ts' }, metadata: { localName: 'renderTodo', importedName: 'target', moduleSpecifier: './dep.js', importKind: 'named' } }
    ],
    occurrences: [{
      id: 'occ_renderTodo_return_compiler_reference',
      role: 'reference',
      symbolId: compilerSymbolId,
      span: sourceSpan(sourceText, 'src/consumer.ts', start, end),
      metadata: { compilerReference: true }
    }],
    relations: [{ id: 'rel_renderTodo_target', sourceId: 'occ_renderTodo_return_compiler_reference', predicate: 'references', targetId: compilerSymbolId, evidenceIds: ['evidence_ts_compiler_refs'] }],
    facts: [{ id: 'fact_renderTodo_target', predicate: 'compilerSymbolReference', subjectId: 'occ_renderTodo_return_compiler_reference', objectId: compilerSymbolId, value: { localName: 'renderTodo', targetName: 'target', fullyQualifiedName: '"src/dep".target', aliased: true, identityHash: 'compiler:target' }, evidenceIds: ['evidence_ts_compiler_refs'] }]
  };
}

function compilerReExportMismatchImports(sourceText) {
  return [
    { sourcePath: 'src/dep.ts', sourceText: 'export function formatTodo(todo) { return todo.title; }\nexport function formatHead(todo) { return todo.id; }\n', nativeSource: { sourceHash: 'hash:dep' } },
    { sourcePath: 'src/barrel.ts', sourceText: "export { formatTodo as publicFormat } from './dep.js';\n", nativeSource: { sourceHash: 'hash:barrel' } },
    { sourcePath: 'src/consumer.ts', sourceText, nativeSource: { sourceHash: 'hash:consumer' } }
  ];
}

function compilerReExportMismatchSemanticIndex(sourceText, start, end) {
  const compilerSymbolId = 'symbol:typescript:compiler:dep_formatHead';
  return {
    documents: [
      { id: 'doc_dep', path: 'src/dep.ts' },
      { id: 'doc_barrel', path: 'src/barrel.ts' },
      { id: 'doc_consumer', path: 'src/consumer.ts' }
    ],
    symbols: [
      { id: 'symbol_export_formatTodo', kind: 'export', name: 'formatTodo', definitionSpan: { path: 'src/dep.ts' }, metadata: { localName: 'formatTodo', exportedName: 'formatTodo' } },
      { id: 'symbol_export_formatHead', kind: 'export', name: 'formatHead', definitionSpan: { path: 'src/dep.ts' }, metadata: { localName: 'formatHead', exportedName: 'formatHead' } },
      { id: 'symbol_export_publicFormat', kind: 'export', name: 'publicFormat', definitionSpan: { path: 'src/barrel.ts' }, metadata: { localName: 'formatTodo', importedName: 'formatTodo', exportedName: 'publicFormat', moduleSpecifier: './dep.js', exportKind: 'named' } },
      { id: 'symbol_export_viewTodo', kind: 'export', name: 'viewTodo', definitionSpan: { path: 'src/consumer.ts' }, metadata: { localName: 'viewTodo', exportedName: 'viewTodo' } },
      { id: 'symbol_import_renderTodo', kind: 'import', name: 'renderTodo', definitionSpan: { path: 'src/consumer.ts' }, metadata: { localName: 'renderTodo', importedName: 'publicFormat', moduleSpecifier: './barrel.js', importKind: 'named' } }
    ],
    occurrences: [{
      id: 'occ_renderTodo_reexport_mismatch_compiler_reference',
      role: 'reference',
      symbolId: compilerSymbolId,
      span: sourceSpan(sourceText, 'src/consumer.ts', start, end),
      metadata: { compilerReference: true }
    }],
    relations: [{ id: 'rel_renderTodo_formatHead', sourceId: 'occ_renderTodo_reexport_mismatch_compiler_reference', predicate: 'references', targetId: compilerSymbolId, evidenceIds: ['evidence_ts_compiler_refs'] }],
    facts: [{ id: 'fact_renderTodo_formatHead', predicate: 'compilerSymbolReference', subjectId: 'occ_renderTodo_reexport_mismatch_compiler_reference', objectId: compilerSymbolId, value: { localName: 'renderTodo', targetName: 'formatHead', fullyQualifiedName: '"src/dep".formatHead', aliased: true, identityHash: 'compiler:formatHead' }, evidenceIds: ['evidence_ts_compiler_refs'] }]
  };
}

function sourceSpan(sourceText, path, start, end) {
  const startPos = lineColumn(sourceText, start);
  const endPos = lineColumn(sourceText, end);
  return { path, startLine: startPos.line, startColumn: startPos.column, endLine: endPos.line, endColumn: endPos.column };
}

function lineColumn(sourceText, offset) {
  let line = 1;
  let column = 1;
  for (let index = 0; index < offset; index += 1) {
    if (sourceText[index] === '\n') { line += 1; column = 1; } else column += 1;
  }
  return { line, column };
}
