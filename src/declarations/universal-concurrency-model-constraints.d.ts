import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalConcurrencyModelConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalConcurrencyModelConstraintAction = 'skip' | 'attach-concurrency-model-record' | 'review-concurrency-model-loss' | 'collect-concurrency-model-evidence' | 'reject';

export interface UniversalConcurrencyModelRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly concurrencyKind?: string;
  readonly operationKind?: string;
  readonly regionKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly constructId?: string;
  readonly taskId?: string;
  readonly threadId?: string;
  readonly actorId?: string;
  readonly channelId?: string;
  readonly executorId?: string;
  readonly scheduler?: string;
  readonly executor?: string;
  readonly queue?: string;
  readonly runtime?: string;
  readonly isolationKey?: string;
  readonly cancellationKey?: string;
  readonly signalId?: string;
  readonly contextId?: string;
  readonly async?: boolean;
  readonly await?: boolean;
  readonly spawn?: boolean;
  readonly structured?: boolean;
  readonly cancelable?: boolean;
  readonly reentrant?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalConcurrencyModelConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly concurrencyKind?: string;
  readonly constructId?: string;
  readonly scheduler?: string;
  readonly isolationKey?: string;
  readonly cancellationKey?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalConcurrencyModelConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceConcurrencyModelIds: readonly string[];
  readonly targetConcurrencyModelIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalConcurrencyModelConstraintEvidence {
  readonly kind: 'frontier.lang.universalConcurrencyModelConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalConcurrencyModelConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalConcurrencyModelConstraintStatus;
  readonly action: UniversalConcurrencyModelConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceConcurrencyModelRecords: readonly UniversalConcurrencyModelConstraintRecord[];
  readonly targetConcurrencyModelRecords: readonly UniversalConcurrencyModelConstraintRecord[];
  readonly concurrencyModelConstraints: readonly UniversalConcurrencyModelConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly concurrencyModelEquivalenceClaim: false;
    readonly schedulerEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalConcurrencyModelConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly concurrencyModelRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly concurrencyRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly asyncRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly taskRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly sourceConcurrencyModelRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly targetConcurrencyModelRecords?: readonly UniversalConcurrencyModelRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalConcurrencyModelConstraintQuery {
  readonly concurrencyModelConstraintStatus?: UniversalConcurrencyModelConstraintStatus | string | readonly string[];
  readonly concurrencyModelConstraintAction?: UniversalConcurrencyModelConstraintAction | string | readonly string[];
  readonly concurrencyModelConstraintRequiredKind?: string | readonly string[];
  readonly concurrencyModelConstraintRepresentedKind?: string | readonly string[];
  readonly concurrencyModelConstraintMissingKind?: string | readonly string[];
  readonly concurrencyModelConstraintMissingEvidence?: string | readonly string[];
  readonly concurrencyModelConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalConcurrencyModelConstraintStatuses: readonly UniversalConcurrencyModelConstraintStatus[];
export declare function createUniversalConcurrencyModelConstraintEvidence(input?: UniversalConcurrencyModelConstraintInput): UniversalConcurrencyModelConstraintEvidence;
export declare function concurrencyModelConstraintMatches(evidence?: Partial<UniversalConcurrencyModelConstraintEvidence>, query?: UniversalConcurrencyModelConstraintQuery): boolean;
