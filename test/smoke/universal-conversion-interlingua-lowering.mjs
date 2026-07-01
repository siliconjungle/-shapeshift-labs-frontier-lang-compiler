import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalInterlinguaRecord,
  interlinguaRecordMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaConstraintEdgeKinds,
  UniversalInterlinguaLayerKinds,
  UniversalInterlinguaLoweringDispositions
} from './compiler-api.mjs';

assert.equal(UniversalInterlinguaLayerKinds.includes('semantic-symbol'), true);
assert.equal(UniversalInterlinguaLoweringDispositions.includes('lossy-review'), true);
assert.equal(UniversalInterlinguaConstraintEdgeKinds.includes('borrow-scope'), true);

const adapterPlan = conversionPlan({
  evidence: [routeProof('adapter')],
  imports: [sourceImport()]
});
const adapterRoute = queryUniversalConversionPlan(adapterPlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaLoweringDisposition: 'target-adapter',
  interlinguaRepresentedLayerKind: 'target-adapter',
  interlinguaProofEvidenceId: 'evidence_adapter_translation_proof'
}).bestRoute;
assert.equal(adapterRoute.interlingua.kind, 'frontier.lang.universalInterlinguaRecord');
assert.equal(adapterRoute.interlingua.lowering.disposition, 'target-adapter');
assert.equal(adapterRoute.interlingua.claims.adapterMediated, true);
assert.equal(adapterRoute.interlingua.claims.autoMergeClaim, false);
assert.equal(adapterRoute.interlingua.claims.semanticEquivalenceClaim, false);
assert.equal(adapterRoute.interlingua.layers.representedKinds.includes('proof-evidence'), true);
assert.equal(adapterRoute.translationAdmission.missingEvidence.length, 0);

const manualRecord = createUniversalInterlinguaRecord({ route: adapterRoute });
assert.equal(manualRecord.lowering.disposition, 'target-adapter');
assert.equal(interlinguaRecordMatches(manualRecord, { interlinguaLayerKind: 'semantic-symbol' }), true);
assert.equal(interlinguaRecordMatches(manualRecord, { interlinguaLoweringDisposition: 'blocked' }), false);

const sameLanguageRoute = queryUniversalConversionPlan(conversionPlan({
  targets: ['javascript'],
  evidence: [routeProof('same_language', 'conversion-replay-proof', 'javascript')],
  imports: [sourceImport()]
}), {
  sourceLanguage: 'javascript',
  target: 'javascript',
  interlinguaLoweringDisposition: 'exact-source'
}).bestRoute;
assert.equal(sameLanguageRoute.mode, 'preserve-source');
assert.equal(sameLanguageRoute.interlingua.claims.exactSource, true);

const missingAdapterRoute = queryUniversalConversionPlan(conversionPlan({
  universalCapabilityMatrix: capabilityMatrix({ adapter: undefined, lossClass: 'missingAdapter', supported: false }),
  evidence: [routeProof('missing_adapter')],
  imports: [sourceImport()]
}), {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaLoweringDisposition: 'semantic-index-only',
  interlinguaMissingEvidence: 'translation-target-adapter'
}).bestRoute;
assert.equal(missingAdapterRoute.mode, 'semantic-index-only');
assert.equal(missingAdapterRoute.interlingua.claims.semanticIndexOnly, true);
assert.equal(missingAdapterRoute.interlingua.lowering.missingEvidence.includes('translation-target-adapter'), true);

const lossyReviewRoute = queryUniversalConversionPlan(conversionPlan({
  universalCapabilityMatrix: capabilityMatrix({
    lossClass: 'unsupportedTargetFeatures',
    readiness: 'needs-review',
    supported: false,
    reason: 'fixture dynamic runtime lowering requires host review'
  }),
  evidence: [routeProof('lossy_review')],
  imports: [sourceImport()]
}), {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaLoweringDisposition: 'lossy-review'
}).bestRoute;
assert.equal(lossyReviewRoute.mode, 'target-adapter');
assert.equal(lossyReviewRoute.interlingua.claims.lossyReview, true);
assert.equal(lossyReviewRoute.interlingua.lowering.review.some((reason) => reason.includes('host review') || reason.includes('Host target adapter evidence')), true);

const blockedRoute = queryUniversalConversionPlan(conversionPlan({
  evidence: [routeProof('blocked')],
  imports: [sourceImport()],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'dom' }]
}), {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaLoweringDisposition: 'blocked',
  interlinguaMissingEvidence: 'runtime-capability:dom'
}).bestRoute;
assert.equal(blockedRoute.readiness, 'blocked');
assert.equal(blockedRoute.interlingua.claims.blocked, true);

const constraintPlan = conversionPlan({
  evidence: [routeProof('interlingua_constraints')],
  imports: [sourceImport()],
  resourceTransfers: [{ sourceLanguage: 'javascript', target: 'rust', sourceResourceGraph: sourceResourceGraph(), targetResourceGraph: targetResourceGraph() }],
  lifetimeConstraints: [{ sourceLanguage: 'javascript', target: 'rust', sourceLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }, { kind: 'move region bound' }], targetLifetimeConstraints: [{ kind: 'lifetime-region' }, { kind: 'loan borrow region' }] }],
  controlFlowConstraints: [{ sourceLanguage: 'javascript', target: 'rust', sourceControlFlows: [{ id: 'branch', kind: 'branch condition' }, { id: 'await', kind: 'await-order promise chain' }, { id: 'return', kind: 'early-return' }], targetControlFlows: [{ id: 'rust_branch', kind: 'branch condition' }] }],
  borrowScopeConstraints: [{ sourceLanguage: 'javascript', target: 'rust', targetBorrowScopes: [{ id: 'rust_scope', kind: 'loan scope boundary' }] }]
});
const constraintRoute = queryUniversalConversionPlan(constraintPlan, {
  interlinguaConstraintFamily: 'borrow-scope',
  interlinguaConstraintMissingKind: 'borrow-across-await',
  interlinguaConstraintMissingEvidence: 'translation-borrow-scope:borrow-across-await'
}).bestRoute;
assert.equal(constraintRoute.interlingua.constraints.families.includes('borrow-scope'), true);
assert.equal(constraintRoute.interlingua.constraints.missingKinds.includes('borrow-across-await'), true);
assert.equal(constraintRoute.interlingua.constraints.edges.some((edge) => edge.family === 'borrow-scope' && edge.semanticEquivalenceClaim === false), true);
const borrowAwaitObligation = constraintRoute.interlingua.constraints.obligations.find((obligation) => obligation.kind === 'borrow-across-await');
assert.equal(borrowAwaitObligation.status, 'missing');
assert.equal(borrowAwaitObligation.family, 'borrow-scope');
assert.equal(borrowAwaitObligation.missingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
const constraintAction = constraintRoute.interlingua.query.constraintActions[0];
const constraintSourceId = constraintRoute.interlingua.query.constraintSourceIds[0];
const constraintRequiredKind = constraintRoute.interlingua.query.constraintRequiredKinds[0];
const constraintRepresentedKind = constraintRoute.interlingua.query.constraintRepresentedKinds[0];
const constraintEdges = [['constraintActions', constraintAction], ['constraintSourceIds', constraintSourceId], ['constraintRequiredKinds', constraintRequiredKind], ['constraintRepresentedKinds', constraintRepresentedKind]];
assert.equal(constraintPlan.summary.compactCounts.interlingua.constraintFamilies['borrow-scope'], 1);
for (const [key, value] of constraintEdges) assert.equal(constraintPlan.summary.compactCounts.interlingua[key][value], 1);
assert.equal(constraintPlan.summary.compactCounts.interlingua.constraintMissingKinds['borrow-across-await'], 1);
assert.equal(constraintPlan.summary.compactCounts.interlingua.constraintObligationStatuses.missing, 1);
assert.equal(constraintPlan.summary.compactCounts.interlingua.constraintObligationMissingEvidence['translation-borrow-scope:borrow-across-await'], 1);
const constraintArtifacts = createUniversalConversionArtifacts(constraintPlan, { routeId: constraintRoute.id, generatedAt: 800 });
assert.equal(constraintArtifacts.index.interlinguaConstraintFamilies.includes('borrow-scope'), true);
assert.equal(constraintArtifacts.index.interlinguaConstraintMissingKinds.includes('borrow-across-await'), true);
assert.equal(constraintArtifacts.index.interlinguaConstraintObligationKinds.includes('borrow-across-await'), true);
assert.equal(constraintArtifacts.index.interlinguaConstraintObligationStatuses.includes('missing'), true);
assert.equal(constraintArtifacts.index.interlinguaConstraintObligationMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
for (const [sourceKey, indexKey] of [['constraintActions', 'interlinguaConstraintActions'], ['constraintSourceIds', 'interlinguaConstraintSourceIds'], ['constraintRequiredKinds', 'interlinguaConstraintRequiredKinds'], ['constraintRepresentedKinds', 'interlinguaConstraintRepresentedKinds']]) assert.equal(constraintRoute.interlingua.query[sourceKey].every((value) => constraintArtifacts.index[indexKey].includes(value)), true);
assert.equal(constraintArtifacts.index.admissionRecordInterlinguaConstraintFamilies.includes('borrow-scope'), true);
assert.equal(constraintArtifacts.index.admissionRecordInterlinguaConstraintObligationKinds.includes('borrow-across-await'), true);
assert.equal(constraintArtifacts.index.admissionRecordInterlinguaConstraintObligationMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(constraintArtifacts.summary.compactCounts.interlingua.constraintFamilies['borrow-scope'], 1);
for (const [key, value] of constraintEdges) assert.equal(constraintArtifacts.summary.compactCounts.interlingua[key][value], 1);
assert.equal(constraintArtifacts.summary.compactCounts.interlingua.constraintObligationKinds['borrow-across-await'], 1);
assert.equal(constraintArtifacts.summary.compactCounts.interlingua.constraintObligationMissingEvidence['translation-borrow-scope:borrow-across-await'], 1);
assert.equal(constraintArtifacts.summary.compactCounts.admissionRecordInterlingua.records, 1);
assert.equal(constraintArtifacts.summary.compactCounts.admissionRecordInterlingua.constraintFamilies['borrow-scope'], 1);
assert.equal(constraintArtifacts.summary.compactCounts.admissionRecordInterlingua.constraintObligationStatuses.missing, 1);
assert.equal(constraintArtifacts.summary.compactCounts.admissionRecordInterlingua.constraintObligationMissingEvidence['translation-borrow-scope:borrow-across-await'], 1);
assert.equal(constraintArtifacts.admissionRecords[0].interlinguaConstraintFamilies.includes('borrow-scope'), true);
assert.equal(constraintArtifacts.admissionRecords[0].interlinguaConstraintObligationKinds.includes('borrow-across-await'), true);
assert.equal(constraintArtifacts.admissionRecords[0].interlinguaConstraintObligationStatuses.includes('missing'), true);
assert.equal(constraintArtifacts.admissionRecords[0].interlinguaConstraintObligationMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
assert.equal(constraintArtifacts.admissionRecords[0].interlingua.constraintMissingEvidence.includes('translation-borrow-scope:borrow-across-await'), true);
const constraintOperationInterlingua = constraintArtifacts.routeArtifacts[0].semanticOperations.operations[0].metadata.interlingua;
assert.equal(constraintOperationInterlingua.constraintSourceIds.includes(constraintSourceId), true);
assert.equal(constraintArtifacts.index.semanticOperationInterlinguaConstraintSourceIds.includes(constraintSourceId), true);
for (const [key, value] of constraintEdges) assert.equal(constraintArtifacts.summary.compactCounts.semanticOperationInterlingua[key][value], 1);
assert.equal(queryUniversalConversionArtifacts(constraintArtifacts, {
  interlinguaConstraintFamily: 'borrow-scope',
  interlinguaConstraintMissingKind: 'borrow-across-await',
  interlinguaConstraintObligationKind: 'borrow-across-await',
  interlinguaConstraintObligationStatus: 'missing',
  admissionRecordInterlinguaConstraintFamily: 'borrow-scope',
  admissionRecordInterlinguaConstraintObligationKind: 'borrow-across-await',
  admissionRecordInterlinguaConstraintObligationStatus: 'missing',
  admissionRecordInterlinguaConstraintObligationMissingEvidence: 'translation-borrow-scope:borrow-across-await',
  interlinguaConstraintObligationMissingEvidence: 'translation-borrow-scope:borrow-across-await'
})[0].routeId, constraintRoute.id);
assert.equal(queryUniversalConversionArtifacts(constraintArtifacts, { semanticOperationInterlinguaConstraintAction: constraintAction, semanticOperationInterlinguaConstraintSourceId: constraintSourceId, semanticOperationInterlinguaConstraintRequiredKind: constraintRequiredKind, semanticOperationInterlinguaConstraintRepresentedKind: constraintRepresentedKind })[0].routeId, constraintRoute.id);
assert.equal(queryUniversalConversionArtifacts(constraintArtifacts, {
  admissionRecordInterlinguaConstraintFamily: 'not-a-family'
}).length, 0);

const artifacts = createUniversalConversionArtifacts(adapterPlan, { routeId: adapterRoute.id, generatedAt: 797 });
assert.equal(artifacts.index.interlinguaLoweringDispositions.includes('target-adapter'), true);
assert.equal(artifacts.index.interlinguaRepresentedLayerKinds.includes('proof-evidence'), true);
assert.equal(artifacts.index.semanticOperationInterlinguaLoweringDispositions.includes('target-adapter'), true);
assert.equal(artifacts.index.semanticOperationInterlinguaProofEvidenceIds.includes('evidence_adapter_translation_proof'), true);
assert.equal(artifacts.index.lossClasses.includes('targetAdapterProjection'), true);
assert.equal(artifacts.index.adapterIds.includes('fixture-js-rust'), true);
const queriedArtifact = queryUniversalConversionArtifacts(artifacts, {
  lossClass: 'targetAdapterProjection',
  adapterId: 'fixture-js-rust',
  interlinguaLoweringDisposition: 'target-adapter',
  interlinguaRepresentedLayerKind: 'target-adapter',
  interlinguaProofEvidenceId: 'evidence_adapter_translation_proof',
  semanticOperationInterlinguaLoweringDisposition: 'target-adapter',
  semanticOperationInterlinguaProofEvidenceId: 'evidence_adapter_translation_proof'
})[0];
assert.equal(queriedArtifact.interlingua.lowering.disposition, 'target-adapter');
assert.equal(queriedArtifact.semanticOperations.operations[0].metadata.interlingua.loweringDisposition, 'target-adapter');
assert.equal(queriedArtifact.semanticOperations.operations[0].metadata.interlingua.proofEvidenceIds.includes('evidence_adapter_translation_proof'), true);
assert.equal(queriedArtifact.admissionRecord.interlingua.loweringDisposition, 'target-adapter');
assert.equal(queriedArtifact.admissionRecord.metadata.interlingua.query.loweringDisposition, 'target-adapter');

const runtimeReviewPlan = conversionPlan({
  evidence: [routeProof('runtime_fetch', 'conversion-runtime-proof')],
  imports: [sourceImport()],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }]
});
const runtimeReviewRoute = queryUniversalConversionPlan(runtimeReviewPlan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
const runtimeRequirementId = runtimeReviewRoute.runtimeAdapterRequirements[0].id;
const runtimeArtifacts = createUniversalConversionArtifacts(runtimeReviewPlan, { routeId: runtimeReviewRoute.id, generatedAt: 798 });
assert.equal(runtimeArtifacts.index.runtimeAdapterRequirementIds.includes(runtimeRequirementId), true);
assert.equal(runtimeArtifacts.index.routeMissingEvidence.includes('runtime-adapter-proof'), true);
assert.equal(queryUniversalConversionArtifacts(runtimeArtifacts, {
  runtimeAdapterRequirementId: runtimeRequirementId,
  routeMissingEvidence: 'runtime-adapter-proof',
  reviewReason: 'Runtime adapter evidence is required for fetch.'
})[0].routeId, runtimeReviewRoute.id);

const blockedArtifacts = createUniversalConversionArtifacts(blockedRoute, { generatedAt: 799 });
assert.equal(queryUniversalConversionArtifacts(blockedArtifacts, {
  interlinguaLoweringDisposition: 'blocked',
  blocker: 'Runtime capability is missing: dom.'
})[0].routeId, blockedRoute.id);

function conversionPlan(options = {}) {
  return createUniversalConversionPlan({
    generatedAt: 797,
    universalCapabilityMatrix: options.universalCapabilityMatrix ?? capabilityMatrix(),
    targets: options.targets ?? ['rust'],
    imports: options.imports ?? [],
    evidence: options.evidence ?? [],
    resourceTransfers: options.resourceTransfers ?? [],
    lifetimeConstraints: options.lifetimeConstraints ?? [],
    controlFlowConstraints: options.controlFlowConstraints ?? [],
    borrowScopeConstraints: options.borrowScopeConstraints ?? [],
    runtimeRequirements: options.runtimeRequirements ?? []
  });
}

function capabilityMatrix(options = {}) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 797,
    languages: [{
      language: 'javascript',
      aliases: ['js'],
      readiness: 'ready',
      imports: { total: 1, readiness: 'ready', symbols: 1, sourceMaps: 1, sourceMapMappings: 1, losses: 0 },
      parser: { readiness: 'ready', rows: 1, parsers: ['fixture'], mergeReadyParsers: ['fixture'], blockingFeatures: [], reviewFeatures: [] },
      projection: {
        readiness: options.readiness ?? 'ready',
        sourceProjection: {
          exactSource: { evidence: { importsWithExactSource: 1 } },
          stubs: { evidence: { importsWithDeclarations: 1 } }
        },
        targets: [{
          target: 'rust',
          lossClass: options.lossClass ?? 'targetAdapterProjection',
          supported: options.supported ?? true,
          readiness: options.readiness ?? 'ready',
          adapter: Object.hasOwn(options, 'adapter') ? options.adapter : 'fixture-js-rust',
          adapterKind: 'targetProjection',
          lossKinds: options.lossKinds ?? [],
          reason: options.reason ?? 'fixture target adapter'
        }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: options.readiness ?? 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['rust'] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_interlingua',
    language: 'javascript',
    sourcePath: 'src/interlingua.js',
    sourceHash: 'hash_interlingua_source',
    evidence: [{ id: 'native_import_interlingua_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_interlingua_symbol', ownershipKeys: ['symbol.interlingua'], conflictKeys: ['symbol.interlingua'] }],
    sourceMaps: [{ id: 'source_map_interlingua', mappings: [{ id: 'source_map_mapping_interlingua', ownershipRegionKey: 'symbol.interlingua', sourceSpan: { path: 'src/interlingua.js' } }] }]
  };
}

function graphSummary(overrides = {}) {
  return { records: 4, resources: 1, owners: 1, loans: 1, aliases: 0, moves: 0, drops: 0, lifetimeRegions: 1, unsafeBoundaries: 0, conflicts: 0, proofObligations: 0, unsafeBoundariesWithoutProof: 0, reasonCodes: [], ...overrides };
}

function sourceResourceGraph() {
  return {
    id: 'source_interlingua_constraints_graph',
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
    id: 'target_interlingua_constraints_graph',
    summary: graphSummary(),
    resources: [{ id: 'user', resourceKind: 'object' }],
    owners: [{ id: 'user_owner', ownerKind: 'single' }],
    loans: [{ id: 'user_mut_loan', mode: 'mutable', lifetimeRegionId: 'lt_user' }],
    lifetimeRegions: [{ id: 'lt_user', lifetimeKind: 'lexical' }]
  };
}

function routeProof(id, kind = 'conversion-replay-proof', target = 'rust') {
  return {
    id: `evidence_${id}_translation_proof`,
    kind,
    status: 'passed',
    routeId: `conversion_javascript_to_${target}`,
    sourceLanguage: 'javascript',
    target
  };
}
