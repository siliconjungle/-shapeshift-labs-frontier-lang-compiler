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
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type NativeImporterAdapterExactness =
  | 'exact-parser-ast'
  | 'parser-tree'
  | 'adapter-reported-native-ast'
  | 'loss-aware-native-ast'
  | 'unknown'
  | string;

export interface NativeImporterAdapterSemanticCoverage {
  readonly level: 'native-ast' | 'declaration-index' | 'semantic-index' | string;
  readonly declarations: boolean;
  readonly symbols: boolean;
  readonly references: boolean;
  readonly types: boolean;
  readonly controlFlow: boolean;
}

export interface NativeImporterAdapterCoverageSnapshot {
  readonly exactness: NativeImporterAdapterExactness;
  readonly exactAst: boolean;
  readonly tokens: boolean;
  readonly trivia: boolean;
  readonly diagnostics: boolean;
  readonly sourceRanges: boolean;
  readonly generatedRanges: boolean;
  readonly semanticCoverage: NativeImporterAdapterSemanticCoverage;
}

export interface NativeImporterAdapterCoverageObserved {
  readonly exactness?: NativeImporterAdapterExactness;
  readonly exactAst?: boolean;
  readonly tokens?: boolean;
  readonly tokenCount?: number;
  readonly trivia?: boolean;
  readonly triviaCount?: number;
  readonly diagnostics: number;
  readonly parserDiagnostics?: number;
  readonly diagnosticErrors?: number;
  readonly diagnosticWarnings?: number;
  readonly diagnosticInfos?: number;
  readonly losses: number;
  readonly nativeAstNodes: number;
  readonly semanticSymbols: number;
  readonly semanticReferences?: number;
  readonly semanticTypes?: number;
  readonly semanticControlFlow?: number;
  readonly references?: boolean;
  readonly types?: boolean;
  readonly controlFlow?: boolean;
  readonly sourceMapMappings: number;
  readonly sourceRanges: boolean;
  readonly sourceRangeNodes?: number;
  readonly sourceRangeMappings?: number;
  readonly generatedRanges: boolean;
  readonly generatedRangeMappings?: number;
  readonly semanticCoverage?: NativeImporterAdapterSemanticCoverage;
}

export interface NativeImporterAdapterCoverageCapabilityRow {
  readonly capability: string;
  readonly declared: boolean;
  readonly observed: boolean;
  readonly effective: boolean;
  readonly count: number;
  readonly status: 'declared-and-observed' | 'declared-unobserved' | 'observed-undeclared' | 'absent';
}

export interface NativeImporterAdapterCoverageCapabilityEvidence {
  readonly declared: NativeImporterAdapterCoverageSnapshot;
  readonly observed: NativeImporterAdapterCoverageObserved;
  readonly effective: NativeImporterAdapterCoverageSnapshot;
  readonly capabilities: readonly NativeImporterAdapterCoverageCapabilityRow[];
  readonly gaps: readonly string[];
  readonly declaredOnly: readonly string[];
  readonly observedOnly: readonly string[];
  readonly parserDiagnostics: {
    readonly declared: boolean;
    readonly observed: boolean;
    readonly count: number;
    readonly errors: number;
    readonly warnings: number;
    readonly infos: number;
  };
  readonly sourceRanges: {
    readonly declared: boolean;
    readonly observed: boolean;
    readonly nativeAstNodes: number;
    readonly sourceRangeNodes: number;
    readonly sourceMapMappings: number;
    readonly sourceRangeMappings: number;
    readonly generatedRangeMappings: number;
  };
  readonly tokensTrivia: {
    readonly tokens: { readonly declared: boolean; readonly observed: boolean; readonly count: number };
    readonly trivia: { readonly declared: boolean; readonly observed: boolean; readonly count: number };
  };
  readonly semantic: {
    readonly level: {
      readonly declared: string;
      readonly observed: string;
      readonly effective: string;
    };
    readonly declarations: NativeImporterAdapterCoverageCapabilityRow;
    readonly symbols: NativeImporterAdapterCoverageCapabilityRow;
    readonly references: NativeImporterAdapterCoverageCapabilityRow;
    readonly types: NativeImporterAdapterCoverageCapabilityRow;
    readonly controlFlow: NativeImporterAdapterCoverageCapabilityRow;
  };
}

export interface NativeImporterAdapterCoverageSummary {
  readonly exactness: NativeImporterAdapterExactness;
  readonly exactAst: boolean;
  readonly tokens: boolean;
  readonly trivia: boolean;
  readonly diagnostics: boolean;
  readonly sourceRanges: boolean;
  readonly generatedRanges: boolean;
  readonly semanticCoverage: NativeImporterAdapterSemanticCoverage;
  readonly notes: readonly string[];
  readonly declared?: NativeImporterAdapterCoverageSnapshot;
  readonly observed?: NativeImporterAdapterCoverageObserved;
  readonly capabilityEvidence?: NativeImporterAdapterCoverageCapabilityEvidence;
}

export type NativeImporterAdapterCoverageInput =
  Omit<Partial<NativeImporterAdapterCoverageSummary>, 'semanticCoverage' | 'observed' | 'declared' | 'capabilityEvidence'> & {
    readonly semanticCoverage?: Partial<NativeImporterAdapterSemanticCoverage>;
    readonly observed?: Partial<NativeImporterAdapterCoverageObserved>;
  };
