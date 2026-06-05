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
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';
import type { Diagnostic } from '@shapeshift-labs/frontier-lang-checker';
import type { EmitTypeScriptOptions, TypeScriptAstModule, TypeScriptDocumentSourceMapResult, TypeScriptGeneratedSourceMapResult } from '@shapeshift-labs/frontier-lang-typescript';
import type { EmitJavaScriptOptions, EmitJavaScriptWithSourceMapResult, JavaScriptAstModule, JavaScriptSourceMapResult } from '@shapeshift-labs/frontier-lang-javascript';
import type { EmitRustOptions, EmitRustWithSourceMapResult, RustAstModule, RustSourceMapResult } from '@shapeshift-labs/frontier-lang-rust';
import type { EmitPythonOptions, EmitPythonWithSourceMapResult, PythonAstModule, PythonSourceMapResult } from '@shapeshift-labs/frontier-lang-python';
import type { CAstHeader, CSourceMapResult, EmitCHeaderOptions, EmitCHeaderWithSourceMapResult } from '@shapeshift-labs/frontier-lang-c';

export type FrontierCompileTarget = 'typescript' | 'javascript' | 'rust' | 'python' | 'c';

export type FrontierCompileEmitOptions =
  | EmitTypeScriptOptions
  | EmitJavaScriptOptions
  | EmitRustOptions
  | EmitPythonOptions
  | EmitCHeaderOptions;

export type FrontierTargetAst =
  | TypeScriptAstModule
  | JavaScriptAstModule
  | RustAstModule
  | PythonAstModule
  | CAstHeader;

export type FrontierTargetSourceMapResult =
  | TypeScriptGeneratedSourceMapResult
  | JavaScriptSourceMapResult
  | RustSourceMapResult
  | PythonSourceMapResult
  | CSourceMapResult;

export type FrontierTargetDocumentSourceMapResult =
  | TypeScriptDocumentSourceMapResult
  | EmitJavaScriptWithSourceMapResult
  | EmitRustWithSourceMapResult
  | EmitPythonWithSourceMapResult
  | EmitCHeaderWithSourceMapResult;

export interface FrontierCompileOptions {
  readonly target?: FrontierCompileTarget | 'ts' | 'js' | 'rs' | 'py' | 'h';
  readonly fileName?: string;
  readonly parse?: Record<string, unknown>;
  readonly check?: Record<string, unknown>;
  readonly emit?: FrontierCompileEmitOptions;
  readonly emitOnError?: boolean;
}

export interface FrontierCompileResult {
  readonly ok: boolean;
  readonly target: FrontierCompileTarget;
  readonly hash: string;
  readonly document: FrontierLangDocument;
  readonly diagnostics: readonly Diagnostic[];
  readonly ast?: FrontierTargetAst;
  readonly output: string;
}

export interface CapabilityResolution {
  readonly nodeId: string;
  readonly name: string;
  readonly capability: string;
  readonly target: CompileTarget;
  readonly status: 'bound' | 'unsupported' | 'unbound';
  readonly adapters: readonly CapabilityAdapterBinding[];
  readonly unsupported?: CapabilityUnsupportedTarget;
  readonly reason?: string;
}

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

export type NativeParserAstFormatKind =
  | 'abstract-ast'
  | 'concrete-syntax-tree'
  | 'compiler-ast'
  | 'semantic-index'
  | string;

export interface NativeParserAstFormatProfile {
  readonly id: string;
  readonly aliases: readonly string[];
  readonly kind: NativeParserAstFormatKind;
  readonly languages: readonly (FrontierSourceLanguage | 'mixed' | string)[];
  readonly parserAdapters: readonly string[];
  readonly exactness: NativeImporterAdapterExactness;
  readonly sourceRangeModel: string;
  readonly preservesTokens: boolean;
  readonly preservesTrivia: boolean;
  readonly supportsIncremental: boolean;
  readonly supportsErrorRecovery: boolean;
  readonly notes: readonly string[];
}

export interface NativeParserAstFormatCoverage {
  readonly id: string;
  readonly kind: NativeParserAstFormatKind;
  readonly languages: readonly (FrontierSourceLanguage | 'mixed' | string)[];
  readonly parserAdapters: readonly string[];
  readonly exactness: NativeImporterAdapterExactness;
  readonly sourceRangeModel: string;
  readonly preservesTokens: boolean;
  readonly preservesTrivia: boolean;
  readonly supportsIncremental: boolean;
  readonly supportsErrorRecovery: boolean;
  readonly notes: readonly string[];
  readonly adapters: {
    readonly total: number;
    readonly ids: readonly string[];
    readonly parsers: readonly string[];
    readonly effectiveCapabilities: Readonly<Record<string, number>>;
  };
  readonly imports: {
    readonly total: number;
    readonly sourcePaths: readonly string[];
    readonly readiness: SemanticMergeReadiness;
    readonly nativeAstNodes: number;
    readonly symbols: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
  };
}

export interface NativeParserAstFormatMatrix {
  readonly kind: 'frontier.lang.nativeParserAstFormatMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly formats: readonly NativeParserAstFormatCoverage[];
  readonly summary: {
    readonly formats: number;
    readonly adapterSlots: number;
    readonly adapters: number;
    readonly imports: number;
    readonly nativeAstNodes: number;
    readonly symbols: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly byReadiness: Readonly<Record<string, number>>;
    readonly effectiveCapabilities: Readonly<Record<string, number>>;
  };
  readonly metadata: {
    readonly note: string;
    readonly profileIds: readonly string[];
  };
}

export interface NativeParserAstFormatMatrixOptions {
  readonly formats?: readonly NativeParserAstFormatProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly generatedAt?: number;
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

export interface NativeImportCoverageLanguage {
  readonly language: FrontierSourceLanguage;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly parserAdapters: readonly string[];
  readonly projectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
  readonly adapterCoverage: NativeImporterAdapterCoverageAggregate;
  readonly imports: {
    readonly total: number;
    readonly parsers: readonly string[];
    readonly readiness: SemanticMergeReadiness;
    readonly readinessReasons: readonly string[];
    readonly symbols: number;
    readonly sourceMaps: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly lossKinds: Readonly<Record<string, number>>;
    readonly lossCategories: readonly NativeImportTaxonomyKind[];
  };
}

export interface NativeImportCoverageMatrix {
  readonly kind: 'frontier.lang.nativeImportCoverageMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly languages: readonly NativeImportCoverageLanguage[];
  readonly summary: {
    readonly languages: number;
    readonly lightweightScanners: number;
    readonly parserAdapterSlots: number;
    readonly imports: number;
    readonly symbols: number;
    readonly sourceMaps: number;
    readonly sourceMapMappings: number;
    readonly losses: number;
    readonly byReadiness: Readonly<Record<string, number>>;
    readonly lossKinds: Readonly<Record<string, number>>;
    readonly adapterCoverage: NativeImporterAdapterCoverageAggregate;
  };
  readonly metadata: {
    readonly compileTargets: readonly FrontierCompileTarget[];
    readonly projectionTargetLossClasses: readonly ProjectionTargetLossClass[];
    readonly note: string;
  };
}

export interface NativeImportCoverageMatrixOptions {
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly generatedAt?: number;
}

export type ProjectionTargetLossClass =
  | 'exactSourceProjection'
  | 'nativeSourceStubs'
  | 'unsupportedTargetFeatures'
  | 'targetAdapterProjection'
  | 'missingAdapter'
  | string;

export interface ProjectionSourceProjectionCoverage {
  readonly lossClass: ProjectionTargetLossClass;
  readonly mode: NativeSourceProjectionMode;
  readonly supported: boolean;
  readonly readiness: SemanticMergeReadiness;
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly reason: string;
  readonly evidence: {
    readonly imports: number;
    readonly importsWithExactSource?: number;
    readonly importsWithDeclarations?: number;
  };
  readonly notes: readonly string[];
}

export interface ProjectionTargetCoverageEntry {
  readonly target: FrontierCompileTarget | string;
  readonly lossClass: ProjectionTargetLossClass;
  readonly supported: boolean;
  readonly readiness: SemanticMergeReadiness;
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly reason: string;
  readonly adapter?: string;
  readonly adapterKind?: 'importer' | 'targetProjection' | string;
  readonly adapterVersion?: string;
  readonly adapterCoverage?: NativeTargetProjectionAdapterCoverageInput;
  readonly notes: readonly string[];
}

export interface ProjectionTargetLanguageCoverage {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly parserAdapters: readonly string[];
  readonly projectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
  readonly sourceProjection: {
    readonly exactSource: ProjectionSourceProjectionCoverage;
    readonly stubs: ProjectionSourceProjectionCoverage;
  };
  readonly targets: readonly ProjectionTargetCoverageEntry[];
  readonly summary: {
    readonly imports: number;
    readonly parserAdapters: number;
    readonly targetEntries: number;
    readonly byLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly exactSourceImports: number;
    readonly stubDeclarationImports: number;
  };
}

export interface ProjectionTargetLossMatrix {
  readonly kind: 'frontier.lang.projectionTargetLossMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly languages: readonly ProjectionTargetLanguageCoverage[];
  readonly summary: {
    readonly languages: number;
    readonly targetEntries: number;
    readonly byLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly sourceProjectionByLossClass: Readonly<Record<ProjectionTargetLossClass, number>>;
    readonly exactSourceProjection: number;
    readonly nativeSourceStubs: number;
    readonly targetAdapterProjection: number;
    readonly unsupportedTargetFeatures: number;
    readonly missingAdapters: number;
  };
  readonly metadata: {
    readonly compileTargets: readonly (FrontierCompileTarget | string)[];
    readonly lossClasses: readonly ProjectionTargetLossClass[];
    readonly note: string;
  };
}

export interface ProjectionTargetLossMatrixOptions {
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly targetAdapters?: readonly NativeTargetProjectionAdapter[];
  readonly targets?: readonly (FrontierCompileTarget | string)[];
  readonly generatedAt?: number;
}

export interface NativeImportContractSource {
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly parser?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly patchId?: string;
  readonly sourceMapIds: readonly string[];
  readonly sourceMapMappings: number;
  readonly symbolCount: number;
  readonly lossCount: number;
  readonly evidenceCount: number;
  readonly readiness?: SemanticMergeReadiness;
}

export interface NativeImportSourcePreservationRecordSummary {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceBytes?: number;
  readonly lineCount?: number;
  readonly newline?: string;
  readonly encoding?: string;
  readonly exactSourceAvailable: boolean;
  readonly tokens: number;
  readonly trivia: number;
  readonly directives: number;
  readonly comments: number;
  readonly whitespace: number;
  readonly truncated: boolean;
}

export interface NativeImportSourcePreservationContract {
  readonly total: number;
  readonly ids: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly sourceHashes: readonly string[];
  readonly exactSourceAvailable: number;
  readonly sourceBytes: number;
  readonly lineCount: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly directives: number;
  readonly comments: number;
  readonly whitespace: number;
  readonly truncated: boolean;
  readonly records: readonly NativeImportSourcePreservationRecordSummary[];
}

export interface NativeImportAdapterCoverageRecordSummary {
  readonly adapterId?: string;
  readonly adapterVersion?: string;
  readonly parser?: string;
  readonly capabilities: readonly string[];
  readonly supportedExtensions: readonly string[];
  readonly exactness?: NativeImporterAdapterExactness;
  readonly exactAst: boolean;
  readonly tokens: boolean;
  readonly trivia: boolean;
  readonly diagnostics: boolean;
  readonly sourceRanges: boolean;
  readonly generatedRanges: boolean;
  readonly semanticCoverage?: NativeImporterAdapterSemanticCoverage;
  readonly observed?: NativeImporterAdapterCoverageObserved;
  readonly notes: readonly string[];
}

export interface NativeImportAdapterCoverageContract {
  readonly total: number;
  readonly adapterIds: readonly string[];
  readonly parsers: readonly string[];
  readonly exactness: readonly string[];
  readonly exactAst: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly diagnostics: number;
  readonly sourceRanges: number;
  readonly generatedRanges: number;
  readonly semanticCoverageLevels: readonly string[];
  readonly observed: NativeImporterAdapterCoverageObserved;
  readonly records: readonly NativeImportAdapterCoverageRecordSummary[];
}

export interface NativeImportRegionSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly keys: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly byGranularity: Readonly<Record<string, number>>;
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly byLanguage: Readonly<Record<string, number>>;
  readonly symbolIds: readonly string[];
  readonly taxonomy: SemanticImportRegionTaxonomySummary;
}

export interface NativeImportSourceMapSummary {
  readonly total: number;
  readonly ids: readonly string[];
  readonly mappingCount: number;
  readonly sourcePaths: readonly string[];
  readonly targetPaths: readonly string[];
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly sourceRangeMappings: number;
  readonly generatedRangeMappings: number;
}

export interface NativeImportReadinessContract {
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly severityReadiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly failedEvidenceIds: readonly string[];
  readonly blockingLossIds: readonly string[];
  readonly reviewLossIds: readonly string[];
  readonly informationalLossIds: readonly string[];
}

export interface NativeImportResultContract {
  readonly kind: 'frontier.lang.nativeImportResultContract';
  readonly version: 1;
  readonly importResultId?: string;
  readonly language?: FrontierSourceLanguage | 'mixed' | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceCount: number;
  readonly sources: readonly NativeImportContractSource[];
  readonly ids: {
    readonly nativeSourceId?: string;
    readonly nativeAstId?: string;
    readonly semanticIndexId?: string;
    readonly universalAstId?: string;
    readonly patchId?: string;
    readonly sourceMapIds: readonly string[];
    readonly semanticSidecarIds: readonly string[];
  };
  readonly sourcePreservation: NativeImportSourcePreservationContract;
  readonly adapterCoverage: NativeImportAdapterCoverageContract;
  readonly lossSummary: NativeImportLossSummary;
  readonly regions: NativeImportRegionSummary;
  readonly sourceMaps: NativeImportSourceMapSummary;
  readonly readiness: NativeImportReadinessContract;
  readonly evidence: {
    readonly total: number;
    readonly failed: readonly string[];
    readonly ids: readonly string[];
  };
  readonly metadata: Record<string, unknown>;
}

export interface NativeImportResultContractOptions extends SemanticImportSidecarOptions {
  readonly lossSummary?: NativeImportLossSummary;
  readonly semanticSidecarIds?: readonly string[] | string;
  readonly sidecarIds?: readonly string[] | string;
  readonly sidecarId?: string;
}

export type NativeSourceTokenKind =
  | 'identifier'
  | 'keyword'
  | 'number'
  | 'string'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'whitespace'
  | 'newline'
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
  readonly summary: {
    readonly tokens: number;
    readonly trivia: number;
    readonly directives: number;
    readonly comments: number;
    readonly whitespace: number;
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
  readonly maxTokens?: number;
  readonly maxTrivia?: number;
  readonly maxDirectives?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticImportOwnershipRegion {
  readonly id: string;
  readonly key: string;
  readonly regionKind?: NativeImportRegionTaxonomyKind;
  readonly granularity: 'symbol' | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly documentId?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly precision?: 'exact' | 'declaration' | 'line' | 'estimated' | 'unknown' | string;
  readonly mergePolicy?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticImportSidecarSymbol {
  readonly id: string;
  readonly name?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly nativeAstNodeId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapMappingId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly signatureHash?: string;
  readonly ownershipRegionId: string;
  readonly ownershipKey: string;
  readonly ownershipRegionKind?: NativeImportRegionTaxonomyKind;
  readonly readiness: SemanticMergeReadiness;
}

export interface SemanticImportRegionTaxonomySummary {
  readonly kinds: readonly NativeImportRegionTaxonomyKind[];
  readonly presentKinds: readonly NativeImportRegionTaxonomyKind[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly keys: readonly string[];
  readonly keysByKind: Readonly<Record<string, readonly string[]>>;
}

export interface SemanticImportPatchHint {
  readonly id: string;
  readonly kind: 'source-region-patch' | string;
  readonly ownershipRegionId: string;
  readonly ownershipKey: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly readiness: SemanticMergeReadiness;
  readonly precision?: string;
  readonly supportedOperations: readonly string[];
  readonly projection: {
    readonly sourceLanguage?: FrontierSourceLanguage | string;
    readonly targetPath?: string;
    readonly requiresSourceMap: boolean;
  };
}

export interface SemanticImportSidecarImportEntry {
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly parser?: string;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly symbolCount: number;
  readonly sourceMapCount: number;
  readonly sourceMapMappingCount: number;
  readonly readiness: SemanticMergeReadiness;
  readonly emptySemanticIndex: boolean;
  readonly regionTaxonomy?: SemanticImportRegionTaxonomySummary;
}

export interface SemanticImportSidecar {
  readonly kind: 'frontier.lang.semanticImportSidecar';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number;
  readonly language?: FrontierSourceLanguage | 'mixed' | string;
  readonly projectRoot?: string;
  readonly imports: readonly SemanticImportSidecarImportEntry[];
  readonly symbols: readonly SemanticImportSidecarSymbol[];
  readonly ownershipRegions: readonly SemanticImportOwnershipRegion[];
  readonly sourceMaps: {
    readonly total: number;
    readonly mappings: number;
    readonly ids: readonly string[];
  };
  readonly patchHints: readonly SemanticImportPatchHint[];
  readonly mergeCandidates: readonly {
    readonly id?: string;
    readonly readiness?: SemanticMergeReadiness;
    readonly reasons: readonly string[];
    readonly risk?: string;
    readonly operationCount: number;
  }[];
  readonly losses: {
    readonly total: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly bySeverity: Readonly<Record<string, number>>;
    readonly categories: readonly NativeImportTaxonomyKind[];
    readonly blockingLossIds: readonly string[];
    readonly reviewLossIds: readonly string[];
  };
  readonly regionTaxonomy: SemanticImportRegionTaxonomySummary;
  readonly evidence: {
    readonly total: number;
    readonly failed: readonly string[];
    readonly ids: readonly string[];
  };
  readonly summary: {
    readonly imports: number;
    readonly symbols: number;
    readonly ownershipRegions: number;
    readonly regionKinds: number;
    readonly sourceMapMappings: number;
    readonly readiness: SemanticMergeReadiness;
    readonly emptySemanticIndex: boolean;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticImportSidecarOptions {
  readonly id?: string;
  readonly generatedAt?: number;
  readonly regionPrefix?: string;
  readonly targetPath?: string;
  readonly metadata?: Record<string, unknown>;
}

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
  readonly mergeCandidate: SemanticMergeCandidateRecord;
  readonly evidence: readonly EvidenceRecord[];
  readonly readiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly semanticIndex?: SemanticIndexRecord;
  readonly losses: readonly NativeAstLossRecord[];
  readonly summary: NativeSourceChangeSummary;
  readonly metadata?: Record<string, unknown> & {
    readonly changedRegionProjectionSummary?: NativeSourceChangeProjectionSummary;
  };
}

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

export interface NativeImporterAdapterDiagnostic {
  readonly id?: string;
  readonly severity?: 'info' | 'warning' | 'error';
  readonly code?: string;
  readonly phase?: 'read' | 'parse' | 'map' | 'index' | 'import' | string;
  readonly kind?: NativeAstLossRecord['kind'];
  readonly message: string;
  readonly path?: string;
  readonly span?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
}

export interface ImportNativeSourceOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly parserVersion?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceText?: string;
  readonly symbol?: string;
  readonly name?: string;
  readonly nativeAst?: NativeAstRecord;
  readonly nativeAstId?: string;
  readonly nativeAstMetadata?: Record<string, unknown>;
  readonly nativeSourceId?: string;
  readonly nativeSourceMetadata?: Record<string, unknown>;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly documentMetadata?: Record<string, unknown>;
  readonly rootId?: string;
  readonly rootIds?: readonly string[];
  readonly nodes?: Readonly<Record<string, NativeAstNode>>;
  readonly semanticNodes?: readonly SemanticNode[];
  readonly frontierNodeIds?: readonly string[];
  readonly mappings?: readonly SourceMapMappingRecord[];
  readonly semanticStatus?: 'native-only' | 'mapped' | 'partial' | string;
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly evidenceId?: string;
  readonly sourcePreservation?: NativeSourcePreservation;
  readonly patch?: SemanticPatchBundle;
  readonly patchId?: string;
  readonly author?: string;
  readonly target?: CompileTarget;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly sourceMapId?: string;
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly universalAstId?: string;
  readonly universalAstMetadata?: Record<string, unknown>;
  readonly exactAst?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export type NativeSourceImportResult = LanguageImportResult & {
  readonly nativeSource: NativeSourceNode;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
};

export type ExternalSemanticIndexFormat =
  | 'frontier-semantic-index'
  | 'scip'
  | 'lsif'
  | 'lsp'
  | 'semanticdb'
  | string;

export interface ImportExternalSemanticIndexOptions {
  readonly format?: ExternalSemanticIndexFormat;
  readonly payload?: unknown;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly id?: string;
  readonly semanticIndexId?: string;
  readonly universalAstId?: string;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly sourceMapId?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly projectRoot?: string;
  readonly parser?: string;
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: Record<string, unknown>;
  readonly universalAstMetadata?: Record<string, unknown>;
}

export interface ExternalSemanticIndexImportSummary {
  readonly documents: number;
  readonly symbols: number;
  readonly occurrences: number;
  readonly relations: number;
  readonly facts: number;
  readonly sourceMapMappings: number;
  readonly losses: number;
  readonly readiness: SemanticMergeReadiness;
}

export interface ExternalSemanticIndexImportResult {
  readonly kind: 'frontier.lang.externalSemanticIndexImport';
  readonly version: 1;
  readonly id: string;
  readonly format: ExternalSemanticIndexFormat;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly projectRoot?: string;
  readonly semanticIndex: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly readiness: NativeImportReadinessClassification;
  readonly summary: ExternalSemanticIndexImportSummary;
  readonly metadata: Record<string, unknown>;
}

export interface NativeImporterAdapterParseInput {
  readonly sourceText: string;
  readonly sourcePath?: string;
  readonly sourceHash: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly parserVersion?: string;
  readonly adapterId: string;
  readonly adapterVersion?: string;
  readonly options: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
}

export interface NativeImporterAdapterParseResult extends Omit<ImportNativeSourceOptions, 'language' | 'parser' | 'parserVersion' | 'sourceText'> {
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
}

export interface NativeImporterAdapter {
  readonly id: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly coverage?: NativeImporterAdapterCoverageInput;
  readonly supportedExtensions?: readonly string[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly parse: (input: NativeImporterAdapterParseInput) => NativeImporterAdapterParseResult | Promise<NativeImporterAdapterParseResult>;
}

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

export interface NativeImporterAdapterSummary {
  readonly id: string;
  readonly language: FrontierSourceLanguage;
  readonly parser: string;
  readonly version?: string;
  readonly capabilities: readonly string[];
  readonly coverage: NativeImporterAdapterCoverageSummary;
  readonly supportedExtensions: readonly string[];
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
}

export interface RunNativeImporterAdapterOptions extends Omit<ImportNativeSourceOptions, 'language' | 'parser' | 'parserVersion' | 'sourceText'> {
  readonly sourceText: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string;
  readonly parserVersion?: string;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
}

export type NativeImporterAdapterImportResult = NativeSourceImportResult & {
  readonly adapter: NativeImporterAdapterSummary;
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
};

export interface NativeTargetProjectionAdapterCoverageInput {
  readonly readiness?: SemanticMergeReadiness;
  readonly lossKinds?: readonly NativeImportKnownLossKind[];
  readonly handledLossKinds?: readonly NativeImportKnownLossKind[];
  readonly sourceMapPrecision?: SourceMapMappingRecord['precision'] | 'none' | string;
  readonly semanticCoverage?: Partial<NativeImporterAdapterSemanticCoverage>;
  readonly notes?: readonly string[];
}

export interface NativeTargetProjectionAdapterSummary {
  readonly id: string;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly version?: string;
  readonly capabilities: readonly string[];
  readonly supportedParsers: readonly string[];
  readonly supportedExtensions: readonly string[];
  readonly coverage: Required<Pick<NativeTargetProjectionAdapterCoverageInput, 'readiness' | 'lossKinds' | 'handledLossKinds' | 'notes'>> & NativeTargetProjectionAdapterCoverageInput;
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
}

export interface NativeTargetProjectionAdapterInput {
  readonly importResult: NativeSourceImportResult;
  readonly sourceProjection: NativeSourceProjectionResult;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetPath?: string;
  readonly targetCoverage?: ProjectionTargetCoverageEntry;
  readonly options: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
}

export interface NativeTargetProjectionAdapterResult {
  readonly id?: string;
  readonly output?: string;
  readonly outputHash?: string;
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly readiness?: SemanticMergeReadiness;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeTargetProjectionAdapter {
  readonly id: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetLanguage?: FrontierCompileTarget | string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
  readonly supportedParsers?: readonly string[];
  readonly supportedExtensions?: readonly string[];
  readonly coverage?: NativeTargetProjectionAdapterCoverageInput;
  readonly diagnostics?: readonly NativeImporterAdapterDiagnostic[];
  readonly project: (input: NativeTargetProjectionAdapterInput) => NativeTargetProjectionAdapterResult;
}

export interface NativeTargetProjectionAdapterResolverInput {
  readonly importResult: NativeSourceImportResult;
  readonly sourceProjection: NativeSourceProjectionResult;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly sourcePath?: string;
  readonly parser?: string;
}

export interface NativeTargetProjectionResult {
  readonly kind: 'frontier.lang.nativeTargetProjection';
  readonly version: 1;
  readonly id: string;
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly targetPath?: string;
  readonly adapter: NativeTargetProjectionAdapterSummary;
  readonly output: string;
  readonly outputHash: string;
  readonly outputMode: 'target-adapter';
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly diagnostics: readonly NativeImporterAdapterDiagnostic[];
  readonly metadata: Record<string, unknown>;
}

export interface NativeProjectSourceInput extends ImportNativeSourceOptions {
  readonly adapter?: NativeImporterAdapter | string;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
}

export interface ImportNativeProjectOptions {
  readonly id?: string;
  readonly name?: string;
  readonly language?: FrontierSourceLanguage | 'mixed';
  readonly projectRoot?: string;
  readonly documentId?: string;
  readonly documentName?: string;
  readonly documentMetadata?: Record<string, unknown>;
  readonly universalAstId?: string;
  readonly universalAstMetadata?: Record<string, unknown>;
  readonly semanticIndexId?: string;
  readonly patchId?: string;
  readonly author?: string;
  readonly metadata?: Record<string, unknown>;
  readonly adapterOptions?: Record<string, unknown>;
  readonly adapterMetadata?: Record<string, unknown>;
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly adapterResolver?: (source: NativeProjectSourceInput, adapters: readonly NativeImporterAdapter[]) => NativeImporterAdapter | undefined;
  readonly sources: readonly NativeProjectSourceInput[];
}

export interface NativeProjectImportResult {
  readonly kind: 'frontier.lang.projectImportResult';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | 'mixed';
  readonly projectRoot?: string;
  readonly imports: readonly NativeSourceImportResult[];
  readonly document: FrontierLangDocument;
  readonly patch: SemanticPatchBundle;
  readonly nativeSources: readonly NativeSourceNode[];
  readonly semanticIndex?: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly mergeCandidates: readonly SemanticMergeCandidateRecord[];
  readonly metadata?: Record<string, unknown>;
}

export type NativeSourceProjectionMode = 'preserved-source' | 'native-source-stubs';

export interface ProjectNativeImportToSourceOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly expectedSourceHash?: string;
  readonly sourceText?: string;
  readonly preservedSourceText?: string;
  readonly exactSourceText?: string;
  readonly sourceHash?: string;
  readonly verifySourceHash?: boolean;
  readonly preferPreservedSource?: boolean;
  readonly stubBanner?: string | false;
  readonly evidenceId?: string;
  readonly parser?: string;
  readonly semanticStatus?: string;
  readonly nativeSource?: NativeSourceNode;
  readonly nativeAst?: NativeAstRecord;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourceProjectionDeclaration {
  readonly name: string;
  readonly kind: string;
  readonly symbolId?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly ownershipRegionId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface NativeSourceProjectionResult {
  readonly kind: 'frontier.lang.nativeSourceProjection';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly mode: NativeSourceProjectionMode;
  readonly sourceText: string;
  readonly outputHash: string;
  readonly declarations: readonly NativeSourceProjectionDeclaration[];
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly metadata: Record<string, unknown>;
}

export type NativeSourceCompileOutputMode = NativeSourceProjectionMode | 'target-stubs' | 'target-adapter';

export interface CompileNativeSourceOptions extends ProjectNativeImportToSourceOptions {
  readonly target?: FrontierCompileTarget | string;
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly targetAdapters?: readonly NativeTargetProjectionAdapter[];
  readonly targetAdapter?: NativeTargetProjectionAdapter | string;
  readonly targetAdapterResolver?: (
    input: NativeTargetProjectionAdapterResolverInput,
    adapters: readonly NativeTargetProjectionAdapter[]
  ) => NativeTargetProjectionAdapter | undefined;
  readonly targetAdapterOptions?: Record<string, unknown>;
  readonly targetAdapterMetadata?: Record<string, unknown>;
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly generatedAt?: number;
  readonly emitOnBlocked?: boolean;
  readonly emitSourceMap?: boolean;
  readonly targetPath?: string;
  readonly targetHash?: string;
  readonly sourceMapId?: string;
  readonly projectionId?: string;
  readonly projectionEvidenceId?: string;
  readonly compileEvidenceId?: string;
  readonly evidence?: readonly EvidenceRecord[];
  readonly losses?: readonly NativeAstLossRecord[];
}

export interface NativeSourceCompileResult {
  readonly kind: 'frontier.lang.nativeSourceCompileResult';
  readonly version: 1;
  readonly id: string;
  readonly ok: boolean;
  readonly target: FrontierCompileTarget | string;
  readonly language: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly output: string;
  readonly outputHash: string;
  readonly outputMode: NativeSourceCompileOutputMode;
  readonly sourceMap?: SourceMapRecord;
  readonly sourceMaps: readonly SourceMapRecord[];
  readonly importResult: NativeSourceImportResult;
  readonly projection: NativeSourceProjectionResult;
  readonly targetProjection?: NativeTargetProjectionResult;
  readonly targetCoverage: ProjectionTargetCoverageEntry;
  readonly projectionMatrix: ProjectionTargetLossMatrix;
  readonly losses: readonly NativeAstLossRecord[];
  readonly lossSummary: NativeImportLossSummary;
  readonly readiness: NativeImportReadinessClassification;
  readonly evidence: readonly EvidenceRecord[];
  readonly metadata: Record<string, unknown>;
}

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

export declare const FrontierCompileTargets: readonly FrontierCompileTarget[];
export declare const NativeImportRoundtripReadinessStatuses: readonly NativeImportRoundtripReadinessStatus[];
export declare const NativeImportTaxonomyKinds: readonly NativeImportTaxonomyKind[];
export declare const NativeImportLossKinds: readonly NativeImportKnownLossKind[];
export declare const NativeImportRegionTaxonomyKinds: readonly NativeImportRegionTaxonomyKind[];
export declare const ProjectionTargetLossClasses: readonly ProjectionTargetLossClass[];
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
export declare function createProjectionTargetLossMatrix(options?: ProjectionTargetLossMatrixOptions): ProjectionTargetLossMatrix;
export declare function createNativeSourcePreservation(options: CreateNativeSourcePreservationOptions): NativeSourcePreservation;
export declare function createSemanticImportSidecar(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: SemanticImportSidecarOptions): SemanticImportSidecar;
export declare function createNativeImportResultContract(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: NativeImportResultContractOptions): NativeImportResultContract;
export declare function createEstreeNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createBabelNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTypeScriptCompilerNativeImporterAdapter(options?: TypeScriptCompilerNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createPythonAstNativeImporterAdapter(options?: PythonAstNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTreeSitterNativeImporterAdapter(options?: TreeSitterNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function runNativeImporterAdapter(adapter: NativeImporterAdapter, input: RunNativeImporterAdapterOptions): Promise<NativeImporterAdapterImportResult>;
export declare function runNativeTargetProjectionAdapter(adapter: NativeTargetProjectionAdapter, input: NativeTargetProjectionAdapterInput): NativeTargetProjectionResult;
export declare function projectNativeImportToSource(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: ProjectNativeImportToSourceOptions): NativeSourceProjectionResult;
export declare function importExternalSemanticIndex(input: ImportExternalSemanticIndexOptions | SemanticIndexRecord): ExternalSemanticIndexImportResult;
export declare function importNativeSource(input: ImportNativeSourceOptions): NativeSourceImportResult;
export declare function diffNativeSources(input: DiffNativeSourcesOptions): NativeSourceChangeSet;
export declare function diffNativeSourceImports(input: DiffNativeSourceImportsOptions): NativeSourceChangeSet;
export declare function importNativeProject(input: ImportNativeProjectOptions): Promise<NativeProjectImportResult>;
export declare function createUniversalAstFromDocument(document: FrontierLangDocument, input?: {
  readonly id?: string;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly sourceMaps?: readonly SourceMapRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: Record<string, unknown>;
}): FrontierUniversalAstEnvelope;
export declare function readUniversalAstJson(source: string): FrontierUniversalAstEnvelope;
export declare function writeUniversalAstJson(envelope: FrontierUniversalAstEnvelope): string;
export declare function emitForTarget(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): string;
