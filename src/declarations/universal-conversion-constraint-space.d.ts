import type { SemanticMergeReadiness as SMR } from '@shapeshift-labs/frontier-lang-kernel';

type Q<T> = T | readonly T[];

export interface UniversalConversionConstraintSpaceRoute {
  readonly id: string;
  readonly spaces: readonly Readonly<Record<string, unknown>>[];
  readonly spaceIds: readonly string[];
  readonly targets: readonly string[];
  readonly variableIds: readonly string[];
  readonly constraintIds: readonly string[];
  readonly hardConstraintIds: readonly string[];
  readonly softConstraintIds: readonly string[];
  readonly preferenceIds: readonly string[];
  readonly collapseStrategyIds: readonly string[];
  readonly admissionIds: readonly string[];
  readonly requiredKinds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly decisions: readonly string[];
  readonly failClosedIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly readiness: SMR;
  readonly readinesses: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly tasks: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export type UniversalConversionConstraintSpaceFieldKey =
  | 'constraintSpaceIds' | 'constraintSpaceTargets' | 'constraintSpaceVariableIds'
  | 'constraintSpaceConstraintIds' | 'constraintSpaceHardConstraintIds' | 'constraintSpaceSoftConstraintIds'
  | 'constraintSpacePreferenceIds' | 'constraintSpaceCollapseStrategyIds' | 'constraintSpaceAdmissionIds'
  | 'constraintSpaceRequiredKinds' | 'constraintSpaceEvidenceIds' | 'constraintSpaceDecisions'
  | 'constraintSpaceReadinesses' | 'constraintSpaceFailClosedIds';

export interface UniversalConversionConstraintSpaceRouteFields extends Partial<Readonly<Record<UniversalConversionConstraintSpaceFieldKey, readonly string[]>>> {
  readonly constraintSpace?: UniversalConversionConstraintSpaceRoute;
  readonly authoredConstraintSpaces?: readonly Readonly<Record<string, unknown>>[];
  readonly constraintSpaceReadiness?: SMR;
}

export interface UniversalConversionConstraintSpaceFields extends Readonly<Record<UniversalConversionConstraintSpaceFieldKey, readonly string[]>> {}

export interface UniversalConversionConstraintSpaceQuery {
  readonly constraintSpaceId?: Q<string>;
  readonly constraintSpaceTarget?: Q<string>;
  readonly constraintSpaceVariableId?: Q<string>;
  readonly constraintSpaceConstraintId?: Q<string>;
  readonly constraintSpaceHardConstraintId?: Q<string>;
  readonly constraintSpaceSoftConstraintId?: Q<string>;
  readonly constraintSpacePreferenceId?: Q<string>;
  readonly constraintSpaceCollapseStrategyId?: Q<string>;
  readonly constraintSpaceAdmissionId?: Q<string>;
  readonly constraintSpaceRequiredKind?: Q<string>;
  readonly constraintSpaceEvidenceId?: Q<string>;
  readonly constraintSpaceDecision?: Q<string>;
  readonly constraintSpaceReadiness?: Q<SMR | string>;
  readonly constraintSpaceFailClosedId?: Q<string>;
}
