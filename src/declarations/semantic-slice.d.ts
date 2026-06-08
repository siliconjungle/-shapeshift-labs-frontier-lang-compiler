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
import type { NativeImporterAdapterExactness, NativeImporterAdapterSemanticCoverage, NativeImporterAdapterCoverageSnapshot, NativeImporterAdapterCoverageObserved, NativeImporterAdapterCoverageCapabilityRow, NativeImporterAdapterCoverageCapabilityEvidence, NativeImporterAdapterCoverageSummary, NativeImporterAdapterCoverageInput } from './adapter-coverage.js';
import type { NativeImporterAdapterDiagnostic, ImportNativeSourceOptions, NativeSourceImportResult, ExternalSemanticIndexFormat, ImportExternalSemanticIndexOptions, ExternalSemanticIndexImportSummary, ExternalSemanticIndexImportResult, NativeImporterAdapterParseInput, NativeImporterAdapterParseResult, NativeImporterAdapter, NativeImporterAdapterSummary, RunNativeImporterAdapterOptions, NativeImporterAdapterImportResult } from './import-adapter-core.js';
import type { JavaScriptNativeImporterAdapterOptions, TypeScriptCompilerNativeImporterAdapterOptions, PythonAstNativeImporterAdapterOptions, RustSynNativeImporterAdapterOptions, ClangAstNativeImporterAdapterOptions, GoAstNativeImporterAdapterOptions } from './import-adapter-options-native.js';
import type { JavaAstNativeImporterAdapterOptions, KotlinPsiNativeImporterAdapterOptions, CSharpRoslynNativeImporterAdapterOptions, SwiftSyntaxNativeImporterAdapterOptions, TreeSitterNativeImporterAdapterOptions } from './import-adapter-options-platform.js';
import type { NativeTargetProjectionAdapterCoverageInput, NativeTargetProjectionAdapterSummary, NativeTargetProjectionAdapterInput, NativeTargetProjectionAdapterResult, NativeTargetProjectionAdapter, NativeTargetProjectionAdapterResolverInput, NativeTargetProjectionResult } from './target-adapters.js';
import type { NativeProjectSourceInput, ImportNativeProjectOptions, NativeProjectImportResult, NativeSourceProjectionMode, ProjectNativeImportToSourceOptions, NativeSourceProjectionDeclaration, NativeSourceProjectionResult, NativeSourceCompileOutputMode, CompileNativeSourceOptions, NativeSourceCompileResult } from './native-project.js';
import type { NativeImportRoundtripReadinessStatus, NativeImportRoundtripReadinessOptions, NativeImportRoundtripReadinessClassification } from './roundtrip.js';

export type SemanticSliceInput =
  | NativeSourceImportResult
  | NativeProjectImportResult
  | ImportNativeSourceOptions
  | FrontierUniversalAstEnvelope
  | SemanticImportSidecar
  | {
    readonly import?: NativeSourceImportResult | NativeProjectImportResult | ImportNativeSourceOptions;
    readonly importResult?: NativeSourceImportResult | NativeProjectImportResult | ImportNativeSourceOptions;
    readonly universalAst?: FrontierUniversalAstEnvelope;
    readonly sidecar?: SemanticImportSidecar;
    readonly source?: ImportNativeSourceOptions;
  };

export interface SemanticSliceSourceHashExpectation {
  readonly path?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly hash?: string;
  readonly expected?: string;
}

export type SemanticSliceSourceHashExpectations =
  | Readonly<Record<string, string>>
  | ReadonlyMap<string, string>
  | readonly (SemanticSliceSourceHashExpectation | readonly [string | undefined, string])[];

export interface CreateSemanticSliceOptions {
  readonly id?: string;
  readonly generatedAt?: number;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceText?: string;
  readonly symbol?: string;
  readonly region?: string;
  readonly nativeNodeId?: string;
  readonly expectedSymbols?: readonly string[] | string;
  readonly expectedSymbolRefs?: readonly string[] | string;
  readonly expectedRegions?: readonly string[] | string;
  readonly expectedRegionRefs?: readonly string[] | string;
  readonly expectedSourceHashes?: SemanticSliceSourceHashExpectations;
  readonly expectedSymbolCount?: number;
  readonly expectedRegionCount?: number;
  readonly expectedSourceFileCount?: number;
  readonly entryRefs?: readonly string[] | string;
  readonly semanticRefs?: readonly string[] | string;
  readonly refs?: readonly string[] | string;
  readonly includeDependencies?: boolean;
  readonly maxDependencyDepth?: number;
  readonly includeSourceText?: boolean;
  readonly maxExcerptBytes?: number;
  readonly focusedCommands?: readonly string[] | string;
  readonly fixtureHints?: readonly string[] | string;
  readonly regionPrefix?: string;
  readonly evidenceId?: string;
  readonly mergeCandidateId?: string;
  readonly sidecar?: SemanticImportSidecar;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticSliceSourceMapLink {
  readonly id?: string;
  readonly sourceMapId?: string;
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

export interface SemanticSliceSourceFile {
  readonly path?: string;
  readonly sourceHash?: string;
  readonly spans: readonly SourceSpan[];
  readonly spanCount: number;
  readonly excerptCount: number;
  readonly sourceTextAvailable: boolean;
  readonly excerpts: readonly {
    readonly span: SourceSpan;
    readonly text: string;
    readonly textHash: string;
    readonly truncated: boolean;
  }[];
}

export interface SemanticSliceExpectedAssertion {
  readonly id: string;
  readonly category?: 'symbol' | 'region' | 'sourceHash' | 'summaryCount' | string;
  readonly ref?: string;
  readonly path?: string;
  readonly key?: string;
  readonly expected: unknown;
  readonly actual?: unknown;
}

export interface SemanticSlice {
  readonly kind: 'frontier.lang.semanticSlice';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly importId?: string;
  readonly universalAstId?: string;
  readonly semanticIndexId?: string;
  readonly sidecarId?: string;
  readonly entryRefs: readonly string[];
  readonly matchedEntryRefs: readonly string[];
  readonly unresolvedEntryRefs: readonly string[];
  readonly symbols: readonly (SemanticIndexRecord['symbols'][number] | SemanticImportSidecarSymbol)[];
  readonly ownershipRegions: readonly SemanticImportOwnershipRegion[];
  readonly nativeNodes: readonly NativeAstNode[];
  readonly relations: readonly SemanticIndexRecord['relations'][number][];
  readonly occurrences: readonly SemanticIndexRecord['occurrences'][number][];
  readonly sourceMapLinks: readonly SemanticSliceSourceMapLink[];
  readonly sourceSpans: readonly SourceSpan[];
  readonly sourceFiles: readonly SemanticSliceSourceFile[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly mergeCandidate: SemanticMergeCandidateRecord;
  readonly verification: {
    readonly focusedCommands: readonly string[];
    readonly fixtureHints: readonly string[];
    readonly expectedAssertions: readonly SemanticSliceExpectedAssertion[];
  };
  readonly summary: {
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly nativeNodes: number;
    readonly relations: number;
    readonly occurrences: number;
    readonly sourceMapLinks: number;
    readonly sourceFiles: number;
    readonly losses: number;
    readonly conflictKeys: number;
    readonly readiness: SemanticMergeReadiness;
    readonly unresolvedEntryRefs: number;
    readonly sourceTextAvailable: boolean;
  };
  readonly mergeAdmission: {
    readonly autoMergeClaim: false;
    readonly reviewRequired: boolean;
    readonly readiness: SemanticMergeReadiness;
    readonly reasons: readonly string[];
    readonly conflictKeys: readonly string[];
    readonly ownershipKeys: readonly string[];
    readonly sourceHashes: readonly { readonly path?: string; readonly sourceHash?: string }[];
    readonly staleCheck: {
      readonly mode: 'source-hash' | string;
      readonly requiresCurrentSource: boolean;
      readonly sourceFiles: number;
    };
  };
  readonly metadata?: Record<string, unknown>;
}

export interface TestSemanticSliceOptions {
  readonly id?: string;
  readonly generatedAt?: number;
  readonly requireSourceMapLinks?: boolean;
  readonly currentSources?: Readonly<Record<string, string>> | ReadonlyMap<string, string>;
  readonly expectedSymbols?: readonly string[] | string;
  readonly expectedSymbolRefs?: readonly string[] | string;
  readonly expectedRegions?: readonly string[] | string;
  readonly expectedRegionRefs?: readonly string[] | string;
  readonly expectedSourceHashes?: SemanticSliceSourceHashExpectations;
  readonly expectedSymbolCount?: number;
  readonly expectedRegionCount?: number;
  readonly expectedSourceFileCount?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticSliceTestAssertion {
  readonly id: string;
  readonly status: 'passed' | 'warning' | 'failed';
  readonly summary: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticSliceTestResult {
  readonly kind: 'frontier.lang.semanticSliceTestResult';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly sliceId?: string;
  readonly status: 'passed' | 'needs-review' | 'failed';
  readonly readiness: SemanticMergeReadiness;
  readonly assertions: readonly SemanticSliceTestAssertion[];
  readonly summary: {
    readonly assertions: number;
    readonly passed: number;
    readonly warnings: number;
    readonly failed: number;
    readonly sourceHashChecks: number;
    readonly expectedAssertions: number;
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly sourceMapLinks: number;
  };
  readonly metadata?: Record<string, unknown>;
}
