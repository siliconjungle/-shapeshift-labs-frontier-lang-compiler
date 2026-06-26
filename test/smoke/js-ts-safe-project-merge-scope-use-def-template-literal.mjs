import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';

const templateSource = templateSourceForTag('html.div');

function templateSourceForTag(tag) {
  return [
  'export function renderTodo(todo, state, html) {',
  '  const prefix = state.prefix;',
  '  const suffix = state.suffix;',
  `  return ${tag}\`${'${prefix}'}:${'${todo.title}'}:${'${`${suffix}`}'}\`;`,
  '}',
  ''
  ].join('\n');
}

const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_template_literal',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/template.ts': templateSource },
  workerFiles: { 'src/template.ts': templateSource },
  headFiles: { 'src/template.ts': templateSource }
});

assert.equal(project.status, 'merged');
assert.equal(project.admission.semanticEquivalenceClaim, false);

const graph = project.outputProjectSymbolGraph;
const templateReferences = graph.scopeReferenceRecords.filter((record) => (
  record.sourcePath === 'src/template.ts'
  && record.referenceKind === 'template-literal-interpolation'
));
assert.equal(templateReferences.length >= 3, true);

for (const name of ['prefix', 'todo', 'suffix']) {
  const reference = templateReferences.find((record) => record.name === name);
  assert.ok(reference, `expected template interpolation reference for ${name}`);
  assert.equal(reference.templateLiteralInterpolation, true);
  assert.equal(typeof reference.templateExpressionStart, 'number');
  assert.equal(typeof reference.templateExpressionEnd, 'number');
  assert.equal(reference.templateExpressionEnd > reference.templateExpressionStart, true);
  assert.equal(typeof reference.templateExpressionHash, 'string');
  assert.equal(reference.reasonCodes?.includes('lexical-scope-template-literal-unsupported') ?? false, false);
}

const prefixReference = templateReferences.find((record) => record.name === 'prefix');
assert.equal(prefixReference.templateLiteralKind, 'tagged-template');
assert.equal(prefixReference.taggedTemplate, true);
assert.equal(prefixReference.templateTagText, 'html.div');
assert.equal(prefixReference.templateTagRoot, 'html');
assert.equal(prefixReference.templateTagMemberName, 'div');
assert.equal(typeof prefixReference.templateTagStart, 'number');
assert.equal(typeof prefixReference.templateTagEnd, 'number');

const suffixReference = templateReferences.find((record) => record.name === 'suffix');
assert.equal(suffixReference.templateLiteralKind, 'template-literal');
assert.equal(suffixReference.taggedTemplate, undefined);
assert.equal(suffixReference.templateTagText, undefined);

const prefixBinding = graph.scopeBindingRecords.find((record) => (
  record.sourcePath === 'src/template.ts'
  && record.name === 'prefix'
  && record.publicOwnerName === 'renderTodo'
));
assert.ok(prefixBinding, 'expected prefix binding');
assert.equal(prefixBinding.referenceCount > 0, true);
assert.equal(typeof prefixBinding.useHash, 'string');

const renderTodoBinding = graph.scopeBindingRecords.find((record) => (
  record.sourcePath === 'src/template.ts'
  && record.name === 'renderTodo'
  && record.bindingKind === 'function'
));
assert.equal(typeof renderTodoBinding?.publicOwnerUseHash, 'string');

const tagDeltaConflict = projectScopeUseDefDeltaConflicts(scopeDelta({
  base: templateOwnerRecord('html.div'),
  worker: templateOwnerRecord('html.span'),
  head: templateOwnerRecord('svg.text')
})).find((conflict) => conflict.details?.identityKey?.includes('#renderTodo#function#value#'));
assert.equal(tagDeltaConflict?.details.reasonCode, 'project-public-scope-use-def-delta-conflict');
assert.notEqual(tagDeltaConflict.details.worker.publicOwnerUseHash, tagDeltaConflict.details.head.publicOwnerUseHash);

function templateOwnerRecord(tag) {
  const source = templateSourceForTag(tag);
  const result = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_scope_use_def_template_literal_${tag.replace(/\W+/g, '_')}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/template.ts': source },
    workerFiles: { 'src/template.ts': source },
    headFiles: { 'src/template.ts': source }
  });
  assert.equal(result.status, 'merged');
  return result.outputProjectSymbolGraph.scopeBindingRecords.find((record) => record.name === 'renderTodo' && record.bindingKind === 'function');
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
