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
import type { EmitTypeScriptOptions, TypeScriptAstModule } from '@shapeshift-labs/frontier-lang-typescript';
import type { EmitJavaScriptOptions, JavaScriptAstModule } from '@shapeshift-labs/frontier-lang-javascript';
import type { EmitRustOptions, RustAstModule } from '@shapeshift-labs/frontier-lang-rust';
import type { EmitPythonOptions, PythonAstModule } from '@shapeshift-labs/frontier-lang-python';
import type { CAstHeader, EmitCHeaderOptions } from '@shapeshift-labs/frontier-lang-c';

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
  | 'metaprogramming'
  | 'generatedCode'
  | 'sourcePreservation'
  | 'parserDiagnostics'
  | 'unsupportedSyntax'
  | 'partialSemanticIndex'
  | 'sourceMapApproximation'
  | string;

export type NativeImportKnownLossKind =
  | 'declarationOnlyCoverage'
  | 'opaqueNative'
  | 'macroExpansion'
  | 'preprocessor'
  | 'metaprogramming'
  | 'generatedCode'
  | 'sourcePreservation'
  | 'parserDiagnostic'
  | 'unsupportedSyntax'
  | 'partialSemanticIndex'
  | 'sourceMapApproximation'
  | string;

export interface NativeImportLossSummaryOptions {
  readonly exactAst?: boolean;
  readonly evidence?: readonly EvidenceRecord[];
  readonly parser?: string;
  readonly scanKind?: string;
  readonly semanticStatus?: string;
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
  readonly projectionTargets: readonly FrontierCompileTarget[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
}

export interface NativeImportCoverageLanguage {
  readonly language: FrontierSourceLanguage;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly supportsLightweightScan: boolean;
  readonly parserAdapters: readonly string[];
  readonly projectionTargets: readonly FrontierCompileTarget[];
  readonly knownLossKinds: readonly NativeImportKnownLossKind[];
  readonly defaultReadiness: SemanticMergeReadiness;
  readonly notes: readonly string[];
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
  };
  readonly metadata: {
    readonly compileTargets: readonly FrontierCompileTarget[];
    readonly note: string;
  };
}

export interface NativeImportCoverageMatrixOptions {
  readonly languages?: readonly NativeImportLanguageProfile[];
  readonly imports?: readonly NativeSourceImportResult[];
  readonly adapters?: readonly NativeImporterAdapter[];
  readonly generatedAt?: number;
}

export interface SemanticImportOwnershipRegion {
  readonly id: string;
  readonly key: string;
  readonly granularity: 'symbol' | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly symbolKind?: string;
  readonly nativeAstNodeId?: string;
  readonly sourceSpan?: SourceSpan;
  readonly precision?: 'exact' | 'declaration' | 'line' | 'estimated' | 'unknown' | string;
  readonly mergePolicy?: string;
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
  readonly readiness: SemanticMergeReadiness;
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
  readonly evidence: {
    readonly total: number;
    readonly failed: readonly string[];
    readonly ids: readonly string[];
  };
  readonly summary: {
    readonly imports: number;
    readonly symbols: number;
    readonly ownershipRegions: number;
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
  readonly metadata?: Record<string, unknown>;
}

export type NativeSourceImportResult = LanguageImportResult & {
  readonly nativeSource: NativeSourceNode;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly universalAst: FrontierUniversalAstEnvelope;
};

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

export interface TreeSitterNativeImporterAdapterOptions {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage;
  readonly parser?: string | { readonly parse?: (sourceText: string) => unknown };
  readonly parserName?: string;
  readonly version?: string;
  readonly capabilities?: readonly string[];
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

export declare const FrontierCompileTargets: readonly FrontierCompileTarget[];
export declare const NativeImportTaxonomyKinds: readonly NativeImportTaxonomyKind[];
export declare const NativeImportLossKinds: readonly NativeImportKnownLossKind[];
export declare const NativeImportReadinessBySeverity: Readonly<Record<NativeImportLossSummary['highestSeverity'], SemanticMergeReadiness>>;
export declare const NativeImportLanguageProfiles: readonly NativeImportLanguageProfile[];
export declare function normalizeCompileTarget(target?: string): FrontierCompileTarget;
export declare function compileFrontierSource(source: string, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function compileFrontierDocument(document: FrontierLangDocument, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function projectFrontierAst(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): FrontierTargetAst;
export declare function renderTargetAst(ast: FrontierTargetAst, target?: FrontierCompileOptions['target']): string;
export declare function resolveCapabilityAdapters(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: { readonly platform?: string }): readonly CapabilityResolution[];
export declare function summarizeNativeImportLosses(losses?: readonly NativeAstLossRecord[], options?: NativeImportLossSummaryOptions): NativeImportLossSummary;
export declare function classifyNativeImportReadiness(losses?: readonly NativeAstLossRecord[], options?: NativeImportLossSummaryOptions): NativeImportReadinessClassification;
export declare function createNativeImportCoverageMatrix(options?: NativeImportCoverageMatrixOptions): NativeImportCoverageMatrix;
export declare function createSemanticImportSidecar(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: SemanticImportSidecarOptions): SemanticImportSidecar;
export declare function createEstreeNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createBabelNativeImporterAdapter(options?: JavaScriptNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTypeScriptCompilerNativeImporterAdapter(options?: TypeScriptCompilerNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function createTreeSitterNativeImporterAdapter(options?: TreeSitterNativeImporterAdapterOptions): NativeImporterAdapter;
export declare function runNativeImporterAdapter(adapter: NativeImporterAdapter, input: RunNativeImporterAdapterOptions): Promise<NativeImporterAdapterImportResult>;
export declare function projectNativeImportToSource(importResult: NativeSourceImportResult | NativeProjectImportResult, options?: ProjectNativeImportToSourceOptions): NativeSourceProjectionResult;
export declare function importNativeSource(input: ImportNativeSourceOptions): NativeSourceImportResult;
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
