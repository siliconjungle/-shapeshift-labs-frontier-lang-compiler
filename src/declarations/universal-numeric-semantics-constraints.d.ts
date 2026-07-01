import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalNumericSemanticsConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalNumericSemanticsConstraintAction = 'skip' | 'attach-numeric-semantics-record' | 'review-numeric-semantics-loss' | 'collect-numeric-semantics-evidence' | 'reject';

export interface UniversalNumericSemanticsRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly typeName?: string; readonly numericTypeName?: string; readonly symbolId?: string;
  readonly numericKind?: string; readonly numberKind?: string; readonly kind?: string; readonly typeKind?: string; readonly valueKind?: string; readonly operator?: string; readonly predicate?: string; readonly capability?: string;
  readonly width?: string | number; readonly bitWidth?: string | number; readonly integerWidth?: string | number; readonly signed?: boolean; readonly signedness?: string;
  readonly overflowMode?: string; readonly overflowBehavior?: string; readonly divisionMode?: string; readonly integerDivisionMode?: string; readonly moduloMode?: string; readonly remainderMode?: string;
  readonly floatFormat?: string; readonly floatPrecision?: string; readonly roundingMode?: string; readonly specialValues?: readonly string[]; readonly floatSpecialValues?: readonly string[];
  readonly nan?: boolean; readonly infinity?: boolean; readonly bigint?: boolean; readonly decimal?: boolean;
  readonly coercionKinds?: readonly string[]; readonly coercions?: readonly string[]; readonly coercionKind?: string; readonly conversionKind?: string;
  readonly literalKinds?: readonly string[]; readonly literalKind?: string; readonly radix?: string | number; readonly separatorPolicy?: string;
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export interface UniversalNumericSemanticsRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly numericKind?: string;
  readonly width?: string | number; readonly signedness?: string; readonly overflowMode?: string; readonly divisionMode?: string; readonly moduloMode?: string;
  readonly floatFormat?: string; readonly roundingMode?: string; readonly specialValues: readonly string[]; readonly coercionKinds: readonly string[]; readonly literalKinds: readonly string[];
  readonly constraintKinds: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalNumericSemanticsConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceNumericSemanticsIds: readonly string[]; readonly targetNumericSemanticsIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalNumericSemanticsConstraintEvidence {
  readonly kind: 'frontier.lang.universalNumericSemanticsConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalNumericSemanticsConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalNumericSemanticsConstraintStatus; readonly action: UniversalNumericSemanticsConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalNumericSemanticsRecord[]; readonly targetRecords: readonly UniversalNumericSemanticsRecord[];
  readonly numericSemanticsConstraints: readonly UniversalNumericSemanticsConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly numericEquivalenceClaim: false; readonly arithmeticEquivalenceClaim: false; readonly floatingPointEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalNumericSemanticsConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[]; readonly numericRecords?: readonly UniversalNumericSemanticsRecordInput[]; readonly numberRecords?: readonly UniversalNumericSemanticsRecordInput[];
  readonly numericTypes?: readonly UniversalNumericSemanticsRecordInput[]; readonly numericSemanticsRecords?: readonly UniversalNumericSemanticsRecordInput[];
  readonly sourceNumericSemanticsRecords?: readonly UniversalNumericSemanticsRecordInput[]; readonly targetNumericSemanticsRecords?: readonly UniversalNumericSemanticsRecordInput[];
  readonly numericSemanticsConstraints?: readonly UniversalNumericSemanticsRecordInput[]; readonly sourceNumericSemanticsConstraints?: readonly UniversalNumericSemanticsRecordInput[];
  readonly targetNumericSemanticsConstraints?: readonly UniversalNumericSemanticsRecordInput[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalNumericSemanticsConstraintQuery {
  readonly numericSemanticsConstraintStatus?: UniversalNumericSemanticsConstraintStatus | string | readonly string[];
  readonly numericSemanticsConstraintAction?: UniversalNumericSemanticsConstraintAction | string | readonly string[];
  readonly numericSemanticsConstraintRequiredKind?: string | readonly string[];
  readonly numericSemanticsConstraintRepresentedKind?: string | readonly string[];
  readonly numericSemanticsConstraintMissingKind?: string | readonly string[];
  readonly numericSemanticsConstraintMissingEvidence?: string | readonly string[];
  readonly numericSemanticsConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalNumericSemanticsConstraintStatuses: readonly UniversalNumericSemanticsConstraintStatus[];
export declare function createUniversalNumericSemanticsConstraintEvidence(input?: UniversalNumericSemanticsConstraintInput): UniversalNumericSemanticsConstraintEvidence;
export declare function numericSemanticsConstraintMatches(evidence?: Partial<UniversalNumericSemanticsConstraintEvidence>, query?: UniversalNumericSemanticsConstraintQuery): boolean;
