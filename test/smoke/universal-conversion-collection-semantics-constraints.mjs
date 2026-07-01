import { assert } from './helpers.mjs';
import {
  createUniversalCollectionSemanticsConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  collectionSemanticsConstraintMatches,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds
} from './compiler-api.mjs';

const collectionKinds = [
  'collection-type',
  'sequence-order',
  'index-semantics',
  'bounds-semantics',
  'length-semantics',
  'collection-slicing',
  'sparse-holes',
  'iteration-order',
  'duplicate-policy',
  'map-key-semantics',
  'set-membership',
  'key-equality',
  'hash-semantics',
  'comparator-semantics',
  'mutability',
  'persistence',
  'copy-on-write',
  'iterator-invalidation',
  'lazy-evaluation',
  'capacity-growth',
  'concurrency-safety'
];

const preserved = createUniversalCollectionSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceCollectionSemanticsRecords: [collectionRecord('source_collection_contract', collectionKinds)],
  targetCollectionSemanticsRecords: [collectionRecord('target_collection_contract', collectionKinds)],
  evidenceIds: ['collection_semantics_contract_proof']
});

assert.equal(preserved.status, 'satisfied');
assert.equal(preserved.action, 'attach-collection-semantics-record');
assert.equal(preserved.requiredKinds.includes('map-key-semantics'), true);
assert.equal(preserved.requiredKinds.includes('iterator-invalidation'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.collectionEquivalenceClaim, false);
assert.equal(preserved.claims.orderingEquivalenceClaim, false);
assert.equal(preserved.claims.lookupEquivalenceClaim, false);
assert.equal(preserved.claims.semanticEquivalenceClaim, false);
assert.equal(preserved.claims.autoMergeClaim, false);
assert.equal(collectionSemanticsConstraintMatches(preserved, { collectionSemanticsConstraintStatus: 'satisfied' }), true);

const failClosedWithoutTarget = createUniversalCollectionSemanticsConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'typescript',
  sourceCollectionSemanticsRecords: [collectionRecord('source_hash_map_contract', [
    'collection-type',
    'iteration-order',
    'map-key-semantics',
    'key-equality',
    'hash-semantics',
    'sparse-holes',
    'iterator-invalidation'
  ])]
});

assert.equal(failClosedWithoutTarget.status, 'needs-evidence');
assert.equal(failClosedWithoutTarget.action, 'collect-collection-semantics-evidence');
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-collection-semantics-target-evidence'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-collection-semantics-proof'), true);
assert.equal(failClosedWithoutTarget.missingEvidence.includes('translation-collection-semantics:key-equality'), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Lookup')), true);
assert.equal(failClosedWithoutTarget.review.some((entry) => entry.includes('Ordering')), true);
assert.equal(failClosedWithoutTarget.claims.semanticEquivalenceClaim, false);
assert.equal(failClosedWithoutTarget.claims.autoMergeClaim, false);

const preserveSource = createUniversalConversionPlan({
  generatedAt: 2501,
  universalCapabilityMatrix: capabilityMatrix('typescript', 'typescript', ['ts']),
  targets: ['typescript'],
  evidence: [routeProof('typescript', 'typescript')],
  collectionSemanticsConstraints: [{
    sourceLanguage: 'typescript',
    target: 'typescript',
    sourceCollectionSemanticsRecords: [collectionRecord('same_language_array_contract', ['collection-type', 'sequence-order', 'index-semantics'])]
  }]
});
const preserveRoute = queryUniversalConversionPlan(preserveSource, {
  sourceLanguage: 'typescript',
  target: 'typescript',
  collectionSemanticsConstraintStatus: 'satisfied'
}).bestRoute;

assert.equal(Boolean(preserveRoute), true);
assert.equal(preserveRoute.mode, 'preserve-source');
assert.equal(preserveRoute.collectionSemanticsConstraint.status, 'satisfied');
assert.equal(preserveRoute.collectionSemanticsConstraint.missingEvidence.length, 0);
assert.equal(preserveRoute.translationAdmission.collectionSemanticsConstraintStatus, 'satisfied');
assert.equal(preserveRoute.semanticEquivalenceClaim, false);

const routePlan = createUniversalConversionPlan({
  generatedAt: 2502,
  universalCapabilityMatrix: capabilityMatrix('rust', 'typescript'),
  targets: ['typescript'],
  evidence: [routeProof('rust', 'typescript')],
  imports: [{ language: 'rust', collectionSemanticsRecords: [collectionRecord('imported_vec_contract', ['collection-type', 'sequence-order', 'capacity-growth'])] }],
  collectionSemanticsConstraints: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceCollectionSemanticsRecords: [collectionRecord('route_collection_contract', [
      'collection-type',
      'sequence-order',
      'index-semantics',
      'bounds-semantics',
      'iteration-order',
      'map-key-semantics',
      'key-equality',
      'hash-semantics',
      'mutability',
      'iterator-invalidation'
    ])],
    targetCollectionSemanticsRecords: [{ id: 'target_partial_collection_contract', constraintKinds: ['collection-type', 'sequence-order'] }]
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  collectionSemanticsConstraintStatus: 'degraded',
  collectionSemanticsConstraintMissingKind: 'key-equality',
  interlinguaConstraintFamily: 'collection-semantics',
  interlinguaConstraintObligationKind: 'key-equality',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.collectionSemanticsConstraint.status, 'degraded');
assert.equal(route.collectionSemanticsConstraint.missingKinds.includes('key-equality'), true);
assert.equal(route.collectionSemanticsConstraint.missingEvidence.includes('translation-collection-semantics:hash-semantics'), true);
assert.equal(route.missingEvidence.includes('translation-collection-semantics-proof'), true);
assert.equal(route.translationAdmission.collectionSemanticsConstraintStatus, 'degraded');
assert.equal(route.translationAdmission.requiredConstructKinds.includes('collection-semantics-contract'), true);
assert.equal(route.interlingua.layers.kinds.includes('collection-semantics-contract'), true);
assert.equal(route.interlingua.constraints.families.includes('collection-semantics'), true);
const equalityObligation = route.interlingua.constraints.obligations.find((obligation) => obligation.family === 'collection-semantics' && obligation.kind === 'key-equality');
assert.equal(equalityObligation.status, 'missing');
assert.equal(equalityObligation.sourceNodeIds.includes('route_collection_contract'), true);
assert.equal(equalityObligation.targetNodeIds.length, 0);
assert.equal(UniversalInterlinguaLayerKinds.includes('collection-semantics-contract'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('collection-semantics'), true);
assert.equal(route.autoMergeClaim, false);
assert.equal(route.semanticEquivalenceClaim, false);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 2503 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  collectionSemanticsConstraintMissingKind: 'key-equality',
  collectionSemanticsConstraintMissingEvidence: 'translation-collection-semantics:hash-semantics',
  interlinguaConstraintFamily: 'collection-semantics',
  interlinguaConstraintObligationKind: 'key-equality',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.collectionSemanticsConstraint.status, 'degraded');
assert.equal(artifacts.index.collectionSemanticsConstraintStatuses.includes('degraded'), true);
assert.equal(artifacts.index.collectionSemanticsConstraintMissingKinds.includes('key-equality'), true);
assert.equal(artifacts.summary.compactCounts.collectionSemanticsConstraint.missingKinds['key-equality'], 1);
assert.equal(artifact.admissionRecord.collectionSemanticsConstraint.status, 'degraded');
assert.equal(artifact.admissionRecord.metadata.collectionSemanticsConstraint.status, 'degraded');
assert.equal(artifact.materialization.autoMergeClaim, false);
assert.equal(artifact.materialization.semanticEquivalenceClaim, false);
assert.equal(artifact.autoMergeClaim, false);
assert.equal(artifact.semanticEquivalenceClaim, false);

function collectionRecord(id, constraintKinds) {
  return {
    id,
    collectionKind: 'ordered-hash-map',
    name: 'UsersById',
    elementKind: 'User',
    keyKind: 'UserId',
    valueKind: 'User',
    ordering: 'insertion-order',
    iterationOrder: 'stable',
    duplicatePolicy: 'unique-key',
    equality: 'semantic-key-equality',
    hash: 'stable-hash',
    comparator: 'none',
    indexBase: 0,
    boundsBehavior: 'checked',
    lengthSemantics: 'logical-size',
    sparseSemantics: 'no-holes',
    mutability: 'mutable',
    persistence: 'ephemeral',
    copyOnWrite: false,
    iteratorInvalidation: 'mutation-invalidates',
    traversal: 'eager',
    capacityGrowth: 'amortized',
    concurrency: 'single-threaded',
    constraintKinds
  };
}

function routeProof(sourceLanguage, target) {
  return { id: `collection_route_proof_${sourceLanguage}_${target}`, kind: 'conversion-replay-proof', status: 'passed', routeId: `conversion_${sourceLanguage}_to_${target}`, sourceLanguage, target };
}

function capabilityMatrix(language, target, aliases = ['rs']) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 2500,
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
