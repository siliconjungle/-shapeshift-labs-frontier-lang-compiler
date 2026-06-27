import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const source = 'export async function* stream(source) {\n  yield await source.first();\n}\n';
const workerSource = source.replace('source.first()', 'source.first(true)');
const headSource = source.replace('source.first()', 'source.first(false)');
const baseRecord = asyncGeneratorRecordFromSource('base', source);
const workerRecord = asyncGeneratorRecordFromSource('worker', workerSource);
const headRecord = asyncGeneratorRecordFromSource('head', headSource);

assert.equal(baseRecord.publicContract, true);
assert.equal(baseRecord.regionKind, 'effect');
assert.equal(baseRecord.runtimeKind, 'generator');
assert.deepEqual(baseRecord.runtimeKinds, ['generator', 'async']);
assert.equal(baseRecord.runtimeOrderEvidence.exitOrder[0].kind, 'yield');
assert.equal(baseRecord.runtimeOrderEvidence.effectTargetOrder[0].effectKind, 'generator');

const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/async-generator.ts#stream#effect#generator#2');
assert.equal(conflicts[0].details.reasonCodes.includes('effect-generator-merge-requires-yield-order-evidence'), true);

const validProof = asyncGeneratorProtocolProof(workerRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: validProof });
assert.equal(provedConflicts.length, 0);

const missingAsyncTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, asyncIteratorProtocolTraceHash: undefined } });
assert.equal(missingAsyncTraceConflicts.length, 1);
assert.equal(missingAsyncTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-async-generator-protocol-trace-missing'), true);

const missingCancellationTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, asyncGeneratorCancellationTraceHash: undefined } });
assert.equal(missingCancellationTraceConflicts.length, 1);
assert.equal(missingCancellationTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-async-generator-cancellation-trace-missing'), true);

const missingBackpressureTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, asyncGeneratorBackpressureTraceHash: undefined } });
assert.equal(missingBackpressureTraceConflicts.length, 1);
assert.equal(missingBackpressureTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-async-generator-backpressure-trace-missing'), true);

const mismatchedOrderConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, asyncGeneratorProtocolOrderHash: 'sha256:mismatched-async-generator-order' } });
assert.equal(mismatchedOrderConflicts.length, 1);
assert.equal(mismatchedOrderConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-generator-protocol-order-hash-mismatch'), true);

const claimBearingConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, asyncIteratorProtocolEquivalenceClaim: true } });
assert.equal(claimBearingConflicts.length, 1);
assert.equal(claimBearingConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function asyncGeneratorRecordFromSource(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `async_generator_protocol_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/async-generator.ts': sourceText },
    workerFiles: { 'src/async-generator.ts': sourceText },
    headFiles: { 'src/async-generator.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === 'stream'
    && item.regionKind === 'effect'
    && item.runtimeKind === 'generator'
    && item.ordinal === 2);
  assert.ok(record);
  return record;
}

function asyncGeneratorProtocolProof(record, stages) {
  return {
    id: 'runtime_order_async_generator_protocol_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'async-generator-protocol-order',
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
    asyncGeneratorProtocolOrderHash: generatorProtocolOrderHash(record),
    generatorProtocolTraceHash: 'fixture-generator-protocol-trace-hash',
    asyncIteratorProtocolTraceHash: 'fixture-async-iterator-protocol-trace-hash',
    asyncGeneratorCancellationTraceHash: 'fixture-async-generator-cancellation-trace-hash',
    asyncGeneratorBackpressureTraceHash: 'fixture-async-generator-backpressure-trace-hash',
    ...effectTargetProofFields(record),
    command: 'fixture-async-generator-protocol-proof',
    traceHash: 'fixture-async-generator-trace-root-hash',
    evidenceHash: 'fixture-async-generator-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    generatorRuntimeEquivalenceClaim: false,
    asyncGeneratorRuntimeEquivalenceClaim: false,
    asyncIteratorProtocolEquivalenceClaim: false,
    asyncIteratorCancellationEquivalenceClaim: false,
    asyncIteratorBackpressureEquivalenceClaim: false
  };
}

function generatorProtocolOrderHash(record) {
  const evidence = record.runtimeOrderEvidence ?? {};
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.generatorProtocolOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: [
      ...(evidence.exitOrder ?? []),
      ...(evidence.effectTargetOrder ?? []),
      ...(evidence.sameLineYieldOrder ?? [])
    ].map((item) => ({
      kind: item.kind,
      delegated: item.delegated === true,
      delegationKind: item.delegationKind,
      delegatedIterableText: item.delegatedIterableText,
      line: item.line,
      column: item.column,
      targetText: item.targetText,
      calleeName: item.calleeName,
      effectKind: item.effectKind,
      iteratorProtocolEquivalenceClaim: item.iteratorProtocolEquivalenceClaim,
      delegatedCompletionPropagationClaim: item.delegatedCompletionPropagationClaim
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
