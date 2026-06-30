import { uniqueStrings } from './native-import-utils.js';
import { resourceTransferMatches } from './universal-resource-transfer.js';
import { borrowCheckerConstraintMatches } from './universal-borrow-checker-constraints.js';
import { borrowScopeConstraintMatches } from './universal-borrow-scope-constraints.js';
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

export function createUniversalTranslationAdmission(input = {}) {
  const requiredConstructKinds = requiredTranslationConstructKinds(input);
  const representedConstructKinds = representedTranslationConstructKinds(input.representation);
  const missingConstructKinds = requiredConstructKinds.filter((kind) => !representedConstructKinds.includes(kind));
  const evidenceIds = uniqueStrings([...(input.mergeRefs?.evidenceIds ?? []), ...(input.routeEvidence ?? []).map((record) => record?.id)]);
  const proofEvidenceIds = uniqueStrings([...(input.mergeRefs?.proofIds ?? []), ...proofEvidenceIdsFor(input.routeEvidence)]);
  const missingEvidence = translationMissingEvidence(input, missingConstructKinds);
  const blockers = uniqueStrings([...(input.blockers ?? []), ...(input.representation?.blockers ?? []), ...(input.resourceTransfer?.blockers ?? []), ...(input.lifetimeConstraint?.blockers ?? []), ...(input.controlFlowConstraint?.blockers ?? []), ...(input.borrowScopeConstraint?.blockers ?? []), ...(input.borrowCheckerConstraint?.blockers ?? []), ...(input.dataLayoutConstraint?.blockers ?? []), ...(input.effectConstraint?.blockers ?? []), ...(input.concurrencyModelConstraint?.blockers ?? []), ...(input.errorModelConstraint?.blockers ?? []), ...(input.evaluationModelConstraint?.blockers ?? []), ...(input.hostEnvironmentConstraint?.blockers ?? []), ...(input.memoryModelConstraint?.blockers ?? []), ...(input.metaprogrammingConstraint?.blockers ?? []), ...(input.scopeBindingConstraint?.blockers ?? []), ...(input.moduleConstraint?.blockers ?? []), ...(input.objectModelConstraint?.blockers ?? []), ...(input.protocolConstraint?.blockers ?? []), ...(input.typeConstraint?.blockers ?? [])]);
  const review = uniqueStrings([...(input.review ?? []), ...(input.representation?.review ?? []), ...(input.resourceTransfer?.review ?? []), ...(input.lifetimeConstraint?.review ?? []), ...(input.controlFlowConstraint?.review ?? []), ...(input.borrowScopeConstraint?.review ?? []), ...(input.borrowCheckerConstraint?.review ?? []), ...(input.dataLayoutConstraint?.review ?? []), ...(input.effectConstraint?.review ?? []), ...(input.concurrencyModelConstraint?.review ?? []), ...(input.errorModelConstraint?.review ?? []), ...(input.evaluationModelConstraint?.review ?? []), ...(input.hostEnvironmentConstraint?.review ?? []), ...(input.memoryModelConstraint?.review ?? []), ...(input.metaprogrammingConstraint?.review ?? []), ...(input.scopeBindingConstraint?.review ?? []), ...(input.moduleConstraint?.review ?? []), ...(input.objectModelConstraint?.review ?? []), ...(input.protocolConstraint?.review ?? []), ...(input.typeConstraint?.review ?? [])]);
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
    dialectReadiness: input.dialect?.readiness ?? 'ready',
    dialectRecordIds: input.dialect?.recordIds ?? [],
    resourceTransfer: resourceTransferSummary(input.resourceTransfer),
    resourceTransferStatus: input.resourceTransfer?.status,
    resourceTransferAction: input.resourceTransfer?.action,
    resourceTransferMissingEvidence: input.resourceTransfer?.missingEvidence ?? [],
    lifetimeConstraint: constraintSummary(input.lifetimeConstraint),
    lifetimeConstraintStatus: input.lifetimeConstraint?.status,
    lifetimeConstraintAction: input.lifetimeConstraint?.action,
    lifetimeConstraintMissingEvidence: input.lifetimeConstraint?.missingEvidence ?? [],
    controlFlowConstraint: constraintSummary(input.controlFlowConstraint),
    controlFlowConstraintStatus: input.controlFlowConstraint?.status,
    controlFlowConstraintAction: input.controlFlowConstraint?.action,
    controlFlowConstraintMissingEvidence: input.controlFlowConstraint?.missingEvidence ?? [],
    borrowScopeConstraint: constraintSummary(input.borrowScopeConstraint),
    borrowScopeConstraintStatus: input.borrowScopeConstraint?.status,
    borrowScopeConstraintAction: input.borrowScopeConstraint?.action,
    borrowScopeConstraintMissingEvidence: input.borrowScopeConstraint?.missingEvidence ?? [],
    borrowCheckerConstraint: constraintSummary(input.borrowCheckerConstraint),
    borrowCheckerConstraintStatus: input.borrowCheckerConstraint?.status,
    borrowCheckerConstraintAction: input.borrowCheckerConstraint?.action,
    borrowCheckerConstraintMissingEvidence: input.borrowCheckerConstraint?.missingEvidence ?? [],
    dataLayoutConstraint: constraintSummary(input.dataLayoutConstraint),
    dataLayoutConstraintStatus: input.dataLayoutConstraint?.status,
    dataLayoutConstraintAction: input.dataLayoutConstraint?.action,
    dataLayoutConstraintMissingEvidence: input.dataLayoutConstraint?.missingEvidence ?? [],
    effectConstraint: constraintSummary(input.effectConstraint),
    effectConstraintStatus: input.effectConstraint?.status,
    effectConstraintAction: input.effectConstraint?.action,
    effectConstraintMissingEvidence: input.effectConstraint?.missingEvidence ?? [],
    concurrencyModelConstraint: constraintSummary(input.concurrencyModelConstraint),
    concurrencyModelConstraintStatus: input.concurrencyModelConstraint?.status,
    concurrencyModelConstraintAction: input.concurrencyModelConstraint?.action,
    concurrencyModelConstraintMissingEvidence: input.concurrencyModelConstraint?.missingEvidence ?? [],
    errorModelConstraint: constraintSummary(input.errorModelConstraint),
    errorModelConstraintStatus: input.errorModelConstraint?.status,
    errorModelConstraintAction: input.errorModelConstraint?.action,
    errorModelConstraintMissingEvidence: input.errorModelConstraint?.missingEvidence ?? [],
    evaluationModelConstraint: constraintSummary(input.evaluationModelConstraint),
    evaluationModelConstraintStatus: input.evaluationModelConstraint?.status,
    evaluationModelConstraintAction: input.evaluationModelConstraint?.action,
    evaluationModelConstraintMissingEvidence: input.evaluationModelConstraint?.missingEvidence ?? [],
    hostEnvironmentConstraint: constraintSummary(input.hostEnvironmentConstraint),
    hostEnvironmentConstraintStatus: input.hostEnvironmentConstraint?.status,
    hostEnvironmentConstraintAction: input.hostEnvironmentConstraint?.action,
    hostEnvironmentConstraintMissingEvidence: input.hostEnvironmentConstraint?.missingEvidence ?? [],
    memoryModelConstraint: constraintSummary(input.memoryModelConstraint),
    memoryModelConstraintStatus: input.memoryModelConstraint?.status,
    memoryModelConstraintAction: input.memoryModelConstraint?.action,
    memoryModelConstraintMissingEvidence: input.memoryModelConstraint?.missingEvidence ?? [],
    metaprogrammingConstraint: constraintSummary(input.metaprogrammingConstraint),
    metaprogrammingConstraintStatus: input.metaprogrammingConstraint?.status,
    metaprogrammingConstraintAction: input.metaprogrammingConstraint?.action,
    metaprogrammingConstraintMissingEvidence: input.metaprogrammingConstraint?.missingEvidence ?? [],
    scopeBindingConstraint: constraintSummary(input.scopeBindingConstraint),
    scopeBindingConstraintStatus: input.scopeBindingConstraint?.status,
    scopeBindingConstraintAction: input.scopeBindingConstraint?.action,
    scopeBindingConstraintMissingEvidence: input.scopeBindingConstraint?.missingEvidence ?? [],
    moduleConstraint: constraintSummary(input.moduleConstraint),
    moduleConstraintStatus: input.moduleConstraint?.status,
    moduleConstraintAction: input.moduleConstraint?.action,
    moduleConstraintMissingEvidence: input.moduleConstraint?.missingEvidence ?? [],
    objectModelConstraint: constraintSummary(input.objectModelConstraint),
    objectModelConstraintStatus: input.objectModelConstraint?.status,
    objectModelConstraintAction: input.objectModelConstraint?.action,
    objectModelConstraintMissingEvidence: input.objectModelConstraint?.missingEvidence ?? [],
    protocolConstraint: constraintSummary(input.protocolConstraint),
    protocolConstraintStatus: input.protocolConstraint?.status,
    protocolConstraintAction: input.protocolConstraint?.action,
    protocolConstraintMissingEvidence: input.protocolConstraint?.missingEvidence ?? [],
    typeConstraint: constraintSummary(input.typeConstraint),
    typeConstraintStatus: input.typeConstraint?.status,
    typeConstraintAction: input.typeConstraint?.action,
    typeConstraintMissingEvidence: input.typeConstraint?.missingEvidence ?? [],
    targetAdapterId: input.targetCell?.adapter,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function conversionRouteMatchesTranslationAdmissionQuery(route, query = {}) {
  const admission = route?.translationAdmission ?? {};
  return match(query.translationAdmissionStatus, [admission.status])
    && match(query.translationAdmissionAction, [admission.action])
    && match(query.missingTranslationEvidence, admission.missingEvidence)
    && match(query.translationEvidenceId, admission.evidenceIds)
    && match(query.translationProofEvidenceId, admission.proofEvidenceIds)
    && resourceTransferMatches(route?.resourceTransfer ?? admission.resourceTransfer, query)
    && lifetimeConstraintMatches(route?.lifetimeConstraint ?? admission.lifetimeConstraint, query)
    && controlFlowConstraintMatches(route?.controlFlowConstraint ?? admission.controlFlowConstraint, query)
    && borrowScopeConstraintMatches(route?.borrowScopeConstraint ?? admission.borrowScopeConstraint, query)
    && borrowCheckerConstraintMatches(route?.borrowCheckerConstraint ?? admission.borrowCheckerConstraint, query)
    && dataLayoutConstraintMatches(route?.dataLayoutConstraint ?? admission.dataLayoutConstraint, query)
    && effectConstraintMatches(route?.effectConstraint ?? admission.effectConstraint, query)
    && concurrencyModelConstraintMatches(route?.concurrencyModelConstraint ?? admission.concurrencyModelConstraint, query)
    && errorModelConstraintMatches(route?.errorModelConstraint ?? admission.errorModelConstraint, query)
    && evaluationModelConstraintMatches(route?.evaluationModelConstraint ?? admission.evaluationModelConstraint, query)
    && hostEnvironmentConstraintMatches(route?.hostEnvironmentConstraint ?? admission.hostEnvironmentConstraint, query)
    && memoryModelConstraintMatches(route?.memoryModelConstraint ?? admission.memoryModelConstraint, query)
    && metaprogrammingConstraintMatches(route?.metaprogrammingConstraint ?? admission.metaprogrammingConstraint, query)
    && scopeBindingConstraintMatches(route?.scopeBindingConstraint ?? admission.scopeBindingConstraint, query)
    && moduleConstraintMatches(route?.moduleConstraint ?? admission.moduleConstraint, query)
    && objectModelConstraintMatches(route?.objectModelConstraint ?? admission.objectModelConstraint, query)
    && protocolConstraintMatches(route?.protocolConstraint ?? admission.protocolConstraint, query)
    && typeConstraintMatches(route?.typeConstraint ?? admission.typeConstraint, query)
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
    ...(dialectMissing.includes('dialect-projection-evidence') ? ['translation-dialect-projection-evidence'] : []),
    ...(input.resourceTransfer?.missingEvidence ?? []),
    ...(input.lifetimeConstraint?.missingEvidence ?? []),
    ...(input.controlFlowConstraint?.missingEvidence ?? []),
    ...(input.borrowScopeConstraint?.missingEvidence ?? []),
    ...(input.borrowCheckerConstraint?.missingEvidence ?? []),
    ...(input.dataLayoutConstraint?.missingEvidence ?? []),
    ...(input.effectConstraint?.missingEvidence ?? []),
    ...(input.concurrencyModelConstraint?.missingEvidence ?? []),
    ...(input.errorModelConstraint?.missingEvidence ?? []),
    ...(input.evaluationModelConstraint?.missingEvidence ?? []),
    ...(input.hostEnvironmentConstraint?.missingEvidence ?? []),
    ...(input.memoryModelConstraint?.missingEvidence ?? []),
    ...(input.metaprogrammingConstraint?.missingEvidence ?? []),
    ...(input.scopeBindingConstraint?.missingEvidence ?? []),
    ...(input.moduleConstraint?.missingEvidence ?? []),
    ...(input.objectModelConstraint?.missingEvidence ?? []),
    ...(input.protocolConstraint?.missingEvidence ?? []),
    ...(input.typeConstraint?.missingEvidence ?? [])
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

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
