import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalDependencySemanticsConstraintEvidence,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  dependencySemanticsConstraintMatches,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const dependencyKinds = [
  'package-manager',
  'manifest-schema',
  'version-range',
  'resolved-version',
  'lockfile-integrity',
  'dependency-class',
  'peer-dependency',
  'optional-dependency',
  'dev-dependency',
  'feature-flag',
  'workspace-boundary',
  'registry-source',
  'lifecycle-script',
  'native-abi',
  'build-tool',
  'package-manager-version',
  'offline-cache',
  'dedupe-hoist',
  'supply-chain-trust'
];

const preserved = createUniversalDependencySemanticsConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceDependencySemanticsRecords: [dependencyRecord('source_dependency_contract', dependencyKinds)],
  targetDependencySemanticsRecords: [dependencyRecord('target_dependency_contract', dependencyKinds)],
  evidenceIds: ['dependency_semantics_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-dependency-semantics-record');
assert.equal(preserved.requiredKinds.includes('lockfile-integrity'), true);
assert.equal(preserved.requiredKinds.includes('peer-dependency'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.dependencyEquivalenceClaim, false);
assert.equal(preserved.claims.resolutionEquivalenceClaim, false);
assert.equal(preserved.claims.lockfileEquivalenceClaim, false);
assert.equal(preserved.claims.supplyChainEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(dependencySemanticsConstraintMatches(preserved, { dependencySemanticsConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalDependencySemanticsConstraintEvidence({
  sourceLanguage: 'typescript',
  target: 'rust',
  sourceDependencySemanticsRecords: [dependencyRecord('source_package_lock_contract', [
    'package-manager',
    'manifest-schema',
    'version-range',
    'resolved-version',
    'lockfile-integrity',
    'peer-dependency',
    'lifecycle-script',
    'supply-chain-trust'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-dependency-semantics-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-dependency-semantics-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-dependency-semantics-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-dependency-semantics:lockfile-integrity'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('lockfile integrity')), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('supply-chain trust')), true);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2701,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  dependencySemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'typescript',
    sourceDependencySemanticsRecords: [dependencyRecord('same_language_package_contract', ['package-manager', 'manifest-schema', 'lockfile-integrity'])]
  }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, {
  sourceLanguage: 'typescript',
  target: 'typescript',
  dependencySemanticsConstraintStatus: 'satisfied'
}).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.dependencySemanticsConstraint.status, 'satisfied');
assert.equal(preserveRoute.dependencySemanticsConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.dependencySemanticsConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2702,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'rust'),
  targets: ['rust'],
  evidence: [routeProof('typescript', 'rust')],
  imports: [{ language: 'typescript', dependencySemanticsRecords: [dependencyRecord('imported_react_contract', ['package-manager', 'version-range', 'peer-dependency'])] }],
  dependencySemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'rust',
    sourceDependencySemanticsRecords: [dependencyRecord('route_dependency_contract', dependencyKinds)],
    targetDependencySemanticsRecords: [{ id: 'target_partial_dependency_contract', constraintKinds: ['package-manager', 'manifest-schema'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'typescript',
  target: 'rust',
  dependencySemanticsConstraintStatus: 'degraded',
  dependencySemanticsConstraintMissingKind: 'lockfile-integrity',
  interlinguaConstraintFamily: 'dependency-semantics',
  interlinguaConstraintObligationKind: 'lockfile-integrity',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.dependencySemanticsConstraint.status, 'degraded');
assert.equal(route.dependencySemanticsConstraint.missingKinds.includes('lockfile-integrity'), true);
assert.equal(route.dependencySemanticsConstraint.missingEvidence.includes('translation-dependency-semantics:supply-chain-trust'), true);
assert.equal(route.missingEvidence.includes('translation-dependency-semantics-proof'), true);
assert.equal(route.translationAdmission.dependencySemanticsConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('dependency-semantics-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('dependency-semantics-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('dependency-semantics'), true);
const lockfileObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'dependency-semantics' && obligation.kind === 'lockfile-integrity');
assert.equal(lockfileObligation.status, 'missing');
assert.equal(lockfileObligation.sourceNodeIds.includes('route_dependency_contract'), true);
assert.equal(lockfileObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('dependency-semantics-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('dependency-semantics'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2703 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  dependencySemanticsConstraintMissingKind: 'lockfile-integrity',
  dependencySemanticsConstraintMissingEvidence: 'translation-dependency-semantics:supply-chain-trust',
  interlinguaConstraintFamily: 'dependency-semantics',
  interlinguaConstraintObligationKind: 'lockfile-integrity',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.dependencySemanticsConstraint.status, 'degraded');
assert.equal(artifacts.index.dependencySemanticsConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.dependencySemanticsConstraintMissingKinds.includes('lockfile-integrity'), true);
assert.equal(artifacts.summary.compactCounts.dependencySemanticsConstraint.missingKinds['lockfile-integrity'], 1);
assert.equal(artifact.admissionRecord.dependencySemanticsConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.dependencySemanticsConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);

function dependencyRecord(id, constraintKinds) {
  return {
    id,
    kind: 'npm package-lock peer dependency integrity lifecycle supply-chain',
    name: 'checkout-web',
    packageName: '@example/checkout-web',
    packageManager: 'pnpm',
    manifestSchema: 'package.json',
    versionRange: '^1.2.3',
    resolvedVersion: '1.2.8',
    lockfile: 'pnpm-lock.yaml',
    integrity: 'sha512-fixture',
    dependencyClass: 'runtime',
    peerDependencies: { react: '^19.0.0' },
    optionalDependencies: { fsevents: '^2.3.3' },
    devDependencies: { vite: '^7.0.0' },
    features: ['payments'],
    workspace: 'apps/checkout',
    registry: 'https://registry.npmjs.org/',
    lifecycleScripts: { postinstall: 'node scripts/postinstall.mjs' },
    nativeAbi: 'node-napi',
    buildTool: 'vite',
    packageManagerVersion: 'pnpm@10.0.0',
    offlineCache: 'frozen-lockfile',
    dedupeHoist: 'isolated-node-linker',
    provenance: 'npm-provenance',
    trust: 'sigstore-attestation',
    constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `dependency_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['ts']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2700,
    languages: [{
      language,
      aliases,
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target, lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: `fixture-${language}-${target}`, adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language, targets: [{ target, readiness: 'ready' }] }] } },
    metadata: { compileTargets: [target] }
  };
}
