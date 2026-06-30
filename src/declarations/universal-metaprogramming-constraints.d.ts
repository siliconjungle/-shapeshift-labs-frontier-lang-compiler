import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalMetaprogrammingConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalMetaprogrammingConstraintAction = 'skip' | 'attach-metaprogramming-record' | 'review-metaprogramming-loss' | 'collect-metaprogramming-evidence' | 'reject';

export interface UniversalMetaprogrammingRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly kind?: string;
  readonly expansionKind?: string;
  readonly macroKind?: string;
  readonly templateKind?: string;
  readonly decoratorKind?: string;
  readonly generatorKind?: string;
  readonly predicate?: string;
  readonly capability?: string;
  readonly symbolId?: string;
  readonly nodeId?: string;
  readonly expansionId?: string;
  readonly generatorId?: string;
  readonly generatedSourcePath?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly expandedHash?: string;
  readonly generatedHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly kind?: string; readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalMetaprogrammingConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly expansionKind?: string;
  readonly symbolId?: string;
  readonly expansionId?: string;
  readonly generatorId?: string;
  readonly generatedSourcePath?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly expandedHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalMetaprogrammingConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceMetaprogrammingIds: readonly string[];
  readonly targetMetaprogrammingIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalMetaprogrammingConstraintEvidence {
  readonly kind: 'frontier.lang.universalMetaprogrammingConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalMetaprogrammingConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalMetaprogrammingConstraintStatus;
  readonly action: UniversalMetaprogrammingConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceMetaprogrammingRecords: readonly UniversalMetaprogrammingConstraintRecord[];
  readonly targetMetaprogrammingRecords: readonly UniversalMetaprogrammingConstraintRecord[];
  readonly metaprogrammingConstraints: readonly UniversalMetaprogrammingConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly expansionEquivalenceClaim: false;
    readonly macroHygieneClaim: false;
    readonly generatedSourceEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalMetaprogrammingConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly metaprogrammingRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly sourceMetaprogrammingRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly targetMetaprogrammingRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly expansionRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly macroRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly decoratorRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly templateRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly codegenRecords?: readonly UniversalMetaprogrammingRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalMetaprogrammingConstraintQuery {
  readonly metaprogrammingConstraintStatus?: UniversalMetaprogrammingConstraintStatus | string | readonly string[];
  readonly metaprogrammingConstraintAction?: UniversalMetaprogrammingConstraintAction | string | readonly string[];
  readonly metaprogrammingConstraintRequiredKind?: string | readonly string[];
  readonly metaprogrammingConstraintRepresentedKind?: string | readonly string[];
  readonly metaprogrammingConstraintMissingKind?: string | readonly string[];
  readonly metaprogrammingConstraintMissingEvidence?: string | readonly string[];
  readonly metaprogrammingConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalMetaprogrammingConstraintStatuses: readonly UniversalMetaprogrammingConstraintStatus[];
export declare function createUniversalMetaprogrammingConstraintEvidence(input?: UniversalMetaprogrammingConstraintInput): UniversalMetaprogrammingConstraintEvidence;
export declare function metaprogrammingConstraintMatches(evidence?: Partial<UniversalMetaprogrammingConstraintEvidence>, query?: UniversalMetaprogrammingConstraintQuery): boolean;
