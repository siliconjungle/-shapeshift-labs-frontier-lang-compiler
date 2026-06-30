import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalObjectModelConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalObjectModelConstraintAction = 'skip' | 'attach-object-model-record' | 'review-object-model-loss' | 'collect-object-model-evidence' | 'reject';

export interface UniversalObjectModelRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly objectKind?: string;
  readonly classKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly classId?: string;
  readonly symbolId?: string;
  readonly nodeId?: string;
  readonly prototypeId?: string;
  readonly traitId?: string;
  readonly mixinId?: string;
  readonly methodId?: string;
  readonly fieldId?: string;
  readonly constructorId?: string;
  readonly dispatchKind?: string;
  readonly inheritanceKind?: string;
  readonly receiverKind?: string;
  readonly virtual?: boolean;
  readonly staticDispatch?: boolean;
  readonly multipleInheritance?: boolean;
  readonly valueSemantics?: boolean;
  readonly referenceSemantics?: boolean;
  readonly reflection?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalObjectModelConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly objectKind?: string;
  readonly classId?: string;
  readonly prototypeId?: string;
  readonly traitId?: string;
  readonly mixinId?: string;
  readonly methodId?: string;
  readonly fieldId?: string;
  readonly constructorId?: string;
  readonly dispatchKind?: string;
  readonly inheritanceKind?: string;
  readonly receiverKind?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalObjectModelConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceObjectModelIds: readonly string[];
  readonly targetObjectModelIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalObjectModelConstraintEvidence {
  readonly kind: 'frontier.lang.universalObjectModelConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalObjectModelConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalObjectModelConstraintStatus;
  readonly action: UniversalObjectModelConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceObjectModelRecords: readonly UniversalObjectModelConstraintRecord[];
  readonly targetObjectModelRecords: readonly UniversalObjectModelConstraintRecord[];
  readonly objectModelConstraints: readonly UniversalObjectModelConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly objectModelEquivalenceClaim: false;
    readonly dispatchEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalObjectModelConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly objectModelRecords?: readonly UniversalObjectModelRecordInput[];
  readonly objectRecords?: readonly UniversalObjectModelRecordInput[];
  readonly classRecords?: readonly UniversalObjectModelRecordInput[];
  readonly prototypeRecords?: readonly UniversalObjectModelRecordInput[];
  readonly sourceObjectModelRecords?: readonly UniversalObjectModelRecordInput[];
  readonly targetObjectModelRecords?: readonly UniversalObjectModelRecordInput[];
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalObjectModelConstraintQuery {
  readonly objectModelConstraintStatus?: UniversalObjectModelConstraintStatus | string | readonly string[];
  readonly objectModelConstraintAction?: UniversalObjectModelConstraintAction | string | readonly string[];
  readonly objectModelConstraintRequiredKind?: string | readonly string[];
  readonly objectModelConstraintRepresentedKind?: string | readonly string[];
  readonly objectModelConstraintMissingKind?: string | readonly string[];
  readonly objectModelConstraintMissingEvidence?: string | readonly string[];
  readonly objectModelConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalObjectModelConstraintStatuses: readonly UniversalObjectModelConstraintStatus[];
export declare function createUniversalObjectModelConstraintEvidence(input?: UniversalObjectModelConstraintInput): UniversalObjectModelConstraintEvidence;
export declare function objectModelConstraintMatches(evidence?: Partial<UniversalObjectModelConstraintEvidence>, query?: UniversalObjectModelConstraintQuery): boolean;
