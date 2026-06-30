import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalEvaluationModelConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalEvaluationModelConstraintAction = 'skip' | 'attach-evaluation-model-record' | 'review-evaluation-model-loss' | 'collect-evaluation-model-evidence' | 'reject';

export interface UniversalEvaluationModelRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly evaluationKind?: string;
  readonly expressionKind?: string;
  readonly operationKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly expressionId?: string;
  readonly nodeId?: string;
  readonly symbolId?: string;
  readonly operator?: string;
  readonly valueKind?: string;
  readonly typeKind?: string;
  readonly evaluationOrder?: string;
  readonly order?: string;
  readonly coercionKind?: string;
  readonly conversionKind?: string;
  readonly shortCircuit?: boolean;
  readonly lazy?: boolean;
  readonly eager?: boolean;
  readonly truthy?: boolean;
  readonly coerces?: boolean;
  readonly operatorOverload?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalEvaluationModelConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly evaluationKind?: string;
  readonly expressionId?: string;
  readonly operator?: string;
  readonly valueKind?: string;
  readonly evaluationOrder?: string;
  readonly coercionKind?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalEvaluationModelConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceEvaluationModelIds: readonly string[];
  readonly targetEvaluationModelIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalEvaluationModelConstraintEvidence {
  readonly kind: 'frontier.lang.universalEvaluationModelConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalEvaluationModelConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalEvaluationModelConstraintStatus;
  readonly action: UniversalEvaluationModelConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceEvaluationModelRecords: readonly UniversalEvaluationModelConstraintRecord[];
  readonly targetEvaluationModelRecords: readonly UniversalEvaluationModelConstraintRecord[];
  readonly evaluationModelConstraints: readonly UniversalEvaluationModelConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly evaluationModelEquivalenceClaim: false;
    readonly valueSemanticsEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalEvaluationModelConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly evaluationModelRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly evaluationRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly expressionRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly operatorRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly sourceEvaluationModelRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly targetEvaluationModelRecords?: readonly UniversalEvaluationModelRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalEvaluationModelConstraintQuery {
  readonly evaluationModelConstraintStatus?: UniversalEvaluationModelConstraintStatus | string | readonly string[];
  readonly evaluationModelConstraintAction?: UniversalEvaluationModelConstraintAction | string | readonly string[];
  readonly evaluationModelConstraintRequiredKind?: string | readonly string[];
  readonly evaluationModelConstraintRepresentedKind?: string | readonly string[];
  readonly evaluationModelConstraintMissingKind?: string | readonly string[];
  readonly evaluationModelConstraintMissingEvidence?: string | readonly string[];
  readonly evaluationModelConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalEvaluationModelConstraintStatuses: readonly UniversalEvaluationModelConstraintStatus[];
export declare function createUniversalEvaluationModelConstraintEvidence(input?: UniversalEvaluationModelConstraintInput): UniversalEvaluationModelConstraintEvidence;
export declare function evaluationModelConstraintMatches(evidence?: Partial<UniversalEvaluationModelConstraintEvidence>, query?: UniversalEvaluationModelConstraintQuery): boolean;
