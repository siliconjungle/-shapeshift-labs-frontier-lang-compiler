import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalTextSemanticsConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalTextSemanticsConstraintAction = 'skip' | 'attach-text-semantics-record' | 'review-text-semantics-loss' | 'collect-text-semantics-evidence' | 'reject';

export interface UniversalTextSemanticsRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly typeName?: string; readonly stringTypeName?: string; readonly symbolId?: string;
  readonly textKind?: string; readonly stringKind?: string; readonly kind?: string; readonly typeKind?: string; readonly valueKind?: string; readonly operator?: string; readonly predicate?: string; readonly capability?: string;
  readonly encoding?: string; readonly charset?: string; readonly codepage?: string; readonly codeUnit?: string | number; readonly codeUnitWidth?: string | number;
  readonly indexingUnit?: string; readonly indexUnit?: string; readonly normalizationForm?: string; readonly normalization?: string;
  readonly locale?: string; readonly localePolicy?: string; readonly collation?: string; readonly collationPolicy?: string; readonly caseMapping?: string; readonly caseFolding?: string;
  readonly regexEngine?: string; readonly regexFlavor?: string; readonly escapeMode?: string; readonly escaping?: string; readonly interpolationMode?: string; readonly interpolation?: string;
  readonly termination?: string; readonly nullTermination?: string; readonly byteBoundary?: string; readonly mutability?: string; readonly stringMutability?: string;
  readonly boundaryKinds?: readonly string[]; readonly boundaries?: readonly string[]; readonly boundaryKind?: string;
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export interface UniversalTextSemanticsRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly textKind?: string;
  readonly encoding?: string; readonly codeUnit?: string | number; readonly indexingUnit?: string; readonly normalizationForm?: string;
  readonly locale?: string; readonly collation?: string; readonly caseMapping?: string; readonly regexEngine?: string;
  readonly escapeMode?: string; readonly interpolationMode?: string; readonly termination?: string; readonly boundaryKinds: readonly string[]; readonly mutability?: string;
  readonly constraintKinds: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalTextSemanticsConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceTextSemanticsIds: readonly string[]; readonly targetTextSemanticsIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalTextSemanticsConstraintEvidence {
  readonly kind: 'frontier.lang.universalTextSemanticsConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalTextSemanticsConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalTextSemanticsConstraintStatus; readonly action: UniversalTextSemanticsConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalTextSemanticsRecord[]; readonly targetRecords: readonly UniversalTextSemanticsRecord[];
  readonly textSemanticsConstraints: readonly UniversalTextSemanticsConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly textEquivalenceClaim: false; readonly unicodeEquivalenceClaim: false; readonly regexEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalTextSemanticsConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[]; readonly textRecords?: readonly UniversalTextSemanticsRecordInput[]; readonly stringRecords?: readonly UniversalTextSemanticsRecordInput[];
  readonly stringTypes?: readonly UniversalTextSemanticsRecordInput[]; readonly textSemanticsRecords?: readonly UniversalTextSemanticsRecordInput[];
  readonly sourceTextSemanticsRecords?: readonly UniversalTextSemanticsRecordInput[]; readonly targetTextSemanticsRecords?: readonly UniversalTextSemanticsRecordInput[];
  readonly textSemanticsConstraints?: readonly UniversalTextSemanticsRecordInput[]; readonly sourceTextSemanticsConstraints?: readonly UniversalTextSemanticsRecordInput[];
  readonly targetTextSemanticsConstraints?: readonly UniversalTextSemanticsRecordInput[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalTextSemanticsConstraintQuery {
  readonly textSemanticsConstraintStatus?: UniversalTextSemanticsConstraintStatus | string | readonly string[];
  readonly textSemanticsConstraintAction?: UniversalTextSemanticsConstraintAction | string | readonly string[];
  readonly textSemanticsConstraintRequiredKind?: string | readonly string[];
  readonly textSemanticsConstraintRepresentedKind?: string | readonly string[];
  readonly textSemanticsConstraintMissingKind?: string | readonly string[];
  readonly textSemanticsConstraintMissingEvidence?: string | readonly string[];
  readonly textSemanticsConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalTextSemanticsConstraintStatuses: readonly UniversalTextSemanticsConstraintStatus[];
export declare function createUniversalTextSemanticsConstraintEvidence(input?: UniversalTextSemanticsConstraintInput): UniversalTextSemanticsConstraintEvidence;
export declare function textSemanticsConstraintMatches(evidence?: Partial<UniversalTextSemanticsConstraintEvidence>, query?: UniversalTextSemanticsConstraintQuery): boolean;
