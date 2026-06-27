import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const promiseChainSource = 'export function loadWithHandlers(api, report, cleanup) {\n  return fetch(api).then(parse).catch(report).finally(cleanup);\n}\n';
const promiseChainWorkerSource = promiseChainSource.replace('fetch(api)', 'fetch(api, { cache: "reload" })');
const promiseChainHeadSource = promiseChainSource.replace('.then(parse)', '.then(parseFresh)');
const promiseChainBaseRecord = runtimeRecordFromSource('promise_chain_base', 'src/promise-chain-proof.ts', promiseChainSource, promiseChainRecord);
const promiseChainWorkerRecord = runtimeRecordFromSource('promise_chain_worker', 'src/promise-chain-proof.ts', promiseChainWorkerSource, promiseChainRecord);
const promiseChainHeadRecord = runtimeRecordFromSource('promise_chain_head', 'src/promise-chain-proof.ts', promiseChainHeadSource, promiseChainRecord);

assert.deepEqual(promiseChainBaseRecord.runtimeOrderEvidence.sameLinePromiseChain[0].chainMethods, ['then', 'catch', 'finally']);
assert.equal(promiseChainBaseRecord.runtimeOrderEvidence.sameLinePromiseChain[0].handlerExecutionEquivalenceClaim, false);

const promiseChainConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}));
assert.equal(promiseChainConflicts.length, 1);
assert.equal(promiseChainConflicts[0].details.reasonCodes.includes('runtime-order-promise-chain-merge-requires-handler-order-evidence'), true);

const validPromiseChainProof = promiseChainProof(promiseChainWorkerRecord, {
  baseRecord: promiseChainBaseRecord,
  workerRecord: promiseChainWorkerRecord,
  headRecord: promiseChainHeadRecord
});
const provedPromiseChainConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}), { runtimeOrderEvidence: validPromiseChainProof });
assert.equal(provedPromiseChainConflicts.length, 0);

const missingPromiseChainRejection = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseChainProof, promiseChainRejectionFlowTraceHash: undefined } });
assert.equal(missingPromiseChainRejection.length, 1);
assert.equal(missingPromiseChainRejection[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-chain-rejection-flow-trace-missing'), true);

const missingPromiseChainFinalizer = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseChainProof, promiseChainFinalizerTraceHash: undefined } });
assert.equal(missingPromiseChainFinalizer.length, 1);
assert.equal(missingPromiseChainFinalizer[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-chain-finalizer-trace-missing'), true);

const mismatchedPromiseChainHash = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseChainProof, promiseChainOrderHash: 'sha256:mismatched-promise-chain-order' } });
assert.equal(mismatchedPromiseChainHash.length, 1);
assert.equal(mismatchedPromiseChainHash[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-chain-order-hash-mismatch'), true);

const claimBearingPromiseChain = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseChainBaseRecord,
  worker: promiseChainWorkerRecord,
  head: promiseChainHeadRecord,
  output: promiseChainWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseChainProof, promiseHandlerExecutionEquivalenceClaim: true } });
assert.equal(claimBearingPromiseChain.length, 1);
assert.equal(claimBearingPromiseChain[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function runtimeRecordFromSource(id, sourcePath, sourceText, predicate) {
  const result = safeMergeJsTsProject({
    id,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { [sourcePath]: sourceText },
    workerFiles: { [sourcePath]: sourceText },
    headFiles: { [sourcePath]: sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find(predicate);
  assert.ok(record);
  return record;
}

function promiseChainRecord(record) {
  return record.publicContract
    && record.symbolName === 'loadWithHandlers'
    && record.regionKind === 'effect'
    && record.runtimeKind === 'network'
    && record.ordinal === 1;
}

function promiseChainProof(record, stages) {
  return {
    ...baseProofFields('runtime_order_promise_chain_proof', 'promise-chain-handler-order', record, stages),
    promiseChainOrderHash: promiseChainOrderHash(record),
    promiseChainHandlerOrderTraceHash: 'fixture-promise-chain-handler-order-trace-hash',
    promiseChainRejectionFlowTraceHash: 'fixture-promise-chain-rejection-flow-trace-hash',
    promiseChainFinalizerTraceHash: 'fixture-promise-chain-finalizer-trace-hash',
    ...effectTargetProofFields(record),
    promiseChainRuntimeEquivalenceClaim: false,
    promiseHandlerExecutionEquivalenceClaim: false,
    promiseRejectionFlowEquivalenceClaim: false,
    promiseFinalizerEquivalenceClaim: false
  };
}

function baseProofFields(id, proofLevel, record, stages) {
  return {
    id,
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel,
    sourcePath: record.sourcePath,
    baseSourceHash: stages.baseRecord.sourceHash,
    workerSourceHash: stages.workerRecord.sourceHash,
    headSourceHash: stages.headRecord.sourceHash,
    regionKey: record.key,
    runtimeIdentityKey: runtimeIdentityKey(record),
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    runtimeKinds: record.runtimeKinds,
    signatureHash: record.signatureHash,
    command: `fixture-${proofLevel}-proof`,
    traceHash: `fixture-${proofLevel}-trace-root-hash`,
    evidenceHash: `fixture-${proofLevel}-proof-hash`,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  };
}

function promiseChainOrderHash(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.promiseChainOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: (record.runtimeOrderEvidence.sameLinePromiseChain ?? []).map((item) => ({
      kind: item.kind,
      regionRole: item.regionRole,
      handlerMethodName: item.handlerMethodName,
      handlerStepOrdinal: item.handlerStepOrdinal,
      chainMethods: item.chainMethods ?? [],
      stepCount: item.stepCount,
      hasThen: item.hasThen === true,
      hasCatch: item.hasCatch === true,
      hasFinally: item.hasFinally === true,
      chainText: item.chainText,
      steps: (item.steps ?? []).map((step) => ({
        ordinal: step.ordinal,
        methodName: step.methodName,
        handlerText: step.handlerText,
        handlerOrdinal: step.handlerOrdinal
      })),
      handlerExecutionEquivalenceClaim: item.handlerExecutionEquivalenceClaim,
      runtimeEquivalenceClaim: item.runtimeEquivalenceClaim,
      semanticEquivalenceClaim: item.semanticEquivalenceClaim
    }))
  });
}

function runtimeIdentityKey(record) {
  return ['runtime-region', record.sourcePath, record.symbolName, record.regionKind, record.runtimeKind, record.ordinal].join('#');
}

function runtimeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { runtimeRegionRecords: record ? [record] : [] },
      summary: { runtimeRegionRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}
