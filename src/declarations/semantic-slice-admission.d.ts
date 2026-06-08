import type { EvidenceRecord, SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { SemanticSlice, SemanticSliceTestResult, TestSemanticSliceOptions } from './semantic-slice.js';

export type SemanticSliceAdmissionAction = 'admit' | 'prioritize' | 'reject';
export type SemanticSliceAdmissionPriority = 'low' | 'normal' | 'high' | 'blocker';
export type SemanticSliceAdmissionRisk = 'low' | 'medium' | 'high' | 'unknown';
export type SemanticSliceAdmissionScoreComponentKey =
  | 'semanticSelection'
  | 'sourceFreshness'
  | 'ownershipIsolation'
  | 'verificationEvidence'
  | 'reviewRisk';
export type SemanticSliceAdmissionScoreComponentStatus = 'strong' | 'partial' | 'weak' | 'blocked';

export interface SemanticSliceAdmissionScoreComponent {
  readonly key: SemanticSliceAdmissionScoreComponentKey;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly status: SemanticSliceAdmissionScoreComponentStatus;
  readonly reasons: readonly string[];
  readonly signals: Record<string, unknown>;
}

export interface SemanticSliceAdmissionMergeScore {
  readonly schema: 'frontier.lang.semanticMergeScore.v1';
  readonly version: 1;
  readonly value: number;
  readonly uncappedValue: number;
  readonly sortKey: number;
  readonly higherIsBetter: true;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: SemanticSliceAdmissionRisk;
  readonly action: SemanticSliceAdmissionAction;
  readonly components: Readonly<Record<SemanticSliceAdmissionScoreComponentKey, SemanticSliceAdmissionScoreComponent>>;
  readonly penalties: readonly string[];
}

export interface SemanticSliceAdmissionSpan {
  readonly path?: string;
  readonly sourceId?: string;
  readonly sourceHash?: string;
  readonly startLine?: number;
  readonly startColumn?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
  readonly startOffset?: number;
  readonly endOffset?: number;
}

export interface SemanticSliceAdmissionSelectedSymbol {
  readonly id?: string;
  readonly name?: string;
  readonly displayName?: string;
  readonly kind?: string;
  readonly signature?: string;
  readonly nativeAstNodeId?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SemanticSliceAdmissionSpan;
  readonly ownershipRegionId?: string;
  readonly ownershipRegionKey?: string;
  readonly ownershipRegionKind?: string;
}

export interface SemanticSliceAdmissionSelectedRegion {
  readonly id?: string;
  readonly key?: string;
  readonly conflictKey?: string;
  readonly kind?: string;
  readonly granularity?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly nativeAstNodeId?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SemanticSliceAdmissionSpan;
}

export interface SemanticSliceAdmissionSelectedNativeNode {
  readonly id?: string;
  readonly kind?: string;
  readonly languageKind?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SemanticSliceAdmissionSpan;
  readonly parentId?: string;
  readonly childCount: number;
}

export interface SemanticSliceAdmissionSelectedRelation {
  readonly id?: string;
  readonly predicate?: string;
  readonly kind?: string;
  readonly sourceId?: string;
  readonly targetId?: string;
}

export interface SemanticSliceAdmissionSelectedOccurrence {
  readonly id?: string;
  readonly symbolId?: string;
  readonly nativeAstNodeId?: string;
  readonly role?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SemanticSliceAdmissionSpan;
}

export interface SemanticSliceAdmissionSelectedSourceMapLink {
  readonly id?: string;
  readonly sourceMapId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly semanticNodeId?: string;
  readonly nativeAstNodeId?: string;
  readonly ownershipRegionId?: string;
  readonly ownershipRegionKey?: string;
  readonly ownershipRegionKind?: string;
  readonly precision?: string;
  readonly sourceSpan?: SemanticSliceAdmissionSpan;
}

export interface SemanticSliceAdmissionSelectedSourceFile {
  readonly path?: string;
  readonly sourceHash?: string;
  readonly spanCount: number;
  readonly excerptCount: number;
  readonly sourceTextAvailable: boolean;
}

export interface SemanticSliceAdmissionSelectedSurface {
  readonly entryRefs: readonly string[];
  readonly matchedEntryRefs: readonly string[];
  readonly unresolvedEntryRefs: readonly string[];
  readonly symbols: readonly SemanticSliceAdmissionSelectedSymbol[];
  readonly ownershipRegions: readonly SemanticSliceAdmissionSelectedRegion[];
  readonly nativeNodes: readonly SemanticSliceAdmissionSelectedNativeNode[];
  readonly relations: readonly SemanticSliceAdmissionSelectedRelation[];
  readonly occurrences: readonly SemanticSliceAdmissionSelectedOccurrence[];
  readonly sourceMapLinks: readonly SemanticSliceAdmissionSelectedSourceMapLink[];
  readonly sourceSpans: readonly SemanticSliceAdmissionSpan[];
  readonly sourceFiles: readonly SemanticSliceAdmissionSelectedSourceFile[];
  readonly sourceHashes: SemanticSlice['mergeAdmission']['sourceHashes'];
  readonly conflictKeys: readonly string[];
  readonly ownershipKeys: readonly string[];
}

export interface SemanticSliceAdmissionRecord {
  readonly kind: 'frontier.lang.semanticSliceAdmission';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly sliceId?: string;
  readonly importId?: string;
  readonly sourcePath?: string;
  readonly action: SemanticSliceAdmissionAction;
  readonly priority: SemanticSliceAdmissionPriority;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: SemanticSliceAdmissionRisk;
  readonly autoMergeClaim: false;
  readonly reviewRequired: boolean;
  readonly mergeScore: SemanticSliceAdmissionMergeScore;
  readonly counts: {
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly nativeNodes: number;
    readonly sourceMapLinks: number;
    readonly sourceFiles: number;
    readonly focusedCommands: number;
    readonly fixtureHints: number;
    readonly assertions: number;
    readonly failedAssertions: number;
    readonly warningAssertions: number;
  };
  readonly conflictKeys: readonly string[];
  readonly ownershipKeys: readonly string[];
  readonly sourceHashes: SemanticSlice['mergeAdmission']['sourceHashes'];
  readonly selectedSurface: SemanticSliceAdmissionSelectedSurface;
  readonly evidence: readonly EvidenceRecord[];
  readonly testResult?: SemanticSliceTestResult;
  readonly reasons: readonly string[];
  readonly metadata: Record<string, unknown>;
}

export interface CreateSemanticSliceAdmissionRecordOptions extends TestSemanticSliceOptions {
  readonly testResult?: SemanticSliceTestResult;
  readonly evidence?: readonly EvidenceRecord[];
}

export declare function createSemanticSliceAdmissionRecord(
  slice: SemanticSlice,
  options?: CreateSemanticSliceAdmissionRecordOptions
): SemanticSliceAdmissionRecord;
