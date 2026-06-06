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
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type NativeImportTaxonomyKind =
  | 'exactAstImport'
  | 'declarationsOnly'
  | 'opaqueBodies'
  | 'macroExpansion'
  | 'preprocessor'
  | 'conditionalCompilation'
  | 'metaprogramming'
  | 'reflection'
  | 'generatedCode'
  | 'overloadTypeInference'
  | 'sourcePreservation'
  | 'commentsTrivia'
  | 'parserDiagnostics'
  | 'unsupportedSyntax'
  | 'partialSemanticIndex'
  | 'sourceMapApproximation'
  | 'targetProjectionLoss'
  | string;

export type NativeImportKnownLossKind =
  | 'declarationOnlyCoverage'
  | 'opaqueNative'
  | 'macroExpansion'
  | 'macroHygiene'
  | 'preprocessor'
  | 'conditionalCompilation'
  | 'metaprogramming'
  | 'reflection'
  | 'dynamicRuntime'
  | 'dynamicDispatch'
  | 'generatedCode'
  | 'overloadResolution'
  | 'typeInference'
  | 'sourcePreservation'
  | 'commentsTrivia'
  | 'parserDiagnostic'
  | 'unsupportedSyntax'
  | 'unsupportedSemantic'
  | 'unverifiedNativeAst'
  | 'partialSemanticIndex'
  | 'sourceMapApproximation'
  | 'targetProjectionLoss'
  | string;

export type NativeImportRegionTaxonomyKind =
  | 'symbol'
  | 'declaration'
  | 'import'
  | 'body'
  | 'call'
  | 'type'
  | 'effect'
  | 'property'
  | 'config'
  | 'content'
  | 'route'
  | 'generatedOutput'
  | string;

export interface NativeImportLossSummaryOptions {
  readonly exactAst?: boolean;
  readonly evidence?: readonly EvidenceRecord[];
  readonly parser?: string;
  readonly scanKind?: string;
  readonly semanticStatus?: string;
}

export type NativeImportFeatureEvidenceRisk = 'low' | 'medium' | 'high' | 'critical' | string;

export interface NativeImportFeatureEvidencePolicy {
  readonly kind: NativeImportKnownLossKind;
  readonly category: NativeImportTaxonomyKind;
  readonly risk: NativeImportFeatureEvidenceRisk;
  readonly minimumReadiness: SemanticMergeReadiness;
  readonly missingEvidenceReadiness: SemanticMergeReadiness;
  readonly requiredEvidenceKeys: readonly string[];
  readonly recommendedEvidenceKeys: readonly string[];
  readonly notes: readonly string[];
}

export interface NativeImportFeatureEvidenceIssue {
  readonly lossId: string;
  readonly kind: NativeImportKnownLossKind;
  readonly policyKind: NativeImportKnownLossKind;
  readonly risk: NativeImportFeatureEvidenceRisk;
  readonly category: NativeImportTaxonomyKind;
  readonly readiness: SemanticMergeReadiness;
  readonly missingRequiredEvidence: readonly string[];
  readonly presentRequiredEvidence: readonly string[];
  readonly presentRecommendedEvidence: readonly string[];
  readonly evidenceIds: readonly string[];
}

export interface NativeImportFeatureEvidenceSummary {
  readonly total: number;
  readonly policyKinds: readonly NativeImportKnownLossKind[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly byRisk: Readonly<Record<string, number>>;
  readonly highestRisk: NativeImportFeatureEvidenceRisk;
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly missingRequiredEvidence: readonly {
    readonly lossId: string;
    readonly kind: NativeImportKnownLossKind;
    readonly policyKind: NativeImportKnownLossKind;
    readonly evidenceKey: string;
  }[];
  readonly issues: readonly NativeImportFeatureEvidenceIssue[];
  readonly reasons: readonly string[];
}

export interface NativeImportLossSummary {
  readonly total: number;
  readonly hasLosses: boolean;
  readonly exactAst: boolean;
  readonly highestSeverity: 'none' | NativeAstLossRecord['severity'];
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly readinessReasons: readonly string[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly bySeverity: Readonly<Record<NativeAstLossRecord['severity'], number>>;
  readonly byKind: Readonly<Record<string, number>>;
  readonly blockingLossIds: readonly string[];
  readonly reviewLossIds: readonly string[];
  readonly informationalLossIds: readonly string[];
  readonly failedEvidenceIds: readonly string[];
  readonly featureEvidence: NativeImportFeatureEvidenceSummary;
  readonly parser?: string;
  readonly scanKind?: string;
  readonly semanticStatus?: string;
}

export interface NativeImportReadinessClassification {
  readonly readiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly summary: NativeImportLossSummary;
}

export interface NativeImportLanguageProfile {
  readonly language: FrontierSourceLanguage;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly parserAdapters: readonly string[];
  readonly projectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
}
