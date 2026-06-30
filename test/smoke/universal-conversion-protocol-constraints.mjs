import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalProtocolConstraintEvidence,
  protocolConstraintMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const preserved = createUniversalProtocolConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceProtocols: [{
    id: 'source_cache_trait',
    kind: 'trait object-safety coherence orphan',
    name: 'Cache',
    requirementNames: ['get'],
    associatedTypeNames: ['Item'],
    genericParameterNames: ['T'],
    boundNames: ['Send'],
    implementationKinds: ['blanket-implementation'],
    dispatchKinds: ['dynamic-dispatch']
  }],
  targetProtocols: [{
    id: 'target_cache_protocol',
    kind: 'protocol object-safety coherence orphan',
    name: 'Cache',
    requirementNames: ['get'],
    associatedTypeNames: ['Item'],
    genericParameterNames: ['T'],
    boundNames: ['Send'],
    implementationKinds: ['blanket-implementation'],
    dispatchKinds: ['dynamic-dispatch']
  }],
  evidenceIds: ['protocol_contract_preserved_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-protocol-constraint-record');
assert.equal(preserved.requiredKinds.includes('protocol-identity'), true);
assert.equal(preserved.requiredKinds.includes('required-member'), true);
assert.equal(preserved.requiredKinds.includes('associated-type'), true);
assert.equal(preserved.requiredKinds.includes('protocol-bound'), true);
assert.equal(preserved.requiredKinds.includes('dynamic-dispatch'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.protocolEquivalenceClaim, false);
assert.equal(protocolConstraintMatches(preserved, { protocolConstraintStatus: 'satisfied' }), true);

const degraded = createUniversalProtocolConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceProtocols: [{
    id: 'source_iterator_trait',
    kind: 'trait object-safety coherence orphan',
    name: 'Iterator',
    requirementNames: ['next'],
    associatedTypeNames: ['Item'],
    boundNames: ['Send'],
    implementationKinds: ['blanket-implementation', 'conditional-implementation'],
    dispatchKinds: ['dynamic-dispatch']
  }],
  targetProtocols: [{
    id: 'target_iterator_interface',
    kind: 'interface structural',
    name: 'Iterator',
    requirementNames: ['next']
  }]
});

assert.equal(degraded.status, 'degraded');
assert.equal(degraded.missingKinds.includes('associated-type'), true);
assert.equal(degraded.missingKinds.includes('protocol-bound'), true);
assert.equal(degraded.missingKinds.includes('dynamic-dispatch'), true);
assert.equal(degraded.missingEvidence.includes('translation-protocol-constraint:associated-type'), true);
assert.equal(degraded.review.some((entry) => entry.includes('Associated type')), true);

const routePlan = createUniversalConversionPlan({
  generatedAt: 970,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof()],
  protocolConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceProtocols: [{
      id: 'route_cache_trait',
      kind: 'trait object-safety coherence orphan',
      name: 'Cache',
      requirementNames: ['get'],
      associatedTypeNames: ['Item'],
      boundNames: ['Send'],
      implementationKinds: ['blanket-implementation'],
      dispatchKinds: ['dynamic-dispatch']
    }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  protocolConstraintStatus: 'needs-evidence',
  protocolConstraintMissingKind: 'associated-type'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.protocolConstraint.status, 'needs-evidence');
assert.equal(route.protocolConstraint.missingKinds.includes('coherence-rule'), true);
assert.equal(route.missingEvidence.includes('translation-protocol-constraint:associated-type'), true);
assert.equal(route.translationAdmission.protocolConstraintStatus, 'needs-evidence');
assert.equal(route.translationAdmission.protocolConstraintMissingEvidence.includes('translation-protocol-constraint:associated-type'), true);
assert.equal(route.translationAdmission.requiredConstructKinds.includes('protocol-contract'), true);
assert.equal(UniversalInterlinguaLayerKinds.includes('protocol-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('protocol'), true);
assert.equal(route.interlingua.constraints.families.includes('protocol'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'protocol' && obligation.kind === 'associated-type' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 971 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  protocolConstraintMissingKind: 'dynamic-dispatch',
  interlinguaConstraintFamily: 'protocol',
  interlinguaConstraintObligationKind: 'dynamic-dispatch',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.protocolConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.protocolConstraintMissingKinds.includes('associated-type'), true);
assert.equal(artifacts.summary.compactCounts.protocolConstraint.missingKinds['dynamic-dispatch'], 1);
assert.equal(artifact.admissionRecord.protocolConstraint.status, 'needs-evidence');
assert.equal(artifact.admissionRecord.metadata.protocolConstraint.status, 'needs-evidence');

function routeProof() {
  return { id: 'protocol_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_rust_to_typescript', sourceLanguage: 'rust', target: 'typescript' };
}

function capabilityMatrix(language, target) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 970,
    languages: [{
      language,
      aliases: ['rs'],
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
