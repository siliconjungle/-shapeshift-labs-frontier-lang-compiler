import type { EvidenceRecord, FrontierSourceLanguage, SemanticMergeReadiness, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';
import type { ImportNativeSourceOptions, NativeSourceImportResult } from './import-adapter-core.js';
export type SemanticLineageEventKind = 'unchanged' | 'moved' | 'renamed' | 'split' | 'merged' | 'deleted' | 'recreated' | 'unknown' | string;
export type SemanticLineageResolutionStatus = 'unchanged' | 'resolved' | 'ambiguous' | 'deleted' | 'recreated' | 'cycle' | 'max-depth' | 'not-found' | string;
export interface SemanticAnchor {
  readonly id?: string; readonly key?: string; readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string; readonly sourcePath?: string; readonly sourceHash?: string;
  readonly symbolId?: string; readonly symbolName?: string;
  readonly semanticPath?: readonly string[];
  readonly signatureHash?: string; readonly bodyHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly lineageEventIds?: readonly string[]; readonly terminalLineageEventIds?: readonly string[];
  readonly lineageSourcePaths?: readonly string[]; readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[]; readonly crdtOperationIds?: readonly string[]; readonly crdtHeads?: readonly string[];
  readonly lineageEventKinds?: readonly SemanticLineageEventKind[]; readonly lineageReasonCodes?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface CreateSemanticAnchorInput extends SemanticAnchor {
  readonly ownershipKey?: string;
  readonly conflictKey?: string;
  readonly semanticKey?: string;
  readonly anchorKind?: string;
  readonly regionKind?: string;
  readonly symbolKind?: string;
  readonly pathSegments?: readonly string[];
  readonly name?: string;
  readonly hash?: string;
  readonly span?: SourceSpan;
}
export interface SemanticLineageCrdtClock {
  readonly operationId?: string;
  readonly actor?: string;
  readonly seq?: number;
  readonly deps?: readonly string[];
  readonly heads?: readonly string[];
  readonly stateVector?: Record<string, number>;
  readonly versionFrame?: Record<string, unknown>;
}
export interface SemanticLineageCrdtClockInput {
  readonly operationId?: string;
  readonly id?: string;
  readonly actor?: string;
  readonly actorId?: string;
  readonly seq?: number;
  readonly deps?: readonly string[] | string;
  readonly heads?: readonly string[] | string;
  readonly stateVector?: Record<string, number>;
  readonly versionFrame?: Record<string, unknown>;
  readonly frame?: Record<string, unknown>;
}
export interface SemanticLineageEvidence {
  readonly pathMatch?: boolean;
  readonly signatureHashMatch?: boolean;
  readonly bodyHashMatch?: boolean;
  readonly syntaxShapeMatch?: boolean;
  readonly sourceSpanMoved?: boolean;
  readonly confidence?: number;
  readonly command?: string;
}
export interface SemanticLineageEvidenceInput extends SemanticLineageEvidence {
  readonly id?: string;
}
export interface SemanticLineageActor {
  readonly id?: string;
  readonly role?: string;
  readonly lane?: string;
  readonly taskId?: string;
  readonly runId?: string;
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticLineageActorInput extends SemanticLineageActor {
  readonly actorId?: string;
}
export interface SemanticLineageEvent {
  readonly kind: 'frontier.lang.semanticLineageEvent';
  readonly version: 1;
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly createdAt: number | string;
  readonly eventKind: SemanticLineageEventKind;
  readonly from?: SemanticAnchor;
  readonly to: readonly SemanticAnchor[];
  readonly confidence?: number;
  readonly actor?: SemanticLineageActor;
  readonly crdt?: SemanticLineageCrdtClock;
  readonly evidence?: SemanticLineageEvidence;
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface CreateSemanticLineageEventInput {
  readonly id?: string; readonly hash?: string; readonly createdAt?: number | string;
  readonly eventKind?: SemanticLineageEventKind; readonly event?: SemanticLineageEventKind; readonly kind?: SemanticLineageEventKind;
  readonly from?: CreateSemanticAnchorInput | string;
  readonly fromAnchor?: CreateSemanticAnchorInput | string;
  readonly before?: CreateSemanticAnchorInput | string;
  readonly to?: readonly (CreateSemanticAnchorInput | string)[] | CreateSemanticAnchorInput | string;
  readonly toAnchors?: readonly (CreateSemanticAnchorInput | string)[] | CreateSemanticAnchorInput | string;
  readonly after?: readonly (CreateSemanticAnchorInput | string)[] | CreateSemanticAnchorInput | string;
  readonly confidence?: number; readonly actor?: SemanticLineageActorInput | string;
  readonly actorId?: string; readonly actorRole?: string;
  readonly crdt?: SemanticLineageCrdtClockInput;
  readonly clock?: SemanticLineageCrdtClockInput;
  readonly operation?: SemanticLineageCrdtClockInput;
  readonly operationId?: string;
  readonly seq?: number;
  readonly deps?: readonly string[] | string;
  readonly heads?: readonly string[] | string;
  readonly stateVector?: Record<string, number>;
  readonly versionFrame?: Record<string, unknown>;
  readonly frame?: Record<string, unknown>;
  readonly evidence?: SemanticLineageEvidenceInput | readonly SemanticLineageEvidenceInput[];
  readonly pathMatch?: boolean;
  readonly signatureHashMatch?: boolean;
  readonly bodyHashMatch?: boolean;
  readonly syntaxShapeMatch?: boolean;
  readonly sourceSpanMoved?: boolean;
  readonly command?: string;
  readonly evidenceIds?: readonly string[] | string;
  readonly proofIds?: readonly string[] | string;
  readonly proofs?: readonly { readonly id?: string }[];
  readonly conflictKey?: string;
  readonly conflictKeys?: readonly string[] | string;
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticLineageMap {
  readonly kind: 'frontier.lang.semanticLineageMap';
  readonly version: 1;
  readonly id: string;
  readonly generatedAt: number | string;
  readonly events: readonly SemanticLineageEvent[];
  readonly byAnchorKey: Readonly<Record<string, readonly string[]>>;
  readonly byEventKind: Readonly<Record<string, readonly string[]>>;
  readonly byOperationId: Readonly<Record<string, readonly string[]>>;
  readonly bySourcePath: Readonly<Record<string, readonly string[]>>;
  readonly summary: {
    readonly eventCount: number;
    readonly anchorCount: number;
    readonly operationCount: number;
    readonly eventKinds: readonly string[];
  };
}
export interface SemanticLineageResolutionQuery {
  readonly id?: string;
  readonly anchor?: SemanticAnchor | string;
  readonly anchorKey?: string;
  readonly key?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly maxDepth?: number;
  readonly generatedAt?: number | string;
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticLineageResolution {
  readonly kind: 'frontier.lang.semanticLineageResolution';
  readonly version: 1;
  readonly id: string;
  readonly stableId: string;
  readonly hash: string;
  readonly generatedAt: number | string;
  readonly query: {
    readonly anchorKey?: string;
    readonly anchorId?: string;
    readonly sourcePath?: string;
    readonly symbolName?: string;
    readonly maxDepth?: number;
  };
  readonly startAnchor?: SemanticAnchor;
  readonly currentAnchors: readonly SemanticAnchor[];
  readonly traversedEventIds: readonly string[];
  readonly terminalEventIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly status: SemanticLineageResolutionStatus;
  readonly confidence?: number;
  readonly conflictKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly proofIds: readonly string[];
  readonly crdtOperationIds: readonly string[];
  readonly crdtHeads: readonly string[];
  readonly lineageEventKinds: readonly SemanticLineageEventKind[];
  readonly reasonCodes: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface SemanticLineageQuery {
  readonly eventKind?: SemanticLineageEventKind | readonly string[];
  readonly anchorKey?: string | readonly string[];
  readonly fromKey?: string | readonly string[];
  readonly toKey?: string | readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly operationId?: string | readonly string[];
  readonly head?: string | readonly string[];
  readonly conflictKey?: string | readonly string[];
  readonly evidenceId?: string | readonly string[];
}
export interface SemanticLineageInferredAnchorSummary {
  readonly key?: string;
  readonly id?: string;
  readonly name?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly identityHash?: string;
  readonly semanticIdentityHash?: string;
  readonly sourceIdentityHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly signatureHash?: string;
  readonly bodyHash?: string;
  readonly ownershipRegionKind?: string;
}
export interface SemanticLineageAmbiguousCandidate {
  readonly after: SemanticLineageInferredAnchorSummary;
  readonly confidence: number;
  readonly reasons: readonly string[];
}
export interface SemanticLineageAmbiguousMatch {
  readonly before: SemanticLineageInferredAnchorSummary;
  readonly candidates: readonly SemanticLineageAmbiguousCandidate[];
  readonly reasonCodes: readonly string[];
}
export interface SemanticLineageInferenceResult {
  readonly kind: 'frontier.lang.semanticLineageInference';
  readonly version: 1;
  readonly id: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly beforeImportId?: string;
  readonly afterImportId?: string;
  readonly beforeHash?: string;
  readonly afterHash?: string;
  readonly events: readonly SemanticLineageEvent[];
  readonly lineageMap: SemanticLineageMap;
  readonly evidence: readonly EvidenceRecord[];
  readonly unmatched: {
    readonly removed: readonly SemanticLineageInferredAnchorSummary[];
    readonly added: readonly SemanticLineageInferredAnchorSummary[];
    readonly ambiguous: readonly SemanticLineageAmbiguousMatch[];
  };
  readonly summary: {
    readonly beforeSymbols: number;
    readonly afterSymbols: number;
    readonly unchangedAnchors: number;
    readonly inferredEvents: number;
    readonly moved: number;
    readonly renamed: number;
    readonly split: number;
    readonly recreated: number;
    readonly deleted: number;
    readonly ambiguous: number;
    readonly unmatchedAdded: number;
    readonly minConfidence: number;
    readonly ambiguityMargin: number;
  };
  readonly readiness: SemanticMergeReadiness;
  readonly reasons: readonly string[];
  readonly metadata: {
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly reviewRequired: true;
    readonly [key: string]: unknown;
  };
}
export interface InferSemanticLineageEventsOptions {
  readonly id?: string;
  readonly before?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly after?: NativeSourceImportResult | ImportNativeSourceOptions;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly parser?: string;
  readonly generatedAt?: number | string;
  readonly regionPrefix?: string;
  readonly evidenceId?: string;
  readonly lineageMapId?: string;
  readonly minConfidence?: number;
  readonly ambiguityMargin?: number;
  readonly includeDeleted?: boolean;
  readonly deletedConfidence?: number;
  readonly readiness?: SemanticMergeReadiness;
  readonly actor?: SemanticLineageActor | string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly operationId?: string;
  readonly deps?: readonly string[] | string;
  readonly heads?: readonly string[] | string;
  readonly stateVector?: Record<string, number>;
  readonly metadata?: Record<string, unknown>;
}
export declare const SemanticLineageEventKinds: readonly SemanticLineageEventKind[];
export declare const SemanticLineageResolutionStatuses: readonly SemanticLineageResolutionStatus[];
export declare function createSemanticAnchor(input?: CreateSemanticAnchorInput | string, defaults?: Partial<SemanticAnchor>): SemanticAnchor | undefined;
export declare function createSemanticLineageEvent(input?: CreateSemanticLineageEventInput, options?: { readonly id?: string; readonly createdAt?: number | string; readonly actor?: SemanticLineageActorInput | string; readonly actorId?: string; readonly actorRole?: string }): SemanticLineageEvent;
export declare function createSemanticLineageMap(events?: readonly (SemanticLineageEvent | CreateSemanticLineageEventInput)[], options?: { readonly id?: string; readonly generatedAt?: number | string }): SemanticLineageMap;
export declare function inferSemanticLineageEvents(input?: InferSemanticLineageEventsOptions, options?: { readonly metadata?: Record<string, unknown>; readonly deletedConfidence?: number }): SemanticLineageInferenceResult;
export declare function querySemanticLineageEvents(events: SemanticLineageEvent | readonly SemanticLineageEvent[], query?: SemanticLineageQuery): readonly SemanticLineageEvent[];
export declare function resolveSemanticLineage(eventsOrMap?: SemanticLineageMap | readonly (SemanticLineageEvent | CreateSemanticLineageEventInput)[], query?: SemanticLineageResolutionQuery | SemanticAnchor | string, options?: { readonly id?: string; readonly generatedAt?: number | string; readonly maxDepth?: number; readonly metadata?: Record<string, unknown> }): SemanticLineageResolution;
export declare function resolveSemanticLineageBatch(eventsOrMap?: SemanticLineageMap | readonly (SemanticLineageEvent | CreateSemanticLineageEventInput)[], queries?: readonly (SemanticLineageResolutionQuery | SemanticAnchor | string)[], options?: { readonly generatedAt?: number | string; readonly maxDepth?: number; readonly metadata?: Record<string, unknown> }): readonly SemanticLineageResolution[];
