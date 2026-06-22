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

export interface JavaScriptNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly babelParser?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown> | ((input: NativeImporterAdapterParseInput) => Record<string, unknown>);
  readonly maxNodes?: number;
}

export interface TypeScriptCompilerNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly typescript?: unknown;
  readonly ts?: unknown;
  readonly program?: { readonly getTypeChecker?: () => unknown } | unknown;
  readonly typeChecker?: unknown;
  readonly checker?: unknown;
  readonly sourceFile?: unknown;
  readonly createSourceFile?: (input: NativeImporterAdapterParseInput, typescript?: unknown) => unknown;
  readonly scriptTarget?: unknown;
  readonly scriptKind?: unknown;
  readonly maxNodes?: number;
  readonly includeTokens?: boolean;
}

export interface PythonAstNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly pythonAst?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly mode?: 'exec' | 'eval' | 'single' | 'func_type' | string;
  readonly pythonVersion?: string;
  readonly featureVersion?: string | number;
  readonly typeComments?: boolean;
  readonly optimize?: number;
  readonly includeAttributes?: boolean;
  readonly maxNodes?: number;
}

export interface RustSynNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly file?: unknown;
  readonly sourceFile?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly rustSyn?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly syn?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly rustEdition?: '2015' | '2018' | '2021' | '2024' | string;
  readonly includeAttributes?: boolean;
  readonly maxNodes?: number;
}

export interface ClangAstNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly translationUnit?: unknown;
  readonly tu?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly clang?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly libclang?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly cStandard?: 'c89' | 'c99' | 'c11' | 'c17' | 'c23' | 'gnu11' | 'gnu17' | 'gnu23' | string;
  readonly compileFlags?: readonly string[];
  readonly includeSystemHeaders?: boolean;
  readonly preprocessorRecords?: readonly unknown[] | { readonly records?: readonly unknown[] };
  readonly includeGraph?: unknown;
  readonly maxNodes?: number;
}

export interface GoAstNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly ast?: unknown;
  readonly file?: unknown;
  readonly sourceFile?: unknown;
  readonly package?: unknown;
  readonly parse?: (sourceText: string, options: Record<string, unknown>) => unknown;
  readonly parserModule?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly goAst?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly goParser?: { readonly parse: (sourceText: string, options: Record<string, unknown>) => unknown };
  readonly parserOptions?: Record<string, unknown>;
  readonly mode?: string | number;
  readonly goVersion?: string;
  readonly packageName?: string;
  readonly fileSet?: unknown;
  readonly fset?: unknown;
  readonly includeComments?: boolean;
  readonly buildTags?: readonly string[];
  readonly generated?: boolean;
  readonly typeEvidence?: unknown;
  readonly maxNodes?: number;
}
