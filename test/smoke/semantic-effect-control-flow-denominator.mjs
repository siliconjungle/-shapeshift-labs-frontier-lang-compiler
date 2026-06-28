import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsSource
} from '../../src/index.js';

const isolatedControlFlowBase = [
  'export function choose(value) {',
  '  if (value > 0) {',
  '    return value;',
  '  }',
  '  return 0;',
  '}',
  '',
  'export const version = 1;',
  ''
].join('\n');
const isolatedControlFlowMerge = safeMergeJsTsSource({
  id: 'semantic_control_effect_isolated_control_flow_autonomy_merge',
  language: 'typescript',
  sourcePath: 'src/choose.ts',
  baseSourceText: isolatedControlFlowBase,
  workerSourceText: isolatedControlFlowBase.replace('return value;', 'return value + 1;'),
  headSourceText: isolatedControlFlowBase.replace('export const version = 1;', 'export const version = 2;')
});
assert.equal(isolatedControlFlowMerge.status, 'merged');
assert.equal(isolatedControlFlowMerge.mergedSourceText.includes('return value + 1;'), true);
assert.equal(isolatedControlFlowMerge.mergedSourceText.includes('export const version = 2;'), true);
assert.equal(isolatedControlFlowMerge.admission.autoMergeClaim, false);
assert.equal(isolatedControlFlowMerge.admission.semanticEquivalenceClaim, false);

const isolatedEffectBase = [
  'export function load(api) {',
  '  fetch(api);',
  '  return api.ready;',
  '}',
  '',
  'export const version = 1;',
  ''
].join('\n');
const isolatedEffectMerge = safeMergeJsTsSource({
  id: 'semantic_control_effect_isolated_autonomy_merge',
  language: 'typescript',
  sourcePath: 'src/load.ts',
  baseSourceText: isolatedEffectBase,
  workerSourceText: isolatedEffectBase.replace('fetch(api);', 'fetch(api, { cache: "reload" });'),
  headSourceText: isolatedEffectBase.replace('export const version = 1;', 'export const version = 2;')
});
assert.equal(isolatedEffectMerge.status, 'merged');
assert.equal(isolatedEffectMerge.mergedSourceText.includes('fetch(api, { cache: "reload" });'), true);
assert.equal(isolatedEffectMerge.mergedSourceText.includes('export const version = 2;'), true);
assert.equal(isolatedEffectMerge.admission.autoMergeClaim, false);
assert.equal(isolatedEffectMerge.admission.semanticEquivalenceClaim, false);

const guardedEffectSource = [
  'export function guardedLoad(api, state) {',
  '  state.ready && fetch(api);',
  '  return state.ready;',
  '}',
  ''
].join('\n');
const guardedSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/guarded-load.ts',
  sourceText: guardedEffectSource
}), { generatedAt: 301 });
const guardedRegion = guardedSidecar.ownershipRegions
  .find((region) => region.symbolName === 'guardedLoad:effect:network#1');
assert.ok(guardedRegion);
assert.equal(sourceTextForSpan(guardedEffectSource, guardedRegion.sourceSpan), 'fetch(api)');
assert.deepEqual(guardedRegion.metadata.runtimeOrderEvidence.sameLineShortCircuit[0].operators, ['&&']);
assert.equal(guardedRegion.metadata.runtimeOrderEvidence.effectTargetOrder[0].runtimeEquivalenceClaim, false);
const guardedHazard = safeMergeJsTsSource({
  id: 'semantic_control_effect_guarded_hazard_blocked',
  language: 'typescript',
  sourcePath: 'src/guarded-load.ts',
  baseSourceText: guardedEffectSource,
  workerSourceText: guardedEffectSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })'),
  headSourceText: guardedEffectSource.replace('state.ready && fetch(api)', 'state.ready && !state.blocked && fetch(api)')
});
assert.equal(guardedHazard.status, 'blocked');
assert.equal(guardedHazard.admission.reasonCodes.includes('runtime-order-short-circuit-merge-requires-expression-order-evidence'), true);

const promiseAllSource = [
  'export async function loadBoth(api) {',
  '  return Promise.all([fetch(api.a), fetch(api.b)]);',
  '}',
  ''
].join('\n');
const promiseAllHazard = safeMergeJsTsSource({
  id: 'semantic_control_effect_promise_combinator_blocked',
  language: 'typescript',
  sourcePath: 'src/load-both.ts',
  baseSourceText: promiseAllSource,
  workerSourceText: promiseAllSource.replace('fetch(api.a)', 'fetch(api.a, { cache: "reload" })'),
  headSourceText: promiseAllSource.replace('Promise.all([fetch(api.a), fetch(api.b)])', 'Promise.race([fetch(api.a), fetch(api.b)])')
});
assert.equal(promiseAllHazard.status, 'blocked');
assert.equal(promiseAllHazard.admission.reasonCodes.includes('runtime-order-promise-combinator-merge-requires-concurrency-evidence'), true);
assert.equal(promiseAllHazard.admission.reasonCodes.includes('runtime-order-promise-combinator-runtime-equivalence-not-proven'), true);

const dynamicImportSource = [
  'export async function loadPlugin(name) {',
  '  return import(`./plugins/${name}.js`);',
  '}',
  ''
].join('\n');
const dynamicImportHazard = safeMergeJsTsSource({
  id: 'semantic_control_effect_dynamic_import_blocked',
  language: 'typescript',
  sourcePath: 'src/load-plugin.ts',
  baseSourceText: dynamicImportSource,
  workerSourceText: dynamicImportSource.replace('${name}.js', '${name}.worker.js'),
  headSourceText: dynamicImportSource.replace('./plugins/', './extensions/')
});
assert.equal(dynamicImportHazard.status, 'blocked');
assert.equal(dynamicImportHazard.admission.reasonCodes.includes('template-literal-merge-requires-template-evidence'), true);
assert.equal(dynamicImportHazard.admission.reasonCodes.includes('effect-template-interpolation-merge-requires-expression-order-evidence'), true);
assert.equal(dynamicImportHazard.admission.semanticEquivalenceClaim, false);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
