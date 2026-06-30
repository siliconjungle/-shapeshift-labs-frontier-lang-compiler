import { assert } from './helpers.mjs';
import {
  createUniversalControlFlowConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const degradedFlowConstraints = createUniversalControlFlowConstraintEvidence({
  routeId: 'typescript_to_rust_control_flow',
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceControlFlows: [
    { id: 'retry_branch', kind: 'branch condition', conditionHash: 'cond_retry' },
    { id: 'cleanup_finally', kind: 'try finally cleanup' },
    { id: 'fetch_await', kind: 'await-order promise chain', orderingKey: 'fetch:then:cleanup' }
  ],
  targetControlFlows: [{ id: 'rust_retry_branch', kind: 'branch condition', conditionHash: 'cond_retry' }]
});
assert.equal(degradedFlowConstraints.status, 'degraded');
assert.equal(degradedFlowConstraints.missingKinds.includes('finally-cleanup'), true);
assert.equal(degradedFlowConstraints.missingKinds.includes('await-order'), true);
assert.equal(degradedFlowConstraints.missingEvidence.includes('translation-control-flow-constraint:await-order'), true);
assert.equal(degradedFlowConstraints.claims.controlFlowEquivalenceClaim, false);
assert.equal(degradedFlowConstraints.claims.asyncOrderingClaim, false);

const degradedFlowPlan = createUniversalConversionPlan({
  generatedAt: 829,
  universalCapabilityMatrix: capabilityMatrix(),
  targets: ['rust'],
  imports: [sourceImport()],
  evidence: [routeProof('control_flow_constraint')],
  controlFlowConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceControlFlows: [
      { id: 'js_retry_branch', kind: 'branch condition', conditionHash: 'cond_retry' },
      { id: 'js_cleanup_finally', kind: 'try finally cleanup' },
      { id: 'js_fetch_await', kind: 'await-order promise chain', orderingKey: 'fetch:then:cleanup' }
    ],
    targetControlFlows: [{ id: 'rust_retry_branch', kind: 'branch condition', conditionHash: 'cond_retry' }]
  }]
});
const degradedFlowRoute = queryUniversalConversionPlan(degradedFlowPlan, {
  controlFlowConstraintStatus: 'degraded',
  controlFlowConstraintMissingKind: 'await-order'
}).bestRoute;
assert.equal(degradedFlowRoute.translationAdmission.status, 'needs-evidence');
assert.equal(degradedFlowRoute.translationAdmission.controlFlowConstraintStatus, 'degraded');
assert.equal(degradedFlowRoute.controlFlowConstraint.missingEvidence.includes('translation-control-flow-constraint:await-order'), true);
assert.equal(degradedFlowRoute.missingEvidence.includes('translation-control-flow-constraint-proof'), true);

const degradedFlowArtifacts = createUniversalConversionArtifacts(degradedFlowPlan, {
  routeId: degradedFlowRoute.id,
  generatedAt: 830
});
const degradedFlowArtifact = queryUniversalConversionArtifacts(degradedFlowArtifacts, {
  controlFlowConstraintMissingEvidence: 'translation-control-flow-constraint:await-order'
})[0];
assert.equal(degradedFlowArtifact.admissionRecord.controlFlowConstraint.missingKinds.includes('await-order'), true);
assert.equal(degradedFlowArtifacts.index.controlFlowConstraintStatuses.includes('degraded'), true);
assert.equal(degradedFlowArtifacts.index.controlFlowConstraintMissingKinds.includes('finally-cleanup'), true);
assert.equal(degradedFlowArtifacts.summary.compactCounts.controlFlowConstraint.missingKinds['await-order'], 1);

function capabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 829,
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
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-js-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_control_flow_constraint',
    language: 'javascript',
    sourcePath: 'src/control-flow.js',
    sourceHash: 'hash_control_flow_source',
    evidence: [{ id: 'native_import_control_flow_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_control_flow', ownershipKeys: ['flow.fetch'], conflictKeys: ['flow.fetch'] }],
    sourceMaps: [{ id: 'source_map_control_flow', mappings: [{ id: 'source_map_mapping_control_flow', ownershipRegionKey: 'flow.fetch', sourceSpan: { path: 'src/control-flow.js' } }] }]
  };
}

function routeProof(id) {
  return {
    id: `evidence_${id}_translation_proof`,
    kind: 'conversion-replay-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}
