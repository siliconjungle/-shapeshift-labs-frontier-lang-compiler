import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalAdtPatternConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalAdtPatternConstraintAction = 'skip' | 'attach-adt-pattern-record' | 'review-adt-pattern-loss' | 'collect-adt-pattern-evidence' | 'reject';

export interface UniversalAdtPatternRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly name?: string;
  readonly symbolName?: string; readonly typeName?: string; readonly enumName?: string; readonly unionName?: string; readonly symbolId?: string;
  readonly adtKind?: string; readonly kind?: string; readonly symbolKind?: string; readonly declarationKind?: string; readonly typeKind?: string;
  readonly patternKind?: string; readonly matchKind?: string; readonly caseKind?: string; readonly predicate?: string; readonly relationKind?: string;
  readonly variantNames?: readonly string[]; readonly variants?: readonly string[]; readonly caseNames?: readonly string[]; readonly cases?: readonly string[]; readonly members?: readonly string[];
  readonly constructorNames?: readonly string[]; readonly constructors?: readonly string[]; readonly caseConstructors?: readonly string[];
  readonly payloadFieldNames?: readonly string[]; readonly payloadFields?: readonly string[]; readonly fields?: readonly string[]; readonly tupleFields?: readonly string[]; readonly recordFields?: readonly string[];
  readonly tagFieldNames?: readonly string[]; readonly tagFields?: readonly string[]; readonly discriminatorFields?: readonly string[]; readonly discriminants?: readonly string[];
  readonly matchArmNames?: readonly string[]; readonly matchArms?: readonly string[]; readonly arms?: readonly string[]; readonly switchCases?: readonly string[];
  readonly guardKinds?: readonly string[]; readonly guards?: readonly string[]; readonly whereClauses?: readonly string[]; readonly conditions?: readonly string[];
  readonly destructuringKinds?: readonly string[]; readonly destructuring?: readonly string[]; readonly bindingPatterns?: readonly string[]; readonly deconstruction?: readonly string[];
  readonly exhaustivenessKinds?: readonly string[]; readonly exhaustiveness?: readonly string[]; readonly coverageKinds?: readonly string[];
  readonly fallbackKinds?: readonly string[]; readonly fallbacks?: readonly string[]; readonly defaultCases?: readonly string[]; readonly wildcards?: readonly string[];
  readonly genericParameterNames?: readonly string[]; readonly typeParameters?: readonly string[]; readonly genericParameters?: readonly string[];
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export interface UniversalAdtPatternRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly adtKind?: string; readonly patternKind?: string;
  readonly variantNames: readonly string[]; readonly constructorNames: readonly string[]; readonly payloadFieldNames: readonly string[]; readonly tagFieldNames: readonly string[];
  readonly matchArmNames: readonly string[]; readonly guardKinds: readonly string[]; readonly destructuringKinds: readonly string[]; readonly exhaustivenessKinds: readonly string[];
  readonly fallbackKinds: readonly string[]; readonly genericParameterNames: readonly string[]; readonly constraintKinds: readonly string[];
  readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalAdtPatternConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceAdtPatternIds: readonly string[]; readonly targetAdtPatternIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalAdtPatternConstraintEvidence {
  readonly kind: 'frontier.lang.universalAdtPatternConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalAdtPatternConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalAdtPatternConstraintStatus; readonly action: UniversalAdtPatternConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalAdtPatternRecord[]; readonly targetRecords: readonly UniversalAdtPatternRecord[];
  readonly adtPatternConstraints: readonly UniversalAdtPatternConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly adtEquivalenceClaim: false; readonly patternExhaustivenessClaim: false; readonly variantPayloadEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalAdtPatternConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[]; readonly adts?: readonly UniversalAdtPatternRecordInput[]; readonly sourceAdts?: readonly UniversalAdtPatternRecordInput[]; readonly targetAdts?: readonly UniversalAdtPatternRecordInput[];
  readonly adtPatternRecords?: readonly UniversalAdtPatternRecordInput[]; readonly sourceAdtPatternRecords?: readonly UniversalAdtPatternRecordInput[]; readonly targetAdtPatternRecords?: readonly UniversalAdtPatternRecordInput[];
  readonly patternMatches?: readonly UniversalAdtPatternRecordInput[]; readonly sourcePatternMatches?: readonly UniversalAdtPatternRecordInput[]; readonly targetPatternMatches?: readonly UniversalAdtPatternRecordInput[];
  readonly adtPatternConstraints?: readonly UniversalAdtPatternRecordInput[]; readonly sourceAdtPatternConstraints?: readonly UniversalAdtPatternRecordInput[]; readonly targetAdtPatternConstraints?: readonly UniversalAdtPatternRecordInput[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalAdtPatternConstraintQuery {
  readonly adtPatternConstraintStatus?: UniversalAdtPatternConstraintStatus | string | readonly string[];
  readonly adtPatternConstraintAction?: UniversalAdtPatternConstraintAction | string | readonly string[];
  readonly adtPatternConstraintRequiredKind?: string | readonly string[]; readonly adtPatternConstraintRepresentedKind?: string | readonly string[];
  readonly adtPatternConstraintMissingKind?: string | readonly string[]; readonly adtPatternConstraintMissingEvidence?: string | readonly string[]; readonly adtPatternConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalAdtPatternConstraintStatuses: readonly UniversalAdtPatternConstraintStatus[];
export declare function createUniversalAdtPatternConstraintEvidence(input?: UniversalAdtPatternConstraintInput): UniversalAdtPatternConstraintEvidence;
export declare function adtPatternConstraintMatches(evidence?: Partial<UniversalAdtPatternConstraintEvidence>, query?: UniversalAdtPatternConstraintQuery): boolean;
