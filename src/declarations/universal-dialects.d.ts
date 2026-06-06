import type {
  FrontierSourceLanguage,
  FrontierUniversalAstEnvelope,
  SemanticMergeReadiness,
  SourceSpan
} from '@shapeshift-labs/frontier-lang-kernel';

export type UniversalDialectConstructKind =
  | 'macro'
  | 'reflection'
  | 'generator'
  | 'runtime'
  | 'extern'
  | 'attribute'
  | 'decorator'
  | 'preprocessor'
  | 'conditionalCompilation'
  | 'syntaxExtension'
  | 'toolchain'
  | string;

export type UniversalDialectProjectionDisposition =
  | 'preserved'
  | 'lossless'
  | 'lossy'
  | 'opaque'
  | 'declaration-only'
  | 'stub-only'
  | 'unsupported'
  | 'runtime-required'
  | 'review-required'
  | string;

export interface UniversalDialectProjectionEvidence {
  readonly disposition: UniversalDialectProjectionDisposition;
  readonly readiness: SemanticMergeReadiness;
  readonly targets: readonly string[];
  readonly lossIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingIds?: readonly string[];
  readonly notes?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDialectProjectionEvidenceInput {
  readonly disposition?: UniversalDialectProjectionDisposition;
  readonly readiness?: SemanticMergeReadiness;
  readonly target?: string;
  readonly targets?: readonly string[];
  readonly lossIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly sourceMapId?: string;
  readonly sourceMapIds?: readonly string[];
  readonly sourceMapMappingId?: string;
  readonly sourceMapMappingIds?: readonly string[];
  readonly note?: string;
  readonly notes?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDialectRecord {
  readonly kind: 'frontier.lang.universalDialectRecord';
  readonly version: 1;
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialect: string;
  readonly constructKind: UniversalDialectConstructKind;
  readonly name?: string;
  readonly nativeKind?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly nativeAstNodeId?: string;
  readonly semanticNodeId?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly externIds: readonly string[];
  readonly lossIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly projection: UniversalDialectProjectionEvidence;
  readonly payload?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDialectRecordInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialect?: string;
  readonly constructKind?: UniversalDialectConstructKind;
  readonly name?: string;
  readonly symbol?: string;
  readonly nativeKind?: string;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly nativeAstNodeId?: string;
  readonly nodeId?: string;
  readonly semanticNodeId?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly externId?: string;
  readonly externIds?: readonly string[];
  readonly lossId?: string;
  readonly lossIds?: readonly string[];
  readonly evidenceId?: string;
  readonly evidenceIds?: readonly string[];
  readonly projection?: UniversalDialectProjectionEvidenceInput;
  readonly projectionEvidence?: UniversalDialectProjectionEvidenceInput;
  readonly payload?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalExternBinding {
  readonly module?: string;
  readonly path?: string;
  readonly symbol?: string;
  readonly abi?: string;
  readonly version?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalExternRecord {
  readonly kind: 'frontier.lang.universalExternRecord';
  readonly version: 1;
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialect: string;
  readonly externKind: string;
  readonly name?: string;
  readonly binding?: UniversalExternBinding;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly nativeAstNodeId?: string;
  readonly semanticNodeId?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly lossIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly projection: UniversalDialectProjectionEvidence;
  readonly payload?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalExternRecordInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialect?: string;
  readonly externKind?: string;
  readonly constructKind?: UniversalDialectConstructKind;
  readonly name?: string;
  readonly symbol?: string;
  readonly binding?: UniversalExternBinding;
  readonly sourcePath?: string;
  readonly sourceSpan?: SourceSpan;
  readonly nativeSourceId?: string;
  readonly nativeAstId?: string;
  readonly nativeAstNodeId?: string;
  readonly nodeId?: string;
  readonly semanticNodeId?: string;
  readonly semanticSymbolId?: string;
  readonly semanticOccurrenceId?: string;
  readonly sourceMapId?: string;
  readonly sourceMapMappingId?: string;
  readonly lossId?: string;
  readonly lossIds?: readonly string[];
  readonly evidenceId?: string;
  readonly evidenceIds?: readonly string[];
  readonly projection?: UniversalDialectProjectionEvidenceInput;
  readonly projectionEvidence?: UniversalDialectProjectionEvidenceInput;
  readonly payload?: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDialectRegistrySummary {
  readonly dialects: number;
  readonly externs: number;
  readonly records: number;
  readonly languages: readonly string[];
  readonly dialectNames: readonly string[];
  readonly constructKinds: Readonly<Record<string, number>>;
  readonly externKinds: Readonly<Record<string, number>>;
  readonly lossIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly projectionDispositions: Readonly<Record<string, number>>;
  readonly projectionReadiness: SemanticMergeReadiness;
  readonly recordsWithLosses: number;
  readonly recordsWithProjectionEvidence: number;
}

export interface UniversalDialectRegistry {
  readonly kind: 'frontier.lang.universalDialectRegistry';
  readonly version: 1;
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialects: readonly UniversalDialectRecord[];
  readonly externs: readonly UniversalExternRecord[];
  readonly summary: UniversalDialectRegistrySummary;
  readonly metadata?: Record<string, unknown>;
}

export interface UniversalDialectRegistryInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly dialect?: string;
  readonly sourcePath?: string;
  readonly records?: readonly UniversalDialectRecordInput[];
  readonly dialects?: readonly UniversalDialectRecordInput[];
  readonly externs?: readonly UniversalExternRecordInput[];
  readonly metadata?: Record<string, unknown>;
}

export type FrontierUniversalAstWithDialects = FrontierUniversalAstEnvelope & {
  readonly metadata?: Record<string, unknown> & {
    readonly dialects?: UniversalDialectRegistry;
    readonly language?: Record<string, unknown> & {
      readonly externs?: readonly UniversalExternRecord[];
    };
  };
};

export declare const UniversalDialectConstructKinds: readonly UniversalDialectConstructKind[];
export declare const UniversalDialectProjectionDispositions: readonly UniversalDialectProjectionDisposition[];
export declare function createUniversalDialectRecord(input?: UniversalDialectRecordInput): UniversalDialectRecord;
export declare function createUniversalExternRecord(input?: UniversalExternRecordInput): UniversalExternRecord;
export declare function createUniversalDialectRegistry(input?: UniversalDialectRegistryInput | UniversalDialectRegistry): UniversalDialectRegistry;
export declare function summarizeUniversalDialectRegistry(input?: Pick<UniversalDialectRegistry, 'dialects' | 'externs'>): UniversalDialectRegistrySummary;
export declare function attachUniversalDialectRegistry(
  universalAst: FrontierUniversalAstEnvelope,
  input?: UniversalDialectRegistryInput | UniversalDialectRegistry
): FrontierUniversalAstWithDialects;
