import { assert } from './helpers.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const admittablePlan = conversionPlan({
  evidence: [routeProof('admittable')],
  imports: [sourceImport()]
});
const admittableRoute = queryUniversalConversionPlan(admittablePlan, {
  translationAdmissionStatus: 'admittable-for-review',
  targetAdapterId: 'fixture-js-rust'
}).bestRoute;
assert.equal(admittableRoute.translationAdmission.action, 'materialize-review-record');
assert.equal(admittableRoute.translationAdmission.missingEvidence.length, 0);
assert.equal(admittableRoute.translationAdmission.requiredConstructKinds.includes('semantic-ownership'), true);
assert.equal(admittableRoute.translationAdmission.representedConstructKinds.includes('target-adapter'), true);
assert.equal(admittableRoute.translationAdmission.proofEvidenceIds.includes('evidence_admittable_translation_proof'), true);
assert.equal(admittableRoute.translationAdmission.autoMergeClaim, false);
assert.equal(admittableRoute.translationAdmission.semanticEquivalenceClaim, false);

const needsEvidenceRoute = queryUniversalConversionPlan(conversionPlan({ imports: [sourceImport()] }), {
  translationAdmissionStatus: 'needs-evidence',
  missingTranslationEvidence: 'translation-proof-or-replay'
}).bestRoute;
assert.equal(needsEvidenceRoute.translationAdmission.action, 'collect-translation-evidence');
assert.equal(needsEvidenceRoute.translationAdmission.missingEvidence.includes('translation-proof-or-replay'), true);

const missingAdapterRoute = queryUniversalConversionPlan(conversionPlan({
  universalCapabilityMatrix: capabilityMatrix({ adapter: undefined, lossClass: 'missingAdapter', supported: false }),
  evidence: [routeProof('missing_adapter')],
  imports: [sourceImport()]
}), {
  translationAdmissionStatus: 'needs-adapter',
  requiredTranslationConstructKind: 'target-adapter'
}).bestRoute;
assert.equal(missingAdapterRoute.mode, 'semantic-index-only');
assert.equal(missingAdapterRoute.translationAdmission.action, 'add-target-adapter');
assert.equal(missingAdapterRoute.translationAdmission.missingEvidence.includes('translation-target-adapter'), true);

const runtimeReviewRoute = queryUniversalConversionPlan(conversionPlan({
  evidence: [routeProof('runtime_review', 'conversion-runtime-proof')],
  imports: [sourceImport()],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }]
}), {
  translationAdmissionStatus: 'needs-review'
}).bestRoute;
assert.equal(runtimeReviewRoute.translationAdmission.action, 'review-target-adapter');
assert.equal(runtimeReviewRoute.translationAdmission.runtimeAdapterRequirementIds.length, 1);
assert.equal(runtimeReviewRoute.translationAdmission.missingEvidence.includes('translation-runtime-adapter-proof'), false);

const blockedRoute = queryUniversalConversionPlan(conversionPlan({
  evidence: [routeProof('runtime_blocked')],
  imports: [sourceImport()],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'dom' }]
}), {
  translationAdmissionStatus: 'blocked'
}).bestRoute;
assert.equal(blockedRoute.translationAdmission.action, 'reject');
assert.equal(blockedRoute.translationAdmission.blockers.some((reason) => reason.includes('Runtime capability is missing: dom.')), true);

const artifacts = createUniversalConversionArtifacts(admittablePlan, { routeId: admittableRoute.id, generatedAt: 796 });
const artifact = queryUniversalConversionArtifacts(artifacts, {
  translationAdmissionAction: 'materialize-review-record',
  representedTranslationConstructKind: 'target-adapter',
  translationProofEvidenceId: 'evidence_admittable_translation_proof'
})[0];
assert.equal(artifact.translationAdmission.status, 'admittable-for-review');
assert.equal(artifact.history.admission.metadata.translationAdmission.status, 'admittable-for-review');
assert.equal(artifact.patchBundle.admission.metadata.translationAdmission.action, 'materialize-review-record');
assert.equal(artifact.admissionRecord.metadata.translationAdmission.status, 'admittable-for-review');
assert.equal(artifacts.index.translationAdmissionStatuses.includes('admittable-for-review'), true);
assert.equal(artifacts.index.requiredTranslationConstructKinds.includes('proof-evidence'), true);

function conversionPlan(options = {}) {
  return createUniversalConversionPlan({
    generatedAt: 795,
    universalCapabilityMatrix: options.universalCapabilityMatrix ?? capabilityMatrix(),
    targets: ['rust'],
    imports: options.imports ?? [],
    evidence: options.evidence ?? [],
    runtimeRequirements: options.runtimeRequirements ?? []
  });
}

function capabilityMatrix(options = {}) {
  return {
    kind: 'frontier.lang.universalCapabilityMatrix',
    version: 1,
    generatedAt: 795,
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
        targets: [{
          target: 'rust',
          lossClass: options.lossClass ?? 'targetAdapterProjection',
          supported: options.supported ?? true,
          readiness: options.readiness ?? 'ready',
          adapter: Object.hasOwn(options, 'adapter') ? options.adapter : 'fixture-js-rust',
          adapterKind: 'targetProjection',
          lossKinds: [],
          reason: 'fixture target adapter'
        }]
      },
      blockers: [],
      review: []
    }],
    matrices: {
      projectionReadiness: {
        languages: [{ language: 'javascript', targets: [{ target: 'rust', readiness: 'ready' }] }]
      }
    },
    metadata: { compileTargets: ['rust'] }
  };
}

function sourceImport() {
  return {
    id: 'native_import_js_translation',
    language: 'javascript',
    sourcePath: 'src/translation.js',
    sourceHash: 'hash_translation_source',
    evidence: [{ id: 'native_import_source_evidence', kind: 'proof', status: 'passed' }],
    mergeCandidates: [{ id: 'candidate_translation_symbol', ownershipKeys: ['symbol.translation'], conflictKeys: ['symbol.translation'] }],
    sourceMaps: [{ id: 'source_map_translation', mappings: [{ id: 'source_map_mapping_translation', ownershipRegionKey: 'symbol.translation', sourceSpan: { path: 'src/translation.js' } }] }]
  };
}

function routeProof(id, kind = 'conversion-replay-proof') {
  return {
    id: `evidence_${id}_translation_proof`,
    kind,
    status: 'passed',
    routeId: 'conversion_javascript_to_rust',
    sourceLanguage: 'javascript',
    target: 'rust'
  };
}
