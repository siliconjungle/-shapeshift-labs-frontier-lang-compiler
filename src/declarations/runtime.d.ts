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
import type { UniversalCapabilityLanguageRow, UniversalCapabilityMatrix, UniversalCapabilityMatrixOptions, UniversalCapabilityMatrixQuery, UniversalCapabilityMatrixQueryResult } from './universal-capability.js';
import type { CreateUniversalConversionArtifactsInput, CreateUniversalConversionArtifactsOptions, UniversalConversionArtifactQuery, UniversalConversionArtifacts, UniversalConversionRouteArtifact } from './universal-conversion-artifacts.js';
import type { UniversalConversionPlan, UniversalConversionPlanOptions, UniversalConversionPlanQuery, UniversalConversionPlanQueryResult } from './universal-conversion-plan.js';
import type { UniversalDialectRegistry, UniversalDialectRegistryInput, UniversalDialectRecordInput, UniversalExternRecordInput } from '@shapeshift-labs/frontier-lang-dialects';
import type { NativeImportContractSource, NativeImportSourcePreservationRecordSummary, NativeImportSourcePreservationContract, NativeImportAdapterCoverageRecordSummary, NativeImportAdapterCoverageContract, NativeImportRegionSummary, NativeImportSourceMapSummary, NativeImportReadinessContract, NativeImportResultContract, NativeImportResultContractOptions } from './native-import-contracts.js';
import type { NativeSourceTokenKind, NativeSourcePreservedToken, NativeSourcePreservedDirective, NativeSourcePreservation, CreateNativeSourcePreservationOptions } from './source-preservation.js';
import type { SemanticImportOwnershipRegion, SemanticImportSidecarSymbol, SemanticImportRegionTaxonomySummary, SemanticImportPatchHint, SemanticImportSidecarImportEntry, SemanticImportSidecarSourcePreservationRecord, SemanticImportSidecarUniversalAstLayerSummary, SemanticImportSidecarProofSpecSummary, SemanticImportSidecarParadigmSemanticsSummary, SemanticImportSidecar, SemanticImportSidecarOptions } from './semantic-sidecar.js';
import type { NativeSourceChangeKind, NativeSourceChangeProjectionEndpoint, NativeSourceChangeProjectionSourceMapLink, NativeSourceChangeProjectionMetadata, NativeSourceChangeProjectionSummary, NativeSourceChangeSymbol, NativeSourceChangeRegion, NativeSourceChangeSummary, DiffNativeSourceImportsOptions, DiffNativeSourcesOptions, NativeSourceChangeSet } from './native-diff.js';
import type { SemanticSliceInput, CreateSemanticSliceOptions, SemanticSliceSourceMapLink, SemanticSliceSourceFile, SemanticSliceExpectedAssertion, SemanticSlice, TestSemanticSliceOptions, SemanticSliceTestAssertion, SemanticSliceTestResult } from './semantic-slice.js';
import type { CreateSemanticSliceAdmissionRecordOptions, SemanticSliceAdmissionRecord } from './semantic-slice-admission.js';
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export declare const FrontierCompileTargets: readonly FrontierCompileTarget[];
export declare const NativeImportRoundtripReadinessStatuses: readonly NativeImportRoundtripReadinessStatus[];
export declare const NativeImportTaxonomyKinds: readonly NativeImportTaxonomyKind[];
export declare const NativeImportLossKinds: readonly NativeImportKnownLossKind[];
export declare const NativeImportRegionTaxonomyKinds: readonly NativeImportRegionTaxonomyKind[];
export declare const ProjectionTargetLossClasses: readonly ProjectionTargetLossClass[];
export declare const NativeParserFeatureCategories: readonly NativeParserFeatureCategory[];
export declare const NativeParserFeatureCoverageStatuses: readonly NativeParserFeatureCoverageStatus[];
export declare const NativeImportReadinessBySeverity: Readonly<Record<NativeImportLossSummary['highestSeverity'], SemanticMergeReadiness>>;
export declare const NativeImportFeatureEvidencePolicies: Readonly<Record<string, NativeImportFeatureEvidencePolicy>>;
export declare const NativeImportLanguageProfiles: readonly NativeImportLanguageProfile[];
export declare const NativeParserAstFormatProfiles: readonly NativeParserAstFormatProfile[];
export declare const NativeParserAstFormats: readonly string[];
export declare const ExternalSemanticIndexFormats: readonly ExternalSemanticIndexFormat[];
export declare function normalizeCompileTarget(target?: string): FrontierCompileTarget;
export declare function compileFrontierSource(source: string, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function compileFrontierDocument(document: FrontierLangDocument, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function compileNativeSource(input: ImportNativeSourceOptions | NativeSourceImportResult, options?: CompileNativeSourceOptions): NativeSourceCompileResult;
export declare function projectFrontierAst(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): FrontierTargetAst;
export declare function renderTargetAst(ast: FrontierTargetAst, target?: FrontierCompileOptions['target']): string;
export declare function renderTargetAstWithSourceMap(ast: FrontierTargetAst, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): FrontierTargetSourceMapResult;
export declare function emitForTargetWithSourceMap(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): FrontierTargetDocumentSourceMapResult;
export declare function resolveCapabilityAdapters(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: { readonly platform?: string }): readonly CapabilityResolution[];
export declare function getNativeImportFeatureEvidencePolicy(kind: NativeImportKnownLossKind | string): NativeImportFeatureEvidencePolicy | undefined;
export declare function summarizeNativeImportFeatureEvidence(losses?: readonly NativeAstLossRecord[], options?: NativeImportLossSummaryOptions): NativeImportFeatureEvidenceSummary;
export declare function summarizeNativeImportLosses(losses?: readonly NativeAstLossRecord[], options?: NativeImportLossSummaryOptions): NativeImportLossSummary;
export declare function classifyNativeImportReadiness(losses?: readonly NativeAstLossRecord[], options?: NativeImportLossSummaryOptions): NativeImportReadinessClassification;
export declare function classifyNativeImportRoundtripReadiness(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: NativeImportRoundtripReadinessOptions): NativeImportRoundtripReadinessClassification;
export declare function createNativeImportCoverageMatrix(options?: NativeImportCoverageMatrixOptions): NativeImportCoverageMatrix;
export declare function getNativeParserAstFormatProfile(format?: string): NativeParserAstFormatProfile | undefined;
export declare function createNativeParserAstFormatMatrix(options?: NativeParserAstFormatMatrixOptions): NativeParserAstFormatMatrix;
export declare function createNativeParserFeatureMatrix(options?: NativeParserFeatureMatrixOptions): NativeParserFeatureMatrix;
export declare function queryNativeParserFeatureMatrix(matrixOrOptions?: NativeParserFeatureMatrix | NativeParserFeatureMatrixOptions, query?: NativeParserFeatureMatrixQuery): NativeParserFeatureMatrixQueryResult;
export declare function createProjectionTargetLossMatrix(options?: ProjectionTargetLossMatrixOptions): ProjectionTargetLossMatrix;
export declare function createUniversalCapabilityMatrix(options?: UniversalCapabilityMatrixOptions): UniversalCapabilityMatrix;
export declare function queryUniversalCapabilityMatrix(matrixOrOptions?: UniversalCapabilityMatrix | UniversalCapabilityMatrixOptions, query?: UniversalCapabilityMatrixQuery): UniversalCapabilityMatrixQueryResult;
export declare function createNativeSourcePreservation(options: CreateNativeSourcePreservationOptions): NativeSourcePreservation;
export declare function createSemanticImportSidecar(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: SemanticImportSidecarOptions): SemanticImportSidecar;
export declare function createNativeImportResultContract(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: NativeImportResultContractOptions): NativeImportResultContract;
export declare function createEstreeNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createBabelNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTypeScriptCompilerNativeImporterAdapter(options?: TypeScriptCompilerNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createPythonAstNativeImporterAdapter(options?: PythonAstNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createRustSynNativeImporterAdapter(options?: RustSynNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createClangAstNativeImporterAdapter(options?: ClangAstNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createGoAstNativeImporterAdapter(options?: GoAstNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createJavaAstNativeImporterAdapter(options?: JavaAstNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createKotlinPsiNativeImporterAdapter(options?: KotlinPsiNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createCSharpRoslynNativeImporterAdapter(options?: CSharpRoslynNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createSwiftSyntaxNativeImporterAdapter(options?: SwiftSyntaxNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTreeSitterNativeImporterAdapter(options?: TreeSitterNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function runNativeImporterAdapter(adapter: NativeImporterAdapter, input: RunNativeImporterAdapterOptions): Promise<NativeImporterAdapterImportResult>;
export declare function runNativeTargetProjectionAdapter(adapter: NativeTargetProjectionAdapter, input: NativeTargetProjectionAdapterInput): NativeTargetProjectionResult;
export declare function projectNativeImportToSource(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: ProjectNativeImportToSourceOptions): NativeSourceProjectionResult;
export declare function importExternalSemanticIndex(input: ImportExternalSemanticIndexOptions | SemanticIndexRecord): ExternalSemanticIndexImportResult;
export declare function importNativeSource(input: ImportNativeSourceOptions): NativeSourceImportResult;
export declare function diffNativeSources(input: DiffNativeSourcesOptions): NativeSourceChangeSet;
export declare function diffNativeSourceImports(input: DiffNativeSourceImportsOptions): NativeSourceChangeSet;
export declare function createSemanticSlice(input: SemanticSliceInput, options?: CreateSemanticSliceOptions): SemanticSlice;
export declare function testSemanticSlice(slice: SemanticSlice, options?: TestSemanticSliceOptions): SemanticSliceTestResult;
export declare function readSemanticSliceJson(source: string): SemanticSlice;
export declare function writeSemanticSliceJson(slice: SemanticSlice): string;
export declare function importNativeProject(input: ImportNativeProjectOptions): Promise<NativeProjectImportResult>;
export declare function createUniversalAstFromDocument(document: FrontierLangDocument, input?: {
  readonly id?: string;
  readonly nativeSources?: readonly NativeSourceNode[];
  readonly semanticIndex?: SemanticIndexRecord;
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly mergeCandidates?: readonly SemanticMergeCandidateRecord[];
  readonly layers?: UniversalAstLayerMap | readonly UniversalAstLayerRecord[];
  readonly universalDialectRegistry?: UniversalDialectRegistryInput | UniversalDialectRegistry;
  readonly dialects?: readonly UniversalDialectRecordInput[];
  readonly externs?: readonly UniversalExternRecordInput[];
  readonly metadata?: Record<string, unknown>;
}): FrontierUniversalAstEnvelope;
export declare function readUniversalAstJson(source: string): FrontierUniversalAstEnvelope;
export declare function writeUniversalAstJson(envelope: FrontierUniversalAstEnvelope): string;
export declare function emitForTarget(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): string;
