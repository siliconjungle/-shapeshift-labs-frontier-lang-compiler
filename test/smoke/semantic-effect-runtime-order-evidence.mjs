import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const guardedEffectSource = [
  'export function guardedLoad(api, state) {',
  '  if (state.ready) {',
  '    fetch(api);',
  '  }',
  '  return state.ready;',
  '}',
  ''
].join('\n');

const guardedEffectSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/guarded-effects.ts',
  sourceText: guardedEffectSource
}), { generatedAt: 202 });
const guardedNetworkRegion = guardedEffectSidecar.ownershipRegions.find((region) => region.symbolName === 'guardedLoad:effect:network#1');

assert.ok(guardedNetworkRegion);
assert.equal(sourceTextForSpan(guardedEffectSource, guardedNetworkRegion.sourceSpan), 'fetch(api)');
assert.equal(guardedNetworkRegion.metadata.runtimeOrderEvidence.schema, 'frontier.lang.runtimeOrderEvidence.v1');
assert.equal(guardedNetworkRegion.metadata.runtimeOrderEvidence.runtimeOrderIndex > 1, true);
assert.equal(guardedNetworkRegion.metadata.runtimeOrderEvidence.enclosingControlFlow[0].kind, 'branch');
assert.equal(guardedNetworkRegion.metadata.runtimeOrderEvidence.enclosingControlFlow[0].text, 'if (state.ready)');

const shortCircuitEffectSource = [
  'export function shortCircuitLoad(api, state) {',
  '  state.ready && fetch(api);',
  '  return state.ready;',
  '}',
  ''
].join('\n');
const shortCircuitSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/short-circuit-effects.ts',
  sourceText: shortCircuitEffectSource
}), { generatedAt: 203 });
const shortCircuitNetworkRegion = shortCircuitSidecar.ownershipRegions
  .find((region) => region.symbolName === 'shortCircuitLoad:effect:network#1');
assert.ok(shortCircuitNetworkRegion);
assert.equal(sourceTextForSpan(shortCircuitEffectSource, shortCircuitNetworkRegion.sourceSpan), 'fetch(api)');
assert.deepEqual(shortCircuitNetworkRegion.metadata.runtimeOrderEvidence.sameLineShortCircuit[0].operators, ['&&']);
assert.equal(shortCircuitNetworkRegion.metadata.runtimeOrderEvidence.sameLineShortCircuit[0].guardText, 'state.ready');

const shortCircuitWorkerSource = shortCircuitEffectSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const shortCircuitHeadSource = shortCircuitEffectSource.replace('state.ready && fetch(api)', 'state.ready && !state.blocked && fetch(api)');
const shortCircuitScript = createSemanticEditScript({
  id: 'semantic_short_circuit_effect_order_blocked',
  language: 'typescript',
  sourcePath: 'src/short-circuit-effects.ts',
  baseSourceText: shortCircuitEffectSource,
  workerSourceText: shortCircuitWorkerSource,
  headSourceText: shortCircuitHeadSource,
  generatedAt: 204
});
assert.equal(shortCircuitScript.admission.status, 'conflict');
const shortCircuitOperation = shortCircuitScript.operations
  .find((operation) => operation.anchor.symbolName === 'shortCircuitLoad:effect:network#1');
assert.ok(shortCircuitOperation);
assert.equal(shortCircuitOperation.status, 'conflict');
assert.equal(shortCircuitOperation.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(shortCircuitOperation.reasonCodes.includes('runtime-order-short-circuit-merge-requires-expression-order-evidence'), true);
const shortCircuitMerge = safeMergeJsTsSource({
  id: 'semantic_short_circuit_effect_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/short-circuit-effects.ts',
  baseSourceText: shortCircuitEffectSource,
  workerSourceText: shortCircuitWorkerSource,
  headSourceText: shortCircuitHeadSource
});
assert.equal(shortCircuitMerge.status, 'blocked');
assert.equal(shortCircuitMerge.mergedSourceText, undefined);

const logicalAssignmentSource = [
  'export function logicalAssignLoad(api, state) {',
  '  state.cached ||= fetch(api);',
  '  return state.cached;',
  '}',
  ''
].join('\n');
const logicalAssignmentSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/logical-assignment-effects.ts',
  sourceText: logicalAssignmentSource
}), { generatedAt: 205 });
const logicalAssignmentRegion = logicalAssignmentSidecar.ownershipRegions
  .find((region) => region.symbolName === 'logicalAssignLoad:effect:network#1');
assert.ok(logicalAssignmentRegion);
assert.equal(sourceTextForSpan(logicalAssignmentSource, logicalAssignmentRegion.sourceSpan), 'fetch(api)');
assert.deepEqual(logicalAssignmentRegion.metadata.runtimeOrderEvidence.sameLineShortCircuit[0].operators, ['||=']);
assert.equal(logicalAssignmentRegion.metadata.runtimeOrderEvidence.sameLineShortCircuit[0].guardText, 'state.cached');
const logicalAssignmentHeadSource = logicalAssignmentSource.replace('state.cached ||= fetch(api)', 'state.cached &&= fetch(api)');
const logicalAssignmentScript = createSemanticEditScript({
  id: 'semantic_logical_assignment_effect_order_blocked',
  language: 'typescript',
  sourcePath: 'src/logical-assignment-effects.ts',
  baseSourceText: logicalAssignmentSource,
  workerSourceText: logicalAssignmentSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })'),
  headSourceText: logicalAssignmentHeadSource,
  generatedAt: 206
});
assert.equal(logicalAssignmentScript.admission.status, 'conflict');
const logicalAssignmentOperation = logicalAssignmentScript.operations
  .find((operation) => operation.anchor.symbolName === 'logicalAssignLoad:effect:network#1');
assert.ok(logicalAssignmentOperation);
assert.equal(logicalAssignmentOperation.reasonCodes.includes('runtime-order-short-circuit-merge-requires-expression-order-evidence'), true);

const awaitOrderSource = 'export async function awaitLoad(api, state) {\n  const value = await fetch(api);\n  return value;\n}\n';
const awaitOrderHeadSource = awaitOrderSource.replace('await fetch(api)', 'await (state.ready, fetch(api))');
const awaitOrderSidecar = createSemanticImportSidecar(importNativeSource({ language: 'typescript', sourcePath: 'src/await-order-effects.ts', sourceText: awaitOrderSource }), { generatedAt: 205 });
const awaitOrderHeadSidecar = createSemanticImportSidecar(importNativeSource({ language: 'typescript', sourcePath: 'src/await-order-effects.ts', sourceText: awaitOrderHeadSource }), { generatedAt: 206 });
const awaitOrderNetworkRegion = awaitOrderSidecar.ownershipRegions.find((region) => region.symbolName === 'awaitLoad:effect:network+async#1');
const awaitOrderHeadNetworkRegion = awaitOrderHeadSidecar.ownershipRegions.find((region) => region.symbolName === 'awaitLoad:effect:network+async#1');
assert.equal(sourceTextForSpan(awaitOrderSource, awaitOrderNetworkRegion.sourceSpan), 'fetch(api)');
assert.equal(sourceTextForSpan(awaitOrderHeadSource, awaitOrderHeadNetworkRegion.sourceSpan), 'fetch(api)');
assert.equal(awaitOrderNetworkRegion.metadata.runtimeOrderEvidence.sameLineAwaitOrder[0].text, 'await');
assert.equal(awaitOrderHeadNetworkRegion.metadata.runtimeOrderEvidence.sameLineAwaitOrder[0].text, 'await (state.ready,');
const awaitOrderMerge = safeMergeJsTsSource({ id: 'semantic_await_order_effect_safe_merge_blocked', language: 'typescript', sourcePath: 'src/await-order-effects.ts', baseSourceText: awaitOrderSource, workerSourceText: awaitOrderSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })'), headSourceText: awaitOrderHeadSource });
assert.equal(awaitOrderMerge.admission.reasonCodes.includes('runtime-order-await-merge-requires-suspension-order-evidence'), true);

const promiseAllSource = [
  'export async function loadBoth(api) {',
  '  return Promise.all([fetch(api.a), fetch(api.b)]);',
  '}',
  ''
].join('\n');
const promiseAllHeadSource = promiseAllSource.replace('Promise.all([fetch(api.a), fetch(api.b)])', 'Promise.race([fetch(api.a), fetch(api.b)])');
const promiseAllSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/promise-all-order.ts',
  sourceText: promiseAllSource
}), { generatedAt: 207 });
const promiseAllRegions = promiseAllSidecar.ownershipRegions
  .filter((region) => region.symbolName?.startsWith('loadBoth:effect:network#'));
assert.equal(promiseAllRegions.length, 2);
const promiseAllRegion = promiseAllRegions.find((region) => region.symbolName === 'loadBoth:effect:network#1');
const promiseAllSecondRegion = promiseAllRegions.find((region) => region.symbolName === 'loadBoth:effect:network#2');
assert.ok(promiseAllRegion);
assert.ok(promiseAllSecondRegion);
assert.equal(sourceTextForSpan(promiseAllSource, promiseAllRegion.sourceSpan), 'fetch(api.a)');
assert.equal(sourceTextForSpan(promiseAllSource, promiseAllSecondRegion.sourceSpan), 'fetch(api.b)');
assert.equal(promiseAllRegion.metadata.runtimeOrderEvidence.sameLinePromiseCombinator[0].methodName, 'all');
assert.equal(promiseAllRegion.metadata.runtimeOrderEvidence.sameLinePromiseCombinator[0].arrayElementOrdinal, 1);
assert.equal(promiseAllRegion.metadata.runtimeOrderEvidence.sameLinePromiseCombinator[0].arrayElementCount, 2);
assert.equal(promiseAllRegion.metadata.runtimeOrderEvidence.sameLinePromiseCombinator[0].runtimeEquivalenceClaim, false);
assert.equal(promiseAllSecondRegion.metadata.runtimeOrderEvidence.sameLinePromiseCombinator[0].arrayElementOrdinal, 2);
const promiseAllMerge = safeMergeJsTsSource({
  id: 'semantic_promise_all_concurrency_order_blocked',
  language: 'typescript',
  sourcePath: 'src/promise-all-order.ts',
  baseSourceText: promiseAllSource,
  workerSourceText: promiseAllSource.replace('fetch(api.a)', 'fetch(api.a, { cache: "reload" })'),
  headSourceText: promiseAllHeadSource
});
assert.equal(promiseAllMerge.admission.reasonCodes.includes('runtime-order-promise-combinator-merge-requires-concurrency-evidence'), true);
assert.equal(promiseAllMerge.admission.reasonCodes.includes('runtime-order-promise-combinator-runtime-equivalence-not-proven'), true);

const promiseChainSource = 'export function loadWithHandlers(api, report, cleanup) {\n  return fetch(api).then(parse).catch(report).finally(cleanup);\n}\n';
const promiseChainHeadSource = promiseChainSource.replace('.then(parse)', '.then(parseFresh)');
const promiseChainSidecar = createSemanticImportSidecar(importNativeSource({ language: 'typescript', sourcePath: 'src/promise-chain-order.ts', sourceText: promiseChainSource }), { generatedAt: 208 });
const promiseChainRegion = promiseChainSidecar.ownershipRegions
  .find((region) => region.symbolName === 'loadWithHandlers:effect:network#1');
assert.ok(promiseChainRegion);
assert.equal(sourceTextForSpan(promiseChainSource, promiseChainRegion.sourceSpan), 'fetch(api)');
const promiseChain = promiseChainRegion.metadata.runtimeOrderEvidence.sameLinePromiseChain[0];
assert.deepEqual(promiseChain.chainMethods, ['then', 'catch', 'finally']);
assert.equal(promiseChain.regionRole, 'source-promise');
assert.equal(promiseChain.stepCount, 3);
assert.equal(promiseChain.hasCatch, true);
assert.equal(promiseChain.hasFinally, true);
assert.equal(promiseChain.handlerExecutionEquivalenceClaim, false);
assert.equal(promiseChain.steps[0].handlerText, 'parse');
const promiseChainMerge = safeMergeJsTsSource({ id: 'semantic_promise_chain_order_blocked', language: 'typescript', sourcePath: 'src/promise-chain-order.ts', baseSourceText: promiseChainSource, workerSourceText: promiseChainSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })'), headSourceText: promiseChainHeadSource });
assert.equal(promiseChainMerge.admission.reasonCodes.includes('runtime-order-promise-chain-merge-requires-handler-order-evidence'), true);
assert.equal(promiseChainMerge.admission.reasonCodes.includes('runtime-order-promise-chain-runtime-equivalence-not-proven'), true);

const importMetaHostSource = 'export function assetUrl(name) {\n  return new URL(name, import.meta.url).href;\n}\n';
const importMetaHostSidecar = createSemanticImportSidecar(importNativeSource({ language: 'typescript', sourcePath: 'src/import-meta-host.ts', sourceText: importMetaHostSource }), { generatedAt: 206 });
const importMetaHostRegion = importMetaHostSidecar.ownershipRegions.find((region) => region.symbolName === 'assetUrl:effect:host-context#1');
assert.ok(importMetaHostRegion);
assert.equal(sourceTextForSpan(importMetaHostSource, importMetaHostRegion.sourceSpan).includes('import.meta.url'), true);
assert.equal(importMetaHostRegion.metadata.runtimeOrderEvidence.hostContext, 'import.meta');
assert.equal(importMetaHostRegion.metadata.runtimeOrderEvidence.importMetaHostContext[0].memberPath.join('.'), 'url');
const importMetaHostMerge = safeMergeJsTsSource({
  id: 'semantic_import_meta_host_context_blocked',
  language: 'typescript',
  sourcePath: 'src/import-meta-host.ts',
  baseSourceText: importMetaHostSource,
  workerSourceText: importMetaHostSource.replace('import.meta.url', 'import.meta.resolve(name)'),
  headSourceText: importMetaHostSource.replace('import.meta.url', 'import.meta.env.BASE_URL')
});
assert.equal(importMetaHostMerge.admission.reasonCodes.includes('effect-import-meta-merge-requires-host-context-evidence'), true);
assert.equal(importMetaHostMerge.admission.reasonCodes.includes('runtime-order-import-meta-merge-requires-host-context-evidence'), true);

const tryFinallyLoopSource = [
  'export function drain(queue, log) {',
  '  try {',
  '    while (queue.length) {',
  '      queue.shift();',
  '      return queue.length;',
  '    }',
  '  } finally {',
  '    log.push(queue.length);',
  '  }',
  '  return 0;',
  '}',
  ''
].join('\n');
const tryFinallyLoopSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/try-finally-order.ts',
  sourceText: tryFinallyLoopSource
}), { generatedAt: 207 });
const tryLoopMutationRegion = tryFinallyLoopSidecar.ownershipRegions
  .find((region) => region.symbolName === 'drain:mutation:mutating-call#1');
const finalizerMutationRegion = tryFinallyLoopSidecar.ownershipRegions
  .find((region) => region.symbolName === 'drain:mutation:mutating-call#2');
assert.ok(tryLoopMutationRegion);
assert.ok(finalizerMutationRegion);
assert.equal(sourceTextForSpan(tryFinallyLoopSource, tryLoopMutationRegion.sourceSpan), 'queue.shift()');
assert.equal(tryLoopMutationRegion.metadata.runtimeOrderEvidence.tryFinallyOrder[0].kind, 'try-finally');
assert.equal(tryLoopMutationRegion.metadata.runtimeOrderEvidence.tryFinallyOrder[0].finallyLine, 7);
assert.equal(tryLoopMutationRegion.metadata.runtimeOrderEvidence.tryFinallyOrder[0].enclosingLoop.text, 'while (queue.length)');
assert.equal(finalizerMutationRegion.metadata.runtimeOrderEvidence.tryFinallyOrder[0].kind, 'finalizer');
assert.equal(finalizerMutationRegion.metadata.runtimeOrderEvidence.tryFinallyOrder[0].text, 'finally');
const tryFinallyWorkerSource = tryFinallyLoopSource.replace('queue.shift();', 'queue.pop();');
const tryFinallyHeadSource = tryFinallyLoopSource.replace('log.push(queue.length);', 'log.push(queue.length, "done");');
const tryFinallyScript = createSemanticEditScript({
  id: 'semantic_try_finally_loop_order_blocked',
  language: 'typescript',
  sourcePath: 'src/try-finally-order.ts',
  baseSourceText: tryFinallyLoopSource,
  workerSourceText: tryFinallyWorkerSource,
  headSourceText: tryFinallyHeadSource,
  generatedAt: 208
});
assert.equal(tryFinallyScript.admission.status, 'conflict');
const tryFinallyOperation = tryFinallyScript.operations
  .find((operation) => operation.anchor.symbolName === 'drain:mutation:mutating-call#1');
assert.ok(tryFinallyOperation);
assert.equal(tryFinallyOperation.status, 'conflict');
assert.equal(tryFinallyOperation.reasonCodes.includes('head-order-sensitive-peer-changed-since-base'), true);
assert.equal(tryFinallyOperation.reasonCodes.includes('runtime-order-try-finally-merge-requires-completion-order-evidence'), true);
assert.equal(tryFinallyOperation.reasonCodes.includes('runtime-order-try-finally-loop-merge-requires-iteration-finalizer-order-evidence'), true);
assert.equal(tryFinallyOperation.reasonCodes.includes('runtime-order-finally-merge-requires-finalizer-order-evidence'), true);
const tryFinallyMerge = safeMergeJsTsSource({ id: 'semantic_try_finally_loop_safe_merge_blocked', language: 'typescript', sourcePath: 'src/try-finally-order.ts', baseSourceText: tryFinallyLoopSource, workerSourceText: tryFinallyWorkerSource, headSourceText: tryFinallyHeadSource });
assert.equal(tryFinallyMerge.status, 'blocked');
assert.equal(tryFinallyMerge.mergedSourceText, undefined);

const tryCatchThrowSource = [
  'export function parseOrFallback(input, log) {',
  '  try {',
  '    throw new Error(input);',
  '  } catch (error) {',
  '    log.push(error.message);',
  '    return null;',
  '  }',
  '}',
  ''
].join('\n');
const tryCatchThrowSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/try-catch-order.ts',
  sourceText: tryCatchThrowSource
}), { generatedAt: 209 });
const throwRegion = tryCatchThrowSidecar.ownershipRegions
  .find((region) => region.symbolName?.startsWith('parseOrFallback:controlFlow:exception#')
    && sourceTextForSpan(tryCatchThrowSource, region.sourceSpan).startsWith('throw '));
const catchMutationRegion = tryCatchThrowSidecar.ownershipRegions
  .find((region) => region.symbolName === 'parseOrFallback:mutation:mutating-call#1');
assert.ok(throwRegion);
assert.ok(catchMutationRegion);
assert.equal(throwRegion.symbolName, 'parseOrFallback:controlFlow:exception#2');
assert.equal(throwRegion.metadata.runtimeOrderEvidence.tryCatchOrder[0].kind, 'try-catch');
assert.equal(throwRegion.metadata.runtimeOrderEvidence.tryCatchOrder[0].catchLine, 4);
assert.equal(throwRegion.metadata.runtimeOrderEvidence.tryCatchOrder[0].catchText, 'catch (error)');
assert.equal(catchMutationRegion.metadata.runtimeOrderEvidence.tryCatchOrder[0].kind, 'catch-handler');
assert.equal(catchMutationRegion.metadata.runtimeOrderEvidence.tryCatchOrder[0].text, 'catch (error)');
const tryCatchThrowWorkerSource = tryCatchThrowSource.replace('log.push(error.message);', 'log.push(error.message, "worker");');
const tryCatchThrowHeadSource = tryCatchThrowSource.replace('return null;', 'return undefined;');
const tryCatchThrowScript = createSemanticEditScript({
  id: 'semantic_try_catch_throw_order_blocked',
  language: 'typescript',
  sourcePath: 'src/try-catch-order.ts',
  baseSourceText: tryCatchThrowSource,
  workerSourceText: tryCatchThrowWorkerSource,
  headSourceText: tryCatchThrowHeadSource,
  generatedAt: 210
});
assert.equal(tryCatchThrowScript.admission.status, 'conflict');
const tryCatchThrowOperation = tryCatchThrowScript.operations
  .find((operation) => operation.anchor.symbolName === catchMutationRegion.symbolName);
assert.ok(tryCatchThrowOperation);
assert.equal(tryCatchThrowOperation.status, 'conflict');
assert.equal(tryCatchThrowOperation.reasonCodes.includes('head-order-sensitive-peer-changed-since-base'), true);
assert.equal(tryCatchThrowOperation.reasonCodes.includes('runtime-order-try-catch-merge-requires-throw-catch-order-evidence'), true);
assert.equal(tryCatchThrowOperation.reasonCodes.includes('runtime-order-catch-merge-requires-handler-order-evidence'), true);
const tryCatchThrowMerge = safeMergeJsTsSource({
  id: 'semantic_try_catch_throw_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/try-catch-order.ts',
  baseSourceText: tryCatchThrowSource,
  workerSourceText: tryCatchThrowWorkerSource,
  headSourceText: tryCatchThrowHeadSource
});
assert.equal(tryCatchThrowMerge.status, 'blocked');
assert.equal(tryCatchThrowMerge.mergedSourceText, undefined);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
