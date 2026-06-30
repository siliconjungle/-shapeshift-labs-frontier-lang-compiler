import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { UniversalRuntimeCapabilityRoute } from './universal-runtime-capabilities.js';

export type UniversalHostEnvironmentConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalHostEnvironmentConstraintAction = 'skip' | 'attach-host-environment-record' | 'review-host-environment-loss' | 'collect-host-environment-evidence' | 'reject';

export interface UniversalHostEnvironmentRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly kind?: string; readonly hostKind?: string; readonly runtimeKind?: string; readonly capability?: string; readonly apiName?: string; readonly name?: string; readonly callee?: string; readonly importedName?: string; readonly globalName?: string; readonly global?: string; readonly objectName?: string; readonly permission?: string; readonly permissionKind?: string; readonly resource?: string; readonly resourceId?: string; readonly path?: string; readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly predicate?: string; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly adapterRequired?: boolean; readonly evidenceIds?: readonly string[]; readonly metadata?: { readonly factKinds?: readonly string[]; readonly [key: string]: unknown }; readonly value?: { readonly kind?: string; readonly [key: string]: unknown };
}

export interface UniversalHostEnvironmentConstraintRecord {
  readonly id: string; readonly role: string; readonly hostKind?: string; readonly capability?: string; readonly apiName?: string; readonly globalName?: string; readonly permission?: string; readonly resource?: string; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly adapterRequired: boolean; readonly constraintKinds: readonly string[]; readonly evidenceIds: readonly string[];
}

export interface UniversalHostEnvironmentConstraintLoss {
  readonly kind: string; readonly status: 'represented' | 'missing' | string; readonly sourceHostEnvironmentIds: readonly string[]; readonly targetHostEnvironmentIds: readonly string[]; readonly severity: 'warning' | 'error' | string;
}

export interface UniversalHostEnvironmentConstraintEvidence {
  readonly kind: 'frontier.lang.universalHostEnvironmentConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalHostEnvironmentConstraintEvidence.v1'; readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly status: UniversalHostEnvironmentConstraintStatus; readonly action: UniversalHostEnvironmentConstraintAction; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[]; readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceHostEnvironmentRecords: readonly UniversalHostEnvironmentConstraintRecord[]; readonly targetHostEnvironmentRecords: readonly UniversalHostEnvironmentConstraintRecord[]; readonly hostEnvironmentConstraints: readonly UniversalHostEnvironmentConstraintLoss[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly hostEquivalenceClaim: false; readonly permissionEquivalenceClaim: false; readonly environmentEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalHostEnvironmentConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string }; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string; readonly imports?: readonly Record<string, unknown>[]; readonly hostEnvironmentRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly sourceHostEnvironmentRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly targetHostEnvironmentRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly hostRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly environmentRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly capabilityRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly permissionRecords?: readonly UniversalHostEnvironmentRecordInput[]; readonly runtime?: Partial<UniversalRuntimeCapabilityRoute>; readonly routeEvidence?: readonly Record<string, unknown>[]; readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalHostEnvironmentConstraintQuery {
  readonly hostEnvironmentConstraintStatus?: UniversalHostEnvironmentConstraintStatus | string | readonly string[]; readonly hostEnvironmentConstraintAction?: UniversalHostEnvironmentConstraintAction | string | readonly string[]; readonly hostEnvironmentConstraintRequiredKind?: string | readonly string[]; readonly hostEnvironmentConstraintRepresentedKind?: string | readonly string[]; readonly hostEnvironmentConstraintMissingKind?: string | readonly string[]; readonly hostEnvironmentConstraintMissingEvidence?: string | readonly string[]; readonly hostEnvironmentConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalHostEnvironmentConstraintStatuses: readonly UniversalHostEnvironmentConstraintStatus[];
export declare function createUniversalHostEnvironmentConstraintEvidence(input?: UniversalHostEnvironmentConstraintInput): UniversalHostEnvironmentConstraintEvidence;
export declare function hostEnvironmentConstraintMatches(evidence?: Partial<UniversalHostEnvironmentConstraintEvidence>, query?: UniversalHostEnvironmentConstraintQuery): boolean;
