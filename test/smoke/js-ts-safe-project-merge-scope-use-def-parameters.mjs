import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const parameterSource = [
  'export function View({ title, meta: { count: total = 0 }, ...rest }) {',
  '  return title + total + rest.id;',
  '}',
  'export const Tuple = ([first, second, ...others]) => first + second + others.length;',
  'export const Direct = (event) => event.type;',
  ''
].join('\n');

const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_destructured_parameter_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/params.ts': parameterSource },
  workerFiles: { 'src/params.ts': parameterSource },
  headFiles: { 'src/params.ts': parameterSource }
});

assert.equal(project.status, 'merged');
assert.equal(project.admission.autoMergeClaim, false);
assert.equal(project.admission.semanticEquivalenceClaim, false);

const graph = project.outputProjectSymbolGraph;
for (const name of ['title', 'total', 'rest']) {
  const binding = parameterBinding(name, 'View');
  assert.equal(binding.bindingKind, 'param');
  assert.equal(binding.publicContract, true);
  assert.equal(typeof binding.useHash, 'string');
  assert.equal(graph.scopeReferenceRecords.some((record) => record.bindingId === binding.id), true);
}
for (const name of ['first', 'second', 'others']) {
  const binding = parameterBinding(name, 'Tuple');
  assert.equal(binding.bindingKind, 'param');
  assert.equal(binding.publicContract, true);
  assert.equal(typeof binding.useHash, 'string');
}
assert.equal(parameterBinding('event', 'Direct').bindingKind, 'param');
assert.equal(graph.scopeBindingRecords.some((record) => record.name === 'meta' && record.bindingKind === 'param'), false);
assert.equal(graph.scopeBindingRecords.some((record) => record.name === 'count' && record.bindingKind === 'param'), false);

function parameterBinding(name, owner) {
  const binding = graph.scopeBindingRecords.find((record) => (
    record.sourcePath === 'src/params.ts'
      && record.name === name
      && record.bindingKind === 'param'
      && record.publicOwnerName === owner
  ));
  assert.ok(binding, `expected param binding ${owner}.${name}`);
  return binding;
}
