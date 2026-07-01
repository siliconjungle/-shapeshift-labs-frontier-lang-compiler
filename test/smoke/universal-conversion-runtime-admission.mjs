import { assert } from './helpers.mjs';
import {
  createUniversalConversionPlan,
  createUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  createUniversalRuntimeCapabilityMatrix,
  createUniversalRuntimeProofObligation,
  queryUniversalRuntimeCapabilityMatrix,
  queryUniversalConversionArtifacts,
  runtimeProofObligationMatches,
  runtimeProofSignalsForCapability,
  summarizeRuntimeProofObligations,
  UniversalRuntimeProofSignalKinds
} from './compiler-api.mjs';

const missingDomRoute = conversionRouteForRequirement('dom');
assert.equal(missingDomRoute.runtime.readiness, 'needs-review');
assert.equal(missingDomRoute.runtime.missingCapabilities.includes('dom'), true);
assert.equal(missingDomRoute.readiness, 'blocked');
assert.equal(missingDomRoute.admissionAction, 'reject');
assert.equal(missingDomRoute.priority, 'blocker');
assert.equal(missingDomRoute.blockers.includes('Runtime capability is missing: dom.'), true);
assert.equal(missingDomRoute.missingEvidence.includes('runtime-capability:dom'), true);
assert.equal(missingDomRoute.missingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(missingDomRoute.mergeScore.risk, 'high');
const domArtifacts = createUniversalConversionArtifacts(conversionPlanForRequirement('dom'), { routeId: missingDomRoute.id });
const domArtifact = domArtifacts.routeArtifacts[0];
assert.equal(domArtifact.requiredRuntimeCapabilities.includes('dom'), true);
assert.equal(domArtifact.missingRuntimeCapabilities.includes('dom'), true);
assert.equal(domArtifact.admissionRecord.missingRuntimeCapabilities.includes('dom'), true);
assert.equal(domArtifact.evidenceReceipt.missingRuntimeCapabilities.includes('dom'), true);
assert.equal(queryUniversalConversionArtifacts(domArtifacts, { missingRuntimeCapability: 'dom' })[0].routeId, missingDomRoute.id);

const fetchAdapterRoute = conversionRouteForRequirement('fetch');
assert.equal(fetchAdapterRoute.runtime.readiness, 'needs-review');
assert.equal(fetchAdapterRoute.runtime.missingCapabilities.length, 0);
assert.equal(fetchAdapterRoute.runtime.adapterRequirements.length, 1);
assert.equal(fetchAdapterRoute.readiness, 'needs-review');
assert.equal(fetchAdapterRoute.admissionAction, 'prioritize');
assert.equal(fetchAdapterRoute.missingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(fetchAdapterRoute.review.some((reason) => reason.includes('Runtime adapter evidence is required for fetch.')), true);
assert.equal(fetchAdapterRoute.mergeScore.risk, 'medium');

const canvasProofSignals = runtimeProofSignalsForCapability('canvas');
const canvasAdapterRoute = conversionRouteForRequirement('canvas');
assert.equal(canvasAdapterRoute.runtime.readiness, 'needs-review');
assert.equal(canvasAdapterRoute.runtime.missingCapabilities.length, 0);
assert.equal(canvasAdapterRoute.runtime.adapterRequirements[0].capability, 'canvas');
assert.equal(canvasAdapterRoute.runtime.proofObligations[0].capability, 'canvas');
assert.equal(canvasAdapterRoute.runtime.proofObligations[0].missingSignals.includes('bitmap-hash'), true);
assert.equal(canvasAdapterRoute.missingEvidence.includes('runtime-proof-signal:bitmap-hash'), true);
assert.equal(canvasAdapterRoute.translationAdmission.runtimeProofMissingSignals.includes('bitmap-hash'), true);
assert.equal(queryUniversalConversionPlan(conversionPlanForRequirement('canvas'), {
  target: 'rust',
  runtimeProofMissingSignal: 'bitmap-hash'
}).bestRoute.runtime.proofObligations[0].capability, 'canvas');
assert.equal(queryUniversalConversionPlan(conversionPlanForRequirement('canvas'), {
  target: 'rust',
  runtimeProofStatus: 'needs-evidence',
  runtimeProofRequiredSignal: 'bitmap-hash'
}).bestRoute.runtime.proofObligations[0].status, 'needs-evidence');
const satisfiedCanvasPlan = conversionPlanForRequirement('canvas', [{
  id: 'canvas_runtime_signal_bundle',
  kind: 'conversion-runtime-proof',
  status: 'passed',
  capability: 'canvas',
  runtimeProofSignals: canvasProofSignals
}]);
assert.equal(queryUniversalConversionPlan(satisfiedCanvasPlan, {
  target: 'rust',
  runtimeProofStatus: 'satisfied',
  runtimeProofProvidedSignal: 'bitmap-hash'
}).bestRoute.runtime.proofObligations[0].status, 'satisfied');
assert.equal(queryUniversalConversionPlan(satisfiedCanvasPlan, {
  target: 'rust',
  runtimeProofMissingSignal: 'bitmap-hash'
}).found, false);
const canvasArtifacts = createUniversalConversionArtifacts(conversionPlanForRequirement('canvas'), { routeId: canvasAdapterRoute.id });
assert.equal(queryUniversalConversionArtifacts(canvasArtifacts, { runtimeProofMissingSignal: 'bitmap-hash' })[0].runtimeProofMissingSignals.includes('bitmap-hash'), true);
assert.equal(queryUniversalConversionArtifacts(canvasArtifacts, { runtimeProofCapability: 'canvas' })[0].runtimeProofCapabilities.includes('canvas'), true);
assert.equal(queryUniversalConversionArtifacts(canvasArtifacts, { runtimeProofStatus: 'needs-evidence' })[0].runtimeProofStatuses.includes('needs-evidence'), true);
assert.equal(queryUniversalConversionArtifacts(canvasArtifacts, { runtimeProofRequiredSignal: 'bitmap-hash' })[0].runtimeProofRequiredSignals.includes('bitmap-hash'), true);
assert.equal(canvasArtifacts.routeArtifacts[0].admissionRecord.runtimeProofCapabilities.includes('canvas'), true);
assert.equal(canvasArtifacts.routeArtifacts[0].admissionRecord.evidence.runtimeProofMissingSignals.includes('bitmap-hash'), true);
assert.equal(canvasArtifacts.summary.compactCounts.runtimeProof.byCapability.canvas, 1);
assert.equal(canvasArtifacts.summary.compactCounts.runtimeProof.requiredSignals['bitmap-hash'], 1);
assert.equal(canvasArtifacts.summary.compactCounts.evidenceReceipts.runtimeProofByStatus['needs-evidence'], 1);
assert.equal(canvasAdapterRoute.missingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(canvasAdapterRoute.review.some((reason) => reason.includes('Runtime adapter evidence is required for canvas.')), true);

const secretRoute = conversionRouteForRequirement('secrets');
assert.equal(secretRoute.runtime.readiness, 'blocked');
assert.equal(secretRoute.readiness, 'blocked');
assert.equal(secretRoute.admissionAction, 'reject');
assert.equal(secretRoute.blockers.some((reason) => reason.includes('javascript:web does not declare required runtime capability secrets')), true);

const shellRuntimeMatrix = createUniversalRuntimeCapabilityMatrix({
  generatedAt: 792,
  sourceHosts: ['javascript:node'],
  targetHosts: ['javascript:web'],
  runtimeRequirements: [{ sourceHost: 'javascript:node', targetHost: 'javascript:web', capability: 'shell' }]
});
const shellRuntimeRoute = queryUniversalRuntimeCapabilityMatrix(shellRuntimeMatrix, { sourceRuntime: 'node', targetRuntime: 'web', capability: 'shell' }).bestRoute;
assert.equal(shellRuntimeRoute.requiredCapabilities.includes('shell'), true);
assert.equal(shellRuntimeRoute.missingCapabilities.includes('shell'), true);
assert.equal(shellRuntimeRoute.adapterRequirements[0].adapterKind, 'node-shell-to-web-shell');
assert.equal(shellRuntimeRoute.proofObligations[0].missingSignals.includes('shell-policy'), true);

const satisfiedCanvasProof = createUniversalRuntimeProofObligation({
  capability: 'canvas',
  adapterRequirement: canvasAdapterRoute.runtime.adapterRequirements[0],
  providedSignals: canvasProofSignals
});
const unscopedCanvasProof = createUniversalRuntimeProofObligation({
  capability: 'canvas',
  adapterRequirement: canvasAdapterRoute.runtime.adapterRequirements[0],
  evidence: [Object.fromEntries(canvasProofSignals.map((signal) => [signal.replace(/-([a-z])/g, (_, char) => char.toUpperCase()), `${signal}_hash`]))]
});
const scopedCanvasProof = createUniversalRuntimeProofObligation({
  capability: 'canvas',
  adapterRequirement: canvasAdapterRoute.runtime.adapterRequirements[0],
  evidence: [{ status: 'passed', capability: 'canvas', runtimeProofSignals: canvasProofSignals }]
});
const failedCanvasProof = createUniversalRuntimeProofObligation({
  capability: 'canvas',
  adapterRequirement: canvasAdapterRoute.runtime.adapterRequirements[0],
  evidence: [{ id: 'failed_canvas_runtime_signal_bundle', status: 'failed', capability: 'canvas', runtimeProofSignals: canvasProofSignals }]
});
assert.equal(UniversalRuntimeProofSignalKinds.includes('bitmap-hash'), true);
assert.equal(satisfiedCanvasProof.status, 'satisfied');
assert.equal(unscopedCanvasProof.status, 'needs-evidence');
assert.equal(scopedCanvasProof.status, 'satisfied');
assert.equal(failedCanvasProof.status, 'needs-evidence');
assert.equal(failedCanvasProof.evidenceIds.includes('failed_canvas_runtime_signal_bundle'), false);
assert.equal(runtimeProofObligationMatches(satisfiedCanvasProof, { runtimeProofCapability: 'canvas', runtimeProofProvidedSignal: 'bitmap-hash' }), true);
assert.equal(summarizeRuntimeProofObligations([satisfiedCanvasProof]).byCapability.canvas, 1);

const hostPlan = createUniversalConversionPlan({
  generatedAt: 791,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  sourceHosts: ['javascript:web', 'javascript:node'],
  targetHosts: ['rust:cli'],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'filesystem' }],
  evidence: [{ id: 'host_filesystem_proof', kind: 'conversion-runtime-proof', status: 'passed', sourceLanguage: 'javascript', target: 'rust' }]
});
const hostQuery = queryUniversalConversionPlan(hostPlan, { sourceLanguage: 'javascript', target: 'rust' });
assert.equal(hostQuery.routes.length, 2);
assert.equal(new Set(hostQuery.routes.map((route) => route.id)).size, 2);
const webHostRoute = queryUniversalConversionPlan(hostPlan, { sourceHostId: 'javascript:web', target: 'rust' }).bestRoute;
const nodeHostRoute = queryUniversalConversionPlan(hostPlan, { sourceRuntime: 'node', target: 'rust' }).bestRoute;
assert.equal(webHostRoute.runtime.source.id, 'javascript:web');
assert.equal(webHostRoute.readiness, 'blocked');
assert.equal(webHostRoute.admissionAction, 'reject');
assert.equal(nodeHostRoute.runtime.source.id, 'javascript:node');
assert.equal(nodeHostRoute.readiness, 'needs-review');
assert.equal(nodeHostRoute.admissionAction, 'prioritize');
assert.equal(hostQuery.bestRoute.id, nodeHostRoute.id);
assert.equal(queryUniversalConversionPlan(hostPlan, { runtimeReadiness: 'blocked' }).bestRoute.id, webHostRoute.id);
assert.equal(queryUniversalConversionPlan(hostPlan, { runtimeAdapterRequirementId: nodeHostRoute.runtimeAdapterRequirements[0].id }).bestRoute.id, nodeHostRoute.id);
const hostArtifacts = createUniversalConversionArtifacts(hostPlan);
const webHostArtifact = queryUniversalConversionArtifacts(hostArtifacts, { sourceHostId: 'javascript:web', target: 'rust' })[0];
const nodeHostArtifact = queryUniversalConversionArtifacts(hostArtifacts, { sourceRuntime: 'node', target: 'rust' })[0];
assert.equal(webHostArtifact.runtimeRouteId, webHostRoute.runtime.routeId);
assert.equal(webHostArtifact.sourceHostId, 'javascript:web');
assert.equal(webHostArtifact.targetHostId, 'rust:cli');
assert.equal(webHostArtifact.sourceRuntime, 'web');
assert.equal(webHostArtifact.runtimeReadiness, 'blocked');
assert.equal(nodeHostArtifact.runtimeRouteId, nodeHostRoute.runtime.routeId);
assert.equal(nodeHostArtifact.sourceRuntime, 'node');
assert.equal(nodeHostArtifact.runtimeReadiness, 'needs-review');
assert.equal(nodeHostArtifact.requiredRuntimeCapabilities.includes('filesystem'), true);
assert.equal(queryUniversalConversionArtifacts(hostArtifacts, { runtimeRouteId: webHostRoute.runtime.routeId })[0].routeId, webHostRoute.id);
assert.equal(queryUniversalConversionArtifacts(hostArtifacts, { runtimeReadiness: 'blocked' })[0].runtimeRouteId, webHostRoute.runtime.routeId);
assert.equal(queryUniversalConversionArtifacts(hostArtifacts, { requiredRuntimeCapability: 'filesystem' }).length, 2);
assert.equal(hostArtifacts.index.runtimeRouteIds.includes(webHostRoute.runtime.routeId), true);
assert.equal(hostArtifacts.index.sourceHostIds.includes('javascript:node'), true);
assert.equal(hostArtifacts.index.targetHostIds.includes('rust:cli'), true);
assert.equal(hostArtifacts.index.sourceRuntimes.includes('web'), true);
assert.equal(hostArtifacts.index.targetRuntimes.includes('cli'), true);
assert.equal(hostArtifacts.index.requiredRuntimeCapabilities.includes('filesystem'), true);
assert.equal(hostArtifacts.summary.compactCounts.runtimeRoutes.bySourceHost['javascript:web'], 1);
assert.equal(hostArtifacts.summary.compactCounts.runtimeRoutes.byReadiness.blocked, 1);
assert.equal(hostArtifacts.summary.compactCounts.runtimeRoutes.requiredCapabilities.filesystem, 2);
assert.equal(webHostArtifact.evidenceReceipt.runtimeRouteId, webHostRoute.runtime.routeId);
assert.equal(nodeHostArtifact.admissionRecord.ids.runtimeRouteId, nodeHostRoute.runtime.routeId);
assert.equal(nodeHostArtifact.admissionRecord.sourceHostId, 'javascript:node');
assert.equal(nodeHostArtifact.admissionRecord.requiredRuntimeCapabilities.includes('filesystem'), true);

function conversionRouteForRequirement(capability) {
  return queryUniversalConversionPlan(conversionPlanForRequirement(capability), {
    sourceLanguage: 'javascript',
    target: 'rust'
  }).bestRoute;
}

function conversionPlanForRequirement(capability, extraEvidence = []) {
  return createUniversalConversionPlan({
    generatedAt: 790,
    universalCapabilityMatrix: readyCapabilityMatrix(),
    targets: ['rust'],
    runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability }],
    evidence: [routeProof(capability), ...extraEvidence]
  });
}

function routeProof(capability) {
  return {
    id: `runtime_${capability}_proof`,
    kind: 'conversion-runtime-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 790,
    languages: [{
      language: 'javascript',
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: {
          exactSource: { evidence: { importsWithExactSource: 1 } },
          stubs: { evidence: { importsWithDeclarations: 1 } }
        },
        targets: [{
          target: 'rust',
          lossClass: 'targetAdapterProjection',
          supported: true,
          readiness: 'ready',
          adapter: 'fixture-js-rust',
          adapterKind: 'targetProjection',
          lossKinds: [],
          reason: 'fixture ready adapter'
        }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['rust'] }
  };
}
