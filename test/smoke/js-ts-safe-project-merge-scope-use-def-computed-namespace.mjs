import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';

const namespaceComputedProject = safeMergeJsTsProject({
  id: 'js_ts_scope_use_def_namespace_computed_member',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: namespaceComputedFiles("'formatTodo'"),
  workerFiles: namespaceComputedFiles("'formatTodo'"),
  headFiles: namespaceComputedFiles("'formatTodo'")
});
const namespaceComputedGraph = namespaceComputedProject.outputProjectSymbolGraph;
const namespaceComputedReference = namespaceComputedGraph.scopeReferenceRecords
  .find((record) => record.name === 'api' && record.referenceKind === 'namespace-computed-property-read');
assert.equal(namespaceComputedProject.status, 'merged');
assert.equal(namespaceComputedReference?.memberName, 'formatTodo');
assert.equal(namespaceComputedReference.memberComputed, true);
assert.equal(namespaceComputedReference.memberLiteralKind, 'string-literal');

const namespaceTemplateComputedProject = safeMergeJsTsProject({
  id: 'js_ts_scope_use_def_namespace_template_computed_member',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: namespaceComputedFiles('`formatTodo`'),
  workerFiles: namespaceComputedFiles('`formatTodo`'),
  headFiles: namespaceComputedFiles('`formatTodo`')
});
const namespaceTemplateComputedReference = namespaceTemplateComputedProject.outputProjectSymbolGraph.scopeReferenceRecords
  .find((record) => record.name === 'api' && record.referenceKind === 'namespace-computed-property-read');
assert.equal(namespaceTemplateComputedProject.status, 'merged');
assert.equal(namespaceTemplateComputedReference?.memberName, 'formatTodo');
assert.equal(namespaceTemplateComputedReference.memberComputed, true);
assert.equal(namespaceTemplateComputedReference.memberLiteralKind, 'static-template-literal');
assert.equal(namespaceTemplateComputedReference.memberStaticTemplateLiteral, true);

const namespaceComputedConflict = projectScopeUseDefDeltaConflicts(scopeDelta({
  base: namespaceOwner(namespaceComputedGraph),
  worker: namespaceOwner(projectGraph(namespaceComputedFiles("'formatWorker'"), 'worker')),
  head: namespaceOwner(projectGraph(namespaceComputedFiles("'formatHead'"), 'head'))
})).find((conflict) => conflict.details?.identityKey?.includes('#viewTodo#function#value#'));
assert.equal(namespaceComputedConflict?.details.reasonCode, 'project-public-scope-use-def-delta-conflict');

const namespaceComputedWriteProject = safeMergeJsTsProject({
  id: 'js_ts_scope_use_def_namespace_computed_write_blocks',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  includeProjectGraphDelta: true,
  baseFiles: namespaceComputedWriteFiles("'formatTodo'"),
  workerFiles: namespaceComputedWriteFiles("'formatTodo'"),
  headFiles: namespaceComputedWriteFiles("'formatTodo'")
});
const namespaceComputedWriteConflict = namespaceComputedWriteProject.conflicts
  .find((conflict) => conflict.code === 'project-public-scope-use-def-ambiguous-evidence');
const namespaceComputedWriteReference = namespaceComputedWriteProject.outputProjectSymbolGraph.scopeReferenceRecords
  .find((record) => record.name === 'api' && record.referenceKind === 'namespace-computed-property-write');
assert.equal(namespaceComputedWriteProject.status, 'blocked');
assert.equal(namespaceComputedWriteProject.admission.reasonCodes.includes('project-public-scope-use-def-ambiguous-evidence'), true);
assert.equal(namespaceComputedWriteReference?.memberName, 'formatTodo');
assert.equal(namespaceComputedWriteReference.memberComputed, true);
assert.equal(namespaceComputedWriteReference.writeOperation, 'assignment');
assert.equal(namespaceComputedWriteConflict?.details.reasonCodes.includes('lexical-scope-namespace-member-write-unsupported'), true);

const namespaceDynamicComputedProject = safeMergeJsTsProject({
  id: 'js_ts_scope_use_def_namespace_dynamic_computed_blocks',
  language: 'typescript',
  includeProjectGraphDelta: true,
  baseFiles: namespaceComputedFiles('`format${memberName}`'),
  workerFiles: namespaceComputedFiles('`format${memberName}`'),
  headFiles: namespaceComputedFiles('`format${memberName}`')
});
const namespaceDynamicComputedConflict = namespaceDynamicComputedProject.conflicts
  .find((conflict) => conflict.code === 'project-public-scope-use-def-ambiguous-evidence');
assert.equal(namespaceDynamicComputedProject.status, 'blocked');
assert.equal(namespaceDynamicComputedProject.admission.reasonCodes.includes('project-public-scope-use-def-ambiguous-evidence'), true);
assert.equal(namespaceDynamicComputedConflict?.details.reasonCodes.includes('lexical-scope-namespace-computed-member-unsupported'), true);

function projectGraph(files, id) {
  return safeMergeJsTsProject({
    id: `js_ts_scope_use_def_namespace_computed_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: files,
    workerFiles: files,
    headFiles: files
  }).outputProjectSymbolGraph;
}

function namespaceComputedFiles(memberExpression) {
  return {
    'src/dep.ts': 'export function formatTodo(todo) { return todo.title; }\nexport function formatWorker(todo) { return todo.id; }\nexport function formatHead(todo) { return todo.status; }\n',
    'src/ns-computed-consumer.ts': `import * as api from './dep.js';\nexport function viewTodo(todo, memberName) {\n  return api[${memberExpression}](todo);\n}\n`
  };
}

function namespaceComputedWriteFiles(memberExpression) {
  return {
    'src/dep.ts': 'export function formatTodo(todo) { return todo.title; }\n',
    'src/ns-computed-write-consumer.ts': `import * as api from './dep.js';\nexport function viewTodo(todo) {\n  api[${memberExpression}] = function overrideTodo(value) { return value.title; };\n  return api.formatTodo(todo);\n}\n`
  };
}

function namespaceOwner(graph) {
  return graph.scopeBindingRecords.find((record) => record.name === 'viewTodo' && record.bindingKind === 'function');
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
