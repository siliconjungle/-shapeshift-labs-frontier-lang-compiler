import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalControlFlowConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalControlFlowConstraintAction = 'skip' | 'attach-control-flow-constraint-record' | 'review-control-flow-constraint-loss' | 'collect-control-flow-constraint-evidence' | 'reject';

export interface UniversalControlFlowRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly flowKind?: string;
  readonly kind?: string;
  readonly statementKind?: string;
  readonly edgeKind?: string;
  readonly regionKind?: string;
  readonly predicate?: string;
  readonly sourceId?: string;
  readonly from?: string;
  readonly targetId?: string;
  readonly to?: string;
  readonly label?: string;
  readonly name?: string;
  readonly conditionHash?: string;
  readonly orderingKey?: string;
  readonly orderKey?: string;
  readonly async?: boolean;
  readonly generator?: boolean;
  readonly exceptional?: boolean;
  readonly cancellable?: boolean;
  readonly controlFlow?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalControlFlowConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly flowKind?: string;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly label?: string;
  readonly conditionHash?: string;
  readonly orderingKey?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalControlFlowConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceControlFlowIds: readonly string[];
  readonly targetControlFlowIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalControlFlowConstraintEvidence {
  readonly kind: 'frontier.lang.universalControlFlowConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalControlFlowConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalControlFlowConstraintStatus;
  readonly action: UniversalControlFlowConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceControlFlows: readonly UniversalControlFlowConstraintRecord[];
  readonly targetControlFlows: readonly UniversalControlFlowConstraintRecord[];
  readonly controlFlowConstraints: readonly UniversalControlFlowConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly controlFlowEquivalenceClaim: false;
    readonly exceptionEquivalenceClaim: false;
    readonly asyncOrderingClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalControlFlowConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly flows?: readonly UniversalControlFlowRecordInput[];
  readonly controlFlows?: readonly UniversalControlFlowRecordInput[];
  readonly sourceControlFlows?: readonly UniversalControlFlowRecordInput[];
  readonly targetControlFlows?: readonly UniversalControlFlowRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalControlFlowConstraintQuery {
  readonly controlFlowConstraintStatus?: UniversalControlFlowConstraintStatus | string | readonly string[];
  readonly controlFlowConstraintAction?: UniversalControlFlowConstraintAction | string | readonly string[];
  readonly controlFlowConstraintRequiredKind?: string | readonly string[];
  readonly controlFlowConstraintRepresentedKind?: string | readonly string[];
  readonly controlFlowConstraintMissingKind?: string | readonly string[];
  readonly controlFlowConstraintMissingEvidence?: string | readonly string[];
  readonly controlFlowConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalControlFlowConstraintStatuses: readonly UniversalControlFlowConstraintStatus[];
export declare function createUniversalControlFlowConstraintEvidence(input?: UniversalControlFlowConstraintInput): UniversalControlFlowConstraintEvidence;
export declare function controlFlowConstraintMatches(evidence?: Partial<UniversalControlFlowConstraintEvidence>, query?: UniversalControlFlowConstraintQuery): boolean;
