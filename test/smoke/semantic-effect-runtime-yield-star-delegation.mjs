import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';

const yieldStarSource = [
  'export function* ids(source) {',
  '  yield* source.first();',
  '  yield source.second();',
  '}',
  ''
].join('\n');

const yieldStarImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/yield-star.ts',
  sourceText: yieldStarSource
});
const idsSymbol = yieldStarImport.semanticIndex.symbols.find((symbol) => symbol.name === 'ids');
const yieldStarSidecar = createSemanticImportSidecar(yieldStarImport, { generatedAt: 212 });
const idsYieldStarRegion = yieldStarSidecar.ownershipRegions.find((region) => region.metadata?.subjectId === idsSymbol.id
  && region.regionKind === 'controlFlow'
  && region.metadata?.runtimeOrderEvidence?.exitOrder?.some((record) => record.delegated));

assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].kind, 'yield');
assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].delegated, true);
assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].delegationKind, 'iterator-delegation');
assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].delegatedIterableText, 'source.first()');
assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].iteratorProtocolEquivalenceClaim, false);
assert.equal(idsYieldStarRegion.metadata.runtimeOrderEvidence.exitOrder[0].delegatedCompletionPropagationClaim, false);

const yieldStarOrderScript = createSemanticEditScript({
  id: 'semantic_yield_star_peer_order_blocked',
  language: 'typescript',
  sourcePath: 'src/yield-star-order.ts',
  baseSourceText: yieldStarSource,
  workerSourceText: yieldStarSource.replace('source.first()', 'source.first(true)'),
  headSourceText: yieldStarSource.replace('source.second()', 'source.second(true)'),
  generatedAt: 212
});

assert.equal(yieldStarOrderScript.admission.status, 'conflict');
assert.equal(yieldStarOrderScript.admission.reasonCodes.includes('control-flow-exit-merge-requires-return-yield-order-evidence'), true);
assert.equal(yieldStarOrderScript.admission.reasonCodes.includes('runtime-order-yield-star-merge-requires-iterator-delegation-evidence'), true);
assert.equal(yieldStarOrderScript.admission.reasonCodes.includes('runtime-order-yield-star-iterator-protocol-equivalence-not-proven'), true);
assert.equal(yieldStarOrderScript.admission.reasonCodes.includes('runtime-order-yield-star-completion-propagation-equivalence-not-proven'), true);

const workerYieldStarSource = yieldStarSource.replace('source.first()', 'source.first(true)');
const headYieldStarSource = yieldStarSource.replace('source.first()', 'source.first(false)');
const outputYieldStarSource = workerYieldStarSource;
const baseRecord = yieldStarRuntimeRecordFromSource('base', yieldStarSource);
const workerRecord = yieldStarRuntimeRecordFromSource('worker', workerYieldStarSource);
const headRecord = yieldStarRuntimeRecordFromSource('head', headYieldStarSource);
const outputRecord = yieldStarRuntimeRecordFromSource('output', outputYieldStarSource);
assert.notEqual(baseRecord.signatureHash, workerRecord.signatureHash);
assert.notEqual(baseRecord.signatureHash, headRecord.signatureHash);

const projectConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}));
assert.equal(projectConflicts.length, 1);
assert.equal(projectConflicts[0].details.reasonCodes.includes('runtime-order-yield-star-merge-requires-iterator-delegation-evidence'), true);
assert.equal(projectConflicts[0].details.reasonCodes.includes('runtime-order-yield-star-completion-propagation-equivalence-not-proven'), true);

const validGeneratorProof = generatorProtocolProof(outputRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: validGeneratorProof });
assert.equal(provedConflicts.length, 0);

const missingIteratorTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validGeneratorProof, iteratorProtocolTraceHash: undefined } });
assert.equal(missingIteratorTraceConflicts.length, 1);
assert.equal(missingIteratorTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-generator-iterator-protocol-trace-missing'), true);

const missingCompletionTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validGeneratorProof, delegatedCompletionTraceHash: undefined } });
assert.equal(missingCompletionTraceConflicts.length, 1);
assert.equal(missingCompletionTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-generator-completion-trace-missing'), true);

const staleGeneratorProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validGeneratorProof, headSourceHash: 'fnv1a32:stale-head-source' } });
assert.equal(staleGeneratorProofConflicts.length, 1);
assert.equal(staleGeneratorProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);

const claimBearingGeneratorProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validGeneratorProof, iteratorProtocolEquivalenceClaim: true } });
assert.equal(claimBearingGeneratorProofConflicts.length, 1);
assert.equal(claimBearingGeneratorProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function yieldStarRuntimeRecordFromSource(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `yield_star_generator_protocol_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/yield-star.ts': sourceText },
    workerFiles: { 'src/yield-star.ts': sourceText },
    headFiles: { 'src/yield-star.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === 'ids'
    && item.regionKind === 'controlFlow'
    && item.runtimeKind === 'exit'
    && item.ordinal === 1);
  assert.ok(record);
  return record;
}

function generatorProtocolProof(record, stages) {
  return {
    id: 'runtime_order_generator_protocol_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'generator-protocol-order',
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
    generatorProtocolOrderHash: generatorProtocolOrderHash(record),
    generatorProtocolTraceHash: 'fixture-generator-protocol-trace-hash',
    iteratorProtocolTraceHash: 'fixture-iterator-protocol-trace-hash',
    delegatedCompletionTraceHash: 'fixture-delegated-completion-trace-hash',
    command: 'fixture-generator-protocol-proof',
    traceHash: 'fixture-generator-protocol-trace-root-hash',
    evidenceHash: 'fixture-generator-protocol-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    generatorRuntimeEquivalenceClaim: false,
    iteratorProtocolEquivalenceClaim: false,
    delegatedCompletionPropagationClaim: false
  };
}

function generatorProtocolOrderHash(record) {
  const runtimeOrderEvidence = record.runtimeOrderEvidence ?? {};
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.generatorProtocolOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: [
      ...(runtimeOrderEvidence.exitOrder ?? []),
      ...(runtimeOrderEvidence.effectTargetOrder ?? []),
      ...(runtimeOrderEvidence.sameLineYieldOrder ?? [])
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
