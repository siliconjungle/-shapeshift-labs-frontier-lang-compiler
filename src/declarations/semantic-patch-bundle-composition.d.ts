import type { EvidenceRecord, FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticEditProjection, SemanticEditReplay } from './semantic-edit-script.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';
import type { CompareSemanticPatchBundleRecordsOptions, SemanticPatchBundleOverlapRecord } from './semantic-patch-bundle-overlaps.js';

export type SemanticPatchBundleCompositionStatus = 'verified' | 'blocked' | string;

export interface ComposeSemanticPatchBundleProjectionsInput {
  readonly id?: string;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly currentSourceText?: string;
  readonly headSourceText?: string;
  readonly bundles?: readonly SemanticPatchBundleRecord[] | SemanticPatchBundleRecord;
  readonly semanticPatchBundles?: readonly SemanticPatchBundleRecord[] | SemanticPatchBundleRecord;
  readonly projections?: readonly SemanticEditProjection[] | SemanticEditProjection;
  readonly semanticEditProjections?: readonly SemanticEditProjection[] | SemanticEditProjection;
  readonly overlapOptions?: CompareSemanticPatchBundleRecordsOptions;
  readonly parser?: unknown;
}

export interface SemanticPatchBundleComposition {
  readonly kind: 'frontier.lang.semanticPatchBundleComposition';
  readonly version: 1;
  readonly schema: 'frontier.lang.semanticPatchBundleComposition.v1';
  readonly id: string;
  readonly hash: string;
  readonly status: SemanticPatchBundleCompositionStatus;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly bundleIds: readonly string[];
  readonly projectionIds: readonly string[];
  readonly currentHash?: string;
  readonly outputHash?: string;
  readonly outputSourceText?: string;
  readonly replays: readonly SemanticEditReplay[];
  readonly verificationReplays: readonly SemanticEditReplay[];
  readonly overlapRecords: readonly SemanticPatchBundleOverlapRecord[];
  readonly admission: {
    readonly status: 'auto-merge-candidate' | 'blocked' | string;
    readonly action: 'apply' | 'human-review' | string;
    readonly reviewRequired: boolean;
    readonly autoApplyCandidate: boolean;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reasonCodes: readonly string[];
  };
  readonly summary: {
    readonly bundles: number;
    readonly projections: number;
    readonly replays: number;
    readonly verificationReplays: number;
    readonly appliedEdits: number;
    readonly overlapRecords: number;
    readonly blockedOverlaps: number;
  };
  readonly evidence: readonly EvidenceRecord[];
}

export declare function composeSemanticPatchBundleProjections(
  input?: ComposeSemanticPatchBundleProjectionsInput
): SemanticPatchBundleComposition;
