import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';

export type UniversalCollectionSemanticsConstraintStatus = 'not-applicable' | 'satisfied' | 'degraded' | 'needs-evidence' | 'blocked';
export type UniversalCollectionSemanticsConstraintAction = 'skip' | 'attach-collection-semantics-record' | 'review-collection-semantics-loss' | 'collect-collection-semantics-evidence' | 'reject';

export interface UniversalCollectionSemanticsRecordInput {
  readonly id?: string; readonly role?: 'source' | 'target' | string; readonly name?: string; readonly symbolName?: string; readonly typeName?: string; readonly collectionTypeName?: string; readonly symbolId?: string;
  readonly collectionKind?: string; readonly containerKind?: string; readonly kind?: string; readonly typeKind?: string; readonly valueKind?: string; readonly operator?: string; readonly predicate?: string; readonly capability?: string;
  readonly elementKind?: string; readonly elementType?: string; readonly keyKind?: string; readonly keyType?: string; readonly valueType?: string; readonly ordering?: string; readonly orderKind?: string;
  readonly iterationOrder?: string; readonly traversalOrder?: string; readonly duplicatePolicy?: string; readonly duplicates?: string; readonly equality?: string; readonly equalitySemantics?: string;
  readonly hash?: string; readonly hashSemantics?: string; readonly comparator?: string; readonly comparison?: string; readonly indexBase?: string | number; readonly boundsBehavior?: string; readonly bounds?: string;
  readonly lengthSemantics?: string; readonly sizeSemantics?: string; readonly sparseSemantics?: string; readonly holes?: string; readonly mutability?: string; readonly collectionMutability?: string;
  readonly persistence?: string | boolean; readonly persistent?: string | boolean; readonly copyOnWrite?: string | boolean; readonly cow?: string | boolean; readonly iteratorInvalidation?: string; readonly invalidation?: string;
  readonly traversal?: string; readonly laziness?: string; readonly capacityGrowth?: string; readonly growth?: string; readonly concurrency?: string; readonly threadSafety?: string;
  readonly constraintKinds?: readonly string[]; readonly factKinds?: readonly string[]; readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown> & { readonly factKinds?: readonly string[] };
}

export interface UniversalCollectionSemanticsRecord {
  readonly id: string; readonly role: string; readonly name?: string; readonly symbolId?: string; readonly collectionKind?: string;
  readonly elementKind?: string; readonly keyKind?: string; readonly valueKind?: string; readonly ordering?: string; readonly iterationOrder?: string; readonly duplicatePolicy?: string;
  readonly equality?: string; readonly hash?: string; readonly comparator?: string; readonly indexBase?: string | number; readonly boundsBehavior?: string; readonly lengthSemantics?: string;
  readonly sparseSemantics?: string; readonly mutability?: string; readonly persistence?: string | boolean; readonly copyOnWrite?: string | boolean; readonly iteratorInvalidation?: string;
  readonly traversal?: string; readonly capacityGrowth?: string; readonly concurrency?: string; readonly constraintKinds: readonly string[];
  readonly sourcePath?: string; readonly sourceHash?: string; readonly sourceSpan?: SourceSpan; readonly evidenceIds: readonly string[];
}

export interface UniversalCollectionSemanticsConstraintRecord {
  readonly kind: string; readonly status: 'represented' | 'missing' | string;
  readonly sourceCollectionSemanticsIds: readonly string[]; readonly targetCollectionSemanticsIds: readonly string[];
  readonly severity: 'warning' | 'error' | string;
}

export interface UniversalCollectionSemanticsConstraintEvidence {
  readonly kind: 'frontier.lang.universalCollectionSemanticsConstraintEvidence'; readonly version: 1; readonly schema: 'frontier.lang.universalCollectionSemanticsConstraintEvidence.v1';
  readonly id: string; readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string;
  readonly status: UniversalCollectionSemanticsConstraintStatus; readonly action: UniversalCollectionSemanticsConstraintAction;
  readonly requiredKinds: readonly string[]; readonly representedKinds: readonly string[]; readonly missingKinds: readonly string[]; readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[]; readonly review: readonly string[]; readonly sourceRecords: readonly UniversalCollectionSemanticsRecord[]; readonly targetRecords: readonly UniversalCollectionSemanticsRecord[];
  readonly collectionSemanticsConstraints: readonly UniversalCollectionSemanticsConstraintRecord[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly collectionEquivalenceClaim: false; readonly orderingEquivalenceClaim: false; readonly lookupEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly autoMergeClaim: false };
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalCollectionSemanticsConstraintInput {
  readonly id?: string; readonly route?: { readonly id?: string; readonly sourceLanguage?: string; readonly target?: string; readonly mode?: string };
  readonly routeId?: string; readonly sourceLanguage?: FrontierSourceLanguage | string; readonly target?: FrontierCompileTarget | string; readonly mode?: string;
  readonly imports?: readonly Record<string, unknown>[]; readonly collectionRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly containerRecords?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly arrayRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly mapRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly setRecords?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly iteratorRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly sequenceRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly collectionSemanticsRecords?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly sourceCollectionSemanticsRecords?: readonly UniversalCollectionSemanticsRecordInput[]; readonly targetCollectionSemanticsRecords?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly collectionSemanticsConstraints?: readonly UniversalCollectionSemanticsRecordInput[]; readonly sourceCollectionSemanticsConstraints?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly targetCollectionSemanticsConstraints?: readonly UniversalCollectionSemanticsRecordInput[];
  readonly evidenceIds?: readonly string[]; readonly missingEvidence?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[]; readonly metadata?: Record<string, unknown>;
}

export interface UniversalCollectionSemanticsConstraintQuery {
  readonly collectionSemanticsConstraintStatus?: UniversalCollectionSemanticsConstraintStatus | string | readonly string[];
  readonly collectionSemanticsConstraintAction?: UniversalCollectionSemanticsConstraintAction | string | readonly string[];
  readonly collectionSemanticsConstraintRequiredKind?: string | readonly string[];
  readonly collectionSemanticsConstraintRepresentedKind?: string | readonly string[];
  readonly collectionSemanticsConstraintMissingKind?: string | readonly string[];
  readonly collectionSemanticsConstraintMissingEvidence?: string | readonly string[];
  readonly collectionSemanticsConstraintEvidenceId?: string | readonly string[];
}

export declare const UniversalCollectionSemanticsConstraintStatuses: readonly UniversalCollectionSemanticsConstraintStatus[];
export declare function createUniversalCollectionSemanticsConstraintEvidence(input?: UniversalCollectionSemanticsConstraintInput): UniversalCollectionSemanticsConstraintEvidence;
export declare function collectionSemanticsConstraintMatches(evidence?: Partial<UniversalCollectionSemanticsConstraintEvidence>, query?: UniversalCollectionSemanticsConstraintQuery): boolean;
