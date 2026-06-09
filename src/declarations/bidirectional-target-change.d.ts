import type {
  EvidenceRecord,
  FrontierSourceLanguage,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { ImportNativeSourceOptions, NativeSourceImportResult } from './import-adapter-core.js';
import type { NativeSourceChangeRegion, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticHistoryRecord } from './semantic-history.js';
import type { SemanticLineageEvent, SemanticLineageResolution } from './semantic-lineage.js';
import type { SemanticPatchBundleRecord } from './semantic-patch-bundle.js';

export type BidirectionalTargetChangeAnchorStatus = 'matched' | 'unmatched' | 'ambiguous' | 'deleted' | string;

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

export interface BidirectionalTargetChangeSourceAnchorMatch {
  readonly kind: 'frontier.lang.bidirectionalTargetChangeSourceAnchorMatch';
  readonly version: 1;
  readonly id: string;
  readonly targetRegion: Partial<NativeSourceChangeRegion>;
  readonly sourceAnchors: readonly BidirectionalTargetChangeAnchor[];
  readonly lineageResolutions: readonly SemanticLineageResolution[];
  readonly status: BidirectionalTargetChangeAnchorStatus;
  readonly confidence?: number;
  readonly reasonCodes: readonly string[];
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly conflictKeys: readonly string[];
}

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
  };
  readonly metadata: {
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reviewRequired: true;
    readonly [key: string]: unknown;
  };
}

export declare function createBidirectionalTargetChangeRecord(
  input?: CreateBidirectionalTargetChangeRecordOptions,
  options?: Record<string, unknown>
): BidirectionalTargetChangeRecord;
