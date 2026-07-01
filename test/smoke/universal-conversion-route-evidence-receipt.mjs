import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  createUniversalConversionRouteEvidenceReceipt,
  queryUniversalConversionArtifacts,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const scopedEvidence = {
  id: 'receipt_scoped_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed',
  routeId: 'conversion_javascript_to_rust',
  sourceLanguage: 'javascript',
  target: 'rust'
};
const unscopedEvidence = {
  id: 'receipt_unscoped_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed'
};
const wrongTargetEvidence = {
  id: 'receipt_wrong_target_translation_proof',
  kind: 'conversion-replay-proof',
  status: 'passed',
  sourceLanguage: 'javascript',
  target: 'python'
};
const plan = createUniversalConversionPlan({
  generatedAt: 803,
  imports: [scannedJsImport],
  targets: ['rust'],
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
const route = queryUniversalConversionPlan(plan, { sourceLanguage: 'javascript', target: 'rust' }).bestRoute;
const receipt = createUniversalConversionRouteEvidenceReceipt(plan, {
  routeId: route.id,
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
assert.equal(receipt.kind, 'frontier.lang.universalConversionRouteEvidenceReceipt');
assert.equal(receipt.id, `evidence_receipt_${route.id}`);
assert.equal(receipt.routeId, route.id);
assert.equal(receipt.evidenceIds.includes('receipt_scoped_translation_proof'), true);
assert.equal(receipt.proofEvidenceIds.includes('receipt_scoped_translation_proof'), true);
assert.equal(receipt.sourceMapIds.length >= 1, true);
assert.equal(receipt.sourceMapMappingIds.length >= 1, true);
assert.equal(receipt.summary.sourceMapIds[receipt.sourceMapIds[0]] >= 1, true);
assert.equal(receipt.summary.sourceMapMappingIds[receipt.sourceMapMappingIds[0]] >= 1, true);
assert.equal(receipt.metadata.sourceMapped, true);
assert.equal(receipt.records.bound.length, 1);
assert.equal(receipt.records.bound[0].binding, 'bound');
assert.equal(receipt.records.bound[0].proof, true);
assert.equal(receipt.records.rejected.some((record) => record.id === 'receipt_unscoped_translation_proof' && record.reason === 'unscoped-evidence'), true);
assert.equal(receipt.records.rejected.some((record) => record.id === 'receipt_wrong_target_translation_proof' && record.reason === 'target-mismatch'), true);
assert.equal(receipt.summary.boundEvidence, 1);
assert.equal(receipt.summary.rejectedByReason['unscoped-evidence'], 1);
assert.equal(receipt.summary.rejectedByReason['target-mismatch'], 1);
assert.equal(receipt.autoMergeClaim, false);
assert.equal(receipt.semanticEquivalenceClaim, false);
const translationEvidenceFilteredReceipt = createUniversalConversionRouteEvidenceReceipt(plan, { translationAdmissionStatus: ['needs-evidence', 'blocked'], translationAdmissionAction: ['collect-translation-evidence', 'reject'], missingTranslationEvidence: ['missing-evidence', 'translation-target-adapter'], translationEvidenceId: ['missing-evidence', 'receipt_scoped_translation_proof'], translationProofEvidenceId: ['missing-proof', 'receipt_scoped_translation_proof'], requiredTranslationConstructKind: ['missing-kind', 'proof-evidence'], representedTranslationConstructKind: ['missing-kind', 'proof-evidence'] });
assert.equal(translationEvidenceFilteredReceipt.routeId, route.id);
assert.throws(() => createUniversalConversionRouteEvidenceReceipt(plan, { sourceLanguage: 'javascript', target: 'rust', translationProofEvidenceId: 'missing_receipt_proof' }), /No conversion route matched/);

const translationDenominatorRoute = {
  id: 'translation_denominator_route',
  sourceLanguage: 'javascript',
  languageIds: ['javascript'],
  target: 'rust',
  mode: 'target-adapter',
  readiness: 'needs-evidence',
  admissionAction: 'prioritize',
  mergeRefs: { planId: 'translation_denominator_plan', evidenceIds: [], proofIds: [], sources: [], semanticOwnershipKeys: [], conflictKeys: [] },
  translationAdmission: { status: 'needs-evidence', action: 'collect-translation-evidence', missingEvidence: [], evidenceIds: [], proofEvidenceIds: [], runtimeReadiness: 'needs-review', runtimeAdapterRequirementIds: ['runtime_adapter_fetch'], runtimeProofObligationIds: ['runtime_proof_fetch'], runtimeProofMissingSignals: ['network-trace-hash'], dialectReadiness: 'blocked', dialectRecordIds: ['dialect_node_process_env'] }
};
const translationDenominatorReceipt = createUniversalConversionRouteEvidenceReceipt(translationDenominatorRoute);
assert.equal(translationDenominatorReceipt.translationRuntimeReadinesses.includes('needs-review'), true);
assert.equal(translationDenominatorReceipt.translationRuntimeAdapterRequirementIds.includes('runtime_adapter_fetch'), true);
assert.equal(translationDenominatorReceipt.translationRuntimeProofObligationIds.includes('runtime_proof_fetch'), true);
assert.equal(translationDenominatorReceipt.translationRuntimeProofMissingSignals.includes('network-trace-hash'), true);
assert.equal(translationDenominatorReceipt.translationDialectReadinesses.includes('blocked'), true);
assert.equal(translationDenominatorReceipt.translationDialectRecordIds.includes('dialect_node_process_env'), true);
assert.equal(translationDenominatorReceipt.summary.translationAdmission.runtimeProofMissingSignals['network-trace-hash'], 1);
assert.equal(translationDenominatorReceipt.summary.translationAdmission.dialectRecordIds.dialect_node_process_env, 1);
const runtimeProofFilteredReceipt = createUniversalConversionRouteEvidenceReceipt(createUniversalConversionPlan({ generatedAt: 805, imports: [scannedJsImport], targets: ['rust'], sourceHosts: ['javascript:node'], targetHosts: ['rust:cli'], runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'filesystem' }], evidence: [scopedEvidence] }), { sourceLanguage: 'javascript', target: 'rust', runtimeProofCapability: ['network', 'filesystem'], runtimeProofStatus: ['satisfied', 'needs-evidence'], runtimeProofMissingSignal: ['missing-runtime-signal', 'filesystem-trace-hash'] });
assert.equal(runtimeProofFilteredReceipt.runtimeProofCapabilities.includes('filesystem'), true);

const artifactsWithReceipts = createUniversalConversionArtifacts(plan, {
  routeId: route.id,
  evidence: [scopedEvidence, unscopedEvidence, wrongTargetEvidence]
});
const routeSourceMapId = route.mergeRefs.sourceMapIds[0];
const routeSourceMapMappingId = route.mergeRefs.sourceMapMappingIds[0];
const materializedSourceMapLinkId = artifactsWithReceipts.routeArtifacts[0].materialization.sourceMapLinkIds[0];
assert.equal(artifactsWithReceipts.routeArtifacts[0].materialization.sourceMapIds.includes(routeSourceMapId), true);
assert.equal(artifactsWithReceipts.routeArtifacts[0].admissionRecord.ids.sourceMapMappingIds.includes(routeSourceMapMappingId), true);
assert.equal(artifactsWithReceipts.routeArtifacts[0].evidenceReceipt.sourceMapLinkIds.includes(materializedSourceMapLinkId), true);
assert.equal(artifactsWithReceipts.index.routeSourceMapIds.includes(routeSourceMapId), true);
assert.equal(artifactsWithReceipts.index.admissionRecordSourceMapMappingIds.includes(routeSourceMapMappingId), true);
assert.equal(artifactsWithReceipts.index.evidenceReceiptSourceMapLinkIds.includes(materializedSourceMapLinkId), true);
assert.equal(artifactsWithReceipts.summary.compactCounts.evidenceReceipts.sourceMapIds[routeSourceMapId] >= 1, true);
assert.equal(artifactsWithReceipts.summary.compactCounts.sourceMaps.ids[routeSourceMapId] >= 1 && artifactsWithReceipts.summary.compactCounts.sourceMaps.mappingIds[routeSourceMapMappingId] >= 1 && artifactsWithReceipts.summary.compactCounts.sourceMaps.linkIds[materializedSourceMapLinkId] >= 1, true);
assert.equal(queryUniversalConversionArtifacts(artifactsWithReceipts, {
  routeSourceMapId,
  admissionRecordSourceMapMappingId: routeSourceMapMappingId,
  evidenceReceiptSourceMapLinkId: materializedSourceMapLinkId
})[0].routeId, route.id);
const rejectedArtifact = queryUniversalConversionArtifacts(artifactsWithReceipts, {
  evidenceReceiptRejectedReason: 'unscoped-evidence',
  evidenceReceiptRejectedId: 'receipt_unscoped_translation_proof'
})[0];
assert.equal(rejectedArtifact.evidenceReceipt.records.rejected.length, 2);
assert.equal(artifactsWithReceipts.summary.receiptRejectedEvidence, 2);
assert.equal(artifactsWithReceipts.summary.compactCounts.evidenceReceipts.rejectedByReason['target-mismatch'], 1);
const denominatorArtifacts = createUniversalConversionArtifacts(translationDenominatorRoute);
assert.equal(denominatorArtifacts.routeArtifacts[0].admissionRecord.translationRuntimeProofMissingSignals.includes('network-trace-hash'), true);
assert.equal(denominatorArtifacts.routeArtifacts[0].evidenceReceipt.translationDialectRecordIds.includes('dialect_node_process_env'), true);

const routeReceipt = createUniversalConversionRouteEvidenceReceipt(route);
assert.equal(routeReceipt.routeId, route.id);
assert.equal(routeReceipt.proofEvidenceIds.includes('receipt_scoped_translation_proof'), true);

const missingReceipt = createUniversalConversionRouteEvidenceReceipt(createUniversalConversionPlan({
  generatedAt: 804,
  imports: [scannedJsImport],
  targets: ['rust']
}), {
  sourceLanguage: 'javascript',
  target: 'rust',
  missingTranslationEvidence: ['missing-evidence', 'translation-proof-or-replay']
});
assert.equal(missingReceipt.missingEvidence.includes('route-bound-proof-evidence'), true);
assert.equal(missingReceipt.summary.missingEvidence >= 1, true);

const interlinguaConstraintPlan = createUniversalConversionPlan({
  generatedAt: 805,
  imports: [scannedJsImport],
  targets: ['rust'],
  adtPatternConstraints: [{
    sourceLanguage: 'javascript',
    target: 'rust',
    sourceAdtPatternRecords: [{
      id: 'receipt_result_union',
      kind: 'sum type enum variant payload tagged switch match exhaustive',
      name: 'Result',
      variantNames: ['Ok', 'Err'],
      payloadFieldNames: ['value', 'error'],
      tagFieldNames: ['kind'],
      matchArmNames: ['Ok', 'Err'],
      constraintKinds: ['payload-shape', 'exhaustiveness']
    }]
  }]
});
const interlinguaConstraintRoute = queryUniversalConversionPlan(interlinguaConstraintPlan, {
  sourceLanguage: 'javascript',
  target: 'rust',
  interlinguaConstraintFamily: 'adt-pattern',
  interlinguaConstraintObligationStatus: 'missing'
}).bestRoute;
const interlinguaReceipt = createUniversalConversionRouteEvidenceReceipt(interlinguaConstraintRoute);
const receiptAction = interlinguaConstraintRoute.interlingua.query.constraintActions[0];
const receiptSourceId = interlinguaConstraintRoute.interlingua.query.constraintSourceIds[0];
const receiptRequiredKind = interlinguaConstraintRoute.interlingua.query.constraintRequiredKinds[0];
const receiptEdges = [['interlinguaConstraintActions', receiptAction], ['interlinguaConstraintSourceIds', receiptSourceId], ['interlinguaConstraintRequiredKinds', receiptRequiredKind]];
assert.equal(interlinguaReceipt.interlinguaRecordId, interlinguaConstraintRoute.interlingua.id);
assert.equal(interlinguaReceipt.interlinguaLoweringDisposition, interlinguaConstraintRoute.interlingua.lowering.disposition);
assert.equal(interlinguaReceipt.interlinguaConstraintFamilies.includes('adt-pattern'), true);
for (const [key, value] of receiptEdges) assert.equal(interlinguaReceipt[key].includes(value), true);
assert.equal(Array.isArray(interlinguaReceipt.interlinguaConstraintEvidenceIds), true);
assert.equal(Array.isArray(interlinguaReceipt.interlinguaConstraintRepresentedKinds), true);
assert.equal(interlinguaReceipt.interlinguaConstraintObligationKinds.includes('exhaustiveness'), true);
assert.equal(interlinguaReceipt.interlinguaConstraintObligationStatuses.includes('missing'), true);
assert.equal(Array.isArray(interlinguaReceipt.interlinguaConstraintObligationEvidenceIds), true);
assert.equal(interlinguaReceipt.interlinguaConstraintObligationMissingEvidence.includes('translation-adt-pattern:exhaustiveness'), true);
assert.equal(interlinguaReceipt.records.interlinguaObligations.some((record) => record.family === 'adt-pattern'
  && record.kind === 'exhaustiveness'
  && record.status === 'missing'
  && record.semanticEquivalenceClaim === false), true);
assert.equal(interlinguaReceipt.summary.interlinguaConstraintByFamily['adt-pattern'] >= 1, true);
assert.equal(interlinguaReceipt.summary.interlinguaConstraintByStatus.missing >= 1, true);
for (const [key, value] of receiptEdges) assert.equal(interlinguaReceipt.summary[key][value] >= 1, true);
assert.equal(typeof interlinguaReceipt.summary.interlinguaConstraintEvidenceIds, 'object');
assert.equal(interlinguaReceipt.summary.interlinguaConstraintMissingKinds.exhaustiveness >= 1, true);
assert.equal(typeof interlinguaReceipt.summary.interlinguaConstraintObligationEvidenceIds, 'object');
assert.equal(interlinguaReceipt.summary.interlinguaConstraintObligationMissingEvidence['translation-adt-pattern:exhaustiveness'] >= 1, true);
assert.equal(interlinguaReceipt.metadata.interlinguaConstraintsRequired, true);
const positiveObligationReceipt = createUniversalConversionRouteEvidenceReceipt({ id: 'positive_obligation_route', sourceLanguage: 'javascript', target: 'rust', mode: 'target-adapter', readiness: 'needs-evidence', mergeRefs: {}, interlingua: { id: 'positive_obligation_interlingua', query: { constraintEvidenceIds: ['positive_edge_proof'], constraintObligationEvidenceIds: ['positive_obligation_proof'] }, constraints: { obligations: [{ id: 'positive_obligation', family: 'type', kind: 'variance', status: 'missing', sourceId: 'type_constraint', evidenceIds: ['positive_obligation_proof'], missingEvidence: ['translation-type:variance'] }] } } });
assert.equal(positiveObligationReceipt.interlinguaConstraintEvidenceIds.includes('positive_edge_proof'), true);
assert.equal(positiveObligationReceipt.summary.interlinguaConstraintEvidenceIds.positive_edge_proof, 1);
assert.equal(positiveObligationReceipt.interlinguaConstraintObligationEvidenceIds.includes('positive_obligation_proof'), true);
assert.equal(positiveObligationReceipt.summary.interlinguaConstraintObligationEvidenceIds.positive_obligation_proof, 1);

const interlinguaArtifacts = createUniversalConversionArtifacts(interlinguaConstraintPlan, {
  routeId: interlinguaConstraintRoute.id
});
assert.equal(interlinguaArtifacts.index.evidenceReceiptInterlinguaRecordIds.includes(interlinguaConstraintRoute.interlingua.id), true);
assert.equal(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintFamilies.includes('adt-pattern'), true);
assert.equal(Array.isArray(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintEvidenceIds), true);
for (const [sourceKey, indexKey] of [['interlinguaConstraintActions', 'evidenceReceiptInterlinguaConstraintActions'], ['interlinguaConstraintSourceIds', 'evidenceReceiptInterlinguaConstraintSourceIds'], ['interlinguaConstraintRequiredKinds', 'evidenceReceiptInterlinguaConstraintRequiredKinds'], ['interlinguaConstraintRepresentedKinds', 'evidenceReceiptInterlinguaConstraintRepresentedKinds']]) assert.equal(interlinguaReceipt[sourceKey].every((value) => interlinguaArtifacts.index[indexKey].includes(value)), true);
assert.equal(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintObligationKinds.includes('exhaustiveness'), true);
assert.equal(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintObligationStatuses.includes('missing'), true);
assert.equal(Array.isArray(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintObligationEvidenceIds), true);
assert.equal(interlinguaArtifacts.index.evidenceReceiptInterlinguaConstraintObligationMissingEvidence.includes('translation-adt-pattern:exhaustiveness'), true);
assert.equal(interlinguaArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintByFamily['adt-pattern'] >= 1, true);
assert.equal(typeof interlinguaArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintEvidenceIds, 'object');
for (const [key, value] of receiptEdges) assert.equal(interlinguaArtifacts.summary.compactCounts.evidenceReceipts[key][value] >= 1, true);
assert.equal(interlinguaArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintObligationKinds.exhaustiveness >= 1, true);
assert.equal(typeof interlinguaArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintObligationEvidenceIds, 'object');
assert.equal(interlinguaArtifacts.admissionRecords[0].interlinguaConstraintFamilies.includes('adt-pattern'), true);
assert.equal(Array.isArray(interlinguaArtifacts.admissionRecords[0].interlinguaConstraintEvidenceIds), true);
assert.equal(interlinguaArtifacts.admissionRecords[0].interlinguaConstraintObligationKinds.includes('exhaustiveness'), true);
assert.equal(interlinguaArtifacts.admissionRecords[0].interlinguaConstraintObligationStatuses.includes('missing'), true);
assert.equal(interlinguaArtifacts.admissionRecords[0].interlinguaConstraintObligationMissingEvidence.includes('translation-adt-pattern:exhaustiveness'), true);
assert.equal(interlinguaArtifacts.admissionRecords[0].interlingua.constraintObligationMissingEvidence.includes('translation-adt-pattern:exhaustiveness'), true);
assert.equal(queryUniversalConversionArtifacts(interlinguaArtifacts, {
  evidenceReceiptInterlinguaConstraintFamily: 'adt-pattern',
  evidenceReceiptInterlinguaConstraintAction: receiptAction,
  evidenceReceiptInterlinguaConstraintSourceId: receiptSourceId,
  evidenceReceiptInterlinguaConstraintRequiredKind: receiptRequiredKind,
  evidenceReceiptInterlinguaConstraintObligationKind: 'exhaustiveness',
  evidenceReceiptInterlinguaConstraintObligationStatus: 'missing',
  evidenceReceiptInterlinguaConstraintObligationMissingEvidence: 'translation-adt-pattern:exhaustiveness'
})[0].routeId, interlinguaConstraintRoute.id);

const runtimeEvidenceRecord = {
  id: 'canvas_runtime_proof',
  kind: 'conversion-runtime-proof',
  status: 'passed',
  adapterRequirementId: 'runtime_adapter_canvas',
  capability: 'canvas',
  runtimeProofSignals: ['bitmap-hash']
};
const runtimeReceipt = createUniversalConversionRouteEvidenceReceipt({
  id: 'conversion_javascript_to_rust',
  sourceLanguage: 'javascript',
  languageIds: ['javascript'],
  target: 'rust',
  mode: 'target-adapter',
  readiness: 'needs-review',
  admissionAction: 'prioritize',
  mergeRefs: { planId: 'runtime_receipt_plan', evidenceIds: [], proofIds: [], sources: [], semanticOwnershipKeys: [], conflictKeys: [] },
  runtimeAdapterRequirements: [{ id: 'runtime_adapter_canvas', capability: 'canvas' }],
  runtime: {
    routeId: 'runtime_javascript_web_to_rust_cli_canvas',
    source: { id: 'javascript:web', runtime: 'web' },
    target: { id: 'rust:cli', runtime: 'cli' },
    requiredCapabilities: ['canvas'],
    satisfiedCapabilities: [],
    missingCapabilities: [],
    readiness: 'needs-review',
    proofObligations: [{
      id: 'runtime_proof_canvas',
      capability: 'canvas',
      adapterRequirementId: 'runtime_adapter_canvas',
      adapterKind: 'web-canvas-to-rust-canvas',
      status: 'satisfied',
      action: 'attach-runtime-proof-obligation',
      requiredSignals: ['bitmap-hash'],
      providedSignals: ['bitmap-hash'],
      missingSignals: [],
      missingEvidence: [],
      evidenceIds: ['canvas_runtime_proof'],
      claims: { runtimeEquivalenceClaim: false, renderEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false }
    }]
  }
}, { evidence: [runtimeEvidenceRecord] });
assert.equal(runtimeReceipt.runtimeRouteId, 'runtime_javascript_web_to_rust_cli_canvas');
assert.equal(runtimeReceipt.sourceHostId, 'javascript:web');
assert.equal(runtimeReceipt.targetHostId, 'rust:cli');
assert.equal(runtimeReceipt.sourceRuntime, 'web');
assert.equal(runtimeReceipt.targetRuntime, 'cli');
assert.equal(runtimeReceipt.runtimeReadiness, 'needs-review');
assert.equal(runtimeReceipt.requiredRuntimeCapabilities.includes('canvas'), true);
assert.equal(runtimeReceipt.runtimeAdapterRequirementIds.includes('runtime_adapter_canvas'), true);
assert.equal(runtimeReceipt.runtimeProofObligationIds.includes('runtime_proof_canvas'), true);
assert.equal(runtimeReceipt.runtimeProofCapabilities.includes('canvas'), true);
assert.equal(runtimeReceipt.runtimeProofRequiredSignals.includes('bitmap-hash'), true);
assert.equal(runtimeReceipt.runtimeProofProvidedSignals.includes('bitmap-hash'), true);
assert.equal(runtimeReceipt.proofEvidenceIds.includes('canvas_runtime_proof'), true);
assert.equal(runtimeReceipt.records.rejected.some((record) => record.id === 'canvas_runtime_proof'), false);
assert.equal(runtimeReceipt.records.runtimeProof[0].runtimeEquivalenceClaim, false);
assert.equal(runtimeReceipt.summary.runtimeProofByStatus.satisfied, 1);
assert.equal(runtimeReceipt.summary.runtimeProofRequiredSignals['bitmap-hash'], 1);

const proofFreeRuntimeReceipt = createUniversalConversionRouteEvidenceReceipt({
  id: 'conversion_javascript_to_rust_fetch_runtime',
  sourceLanguage: 'javascript',
  languageIds: ['javascript'],
  target: 'rust',
  mode: 'target-adapter',
  readiness: 'ready',
  admissionAction: 'prioritize',
  mergeRefs: { planId: 'runtime_receipt_plan', evidenceIds: [], proofIds: [], sources: [], semanticOwnershipKeys: [], conflictKeys: [] },
  runtimeAdapterRequirements: [],
  runtime: {
    routeId: 'runtime_javascript_node_to_rust_cli_fetch',
    source: { id: 'javascript:node', runtime: 'node' },
    target: { id: 'rust:cli', runtime: 'cli' },
    requiredCapabilities: ['fetch'],
    satisfiedCapabilities: ['fetch'],
    missingCapabilities: [],
    readiness: 'ready',
    proofObligations: []
  }
});
assert.equal(proofFreeRuntimeReceipt.runtimeRouteId, 'runtime_javascript_node_to_rust_cli_fetch');
assert.equal(proofFreeRuntimeReceipt.sourceHostId, 'javascript:node');
assert.equal(proofFreeRuntimeReceipt.targetHostId, 'rust:cli');
assert.equal(proofFreeRuntimeReceipt.requiredRuntimeCapabilities.includes('fetch'), true);
assert.equal(proofFreeRuntimeReceipt.runtimeProofObligationIds.length, 0);
assert.equal(proofFreeRuntimeReceipt.runtimeProofCapabilities.length, 0);
assert.equal(proofFreeRuntimeReceipt.records.runtimeProof.length, 0);
