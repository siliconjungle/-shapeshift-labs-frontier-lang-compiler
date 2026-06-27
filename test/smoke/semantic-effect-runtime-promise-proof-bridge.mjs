import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const promiseAllSource = 'export async function loadBoth(api) {\n  return Promise.all([fetch(api.a), fetch(api.b)]);\n}\n';
const promiseAllWorkerSource = promiseAllSource.replace('fetch(api.a)', 'fetch(api.a, { cache: "reload" })');
const promiseAllHeadSource = promiseAllSource.replace('Promise.all([fetch(api.a), fetch(api.b)])', 'Promise.race([fetch(api.a), fetch(api.b)])');
const promiseAllBaseRecord = runtimeRecordFromSource('promise_all_base', 'src/promise-proof.ts', promiseAllSource, promiseAllRecord);
const promiseAllWorkerRecord = runtimeRecordFromSource('promise_all_worker', 'src/promise-proof.ts', promiseAllWorkerSource, promiseAllRecord);
const promiseAllHeadRecord = runtimeRecordFromSource('promise_all_head', 'src/promise-proof.ts', promiseAllHeadSource, promiseAllRecord);

assert.equal(promiseAllBaseRecord.runtimeOrderEvidence.sameLinePromiseCombinator[0].methodName, 'all');
assert.equal(promiseAllBaseRecord.runtimeOrderEvidence.sameLinePromiseCombinator[0].arrayElementOrdinal, 1);
assert.equal(promiseAllBaseRecord.runtimeOrderEvidence.sameLinePromiseCombinator[0].runtimeEquivalenceClaim, false);

const promiseAllConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}));
assert.equal(promiseAllConflicts.length, 1);
assert.equal(promiseAllConflicts[0].details.reasonCodes.includes('runtime-order-promise-combinator-merge-requires-concurrency-evidence'), true);

const validPromiseAllProof = promiseCombinatorProof(promiseAllWorkerRecord, {
  baseRecord: promiseAllBaseRecord,
  workerRecord: promiseAllWorkerRecord,
  headRecord: promiseAllHeadRecord
});
const provedPromiseAllConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}), { runtimeOrderEvidence: validPromiseAllProof });
assert.equal(provedPromiseAllConflicts.length, 0);

const missingPromiseAllSettlement = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseAllProof, promiseCombinatorSettlementTraceHash: undefined } });
assert.equal(missingPromiseAllSettlement.length, 1);
assert.equal(missingPromiseAllSettlement[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-combinator-settlement-trace-missing'), true);

const missingPromiseAllMethodTrace = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseAllProof, promiseAllSettlementTraceHash: undefined } });
assert.equal(missingPromiseAllMethodTrace.length, 1);
assert.equal(missingPromiseAllMethodTrace[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-all-settlement-trace-missing'), true);

const mismatchedPromiseAllHash = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseAllProof, promiseCombinatorOrderHash: 'sha256:mismatched-promise-combinator-order' } });
assert.equal(mismatchedPromiseAllHash.length, 1);
assert.equal(mismatchedPromiseAllHash[0].details.reasonCodes.includes('runtime-order-explicit-evidence-promise-combinator-order-hash-mismatch'), true);

const claimBearingPromiseAll = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: promiseAllBaseRecord,
  worker: promiseAllWorkerRecord,
  head: promiseAllHeadRecord,
  output: promiseAllWorkerRecord
}), { runtimeOrderEvidence: { ...validPromiseAllProof, promiseSettlementEquivalenceClaim: true } });
assert.equal(claimBearingPromiseAll.length, 1);
assert.equal(claimBearingPromiseAll[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

for (const variant of [
  {
    methodName: 'allSettled',
    proofField: 'promiseAllSettledRecordTraceHash',
    missingCode: 'runtime-order-explicit-evidence-promise-all-settled-record-trace-missing',
    headMethodName: 'race'
  },
  {
    methodName: 'race',
    proofField: 'promiseRaceFirstSettlementTraceHash',
    missingCode: 'runtime-order-explicit-evidence-promise-race-first-settlement-trace-missing',
    headMethodName: 'all'
  },
  {
    methodName: 'any',
    proofField: 'promiseAnyFirstFulfillmentTraceHash',
    missingCode: 'runtime-order-explicit-evidence-promise-any-first-fulfillment-trace-missing',
    headMethodName: 'race'
  }
]) {
  assertPromiseCombinatorVariant(variant);
}

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

function promiseAllRecord(record) {
  return record.publicContract
    && record.symbolName === 'loadBoth'
    && record.regionKind === 'effect'
    && record.runtimeKind === 'network'
    && record.ordinal === 1;
}

function assertPromiseCombinatorVariant({ methodName, proofField, missingCode, headMethodName }) {
  const symbolName = `load${methodName[0].toUpperCase()}${methodName.slice(1)}`;
  const sourcePath = `src/promise-${methodName}-proof.ts`;
  const source = `export async function ${symbolName}(api) {\n  return Promise.${methodName}([fetch(api.a), fetch(api.b)]);\n}\n`;
  const workerSource = source.replace('fetch(api.a)', 'fetch(api.a, { cache: "reload" })');
  const headSource = source.replace(`Promise.${methodName}([fetch(api.a), fetch(api.b)])`, `Promise.${headMethodName}([fetch(api.a), fetch(api.b)])`);
  const predicate = (record) => record.publicContract
    && record.symbolName === symbolName
    && record.regionKind === 'effect'
    && record.runtimeKind === 'network'
    && record.ordinal === 1;
  const baseRecord = runtimeRecordFromSource(`${methodName}_base`, sourcePath, source, predicate);
  const workerRecord = runtimeRecordFromSource(`${methodName}_worker`, sourcePath, workerSource, predicate);
  const headRecord = runtimeRecordFromSource(`${methodName}_head`, sourcePath, headSource, predicate);
  assert.equal(baseRecord.runtimeOrderEvidence.sameLinePromiseCombinator[0].methodName, methodName);
  const proof = {
    ...promiseCombinatorProof(workerRecord, { baseRecord, workerRecord, headRecord }),
    promiseAllSettlementTraceHash: undefined,
    [proofField]: `fixture-${methodName}-specific-trace-hash`
  };
  assert.equal(projectRuntimeRegionDeltaConflicts(runtimeDelta({
    base: baseRecord,
    worker: workerRecord,
    head: headRecord,
    output: workerRecord
  }), { runtimeOrderEvidence: proof }).length, 0);
  const missingSpecificTrace = projectRuntimeRegionDeltaConflicts(runtimeDelta({
    base: baseRecord,
    worker: workerRecord,
    head: headRecord,
    output: workerRecord
  }), { runtimeOrderEvidence: { ...proof, [proofField]: undefined } });
  assert.equal(missingSpecificTrace.length, 1);
  assert.equal(missingSpecificTrace[0].details.reasonCodes.includes(missingCode), true);
}

function promiseCombinatorProof(record, stages) {
  return {
    ...baseProofFields('runtime_order_promise_combinator_proof', 'promise-combinator-concurrency-order', record, stages),
    promiseCombinatorOrderHash: promiseCombinatorOrderHash(record),
    promiseCombinatorConcurrencyTraceHash: 'fixture-promise-combinator-concurrency-trace-hash',
    promiseCombinatorSettlementTraceHash: 'fixture-promise-combinator-settlement-trace-hash',
    promiseCombinatorElementOrderTraceHash: 'fixture-promise-combinator-element-order-trace-hash',
    promiseAllSettlementTraceHash: 'fixture-promise-all-settlement-trace-hash',
    ...effectTargetProofFields(record),
    promiseCombinatorRuntimeEquivalenceClaim: false,
    promiseConcurrencyEquivalenceClaim: false,
    promiseSettlementEquivalenceClaim: false,
    promiseElementOrderEquivalenceClaim: false
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

function promiseCombinatorOrderHash(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.promiseCombinatorOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: (record.runtimeOrderEvidence.sameLinePromiseCombinator ?? []).map((item) => ({
      kind: item.kind,
      methodName: item.methodName,
      concurrencySemantics: item.concurrencySemantics,
      settlementPolicy: item.settlementPolicy,
      argumentOrdinal: item.argumentOrdinal,
      argumentText: item.argumentText,
      directArrayArgument: item.directArrayArgument === true,
      arrayElementOrdinal: item.arrayElementOrdinal,
      arrayElementCount: item.arrayElementCount,
      arrayElementText: item.arrayElementText,
      callText: item.callText,
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
