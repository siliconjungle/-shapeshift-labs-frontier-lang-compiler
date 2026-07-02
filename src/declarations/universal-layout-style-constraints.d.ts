import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalLayoutStyleConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalLayoutStyleConstraintAction = 'skip' | 'attach-layout-style-record' | 'review-layout-style-loss' | 'collect-layout-style-evidence' | 'reject';

export interface UniversalLayoutStyleRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly selector?: string;
  readonly styleProperty?: string;
  readonly cssProperty?: string;
  readonly property?: string;
  readonly value?: string;
  readonly computedValue?: string;
  readonly cascadeLayer?: string;
  readonly specificity?: string | number;
  readonly mediaQuery?: string;
  readonly containerQuery?: string;
  readonly boxModel?: string;
  readonly layoutKind?: string;
  readonly display?: string;
  readonly position?: string;
  readonly zIndex?: string | number;
  readonly writingMode?: string;
  readonly direction?: string;
  readonly viewport?: string;
  readonly renderTreeId?: string;
  readonly styleRuleId?: string;
  readonly computedStyleHash?: string;
  readonly layoutSnapshotHash?: string;
  readonly bitmapHash?: string;
  readonly accessibilityTreeHash?: string;
  readonly focusOrderHash?: string;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly sourceMapId?: string;
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingId?: string;
  readonly sourceMapMappingIds?: readonly string[];
  readonly proofObligationId?: string;
  readonly proofObligationIds?: readonly string[];
  readonly proofEvidenceId?: string;
  readonly proofEvidenceIds?: readonly string[];
  readonly evidenceId?: string;
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly failClosed?: boolean;
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalLayoutStyleConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly kind?: string;
  readonly selector?: string;
  readonly styleProperty?: string;
  readonly value?: string;
  readonly computedValue?: string;
  readonly cascadeLayer?: string;
  readonly specificity?: string | number;
  readonly mediaQuery?: string;
  readonly containerQuery?: string;
  readonly boxModel?: string;
  readonly layoutKind?: string;
  readonly display?: string;
  readonly position?: string;
  readonly zIndex?: string | number;
  readonly writingMode?: string;
  readonly direction?: string;
  readonly viewport?: string;
  readonly renderTreeId?: string;
  readonly styleRuleId?: string;
  readonly computedStyleHash?: string;
  readonly layoutSnapshotHash?: string;
  readonly bitmapHash?: string;
  readonly accessibilityTreeHash?: string;
  readonly focusOrderHash?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly proofObligationIds: readonly string[];
  readonly proofEvidenceIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly failClosed: boolean;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalLayoutStyleConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceLayoutStyleIds: readonly string[];
  readonly targetLayoutStyleIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalLayoutStyleConstraintEvidence {
  readonly kind: 'frontier.lang.universalLayoutStyleConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalLayoutStyleConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalLayoutStyleConstraintStatus;
  readonly action: UniversalLayoutStyleConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceLayoutStyleRecords: readonly UniversalLayoutStyleConstraintRecord[];
  readonly targetLayoutStyleRecords: readonly UniversalLayoutStyleConstraintRecord[];
  readonly layoutStyleConstraints: readonly UniversalLayoutStyleConstraintLoss[];
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly proofObligationIds: readonly string[];
  readonly proofEvidenceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly failClosed: boolean;
  readonly claims: {
    readonly layoutStyleEquivalenceClaim: false;
    readonly computedStyleEquivalenceClaim: false;
    readonly renderEquivalenceClaim: false;
    readonly layoutEquivalenceClaim: false;
    readonly styleEquivalenceClaim: false;
    readonly visualEquivalenceClaim: false;
    readonly browserEquivalenceClaim: false;
    readonly browserRuntimeEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalLayoutStyleConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly layoutStyleRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly styleRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly layoutRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly cssRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly renderRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly sourceLayoutStyleRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly targetLayoutStyleRecords?: readonly UniversalLayoutStyleRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
  readonly proofObligationIds?: readonly string[];
  readonly proofEvidenceIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly failClosed?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalLayoutStyleConstraintQuery {
  readonly layoutStyleConstraintStatus?: UniversalLayoutStyleConstraintStatus | string | readonly string[];
  readonly layoutStyleConstraintAction?: UniversalLayoutStyleConstraintAction | string | readonly string[];
  readonly layoutStyleConstraintRequiredKind?: string | readonly string[];
  readonly layoutStyleConstraintRepresentedKind?: string | readonly string[];
  readonly layoutStyleConstraintMissingKind?: string | readonly string[];
  readonly layoutStyleConstraintMissingEvidence?: string | readonly string[];
  readonly layoutStyleConstraintEvidenceId?: string | readonly string[];
  readonly layoutStyleConstraintSourceMapId?: string | readonly string[];
  readonly layoutStyleConstraintProofObligationId?: string | readonly string[];
  readonly layoutStyleConstraintProofEvidenceId?: string | readonly string[];
}

export declare const UniversalLayoutStyleConstraintStatuses: readonly UniversalLayoutStyleConstraintStatus[];
export declare function createUniversalLayoutStyleConstraintEvidence(input?: UniversalLayoutStyleConstraintInput): UniversalLayoutStyleConstraintEvidence;
export declare function layoutStyleConstraintMatches(evidence?: Partial<UniversalLayoutStyleConstraintEvidence>, query?: UniversalLayoutStyleConstraintQuery): boolean;
