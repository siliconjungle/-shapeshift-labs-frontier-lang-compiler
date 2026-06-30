import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalMemoryModelConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalMemoryModelConstraintAction = 'skip' | 'attach-memory-model-record' | 'review-memory-model-loss' | 'collect-memory-model-evidence' | 'reject';

export interface UniversalMemoryModelRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly memoryKind?: string;
  readonly operationKind?: string;
  readonly regionKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly resourceId?: string;
  readonly resource?: string;
  readonly ordering?: string;
  readonly memoryOrder?: string;
  readonly synchronizationKey?: string;
  readonly lockId?: string;
  readonly channelId?: string;
  readonly actorId?: string;
  readonly shared?: boolean;
  readonly atomic?: boolean;
  readonly volatile?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalMemoryModelConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly memoryKind?: string;
  readonly resourceId?: string;
  readonly ordering?: string;
  readonly synchronizationKey?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalMemoryModelConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceMemoryModelIds: readonly string[];
  readonly targetMemoryModelIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalMemoryModelConstraintEvidence {
  readonly kind: 'frontier.lang.universalMemoryModelConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalMemoryModelConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalMemoryModelConstraintStatus;
  readonly action: UniversalMemoryModelConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceMemoryModelRecords: readonly UniversalMemoryModelConstraintRecord[];
  readonly targetMemoryModelRecords: readonly UniversalMemoryModelConstraintRecord[];
  readonly memoryModelConstraints: readonly UniversalMemoryModelConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly memoryModelEquivalenceClaim: false;
    readonly dataRaceFreedomClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalMemoryModelConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly memoryModelRecords?: readonly UniversalMemoryModelRecordInput[];
  readonly concurrencyRecords?: readonly UniversalMemoryModelRecordInput[];
  readonly sourceMemoryModelRecords?: readonly UniversalMemoryModelRecordInput[];
  readonly targetMemoryModelRecords?: readonly UniversalMemoryModelRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalMemoryModelConstraintQuery {
  readonly memoryModelConstraintStatus?: UniversalMemoryModelConstraintStatus | string | readonly string[];
  readonly memoryModelConstraintAction?: UniversalMemoryModelConstraintAction | string | readonly string[];
  readonly memoryModelConstraintRequiredKind?: string | readonly string[];
  readonly memoryModelConstraintRepresentedKind?: string | readonly string[];
  readonly memoryModelConstraintMissingKind?: string | readonly string[];
  readonly memoryModelConstraintMissingEvidence?: string | readonly string[];
  readonly memoryModelConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalMemoryModelConstraintStatuses: readonly UniversalMemoryModelConstraintStatus[];
export declare function createUniversalMemoryModelConstraintEvidence(input?: UniversalMemoryModelConstraintInput): UniversalMemoryModelConstraintEvidence;
export declare function memoryModelConstraintMatches(evidence?: Partial<UniversalMemoryModelConstraintEvidence>, query?: UniversalMemoryModelConstraintQuery): boolean;
