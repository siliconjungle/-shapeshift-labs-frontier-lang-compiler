import { assert } from './helpers.mjs';
import {
  createUniversalBorrowScopeConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const degradedBorrowScope = createUniversalBorrowScopeConstraintEvidence({
  routeId: 'rust_to_typescript_borrow_scope',
  sourceLanguage: 'rust',
  target: 'typescript',
  ownershipConstraint: { requiredKinds: ['exclusive-borrow', 'move-invalidates-source'], representedKinds: ['exclusive-borrow'], missingKinds: [], missingEvidence: [] },
  lifetimeConstraint: { requiredKinds: ['loan-region-binding', 'move-region-bound'], representedKinds: ['loan-region-binding'], missingKinds: [], missingEvidence: [] },
  controlFlowConstraint: { requiredKinds: ['branch-condition', 'await-order', 'early-return'], representedKinds: ['branch-condition'], missingKinds: ['await-order', 'early-return'], missingEvidence: [] },
  targetBorrowScopes: [{ id: 'target_loan_scope', kind: 'loan scope boundary', evidenceIds: ['target_scope_probe'] }]
});
assert.equal(degradedBorrowScope.status, 'degraded');
assert.equal(degradedBorrowScope.requiredKinds.includes('borrow-across-await'), true);
assert.equal(degradedBorrowScope.requiredKinds.includes('exclusive-borrow-branch-join'), true);
assert.equal(degradedBorrowScope.missingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(degradedBorrowScope.claims.borrowCheckerClaim, false);
assert.equal(degradedBorrowScope.claims.flowSensitiveLifetimeClaim, false);

const borrowScopePlan = createUniversalConversionPlan({
  generatedAt: 831,
  universalCapabilityMatrix: capabilityMatrix(),
  targets: ['rust'],
  imports: [sourceImport()],
  evidence: [routeProof('borrow_scope_constraint')],
  resourceTransfers: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceResourceGraph: sourceResourceGraph(),
    targetResourceGraph: targetResourceGraph()
  }],
  lifetimeConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }, { kind: 'move region bound' }],
    targetLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }]
  }],
  controlFlowConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceControlFlows: [
      { id: 'ownership_branch', kind: 'branch condition' },
      { id: 'ownership_await', kind: 'await-order promise chain' },
      { id: 'ownership_return', kind: 'early-return' }
    ],
    targetControlFlows: [{ id: 'rust_ownership_branch', kind: 'branch condition' }]
  }],
  borrowScopeConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    targetBorrowScopes: [{ id: 'rust_loan_scope_boundary', kind: 'loan scope boundary' }]
  }]
});
const borrowScopeRoute = queryUniversalConversionPlan(borrowScopePlan, {
  borrowScopeConstraintStatus: 'degraded',
  borrowScopeConstraintMissingKind: 'borrow-across-await'
}).bestRoute;
assert.equal(borrowScopeRoute.translationAdmission.status, 'needs-evidence');
assert.equal(borrowScopeRoute.translationAdmission.borrowScopeConstraintStatus, 'degraded');
assert.equal(borrowScopeRoute.missingEvidence.includes('translation-borrow-scope-proof'), true);

const borrowScopeArtifacts = createUniversalConversionArtifacts(borrowScopePlan, {
  routeId: borrowScopeRoute.id,
  generatedAt: 832
});
const borrowScopeArtifact = queryUniversalConversionArtifacts(borrowScopeArtifacts, {
  borrowScopeConstraintMissingEvidence: 'translation-borrow-scope:borrow-across-await'
})[0];
assert.equal(borrowScopeArtifact.admissionRecord.borrowScopeConstraint.missingKinds.includes('borrow-across-await'), true);
assert.equal(borrowScopeArtifacts.index.borrowScopeConstraintStatuses.includes('degraded'), true);
assert.equal(borrowScopeArtifacts.index.borrowScopeConstraintMissingKinds.includes('exclusive-borrow-branch-join'), true);
assert.equal(borrowScopeArtifacts.summary.compactCounts.borrowScopeConstraint.missingKinds['borrow-across-await'], 1);

function capabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 831,
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
    id: 'native_import_js_borrow_scope_constraint',
    language: 'javascript',
    sourcePath: 'src/borrow-scope.js',
    sourceHash: 'hash_borrow_scope_source',
    evidence: [{ id: 'native_import_borrow_scope_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_borrow_scope', ownershipKeys: ['borrow.user'], conflictKeys: ['borrow.user'] }],
    sourceMaps: [{ id: 'source_map_borrow_scope', mappings: [{ id: 'source_map_mapping_borrow_scope', ownershipRegionKey: 'borrow.user', sourceSpan: { path: 'src/borrow-scope.js' } }] }]
  };
}

function graphSummary(overrides = {}) {
  return { records: 4, resources: 1, owners: 1, loans: 1, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 1, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: [], ...overrides };
}

function sourceResourceGraph() {
  return {
    id: 'source_borrow_scope_graph',
    summary: graphSummary({ moves: 1 }),
    resources: [{ id: 'user', resourceKind: 'object' }],
    owners: [{ id: 'user_owner', ownerKind: 'single' }],
    loans: [{ id: 'user_mut_loan', mode: 'mutable', lifetimeRegionId: 'lt_user' }],
    moves: [{ id: 'user_move', moveKind: 'move', lifetimeRegionId: 'lt_user' }],
    lifetimeRegions: [{ id: 'lt_user', lifetimeKind: 'lexical' }]
  };
}

function targetResourceGraph() {
  return {
    id: 'target_borrow_scope_graph',
    summary: graphSummary(),
    resources: [{ id: 'user', resourceKind: 'object' }],
    owners: [{ id: 'user_owner', ownerKind: 'single' }],
    loans: [{ id: 'user_mut_loan', mode: 'mutable', lifetimeRegionId: 'lt_user' }],
    lifetimeRegions: [{ id: 'lt_user', lifetimeKind: 'lexical' }]
  };
}

function routeProof(id) {
  return { id: `evidence_${id}_translation_proof`, kind: 'conversion-replay-proof', status: 'passed', routeId: 'conversion_javascript_to_rust', sourceLanguage: 'javascript', target: 'rust' };
}
