import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import {
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const sourceText = [
  'const ready = true;',
  'const data = await fetch("/api/data");',
  'export const value = data;',
  ''
].join('\n');

const sidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/top-level-await.ts',
  sourceText
}), { generatedAt: 500 });

const networkRegion = sidecar.ownershipRegions.find((region) =>
  region.regionKind === 'effect' && region.metadata.runtimeOrderEvidence?.topLevelAwait === true);
assert.ok(networkRegion);
assert.equal(networkRegion.metadata.runtimeOrderEvidence.runtimeScope, 'module');
assert.equal(networkRegion.metadata.runtimeOrderEvidence.sameLineAwaitOrder[0].text, 'await');
assert.equal(sourceTextForSpan(sourceText, networkRegion.sourceSpan), 'fetch("/api/data")');
assert.equal(networkRegion.metadata.factKinds.includes('network'), true);
assert.equal(networkRegion.metadata.factKinds.includes('async'), true);

const controlRegion = sidecar.ownershipRegions.find((region) =>
  region.regionKind === 'controlFlow' && region.metadata.runtimeOrderEvidence?.topLevelAwait === true);
assert.ok(controlRegion);
assert.equal(sourceTextForSpan(sourceText, controlRegion.sourceSpan), 'await fetch("/api/data");');

const merge = safeMergeJsTsSource({
  id: 'semantic_top_level_await_order_blocked',
  language: 'typescript',
  sourcePath: 'src/top-level-await.ts',
  baseSourceText: sourceText,
  workerSourceText: sourceText.replace('fetch("/api/data")', 'fetch("/api/data", { cache: "reload" })'),
  headSourceText: sourceText.replace('await fetch("/api/data")', 'await (ready, fetch("/api/data"))')
});

assert.equal(merge.status, 'blocked');
assert.equal(merge.admission.reasonCodes.includes('head-runtime-order-evidence-changed-since-base'), true);
assert.equal(merge.admission.reasonCodes.includes('runtime-order-await-merge-requires-suspension-order-evidence'), true);
assert.equal(merge.admission.reasonCodes.includes('control-flow-async-merge-requires-await-order-evidence'), true);

const baseRecord = topLevelAwaitEffectRecordFromSource('base', sourceText);
const workerRecord = topLevelAwaitEffectRecordFromSource('worker', sourceText.replace('fetch("/api/data")', 'fetch("/api/data", { cache: "reload" })'));
const headRecord = topLevelAwaitEffectRecordFromSource('head', sourceText.replace('fetch("/api/data")', '(ready, fetch("/api/data"))'));
assert.notEqual(baseRecord.signatureHash, workerRecord.signatureHash);
assert.notEqual(workerRecord.signatureHash, headRecord.signatureHash);

const projectConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(projectConflicts.length, 1);
assert.equal(projectConflicts[0].details.reasonCodes.includes('runtime-order-await-merge-requires-suspension-order-evidence'), true);

const validTopLevelAwaitProof = topLevelAwaitProof(workerRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: validTopLevelAwaitProof });
assert.equal(provedConflicts.length, 0);

const missingTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validTopLevelAwaitProof, topLevelAwaitSuspensionTraceHash: undefined, moduleEvaluationTraceHash: undefined } });
assert.equal(missingTraceConflicts.length, 1);
assert.equal(missingTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-top-level-await-suspension-trace-missing'), true);

const mismatchedOrderConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validTopLevelAwaitProof, topLevelAwaitOrderHash: 'sha256:mismatched-top-level-await-order' } });
assert.equal(mismatchedOrderConflicts.length, 1);
assert.equal(mismatchedOrderConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-top-level-await-order-hash-mismatch'), true);

const staleProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validTopLevelAwaitProof, headSourceHash: 'fnv1a32:stale-top-level-await-source' } });
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);

const claimProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validTopLevelAwaitProof, moduleEvaluationOrderEquivalenceClaim: true } });
assert.equal(claimProofConflicts.length, 1);
assert.equal(claimProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function sourceTextForSpan(source, span) {
  const line = source.split(/\r\n|\n|\r/)[span.startLine - 1] ?? '';
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}

function topLevelAwaitEffectRecordFromSource(id, source) {
  const result = safeMergeJsTsProject({
    id: `semantic_top_level_await_project_runtime_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/top-level-await.ts': source },
    workerFiles: { 'src/top-level-await.ts': source },
    headFiles: { 'src/top-level-await.ts': source }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.regionKind === 'effect'
    && item.runtimeOrderEvidence?.topLevelAwait === true);
  assert.ok(record);
  return { ...record, publicContract: true };
}

function topLevelAwaitProof(record, stages) {
  return {
    id: 'runtime_order_top_level_await_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'top-level-await-suspension-order',
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
    topLevelAwaitOrderHash: topLevelAwaitOrderHash(record),
    topLevelAwaitSuspensionTraceHash: 'fixture-top-level-await-suspension-trace-hash',
    moduleEvaluationTraceHash: 'fixture-module-evaluation-trace-hash',
    command: 'fixture-top-level-await-runtime-proof',
    traceHash: 'fixture-top-level-await-trace-root-hash',
    evidenceHash: 'fixture-top-level-await-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    topLevelAwaitSuspensionEquivalenceClaim: false,
    moduleEvaluationOrderEquivalenceClaim: false
  };
}

function topLevelAwaitOrderHash(record) {
  const evidence = record.runtimeOrderEvidence ?? {};
  const records = [
    ...(evidence.sameLineAwaitOrder ?? []).map((item) => ({
      kind: item.kind,
      ordinal: item.ordinal,
      text: item.text
    })),
    {
      kind: 'top-level-await',
      runtimeScope: evidence.runtimeScope,
      line: evidence.line,
      runtimeOrderIndex: evidence.runtimeOrderIndex,
      previousRegionKind: evidence.previousRegionKind,
      previousRuntimeKind: evidence.previousRuntimeKind,
      previousRuntimeKinds: evidence.previousRuntimeKinds
    }
  ];
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.topLevelAwaitOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records
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
