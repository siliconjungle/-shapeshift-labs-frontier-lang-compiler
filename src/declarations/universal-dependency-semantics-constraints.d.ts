import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalDependencySemanticsConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalDependencySemanticsConstraintAction = 'skip' | 'attach-dependency-semantics-record' | 'review-dependency-semantics-loss' | 'collect-dependency-semantics-evidence' | 'reject';

export interface UniversalDependencySemanticsRecordInput {
  readonly id?: string; readonly kind?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly packageName?: string; readonly manifestName?: string; readonly symbolId?: string;
  readonly packageManager?: string; readonly manager?: string; readonly managerName?: string; readonly manifestSchema?: string; readonly manifestKind?: string; readonly schema?: string;
  readonly versionRange?: string; readonly range?: string; readonly resolvedVersion?: string; readonly version?: string; readonly lockfile?: string; readonly lockfilePath?: string;
  readonly integrity?: string; readonly lockfileIntegrity?: string; readonly dependencyClass?: string; readonly dependencyType?: string; readonly type?: string;
  readonly peerDependencies?: unknown; readonly peers?: unknown; readonly optionalDependencies?: unknown; readonly optional?: unknown; readonly devDependencies?: unknown; readonly dev?: unknown;
  readonly features?: unknown; readonly extras?: unknown; readonly flags?: unknown; readonly workspace?: string; readonly workspaceBoundary?: string; readonly registry?: string; readonly registrySource?: string;
  readonly source?: string; readonly sourceUrl?: string; readonly lifecycleScripts?: unknown; readonly scripts?: unknown; readonly nativeAbi?: string; readonly abi?: string;
  readonly buildTool?: string; readonly builder?: string; readonly packageManagerVersion?: string; readonly managerVersion?: string; readonly offlineCache?: string; readonly cachePolicy?: string;
  readonly dedupeHoist?: string; readonly hoistPolicy?: string; readonly provenance?: string; readonly sourceProvenance?: string; readonly trust?: string; readonly supplyChainTrust?: string;
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export type UniversalDependencySemanticsRecordInputValue = UniversalDependencySemanticsRecordInput | string | number | boolean;

export interface UniversalDependencySemanticsRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly packageManager?: string; readonly manifestSchema?: string; readonly packageName?: string;
  readonly versionRange?: string; readonly resolvedVersion?: string; readonly lockfile?: string; readonly integrity?: string; readonly dependencyClass?: string;
  readonly peerDependencies?: unknown; readonly optionalDependencies?: unknown; readonly devDependencies?: unknown; readonly features?: unknown; readonly workspace?: string;
  readonly registry?: string; readonly source?: string; readonly lifecycleScripts?: unknown; readonly nativeAbi?: string; readonly buildTool?: string; readonly packageManagerVersion?: string;
  readonly offlineCache?: string; readonly dedupeHoist?: string; readonly provenance?: string; readonly trust?: string; readonly constraintKinds: readonly string[];
  readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalDependencySemanticsConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceDependencySemanticsIds: readonly string[]; readonly targetDependencySemanticsIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalDependencySemanticsConstraintEvidence {
  readonly kind: 'frontier.lang.universalDependencySemanticsConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalDependencySemanticsConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalDependencySemanticsConstraintStatus; readonly action: UniversalDependencySemanticsConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalDependencySemanticsRecord[]; readonly targetRecords: readonly UniversalDependencySemanticsRecord[];
  readonly dependencySemanticsConstraints: readonly UniversalDependencySemanticsConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly dependencyEquivalenceClaim: false; readonly resolutionEquivalenceClaim: false; readonly lockfileEquivalenceClaim: false; readonly supplyChainEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDependencySemanticsConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string; readonly imports?: readonly Record<string, unknown>[];
  readonly dependencyRecords?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly packageRecords?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly packageManifestRecords?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly lockfileRecords?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly dependencyGraphRecords?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly packageManagerRecords?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly buildDependencyRecords?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly dependencySemanticsRecords?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly sourceDependencySemanticsRecords?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly targetDependencySemanticsRecords?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly dependencySemanticsConstraints?: readonly UniversalDependencySemanticsRecordInputValue[]; readonly sourceDependencySemanticsConstraints?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly targetDependencySemanticsConstraints?: readonly UniversalDependencySemanticsRecordInputValue[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalDependencySemanticsConstraintQuery {
  readonly dependencySemanticsConstraintStatus?: UniversalDependencySemanticsConstraintStatus | string | readonly string[];
  readonly dependencySemanticsConstraintAction?: UniversalDependencySemanticsConstraintAction | string | readonly string[];
  readonly dependencySemanticsConstraintRequiredKind?: string | readonly string[];
  readonly dependencySemanticsConstraintRepresentedKind?: string | readonly string[];
  readonly dependencySemanticsConstraintMissingKind?: string | readonly string[];
  readonly dependencySemanticsConstraintMissingEvidence?: string | readonly string[];
  readonly dependencySemanticsConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalDependencySemanticsConstraintStatuses: readonly UniversalDependencySemanticsConstraintStatus[];
export declare function createUniversalDependencySemanticsConstraintEvidence(input?: UniversalDependencySemanticsConstraintInput): UniversalDependencySemanticsConstraintEvidence;
export declare function dependencySemanticsConstraintMatches(evidence?: Partial<UniversalDependencySemanticsConstraintEvidence>, query?: UniversalDependencySemanticsConstraintQuery): boolean;
