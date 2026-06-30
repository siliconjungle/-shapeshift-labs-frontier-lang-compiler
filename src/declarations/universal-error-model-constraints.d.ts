import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalErrorModelConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalErrorModelConstraintAction = 'skip' | 'attach-error-model-record' | 'review-error-model-loss' | 'collect-error-model-evidence' | 'reject';

export interface UniversalErrorModelRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly errorKind?: string;
  readonly operationKind?: string;
  readonly regionKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly errorType?: string;
  readonly exceptionType?: string;
  readonly resultType?: string;
  readonly boundaryId?: string;
  readonly catchId?: string;
  readonly handlerId?: string;
  readonly checked?: boolean;
  readonly unchecked?: boolean;
  readonly throws?: boolean;
  readonly result?: boolean;
  readonly panic?: boolean;
  readonly recoverable?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalErrorModelConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly errorKind?: string;
  readonly errorType?: string;
  readonly boundaryId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalErrorModelConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceErrorModelIds: readonly string[];
  readonly targetErrorModelIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalErrorModelConstraintEvidence {
  readonly kind: 'frontier.lang.universalErrorModelConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalErrorModelConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalErrorModelConstraintStatus;
  readonly action: UniversalErrorModelConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceErrorModelRecords: readonly UniversalErrorModelConstraintRecord[];
  readonly targetErrorModelRecords: readonly UniversalErrorModelConstraintRecord[];
  readonly errorModelConstraints: readonly UniversalErrorModelConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly errorModelEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalErrorModelConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly errorModelRecords?: readonly UniversalErrorModelRecordInput[];
  readonly exceptionRecords?: readonly UniversalErrorModelRecordInput[];
  readonly sourceErrorModelRecords?: readonly UniversalErrorModelRecordInput[];
  readonly targetErrorModelRecords?: readonly UniversalErrorModelRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalErrorModelConstraintQuery {
  readonly errorModelConstraintStatus?: UniversalErrorModelConstraintStatus | string | readonly string[];
  readonly errorModelConstraintAction?: UniversalErrorModelConstraintAction | string | readonly string[];
  readonly errorModelConstraintRequiredKind?: string | readonly string[];
  readonly errorModelConstraintRepresentedKind?: string | readonly string[];
  readonly errorModelConstraintMissingKind?: string | readonly string[];
  readonly errorModelConstraintMissingEvidence?: string | readonly string[];
  readonly errorModelConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalErrorModelConstraintStatuses: readonly UniversalErrorModelConstraintStatus[];
export declare function createUniversalErrorModelConstraintEvidence(input?: UniversalErrorModelConstraintInput): UniversalErrorModelConstraintEvidence;
export declare function errorModelConstraintMatches(evidence?: Partial<UniversalErrorModelConstraintEvidence>, query?: UniversalErrorModelConstraintQuery): boolean;
