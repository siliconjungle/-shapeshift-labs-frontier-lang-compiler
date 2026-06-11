import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';

export type SemanticPatchBundleOverlapKind =
  | 'operation-content'
  | 'edit-content'
  | 'semantic-edit-key'
  | 'semantic-identity'
  | 'source-identity'
  | 'semantic-edit-replay'
  | 'replay-output'
  | 'replay-current'
  | 'transform-content'
  | 'semantic-transform'
  | 'projection-identity'
  | 'region'
  | 'conflict-key'
  | 'source-path'
  | string;

export type SemanticPatchBundleOverlapStatus =
  | 'duplicate'
  | 'semantic-overlap'
  | 'source-overlap'
  | 'independent'
  | string;

export interface SemanticPatchBundleOverlapShared {
  readonly operationContentHashes: readonly string[];
  readonly editContentHashes: readonly string[];
  readonly semanticEditKeys: readonly string[];
  readonly semanticIdentityHashes: readonly string[];
  readonly sourceIdentityHashes: readonly string[];
  readonly semanticEditReplayIds: readonly string[];
  readonly semanticEditReplayStatuses: readonly string[];
  readonly semanticEditReplayActions: readonly string[];
  readonly semanticEditReplayCurrentHashes: readonly string[];
  readonly semanticEditReplayOutputHashes: readonly string[];
  readonly semanticTransformContentHashes: readonly string[];
  readonly semanticTransformIdentityHashes: readonly string[];
  readonly projectionIdentityHashes: readonly string[];
  readonly regionKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly baseHashes: readonly string[];
  readonly targetHashes: readonly string[];
}

export interface SemanticPatchBundleOverlapAdmission {
  readonly status: SemanticPatchBundleOverlapStatus;
  readonly reviewRequired: boolean;
  readonly autoMergeClaim: false;
  readonly reasonCodes: readonly string[];
  readonly sharedKeyCount: number;
}

export interface SemanticPatchBundleOverlapRecord {
  readonly kind: 'frontier.lang.semanticPatchBundleOverlapRecord';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticPatchBundleOverlapRecord.v1';
  readonly id: string;
  readonly leftBundleId: string;
  readonly rightBundleId: string;
  readonly overlapKinds: readonly SemanticPatchBundleOverlapKind[];
  readonly shared: SemanticPatchBundleOverlapShared;
  readonly admission: SemanticPatchBundleOverlapAdmission;
  readonly score: number;
  readonly summary: {
    readonly sharedKeys: number;
    readonly duplicateSignals: number;
    readonly semanticSignals: number;
    readonly sourceSignals: number;
    readonly baseHashMismatch: boolean;
    readonly targetHashMismatch: boolean;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface CompareSemanticPatchBundleRecordsOptions {
  readonly id?: string;
  readonly includeSourcePaths?: boolean;
  readonly reviewIndependent?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticPatchBundleOverlapQuery {
  readonly includeIndependent?: boolean;
  readonly includeSourcePaths?: boolean;
  readonly reviewIndependent?: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly id?: string | readonly string[];
  readonly ids?: readonly string[];
  readonly bundleId?: string | readonly string[];
  readonly bundleIds?: readonly string[];
  readonly status?: SemanticPatchBundleOverlapStatus | readonly string[];
  readonly statuses?: readonly string[];
  readonly admissionStatus?: SemanticPatchBundleOverlapStatus | readonly string[];
  readonly admissionStatuses?: readonly string[];
  readonly overlapKind?: SemanticPatchBundleOverlapKind | readonly string[];
  readonly overlapKinds?: readonly string[];
  readonly reasonCode?: string | readonly string[];
  readonly reasonCodes?: readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly sourcePaths?: readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly conflictKeys?: readonly string[];
  readonly semanticEditKey?: string | readonly string[];
  readonly semanticEditKeys?: readonly string[];
  readonly semanticEditReplayId?: string | readonly string[];
  readonly semanticEditReplayIds?: readonly string[];
  readonly semanticEditReplayStatus?: string | readonly string[];
  readonly semanticEditReplayStatuses?: readonly string[];
  readonly semanticEditReplayAction?: string | readonly string[];
  readonly semanticEditReplayActions?: readonly string[];
  readonly semanticEditReplayCurrentHash?: string | readonly string[];
  readonly semanticEditReplayCurrentHashes?: readonly string[];
  readonly semanticEditReplayOutputHash?: string | readonly string[];
  readonly semanticEditReplayOutputHashes?: readonly string[];
  readonly semanticTransformIdentityHash?: string | readonly string[];
  readonly semanticTransformIdentityHashes?: readonly string[];
  readonly semanticTransformContentHash?: string | readonly string[];
  readonly semanticTransformContentHashes?: readonly string[];
  readonly projectionIdentityHash?: string | readonly string[];
  readonly projectionIdentityHashes?: readonly string[];
  readonly operationContentHash?: string | readonly string[];
  readonly operationContentHashes?: readonly string[];
  readonly editContentHash?: string | readonly string[];
  readonly editContentHashes?: readonly string[];
  readonly reviewRequired?: boolean;
  readonly minScore?: number;
}

export declare const SemanticPatchBundleOverlapKinds: readonly SemanticPatchBundleOverlapKind[];
export declare const SemanticPatchBundleOverlapStatuses: readonly SemanticPatchBundleOverlapStatus[];
export declare function compareSemanticPatchBundleRecords(
  left?: SemanticPatchBundleRecord | Record<string, unknown>,
  right?: SemanticPatchBundleRecord | Record<string, unknown>,
  options?: CompareSemanticPatchBundleRecordsOptions
): SemanticPatchBundleOverlapRecord;
export declare function querySemanticPatchBundleOverlaps(
  records: SemanticPatchBundleRecord | readonly SemanticPatchBundleRecord[],
  query?: SemanticPatchBundleOverlapQuery
): readonly SemanticPatchBundleOverlapRecord[];
