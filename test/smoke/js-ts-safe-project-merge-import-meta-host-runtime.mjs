import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { effectTargetProofFields } from './runtime-order-proof-helpers.mjs';

const baseSource = 'export function assetUrl(name) {\n  return new URL(name, import.meta.url).href;\n}\n';
const workerSource = baseSource.replace('import.meta.url', 'import.meta.resolve(name)');
const headSource = baseSource.replace('import.meta.url', 'import.meta.env.BASE_URL');
const baseRecord = importMetaHostRecordFromSource('base', baseSource);
const workerRecord = importMetaHostRecordFromSource('worker', workerSource);
const headRecord = importMetaHostRecordFromSource('head', headSource);

assert.equal(baseRecord.spanKind, 'import-meta-host-context');
assert.equal(baseRecord.runtimeOrderEvidence.hostContext, 'import.meta');
assert.deepEqual(baseRecord.runtimeOrderEvidence.importMetaMemberNames, ['url']);
assert.deepEqual(workerRecord.runtimeOrderEvidence.importMetaMemberNames, ['resolve']);
assert.equal(headRecord.runtimeOrderEvidence.importMetaHostContext[0].memberPath.join('.'), 'env.BASE_URL');

const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/import-meta-host.ts#assetUrl#effect#host-context#1');
assert.equal(conflicts[0].details.reasonCodes.includes('runtime-order-import-meta-merge-requires-host-context-evidence'), true);

const validProof = importMetaHostContextProof(workerRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: validProof });
assert.equal(provedConflicts.length, 0);

const staleProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, headSourceHash: 'fnv1a32:stale-import-meta-host-source' } });
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);

const mismatchedContextConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, importMetaHostContextHash: 'sha256:mismatched-import-meta-host-context' } });
assert.equal(mismatchedContextConflicts.length, 1);
assert.equal(mismatchedContextConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-import-meta-host-context-hash-mismatch'), true);

const missingTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, importMetaHostResolutionTraceHash: undefined } });
assert.equal(missingTraceConflicts.length, 1);
assert.equal(missingTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-import-meta-host-context-trace-missing'), true);

const claimBearingConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: workerRecord
}), { runtimeOrderEvidence: { ...validProof, hostRuntimeResolutionEquivalenceClaim: true } });
assert.equal(claimBearingConflicts.length, 1);
assert.equal(claimBearingConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function importMetaHostRecordFromSource(id, sourceText) {
  const result = safeMergeJsTsProject({
    id: `import_meta_host_runtime_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/import-meta-host.ts': sourceText },
    workerFiles: { 'src/import-meta-host.ts': sourceText },
    headFiles: { 'src/import-meta-host.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === 'assetUrl'
    && item.regionKind === 'effect'
    && item.runtimeKind === 'host-context');
  assert.ok(record);
  return record;
}

function importMetaHostContextProof(record, stages) {
  return {
    id: 'runtime_order_import_meta_host_context_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'import-meta-host-context-resolution',
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
    importMetaHostContextHash: importMetaHostContextHash(record),
    importMetaHostResolutionTraceHash: 'fixture-import-meta-host-resolution-trace-hash',
    ...effectTargetProofFields(record),
    command: 'fixture-import-meta-host-context-proof',
    traceHash: 'fixture-import-meta-host-context-trace-root-hash',
    evidenceHash: 'fixture-import-meta-host-context-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    importMetaHostContextEquivalenceClaim: false,
    hostRuntimeResolutionEquivalenceClaim: false
  };
}

function importMetaHostContextHash(record) {
  const evidence = record.runtimeOrderEvidence ?? {};
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.importMetaHostContext',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    hostContext: evidence.hostContext,
    importMetaMemberNames: evidence.importMetaMemberNames,
    records: (evidence.importMetaHostContext ?? []).map((item) => ({
      kind: item.kind,
      ordinal: item.ordinal,
      text: item.text,
      memberName: item.memberName,
      memberPath: item.memberPath
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
