import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceMapMappingRecord,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { NativeSourceChangeRegion } from './native-diff.js';
import type { SemanticLineageResolution } from './semantic-lineage.js';

export type BidirectionalTargetChangeAnchorStatus = 'matched' | 'unmatched' | 'ambiguous' | 'deleted' | string;
export type BidirectionalTargetPortabilityStatus = 'portable' | 'needs-port' | 'stale' | 'conflict' | 'blocked' | 'evidence-only' | string;
export type BidirectionalTargetPortabilityAction =
  | 'port-with-source-map-review'
  | 'human-port'
  | 'refresh-source-map'
  | 'resolve-anchor-conflict'
  | 'block'
  | 'record-evidence'
  | string;

export interface BidirectionalTargetChangeSourceAnchorMapping {
  readonly targetAnchorKey?: string;
  readonly targetRegionKey?: string;
  readonly targetConflictKey?: string;
  readonly targetKey?: string;
  readonly targetSymbolName?: string;
  readonly targetSymbolId?: string;
  readonly sourceAnchorKey?: string;
  readonly sourceRegionKey?: string;
  readonly sourceConflictKey?: string;
  readonly sourceKey?: string;
  readonly sourceSymbolName?: string;
  readonly sourceSymbolId?: string;
}

export interface BidirectionalTargetChangeSourceMapLink {
  readonly id: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly semanticNodeId?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstNodeId?: string;
  readonly precision?: string;
  readonly sourceSpan?: SourceSpan;
  readonly generatedSpan?: SourceMapMappingRecord['generatedSpan'];
  readonly regionKey?: string;
  readonly regionKind?: string;
}

export interface BidirectionalTargetChangeAnchor {
  readonly id?: string;
  readonly key?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly sourceSpan?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface BidirectionalTargetMatchPortability {
  readonly status: BidirectionalTargetPortabilityStatus;
  readonly action: BidirectionalTargetPortabilityAction;
  readonly readiness: SemanticMergeReadiness | string;
  readonly confidence?: number;
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly staleSourceMapLinkIds: readonly string[];
}

export interface BidirectionalTargetChangeSourceAnchorMatch {
  readonly kind: 'frontier.lang.bidirectionalTargetChangeSourceAnchorMatch';
  readonly version: 1;
  readonly id: string;
  readonly targetRegion: Partial<NativeSourceChangeRegion>;
  readonly sourceAnchors: readonly BidirectionalTargetChangeAnchor[];
  readonly lineageResolutions: readonly SemanticLineageResolution[];
  readonly sourceMapLinks: readonly BidirectionalTargetChangeSourceMapLink[];
  readonly portability?: BidirectionalTargetMatchPortability;
  readonly status: BidirectionalTargetChangeAnchorStatus;
  readonly confidence?: number;
  readonly reasonCodes: readonly string[];
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly conflictKeys: readonly string[];
}

export interface BidirectionalTargetPortabilityRecord {
  readonly kind: 'frontier.lang.bidirectionalTargetPortability';
  readonly version: 1;
  readonly id?: string;
  readonly status: BidirectionalTargetPortabilityStatus;
  readonly action: BidirectionalTargetPortabilityAction;
  readonly readiness: SemanticMergeReadiness | string;
  readonly confidence?: number;
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourceAnchorMatchIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly staleSourceMapLinkIds: readonly string[];
  readonly targetChangedRegions: number;
  readonly matchedTargetRegions: number;
  readonly sourceMapBackedRegions: number;
  readonly unmatchedTargetRegions: number;
  readonly ambiguousTargetRegions: number;
  readonly deletedSourceAnchors: number;
}

export interface BidirectionalTargetChangeEndpointIdentity {
  readonly schema: 'frontier.lang.nativeChangeProjectionEndpointIdentity.v1';
  readonly version: 1;
  readonly side?: 'before' | 'after' | string;
  readonly importId?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourcePreservationId?: string;
  readonly exactSourceAvailable?: boolean;
  readonly ownershipRegionId?: string;
  readonly ownershipKey?: string;
  readonly ownershipRegionKind?: string;
  readonly sourceSpan?: SourceSpan;
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
}

export interface BidirectionalTargetChangeSourceIdentity {
  readonly importId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly sourceMapIds?: readonly string[];
}

export interface BidirectionalTargetChangeTargetIdentity {
  readonly changeSetId: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly beforeImportId?: string;
  readonly afterImportId?: string;
  readonly beforeNativeSourceId?: string;
  readonly afterNativeSourceId?: string;
  readonly beforeNativeAstId?: string;
  readonly afterNativeAstId?: string;
  readonly beforeSemanticIndexId?: string;
  readonly afterSemanticIndexId?: string;
  readonly patchId?: string;
  readonly mergeCandidateId?: string;
  readonly sourceMapIds?: readonly string[];
}

export interface BidirectionalTargetChangeTargetRegionEvidence {
  readonly id?: string;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly changeKind?: string;
  readonly regionKind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly sourceSpan?: SourceSpan;
  readonly changedRegionProjectionId?: string;
  readonly beforeIdentity?: BidirectionalTargetChangeEndpointIdentity;
  readonly afterIdentity?: BidirectionalTargetChangeEndpointIdentity;
  readonly sourceMapLinkIds?: readonly string[];
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
}

export interface BidirectionalTargetChangeMatchEvidence {
  readonly id?: string;
  readonly status?: BidirectionalTargetChangeAnchorStatus;
  readonly targetRegionKey?: string;
  readonly targetRegionConflictKey?: string;
  readonly sourceAnchorKeys?: readonly string[];
  readonly sourceMapLinkIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
  readonly lineageResolutionIds?: readonly string[];
  readonly portabilityStatus?: BidirectionalTargetPortabilityStatus;
  readonly portabilityAction?: BidirectionalTargetPortabilityAction;
  readonly reasonCodes?: readonly string[];
  readonly conflictKeys?: readonly string[];
}

export interface BidirectionalTargetChangeSourceMapEvidence {
  readonly sourceMapBackedMatches: number;
  readonly sourceMapLinks: number;
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly staleSourceMapLinkIds: readonly string[];
  readonly targetProjectionSourceMapLinks: number;
  readonly targetProjectionSourceMapLinkIds: readonly string[];
  readonly targetProjectionSourceMapIds: readonly string[];
  readonly targetProjectionSourceMapMappingIds: readonly string[];
}

export interface BidirectionalTargetChangeLineageEvidence {
  readonly lineageResolutionIds: readonly string[];
  readonly lineageEventIds: readonly string[];
  readonly lineageEvidenceIds: readonly string[];
  readonly lineageProofIds: readonly string[];
  readonly lineageReasonCodes: readonly string[];
}

export interface BidirectionalTargetChangeSemanticMergeAdmissionEvidence {
  readonly schema: 'frontier.lang.bidirectionalTargetChangeSemanticMergeAdmission.v1';
  readonly version: 1;
  readonly id: string;
  readonly evidenceIds: readonly string[];
  readonly sourcePatchBundleId: string;
  readonly historyRecordId: string;
  readonly targetChangeSetId: string;
  readonly targetPatchId?: string;
  readonly targetMergeCandidateId?: string;
  readonly readiness: SemanticMergeReadiness | string;
  readonly status: 'needs-review' | 'blocked' | string;
  readonly action: BidirectionalTargetPortabilityAction;
  readonly reasonCodes: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly sourceAnchorMatchIds: readonly string[];
  readonly sourceAnchorKeys: readonly string[];
  readonly targetRegionKeys: readonly string[];
  readonly sourceMapLinkIds: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
  readonly staleSourceMapLinkIds: readonly string[];
  readonly targetProjectionSourceMapLinkIds: readonly string[];
  readonly targetProjectionSourceMapMappingIds: readonly string[];
  readonly lineageResolutionIds: readonly string[];
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface BidirectionalTargetChangeRoundtripEvidence {
  readonly schema: 'frontier.lang.bidirectionalTargetChangeRoundtripEvidence.v1';
  readonly version: 1;
  readonly id: string;
  readonly evidenceId: string;
  readonly sourcePatchBundleId: string;
  readonly historyRecordId: string;
  readonly source: BidirectionalTargetChangeSourceIdentity;
  readonly target: BidirectionalTargetChangeTargetIdentity;
  readonly targetRegions: readonly BidirectionalTargetChangeTargetRegionEvidence[];
  readonly sourceAnchorMatches: readonly BidirectionalTargetChangeMatchEvidence[];
  readonly sourceAnchors: readonly BidirectionalTargetChangeAnchor[];
  readonly sourceMapEvidence: BidirectionalTargetChangeSourceMapEvidence;
  readonly lineageEvidence: BidirectionalTargetChangeLineageEvidence;
  readonly targetPortability: {
    readonly status: BidirectionalTargetPortabilityStatus;
    readonly action: BidirectionalTargetPortabilityAction;
    readonly readiness: SemanticMergeReadiness | string;
    readonly reasonCodes: readonly string[];
    readonly conflictKeys: readonly string[];
  };
  readonly admission: {
    readonly status: 'needs-review' | 'blocked' | string;
    readonly readiness: SemanticMergeReadiness | string;
    readonly action: BidirectionalTargetPortabilityAction;
    readonly reasonCodes: readonly string[];
    readonly conflictKeys: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly reviewRequired: true;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
  };
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}
