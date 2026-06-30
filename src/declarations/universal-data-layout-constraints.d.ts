import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalDataLayoutConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalDataLayoutConstraintAction = 'skip' | 'attach-data-layout-record' | 'review-data-layout-loss' | 'collect-data-layout-evidence' | 'reject';

export interface UniversalDataLayoutRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly layoutKind?: string;
  readonly representationKind?: string;
  readonly abiKind?: string;
  readonly callingConvention?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly typeId?: string;
  readonly symbolId?: string;
  readonly nodeId?: string;
  readonly structId?: string;
  readonly unionId?: string;
  readonly enumId?: string;
  readonly fieldId?: string;
  readonly bitfieldId?: string;
  readonly sizeBytes?: number;
  readonly alignmentBytes?: number;
  readonly offsetBytes?: number;
  readonly endian?: string;
  readonly endianness?: string;
  readonly pointerWidth?: number | string;
  readonly integerWidth?: number | string;
  readonly floatFormat?: string;
  readonly repr?: string;
  readonly reprAttribute?: string;
  readonly packed?: boolean;
  readonly fieldOrder?: boolean | readonly string[];
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalDataLayoutConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly layoutKind?: string;
  readonly abiKind?: string;
  readonly typeId?: string;
  readonly structId?: string;
  readonly unionId?: string;
  readonly enumId?: string;
  readonly fieldId?: string;
  readonly bitfieldId?: string;
  readonly sizeBytes?: number;
  readonly alignmentBytes?: number;
  readonly offsetBytes?: number;
  readonly endian?: string;
  readonly pointerWidth?: number | string;
  readonly integerWidth?: number | string;
  readonly floatFormat?: string;
  readonly repr?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalDataLayoutConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceDataLayoutIds: readonly string[];
  readonly targetDataLayoutIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalDataLayoutConstraintEvidence {
  readonly kind: 'frontier.lang.universalDataLayoutConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalDataLayoutConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalDataLayoutConstraintStatus;
  readonly action: UniversalDataLayoutConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceDataLayoutRecords: readonly UniversalDataLayoutConstraintRecord[];
  readonly targetDataLayoutRecords: readonly UniversalDataLayoutConstraintRecord[];
  readonly dataLayoutConstraints: readonly UniversalDataLayoutConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly dataLayoutEquivalenceClaim: false;
    readonly abiEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDataLayoutConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly dataLayoutRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly layoutRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly abiRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly representationRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly sourceDataLayoutRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly targetDataLayoutRecords?: readonly UniversalDataLayoutRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDataLayoutConstraintQuery {
  readonly dataLayoutConstraintStatus?: UniversalDataLayoutConstraintStatus | string | readonly string[];
  readonly dataLayoutConstraintAction?: UniversalDataLayoutConstraintAction | string | readonly string[];
  readonly dataLayoutConstraintRequiredKind?: string | readonly string[];
  readonly dataLayoutConstraintRepresentedKind?: string | readonly string[];
  readonly dataLayoutConstraintMissingKind?: string | readonly string[];
  readonly dataLayoutConstraintMissingEvidence?: string | readonly string[];
  readonly dataLayoutConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalDataLayoutConstraintStatuses: readonly UniversalDataLayoutConstraintStatus[];
export declare function createUniversalDataLayoutConstraintEvidence(input?: UniversalDataLayoutConstraintInput): UniversalDataLayoutConstraintEvidence;
export declare function dataLayoutConstraintMatches(evidence?: Partial<UniversalDataLayoutConstraintEvidence>, query?: UniversalDataLayoutConstraintQuery): boolean;
