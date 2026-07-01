import { uniqueStrings } from './native-import-utils.js';
import { adtPatternConstraintMatches } from './universal-adt-pattern-constraints.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
import { callableBoundaryConstraintMatches } from './universal-callable-boundary-constraints.js';
import { controlFlowConstraintMatches } from './universal-control-flow-constraints.js';
import { concurrencyModelConstraintMatches } from './universal-concurrency-model-constraints.js';
import { dataLayoutConstraintMatches } from './universal-data-layout-constraints.js';
import { effectConstraintMatches } from './universal-effect-constraints.js';
import { errorModelConstraintMatches } from './universal-error-model-constraints.js';
import { evaluationModelConstraintMatches } from './universal-evaluation-model-constraints.js';
import { hostEnvironmentConstraintMatches } from './universal-host-environment-constraints.js';
import { lifetimeConstraintMatches } from './universal-lifetime-constraints.js';
import { memoryModelConstraintMatches } from './universal-memory-model-constraints.js';
import { metaprogrammingConstraintMatches } from './universal-metaprogramming-constraints.js';
import { moduleConstraintMatches } from './universal-module-constraints.js';
import { numericSemanticsConstraintMatches } from './universal-numeric-semantics-constraints.js';
import { textSemanticsConstraintMatches } from './universal-text-semantics-constraints.js';
import { collectionSemanticsConstraintMatches } from './universal-collection-semantics-constraints.js';
import { serializationSemanticsConstraintMatches } from './universal-serialization-semantics-constraints.js';
import { dependencySemanticsConstraintMatches } from './universal-dependency-semantics-constraints.js';
import { objectModelConstraintMatches } from './universal-object-model-constraints.js';
import { protocolConstraintMatches } from './universal-protocol-constraints.js';
import { scopeBindingConstraintMatches } from './universal-scope-binding-constraints.js';
import { typeConstraintMatches } from './universal-type-constraints.js';

export const UniversalTranslationAdmissionStatuses = Object.freeze([
  'blocked',
  'needs-adapter',
  'needs-evidence',
  'needs-review',
  'admittable-for-review'
]);

export const UniversalTranslationAdmissionActions = Object.freeze([
  'reject',
  'add-target-adapter',
  'collect-translation-evidence',
  'review-target-adapter',
  'materialize-review-record'
]);

const constraintFields = ['lifetimeConstraint', 'controlFlowConstraint', 'callableBoundaryConstraint', 'adtPatternConstraint', 'borrowScopeConstraint', 'borrowCheckerConstraint', 'dataLayoutConstraint', 'effectConstraint', 'concurrencyModelConstraint', 'errorModelConstraint', 'evaluationModelConstraint', 'hostEnvironmentConstraint', 'memoryModelConstraint', 'metaprogrammingConstraint', 'scopeBindingConstraint', 'moduleConstraint', 'numericSemanticsConstraint', 'textSemanticsConstraint', 'collectionSemanticsConstraint', 'serializationSemanticsConstraint', 'dependencySemanticsConstraint', 'objectModelConstraint', 'protocolConstraint', 'typeConstraint'];
const constraintMatchers = [
  ['lifetimeConstraint', lifetimeConstraintMatches], ['controlFlowConstraint', controlFlowConstraintMatches], ['callableBoundaryConstraint', callableBoundaryConstraintMatches], ['adtPatternConstraint', adtPatternConstraintMatches], ['borrowScopeConstraint', borrowScopeConstraintMatches], ['borrowCheckerConstraint', borrowCheckerConstraintMatches], ['dataLayoutConstraint', dataLayoutConstraintMatches], ['effectConstraint', effectConstraintMatches], ['concurrencyModelConstraint', concurrencyModelConstraintMatches], ['errorModelConstraint', errorModelConstraintMatches], ['evaluationModelConstraint', evaluationModelConstraintMatches], ['hostEnvironmentConstraint', hostEnvironmentConstraintMatches], ['memoryModelConstraint', memoryModelConstraintMatches], ['metaprogrammingConstraint', metaprogrammingConstraintMatches], ['scopeBindingConstraint', scopeBindingConstraintMatches], ['moduleConstraint', moduleConstraintMatches], ['numericSemanticsConstraint', numericSemanticsConstraintMatches], ['textSemanticsConstraint', textSemanticsConstraintMatches], ['collectionSemanticsConstraint', collectionSemanticsConstraintMatches], ['serializationSemanticsConstraint', serializationSemanticsConstraintMatches], ['dependencySemanticsConstraint', dependencySemanticsConstraintMatches], ['objectModelConstraint', objectModelConstraintMatches], ['protocolConstraint', protocolConstraintMatches], ['typeConstraint', typeConstraintMatches]
];

export function createUniversalTranslationAdmission(input = {}) {
  const requiredConstructKinds = requiredTranslationConstructKinds(input);
  const representedConstructKinds = representedTranslationConstructKinds(input.representation);
  const missingConstructKinds = requiredConstructKinds.filter((kind) => !representedConstructKinds.includes(kind));
  const evidenceIds = uniqueStrings([...(input.mergeRefs?.evidenceIds ?? []), ...(input.routeEvidence ?? []).map((record) => record?.id)]);
  const proofEvidenceIds = uniqueStrings([...(input.mergeRefs?.proofIds ?? []), ...proofEvidenceIdsFor(input.routeEvidence)]);
  const missingEvidence = translationMissingEvidence(input, missingConstructKinds);
  const blockers = uniqueStrings([...(input.blockers ?? []), ...(input.representation?.blockers ?? []), ...(input.resourceTransfer?.blockers ?? []), ...constraintFields.flatMap((field) => input[field]?.blockers ?? [])]);
  const review = uniqueStrings([...(input.review ?? []), ...(input.representation?.review ?? []), ...(input.resourceTransfer?.review ?? []), ...constraintFields.flatMap((field) => input[field]?.review ?? [])]);
  const status = translationAdmissionStatus(input, missingEvidence, blockers);
  return {
    status,
    action: translationAdmissionAction(status),
    requiredConstructKinds,
    representedConstructKinds,
    missingConstructKinds,
    missingEvidence,
    blockers,
    review,
    evidenceIds,
    proofEvidenceIds,
    runtimeReadiness: input.runtime?.readiness ?? 'ready',
    runtimeAdapterRequirementIds: (input.runtime?.adapterRequirements ?? []).map((entry) => entry.id ?? entry.capability).filter(Boolean),
    runtimeProofObligationIds: (input.runtime?.proofObligations ?? []).map((entry) => entry.id).filter(Boolean),
    runtimeProofCapabilities: uniqueStrings((input.runtime?.proofObligations ?? []).map((entry) => entry.capability)),
    runtimeProofStatuses: uniqueStrings((input.runtime?.proofObligations ?? []).map((entry) => entry.status)),
    runtimeProofRequiredSignals: uniqueStrings((input.runtime?.proofObligations ?? []).flatMap((entry) => entry.requiredSignals ?? [])),
    runtimeProofProvidedSignals: uniqueStrings((input.runtime?.proofObligations ?? []).flatMap((entry) => entry.providedSignals ?? [])),
    runtimeProofMissingSignals: uniqueStrings((input.runtime?.proofObligations ?? []).flatMap((entry) => entry.missingSignals ?? [])),
    dialectReadiness: input.dialect?.readiness ?? 'ready',
    dialectRecordIds: input.dialect?.recordIds ?? [],
    resourceTransfer: resourceTransferSummary(input.resourceTransfer),
    resourceTransferStatus: input.resourceTransfer?.status,
    resourceTransferAction: input.resourceTransfer?.action,
    resourceTransferMissingEvidence: input.resourceTransfer?.missingEvidence ?? [],
    ...constraintAdmissionFields(input),
    targetAdapterId: input.targetCell?.adapter, autoMergeClaim: false, semanticEquivalenceClaim: false
  };
}

export function conversionRouteMatchesTranslationAdmissionQuery(route, query = {}) {
  const admission = route?.translationAdmission ?? {};
  return match(query.translationAdmissionStatus, [admission.status])
    && match(query.translationAdmissionAction, [admission.action])
    && match(query.missingTranslationEvidence, admission.missingEvidence)
    && match(query.translationEvidenceId, admission.evidenceIds)
    && match(query.translationProofEvidenceId, admission.proofEvidenceIds)
    && match(query.translationRuntimeReadiness, [admission.runtimeReadiness])
    && match(query.translationRuntimeAdapterRequirementId, admission.runtimeAdapterRequirementIds)
    && match(query.translationRuntimeProofObligationId, admission.runtimeProofObligationIds)
    && match(query.translationRuntimeProofCapability, admission.runtimeProofCapabilities)
    && match(query.translationRuntimeProofStatus, admission.runtimeProofStatuses)
    && match(query.translationRuntimeProofRequiredSignal, admission.runtimeProofRequiredSignals)
    && match(query.translationRuntimeProofProvidedSignal, admission.runtimeProofProvidedSignals)
    && match(query.translationRuntimeProofMissingSignal, admission.runtimeProofMissingSignals)
    && match(query.translationDialectReadiness, [admission.dialectReadiness])
    && match(query.translationDialectRecordId, admission.dialectRecordIds)
    && resourceTransferMatches(route?.resourceTransfer ?? admission.resourceTransfer, query)
    && constraintMatchers.every(([field, matches]) => matches(route?.[field] ?? admission[field], query))
    && match(query.requiredTranslationConstructKind, admission.requiredConstructKinds)
    && match(query.representedTranslationConstructKind, admission.representedConstructKinds)
    && match(query.targetAdapterId, [admission.targetAdapterId, route?.adapter]);
}

function requiredTranslationConstructKinds(input) {
  return uniqueStrings([
    'source-import',
    'semantic-symbol',
    'source-map',
    'parser-feature',
    'target-adapter',
    'semantic-ownership',
    'proof-evidence',
    ...((input.runtime?.requiredCapabilities ?? []).length || (input.runtime?.adapterRequirements ?? []).length ? ['runtime-capability'] : []),
    ...((input.callableBoundaryConstraint?.requiredKinds ?? []).length ? ['callable-boundary-contract'] : []),
    ...((input.adtPatternConstraint?.requiredKinds ?? []).length ? ['adt-pattern-contract'] : []),
    ...((input.numericSemanticsConstraint?.requiredKinds ?? []).length ? ['numeric-semantics-contract'] : []),
    ...((input.textSemanticsConstraint?.requiredKinds ?? []).length ? ['text-semantics-contract'] : []),
    ...((input.collectionSemanticsConstraint?.requiredKinds ?? []).length ? ['collection-semantics-contract'] : []),
    ...((input.serializationSemanticsConstraint?.requiredKinds ?? []).length ? ['serialization-semantics-contract'] : []),
    ...((input.dependencySemanticsConstraint?.requiredKinds ?? []).length ? ['dependency-semantics-contract'] : []),
    ...((input.protocolConstraint?.requiredKinds ?? []).length ? ['protocol-contract'] : []),
    ...((input.dialect?.records ?? []).length ? ['dialect-projection'] : [])
  ]);
}

function representedTranslationConstructKinds(representation) {
  return uniqueStrings((representation?.constructs ?? [])
    .filter((construct) => construct.status === 'represented')
    .map((construct) => construct.kind));
}

function translationMissingEvidence(input, missingConstructKinds) {
  const runtimeAdapterRequirements = input.runtime?.adapterRequirements ?? [];
  const dialectMissing = input.dialect?.missingEvidence ?? [];
  return uniqueStrings([
    ...(missingConstructKinds.includes('target-adapter') ? ['translation-target-adapter'] : []),
    ...(hasPassedTranslationProof(input.routeEvidence) ? [] : ['translation-proof-or-replay']),
    ...(missingConstructKinds.includes('source-map') ? ['translation-source-map'] : []),
    ...(missingConstructKinds.includes('semantic-ownership') ? ['translation-semantic-ownership'] : []),
    ...(runtimeAdapterRequirements.length && !hasPassedRuntimeAdapterProof(input.routeEvidence) ? ['translation-runtime-adapter-proof'] : []),
    ...((input.runtime?.proofObligations ?? []).flatMap((entry) => entry.missingEvidence ?? [])),
    ...(dialectMissing.includes('dialect-projection-evidence') ? ['translation-dialect-projection-evidence'] : []),
    ...(input.resourceTransfer?.missingEvidence ?? []),
    ...constraintFields.flatMap((field) => input[field]?.missingEvidence ?? [])
  ]);
}

function translationAdmissionStatus(input, missingEvidence, blockers) {
  if (input.readiness === 'blocked' || blockers.length || (input.runtime?.missingCapabilities ?? []).length || input.dialect?.readiness === 'blocked') return 'blocked';
  if (missingEvidence.includes('translation-target-adapter') || input.mode === 'semantic-index-only') return 'needs-adapter';
  if (missingEvidence.length) return 'needs-evidence';
  if ((input.runtime?.adapterRequirements ?? []).length || (input.dialect?.records ?? []).some((record) => record.readiness !== 'ready') || input.readiness !== 'ready') return 'needs-review';
  return 'admittable-for-review';
}

function translationAdmissionAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-adapter') return 'add-target-adapter';
  if (status === 'needs-evidence') return 'collect-translation-evidence';
  if (status === 'needs-review') return 'review-target-adapter';
  return 'materialize-review-record';
}

function hasPassedTranslationProof(evidence) {
  return (evidence ?? []).some((record) => passed(record) && /proof|replay|oracle|test|gate|verification|runtime/i.test(evidenceKind(record)));
}

function hasPassedRuntimeAdapterProof(evidence) {
  return (evidence ?? []).some((record) => passed(record) && /runtime|adapter|capability|proof|replay/i.test(evidenceKind(record)));
}

function proofEvidenceIdsFor(evidence) {
  return (evidence ?? []).filter((record) => passed(record) && /proof|replay|oracle|test|gate|verification|runtime/i.test(evidenceKind(record))).map((record) => record.id).filter(Boolean);
}

function passed(record) {
  return record?.status === 'passed' || record?.status === 'ok' || record?.status === 'success';
}

function evidenceKind(record) {
  return String(record?.kind ?? record?.type ?? record?.scope ?? record?.metadata?.kind ?? '');
}

function resourceTransferSummary(resourceTransfer) {
  if (!resourceTransfer) return undefined;
  return {
    id: resourceTransfer.id,
    status: resourceTransfer.status,
    action: resourceTransfer.action,
    requiredKinds: resourceTransfer.requiredKinds ?? [],
    representedKinds: resourceTransfer.representedKinds ?? [],
    missingKinds: resourceTransfer.missingKinds ?? [],
    losses: (resourceTransfer.losses ?? []).map((loss) => loss.kind),
    ownershipConstraints: ownershipConstraintSummary(resourceTransfer.ownershipConstraints)
  };
}

function ownershipConstraintSummary(evidence) {
  if (!evidence) return undefined;
  return {
    id: evidence.id,
    status: evidence.status,
    action: evidence.action,
    requiredKinds: evidence.requiredKinds ?? [],
    representedKinds: evidence.representedKinds ?? [],
    missingKinds: evidence.missingKinds ?? [],
    missingEvidence: evidence.missingEvidence ?? []
  };
}

function constraintSummary(evidence) {
  if (!evidence) return undefined;
  return {
    id: evidence.id,
    status: evidence.status,
    action: evidence.action,
    requiredKinds: evidence.requiredKinds ?? [],
    representedKinds: evidence.representedKinds ?? [],
    missingKinds: evidence.missingKinds ?? [],
    missingEvidence: evidence.missingEvidence ?? []
  };
}

function constraintAdmissionFields(input) {
  return Object.fromEntries(constraintFields.flatMap((field) => {
    const evidence = input[field];
    return [[field, constraintSummary(evidence)], [`${field}Status`, evidence?.status], [`${field}Action`, evidence?.action], [`${field}MissingEvidence`, evidence?.missingEvidence ?? []]];
  }));
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
