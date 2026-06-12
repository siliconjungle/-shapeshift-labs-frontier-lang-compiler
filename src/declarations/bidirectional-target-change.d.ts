import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceMapRecord
} from '@shapeshift-labs/frontier-lang-kernel';
import type { ImportNativeSourceOptions, NativeSourceImportResult } from './import-adapter-core.js';
import type { NativeSourceChangeSet } from './native-diff.js';
import type { SemanticHistoryRecord } from './semantic-history.js';
import type { SemanticLineageEvent } from './semantic-lineage.js';
import type { SemanticEditScript } from './semantic-edit-script.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';
import type { BidirectionalTargetChangeSourceEditProjectionHint } from './bidirectional-target-change-source-edit.js';
import type {
  BidirectionalTargetChangeRoundtripEvidence,
  BidirectionalTargetChangeSemanticMergeAdmissionEvidence,
  BidirectionalTargetChangeSourceAnchorMapping,
  BidirectionalTargetChangeSourceAnchorMatch,
  BidirectionalTargetPortabilityRecord,
  BidirectionalTargetPortabilityStatus
} from './bidirectional-target-change-evidence.js';

export type * from './bidirectional-target-change-evidence.js';
export type * from './bidirectional-target-change-source-edit.js';

export interface CreateBidirectionalTargetChangeRecordOptions {
  readonly id?: string;
  readonly source?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly sourceImport?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly baseSource?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceParser?: string;
  readonly targetChangeSet?: NativeSourceChangeSet;
  readonly targetChangeSetId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly targetLanguage?: FrontierSourceLanguage | string;
  readonly targetPath?: string;
  readonly baseTarget?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly beforeTarget?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly before?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly editedTarget?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly afterTarget?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly after?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly sourceAnchorMappings?: readonly BidirectionalTargetChangeSourceAnchorMapping[];
  readonly anchorMappings?: readonly BidirectionalTargetChangeSourceAnchorMapping[];
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly projectionSourceMaps?: readonly SourceMapRecord[];
  readonly targetSourceMaps?: readonly SourceMapRecord[];
  readonly targetProjectionSourceMaps?: readonly SourceMapRecord[];
  readonly targetCompileResult?: { readonly sourceMaps?: readonly SourceMapRecord[]; readonly sourceMap?: SourceMapRecord };
  readonly lineage?: readonly SemanticLineageEvent[];
  readonly lineageEvents?: readonly SemanticLineageEvent[];
  readonly lineageMap?: unknown;
  readonly targetEvidenceId?: string;
  readonly targetPatchId?: string;
  readonly targetMergeCandidateId?: string;
  readonly sourceRegionPrefix?: string;
  readonly sourcePatchBundleId?: string;
  readonly historyRecordId?: string;
  readonly evidenceId?: string;
  readonly generatedAt?: number | string;
  readonly metadata?: Record<string, unknown>;
}

export interface BidirectionalTargetChangeRecord {
  readonly kind: 'frontier.lang.bidirectionalTargetChangeRecord';
  readonly version: 1;
  readonly id: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly targetLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly targetPath?: string;
  readonly sourceImport?: NativeSourceImportResult;
  readonly targetChangeSet: NativeSourceChangeSet;
  readonly sourceAnchorMatches: readonly BidirectionalTargetChangeSourceAnchorMatch[];
  readonly targetPortability: BidirectionalTargetPortabilityRecord;
  readonly roundtripEvidence: BidirectionalTargetChangeRoundtripEvidence;
  readonly sourceEditScript?: SemanticEditScript;
  readonly sourceProjectionHint?: BidirectionalTargetChangeSourceEditProjectionHint;
  readonly sourcePatchBundle: SemanticPatchBundleRecord;
  readonly historyRecord: SemanticHistoryRecord;
  readonly evidence: readonly EvidenceRecord[];
  readonly readiness: SemanticMergeReadiness | string;
  readonly reasons: readonly string[];
  readonly summary: {
    readonly targetChangedRegions: number;
    readonly sourceAnchorMatches: number;
    readonly ambiguousMatches: number;
    readonly unmatchedTargetRegions: number;
    readonly deletedSourceAnchors: number;
    readonly sourceChangedRegions: number;
    readonly sourceMapBackedMatches: number;
    readonly sourceMapLinks: number;
    readonly sourceMapMappingIds: number;
    readonly sourceEditScripts: number;
    readonly sourceProjectionHints: number;
    readonly lineageResolutions: number;
    readonly targetPortabilityStatus: BidirectionalTargetPortabilityStatus;
    readonly portableTargetRegions: number;
    readonly staleTargetRegions: number;
    readonly conflictingTargetRegions: number;
  };
  readonly metadata: {
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reviewRequired: true;
    readonly targetPortability?: BidirectionalTargetPortabilityRecord;
    readonly roundtripEvidenceId?: string;
    readonly semanticMergeAdmission?: BidirectionalTargetChangeSemanticMergeAdmissionEvidence;
    readonly sourceEditScriptId?: string;
    readonly sourceProjectionHintId?: string;
    readonly sourceProjectionHint?: BidirectionalTargetChangeSourceEditProjectionHint;
    readonly [key: string]: unknown;
  };
}

export declare function createBidirectionalTargetChangeRecord(
  input?: CreateBidirectionalTargetChangeRecordOptions,
  options?: Record<string, unknown>
): BidirectionalTargetChangeRecord;
