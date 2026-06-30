import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalModuleConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalModuleConstraintAction = 'skip' | 'attach-module-constraint-record' | 'review-module-constraint-loss' | 'collect-module-constraint-evidence' | 'reject';

export interface UniversalModuleRecordInput {
  readonly id?: string;
  readonly role?: 'source' | 'target' | string;
  readonly moduleKind?: string;
  readonly kind?: string;
  readonly edgeKind?: string;
  readonly importKind?: string;
  readonly exportKind?: string;
  readonly declarationKind?: string;
  readonly predicate?: string;
  readonly specifier?: string;
  readonly source?: string;
  readonly moduleSpecifier?: string;
  readonly importedName?: string;
  readonly importName?: string;
  readonly exportedName?: string;
  readonly exportName?: string;
  readonly reExportedName?: string;
  readonly reexportedName?: string;
  readonly localName?: string;
  readonly name?: string;
  readonly packageName?: string;
  readonly packageSubpath?: string;
  readonly packageExportKey?: string;
  readonly packageImportKey?: string;
  readonly packageCondition?: string;
  readonly condition?: string;
  readonly resolutionKind?: string;
  readonly moduleResolutionKind?: string;
  readonly resolvedPath?: string;
  readonly targetPath?: string;
  readonly importAttributes?: unknown;
  readonly assertions?: unknown;
  readonly constraintKinds?: readonly string[];
  readonly factKinds?: readonly string[];
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds?: readonly string[];
  readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalModuleConstraintRecord {
  readonly id: string;
  readonly role: string;
  readonly moduleKind?: string;
  readonly specifier?: string;
  readonly importedName?: string;
  readonly exportedName?: string;
  readonly localName?: string;
  readonly packageName?: string;
  readonly packageSubpath?: string;
  readonly packageCondition?: string;
  readonly resolutionKind?: string;
  readonly sourcePath?: string;
  readonly resolvedPath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly constraintKinds: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface UniversalModuleConstraintLoss {
  readonly kind: string;
  readonly status: 'represented' | 'missing' | string;
  readonly sourceModuleIds: readonly string[];
  readonly targetModuleIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalModuleConstraintEvidence {
  readonly kind: 'frontier.lang.universalModuleConstraintEvidence';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalModuleConstraintEvidence.v1';
  readonly id: string;
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalModuleConstraintStatus;
  readonly action: UniversalModuleConstraintAction;
  readonly requiredKinds: readonly string[];
  readonly representedKinds: readonly string[];
  readonly missingKinds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sourceModules: readonly UniversalModuleConstraintRecord[];
  readonly targetModules: readonly UniversalModuleConstraintRecord[];
  readonly moduleConstraints: readonly UniversalModuleConstraintLoss[];
  readonly evidenceIds: readonly string[];
  readonly claims: {
    readonly moduleEquivalenceClaim: false;
    readonly linkageEquivalenceClaim: false;
    readonly packageResolutionClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalModuleConstraintInput {
  readonly id?: string;
  readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[];
  readonly modules?: readonly UniversalModuleRecordInput[];
  readonly sourceModules?: readonly UniversalModuleRecordInput[];
  readonly targetModules?: readonly UniversalModuleRecordInput[];
  readonly evidenceIds?: readonly string[];
  readonly missingEvidence?: readonly string[];
  readonly blockers?: readonly string[];
  readonly review?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalModuleConstraintQuery {
  readonly moduleConstraintStatus?: UniversalModuleConstraintStatus | string | readonly string[];
  readonly moduleConstraintAction?: UniversalModuleConstraintAction | string | readonly string[];
  readonly moduleConstraintRequiredKind?: string | readonly string[];
  readonly moduleConstraintRepresentedKind?: string | readonly string[];
  readonly moduleConstraintMissingKind?: string | readonly string[];
  readonly moduleConstraintMissingEvidence?: string | readonly string[];
  readonly moduleConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalModuleConstraintStatuses: readonly UniversalModuleConstraintStatus[];
export declare function createUniversalModuleConstraintEvidence(input?: UniversalModuleConstraintInput): UniversalModuleConstraintEvidence;
export declare function moduleConstraintMatches(evidence?: Partial<UniversalModuleConstraintEvidence>, query?: UniversalModuleConstraintQuery): boolean;
