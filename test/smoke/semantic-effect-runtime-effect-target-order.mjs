import { assert } from './helpers.mjs';
import { createSemanticEditScript, createSemanticImportSidecar, importNativeSource, safeMergeJsTsSource } from './compiler-api.mjs';

const effectTargetSource = [
  'export function loadTargets(api, target, url) {',
  '  fetch(api);',
  '  window.fetch(api);',
  '  window["fetch"](api);',
  '  const literalTarget = "fetch";',
  '  window[literalTarget](api);',
  '  let mutableTarget = "fetch";',
  '  window[mutableTarget](api);',
  '  window[target](api);',
  '  window?.fetch?.(api); globalThis?.["setTimeout"]?.(api); self?.queueMicrotask?.(api);',
  '  new Worker(url);',
  '  logger.info`loaded ${api}`;',
  '  logger["info"]`literal ${api}`;',
  '  const literalTag = "info";',
  '  logger[literalTag]`bound ${api}`;',
  '  logger[target]`dynamic ${api}`;',
  '  logger.info`first ${api}`; logger.warn`second ${api}`;',
  '  new Worker(url); new SharedWorker(url); new WebSocket(url);',
  '  clearTimeout(target); cancelAnimationFrame(target); requestIdleCallback(api); setImmediate(api); clearImmediate(target);',
  '}',
  ''
].join('\n');

const sidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  sourceText: effectTargetSource
}), { generatedAt: 225 });

const directFetch = effectRegion('fetch(api)');
const receiverFetch = effectRegion('window.fetch(api)');
const literalComputedFetch = effectRegion('window["fetch"](api)');
const boundComputedFetch = effectRegion('window[literalTarget](api)');
const mutableComputedFetch = effectRegion('window[mutableTarget](api)');
const dynamicComputedFetch = effectRegion('window[target](api)');
const optionalReceiverFetch = effectRegion('window?.fetch?.(api)');
const optionalComputedScheduler = effectRegion('globalThis?.["setTimeout"]?.(api)');
const optionalScheduler = effectRegion('self?.queueMicrotask?.(api)');
const workerConstructor = effectRegion('new Worker(url)');
const taggedTemplate = effectRegion('logger.info`loaded ${api}`');
const taggedTemplateLiteralComputed = effectRegion('logger["info"]`literal ${api}`');
const taggedTemplateBoundComputed = effectRegion('logger[literalTag]`bound ${api}`');
const taggedTemplateDynamicComputed = effectRegion('logger[target]`dynamic ${api}`');
const sameLineFirstTag = effectRegion('logger.info`first ${api}`');
const sameLineSecondTag = effectRegion('logger.warn`second ${api}`');
const sameLineWorkerConstructor = effectRegionAt('new Worker(url)', 2);
const sameLineSharedWorkerConstructor = effectRegion('new SharedWorker(url)');
const sameLineWebSocketConstructor = effectRegion('new WebSocket(url)');
const schedulerClearTimeout = effectRegion('clearTimeout(target)');
const schedulerCancelAnimationFrame = effectRegion('cancelAnimationFrame(target)');
const schedulerRequestIdleCallback = effectRegion('requestIdleCallback(api)');
const schedulerSetImmediate = effectRegion('setImmediate(api)');
const schedulerClearImmediate = effectRegion('clearImmediate(target)');

assert.equal(directFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'fetch');
assert.equal(directFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'fetch');
assert.equal(receiverFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].receiverText, 'window');
assert.equal(receiverFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'window.fetch');
assert.equal(literalComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyStatic, true);
assert.deepEqual(literalComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyKeys, ['fetch']);
assert.equal(literalComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyRuntimeEquivalenceClaim, false);
assert.equal(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyStatic, true);
assert.equal(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBoundLiteral, true);
assert.deepEqual(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyKeys, ['fetch']);
assert.deepEqual(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBindingNames, ['literalTarget']);
assert.deepEqual(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBindingKinds, ['same-scope-const-literal']);
assert.equal(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'fetch');
assert.equal(boundComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].runtimeEquivalenceClaim, false);
assert.equal(mutableComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyDynamic, true);
assert.equal(mutableComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBoundLiteral, undefined);
assert.equal(dynamicComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyDynamic, true);
assert.equal(dynamicComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyCount, 1);
assert.equal(dynamicComputedFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].runtimeEquivalenceClaim, false);
assert.equal(optionalReceiverFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'window?.fetch');
assert.equal(optionalReceiverFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].receiverText, 'window');
assert.equal(optionalReceiverFetch.metadata.runtimeOrderEvidence.effectTargetOrder[0].optionalCall, true);
assert.equal(optionalComputedScheduler.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'globalThis?.["setTimeout"]');
assert.deepEqual(optionalComputedScheduler.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyKeys, ['setTimeout']);
assert.equal(optionalComputedScheduler.metadata.runtimeOrderEvidence.effectTargetOrder[0].optionalCall, true);
assert.equal(optionalScheduler.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'self?.queueMicrotask');
assert.equal(optionalScheduler.metadata.runtimeOrderEvidence.effectTargetOrder[0].optionalCall, true);
assert.equal(workerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].constructorCall, true);
assert.equal(workerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'Worker');
assert.equal(taggedTemplate.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.equal(taggedTemplate.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'logger.info');
assert.equal(taggedTemplate.metadata.runtimeOrderEvidence.effectTargetOrder[0].receiverText, 'logger');
assert.equal(taggedTemplate.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'info');
assert.equal(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.equal(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'logger["info"]');
assert.equal(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].receiverText, 'logger');
assert.equal(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'info');
assert.equal(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyStatic, true);
assert.deepEqual(taggedTemplateLiteralComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyKeys, ['info']);
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'logger[literalTag]');
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].receiverText, 'logger');
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].calleeName, 'info');
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyStatic, true);
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBoundLiteral, true);
assert.deepEqual(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyKeys, ['info']);
assert.deepEqual(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyBindingNames, ['literalTag']);
assert.equal(taggedTemplateBoundComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].runtimeEquivalenceClaim, false);
assert.equal(taggedTemplateDynamicComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.equal(taggedTemplateDynamicComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyDynamic, true);
assert.equal(taggedTemplateDynamicComputed.metadata.runtimeOrderEvidence.effectTargetOrder[0].computedPropertyRuntimeEquivalenceClaim, false);
assert.equal(sameLineFirstTag.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'logger.info');
assert.equal(sameLineSecondTag.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'logger.warn');
assert.equal(sameLineFirstTag.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.equal(sameLineSecondTag.metadata.runtimeOrderEvidence.effectTargetOrder[0].taggedTemplate, true);
assert.notEqual(sameLineFirstTag.id, sameLineSecondTag.id);
assert.equal(sameLineWorkerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'Worker');
assert.equal(sameLineSharedWorkerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'SharedWorker');
assert.equal(sameLineWebSocketConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'WebSocket');
assert.equal(sameLineWorkerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].constructorCall, true);
assert.equal(sameLineSharedWorkerConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].constructorCall, true);
assert.equal(sameLineWebSocketConstructor.metadata.runtimeOrderEvidence.effectTargetOrder[0].constructorCall, true);
assert.notEqual(sameLineWorkerConstructor.id, sameLineSharedWorkerConstructor.id);
assert.equal(schedulerClearTimeout.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'clearTimeout');
assert.equal(schedulerCancelAnimationFrame.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'cancelAnimationFrame');
assert.equal(schedulerRequestIdleCallback.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'requestIdleCallback');
assert.equal(schedulerSetImmediate.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'setImmediate');
assert.equal(schedulerClearImmediate.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText, 'clearImmediate');
assert.notEqual(schedulerClearTimeout.id, schedulerCancelAnimationFrame.id);

const targetHeadSource = effectTargetSource.replace('window[target](api);', 'window[otherTarget](api);');
const targetWorkerSource = effectTargetSource.replace('window[target](api);', 'window[target](api, { cache: "reload" });');
const targetScript = createSemanticEditScript({
  id: 'semantic_effect_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: targetWorkerSource,
  headSourceText: targetHeadSource,
  generatedAt: 226
});
const targetOperation = targetScript.operations
  .find((operation) => operation.anchor.symbolName === dynamicComputedFetch.symbolName);
assert.equal(targetScript.admission.status, 'conflict');
assert.equal(targetOperation.status, 'conflict');
assert.equal(targetOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-effect-target-evidence'), true);
assert.equal(targetOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-dynamic-computed-key-evidence'), true);

const boundTargetHeadSource = effectTargetSource.replace('window[literalTarget](api);', 'window["fetch"](api);');
const boundTargetWorkerSource = effectTargetSource.replace('window[literalTarget](api);', 'window[literalTarget](api, { cache: "reload" });');
const boundTargetScript = createSemanticEditScript({
  id: 'semantic_bound_effect_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: boundTargetWorkerSource,
  headSourceText: boundTargetHeadSource,
  generatedAt: 233
});
const boundTargetOperation = boundTargetScript.operations
  .find((operation) => operation.anchor.symbolName === boundComputedFetch.symbolName);
assert.equal(boundTargetScript.admission.status, 'conflict');
assert.equal(boundTargetOperation.status, 'conflict');
assert.equal(boundTargetOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-bound-computed-literal-key-evidence'), true);
assert.equal(boundTargetOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-dynamic-computed-key-evidence'), false);

const optionalHeadSource = effectTargetSource.replace('window?.fetch?.(api);', 'window.fetch(api);');
const optionalWorkerSource = effectTargetSource.replace('window?.fetch?.(api);', 'window?.fetch?.(api, { trace: true });');
const optionalScript = createSemanticEditScript({
  id: 'semantic_optional_effect_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: optionalWorkerSource,
  headSourceText: optionalHeadSource,
  generatedAt: 232
});
const optionalOperation = optionalScript.operations
  .find((operation) => operation.anchor.symbolName === optionalReceiverFetch.symbolName);
assert.equal(optionalScript.admission.status, 'conflict');
assert.equal(optionalOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-nullish-boundary-evidence'), true);

const tagHeadSource = effectTargetSource.replace('logger.info`loaded ${api}`;', 'logger.warn`loaded ${api}`;');
const tagWorkerSource = effectTargetSource.replace('logger.info`loaded ${api}`;', 'logger.info`loaded ${api.id}`;');
const tagScript = createSemanticEditScript({
  id: 'semantic_effect_tagged_template_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: tagWorkerSource,
  headSourceText: tagHeadSource,
  generatedAt: 227
});
const tagOperation = tagScript.operations
  .find((operation) => operation.anchor.symbolName === taggedTemplate.symbolName);
assert.equal(tagScript.admission.status, 'blocked');
assert.equal(tagOperation.status, 'blocked');
assert.equal(tagOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-tagged-template-target-evidence'), true);

const computedTagHeadSource = effectTargetSource.replace('logger[target]`dynamic ${api}`;', 'logger[otherTarget]`dynamic ${api}`;');
const computedTagWorkerSource = effectTargetSource.replace('logger[target]`dynamic ${api}`;', 'logger[target]`dynamic ${api.id}`;');
const computedTagScript = createSemanticEditScript({
  id: 'semantic_effect_computed_tagged_template_target_order_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: computedTagWorkerSource,
  headSourceText: computedTagHeadSource,
  generatedAt: 228
});
const computedTagOperation = computedTagScript.operations
  .find((operation) => operation.anchor.symbolName === taggedTemplateDynamicComputed.symbolName);
assert.equal(computedTagScript.admission.status, 'blocked');
assert.equal(computedTagOperation.status, 'blocked');
assert.equal(computedTagOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-tagged-template-target-evidence'), true);
assert.equal(computedTagOperation.reasonCodes.includes('runtime-order-effect-target-merge-requires-dynamic-computed-key-evidence'), true);

const targetMerge = safeMergeJsTsSource({
  id: 'semantic_effect_target_safe_merge_blocked',
  language: 'typescript',
  sourcePath: 'src/effect-target-order.ts',
  baseSourceText: effectTargetSource,
  workerSourceText: targetWorkerSource,
  headSourceText: targetHeadSource
});
assert.equal(targetMerge.status, 'blocked');
assert.equal(targetMerge.mergedSourceText, undefined);

const compactConstructorSource = 'export function boot(url) { const w = new Worker(url); const s = new SharedWorker(url); const ws = new WebSocket(url); }\n';
const compactConstructorSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/compact-constructors.ts',
  sourceText: compactConstructorSource
}), { generatedAt: 229 });
const compactConstructorTargets = ['Worker', 'SharedWorker', 'WebSocket'].map((target) => {
  const region = compactConstructorSidecar.ownershipRegions.find((candidate) => candidate.regionKind === 'effect'
    && sourceTextForSpan(compactConstructorSource, candidate.sourceSpan).includes(`new ${target}(url)`));
  assert.ok(region, `expected compact constructor region for ${target}`);
  return region.metadata.runtimeOrderEvidence.effectTargetOrder[0];
});
assert.deepEqual(compactConstructorTargets.map((target) => target.targetText), ['Worker', 'SharedWorker', 'WebSocket']);
assert.deepEqual(compactConstructorTargets.map((target) => target.constructorCall), [true, true, true]);

const compactSchedulerSource = 'export function timers(timer) { clearTimeout(timer); cancelAnimationFrame(timer); requestIdleCallback(timer); clearImmediate(timer); }\n';
const compactSchedulerSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/compact-schedulers.ts',
  sourceText: compactSchedulerSource
}), { generatedAt: 230 });
const compactSchedulerTargets = ['clearTimeout', 'cancelAnimationFrame', 'requestIdleCallback', 'clearImmediate'].map((target) => {
  const region = compactSchedulerSidecar.ownershipRegions.find((candidate) => candidate.regionKind === 'effect'
    && sourceTextForSpan(compactSchedulerSource, candidate.sourceSpan).includes(`${target}(timer)`));
  assert.ok(region, `expected compact scheduler region for ${target}`);
  return region.metadata.runtimeOrderEvidence.effectTargetOrder[0].targetText;
});
assert.deepEqual(compactSchedulerTargets, ['clearTimeout', 'cancelAnimationFrame', 'requestIdleCallback', 'clearImmediate']);

const compactGlobalPropertySource = 'export function globals(api) { window["fetch"](api); globalThis["setTimeout"](api); self["queueMicrotask"](api); }\n';
const compactGlobalPropertySidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/compact-global-properties.ts',
  sourceText: compactGlobalPropertySource
}), { generatedAt: 231 });
const compactGlobalPropertyTargets = [
  ['window["fetch"](api)', 'window["fetch"]', 'fetch'],
  ['globalThis["setTimeout"](api)', 'globalThis["setTimeout"]', 'setTimeout'],
  ['self["queueMicrotask"](api)', 'self["queueMicrotask"]', 'queueMicrotask']
].map(([text, targetText, key]) => {
  const region = compactGlobalPropertySidecar.ownershipRegions.find((candidate) => candidate.regionKind === 'effect'
    && sourceTextForSpan(compactGlobalPropertySource, candidate.sourceSpan).includes(text));
  assert.ok(region, `expected compact global property region for ${text}`);
  const target = region.metadata.runtimeOrderEvidence.effectTargetOrder[0];
  assert.equal(target.targetText, targetText);
  assert.deepEqual(target.computedPropertyKeys, [key]);
  return target.targetText;
});
assert.deepEqual(compactGlobalPropertyTargets, ['window["fetch"]', 'globalThis["setTimeout"]', 'self["queueMicrotask"]']);

function effectRegion(text) {
  const region = sidecar.ownershipRegions.find((candidate) => candidate.regionKind === 'effect'
    && sourceTextForSpan(effectTargetSource, candidate.sourceSpan).includes(text)
    && candidate.metadata?.runtimeOrderEvidence?.effectTargetOrder?.length);
  assert.ok(region, `expected effect target region for ${text}`);
  return region;
}

function effectRegionAt(text, ordinal) {
  const regions = sidecar.ownershipRegions.filter((candidate) => candidate.regionKind === 'effect'
    && sourceTextForSpan(effectTargetSource, candidate.sourceSpan).includes(text)
    && candidate.metadata?.runtimeOrderEvidence?.effectTargetOrder?.length);
  const region = regions[ordinal - 1];
  assert.ok(region, `expected effect target region #${ordinal} for ${text}`);
  return region;
}

function sourceTextForSpan(sourceText, span) {
  const lines = String(sourceText ?? '').split(/\r\n|\n|\r/);
  if (!span) return '';
  if (span.startLine === span.endLine) {
    return lines[span.startLine - 1].slice(span.startColumn - 1, span.endColumn - 1);
  }
  return lines.slice(span.startLine - 1, span.endLine).join('\n');
}
