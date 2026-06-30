import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalScopeBindingConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalScopeBindingConstraintAction = 'skip' | 'attach-scope-binding-record' | 'review-scope-binding-loss' | 'collect-scope-binding-evidence' | 'reject';

export interface UniversalScopeBindingRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly kind?: string; readonly bindingKind?: string; readonly scopeKind?: string; readonly referenceKind?: string; readonly scopeType?: string; readonly lookupKind?: string; readonly resolutionKind?: string; readonly scopeId?: string; readonly ownerScopeId?: string; readonly bindingId?: string; readonly externalBindingId?: string; readonly resolvedBindingId?: string; readonly declarationId?: string; readonly symbolId?: string; readonly referenceId?: string; readonly occurrenceId?: string; readonly name?: string; readonly localName?: string; readonly resolvedName?: string; readonly namespace?: string; readonly predicate?: string; readonly closure?: boolean; readonly captured?: boolean; readonly writeExpr?: boolean; readonly mutable?: boolean; readonly shadowed?: boolean; readonly hoisted?: boolean; readonly typeOnly?: boolean; readonly isTypeReference?: boolean; readonly isValueReference?: boolean; readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[]; readonly metadata?: { readonly kind?: string; readonly factKinds?: readonly string[]; readonly [key: string]: unknown };
}

export interface UniversalScopeBindingConstraintRecord {
  readonly id: string; readonly role: string; readonly bindingKind?: string; readonly scopeId?: string; readonly bindingId?: string; readonly declarationId?: string; readonly referenceId?: string; readonly name?: string; readonly namespace?: string; readonly scopeType?: string; readonly lookupKind?: string; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly constraintKinds: readonly string[]; readonly evidenceIds: readonly string[];
}

export interface UniversalScopeBindingConstraintLoss {
  readonly kind: string; readonly status: 'represented' | 'missing' | string; readonly sourceScopeBindingIds: readonly string[]; readonly targetScopeBindingIds: readonly string[]; readonly severity: 'warning' | 'error' | string;
}

export interface UniversalScopeBindingConstraintEvidence {
  readonly kind: 'frontier.lang.universalScopeBindingConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalScopeBindingConstraintEvidence.v1'; readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly status: UniversalScopeBindingConstraintStatus; readonly action: UniversalScopeBindingConstraintAction; readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[]; readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceScopeBindingRecords: readonly UniversalScopeBindingConstraintRecord[]; readonly targetScopeBindingRecords: readonly UniversalScopeBindingConstraintRecord[]; readonly scopeBindingConstraints: readonly UniversalScopeBindingConstraintLoss[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly nameResolutionEquivalenceClaim: false; readonly closureEquivalenceClaim: false; readonly scopeEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalScopeBindingConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string }; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string; readonly imports?: readonly Record<string, unknown>[]; readonly scopeBindingRecords?: readonly UniversalScopeBindingRecordInput[]; readonly sourceScopeBindingRecords?: readonly UniversalScopeBindingRecordInput[]; readonly targetScopeBindingRecords?: readonly UniversalScopeBindingRecordInput[]; readonly bindingRecords?: readonly UniversalScopeBindingRecordInput[]; readonly scopeRecords?: readonly UniversalScopeBindingRecordInput[]; readonly useDefRecords?: readonly UniversalScopeBindingRecordInput[]; readonly nameResolutionRecords?: readonly UniversalScopeBindingRecordInput[]; readonly closureRecords?: readonly UniversalScopeBindingRecordInput[]; readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalScopeBindingConstraintQuery {
  readonly scopeBindingConstraintStatus?: UniversalScopeBindingConstraintStatus | string | readonly string[]; readonly scopeBindingConstraintAction?: UniversalScopeBindingConstraintAction | string | readonly string[]; readonly scopeBindingConstraintRequiredKind?: string | readonly string[]; readonly scopeBindingConstraintRepresentedKind?: string | readonly string[]; readonly scopeBindingConstraintMissingKind?: string | readonly string[]; readonly scopeBindingConstraintMissingEvidence?: string | readonly string[]; readonly scopeBindingConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalScopeBindingConstraintStatuses: readonly UniversalScopeBindingConstraintStatus[];
export declare function createUniversalScopeBindingConstraintEvidence(input?: UniversalScopeBindingConstraintInput): UniversalScopeBindingConstraintEvidence;
export declare function scopeBindingConstraintMatches(evidence?: Partial<UniversalScopeBindingConstraintEvidence>, query?: UniversalScopeBindingConstraintQuery): boolean;
