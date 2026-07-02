import { assert } from './helpers.mjs';
import { createUniversalConversionArtifacts, createUniversalConversionPlan, createUniversalConversionRouteEvidenceReceipt, createUniversalConversionWorklist, queryUniversalConversionArtifacts, queryUniversalConversionPlan, queryUniversalConversionWorklist } from './compiler-api.mjs';

const runtimePlan = createUniversalConversionPlan({
  generatedAt: 801,
  targets: ['rust'],
  imports: [{
    id: 'runtime_denominator_import',
    language: 'javascript',
    sourcePath: 'src/runtime-denominator.js',
    sourceHash: 'hash_runtime_denominator',
    evidence: [{ id: 'runtime_denominator_import_proof', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'runtime_denominator_symbol', ownershipKeys: ['symbol.runtimeDenominator'], conflictKeys: ['symbol.runtimeDenominator'] }],
    sourceMaps: [{ id: 'runtime_denominator_source_map', mappings: [{ id: 'runtime_denominator_source_map_mapping', ownershipRegionKey: 'symbol.runtimeDenominator', sourceSpan: { path: 'src/runtime-denominator.js' } }] }]
  }],
  runtimeRequirements: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    capability: 'fetch',
    requiredSignals: ['source-hash', 'target-hash', 'runtime-command', 'probe-id', 'telemetry-hash', 'network-trace-hash'],
    proofEvidenceIds: ['runtime_denominator_route_proof']
  }],
  evidence: [
    { id: 'runtime_denominator_route_proof', kind: 'conversion-runtime-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' },
    { id: 'runtime_denominator_signal_proof', kind: 'runtime-adapter-proof', status: 'passed', capability: 'fetch', runtimeProofSignals: ['telemetry-hash'] }
  ]
});

const runtimeRoute = queryUniversalConversionPlan(runtimePlan, {
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence',
  translationRuntimeProofRequiredSignal: 'network-trace-hash',
  translationRuntimeProofProvidedSignal: 'telemetry-hash',
  translationRuntimeProofMissingSignal: 'network-trace-hash'
}).bestRoute;
assert.equal(runtimeRoute.translationAdmission.runtimeProofCapabilities.includes('fetch'), true);
assert.equal(runtimeRoute.translationAdmission.runtimeProofStatuses.includes('needs-evidence'), true);
assert.equal(runtimeRoute.runtime.proofObligations[0].requiredSignals.includes('network-trace-hash'), true);
assert.equal(runtimeRoute.runtime.proofObligations[0].evidenceIds.includes('runtime_denominator_route_proof'), true);
assert.equal(queryUniversalConversionPlan(runtimePlan, { translationRuntimeProofCapability: 'filesystem' }).found, false);
assert.equal(queryUniversalConversionPlan(runtimePlan, { translationRuntimeProofStatus: 'satisfied' }).found, false);

const runtimeReceipt = createUniversalConversionRouteEvidenceReceipt(runtimePlan, {
  routeId: runtimeRoute.id,
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence'
});
assert.equal(runtimeReceipt.translationRuntimeProofCapabilities.includes('fetch'), true);
assert.equal(runtimeReceipt.translationRuntimeProofStatuses.includes('needs-evidence'), true);
assert.equal(runtimeReceipt.summary.translationAdmission.runtimeProofCapabilities.fetch, 1);
assert.equal(runtimeReceipt.summary.translationAdmission.runtimeProofStatuses['needs-evidence'], 1);

const runtimeArtifacts = createUniversalConversionArtifacts(runtimePlan, {
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence'
});
const runtimeArtifact = queryUniversalConversionArtifacts(runtimeArtifacts, {
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence'
})[0];
assert.equal(runtimeArtifact.routeId, runtimeRoute.id);
assert.equal(runtimeArtifacts.index.translationRuntimeProofCapabilities.includes('fetch'), true);
assert.equal(runtimeArtifacts.index.translationRuntimeProofStatuses.includes('needs-evidence'), true);
assert.equal(runtimeArtifacts.summary.compactCounts.translationAdmission.runtimeProofCapabilities.fetch, 1);
assert.equal(runtimeArtifacts.summary.compactCounts.translationAdmission.runtimeProofStatuses['needs-evidence'], 1);

const runtimeWorklist = createUniversalConversionWorklist(runtimePlan, {
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence'
});
const runtimeWorkItem = queryUniversalConversionWorklist(runtimeWorklist, {
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'needs-evidence'
}).bestItem;
assert.equal(Boolean(runtimeWorkItem), true);
assert.equal(runtimeWorklist.summary.translationRuntimeProofCapabilities.includes('fetch'), true);
assert.equal(runtimeWorklist.summary.translationRuntimeProofStatuses.includes('needs-evidence'), true);
assert.equal(createUniversalConversionWorklist(runtimePlan, { translationRuntimeProofCapability: 'filesystem' }).items.length, 0);
