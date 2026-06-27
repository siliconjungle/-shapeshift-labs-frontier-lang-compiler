import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const projectTargetBase = 'export function callDynamic(api, target) {\n  window[target](api);\n}\n';
const projectTargetWorker = projectTargetBase.replace('window[target](api);', 'window[target](api, { trace: true });');
const projectTargetHead = projectTargetBase.replace('window[target](api);', 'window[otherTarget](api);');
const projectTargetBaseRecord = projectTargetRecord('base', projectTargetBase);
const projectTargetWorkerRecord = projectTargetRecord('worker', projectTargetWorker);
const projectTargetHeadRecord = projectTargetRecord('head', projectTargetHead);

const projectTargetConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: projectTargetBaseRecord,
  worker: projectTargetWorkerRecord,
  head: projectTargetHeadRecord,
  output: projectTargetWorkerRecord
}));
assert.equal(projectTargetConflicts.length, 1);
assert.equal(projectTargetConflicts[0].details.reasonCodes.includes('runtime-order-effect-target-merge-requires-dynamic-computed-key-evidence'), true);

const projectTargetProof = effectTargetProof(projectTargetWorkerRecord, {
  baseRecord: projectTargetBaseRecord,
  workerRecord: projectTargetWorkerRecord,
  headRecord: projectTargetHeadRecord
});
assert.equal(projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: projectTargetBaseRecord,
  worker: projectTargetWorkerRecord,
  head: projectTargetHeadRecord,
  output: projectTargetWorkerRecord
}), { runtimeOrderEvidence: projectTargetProof }).length, 0);

const missingComputedTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: projectTargetBaseRecord,
  worker: projectTargetWorkerRecord,
  head: projectTargetHeadRecord,
  output: projectTargetWorkerRecord
}), { runtimeOrderEvidence: { ...projectTargetProof, effectTargetComputedKeyTraceHash: undefined } });
assert.equal(missingComputedTraceConflicts.length, 1);
assert.equal(missingComputedTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-effect-target-computed-key-trace-missing'), true);

const mismatchedTargetHashConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: projectTargetBaseRecord,
  worker: projectTargetWorkerRecord,
  head: projectTargetHeadRecord,
  output: projectTargetWorkerRecord
}), { runtimeOrderEvidence: { ...projectTargetProof, effectTargetOrderHash: 'sha256:mismatched-effect-target-order' } });
assert.equal(mismatchedTargetHashConflicts.length, 1);
assert.equal(mismatchedTargetHashConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-effect-target-order-hash-mismatch'), true);

const targetClaimConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: projectTargetBaseRecord,
  worker: projectTargetWorkerRecord,
  head: projectTargetHeadRecord,
  output: projectTargetWorkerRecord
}), { runtimeOrderEvidence: { ...projectTargetProof, computedPropertyRuntimeEquivalenceClaim: true } });
assert.equal(targetClaimConflicts.length, 1);
assert.equal(targetClaimConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function projectTargetRecord(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `semantic_effect_target_proof_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/effect-target-proof.ts': sourceText },
    workerFiles: { 'src/effect-target-proof.ts': sourceText },
    headFiles: { 'src/effect-target-proof.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((candidate) => candidate.publicContract
    && candidate.symbolName === 'callDynamic'
    && candidate.regionKind === 'effect'
    && candidate.runtimeKind === 'browser'
    && candidate.ordinal === 1);
  assert.ok(record);
  return record;
}

function effectTargetProof(record, stages) {
  return {
    id: 'runtime_order_effect_target_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'effect-target-order',
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
    command: 'fixture-effect-target-proof',
    traceHash: 'fixture-effect-target-trace-root-hash',
    evidenceHash: 'fixture-effect-target-proof-hash',
    ...effectTargetProofFields(record),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  };
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
