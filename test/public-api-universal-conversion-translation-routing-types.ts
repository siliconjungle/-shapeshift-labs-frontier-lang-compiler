import { createUniversalConversionArtifacts, createUniversalConversionPlan, createUniversalConversionRouteEvidenceReceipt, createUniversalConversionWorklist, queryUniversalConversionArtifacts, queryUniversalConversionPlan, queryUniversalConversionWorklist } from '../src/index.js';
import type { UniversalConversionArtifacts, UniversalConversionPlan, UniversalConversionRouteEvidenceReceipt, UniversalConversionWorklist } from '../src/index.js';

const routingPlan: UniversalConversionPlan = createUniversalConversionPlan({
  targets: ['rust'],
  runtimeRequirements: [{ sourceLanguage: 'javascript', target: 'rust', capability: 'fetch' }]
});
const routingRoute = queryUniversalConversionPlan(routingPlan, {
  translationRuntimeReadiness: 'ready',
  translationRuntimeAdapterRequirementId: 'runtime_adapter',
  translationRuntimeProofObligationId: 'runtime_proof',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'ready',
  translationDialectRecordId: 'dialect_record'
}).bestRoute;
routingRoute?.translationAdmission.runtimeAdapterRequirementIds satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.runtimeProofObligationIds satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.runtimeProofMissingSignals satisfies readonly string[] | undefined;
routingRoute?.translationAdmission.dialectRecordIds satisfies readonly string[] | undefined;

const routingArtifacts: UniversalConversionArtifacts = createUniversalConversionArtifacts(routingPlan, { translationRuntimeReadiness: 'ready', translationRuntimeAdapterRequirementId: 'runtime_adapter', translationRuntimeProofObligationId: 'runtime_proof', translationRuntimeProofMissingSignal: 'network-trace-hash', translationDialectReadiness: 'ready', translationDialectRecordId: 'dialect_record' });
queryUniversalConversionArtifacts(routingArtifacts, {
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
routingArtifacts.admissionRecords[0]?.translationRuntimeProofMissingSignals satisfies readonly string[] | undefined;
routingArtifacts.evidenceReceipts[0]?.translationDialectRecordIds satisfies readonly string[] | undefined;

const routingReceipt: UniversalConversionRouteEvidenceReceipt = createUniversalConversionRouteEvidenceReceipt(routingPlan, {
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'ready'
});
routingReceipt.translationRuntimeReadinesses satisfies readonly string[];
routingReceipt.translationRuntimeAdapterRequirementIds satisfies readonly string[];
routingReceipt.translationRuntimeProofObligationIds satisfies readonly string[];
routingReceipt.translationRuntimeProofMissingSignals satisfies readonly string[];
routingReceipt.translationDialectReadinesses satisfies readonly string[];
routingReceipt.translationDialectRecordIds satisfies readonly string[];
routingReceipt.summary.translationAdmission.runtimeProofMissingSignals satisfies Readonly<Record<string, number>>;

const routingWorklist: UniversalConversionWorklist = createUniversalConversionWorklist(routingPlan, { translationRuntimeReadiness: 'ready', translationRuntimeAdapterRequirementId: 'runtime_adapter', translationRuntimeProofObligationId: 'runtime_proof', translationRuntimeProofMissingSignal: 'network-trace-hash', translationDialectReadiness: 'ready', translationDialectRecordId: 'dialect_record' });
const routingWorklistQuery = queryUniversalConversionWorklist(routingWorklist, {
  translationRuntimeReadiness: 'ready',
  translationRuntimeAdapterRequirementId: 'runtime_adapter',
  translationRuntimeProofObligationId: 'runtime_proof',
  translationRuntimeProofMissingSignal: 'network-trace-hash',
  translationDialectReadiness: 'ready',
  translationDialectRecordId: 'dialect_record'
});
routingWorklist.summary.translationRuntimeReadinesses satisfies readonly string[];
routingWorklist.summary.translationRuntimeAdapterRequirementIds satisfies readonly string[];
routingWorklist.summary.translationRuntimeProofObligationIds satisfies readonly string[];
routingWorklist.summary.translationRuntimeProofMissingSignals satisfies readonly string[];
routingWorklist.summary.translationDialectReadinesses satisfies readonly string[];
routingWorklist.summary.translationDialectRecordIds satisfies readonly string[];
routingWorklistQuery.bestItem?.translationRuntimeProofMissingSignals satisfies readonly string[] | undefined;
