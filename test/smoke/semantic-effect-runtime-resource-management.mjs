import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import {
  createSemanticImportSidecar,
  importNativeSource,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { projectRuntimeRegionDeltaConflicts } from '../../src/js-ts-safe-project-merge-runtime-region-conflicts.js';
import { runtimeOrderReasonCodes } from '../../src/internal/index-impl/semanticEditRuntimeOrderReasons.js';

const resourceSource = [
  'export async function loadResource() {',
  '  using resource = acquire();',
  '  await using connection = await connect();',
  '  return resource;',
  '}',
  ''
].join('\n');

const resourceSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/resource.ts',
  sourceText: resourceSource
}), { generatedAt: 210 });
const resourceRegion = resourceSidecar.ownershipRegions
  .find((region) => region.symbolName === 'loadResource:effect:resource-management#1');
const connectionRegion = resourceSidecar.ownershipRegions
  .find((region) => region.symbolName === 'loadResource:effect:resource-management#2');
assert.ok(resourceRegion);
assert.ok(connectionRegion);
assert.equal(sourceTextForSpan(resourceSource, resourceRegion.sourceSpan), 'using resource = acquire();');
assert.equal(sourceTextForSpan(resourceSource, connectionRegion.sourceSpan), 'await using connection = await connect();');
assert.deepEqual(resourceRegion.metadata.factKinds, ['resource-management', 'using']);
assert.deepEqual(connectionRegion.metadata.factKinds, ['resource-management', 'await-using']);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder.length, 2);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].name, 'resource');
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].acquisitionOrderIndex, 1);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].disposalOrderIndex, 2);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[1].name, 'connection');
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[1].awaitUsing, true);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[1].disposalOrderIndex, 1);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].runtimeEquivalenceClaim, false);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].disposalEffectEquivalenceClaim, false);
assert.equal(resourceRegion.metadata.runtimeOrderEvidence.resourceManagementOrder[0].semanticEquivalenceClaim, false);

const project = safeMergeJsTsProject({
  id: 'js_ts_project_resource_management_runtime_graph',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/resource.ts': resourceSource },
  workerFiles: { 'src/resource.ts': resourceSource },
  headFiles: { 'src/resource.ts': resourceSource }
});
assert.equal(project.status, 'merged');
const runtimeRecords = project.outputProjectSymbolGraph.runtimeRegionRecords
  .filter((record) => record.symbolName === 'loadResource' && record.runtimeKind === 'resource-management');
assert.equal(runtimeRecords.length, 2);
assert.equal(runtimeRecords.every((record) => record.publicContract), true);
assert.equal(runtimeRecords[0].runtimeOrderEvidence.resourceManagementOrder[1].declarationKind, 'await-using');
assert.equal(runtimeOrderReasonCodes({ region: runtimeRecords[0] })
  .includes('runtime-order-resource-management-merge-requires-disposal-order-evidence'), true);
assert.equal(runtimeOrderReasonCodes({ region: runtimeRecords[0] })
  .includes('runtime-order-resource-management-disposal-effect-equivalence-not-proven'), true);

const workerSource = resourceSource.replace('acquire()', 'acquireWorker()');
const headSource = resourceSource.replace('await connect()', 'await connectHead()');
const outputSource = workerSource.replace('await connect()', 'await connectHead()');
const baseRecord = resourceRuntimeRecordFromSource('base', resourceSource, 1);
const workerRecord = resourceRuntimeRecordFromSource('worker', workerSource, 1);
const headRecord = resourceRuntimeRecordFromSource('head', headSource, 1);
const outputRecord = resourceRuntimeRecordFromSource('output', outputSource, 1);
assert.notEqual(baseRecord.signatureHash, workerRecord.signatureHash);
assert.notEqual(baseRecord.signatureHash, headRecord.signatureHash);
const conflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}));
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].details.identityKey, 'runtime-region#src/resource.ts#loadResource#effect#resource-management#1');
assert.equal(conflicts[0].details.reasonCodes.includes('effect-resource-management-merge-requires-acquisition-disposal-evidence'), true);
assert.equal(conflicts[0].details.reasonCodes.includes('runtime-order-await-using-merge-requires-async-disposal-evidence'), true);

const validDisposalProof = resourceDisposalProof(outputRecord, { baseRecord, workerRecord, headRecord });
const provedConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: validDisposalProof });
assert.equal(provedConflicts.length, 0);

const missingAsyncTraceConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validDisposalProof, resourceManagementAsyncDisposalTraceHash: undefined } });
assert.equal(missingAsyncTraceConflicts.length, 1);
assert.equal(missingAsyncTraceConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-resource-management-async-disposal-trace-missing'), true);

const staleProofConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validDisposalProof, headSourceHash: 'fnv1a32:stale-head-source' } });
assert.equal(staleProofConflicts.length, 1);
assert.equal(staleProofConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-source-hash-mismatch'), true);
assert.equal(staleProofConflicts[0].details.explicitRuntimeOrderEvidence.status, 'failed');

const claimBearingConflicts = projectRuntimeRegionDeltaConflicts(runtimeDelta({
  base: baseRecord,
  worker: workerRecord,
  head: headRecord,
  output: outputRecord
}), { runtimeOrderEvidence: { ...validDisposalProof, disposalEffectEquivalenceClaim: true } });
assert.equal(claimBearingConflicts.length, 1);
assert.equal(claimBearingConflicts[0].details.reasonCodes.includes('runtime-order-explicit-evidence-claim-flags-missing'), true);

function resourceRuntimeRecordFromSource(id, sourceText, ordinal) {
  const result = safeMergeJsTsProject({
    id: `resource_management_${id}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: { 'src/resource.ts': sourceText },
    workerFiles: { 'src/resource.ts': sourceText },
    headFiles: { 'src/resource.ts': sourceText }
  });
  assert.equal(result.status, 'merged');
  const record = result.outputProjectSymbolGraph.runtimeRegionRecords.find((item) => item.publicContract
    && item.symbolName === 'loadResource'
    && item.regionKind === 'effect'
    && item.runtimeKind === 'resource-management'
    && item.ordinal === ordinal);
  assert.ok(record);
  return record;
}

function resourceDisposalProof(record, stages) {
  return {
    id: 'runtime_order_resource_management_disposal_proof',
    schema: 'frontier.lang.runtimeOrderProofEvidence.v1',
    status: 'passed',
    proofLevel: 'resource-management-disposal-order',
    sourcePath: record.sourcePath,
    baseSourceHash: stages.baseRecord.sourceHash,
    workerSourceHash: stages.workerRecord.sourceHash,
    headSourceHash: stages.headRecord.sourceHash,
    regionKey: record.key,
    runtimeIdentityKey: runtimeIdentityKey(record),
    regionKind: record.regionKind,
    runtimeKind: 'resource-management',
    signatureHash: record.signatureHash,
    resourceManagementDisposalOrderHash: resourceManagementDisposalOrderHash(record),
    resourceManagementAsyncDisposalTraceHash: 'fixture-async-disposal-trace-hash',
    command: 'fixture-resource-management-disposal-proof',
    traceHash: 'fixture-resource-management-disposal-trace-hash',
    evidenceHash: 'fixture-resource-management-disposal-proof-hash',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    disposalEffectEquivalenceClaim: false
  };
}

function resourceManagementDisposalOrderHash(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.runtimeOrderProofEvidence.resourceManagementDisposalOrder',
    sourcePath: record.sourcePath,
    regionKind: record.regionKind,
    runtimeKind: record.runtimeKind,
    symbolName: record.symbolName,
    ordinal: record.ordinal,
    records: record.runtimeOrderEvidence.resourceManagementOrder.map((item) => ({
      name: item.name,
      declarationKind: item.declarationKind,
      awaitUsing: item.awaitUsing === true,
      acquisitionOrderIndex: item.acquisitionOrderIndex,
      disposalOrderIndex: item.disposalOrderIndex,
      disposalOrder: item.disposalOrder,
      scopeStartLine: item.scopeStartLine,
      scopeExitLine: item.scopeExitLine,
      declarationText: item.declarationText,
      initializerText: item.initializerText,
      disposalMethodPolicy: item.disposalMethodPolicy
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

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
