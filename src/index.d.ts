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
  SemanticIndexRecord,
  SemanticNode,
  SemanticPatchBundle,
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
  readonly mappings?: readonly unknown[];
  readonly semanticStatus?: 'native-only' | 'mapped' | 'partial' | string;
  readonly losses?: readonly NativeAstLossRecord[];
  readonly evidence?: readonly EvidenceRecord[];
  readonly evidenceId?: string;
  readonly patch?: SemanticPatchBundle;
  readonly patchId?: string;
  readonly author?: string;
  readonly target?: CompileTarget;
  readonly semanticIndex?: SemanticIndexRecord;
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

export declare const FrontierCompileTargets: readonly FrontierCompileTarget[];
export declare function normalizeCompileTarget(target?: string): FrontierCompileTarget;
export declare function compileFrontierSource(source: string, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function compileFrontierDocument(document: FrontierLangDocument, options?: FrontierCompileOptions): FrontierCompileResult;
export declare function projectFrontierAst(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): FrontierTargetAst;
export declare function renderTargetAst(ast: FrontierTargetAst, target?: FrontierCompileOptions['target']): string;
export declare function resolveCapabilityAdapters(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: { readonly platform?: string }): readonly CapabilityResolution[];
export declare function runNativeImporterAdapter(adapter: NativeImporterAdapter, input: RunNativeImporterAdapterOptions): Promise<NativeImporterAdapterImportResult>;
export declare function importNativeSource(input: ImportNativeSourceOptions): NativeSourceImportResult;
export declare function createUniversalAstFromDocument(document: FrontierLangDocument, input?: {
  readonly id?: string;
  readonly semanticIndex?: SemanticIndexRecord;
  readonly evidence?: readonly EvidenceRecord[];
  readonly metadata?: Record<string, unknown>;
}): FrontierUniversalAstEnvelope;
export declare function readUniversalAstJson(source: string): FrontierUniversalAstEnvelope;
export declare function writeUniversalAstJson(envelope: FrontierUniversalAstEnvelope): string;
export declare function emitForTarget(document: FrontierLangDocument, target?: FrontierCompileOptions['target'], options?: FrontierCompileEmitOptions): string;
