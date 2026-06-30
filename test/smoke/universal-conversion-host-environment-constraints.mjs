import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalHostEnvironmentConstraintEvidence,
  hostEnvironmentConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const preserved = createUniversalHostEnvironmentConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'frontier-lang',
  sourceHostEnvironmentRecords: [
    { id: 'source_node_fs', kind: 'node filesystem process env permission', globalName: 'process', capability: 'filesystem', evidenceIds: ['source_host'] },
    { id: 'source_crypto', kind: 'crypto random timezone locale', apiName: 'crypto.randomUUID' }
  ],
  targetHostEnvironmentRecords: [
    { id: 'target_node_fs', kind: 'node filesystem process env permission', globalName: 'process', capability: 'filesystem', evidenceIds: ['target_host'] },
    { id: 'target_crypto', kind: 'crypto random timezone locale', apiName: 'crypto.randomUUID' }
  ],
  evidenceIds: ['host_environment_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-host-environment-record');
assert.equal(preserved.requiredKinds.includes('filesystem'), true);
assert.equal(preserved.requiredKinds.includes('environment-variable'), true);
assert.equal(preserved.requiredKinds.includes('permission-boundary'), true);
assert.equal(preserved.requiredKinds.includes('randomness'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.hostEquivalenceClaim, false);
assert.equal(preserved.claims.permissionEquivalenceClaim, false);
assert.equal(hostEnvironmentConstraintMatches(preserved, { hostEnvironmentConstraintStatus: 'satisfied' }), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 960,
  universalCapabilityMatrix: readyCapabilityMatrix(),
  targets: ['rust'],
  evidence: [routeProof()],
  hostEnvironmentConstraints: [{
    sourceLanguage: 'typescript',
    target: 'rust',
    sourceHostEnvironmentRecords: [
      { id: 'source_process_env', kind: 'node process env secret permission-boundary', globalName: 'process.env.API_TOKEN' },
      { id: 'source_shell_spawn', kind: 'shell command process filesystem platform path', apiName: 'spawn' },
      { id: 'source_dom_bridge', kind: 'browser dom window clipboard', globalName: 'window' }
    ]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  hostEnvironmentConstraintStatus: 'needs-evidence',
  hostEnvironmentConstraintMissingKind: 'environment-variable'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.hostEnvironmentConstraint.status, 'needs-evidence');
assert.equal(route.hostEnvironmentConstraint.missingKinds.includes('shell-command'), true);
assert.equal(route.missingEvidence.includes('translation-host-environment:environment-variable'), true);
assert.equal(route.translationAdmission.status, 'needs-evidence');
assert.equal(route.translationAdmission.hostEnvironmentConstraintStatus, 'needs-evidence');
assert.equal(route.translationAdmission.hostEnvironmentConstraintMissingEvidence.includes('translation-host-environment:shell-command'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('host-environment'), true);
assert.equal(route.interlingua.constraints.families.includes('host-environment'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'host-environment' && obligation.kind === 'shell-command' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 961 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  hostEnvironmentConstraintMissingKind: 'shell-command',
  interlinguaConstraintFamily: 'host-environment',
  interlinguaConstraintObligationKind: 'shell-command',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.hostEnvironmentConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.hostEnvironmentConstraintMissingKinds.includes('shell-command'), true);
assert.equal(artifacts.summary.compactCounts.hostEnvironmentConstraint.missingKinds['shell-command'], 1);
assert.equal(artifact.admissionRecord.hostEnvironmentConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.metadata.hostEnvironmentConstraint.status, 'needs-evidence');

function routeProof() {
  return { id: 'host_environment_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_typescript_to_rust', sourceLanguage: 'typescript', target: 'rust' };
}

function readyCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 960,
    languages: [{
      language: 'typescript',
      aliases: ['ts'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'rust', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-typescript-rust', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture ready adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'typescript', targets: [{ target: 'rust', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['rust'] }
  };
}
