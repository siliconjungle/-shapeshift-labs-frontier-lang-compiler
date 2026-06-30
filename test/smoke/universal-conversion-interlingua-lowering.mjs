import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalInterlinguaRecord,
  interlinguaRecordMatches,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan,
  UniversalInterlinguaLayerKinds,
  UniversalInterlinguaLoweringDispositions
} from './compiler-api.mjs';

assert.equal(UniversalInterlinguaLayerKinds.includes('semantic-symbol'), true);
assert.equal(UniversalInterlinguaLoweringDispositions.includes('lossy-review'), true);

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

const artifacts = createUniversalConversionArtifacts(adapterPlan, { routeId: adapterRoute.id, generatedAt: 797 });
assert.equal(artifacts.index.interlinguaLoweringDispositions.includes('target-adapter'), true);
assert.equal(artifacts.index.interlinguaRepresentedLayerKinds.includes('proof-evidence'), true);
assert.equal(artifacts.index.lossClasses.includes('targetAdapterProjection'), true);
assert.equal(artifacts.index.adapterIds.includes('fixture-js-rust'), true);
const queriedArtifact = queryUniversalConversionArtifacts(artifacts, {
  lossClass: 'targetAdapterProjection',
  adapterId: 'fixture-js-rust',
  interlinguaLoweringDisposition: 'target-adapter',
  interlinguaRepresentedLayerKind: 'target-adapter',
  interlinguaProofEvidenceId: 'evidence_adapter_translation_proof'
})[0];
assert.equal(queriedArtifact.interlingua.lowering.disposition, 'target-adapter');
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
