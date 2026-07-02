import { assert } from './helpers.mjs';
import { queryUniversalConversionArtifacts } from './compiler-api.mjs';
import { artifactIndex } from '../../dist/universal-conversion-artifact-query.js';

const nestedAliasArtifact = routeArtifact({
  translationAdmission: {
    translationAdmissionStatus: 'admittable-for-review',
    translationAdmissionAction: 'materialize-review-record',
    translationProofEvidenceId: 'proof_nested_alias',
    translationRuntimeProofStatus: 'satisfied',
    requiredTranslationConstructKind: 'proof-evidence',
    representedTranslationConstructKind: 'target-adapter',
    targetAdapterIds: ['nested-adapter-alias']
  }
});
assertArtifactAlias(nestedAliasArtifact, {
  translationAdmissionStatus: 'admittable-for-review',
  translationAdmissionAction: 'materialize-review-record',
  translationProofEvidenceId: 'proof_nested_alias',
  translationRuntimeProofStatus: 'satisfied',
  requiredTranslationConstructKind: 'proof-evidence',
  representedTranslationConstructKind: 'target-adapter',
  targetAdapterId: 'nested-adapter-alias'
});

const topLevelAliasArtifact = routeArtifact({
  translationAdmissionStatus: 'needs-evidence',
  translationAdmissionAction: 'collect-translation-evidence',
  missingTranslationEvidence: 'translation-proof-or-replay',
  translationRuntimeProofStatus: 'needs-proof',
  requiredTranslationConstructKind: 'runtime',
  representedTranslationConstructKind: 'import',
  targetAdapterIds: ['top-level-adapter-alias']
});
assertArtifactAlias(topLevelAliasArtifact, {
  translationAdmissionStatus: 'needs-evidence',
  translationAdmissionAction: 'collect-translation-evidence',
  missingTranslationEvidence: 'translation-proof-or-replay',
  translationRuntimeProofStatus: 'needs-proof',
  requiredTranslationConstructKind: 'runtime',
  representedTranslationConstructKind: 'import',
  targetAdapterId: 'top-level-adapter-alias'
});

function assertArtifactAlias(artifact, query) {
  const index = artifactIndex([artifact]);
  assert.equal(index.translationAdmissionStatuses.includes(query.translationAdmissionStatus), true);
  assert.equal(index.translationAdmissionActions.includes(query.translationAdmissionAction), true);
  assert.equal(index.translationRuntimeProofStatuses.includes(query.translationRuntimeProofStatus), true);
  assert.equal(index.requiredTranslationConstructKinds.includes(query.requiredTranslationConstructKind), true);
  assert.equal(index.representedTranslationConstructKinds.includes(query.representedTranslationConstructKind), true);
  assert.equal(index.targetAdapterIds.includes(query.targetAdapterId), true);
  assert.equal(queryUniversalConversionArtifacts([artifact], query)[0].routeId, artifact.routeId);
}

function routeArtifact(overrides = {}) {
  return {
    kind: 'frontier.lang.universalConversionRouteArtifact',
    version: 1,
    routeId: 'artifact_translation_alias_route',
    sourceLanguage: 'javascript',
    target: 'rust',
    mode: 'target-projection',
    lossClass: 'targetAdapterProjection',
    adapter: 'route-fixture-js-rust',
    adapterKind: 'targetProjection',
    missingEvidence: [],
    blockers: [],
    review: [],
    readiness: 'needs-evidence',
    admissionAction: 'review',
    admissionStatus: 'queued',
    routeAction: 'collect-evidence',
    priority: 'normal',
    history: { id: 'history_alias_route', index: emptyIndex(), evidenceIds: [], proofIds: [] },
    patchBundle: { id: 'patch_alias_route', index: { transformIdentityHashes: [] } },
    admissionRecord: { id: 'admission_alias_route', admissionBucket: 'needs-evidence', risk: 'medium', metadata: {} },
    evidenceReceipt: { id: 'receipt_alias_route', evidenceIds: [], proofEvidenceIds: [], missingEvidence: [], records: { rejected: [] } },
    semanticOperations: { operations: [] },
    metadata: {},
    ...overrides
  };
}

function emptyIndex() {
  return { sourcePaths: [], sourceHashes: [], ownershipKeys: [], conflictKeys: [], transformIdentityHashes: [] };
}
