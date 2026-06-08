export type NativeRoundtripSourceMapPrecision = SourceMapMappingRecord['precision'] | 'line' | 'declaration' | 'estimated' | 'unknown' | 'none' | string;

export type NativeRoundtripAuditDisposition =
  | 'reversible'
  | 'preserved-source'
  | 'stub-only'
  | 'adapter-projected'
  | 'review-required';

export type NativeRoundtripAuditClaim =
  | 'source-text-reversible'
  | 'source-preserved'
  | 'declaration-stubs-only'
  | 'host-adapter-projected'
  | 'review-required';

export interface NativeRoundtripSourceMapEvidence {
  readonly total: number;
  readonly ids: readonly string[];
  readonly mappings: number;
  readonly precision: NativeRoundtripSourceMapPrecision;
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly byOrigin: Readonly<Record<string, number>>;
  readonly withSourceSpan: number;
  readonly withGeneratedSpan: number;
  readonly withSemanticSymbol: number;
  readonly targetPaths: readonly string[];
}

export interface NativeRoundtripRoutePathSignal {
  readonly selected: boolean;
  readonly available: boolean;
  readonly reasonCodes: readonly string[];
}

export interface NativeRoundtripRoutePathsAudit {
  readonly reversible: NativeRoundtripRoutePathSignal;
  readonly preservedSource: NativeRoundtripRoutePathSignal;
  readonly stubOnly: NativeRoundtripRoutePathSignal;
  readonly adapterProjected: NativeRoundtripRoutePathSignal;
}

export interface NativeRoundtripSourcePreservationAudit {
  readonly id?: string;
  readonly exactSourceAvailable: boolean;
  readonly sourceTextAvailable: boolean;
  readonly recordCount: number;
  readonly byLevel: Readonly<Record<string, number>>;
  readonly exactRecords: number;
  readonly declarationRecords: number;
  readonly estimatedRecords: number;
  readonly blockedRecords: number;
  readonly sourcePaths: readonly string[];
  readonly sourceMapIds: readonly string[];
  readonly mappingPreservation: Readonly<Record<string, number>>;
  readonly comments: number;
  readonly trivia: number;
  readonly directives: number;
  readonly tokens: number;
  readonly whitespace: number;
  readonly truncated: boolean;
}

export interface NativeRoundtripGeneratedStubsAudit {
  readonly available: boolean;
  readonly selected: boolean;
  readonly projectionMode?: NativeSourceProjectionMode;
  readonly outputMode?: NativeSourceCompileOutputMode;
  readonly declarationCount: number;
  readonly emittedDeclarationCount: number;
  readonly declarationKinds: Readonly<Record<string, number>>;
  readonly declarationsWithSourceSpan: number;
  readonly symbolIds: readonly string[];
  readonly nativeAstNodeIds: readonly string[];
  readonly lossCount: number;
}

export interface NativeRoundtripAdapterProjectionAudit {
  readonly available: boolean;
  readonly selected: boolean;
  readonly id?: string;
  readonly adapterId?: string;
  readonly adapterVersion?: string;
  readonly outputMode?: 'target-adapter';
  readonly readiness?: SemanticMergeReadiness;
  readonly lossCount: number;
  readonly evidenceIds: readonly string[];
  readonly sourceMaps: NativeRoundtripSourceMapEvidence;
}

export interface NativeRoundtripRouteSourceMapsAudit {
  readonly hasOutputSourceMaps: boolean;
  readonly output: NativeRoundtripSourceMapEvidence;
  readonly universal: NativeRoundtripSourceMapEvidence;
  readonly outputExact: boolean;
  readonly outputEstimated: boolean;
  readonly universalEstimated: boolean;
}

export interface NativeRoundtripHashChecksAudit {
  readonly sourceHashPresent: boolean;
  readonly declaredSourceHashPresent: boolean;
  readonly declaredSourceHashVerified?: boolean;
  readonly expectedSourceHashPresent: boolean;
  readonly outputHashPresent: boolean;
  readonly projectionOutputHashPresent: boolean;
  readonly targetOutputHashPresent: boolean;
  readonly sourceHashVerified: boolean;
  readonly projectionOutputMatchesSourceHash: boolean;
  readonly targetOutputMatchesSourceHash: boolean;
  readonly outputMatchesSourceHash: boolean;
}

export interface NativeRoundtripCommentsTriviaAudit {
  readonly comments: number;
  readonly trivia: number;
  readonly directives: number;
  readonly tokens: number;
  readonly whitespace: number;
  readonly truncated: boolean;
  readonly exactSourceAvailable: boolean;
  readonly sourceTextAvailable: boolean;
}

export interface NativeRoundtripTargetCoverageAudit {
  readonly target?: CompileTarget | string;
  readonly supported?: boolean;
  readonly readiness?: SemanticMergeReadiness;
  readonly lossClass?: ProjectionTargetLossClass | string;
  readonly adapterId?: string;
  readonly adapterKind?: string;
  readonly adapterVersion?: string;
  readonly lossKinds: readonly string[];
  readonly categories: readonly string[];
  readonly reason?: string;
  readonly notes: readonly string[];
}

export interface NativeRoundtripSemanticEquivalenceAudit {
  readonly claimed: false;
  readonly proofAdapterId?: string;
  readonly evidenceIds: readonly string[];
  readonly reasonCode: string;
}

export interface NativeRoundtripAuditSignal {
  readonly schema: 'frontier.lang.nativeRoundtripAuditSignal';
  readonly version: 1;
  readonly disposition: NativeRoundtripAuditDisposition;
  readonly claim: NativeRoundtripAuditClaim;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: CompileTarget | string;
  readonly sameLanguage: boolean;
  readonly outputMode?: NativeSourceCompileOutputMode;
  readonly projectionMode?: NativeSourceProjectionMode;
  readonly sourceHashVerified: boolean;
  readonly outputSourceMapPrecision: NativeRoundtripSourceMapPrecision;
  readonly universalSourceMapPrecision: NativeRoundtripSourceMapPrecision;
  readonly targetProjectionAdapterId?: string;
  readonly targetCoverageLossClass?: ProjectionTargetLossClass | string;
  readonly reviewRequired: boolean;
  readonly semanticMergeReadiness: SemanticMergeReadiness;
  readonly semanticEquivalenceClaim: false;
  readonly autoMergeClaim: false;
  readonly paths: NativeRoundtripRoutePathsAudit;
  readonly sourcePreservation: NativeRoundtripSourcePreservationAudit;
  readonly generatedStubs: NativeRoundtripGeneratedStubsAudit;
  readonly adapterProjection: NativeRoundtripAdapterProjectionAudit;
  readonly sourceMaps: NativeRoundtripRouteSourceMapsAudit;
  readonly hashChecks: NativeRoundtripHashChecksAudit;
  readonly commentsTrivia: NativeRoundtripCommentsTriviaAudit;
  readonly targetCoverage: NativeRoundtripTargetCoverageAudit;
  readonly semanticEquivalence: NativeRoundtripSemanticEquivalenceAudit;
  readonly blockingLossCount: number;
  readonly reviewLossCount: number;
  readonly reasonCodes: readonly string[];
}
