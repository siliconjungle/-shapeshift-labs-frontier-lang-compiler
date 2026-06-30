import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalTypeConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalTypeConstraintAction = 'skip' | 'attach-type-constraint-record' | 'review-type-constraint-loss' | 'collect-type-constraint-evidence' | 'reject';

export interface UniversalTypeRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly name?: string;
  readonly symbolName?: string;
  readonly localName?: string;
  readonly symbolId?: string;
  readonly typeKind?: string;
  readonly kind?: string;
  readonly symbolKind?: string;
  readonly declarationKind?: string;
  readonly apiSurfaceKind?: string;
  readonly publicContractKind?: string;
  readonly signatureHash?: string;
  readonly contractHash?: string;
  readonly typeHash?: string;
  readonly nullable?: boolean;
  readonly optional?: boolean;
  readonly publicContract?: boolean;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly role?: string; readonly [key: string]: unknown };
}

export interface UniversalTypeConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly name?: string;
  readonly symbolId?: string;
  readonly typeKind?: string;
  readonly signatureHash?: string;
  readonly constraintKinds: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds: readonly string[];
}

export interface UniversalTypeConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceTypeIds: readonly string[];
  readonly targetTypeIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalTypeConstraintEvidence {
  readonly kind: 'frontier.lang.universalTypeConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalTypeConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalTypeConstraintStatus;
  readonly action: UniversalTypeConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceTypes: readonly UniversalTypeConstraintRecord[];
  readonly targetTypes: readonly UniversalTypeConstraintRecord[];
  readonly typeConstraints: readonly UniversalTypeConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly typeEquivalenceClaim: false;
    readonly publicApiEquivalenceClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalTypeConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly types?: readonly UniversalTypeRecordInput[];
  readonly sourceTypes?: readonly UniversalTypeRecordInput[];
  readonly targetTypes?: readonly UniversalTypeRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalTypeConstraintQuery {
  readonly typeConstraintStatus?: UniversalTypeConstraintStatus | string | readonly string[];
  readonly typeConstraintAction?: UniversalTypeConstraintAction | string | readonly string[];
  readonly typeConstraintRequiredKind?: string | readonly string[];
  readonly typeConstraintRepresentedKind?: string | readonly string[];
  readonly typeConstraintMissingKind?: string | readonly string[];
  readonly typeConstraintMissingEvidence?: string | readonly string[];
  readonly typeConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalTypeConstraintStatuses: readonly UniversalTypeConstraintStatus[];
export declare function createUniversalTypeConstraintEvidence(input?: UniversalTypeConstraintInput): UniversalTypeConstraintEvidence;
export declare function typeConstraintMatches(evidence?: Partial<UniversalTypeConstraintEvidence>, query?: UniversalTypeConstraintQuery): boolean;
