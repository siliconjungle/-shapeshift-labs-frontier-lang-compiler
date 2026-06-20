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

export type NativeSourceTokenKind =
  | 'identifier'
  | 'keyword'
  | 'number'
  | 'string'
  | 'template'
  | 'regex-like'
  | 'jsx'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'source-map-comment'
  | 'whitespace'
  | 'newline'
  | 'shebang'
  | 'directive'
  | 'unknown'
  | string;

export interface NativeSourcePreservedToken {
  readonly id: string;
  readonly kind: NativeSourceTokenKind;
  readonly text?: string;
  readonly textHash: string;
  readonly span: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourcePreservedDirective {
  readonly id: string;
  readonly kind: string;
  readonly text?: string;
  readonly textHash: string;
  readonly span: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export type NativeSourceLedgerSpanRole =
  | 'token'
  | 'trivia'
  | 'comment'
  | 'directive'
  | 'module-keyword'
  | 'brace'
  | 'protected'
  | string;

export interface NativeSourceLedgerSpan {
  readonly id: string;
  readonly kind: string;
  readonly role: NativeSourceLedgerSpanRole;
  readonly text?: string;
  readonly textHash: string;
  readonly span: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourceLedgerSummary {
  readonly spans: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly comments: number;
  readonly shebangs: number;
  readonly directives: number;
  readonly sourceMapComments: number;
  readonly importExportSpans: number;
  readonly braces: number;
  readonly protectedRegions: number;
  readonly stringRegions: number;
  readonly templateRegions: number;
  readonly regexLikeRegions: number;
  readonly jsxRegions: number;
  readonly triviaByKind?: Record<string, number>;
  readonly tokenByKind?: Record<string, number>;
  readonly directiveByKind?: Record<string, number>;
  readonly truncated: boolean;
}

export interface NativeSourceLedger {
  readonly kind: 'frontier.lang.jsTsSourceLedger';
  readonly version: 1;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash: string;
  readonly spans: readonly NativeSourceLedgerSpan[];
  readonly tokens: readonly NativeSourceLedgerSpan[];
  readonly trivia: readonly NativeSourceLedgerSpan[];
  readonly comments: readonly NativeSourceLedgerSpan[];
  readonly shebangs: readonly NativeSourceLedgerSpan[];
  readonly directives: readonly NativeSourceLedgerSpan[];
  readonly importExportSpans: readonly NativeSourceLedgerSpan[];
  readonly braces: readonly NativeSourceLedgerSpan[];
  readonly protectedRegions: readonly NativeSourceLedgerSpan[];
  readonly summary: NativeSourceLedgerSummary;
}

export interface NativeSourcePreservation {
  readonly kind: 'frontier.lang.nativeSourcePreservation';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash: string;
  readonly sourceBytes: number;
  readonly lineCount: number;
  readonly newline: 'lf' | 'crlf' | 'mixed' | 'none';
  readonly encoding: string;
  readonly sourceText?: string;
  readonly tokens: readonly NativeSourcePreservedToken[];
  readonly trivia: readonly NativeSourcePreservedToken[];
  readonly directives: readonly NativeSourcePreservedDirective[];
  readonly ledger?: NativeSourceLedger;
  readonly summary: {
    readonly tokens: number;
    readonly trivia: number;
    readonly directives: number;
    readonly comments: number;
    readonly whitespace: number;
    readonly ledger?: NativeSourceLedgerSummary;
    readonly sourceMapComments?: number;
    readonly protectedRegions?: number;
    readonly importExportSpans?: number;
    readonly braces?: number;
    readonly exactSourceAvailable: boolean;
    readonly truncated: boolean;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface CreateNativeSourcePreservationOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceText: string;
  readonly encoding?: string;
  readonly includeSourceText?: boolean;
  readonly includeTokens?: boolean;
  readonly includeTrivia?: boolean;
  readonly includeDirectives?: boolean;
  readonly includeSourceLedger?: boolean;
  readonly maxTokens?: number;
  readonly maxTrivia?: number;
  readonly maxDirectives?: number;
  readonly maxLedgerSpans?: number;
  readonly metadata?: Record<string, unknown>;
}
