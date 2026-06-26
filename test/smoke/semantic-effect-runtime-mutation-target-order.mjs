import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const mutationSource = [
  'export function writeState(state, queue, key) {',
  '  state.count = queue.length;',
  '  state.count += 1;',
  '  delete state.old;',
  '  queue.push(key);',
  '  state["visible"] = true;',
  '  state[key] = queue.length;',
  '  delete state["old"];',
  '  state["count"]++;',
  '  state["items"].push(key);',
  '  queue["push"](key);',
  '  queue?.["push"]?.(key);',
  '  state.left = 1; state.right = 2;',
  '  state.first++; state.second++;',
  '  delete state.left; delete state.right;',
  '  queue.push(key); queue.unshift(key);',
  '}',
  ''
].join('\n');

const sidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/mutation-target-order.ts',
  sourceText: mutationSource
}), { generatedAt: 222 });

const assignmentRegion = mutationRegion('assignment', 'state.count = queue.length');
const updateRegion = mutationRegion('update', 'state.count += 1');
const deleteRegion = mutationRegion('delete', 'delete state.old');
const callRegion = mutationRegion('mutating-call', 'queue.push(key)');
const computedRegion = sidecar.ownershipRegions
  .find((region) => region.regionKind === 'mutation'
    && region.metadata?.factKinds?.includes('assignment')
    && sourceTextForSpan(mutationSource, region.sourceSpan).includes('state[key]'));
const literalComputedRegion = sidecar.ownershipRegions
  .find((region) => region.regionKind === 'mutation'
    && region.metadata?.factKinds?.includes('assignment')
    && sourceTextForSpan(mutationSource, region.sourceSpan).includes('state["visible"]'));
const literalComputedDeleteRegion = mutationRegion('delete', 'delete state["old"]');
const literalComputedUpdateRegion = mutationRegion('update', 'state["count"]++');
const literalComputedCallTargetRegion = mutationRegion('mutating-call', 'state["items"].push(key)');
const literalComputedMethodRegion = mutationRegion('mutating-call', 'queue["push"](key)');
const optionalComputedMethodRegion = mutationRegion('mutating-call', 'queue?.["push"]?.(key)');
const sameLineAssignmentFirst = mutationRegion('assignment', 'state.left = 1;');
const sameLineAssignmentSecond = mutationRegion('assignment', 'state.right = 2;');
const sameLineUpdateFirst = mutationRegion('update', 'state.first++');
const sameLineUpdateSecond = mutationRegion('update', 'state.second++');
const sameLineDeleteFirst = mutationRegion('delete', 'delete state.left;');
const sameLineDeleteSecond = mutationRegion('delete', 'delete state.right;');
const sameLineCallFirst = sameLineMutationRegion('mutating-call', 'queue.push(key)', 2);
const sameLineCallSecond = mutationRegion('mutating-call', 'queue.unshift(key)');

assert.equal(assignmentRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.count');
assert.equal(assignmentRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].operator, '=');
assert.equal(updateRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].operator, '+=');
assert.equal(deleteRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.old');
assert.equal(deleteRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].runtimeEquivalenceClaim, false);
assert.equal(callRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].methodName, 'push');
assert.equal(callRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetRoot, 'queue');
assert.equal(computedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedProperty, true);
assert.equal(computedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyDynamic, true);
assert.equal(literalComputedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedProperty, true);
assert.equal(literalComputedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyStatic, true);
assert.deepEqual(literalComputedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyKeys, ['visible']);
assert.equal(literalComputedRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyRuntimeEquivalenceClaim, false);
assert.deepEqual(literalComputedDeleteRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyKeys, ['old']);
assert.deepEqual(literalComputedUpdateRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyKeys, ['count']);
assert.deepEqual(literalComputedCallTargetRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedPropertyKeys, ['items']);
assert.equal(literalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].methodName, 'push');
assert.equal(literalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].methodComputed, true);
assert.equal(literalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedMethodStatic, true);
assert.equal(literalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedMethodName, 'push');
assert.equal(literalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedMethodRuntimeEquivalenceClaim, false);
assert.equal(optionalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].optionalCall, true);
assert.equal(optionalComputedMethodRegion.metadata.runtimeOrderEvidence.mutationTargetOrder[0].computedMethodName, 'push');
assert.equal(sameLineAssignmentFirst.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.left');
assert.equal(sameLineAssignmentSecond.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.right');
assert.equal(sameLineUpdateFirst.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.first');
assert.equal(sameLineUpdateSecond.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.second');
assert.equal(sameLineDeleteFirst.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.left');
assert.equal(sameLineDeleteSecond.metadata.runtimeOrderEvidence.mutationTargetOrder[0].targetText, 'state.right');
assert.equal(sameLineCallFirst.metadata.runtimeOrderEvidence.mutationTargetOrder[0].methodName, 'push');
assert.equal(sameLineCallSecond.metadata.runtimeOrderEvidence.mutationTargetOrder[0].methodName, 'unshift');
assert.notEqual(sameLineAssignmentFirst.id, sameLineAssignmentSecond.id);
assert.notEqual(sameLineUpdateFirst.id, sameLineUpdateSecond.id);
assert.notEqual(sameLineDeleteFirst.id, sameLineDeleteSecond.id);
assert.notEqual(sameLineCallFirst.id, sameLineCallSecond.id);

const targetHeadSource = mutationSource.replace('state.count = queue.length;', 'state.total = queue.length;');
const targetWorkerSource = mutationSource.replace('state.count = queue.length;', 'state.count = queue.length + 1;');
const targetScript = createSemanticEditScript({
  id: 'semantic_mutation_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/mutation-target-order.ts',
  baseSourceText: mutationSource,
  workerSourceText: targetWorkerSource,
  headSourceText: targetHeadSource,
  generatedAt: 223
});
const targetOperation = targetScript.operations
  .find((operation) => operation.anchor.symbolName === assignmentRegion.symbolName);
assert.equal(targetScript.admission.status, 'conflict');
assert.equal(targetOperation.status, 'conflict');
assert.equal(targetOperation.reasonCodes.includes('runtime-order-mutation-target-merge-requires-write-target-evidence'), true);
assert.equal(targetOperation.reasonCodes.includes('runtime-order-mutation-target-merge-requires-operator-evidence'), true);
assert.equal(targetOperation.reasonCodes.includes('mutation-assignment-merge-requires-assignment-order-evidence'), true);

const computedMethodHeadSource = mutationSource.replace('queue["push"](key);', 'queue["pop"]();');
const computedMethodWorkerSource = mutationSource.replace('queue["push"](key);', 'queue["push"](String(key));');
const computedMethodScript = createSemanticEditScript({
  id: 'semantic_mutation_computed_method_order_blocked',
  language: 'typescript',
  sourcePath: 'src/mutation-target-order.ts',
  baseSourceText: mutationSource,
  workerSourceText: computedMethodWorkerSource,
  headSourceText: computedMethodHeadSource,
  generatedAt: 224
});
const computedMethodOperation = computedMethodScript.operations
  .find((operation) => operation.anchor.symbolName === literalComputedMethodRegion.symbolName);
assert.equal(computedMethodScript.admission.status, 'conflict');
assert.equal(computedMethodOperation.status, 'conflict');
assert.equal(computedMethodOperation.reasonCodes.includes('runtime-order-mutation-target-merge-requires-mutator-method-evidence'), true);
assert.equal(computedMethodOperation.reasonCodes.includes('runtime-order-mutation-target-merge-requires-computed-mutator-method-evidence'), true);

const targetMerge = safeMergeJsTsSource({
  id: 'semantic_mutation_target_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/mutation-target-order.ts',
  baseSourceText: mutationSource,
  workerSourceText: targetWorkerSource,
  headSourceText: targetHeadSource
});
assert.equal(targetMerge.status, 'blocked');
assert.equal(targetMerge.mergedSourceText, undefined);

function mutationRegion(kind, text) {
  const region = sidecar.ownershipRegions.find((candidate) => candidate.regionKind === 'mutation'
    && candidate.metadata?.factKinds?.includes(kind)
    && sourceTextForSpan(mutationSource, candidate.sourceSpan).includes(text));
  assert.ok(region, `expected ${kind} region for ${text}`);
  return region;
}

function sameLineMutationRegion(kind, text, ordinal) {
  const regions = sidecar.ownershipRegions.filter((candidate) => candidate.regionKind === 'mutation'
    && candidate.metadata?.factKinds?.includes(kind)
    && sourceTextForSpan(mutationSource, candidate.sourceSpan).includes(text));
  const region = regions[ordinal - 1];
  assert.ok(region, `expected ${kind} region #${ordinal} for ${text}`);
  return region;
}

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
