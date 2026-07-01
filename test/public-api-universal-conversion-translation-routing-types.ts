import { createUniversalConversionArtifacts, createUniversalConversionPlan, createUniversalConversionRouteEvidenceReceipt, createUniversalConversionWorklist, createUniversalRuntimeCapabilityMatrix, queryUniversalConversionArtifacts, queryUniversalConversionPlan, queryUniversalConversionWorklist, queryUniversalRuntimeCapabilityMatrix, runtimeProofObligationMatches } from '../src/index.js';
import type { UniversalConversionArtifacts, UniversalConversionPlan, UniversalConversionRouteEvidenceReceipt, UniversalConversionWorklist, UniversalRuntimeCapabilityMatrix, UniversalRuntimeProofObligationQuery } from '../src/index.js';

const routingPlan: UniversalConversionPlan = createUniversalConversionPlan({
  targets: ['rust'],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }]
});
const routingRoute = queryUniversalConversionPlan(routingPlan, {
  routeId: ['conversion_javascript_to_rust'],
  sourceLanguage: ['javascript'],
  target: ['rust'],
  mode: ['target-adapter'],
  readiness: ['ready'],
  admissionAction: ['prioritize'],
  translationAdmissionStatus: ['needs-evidence'],
  translationAdmissionAction: ['collect-translation-evidence'],
  missingTranslationEvidence: ['translation-proof-or-replay'],
  translationEvidenceId: ['evidence_admittable_translation_proof'],
  translationProofEvidenceId: ['evidence_admittable_translation_proof'],
  requiredTranslationConstructKind: ['target-adapter'],
  representedTranslationConstructKind: ['target-adapter'],
  targetAdapterId: ['fixture-js-rust'],
  translationRuntimeReadiness: ['ready'],
  translationRuntimeAdapterRequirementId: ['runtime_adapter'],
  translationRuntimeProofObligationId: ['runtime_proof'],
  translationRuntimeProofMissingSignal: ['network-trace-hash'],
  translationDialectReadiness: ['ready'],
  translationDialectRecordId: ['dialect_record']
}).bestRoute;
routingRoute?.translationAdmission.runtimeAdapterRequirementIds satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.runtimeProofObligationIds satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.runtimeProofMissingSignals satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.dialectRecordIds satisfies readonly string[] | undefined;
const runtimeMatrix: UniversalRuntimeCapabilityMatrix = createUniversalRuntimeCapabilityMatrix({ sourceHosts: ['javascript:web'], targetHosts: ['rust:cli'], runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }] });
queryUniversalRuntimeCapabilityMatrix(runtimeMatrix, { language: ['javascript'], target: ['rust'], sourceRuntime: ['web'], targetRuntime: ['cli'], capability: ['fetch'], runtimeProofObligationId: ['runtime_proof'], runtimeProofCapability: ['fetch'], runtimeProofStatus: ['needs-evidence'], runtimeProofRequiredSignal: ['network-trace-hash'], runtimeProofMissingSignal: ['network-trace-hash'], runtimeProofProvidedSignal: ['telemetry-hash'] }).bestRoute?.proofObligations satisfies readonly unknown[] | undefined;
const runtimeProofQuery = { runtimeProofObligationId: ['runtime_proof'], runtimeProofCapability: ['fetch'], runtimeProofStatus: ['needs-evidence'], runtimeProofRequiredSignal: ['network-trace-hash'], runtimeProofMissingSignal: ['network-trace-hash'], runtimeProofProvidedSignal: ['telemetry-hash'] } satisfies UniversalRuntimeProofObligationQuery;
runtimeProofObligationMatches(runtimeMatrix.routes[0]?.proofObligations[0], runtimeProofQuery) satisfies boolean;

const routingArtifacts: UniversalConversionArtifacts = createUniversalConversionArtifacts(routingPlan, { routeId: ['conversion_javascript_to_rust'], sourceLanguage: ['javascript'], target: ['rust'], mode: ['target-adapter'], readiness: ['ready'], admissionAction: ['prioritize'], translationRuntimeReadiness: 'ready', translationRuntimeAdapterRequirementId: 'runtime_adapter', translationRuntimeProofObligationId: 'runtime_proof', translationRuntimeProofMissingSignal: 'network-trace-hash', translationDialectReadiness: 'ready', translationDialectRecordId: 'dialect_record' });
queryUniversalConversionArtifacts(routingArtifacts, {
  language: ['javascript'],
  sourceLanguage: ['javascript'],
  target: ['rust'],
  mode: ['target-adapter'],
  readiness: ['ready'],
  admissionAction: ['prioritize'],
  translationRuntimeReadiness: 'ready',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectRecordId: 'dialect_record'
});
routingArtifacts.index.translationRuntimeReadinesses satisfies readonly string[];
routingArtifacts.index.translationRuntimeAdapterRequirementIds satisfies readonly string[];
routingArtifacts.index.translationRuntimeProofObligationIds satisfies readonly string[];
routingArtifacts.index.translationRuntimeProofMissingSignals satisfies readonly string[];
routingArtifacts.index.translationDialectReadinesses satisfies readonly string[];
routingArtifacts.index.translationDialectRecordIds satisfies readonly string[];
routingArtifacts.summary.compactCounts.translationAdmission.runtimeAdapterRequirementIds satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.runtimeProofMissingSignals satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.dialectRecordIds satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.evidenceIds satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.requiredConstructKinds satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.representedConstructKinds satisfies Readonly<Record<string, number>>;
routingArtifacts.summary.compactCounts.translationAdmission.targetAdapterIds satisfies Readonly<Record<string, number>>;
routingArtifacts.admissionRecords[0]?.translationRuntimeProofMissingSignals satisfies readonly string[] | undefined;
routingArtifacts.evidenceReceipts[0]?.translationDialectRecordIds satisfies readonly string[] | undefined;

const routingReceipt: UniversalConversionRouteEvidenceReceipt = createUniversalConversionRouteEvidenceReceipt(routingPlan, {
  routeId: ['conversion_javascript_to_rust'],
  sourceLanguage: ['javascript'],
  target: ['rust'],
  mode: ['target-adapter'],
  readiness: ['ready'],
  admissionAction: ['prioritize'],
  dialectReadiness: ['ready'],
  dialectRegistryId: ['dialect_registry'],
  dialectRecordId: ['dialect_record'],
  dialectConstructKind: ['runtime'],
  dialectDisposition: ['runtime-required'],
  translationAdmissionStatus: ['needs-evidence'],
  translationAdmissionAction: ['collect-translation-evidence'],
  missingTranslationEvidence: ['translation-proof-or-replay'],
  translationEvidenceId: ['evidence_admittable_translation_proof'],
  translationProofEvidenceId: ['evidence_admittable_translation_proof'],
  requiredTranslationConstructKind: ['target-adapter'],
  representedTranslationConstructKind: ['target-adapter'],
  targetAdapterId: ['fixture-js-rust'],
  translationRuntimeProofMissingSignal: ['network-trace-hash'],
  translationDialectReadiness: ['ready']
});
routingReceipt.translationRuntimeReadinesses satisfies readonly string[];
routingReceipt.translationRuntimeAdapterRequirementIds satisfies readonly string[];
routingReceipt.translationRuntimeProofObligationIds satisfies readonly string[];
routingReceipt.translationRuntimeProofMissingSignals satisfies readonly string[];
routingReceipt.translationDialectReadinesses satisfies readonly string[];
routingReceipt.translationDialectRecordIds satisfies readonly string[];
routingReceipt.summary.translationAdmission.runtimeProofMissingSignals satisfies Readonly<Record<string, number>>;
routingReceipt.summary.translationAdmission.evidenceIds satisfies Readonly<Record<string, number>>;
routingReceipt.summary.translationAdmission.requiredConstructKinds satisfies Readonly<Record<string, number>>;
routingReceipt.summary.translationAdmission.representedConstructKinds satisfies Readonly<Record<string, number>>;
routingReceipt.summary.translationAdmission.targetAdapterIds satisfies Readonly<Record<string, number>>;

const routingWorklist: UniversalConversionWorklist = createUniversalConversionWorklist(routingPlan, { sourceLanguage: ['javascript'], target: ['rust'], translationAdmissionStatus: ['needs-evidence'], translationAdmissionAction: ['collect-translation-evidence'], missingTranslationEvidence: ['translation-proof-or-replay'], translationEvidenceId: ['evidence_admittable_translation_proof'], translationProofEvidenceId: ['evidence_admittable_translation_proof'], requiredTranslationConstructKind: ['target-adapter'], representedTranslationConstructKind: ['target-adapter'], targetAdapterId: ['fixture-js-rust'], translationRuntimeReadiness: 'ready', translationRuntimeAdapterRequirementId: 'runtime_adapter', translationRuntimeProofObligationId: 'runtime_proof', translationRuntimeProofMissingSignal: 'network-trace-hash', translationDialectReadiness: 'ready', translationDialectRecordId: 'dialect_record' });
const routingWorklistQuery = queryUniversalConversionWorklist(routingWorklist, {
  sourceLanguage: ['javascript'],
  target: ['rust'],
  mode: ['target-adapter'],
  readiness: ['ready'],
  admissionAction: ['prioritize'],
  translationAdmissionStatus: ['needs-evidence'],
  translationAdmissionAction: ['collect-translation-evidence'],
  missingTranslationEvidence: ['translation-proof-or-replay'],
  translationEvidenceId: ['evidence_admittable_translation_proof'],
  translationProofEvidenceId: ['evidence_admittable_translation_proof'],
  requiredTranslationConstructKind: ['target-adapter'],
  representedTranslationConstructKind: ['target-adapter'],
  targetAdapterId: ['fixture-js-rust'],
  translationRuntimeReadiness: 'ready',
  translationRuntimeAdapterRequirementId: 'runtime_adapter',
  translationRuntimeProofObligationId: 'runtime_proof',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'ready',
  translationDialectRecordId: 'dialect_record'
});
routingWorklist.summary.translationAdmissionStatuses satisfies readonly string[];
routingWorklist.summary.translationAdmissionActions satisfies readonly string[];
routingWorklist.summary.missingTranslationEvidence satisfies readonly string[];
routingWorklist.summary.translationEvidenceIds satisfies readonly string[];
routingWorklist.summary.translationProofEvidenceIds satisfies readonly string[];
routingWorklist.summary.translationRuntimeReadinesses satisfies readonly string[];
routingWorklist.summary.translationRuntimeAdapterRequirementIds satisfies readonly string[];
routingWorklist.summary.translationRuntimeProofObligationIds satisfies readonly string[];
routingWorklist.summary.translationRuntimeProofMissingSignals satisfies readonly string[];
routingWorklist.summary.translationDialectReadinesses satisfies readonly string[];
routingWorklist.summary.translationDialectRecordIds satisfies readonly string[];
routingWorklist.summary.requiredTranslationConstructKinds satisfies readonly string[];
routingWorklist.summary.representedTranslationConstructKinds satisfies readonly string[];
routingWorklist.summary.targetAdapterIds satisfies readonly string[];
routingWorklistQuery.bestItem?.translationAdmissionStatuses satisfies readonly string[] | undefined;
routingWorklistQuery.bestItem?.missingTranslationEvidence satisfies readonly string[] | undefined;
routingWorklistQuery.bestItem?.translationProofEvidenceIds satisfies readonly string[] | undefined;
routingWorklistQuery.bestItem?.translationRuntimeProofMissingSignals satisfies readonly string[] | undefined;
