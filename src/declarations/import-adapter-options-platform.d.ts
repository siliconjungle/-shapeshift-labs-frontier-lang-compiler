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
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export interface JavaAstNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly compilationUnit?: unknown;
  readonly unit?: unknown;
  readonly sourceFile?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly javac?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly jdt?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly javaParser?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly javaVersion?: string;
  readonly sourceLevel?: string;
  readonly classPath?: readonly string[] | string | unknown;
  readonly modulePath?: readonly string[] | string | unknown;
  readonly generated?: boolean;
  readonly annotationProcessing?: unknown;
  readonly bindingEvidence?: unknown;
  readonly positionResolver?: (position: unknown) => unknown;
  readonly lineMap?: unknown;
  readonly includeAnnotations?: boolean;
  readonly maxNodes?: number;
}

export interface KotlinPsiNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly nativeAst?: unknown;
  readonly ktFile?: unknown;
  readonly file?: unknown;
  readonly sourceFile?: unknown;
  readonly root?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly kotlinPsi?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly kotlinCompiler?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly intellijPsi?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly kotlinVersion?: string;
  readonly languageVersion?: string;
  readonly apiVersion?: string;
  readonly script?: boolean;
  readonly generated?: boolean;
  readonly analysisApiEvidence?: unknown;
  readonly firEvidence?: unknown;
  readonly compilerPluginEvidence?: unknown;
  readonly kspEvidence?: unknown;
  readonly kaptEvidence?: unknown;
  readonly multiplatformEvidence?: unknown;
  readonly buildVariantEvidence?: unknown;
  readonly positionResolver?: (position: unknown) => unknown;
  readonly lineMap?: unknown;
  readonly includeAnnotations?: boolean;
  readonly maxNodes?: number;
}

export interface CSharpRoslynNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly nativeAst?: unknown;
  readonly syntaxTree?: unknown;
  readonly tree?: unknown;
  readonly root?: unknown;
  readonly compilationUnit?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly roslyn?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly csharpRoslyn?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly csharpVersion?: string;
  readonly languageVersion?: string;
  readonly nullableContext?: string | boolean;
  readonly sourceCodeKind?: string;
  readonly generated?: boolean;
  readonly projectReferences?: unknown;
  readonly analyzerDiagnostics?: unknown;
  readonly semanticModelEvidence?: unknown;
  readonly sourceGeneratorEvidence?: unknown;
  readonly positionResolver?: (position: unknown) => unknown;
  readonly lineMap?: unknown;
  readonly maxNodes?: number;
}

export interface SwiftSyntaxNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly nativeAst?: unknown;
  readonly sourceFile?: unknown;
  readonly sourceFileSyntax?: unknown;
  readonly root?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly swiftSyntax?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly swiftParser?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly swiftVersion?: string;
  readonly languageMode?: string;
  readonly enableBareSlashRegex?: boolean;
  readonly parseTransition?: string;
  readonly generated?: boolean;
  readonly sourceKitEvidence?: unknown;
  readonly macroExpansionEvidence?: unknown;
  readonly packageResolutionEvidence?: unknown;
  readonly positionResolver?: (position: unknown) => unknown;
  readonly lineMap?: unknown;
  readonly sourceLocationConverter?: unknown;
  readonly maxNodes?: number;
}

export interface TreeSitterNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string | { readonly parse?: (sourceText: string) => unknown };
  readonly parserName?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly parserInstance?: { readonly parse: (sourceText: string) => unknown };
  readonly treeSitterParser?: { readonly parse: (sourceText: string) => unknown };
  readonly parse?: (input: NativeImporterAdapterParseInput) => unknown;
  readonly tree?: unknown;
  readonly maxNodes?: number;
}
