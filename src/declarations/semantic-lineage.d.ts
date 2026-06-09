import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export type SemanticLineageEventKind = 'unchanged' | 'moved' | 'renamed' | 'split' | 'merged' | 'deleted' | 'recreated' | 'unknown' | string;

export interface SemanticAnchor {
  readonly id?: string;
  readonly key?: string;
  readonly kind?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly symbolId?: string;
  readonly symbolName?: string;
  readonly semanticPath?: readonly string[];
  readonly signatureHash?: string;
  readonly bodyHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly metadata?: Record<string, unknown>;
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

export interface SemanticLineageEvidence {
  readonly pathMatch?: boolean;
  readonly signatureHashMatch?: boolean;
  readonly bodyHashMatch?: boolean;
  readonly syntaxShapeMatch?: boolean;
  readonly sourceSpanMoved?: boolean;
  readonly confidence?: number;
  readonly command?: string;
}

export interface SemanticLineageActor {
  readonly id?: string;
  readonly role?: string;
  readonly lane?: string;
  readonly taskId?: string;
  readonly runId?: string;
  readonly metadata?: Record<string, unknown>;
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
  readonly id?: string;
  readonly hash?: string;
  readonly createdAt?: number | string;
  readonly eventKind?: SemanticLineageEventKind;
  readonly event?: SemanticLineageEventKind;
  readonly kind?: SemanticLineageEventKind;
  readonly from?: SemanticAnchor | string;
  readonly fromAnchor?: SemanticAnchor | string;
  readonly before?: SemanticAnchor | string;
  readonly to?: readonly (SemanticAnchor | string)[] | SemanticAnchor | string;
  readonly toAnchors?: readonly (SemanticAnchor | string)[] | SemanticAnchor | string;
  readonly after?: readonly (SemanticAnchor | string)[] | SemanticAnchor | string;
  readonly confidence?: number;
  readonly actor?: SemanticLineageActor | string;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly crdt?: SemanticLineageCrdtClock;
  readonly clock?: SemanticLineageCrdtClock;
  readonly operation?: SemanticLineageCrdtClock;
  readonly operationId?: string;
  readonly seq?: number;
  readonly deps?: readonly string[] | string;
  readonly heads?: readonly string[] | string;
  readonly stateVector?: Record<string, number>;
  readonly versionFrame?: Record<string, unknown>;
  readonly evidence?: SemanticLineageEvidence | readonly { readonly id?: string }[];
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

export declare const SemanticLineageEventKinds: readonly SemanticLineageEventKind[];
export declare function createSemanticAnchor(input?: SemanticAnchor | string, defaults?: Partial<SemanticAnchor>): SemanticAnchor | undefined;
export declare function createSemanticLineageEvent(input?: CreateSemanticLineageEventInput, options?: { readonly id?: string; readonly createdAt?: number | string; readonly actor?: SemanticLineageActor | string; readonly actorId?: string; readonly actorRole?: string }): SemanticLineageEvent;
export declare function createSemanticLineageMap(events?: readonly (SemanticLineageEvent | CreateSemanticLineageEventInput)[], options?: { readonly id?: string; readonly generatedAt?: number | string }): SemanticLineageMap;
export declare function querySemanticLineageEvents(events: SemanticLineageEvent | readonly SemanticLineageEvent[], query?: SemanticLineageQuery): readonly SemanticLineageEvent[];
