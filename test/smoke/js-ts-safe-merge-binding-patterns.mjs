import { assert } from './helpers.mjs';
import { safeMergeJsTsSource } from './compiler-api.mjs';

const objectBindingBase = 'export const a = 1, { b } = source;\n';
const stableObjectBinding = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_binding_pattern_stable_object_declarator',
  language: 'typescript',
  sourcePath: 'src/binding-patterns.ts',
  baseSourceText: objectBindingBase,
  workerSourceText: 'export const a = 1, { b } = workerSource;\n',
  headSourceText: 'export const a = 2, { b } = source;\n'
});
assert.equal(stableObjectBinding.status, 'merged');
assert.equal(stableObjectBinding.mergedSourceText, 'export const a = 2, { b } = workerSource;\n');
assert.equal(stableObjectBinding.summary.variableDeclaratorEdits, 1);

const renamedObjectBinding = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_binding_pattern_rename_blocked',
  language: 'typescript',
  sourcePath: 'src/binding-patterns.ts',
  baseSourceText: objectBindingBase,
  workerSourceText: 'export const a = 1, { b: renamed } = source;\n',
  headSourceText: 'export const a = 2, { b } = source;\n'
});
assert.equal(renamedObjectBinding.status, 'blocked');
assert.equal(renamedObjectBinding.admission.reasonCodes.includes('binding-pattern-rename-blocked'), true);
assert.equal(renamedObjectBinding.admission.reasonCodes.includes('binding-pattern-merge-requires-binding-use-evidence'), true);

const defaultObjectBinding = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_binding_pattern_default_blocked',
  language: 'typescript',
  sourcePath: 'src/binding-patterns.ts',
  baseSourceText: objectBindingBase,
  workerSourceText: 'export const a = 1, { b = 0 } = source;\n',
  headSourceText: 'export const a = 2, { b } = source;\n'
});
assert.equal(defaultObjectBinding.status, 'blocked');
assert.equal(defaultObjectBinding.admission.reasonCodes.includes('binding-pattern-default-initializer-blocked'), true);

const restObjectBinding = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_binding_pattern_rest_blocked',
  language: 'typescript',
  sourcePath: 'src/binding-patterns.ts',
  baseSourceText: objectBindingBase,
  workerSourceText: 'export const a = 1, { b, ...rest } = source;\n',
  headSourceText: 'export const a = 2, { b } = source;\n'
});
assert.equal(restObjectBinding.status, 'blocked');
assert.equal(restObjectBinding.admission.reasonCodes.includes('binding-pattern-rest-spread-blocked'), true);

const arrayBinding = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_binding_pattern_array_order_blocked',
  language: 'typescript',
  sourcePath: 'src/binding-patterns.ts',
  baseSourceText: 'export const a = 1, [b] = source;\n',
  workerSourceText: 'export const a = 1, [renamed] = source;\n',
  headSourceText: 'export const a = 2, [b] = source;\n'
});
assert.equal(arrayBinding.status, 'blocked');
assert.equal(arrayBinding.admission.reasonCodes.includes('binding-pattern-array-order-blocked'), true);
