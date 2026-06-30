import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { UniversalRuntimeCapabilityRoute } from './universal-runtime-capabilities.js';

export type UniversalEffectConstraintStatus =
  | 'not-applicable'
  | 'satisfied'
  | 'degraded'
  | 'needs-evidence'
  | 'blocked';

export type UniversalEffectConstraintAction =
  | 'skip'
  | 'attach-effect-constraint-record'
  | 'review-effect-constraint-loss'
  | 'collect-effect-constraint-evidence'
  | 'reject';

export interface UniversalEffectRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly effectKind?: string;
  readonly capability?: string;
  readonly regionKind?: string;
  readonly symbolKind?: string;
  readonly predicate?: string;
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly target?: FrontierCompileTarget | string;
  readonly adapterRequired?: boolean;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
  readonly value?: { readonly kind?: string; readonly [key: string]: unknown };
}

export interface UniversalEffectConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly effectKind?: string;
  readonly constraintKinds: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly target?: FrontierCompileTarget | string;
  readonly adapterRequired: boolean;
  readonly evidenceIds: readonly string[];
}

export interface UniversalEffectConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceEffectIds: readonly string[];
  readonly targetEffectIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalEffectConstraintEvidence {
  readonly kind: 'frontier.lang.universalEffectConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalEffectConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalEffectConstraintStatus;
  readonly action: UniversalEffectConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceEffects: readonly UniversalEffectConstraintRecord[];
  readonly targetEffects: readonly UniversalEffectConstraintRecord[];
  readonly effectConstraints: readonly UniversalEffectConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly runtimeEquivalenceClaim: false;
    readonly effectEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalEffectConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly effects?: readonly UniversalEffectRecordInput[];
  readonly sourceEffects?: readonly UniversalEffectRecordInput[];
  readonly targetEffects?: readonly UniversalEffectRecordInput[];
  readonly runtime?: Partial<UniversalRuntimeCapabilityRoute>;
  readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalEffectConstraintQuery {
  readonly effectConstraintStatus?: UniversalEffectConstraintStatus | string | readonly string[];
  readonly effectConstraintAction?: UniversalEffectConstraintAction | string | readonly string[];
  readonly effectConstraintRequiredKind?: string | readonly string[];
  readonly effectConstraintRepresentedKind?: string | readonly string[];
  readonly effectConstraintMissingKind?: string | readonly string[];
  readonly effectConstraintMissingEvidence?: string | readonly string[];
  readonly effectConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalEffectConstraintStatuses: readonly UniversalEffectConstraintStatus[];
export declare function createUniversalEffectConstraintEvidence(input?: UniversalEffectConstraintInput): UniversalEffectConstraintEvidence;
export declare function effectConstraintMatches(evidence?: Partial<UniversalEffectConstraintEvidence>, query?: UniversalEffectConstraintQuery): boolean;
