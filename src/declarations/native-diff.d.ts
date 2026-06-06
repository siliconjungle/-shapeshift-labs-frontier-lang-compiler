import type {
  CapabilityAdapterBinding,
  CapabilityUnsupportedTarget,
  CompileTarget,
  EvidenceRecord,
  FrontierLangDocument,
  FrontierUniversalAstEnvelope,
  FrontierSourceLanguage,
  LanguageImportResult,
  NativeAstLossRecord,
  NativeAstNode,
  NativeAstRecord,
  NativeSourceNode,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness,
  SemanticIndexRecord,
  SemanticNode,
  SemanticPatchBundle,
  SourceMapMappingRecord,
  SourceMapRecord,
  SourcePreservationLevel,
  SourcePreservationRecord,
  SourceSpan,
  UniversalAstLayerMap,
  UniversalAstLayerRecord
} from '@shapeshift-labs/frontier-lang-kernel';
import type { Diagnostic } from '@shapeshift-labs/frontier-lang-checker';
import type { EmitTypeScriptOptions, TypeScriptAstModule, TypeScriptDocumentSourceMapResult, TypeScriptGeneratedSourceMapResult } from '@shapeshift-labs/frontier-lang-typescript';
import type { EmitJavaScriptOptions, EmitJavaScriptWithSourceMapResult, JavaScriptAstModule, JavaScriptSourceMapResult } from '@shapeshift-labs/frontier-lang-javascript';
import type { EmitRustOptions, EmitRustWithSourceMapResult, RustAstModule, RustSourceMapResult } from '@shapeshift-labs/frontier-lang-rust';
import type { EmitPythonOptions, EmitPythonWithSourceMapResult, PythonAstModule, PythonSourceMapResult } from '@shapeshift-labs/frontier-lang-python';
import type { CAstHeader, CSourceMapResult, EmitCHeaderOptions, EmitCHeaderWithSourceMapResult } from '@shapeshift-labs/frontier-lang-c';
import type { FrontierCompileTarget, FrontierCompileEmitOptions, FrontierTargetAst, FrontierTargetSourceMapResult, FrontierTargetDocumentSourceMapResult, FrontierCompileOptions, FrontierCompileResult, CapabilityResolution } from './compile.js';
import type { NativeImportTaxonomyKind, NativeImportKnownLossKind, NativeImportRegionTaxonomyKind, NativeImportLossSummaryOptions, NativeImportFeatureEvidenceRisk, NativeImportFeatureEvidencePolicy, NativeImportFeatureEvidenceIssue, NativeImportFeatureEvidenceSummary, NativeImportLossSummary, NativeImportReadinessClassification, NativeImportLanguageProfile } from './native-import-losses.js';
import type { NativeParserAstFormatKind, NativeParserAstFormatProfile, NativeParserAstFormatCoverage, NativeParserAstFormatMatrix, NativeParserAstFormatMatrixOptions } from './native-parser-formats.js';
import type { NativeParserFeatureCategory, NativeParserFeatureCoverageStatus, NativeParserFeatureCoverage, NativeParserFeatureCoverageMap, NativeParserFeatureMergeAssessment, NativeParserFeatureParserRow, NativeParserFeatureLanguageSummary, NativeParserFeatureMatrix, NativeParserFeatureMatrixOptions, NativeParserFeatureMatrixQuery, NativeParserFeatureMatrixQueryResult, NativeImporterAdapterCoverageAggregate } from './native-parser-features.js';
import type { NativeImportCoverageLanguage, NativeImportCoverageMatrix, NativeImportCoverageMatrixOptions } from './native-import-coverage.js';
import type { ProjectionTargetLossClass, ProjectionSourceProjectionCoverage, ProjectionTargetCoverageEntry, ProjectionTargetLanguageCoverage, ProjectionTargetLossMatrix, ProjectionTargetLossMatrixOptions } from './projection-coverage.js';
import type { UniversalCapabilityLanguageRow, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions } from './universal-capability.js';
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions } from './source-preservation.js';
import type { SemanticImportOwnershipRegion, SemanticImportSidecarSymbol, SemanticImportRegionTaxonomySummary, SemanticImportPatchHint, SemanticImportSidecarImportEntry, SemanticImportSidecarSourcePreservationRecord, SemanticImportSidecarUniversalAstLayerSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecar, SemanticImportSidecarOptions } from './semantic-sidecar.js';
import type { SemanticMergeCandidateWithConflicts, SemanticMergeConflictSummary } from './semantic-merge-conflicts.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type NativeSourceChangeKind = 'added' | 'removed' | 'modified' | 'unchanged';

export interface NativeSourceChangeProjectionEndpoint {
  readonly side: 'before' | 'after';
  readonly importId?: string;
  readonly sidecarId?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourcePreservationId?: string;
  readonly exactSourceAvailable: boolean;
  readonly ownershipRegionId?: string;
  readonly ownershipKey?: string;
  readonly ownershipRegionKind?: NativeImportRegionTaxonomyKind;
  readonly sourceSpan?: SourceSpan;
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappingIds: readonly string[];
}

export interface NativeSourceChangeProjectionSourceMapLink {
  readonly id: string;
  readonly side: 'before' | 'after';
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
  readonly ownershipRegionId?: string;
  readonly ownershipRegionKey?: string;
  readonly ownershipRegionKind?: NativeImportRegionTaxonomyKind;
}

export interface NativeSourceChangeProjectionMetadata {
  readonly schema: 'frontier.lang.changedRegionProjection.v1';
  readonly id: string;
  readonly reviewRequired: true;
  readonly autoMergeClaim: false;
  readonly changeKind: NativeSourceChangeKind;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly conflictKey: string;
  readonly region: {
    readonly id?: string;
    readonly key?: string;
    readonly kind?: NativeImportRegionTaxonomyKind;
    readonly granularity?: string;
    readonly precision?: string;
    readonly sourceSpan?: SourceSpan;
    readonly nativeAstNodeId?: string;
    readonly symbolId?: string;
    readonly symbolName?: string;
    readonly symbolKind?: string;
  };
  readonly before?: NativeSourceChangeProjectionEndpoint;
  readonly after?: NativeSourceChangeProjectionEndpoint;
  readonly sourceMapLinks: readonly NativeSourceChangeProjectionSourceMapLink[];
  readonly admission: {
    readonly readiness: SemanticMergeReadiness;
    readonly action: 'review-addition' | 'review-removal' | 'review-file' | 'review-port' | 'rerun-or-human-port' | string;
    readonly reasons: readonly string[];
    readonly conflictKeys: readonly string[];
  };
}

export interface NativeSourceChangeProjectionSummary {
  readonly schema: 'frontier.lang.changedRegionProjectionSummary.v1';
  readonly total: number;
  readonly withProjection: number;
  readonly reviewRequired: number;
  readonly autoMergeClaims: number;
  readonly sourceMapLinks: number;
  readonly byAction: Readonly<Record<string, number>>;
  readonly byRegionKind: Readonly<Record<string, number>>;
}

export interface NativeSourceChangeSymbol {
  readonly changeKind: NativeSourceChangeKind;
  readonly key: string;
  readonly id?: string;
  readonly name?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly nativeAstNodeId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapMappingId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly beforeSignatureHash?: string;
  readonly afterSignatureHash?: string;
  readonly beforeSpanHash?: string;
  readonly afterSpanHash?: string;
  readonly beforeNativeAstNodeId?: string;
  readonly afterNativeAstNodeId?: string;
  readonly beforeSourceSpan?: SourceSpan;
  readonly afterSourceSpan?: SourceSpan;
  readonly beforeOwnershipKey?: string;
  readonly afterOwnershipKey?: string;
  readonly ownershipRegionId?: string;
  readonly ownershipKey?: string;
  readonly ownershipRegionKind?: NativeImportRegionTaxonomyKind;
  readonly conflictKey: string;
  readonly readiness: SemanticMergeReadiness;
}

export interface NativeSourceChangeRegion extends SemanticImportOwnershipRegion {
  readonly changeKind: NativeSourceChangeKind;
  readonly conflictKey: string;
  readonly metadata?: SemanticImportOwnershipRegion['metadata'] & {
    readonly changedRegionProjection?: NativeSourceChangeProjectionMetadata;
  };
}

export interface NativeSourceChangeSummary {
  readonly sourceChanged: boolean;
  readonly symbols: number;
  readonly regions: number;
  readonly addedSymbols: number;
  readonly removedSymbols: number;
  readonly modifiedSymbols: number;
  readonly byRegionKind: Readonly<Record<string, number>>;
  readonly byChangeKind: Readonly<Record<string, number>>;
}

export interface DiffNativeSourceImportsOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly parser?: string;
  readonly before?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly after?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly beforeSourceHash?: string;
  readonly afterSourceHash?: string;
  readonly generatedAt?: number;
  readonly regionPrefix?: string;
  readonly evidenceId?: string;
  readonly evidenceStatus?: EvidenceRecord['status'];
  readonly patchId?: string;
  readonly mergeCandidateId?: string;
  readonly author?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface DiffNativeSourcesOptions extends Omit<DiffNativeSourceImportsOptions, 'before' | 'after'> {
  readonly before?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly after?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly beforeSourceText?: string;
  readonly afterSourceText?: string;
  readonly beforeMetadata?: Record<string, unknown>;
  readonly afterMetadata?: Record<string, unknown>;
}

export interface NativeSourceChangeSet {
  readonly kind: 'frontier.lang.nativeSourceChangeSet';
  readonly version: 1;
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly before?: NativeSourceImportResult;
  readonly after?: NativeSourceImportResult;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly changedSymbols: readonly NativeSourceChangeSymbol[];
  readonly changedRegions: readonly NativeSourceChangeRegion[];
  readonly patch: SemanticPatchBundle;
  readonly mergeCandidate: SemanticMergeCandidateWithConflicts;
  readonly evidence: readonly EvidenceRecord[];
  readonly readiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly semanticIndex?: SemanticIndexRecord;
  readonly losses: readonly NativeAstLossRecord[];
  readonly summary: NativeSourceChangeSummary;
  readonly metadata?: Record<string, unknown> & {
    readonly changedRegionProjectionSummary?: NativeSourceChangeProjectionSummary;
    readonly semanticMergeConflictSummary?: SemanticMergeConflictSummary;
  };
}
