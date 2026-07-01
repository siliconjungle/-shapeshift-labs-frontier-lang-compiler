import { assert } from './helpers.mjs';
import {
  borrowCheckerConstraintMatches,
  createSemanticImportSidecar,
  createSemanticResourceGraph,
  createUniversalBorrowCheckerConstraintEvidence,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionRouteEvidenceReceipt,
  createUniversalConversionWorklist,
  importNativeSource,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  queryUniversalConversionWorklist,
  UniversalInterlinguaConstraintEdgeKinds
} from './compiler-api.mjs';

const sourceGraph = borrowGraph('source');
const targetGraph = borrowGraph('target');
const preserved = createUniversalBorrowCheckerConstraintEvidence({
  sourceLanguage: 'rust',
  target: 'frontier-lang',
  sourceGraph,
  targetGraph,
  controlFlowConstraint: {
    requiredKinds: ['linear-control-flow'],
    representedKinds: ['linear-control-flow']
  }
});

assert.equal(preserved.status, 'preserved');
assert.equal(preserved.action, 'attach-borrow-checker-record');
assert.equal(preserved.requiredFamilies.includes('ownership'), true);
assert.equal(preserved.requiredFamilies.includes('lifetime'), true);
assert.equal(preserved.requiredFamilies.includes('borrow-scope'), true);
assert.equal(preserved.requiredKinds.includes('ownership:shared-borrow'), true);
assert.equal(preserved.representedKinds.includes('lifetime:loan-region-binding'), true);
assert.equal(preserved.missingKinds.length, 0);
assert.equal(preserved.claims.borrowCheckerClaim, false);
assert.equal(borrowCheckerConstraintMatches(preserved, { borrowCheckerConstraintStatus: 'preserved' }), true);

const rustImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/borrowed.rs',
  sourceText: [
    'pub fn borrowed(source: String) -> usize {',
    '  let shared = &source;',
    '  inspect(shared);',
    '  shared.len()',
    '}',
    ''
  ].join('\n')
});
const rustSidecar = createSemanticImportSidecar(rustImport, { generatedAt: 901 });
const routePlan = createUniversalConversionPlan({
  generatedAt: 902,
  universalCapabilityMatrix: rustToTypescriptCapabilityMatrix(),
  targets: ['typescript'],
  imports: [rustImport],
  evidence: [routeProof()],
  resourceTransfers: [{
    sourceLanguage: 'rust',
    target: 'typescript',
    sourceGraph: rustSidecar.resourceGraph
  }]
});
const route = queryUniversalConversionPlan(routePlan, {
  sourceLanguage: 'rust',
  target: 'typescript',
  borrowCheckerConstraintStatus: 'needs-evidence',
  borrowCheckerConstraintMissingKind: 'ownership:shared-borrow'
}).bestRoute;

assert.equal(Boolean(route), true);
assert.equal(route.borrowCheckerConstraint.status, 'needs-evidence');
assert.equal(route.borrowCheckerConstraint.missingFamilies.includes('ownership'), true);
assert.equal(route.borrowCheckerConstraint.missingKinds.includes('borrow-scope:shared-borrow-compatible'), true);
assert.equal(route.borrowCheckerConstraint.claims.semanticEquivalenceClaim, false);
assert.equal(route.translationAdmission.borrowCheckerConstraint.status, 'needs-evidence');
assert.equal(route.translationAdmission.borrowCheckerConstraintMissingEvidence.includes('translation-ownership-constraint:shared-borrow'), true);
assert.equal(route.translationAdmission.missingEvidence.includes('translation-borrow-scope:shared-borrow-compatible'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('borrow-checker'), true);
assert.equal(route.interlingua.constraints.families.includes('borrow-checker'), true);
assert.equal(route.interlingua.constraints.missingKinds.includes('ownership:shared-borrow'), true);
const borrowCheckerObligations = route.interlingua.constraints.obligations.filter((obligation) => obligation.family === 'borrow-checker');
assert.equal(borrowCheckerObligations.some((obligation) => obligation.kind === 'ownership:shared-borrow' && obligation.status === 'missing'), true);
assert.equal(new Set(borrowCheckerObligations.map((obligation) => obligation.id)).size, borrowCheckerObligations.length);

const artifacts = createUniversalConversionArtifacts(routePlan, { routeId: route.id, generatedAt: 903 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  borrowCheckerConstraintMissingKind: 'borrow-scope:shared-borrow-compatible',
  interlinguaConstraintFamily: 'borrow-checker',
  interlinguaConstraintObligationKind: 'borrow-scope:shared-borrow-compatible',
  interlinguaConstraintObligationStatus: 'missing'
})[0];

assert.equal(Boolean(artifact), true);
assert.equal(artifact.borrowCheckerConstraint.status, 'needs-evidence');
assert.equal(artifacts.index.borrowCheckerConstraintMissingKinds.includes('ownership:shared-borrow'), true);
assert.equal(artifacts.index.interlinguaConstraintFamilies.includes('borrow-checker'), true);
assert.equal(artifacts.index.interlinguaConstraintObligationKinds.includes('borrow-scope:shared-borrow-compatible'), true);
assert.equal(artifacts.summary.compactCounts.borrowCheckerConstraint.missingKinds['borrow-scope:shared-borrow-compatible'], 1);
assert.equal(artifacts.summary.compactCounts.interlingua.constraintFamilies['borrow-checker'], 1);
assert.equal(artifact.admissionRecord.borrowCheckerConstraint.status, 'needs-evidence');

const receipt = createUniversalConversionRouteEvidenceReceipt(routePlan, { routeId: route.id });
assert.equal(receipt.summary.interlinguaConstraintObligationKinds['borrow-scope:shared-borrow-compatible'], 1);
assert.equal(receipt.summary.interlinguaConstraintObligationStatuses.missing >= 1, true);

const worklist = createUniversalConversionWorklist(routePlan, { routeId: route.id });
const obligationWork = queryUniversalConversionWorklist(worklist, {
  kind: 'collect-interlingua-obligation-proof',
  interlinguaConstraintFamily: 'borrow-checker',
  interlinguaConstraintObligationKind: 'borrow-scope:shared-borrow-compatible',
  interlinguaConstraintObligationStatus: 'missing'
});
assert.equal(obligationWork.found, true);
assert.equal(obligationWork.bestItem.interlinguaConstraintFamilies.includes('borrow-checker'), true);
assert.equal(obligationWork.bestItem.tasks.some((task) => task.includes('borrow-scope:shared-borrow-compatible')), true);

function borrowGraph(prefix) {
  return createSemanticResourceGraph({
    id: `${prefix}_borrow_graph`,
    language: prefix,
    sourcePath: `${prefix}.frontier`,
    sourceHash: `hash:${prefix}`,
    resources: [{ id: `${prefix}_resource_buffer`, name: 'buffer', ownerId: `${prefix}_owner`, resourceKind: 'owned-buffer' }],
    owners: [{ id: `${prefix}_owner`, name: 'owner', ownerKind: 'single-owner' }],
    lifetimeRegions: [{ id: `${prefix}_lifetime`, name: 'borrow lifetime', lifetimeKind: 'lexical' }],
    loans: [{ id: `${prefix}_loan`, resourceId: `${prefix}_resource_buffer`, ownerId: `${prefix}_owner`, lifetimeRegionId: `${prefix}_lifetime`, mode: 'shared' }],
    borrowScopes: [{ id: `${prefix}_scope`, resourceId: `${prefix}_resource_buffer`, lifetimeRegionId: `${prefix}_lifetime`, constraintKinds: ['loan-scope-boundary', 'shared-borrow-compatible'] }]
  });
}

function routeProof() {
  return { id: 'evidence_rust_ts_borrow_checker_route_proof', kind: 'conversion-replay-proof', status: 'passed', sourceLanguage: 'rust', target: 'typescript' };
}

function rustToTypescriptCapabilityMatrix() {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 902,
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
