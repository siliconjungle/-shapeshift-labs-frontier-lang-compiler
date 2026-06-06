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
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type NativeParserFeatureCategory =
  | 'syntax'
  | 'semantic'
  | 'type'
  | 'controlFlow'
  | 'macroMetaprogramming'
  | 'sourcePreservation'
  | string;

export type NativeParserFeatureCoverageStatus =
  | 'full'
  | 'partial'
  | 'evidence-required'
  | 'missing'
  | 'blocked'
  | 'not-applicable'
  | string;

export interface NativeParserFeatureCoverage {
  readonly category: NativeParserFeatureCategory;
  readonly status: NativeParserFeatureCoverageStatus;
  readonly readiness: SemanticMergeReadiness;
  readonly mergeReady: boolean;
  readonly supported: boolean;
  readonly capabilities: Readonly<Record<string, unknown>>;
  readonly gaps: readonly string[];
  readonly lossKinds: Readonly<Record<string, number>>;
  readonly reasons: readonly string[];
  readonly notes: readonly string[];
}

export interface NativeParserFeatureCoverageMap {
  readonly syntax: NativeParserFeatureCoverage;
  readonly semantic: NativeParserFeatureCoverage;
  readonly type: NativeParserFeatureCoverage;
  readonly controlFlow: NativeParserFeatureCoverage;
  readonly macroMetaprogramming: NativeParserFeatureCoverage;
  readonly sourcePreservation: NativeParserFeatureCoverage;
  readonly [category: string]: NativeParserFeatureCoverage;
}

export interface NativeParserFeatureMergeAssessment {
  readonly mergeReady: boolean;
  readonly readiness: SemanticMergeReadiness;
  readonly requiredFeatures: readonly NativeParserFeatureCategory[];
  readonly minimumReadiness: SemanticMergeReadiness;
  readonly blockingFeatures: readonly NativeParserFeatureCategory[];
  readonly reviewFeatures: readonly NativeParserFeatureCategory[];
  readonly reasons: readonly string[];
}

export interface NativeParserFeatureParserRow {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly parser: string;
  readonly parserFormat: string;
  readonly parserAliases: readonly string[];
  readonly parserAdapters: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly projectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
  readonly adapters: {
    readonly total: number;
    readonly ids: readonly string[];
    readonly versions: readonly string[];
    readonly exactness: readonly NativeImporterAdapterExactness[];
    readonly coverage: NativeImporterAdapterCoverageAggregate;
  };
  readonly imports: {
    readonly total: number;
    readonly sourcePaths: readonly string[];
    readonly readiness: SemanticMergeReadiness;
    readonly readinessReasons: readonly string[];
    readonly nativeAstNodes: number;
    readonly symbols: number;
    readonly references: number;
    readonly types: number;
    readonly controlFlow: number;
    readonly sourceMaps: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly lossKinds: Readonly<Record<string, number>>;
    readonly lossCategories: readonly NativeImportTaxonomyKind[];
    readonly sourcePreservation: NativeImportSourcePreservationContract;
  };
  readonly features: NativeParserFeatureCoverageMap;
  readonly merge: NativeParserFeatureMergeAssessment;
}

export interface NativeParserFeatureLanguageSummary {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly parserRows: number;
  readonly parsers: readonly string[];
  readonly imports: number;
  readonly adapters: number;
  readonly mergeReadyParsers: readonly string[];
  readonly readiness: SemanticMergeReadiness;
}

export interface NativeParserFeatureMatrix {
  readonly kind: 'frontier.lang.nativeParserFeatureMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly parsers: readonly NativeParserFeatureParserRow[];
  readonly languages: readonly NativeParserFeatureLanguageSummary[];
  readonly summary: {
    readonly languages: number;
    readonly parsers: number;
    readonly imports: number;
    readonly adapters: number;
    readonly mergeReady: number;
    readonly byReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byFeatureStatus: Readonly<Record<NativeParserFeatureCategory, Readonly<Record<NativeParserFeatureCoverageStatus, number>>>>;
    readonly byFeatureReadiness: Readonly<Record<NativeParserFeatureCategory, Readonly<Record<SemanticMergeReadiness, number>>>>;
  };
  readonly metadata: {
    readonly categories: readonly NativeParserFeatureCategory[];
    readonly statuses: readonly NativeParserFeatureCoverageStatus[];
    readonly requiredFeatures: readonly NativeParserFeatureCategory[];
    readonly minimumReadiness: SemanticMergeReadiness;
    readonly note: string;
  };
}

export interface NativeParserFeatureMatrixOptions {
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly requiredFeatures?: readonly NativeParserFeatureCategory[];
  readonly minimumReadiness?: SemanticMergeReadiness;
  readonly includeEmptyParsers?: boolean;
  readonly generatedAt?: number;
}

export interface NativeParserFeatureMatrixQuery {
  readonly language?: FrontierSourceLanguage | string;
  readonly parser?: string;
  readonly requiredFeatures?: readonly NativeParserFeatureCategory[];
  readonly minimumReadiness?: SemanticMergeReadiness;
}

export interface NativeParserFeatureMatrixQueryResult {
  readonly kind: 'frontier.lang.nativeParserFeatureQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly language?: FrontierSourceLanguage | string;
  readonly parser?: string;
  readonly row?: NativeParserFeatureParserRow;
  readonly merge: NativeParserFeatureMergeAssessment;
}

export interface NativeImporterAdapterCoverageAggregate {
  readonly total: number;
  readonly declared: Readonly<Record<string, number>>;
  readonly observed: Readonly<Record<string, number>>;
  readonly effective: Readonly<Record<string, number>>;
  readonly gaps: Readonly<Record<string, number>>;
  readonly declaredOnly: Readonly<Record<string, number>>;
  readonly observedOnly: Readonly<Record<string, number>>;
  readonly summaries: readonly {
    readonly adapterId?: string;
    readonly language?: FrontierSourceLanguage | string;
    readonly parser?: string;
    readonly exactness?: NativeImporterAdapterExactness;
    readonly declared: readonly string[];
    readonly observed: readonly string[];
    readonly effective: readonly string[];
    readonly gaps: readonly string[];
    readonly declaredOnly: readonly string[];
    readonly observedOnly: readonly string[];
  }[];
}
