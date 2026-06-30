import { assert } from './helpers.mjs';
import {
  borrowCheckerConstraintMatches,
  createSemanticResourceGraph,
  createUniversalBorrowCheckerConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const rustGraph = rustBorrowCheckerGraph('source');
const preserved = createUniversalBorrowCheckerConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceGraph: rustGraph,
  targetGraph: rustBorrowCheckerGraph('target'),
  controlFlowConstraint: {
    requiredKinds: ['early-return', 'generator-yield'],
    representedKinds: ['early-return', 'generator-yield']
  }
});

assert.equal(preserved.status, 'preserved');
assert.equal(preserved.requiredKinds.includes('ownership:reborrow-chain'), true);
assert.equal(preserved.requiredKinds.includes('ownership:two-phase-borrow'), true);
assert.equal(preserved.requiredKinds.includes('ownership:interior-mutability'), true);
assert.equal(preserved.requiredKinds.includes('ownership:pin-stability'), true);
assert.equal(preserved.requiredKinds.includes('ownership:send-sync-thread-transfer'), true);
assert.equal(preserved.requiredKinds.includes('ownership:drop-check'), true);
assert.equal(preserved.requiredKinds.includes('lifetime:non-lexical-lifetime'), true);
assert.equal(preserved.requiredKinds.includes('lifetime:higher-ranked-lifetime'), true);
assert.equal(preserved.requiredKinds.includes('borrow-scope:two-phase-borrow-activation'), true);
assert.equal(preserved.requiredKinds.includes('borrow-scope:pin-projection-boundary'), true);
assert.equal(preserved.claims.borrowCheckerClaim, false);
assert.equal(borrowCheckerConstraintMatches(preserved, { borrowCheckerConstraintRequiredKind: 'ownership:pin-stability' }), true);

const plan = createUniversalConversionPlan({
  generatedAt: 944,
  universalCapabilityMatrix: capabilityMatrix(),
  targets: ['typescript'],
  imports: [sourceImport(rustGraph)],
  evidence: [routeProof()]
});
const route = queryUniversalConversionPlan(plan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  borrowCheckerConstraintStatus: 'needs-evidence',
  borrowCheckerConstraintMissingKind: 'ownership:pin-stability'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.borrowCheckerConstraint.missingKinds.includes('ownership:reborrow-chain'), true);
assert.equal(route.borrowCheckerConstraint.missingKinds.includes('ownership:send-sync-thread-transfer'), true);
assert.equal(route.borrowCheckerConstraint.missingKinds.includes('lifetime:drop-check-lifetime'), true);
assert.equal(route.borrowCheckerConstraint.missingKinds.includes('borrow-scope:interior-mutability-runtime-check'), true);
assert.equal(route.translationAdmission.borrowCheckerConstraintMissingEvidence.includes('translation-ownership-constraint:pin-stability'), true);
assert.equal(route.translationAdmission.missingEvidence.includes('translation-borrow-scope:pin-projection-boundary'), true);
assert.equal(route.interlingua.constraints.obligations.some((obligation) => obligation.family === 'borrow-checker' && obligation.kind === 'ownership:pin-stability' && obligation.status === 'missing'), true);

const artifacts = createUniversalConversionArtifacts(plan, { routeId: route.id, generatedAt: 945 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  borrowCheckerConstraintMissingKind: 'ownership:pin-stability',
  interlinguaConstraintObligationKind: 'ownership:pin-stability'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.admissionRecord.borrowCheckerConstraint.missingKinds.includes('ownership:pin-stability'), true);
assert.equal(artifacts.index.borrowCheckerConstraintMissingKinds.includes('borrow-scope:two-phase-borrow-activation'), true);
assert.equal(artifacts.summary.compactCounts.borrowCheckerConstraint.missingKinds['ownership:pin-stability'], 1);

function rustBorrowCheckerGraph(prefix) {
  return createSemanticResourceGraph({
    id: `${prefix}_rust_borrow_checker_graph`,
    language: 'rust',
    sourcePath: `${prefix}.rs`,
    sourceHash: `hash:${prefix}`,
    resources: [{
      id: `${prefix}_node`,
      name: 'node',
      ownerId: `${prefix}_owner`,
      resourceKind: 'Arc<Mutex<Pin<Box<Node>>>>',
      metadata: { factKinds: ['interior-mutability', 'pin-stability'], autoTraits: ['Send', 'Sync'] }
    }],
    owners: [{ id: `${prefix}_owner`, name: 'owner', ownerKind: 'single-owner' }],
    lifetimeRegions: [{
      id: `${prefix}_lt`,
      name: 'nll region',
      lifetimeKind: 'non-lexical-lifetime',
      metadata: { factKinds: ['non-lexical-lifetime', 'variance-lifetime', 'drop-check-lifetime'] }
    }],
    lifetimeRelations: [{
      id: `${prefix}_for_all`,
      relationKind: 'outlives',
      fromLifetimeId: `${prefix}_lt`,
      toLifetimeId: 'static',
      metadata: { factKinds: ['higher-ranked-lifetime', 'reborrow-lifetime'] }
    }],
    loans: [{
      id: `${prefix}_loan`,
      resourceId: `${prefix}_node`,
      ownerId: `${prefix}_owner`,
      lifetimeRegionId: `${prefix}_lt`,
      mode: 'mutable',
      metadata: { factKinds: ['reborrow', 'two-phase-borrow'] }
    }],
    borrowScopes: [{
      id: `${prefix}_scope`,
      resourceId: `${prefix}_node`,
      lifetimeRegionId: `${prefix}_lt`,
      scopeKind: 'rust-borrow-scope',
      constraintKinds: ['loan-scope-boundary', 'exclusive-borrow-alias-exclusion', 'exclusive-borrow-loan-exclusion', 'borrow-across-await', 'drop-cleanup-order', 'move-invalidates-exit', 'reborrow-chain-boundary', 'two-phase-borrow-activation', 'interior-mutability-runtime-check', 'pin-projection-boundary', 'iterator-yield-borrow', 'drop-check-flow']
    }],
    moves: [{
      id: `${prefix}_thread_move`,
      resourceId: `${prefix}_node`,
      fromOwnerId: `${prefix}_owner`,
      toOwnerId: `${prefix}_thread`,
      moveKind: 'thread-transfer',
      metadata: { factKinds: ['send-sync-thread-transfer'] }
    }],
    drops: [{
      id: `${prefix}_drop`,
      resourceId: `${prefix}_node`,
      ownerId: `${prefix}_owner`,
      lifetimeRegionId: `${prefix}_lt`,
      dropKind: 'destructor',
      metadata: { dropSemantics: 'drop-check', factKinds: ['drop-check'] }
    }]
  });
}

function sourceImport(resourceGraph) {
  return {
    id: 'native_import_rust_borrow_primitives',
    language: 'rust',
    sourcePath: 'src/borrow-primitives.rs',
    sourceHash: 'hash_rust_borrow_primitives',
    resourceGraph,
    evidence: [{ id: 'native_import_rust_borrow_primitives_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_rust_borrow_primitives', ownershipKeys: ['rust.node'], conflictKeys: ['rust.node'] }],
    sourceMaps: [{ id: 'source_map_rust_borrow_primitives', mappings: [{ id: 'source_map_mapping_rust_borrow_primitives', ownershipRegionKey: 'rust.node', sourceSpan: { path: 'src/borrow-primitives.rs' } }] }]
  };
}

function capabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 944,
    languages: [{
      language: 'rust',
      aliases: ['rs'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: 'ready',
        sourceProjection: { exactSource: { evidence: { importsWithExactSource: 1 } }, stubs: { evidence: { importsWithDeclarations: 1 } } },
        targets: [{ target: 'typescript', lossClass: 'targetAdapterProjection', supported: true, readiness: 'ready', adapter: 'fixture-rust-typescript', adapterKind: 'targetProjection', lossKinds: [], reason: 'fixture target adapter' }]
      },
      blockers: [],
      review: []
    }],
    matrices: { projectionReadiness: { languages: [{ language: 'rust', targets: [{ target: 'typescript', readiness: 'ready' }] }] } },
    metadata: { compileTargets: ['typescript'] }
  };
}

function routeProof() {
  return { id: 'evidence_rust_ts_borrow_primitives_route_proof', kind: 'conversion-replay-proof', status: 'passed', sourceLanguage: 'rust', target: 'typescript' };
}
