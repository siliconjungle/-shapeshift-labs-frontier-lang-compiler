import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { runtimeOrderReasonCodes } from '../../src/internal/index-impl/semanticEditRuntimeOrderReasons.js';

const baseRecord = staticBlockRecordFromSource('base', staticBlockSource('true'));
assert.equal(baseRecord.publicContract, true);
assert.equal(baseRecord.regionKind, 'effect');
assert.equal(baseRecord.runtimeKind, 'class-static-block');
assert.equal(baseRecord.spanKind, 'class-static-block');
assert.equal(baseRecord.symbolName, 'Registry');
assert.equal(baseRecord.runtimeOrderEvidence.runtimeScope, 'class-static-initialization');
assert.equal(baseRecord.runtimeOrderEvidence.classStaticBlockOrder[0].kind, 'class-static-block');
assert.equal(baseRecord.runtimeOrderEvidence.classStaticBlockOrder[0].className, 'Registry');
assert.equal(baseRecord.runtimeOrderEvidence.classStaticBlockOrder[0].ordinal, 1);
assert.equal(baseRecord.runtimeOrderEvidence.classStaticBlockOrder[0].statementCount, 1);
assert.equal(runtimeOrderReasonCodes({ region: baseRecord }).includes('effect-class-static-block-merge-requires-static-initialization-order-evidence'), true);
assert.equal(runtimeOrderReasonCodes({ region: baseRecord }).includes('runtime-order-class-static-block-merge-requires-static-initialization-evidence'), true);

const workerRecord = staticBlockRecordFromSource('worker', staticBlockSource('"worker"'));
const headRecord = staticBlockRecordFromSource('head', staticBlockSource('"head"'));
assert.notEqual(baseRecord.signatureHash, workerRecord.signatureHash);
assert.notEqual(workerRecord.signatureHash, headRecord.signatureHash);

const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/static-block.ts#Registry#effect#class-static-block#1');
assert.equal(conflicts[0].details.reasonCodes.includes('runtime-order-class-static-block-merge-requires-static-initialization-evidence'), true);
assert.equal(conflicts[0].details.worker.runtimeOrderEvidence.classStaticBlockOrder[0].text.includes('"worker"'), true);
assert.equal(conflicts[0].details.head.runtimeOrderEvidence.classStaticBlockOrder[0].text.includes('"head"'), true);

const validStaticBlockProof = classStaticBlockProof(workerRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: validStaticBlockProof });
assert.equal(provedConflicts.length, 0);

const staleProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validStaticBlockProof, headSourceHash: 'fnv1a32:stale-static-block-source' } });
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);

const mismatchedOrderProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validStaticBlockProof, classStaticBlockOrderHash: 'sha256:mismatched-static-block-order' } });
assert.equal(mismatchedOrderProofConflicts.length, 1);
assert.equal(mismatchedOrderProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-class-static-block-order-hash-mismatch'), true);

const missingTraceProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validStaticBlockProof, classStaticBlockExecutionTraceHash: undefined } });
assert.equal(missingTraceProofConflicts.length, 1);
assert.equal(missingTraceProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-class-static-block-execution-trace-missing'), true);

const claimBearingProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validStaticBlockProof, staticInitializationEquivalenceClaim: true } });
assert.equal(claimBearingProofConflicts.length, 1);
assert.equal(claimBearingProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function staticBlockSource(value) {
  return [
    'export class Registry {',
    '  static ready = false;',
    '  static {',
    `    Registry.ready = ${value};`,
    '  }',
    '}',
    ''
  ].join('\n');
}

function staticBlockRecordFromSource(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_class_static_block_runtime_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/static-block.ts': sourceText },
    workerFiles: { 'src/static-block.ts': sourceText },
    headFiles: { 'src/static-block.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.sourcePath === 'src/static-block.ts'
    && item.symbolName === 'Registry'
    && item.runtimeKind === 'class-static-block');
  assert.ok(record);
  return record;
}

function classStaticBlockProof(record, stages) {
  return {
    id: 'runtime_order_class_static_block_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'class-static-block-static-initialization',
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
    classStaticBlockOrderHash: classStaticBlockOrderHash(record),
    classStaticBlockExecutionTraceHash: 'fixture-class-static-block-execution-trace-hash',
    command: 'fixture-class-static-block-runtime-proof',
    traceHash: 'fixture-class-static-block-trace-root-hash',
    evidenceHash: 'fixture-class-static-block-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    classStaticBlockRuntimeEquivalenceClaim: false,
    staticInitializationEquivalenceClaim: false
  };
}

function classStaticBlockOrderHash(record) {
  const runtimeOrderEvidence = record.runtimeOrderEvidence ?? {};
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.classStaticBlockOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: (runtimeOrderEvidence.classStaticBlockOrder ?? []).map((item) => ({
      kind: item.kind,
      className: item.className,
      ordinal: item.ordinal,
      statementCount: item.statementCount,
      line: item.line,
      column: item.column,
      text: item.text
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
