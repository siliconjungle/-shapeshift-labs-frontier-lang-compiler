import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';
import { effectTargetProofReasonCodes, effectTargetSurfaceExpectation } from './runtimeOrderEffectTargetProofSurface.js';

function runtimeOrderSurfaceExpectations(region) {
  const resourceOrderRecords = resourceManagementOrderRecords(region);
  const generatorRecords = generatorProtocolRecords(region);
  const promiseCombinatorRecords = promiseCombinatorOrderRecords(region);
  const promiseChainRecords = promiseChainOrderRecords(region);
  const generatorKinds = runtimeKinds(region);
  return {
    importMetaHostContextHash: importMetaHostContextHash(region),
    ...effectTargetSurfaceExpectation(region),
    promiseCombinatorOrderHash: promiseCombinatorOrderHash(region, promiseCombinatorRecords),
    promiseCombinatorNeedsElementTrace: promiseCombinatorRecords.some((record) => record.arrayElementOrdinal),
    promiseCombinatorMethods: uniqueStrings(promiseCombinatorRecords.map((record) => record.methodName)),
    promiseChainOrderHash: promiseChainOrderHash(region, promiseChainRecords),
    promiseChainNeedsRejectionTrace: promiseChainRecords.some((record) => record.hasCatch),
    promiseChainNeedsFinalizerTrace: promiseChainRecords.some((record) => record.hasFinally),
    resourceManagementOrderHash: resourceManagementOrderHash(region, resourceOrderRecords),
    resourceManagementNeedsAsyncTrace: resourceOrderRecords.some((record) => record.awaitUsing || record.declarationKind === 'await-using'),
    generatorProtocolOrderHash: generatorProtocolOrderHash(region, generatorRecords),
    generatorProtocolNeedsIteratorTrace: generatorRecords.some((record) => record.delegated),
    generatorProtocolNeedsAsyncIteratorTrace: generatorKinds.includes('async') && (generatorKinds.includes('generator') || generatorRecords.length > 0),
    classStaticBlockOrderHash: classStaticBlockOrderHash(region),
    topLevelAwaitOrderHash: topLevelAwaitOrderHash(region)
  };
}

function runtimeOrderProofSurfaceReasonCodes(candidate, expected) {
  return uniqueStrings([
    ...importMetaHostContextProofReasonCodes(candidate, expected),
    ...effectTargetProofReasonCodes(candidate, expected),
    ...promiseCombinatorProofReasonCodes(candidate, expected),
    ...promiseChainProofReasonCodes(candidate, expected),
    ...resourceManagementProofReasonCodes(candidate, expected),
    ...generatorProtocolProofReasonCodes(candidate, expected),
    ...classStaticBlockProofReasonCodes(candidate, expected),
    ...topLevelAwaitProofReasonCodes(candidate, expected)
  ]);
}

function importMetaHostContextProofReasonCodes(candidate, expected) {
  if (!expected.runtimeKinds.includes('host-context') && !expected.importMetaHostContextHash) return [];
  const reasonCodes = [];
  if (candidate.importMetaHostContextEquivalenceClaim !== false || candidate.hostRuntimeResolutionEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const contextHash = firstString(candidate.importMetaHostContextHash, candidate.hostContextMemberHash);
  if (expected.importMetaHostContextHash && !contextHash) reasonCodes.push('runtime-order-explicit-evidence-import-meta-host-context-hash-missing');
  else if (expected.importMetaHostContextHash && contextHash !== expected.importMetaHostContextHash) reasonCodes.push('runtime-order-explicit-evidence-import-meta-host-context-hash-mismatch');
  if (!firstString(candidate.importMetaHostResolutionTraceHash, candidate.hostContextResolutionTraceHash, candidate.importMetaHostRuntimeTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-import-meta-host-context-trace-missing');
  return reasonCodes;
}

function promiseCombinatorProofReasonCodes(candidate, expected) {
  if (!expected.promiseCombinatorOrderHash) return [];
  const reasonCodes = [];
  if (candidate.promiseCombinatorRuntimeEquivalenceClaim !== false || candidate.promiseConcurrencyEquivalenceClaim !== false || candidate.promiseSettlementEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.promiseCombinatorNeedsElementTrace && candidate.promiseElementOrderEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.promiseCombinatorOrderHash, candidate.promiseConcurrencyOrderHash);
  if (!orderHash) reasonCodes.push('runtime-order-explicit-evidence-promise-combinator-order-hash-missing');
  else if (orderHash !== expected.promiseCombinatorOrderHash) reasonCodes.push('runtime-order-explicit-evidence-promise-combinator-order-hash-mismatch');
  if (!firstString(candidate.promiseCombinatorConcurrencyTraceHash, candidate.promiseConcurrencyTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-combinator-concurrency-trace-missing');
  if (!firstString(candidate.promiseCombinatorSettlementTraceHash, candidate.promiseSettlementTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-combinator-settlement-trace-missing');
  if (expected.promiseCombinatorNeedsElementTrace && !firstString(candidate.promiseCombinatorElementOrderTraceHash, candidate.promiseElementOrderTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-combinator-element-order-trace-missing');
  if (expected.promiseCombinatorMethods.includes('all') && !firstString(candidate.promiseAllSettlementTraceHash, candidate.promiseCombinatorAllSettlementTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-all-settlement-trace-missing');
  if (expected.promiseCombinatorMethods.includes('allSettled') && !firstString(candidate.promiseAllSettledRecordTraceHash, candidate.promiseCombinatorAllSettledRecordTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-all-settled-record-trace-missing');
  if (expected.promiseCombinatorMethods.includes('race') && !firstString(candidate.promiseRaceFirstSettlementTraceHash, candidate.promiseCombinatorRaceFirstSettlementTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-race-first-settlement-trace-missing');
  if (expected.promiseCombinatorMethods.includes('any') && !firstString(candidate.promiseAnyFirstFulfillmentTraceHash, candidate.promiseCombinatorAnyFirstFulfillmentTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-any-first-fulfillment-trace-missing');
  return reasonCodes;
}

function promiseChainProofReasonCodes(candidate, expected) {
  if (!expected.promiseChainOrderHash) return [];
  const reasonCodes = [];
  if (candidate.promiseChainRuntimeEquivalenceClaim !== false || candidate.promiseHandlerExecutionEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.promiseChainNeedsRejectionTrace && candidate.promiseRejectionFlowEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  if (expected.promiseChainNeedsFinalizerTrace && candidate.promiseFinalizerEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.promiseChainOrderHash, candidate.promiseHandlerOrderHash);
  if (!orderHash) reasonCodes.push('runtime-order-explicit-evidence-promise-chain-order-hash-missing');
  else if (orderHash !== expected.promiseChainOrderHash) reasonCodes.push('runtime-order-explicit-evidence-promise-chain-order-hash-mismatch');
  if (!firstString(candidate.promiseChainHandlerOrderTraceHash, candidate.promiseHandlerOrderTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-chain-handler-order-trace-missing');
  if (expected.promiseChainNeedsRejectionTrace && !firstString(candidate.promiseChainRejectionFlowTraceHash, candidate.promiseRejectionFlowTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-chain-rejection-flow-trace-missing');
  if (expected.promiseChainNeedsFinalizerTrace && !firstString(candidate.promiseChainFinalizerTraceHash, candidate.promiseFinalizerTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-promise-chain-finalizer-trace-missing');
  return reasonCodes;
}

function resourceManagementProofReasonCodes(candidate, expected) {
  if (!expected.runtimeKinds.includes('resource-management')) return [];
  const reasonCodes = [];
  if (candidate.disposalEffectEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.resourceManagementDisposalOrderHash, candidate.disposalOrderHash);
  if (expected.resourceManagementOrderHash && !orderHash) reasonCodes.push('runtime-order-explicit-evidence-resource-management-disposal-order-hash-missing');
  else if (expected.resourceManagementOrderHash && orderHash !== expected.resourceManagementOrderHash) reasonCodes.push('runtime-order-explicit-evidence-resource-management-disposal-order-hash-mismatch');
  const asyncTraceHash = firstString(candidate.resourceManagementAsyncDisposalTraceHash, candidate.asyncDisposalTraceHash, candidate.disposalTraceHash);
  if (expected.resourceManagementNeedsAsyncTrace && !asyncTraceHash) reasonCodes.push('runtime-order-explicit-evidence-resource-management-async-disposal-trace-missing');
  return reasonCodes;
}

function generatorProtocolProofReasonCodes(candidate, expected) {
  if (!expected.runtimeKinds.includes('generator') && !expected.generatorProtocolOrderHash) return [];
  const reasonCodes = [];
  if (candidate.generatorRuntimeEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.generatorProtocolOrderHash, candidate.iteratorProtocolOrderHash, candidate.asyncGeneratorProtocolOrderHash, candidate.asyncIteratorProtocolOrderHash);
  if (expected.generatorProtocolOrderHash && !orderHash) reasonCodes.push('runtime-order-explicit-evidence-generator-protocol-order-hash-missing');
  else if (expected.generatorProtocolOrderHash && orderHash !== expected.generatorProtocolOrderHash) reasonCodes.push('runtime-order-explicit-evidence-generator-protocol-order-hash-mismatch');
  if (!firstString(candidate.generatorProtocolTraceHash, candidate.iteratorProtocolTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-generator-protocol-trace-missing');
  if (expected.generatorProtocolNeedsAsyncIteratorTrace) {
    if (!firstString(candidate.asyncGeneratorProtocolTraceHash, candidate.asyncIteratorProtocolTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-async-generator-protocol-trace-missing');
    if (!firstString(candidate.asyncGeneratorCancellationTraceHash, candidate.asyncIteratorCancellationTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-async-generator-cancellation-trace-missing');
    if (!firstString(candidate.asyncGeneratorBackpressureTraceHash, candidate.asyncIteratorBackpressureTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-async-generator-backpressure-trace-missing');
    if (candidate.asyncGeneratorRuntimeEquivalenceClaim !== false || candidate.asyncIteratorProtocolEquivalenceClaim !== false || candidate.asyncIteratorCancellationEquivalenceClaim !== false || candidate.asyncIteratorBackpressureEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  }
  if (expected.generatorProtocolNeedsIteratorTrace) {
    if (!firstString(candidate.iteratorProtocolTraceHash, candidate.generatorIteratorTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-generator-iterator-protocol-trace-missing');
    if (!firstString(candidate.delegatedCompletionTraceHash, candidate.generatorCompletionTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-generator-completion-trace-missing');
    if (candidate.iteratorProtocolEquivalenceClaim !== false || candidate.delegatedCompletionPropagationClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  }
  return reasonCodes;
}

function classStaticBlockProofReasonCodes(candidate, expected) {
  if (!expected.runtimeKinds.includes('class-static-block') && !expected.classStaticBlockOrderHash) return [];
  const reasonCodes = [];
  if (candidate.classStaticBlockRuntimeEquivalenceClaim !== false || candidate.staticInitializationEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.classStaticBlockOrderHash, candidate.staticInitializationOrderHash);
  if (expected.classStaticBlockOrderHash && !orderHash) reasonCodes.push('runtime-order-explicit-evidence-class-static-block-order-hash-missing');
  else if (expected.classStaticBlockOrderHash && orderHash !== expected.classStaticBlockOrderHash) reasonCodes.push('runtime-order-explicit-evidence-class-static-block-order-hash-mismatch');
  if (!firstString(candidate.classStaticBlockExecutionTraceHash, candidate.staticInitializationTraceHash, candidate.classStaticBlockEffectTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-class-static-block-execution-trace-missing');
  return reasonCodes;
}

function topLevelAwaitProofReasonCodes(candidate, expected) {
  if (!expected.topLevelAwaitOrderHash) return [];
  const reasonCodes = [];
  if (candidate.topLevelAwaitSuspensionEquivalenceClaim !== false || candidate.moduleEvaluationOrderEquivalenceClaim !== false) reasonCodes.push('runtime-order-explicit-evidence-claim-flags-missing');
  const orderHash = firstString(candidate.topLevelAwaitOrderHash, candidate.topLevelAwaitSuspensionOrderHash);
  if (!orderHash) reasonCodes.push('runtime-order-explicit-evidence-top-level-await-order-hash-missing');
  else if (orderHash !== expected.topLevelAwaitOrderHash) reasonCodes.push('runtime-order-explicit-evidence-top-level-await-order-hash-mismatch');
  if (!firstString(candidate.topLevelAwaitSuspensionTraceHash, candidate.moduleEvaluationTraceHash)) reasonCodes.push('runtime-order-explicit-evidence-top-level-await-suspension-trace-missing');
  return reasonCodes;
}

function importMetaHostContextHash(region) {
  const evidence = region?.metadata?.runtimeOrderEvidence ?? region?.runtimeOrderEvidence;
  const records = array(evidence?.importMetaHostContext);
  return records.length ? hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.importMetaHostContext',
    sourcePath: region?.sourcePath,
    regionKind: runtimeRegionKind(region),
    runtimeKind: region?.runtimeKind,
    symbolName: region?.symbolName,
    ordinal: region?.ordinal,
    hostContext: evidence?.hostContext,
    importMetaMemberNames: evidence?.importMetaMemberNames,
    records: records.map(importMetaHostContextRecordForHash)
  }) : undefined;
}

function importMetaHostContextRecordForHash(record) {
  return { kind: record?.kind, ordinal: record?.ordinal, text: record?.text, memberName: record?.memberName, memberPath: record?.memberPath };
}

function promiseCombinatorOrderHash(region, records = promiseCombinatorOrderRecords(region)) {
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.promiseCombinatorOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records: records.map(promiseCombinatorRecordForHash) }) : undefined;
}

function promiseCombinatorRecordForHash(record) {
  return { kind: record?.kind, methodName: record?.methodName, concurrencySemantics: record?.concurrencySemantics, settlementPolicy: record?.settlementPolicy, argumentOrdinal: record?.argumentOrdinal, argumentText: record?.argumentText, directArrayArgument: record?.directArrayArgument === true, arrayElementOrdinal: record?.arrayElementOrdinal, arrayElementCount: record?.arrayElementCount, arrayElementText: record?.arrayElementText, callText: record?.callText, runtimeEquivalenceClaim: record?.runtimeEquivalenceClaim, semanticEquivalenceClaim: record?.semanticEquivalenceClaim };
}

function promiseCombinatorOrderRecords(region) {
  return array(region?.metadata?.runtimeOrderEvidence?.sameLinePromiseCombinator ?? region?.runtimeOrderEvidence?.sameLinePromiseCombinator);
}

function promiseChainOrderHash(region, records = promiseChainOrderRecords(region)) {
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.promiseChainOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records: records.map(promiseChainRecordForHash) }) : undefined;
}

function promiseChainRecordForHash(record) {
  return { kind: record?.kind, regionRole: record?.regionRole, handlerMethodName: record?.handlerMethodName, handlerStepOrdinal: record?.handlerStepOrdinal, chainMethods: array(record?.chainMethods), stepCount: record?.stepCount, hasThen: record?.hasThen === true, hasCatch: record?.hasCatch === true, hasFinally: record?.hasFinally === true, chainText: record?.chainText, steps: array(record?.steps).map(promiseChainStepForHash), handlerExecutionEquivalenceClaim: record?.handlerExecutionEquivalenceClaim, runtimeEquivalenceClaim: record?.runtimeEquivalenceClaim, semanticEquivalenceClaim: record?.semanticEquivalenceClaim };
}

function promiseChainStepForHash(step) {
  return { ordinal: step?.ordinal, methodName: step?.methodName, handlerText: step?.handlerText, handlerOrdinal: step?.handlerOrdinal };
}

function promiseChainOrderRecords(region) {
  return array(region?.metadata?.runtimeOrderEvidence?.sameLinePromiseChain ?? region?.runtimeOrderEvidence?.sameLinePromiseChain);
}

function classStaticBlockOrderHash(region) {
  const records = classStaticBlockOrderRecords(region);
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.classStaticBlockOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records: records.map(classStaticBlockOrderRecordForHash) }) : undefined;
}

function classStaticBlockOrderRecordForHash(record) {
  return { kind: record?.kind, className: record?.className, ordinal: record?.ordinal, statementCount: record?.statementCount, line: record?.line, column: record?.column, text: record?.text };
}

function classStaticBlockOrderRecords(region) {
  return array(region?.metadata?.runtimeOrderEvidence?.classStaticBlockOrder ?? region?.runtimeOrderEvidence?.classStaticBlockOrder);
}

function topLevelAwaitOrderHash(region) {
  const records = topLevelAwaitOrderRecords(region);
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.topLevelAwaitOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records }) : undefined;
}

function topLevelAwaitOrderRecords(region) {
  const evidence = region?.metadata?.runtimeOrderEvidence ?? region?.runtimeOrderEvidence;
  return evidence?.topLevelAwait ? [...array(evidence.sameLineAwaitOrder).map((record) => ({ kind: record?.kind, ordinal: record?.ordinal, text: record?.text })), { kind: 'top-level-await', runtimeScope: evidence.runtimeScope, line: evidence.line, runtimeOrderIndex: evidence.runtimeOrderIndex, previousRegionKind: evidence.previousRegionKind, previousRuntimeKind: evidence.previousRuntimeKind, previousRuntimeKinds: evidence.previousRuntimeKinds }] : [];
}

function generatorProtocolOrderHash(region, records = generatorProtocolRecords(region)) {
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.generatorProtocolOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records: records.map(generatorProtocolRecordForHash) }) : undefined;
}

function generatorProtocolRecordForHash(record) {
  return { kind: record?.kind, delegated: record?.delegated === true, delegationKind: record?.delegationKind, delegatedIterableText: record?.delegatedIterableText, line: record?.line, column: record?.column, targetText: record?.targetText, calleeName: record?.calleeName, effectKind: record?.effectKind, iteratorProtocolEquivalenceClaim: record?.iteratorProtocolEquivalenceClaim, delegatedCompletionPropagationClaim: record?.delegatedCompletionPropagationClaim };
}

function generatorProtocolRecords(region) {
  const evidence = region?.metadata?.runtimeOrderEvidence ?? region?.runtimeOrderEvidence;
  return [...array(evidence?.exitOrder), ...array(evidence?.effectTargetOrder), ...array(evidence?.sameLineYieldOrder)].filter(isGeneratorProtocolRecord);
}

function isGeneratorProtocolRecord(record) {
  return record?.kind === 'yield' || record?.effectKind === 'generator' || record?.delegated === true || record?.delegationKind === 'iterator-delegation';
}

function runtimeKinds(region) {
  return uniqueStrings([
    ...array(region?.runtimeKinds),
    ...array(region?.runtimeKind),
    ...array(region?.metadata?.factKinds),
    ...array(region?.metadata?.factKind)
  ].flatMap((kind) => String(kind ?? '').split('+')).filter(Boolean));
}

function resourceManagementOrderHash(region, records = resourceManagementOrderRecords(region)) {
  return records.length ? hashSemanticValue({ kind: 'frontier.lang.runtimeOrderProofEvidence.resourceManagementDisposalOrder', sourcePath: region?.sourcePath, regionKind: runtimeRegionKind(region), runtimeKind: region?.runtimeKind, symbolName: region?.symbolName, ordinal: region?.ordinal, records: records.map(resourceManagementOrderRecordForHash) }) : undefined;
}

function resourceManagementOrderRecordForHash(record) {
  return { name: record?.name, declarationKind: record?.declarationKind, awaitUsing: record?.awaitUsing === true, acquisitionOrderIndex: record?.acquisitionOrderIndex, disposalOrderIndex: record?.disposalOrderIndex, disposalOrder: record?.disposalOrder, scopeStartLine: record?.scopeStartLine, scopeExitLine: record?.scopeExitLine, declarationText: record?.declarationText, initializerText: record?.initializerText, disposalMethodPolicy: record?.disposalMethodPolicy };
}

function resourceManagementOrderRecords(region) {
  return array(region?.metadata?.runtimeOrderEvidence?.resourceManagementOrder ?? region?.runtimeOrderEvidence?.resourceManagementOrder);
}

function runtimeRegionKind(region) { return String(region?.regionKind ?? ''); }
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function array(value) { return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]; }

export { runtimeOrderProofSurfaceReasonCodes, runtimeOrderSurfaceExpectations };
