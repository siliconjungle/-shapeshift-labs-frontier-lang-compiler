import { assert } from './helpers.mjs';
import {
  compactTranslationAdmissionCounts,
  mergeTranslationAdmissionDenominators,
  translationAdmissionDenominatorIndex,
  translationAdmissionDenominatorMatches,
  translationAdmissionDenominatorSummary
} from '../../dist/universal-conversion-translation-admission-denominators.js';

const singularRow = {
  translationAdmissionStatus: 'needs-evidence',
  translationAdmissionAction: 'collect-translation-evidence',
  missingTranslationEvidence: 'translation-runtime-proof',
  translationEvidenceId: 'evidence_translation_runtime',
  translationProofEvidenceId: 'proof_translation_runtime',
  translationRuntimeReadiness: 'needs-review',
  translationRuntimeAdapterRequirementId: 'runtime_adapter_fetch',
  translationRuntimeProofObligationId: 'runtime_proof_fetch',
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'missing-signal',
  translationRuntimeProofRequiredSignal: 'network-trace-hash',
  translationRuntimeProofProvidedSignal: 'telemetry-hash',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_node_process_env',
  requiredTranslationConstructKind: 'runtime',
  representedTranslationConstructKind: 'import',
  targetAdapterId: 'adapter_js_rust'
};

const pluralRow = {
  translationAdmissionStatuses: ['admittable-for-review'],
  translationAdmissionActions: ['materialize-review-record'],
  missingTranslationEvidence: ['translation-proof-or-replay'],
  translationEvidenceIds: ['evidence_plural_translation'],
  translationProofEvidenceIds: ['proof_plural_translation'],
  translationRuntimeReadinesses: ['ready'],
  translationRuntimeAdapterRequirementIds: ['runtime_adapter_dom'],
  translationRuntimeProofObligationIds: ['runtime_proof_dom'],
  translationRuntimeProofCapabilities: ['dom'],
  translationRuntimeProofStatuses: ['passed'],
  translationRuntimeProofRequiredSignals: ['dom-snapshot-hash'],
  translationRuntimeProofProvidedSignals: ['dom-snapshot-hash'],
  translationRuntimeProofMissingSignals: ['layout-shift-summary'],
  translationDialectReadinesses: ['needs-review'],
  translationDialectRecordIds: ['dialect_jsx_spread'],
  requiredTranslationConstructKinds: ['target-adapter'],
  representedTranslationConstructKinds: ['proof-evidence'],
  targetAdapterIds: ['adapter_js_html']
};

const canonicalRow = {
  status: 'needs-adapter',
  action: 'add-target-adapter',
  missingEvidence: ['translation-target-adapter'],
  evidenceIds: ['evidence_canonical_translation'],
  proofEvidenceIds: ['proof_canonical_translation'],
  runtimeReadiness: 'blocked',
  runtimeAdapterRequirementIds: ['runtime_adapter_canvas'],
  runtimeProofObligationIds: ['runtime_proof_canvas'],
  runtimeProofCapabilities: ['canvas'],
  runtimeProofStatuses: ['blocked'],
  runtimeProofRequiredSignals: ['pixel-hash'],
  runtimeProofProvidedSignals: ['screenshot-hash'],
  runtimeProofMissingSignals: ['pixel-hash'],
  dialectReadiness: 'ready-with-losses',
  dialectRecordIds: ['dialect_canvas_2d'],
  requiredConstructKinds: ['runtime-proof'],
  representedConstructKinds: ['source-map'],
  targetAdapterId: 'adapter_js_canvas'
};

const index = translationAdmissionDenominatorIndex([singularRow, pluralRow, canonicalRow]);
assert.equal(index.translationAdmissionStatuses.includes('needs-evidence'), true);
assert.equal(index.translationAdmissionStatuses.includes('admittable-for-review'), true);
assert.equal(index.translationAdmissionStatuses.includes('needs-adapter'), true);
assert.equal(index.translationAdmissionActions.includes('collect-translation-evidence'), true);
assert.equal(index.missingTranslationEvidence.includes('translation-runtime-proof'), true);
assert.equal(index.translationEvidenceIds.includes('evidence_translation_runtime'), true);
assert.equal(index.translationProofEvidenceIds.includes('proof_translation_runtime'), true);
assert.equal(index.translationRuntimeReadinesses.includes('needs-review'), true);
assert.equal(index.translationRuntimeAdapterRequirementIds.includes('runtime_adapter_fetch'), true);
assert.equal(index.translationRuntimeProofObligationIds.includes('runtime_proof_fetch'), true);
assert.equal(index.translationRuntimeProofCapabilities.includes('fetch'), true);
assert.equal(index.translationRuntimeProofStatuses.includes('missing-signal'), true);
assert.equal(index.translationRuntimeProofRequiredSignals.includes('network-trace-hash'), true);
assert.equal(index.translationRuntimeProofProvidedSignals.includes('telemetry-hash'), true);
assert.equal(index.translationRuntimeProofMissingSignals.includes('network-trace-hash'), true);
assert.equal(index.translationDialectReadinesses.includes('blocked'), true);
assert.equal(index.translationDialectRecordIds.includes('dialect_node_process_env'), true);
assert.equal(index.requiredTranslationConstructKinds.includes('runtime'), true);
assert.equal(index.representedTranslationConstructKinds.includes('import'), true);
assert.equal(index.targetAdapterIds.includes('adapter_js_rust'), true);

const summary = translationAdmissionDenominatorSummary([singularRow]);
assert.equal(summary.translationAdmissionStatuses.includes('needs-evidence'), true);
assert.equal(summary.translationRuntimeProofStatuses.includes('missing-signal'), true);
assert.equal(summary.targetAdapterIds.includes('adapter_js_rust'), true);

const merged = mergeTranslationAdmissionDenominators(singularRow, pluralRow);
assert.equal(merged.translationAdmissionStatuses.includes('needs-evidence'), true);
assert.equal(merged.translationAdmissionStatuses.includes('admittable-for-review'), true);
assert.equal(merged.translationRuntimeProofCapabilities.includes('fetch'), true);
assert.equal(merged.translationRuntimeProofCapabilities.includes('dom'), true);
assert.equal(merged.targetAdapterIds.includes('adapter_js_rust'), true);
assert.equal(merged.targetAdapterIds.includes('adapter_js_html'), true);

assert.equal(translationAdmissionDenominatorMatches(singularRow, {
  translationAdmissionStatus: 'needs-evidence',
  translationAdmissionAction: 'collect-translation-evidence',
  missingTranslationEvidence: 'translation-runtime-proof',
  translationEvidenceId: 'evidence_translation_runtime',
  translationProofEvidenceId: 'proof_translation_runtime',
  translationRuntimeReadiness: 'needs-review',
  translationRuntimeAdapterRequirementId: 'runtime_adapter_fetch',
  translationRuntimeProofObligationId: 'runtime_proof_fetch',
  translationRuntimeProofCapability: 'fetch',
  translationRuntimeProofStatus: 'missing-signal',
  translationRuntimeProofRequiredSignal: 'network-trace-hash',
  translationRuntimeProofProvidedSignal: 'telemetry-hash',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'blocked',
  translationDialectRecordId: 'dialect_node_process_env',
  requiredTranslationConstructKind: 'runtime',
  representedTranslationConstructKind: 'import',
  targetAdapterId: 'adapter_js_rust'
}, match), true);
assert.equal(translationAdmissionDenominatorMatches(singularRow, {
  translationRuntimeProofCapability: 'dom'
}, match), false);

const compact = compactTranslationAdmissionCounts([singularRow, pluralRow, canonicalRow]);
assert.equal(compact.byStatus['needs-evidence'], 1);
assert.equal(compact.byAction['collect-translation-evidence'], 1);
assert.equal(compact.missingEvidence['translation-runtime-proof'], 1);
assert.equal(compact.evidenceIds.evidence_translation_runtime, 1);
assert.equal(compact.proofEvidenceIds.proof_translation_runtime, 1);
assert.equal(compact.runtimeReadiness['needs-review'], 1);
assert.equal(compact.runtimeAdapterRequirementIds.runtime_adapter_fetch, 1);
assert.equal(compact.runtimeProofObligationIds.runtime_proof_fetch, 1);
assert.equal(compact.runtimeProofCapabilities.fetch, 1);
assert.equal(compact.runtimeProofStatuses['missing-signal'], 1);
assert.equal(compact.runtimeProofRequiredSignals['network-trace-hash'], 1);
assert.equal(compact.runtimeProofProvidedSignals['telemetry-hash'], 1);
assert.equal(compact.runtimeProofMissingSignals['network-trace-hash'], 1);
assert.equal(compact.dialectReadiness.blocked, 1);
assert.equal(compact.dialectRecordIds.dialect_node_process_env, 1);
assert.equal(compact.requiredConstructKinds.runtime, 1);
assert.equal(compact.representedConstructKinds.import, 1);
assert.equal(compact.targetAdapterIds.adapter_js_rust, 1);

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
