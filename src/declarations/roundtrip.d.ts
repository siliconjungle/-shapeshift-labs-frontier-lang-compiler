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
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';

export type NativeImportRoundtripReadinessStatus =
  | 'exact'
  | 'preserved-source'
  | 'stub-only'
  | 'blocked'
  | 'needs-review';

export interface NativeImportRoundtripReadinessOptions extends ProjectNativeImportToSourceOptions {
  readonly projection?: NativeSourceProjectionResult;
}

export interface NativeImportRoundtripReadinessClassification {
  readonly kind: 'frontier.lang.nativeImportRoundtripReadiness';
  readonly version: 1;
  readonly status: NativeImportRoundtripReadinessStatus;
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly importReadiness: NativeImportReadinessClassification;
  readonly projectionReadiness: NativeImportReadinessClassification;
  readonly projectionMode: NativeSourceProjectionMode;
  readonly checks: {
    readonly nativeImport: {
      readonly imports: number;
      readonly exactAst: boolean;
      readonly losses: number;
      readonly readiness: SemanticMergeReadiness;
    };
    readonly universalAst: {
      readonly present: boolean;
      readonly valid: boolean;
      readonly issues: readonly string[];
      readonly nativeSources: number;
      readonly semanticSymbols: number;
      readonly sourceMaps: number;
      readonly sourceMapMappings: number;
    };
    readonly projectedSource: {
      readonly mode: NativeSourceProjectionMode;
      readonly outputHash: string;
      readonly expectedSourceHash?: string;
      readonly sourceHashVerified: boolean;
      readonly declarations: number;
      readonly losses: number;
      readonly readiness: SemanticMergeReadiness;
    };
  };
  readonly evidence: {
    readonly importEvidenceIds: readonly string[];
    readonly projectionEvidenceIds: readonly string[];
    readonly failedEvidenceIds: readonly string[];
  };
  readonly metadata: Record<string, unknown>;
}

export type NativeRoundtripEvidenceStatus = NativeImportRoundtripReadinessStatus | 'target-adapter';

export type NativeRoundtripSourceMapPrecision = SourceMapMappingRecord['precision'] | 'line' | 'declaration' | 'estimated' | 'unknown' | 'none' | string;

export interface NativeRoundtripSourceMapEvidence {
  readonly total: number;
  readonly ids: readonly string[];
  readonly mappings: number;
  readonly precision: NativeRoundtripSourceMapPrecision;
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly byOrigin: Readonly<Record<string, number>>;
  readonly withSourceSpan: number;
  readonly withGeneratedSpan: number;
  readonly withSemanticSymbol: number;
  readonly targetPaths: readonly string[];
}

export interface NativeRoundtripEvidenceMetadata {
  readonly status: NativeRoundtripEvidenceStatus;
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly reviewRequired: boolean;
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: CompileTarget | string;
  readonly import: {
    readonly id?: string;
    readonly readiness: SemanticMergeReadiness;
    readonly exactAst: boolean;
    readonly lossCount: number;
    readonly evidenceIds: readonly string[];
  };
  readonly universalAst: {
    readonly id?: string;
    readonly present: boolean;
    readonly valid: boolean;
    readonly issues: readonly string[];
    readonly nativeSources: number;
    readonly semanticSymbols: number;
    readonly sourceMaps: NativeRoundtripSourceMapEvidence;
  };
  readonly projection: {
    readonly id?: string;
    readonly mode?: NativeSourceProjectionMode;
    readonly readiness: SemanticMergeReadiness;
    readonly sourceHashVerified: boolean;
    readonly outputHash?: string;
    readonly declarationCount: number;
    readonly lossCount: number;
    readonly evidenceIds: readonly string[];
  };
  readonly output: {
    readonly mode?: NativeSourceCompileOutputMode;
    readonly targetProjectionId?: string;
    readonly targetProjectionAdapterId?: string;
    readonly targetCoverageLossClass?: ProjectionTargetLossClass | string;
    readonly targetReadiness?: SemanticMergeReadiness;
    readonly targetSupported?: boolean;
    readonly sourceMaps: NativeRoundtripSourceMapEvidence;
  };
  readonly losses: {
    readonly total: number;
    readonly bySeverity: Readonly<Record<string, number>>;
    readonly byKind: Readonly<Record<string, number>>;
    readonly blockingLossIds: readonly string[];
    readonly reviewLossIds: readonly string[];
    readonly informationalLossIds: readonly string[];
  };
}

export interface NativeRoundtripEvidenceRecord extends Omit<EvidenceRecord, 'kind' | 'metadata'> {
  readonly kind: 'import';
  readonly metadata: {
    readonly schema: 'frontier.lang.nativeRoundtripEvidence';
    readonly version: 1;
    readonly roundtripEvidence: NativeRoundtripEvidenceMetadata;
    readonly [key: string]: unknown;
  };
}

export interface NativeRoundtripEvidenceOptions {
  readonly id?: string;
  readonly projection?: NativeSourceProjectionResult;
  readonly targetProjection?: NativeTargetProjectionResult;
  readonly targetCoverage?: ProjectionTargetCoverageEntry;
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly losses?: readonly NativeAstLossRecord[];
  readonly readiness?: NativeImportReadinessClassification;
  readonly target?: CompileTarget | string;
  readonly outputMode?: NativeSourceCompileOutputMode;
}

export declare function createNativeRoundtripEvidence(
  importResult: NativeSourceImportResult,
  options?: NativeRoundtripEvidenceOptions
): NativeRoundtripEvidenceRecord;
