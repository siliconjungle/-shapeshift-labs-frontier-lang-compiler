import { maxSemanticMergeReadiness, uniqueStrings as u } from './native-import-utils.js';
import { normalizeProjectionMatrixTargets } from './coverage-matrix-profiles.js';

const routeFields = [
  'constraintSpaceIds',
  'constraintSpaceTargets',
  'constraintSpaceVariableIds',
  'constraintSpaceConstraintIds',
  'constraintSpaceHardConstraintIds',
  'constraintSpaceSoftConstraintIds',
  'constraintSpacePreferenceIds',
  'constraintSpaceCollapseStrategyIds',
  'constraintSpaceAdmissionIds',
  'constraintSpaceRequiredKinds',
  'constraintSpaceEvidenceIds',
  'constraintSpaceDecisions',
  'constraintSpaceReadinesses',
  'constraintSpaceFailClosedIds'
];

export function constraintSpaceForRoute(spaces = [], _language = {}, target) {
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target ?? '');
  const matches = constraintSpaceArray(spaces).filter((space) => spaceMatchesTarget(space, normalizedTarget));
  if (!matches.length) return undefined;
  const constraints = matches.flatMap((space) => (space.constraints ?? []).map((record) => ({ ...record, spaceId: space.id })));
  const preferences = matches.flatMap((space) => (space.preferences ?? []).map((record) => ({ ...record, spaceId: space.id })));
  const collapseStrategies = matches.flatMap((space) => (space.collapseStrategies ?? []).map((record) => ({ ...record, spaceId: space.id })));
  const admissions = matches.flatMap((space) => (space.admissions ?? []).map((record) => ({ ...record, spaceId: space.id })));
  const targetCollapseStrategies = collapseStrategies.filter((record) => recordMatchesTarget(record, normalizedTarget));
  const targetAdmissions = admissions.filter((record) => recordMatchesTarget(record, normalizedTarget));
  const targetPreferences = preferences.filter((record) => recordMatchesTarget(record, normalizedTarget));
  const failClosedRecords = [...constraints, ...targetAdmissions].filter((record) => record.failClosed);
  const blockedAdmissions = targetAdmissions.filter((record) => /blocked|reject|rejected/i.test(String(record.status ?? record.decision ?? '')));
  const reviewAdmissions = targetAdmissions.filter((record) => /open|review|needs-review/i.test(String(record.status ?? record.decision ?? '')));
  const reviewConstraints = constraints.filter((record) => record.failClosed || record.strength === 'hard');
  const evidenceIds = u([
    ...matches.flatMap((space) => [
      ...(space.variables ?? []).flatMap((record) => record.evidenceIds ?? []),
      ...(space.constraints ?? []).flatMap((record) => record.evidenceIds ?? []),
      ...(space.preferences ?? []).flatMap((record) => record.evidenceIds ?? []),
      ...(space.collapseStrategies ?? []).flatMap((record) => record.evidenceIds ?? []),
      ...(space.admissions ?? []).flatMap((record) => record.evidenceIds ?? [])
    ])
  ]);
  const missingEvidence = u([
    ...failClosedRecords.filter((record) => !(record.evidenceIds ?? []).length).map((record) => `constraint-space-evidence:${record.id}`),
    ...targetAdmissions.filter((record) => record.failClosed && !(record.evidenceIds ?? []).length).map((record) => `constraint-space-admission-evidence:${record.id}`)
  ]);
  const readiness = maxSemanticMergeReadiness(
    missingEvidence.length || blockedAdmissions.length ? 'blocked' : 'ready',
    reviewAdmissions.length || reviewConstraints.length || targetCollapseStrategies.length ? 'needs-review' : 'ready'
  );
  return {
    id: `constraint_space_route_${normalizedTarget}`,
    spaces: matches,
    spaceIds: u(matches.map((space) => space.id)),
    targets: u(matches.flatMap((space) => space.targets ?? [])),
    variableIds: u(matches.flatMap((space) => (space.variables ?? []).map((record) => record.id))),
    constraintIds: u(constraints.map((record) => record.id)),
    hardConstraintIds: u(constraints.filter((record) => record.strength === 'hard').map((record) => record.id)),
    softConstraintIds: u(constraints.filter((record) => record.strength === 'soft').map((record) => record.id)),
    preferenceIds: u(targetPreferences.map((record) => record.id)),
    collapseStrategyIds: u(targetCollapseStrategies.map((record) => record.id)),
    admissionIds: u(targetAdmissions.map((record) => record.id)),
    requiredKinds: u([...constraints, ...targetCollapseStrategies, ...targetAdmissions].flatMap((record) => record.requires ?? [])),
    evidenceIds,
    decisions: u(targetAdmissions.map((record) => record.decision)),
    failClosedIds: u(failClosedRecords.map((record) => record.id)),
    missingEvidence,
    readiness,
    readinesses: u([readiness, ...targetAdmissions.map((record) => record.status), ...(missingEvidence.length ? ['blocked'] : [])]),
    blockers: u([
      ...blockedAdmissions.map((record) => `Constraint space admission ${record.id} blocks ${normalizedTarget}.`),
      ...missingEvidence.map((key) => `Missing constraint-space evidence: ${key}.`)
    ]),
    review: u([
      ...reviewConstraints.map((record) => `Constraint space ${record.spaceId} has ${record.strength ?? 'declared'} constraint ${record.id}.`),
      ...reviewAdmissions.map((record) => `Constraint space admission ${record.id} requires review before ${normalizedTarget} admission.`),
      ...targetCollapseStrategies.map((record) => `Constraint space collapse ${record.id} needs evidence review for ${normalizedTarget}.`)
    ]),
    tasks: u([
      ...targetAdmissions.map((record) => `review constraint-space admission ${record.id} for ${normalizedTarget}`),
      ...targetCollapseStrategies.map((record) => `review constraint-space collapse ${record.id} for ${normalizedTarget}`),
      ...missingEvidence.map((key) => `attach ${key}`)
    ]),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

export function constraintSpaceRouteFields(constraintSpace) {
  if (!constraintSpace) return {};
  return {
    constraintSpace,
    authoredConstraintSpaces: constraintSpace.spaces,
    constraintSpaceIds: constraintSpace.spaceIds,
    constraintSpaceTargets: constraintSpace.targets,
    constraintSpaceVariableIds: constraintSpace.variableIds,
    constraintSpaceConstraintIds: constraintSpace.constraintIds,
    constraintSpaceHardConstraintIds: constraintSpace.hardConstraintIds,
    constraintSpaceSoftConstraintIds: constraintSpace.softConstraintIds,
    constraintSpacePreferenceIds: constraintSpace.preferenceIds,
    constraintSpaceCollapseStrategyIds: constraintSpace.collapseStrategyIds,
    constraintSpaceAdmissionIds: constraintSpace.admissionIds,
    constraintSpaceRequiredKinds: constraintSpace.requiredKinds,
    constraintSpaceEvidenceIds: constraintSpace.evidenceIds,
    constraintSpaceDecisions: constraintSpace.decisions,
    constraintSpaceReadiness: constraintSpace.readiness,
    constraintSpaceReadinesses: constraintSpace.readinesses,
    constraintSpaceFailClosedIds: constraintSpace.failClosedIds
  };
}

export function routeMatchesConstraintSpaceQuery(route = {}, query = {}, match) {
  return match(query.constraintSpaceId, route.constraintSpaceIds)
    && match(query.constraintSpaceTarget, route.constraintSpaceTargets)
    && match(query.constraintSpaceVariableId, route.constraintSpaceVariableIds)
    && match(query.constraintSpaceConstraintId, route.constraintSpaceConstraintIds)
    && match(query.constraintSpaceHardConstraintId, route.constraintSpaceHardConstraintIds)
    && match(query.constraintSpaceSoftConstraintId, route.constraintSpaceSoftConstraintIds)
    && match(query.constraintSpacePreferenceId, route.constraintSpacePreferenceIds)
    && match(query.constraintSpaceCollapseStrategyId, route.constraintSpaceCollapseStrategyIds)
    && match(query.constraintSpaceAdmissionId, route.constraintSpaceAdmissionIds)
    && match(query.constraintSpaceRequiredKind, route.constraintSpaceRequiredKinds)
    && match(query.constraintSpaceEvidenceId, route.constraintSpaceEvidenceIds)
    && match(query.constraintSpaceDecision, route.constraintSpaceDecisions)
    && match(query.constraintSpaceReadiness, route.constraintSpaceReadinesses)
    && match(query.constraintSpaceFailClosedId, route.constraintSpaceFailClosedIds);
}

export function constraintSpaceWorkItemFields(route = {}) {
  return Object.fromEntries(routeFields.map((field) => [field, route[field] ?? []]));
}

export function mergeConstraintSpaceWorkItemFields(left = {}, right = {}) {
  return Object.fromEntries(routeFields.map((field) => [field, u([...(left[field] ?? []), ...(right[field] ?? [])])]));
}

export function constraintSpaceWorklistSummary(items = []) {
  return Object.fromEntries(routeFields.map((field) => [field, u(items.flatMap((item) => item[field] ?? []))]));
}

export function workItemMatchesConstraintSpaceQuery(item = {}, query = {}, match) {
  return routeMatchesConstraintSpaceQuery(item, query, match);
}

function spaceMatchesTarget(space = {}, target) {
  const targets = normalizeProjectionMatrixTargets(space.targets ?? []);
  return !targets.length || targets.includes(target);
}

function recordMatchesTarget(record = {}, target) {
  const targets = normalizeProjectionMatrixTargets([record.target].filter(Boolean));
  return !targets.length || targets.includes(target);
}

function constraintSpaceArray(value) {
  if (Array.isArray(value)) return value;
  if (value?.spaces && Array.isArray(value.spaces)) return value.spaces;
  return [];
}
