import type { FrontierSourceLanguage, SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export type SemanticResourceGraphRecordKind =
  | 'resource'
  | 'owner'
  | 'loan'
  | 'alias'
  | 'move'
  | 'drop'
  | 'escape'
  | 'lifetime-region'
  | 'lifetime-relation'
  | 'unsafe-boundary'
  | 'conflict'
  | 'proof-obligation';

export type SemanticResourceLoanMode =
  | 'shared'
  | 'mutable'
  | 'exclusive'
  | 'move'
  | 'raw'
  | 'unknown';

export type SemanticResourceGraphStatus = 'partial' | 'missing' | 'blocked';

export interface SemanticResourceGraphBaseRecord {
  readonly recordKind: SemanticResourceGraphRecordKind;
  readonly id: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly evidenceIds: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticResourceRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'resource';
  readonly name?: string;
  readonly resourceKind: string;
  readonly ownerId?: string;
  readonly ownerName?: string;
}

export interface SemanticResourceOwnerRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'owner';
  readonly name?: string;
  readonly ownerKind: string;
}

export interface SemanticResourceLifetimeRegionRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'lifetime-region';
  readonly name?: string;
  readonly lifetimeKind: string;
  readonly startLine?: number;
  readonly endLine?: number;
}

export interface SemanticResourceLoanRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'loan';
  readonly resourceId?: string;
  readonly ownerId?: string;
  readonly lifetimeRegionId?: string;
  readonly mode: SemanticResourceLoanMode;
  readonly access?: string;
}

export interface SemanticResourceAliasRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'alias';
  readonly resourceId?: string;
  readonly ownerId?: string;
  readonly aliasId?: string;
  readonly aliasKind: string;
}

export interface SemanticResourceMoveRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'move';
  readonly resourceId?: string;
  readonly fromOwnerId?: string;
  readonly toOwnerId?: string;
}

export interface SemanticResourceDropRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'drop';
  readonly resourceId?: string;
  readonly ownerId?: string;
  readonly lifetimeRegionId?: string;
  readonly dropKind: string;
  readonly line?: number;
  readonly order?: number;
}

export interface SemanticResourceEscapeRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'escape';
  readonly resourceId?: string;
  readonly ownerId?: string;
  readonly lifetimeRegionId?: string;
  readonly loanId?: string;
  readonly escapeKind: string;
  readonly status: string;
}

export interface SemanticResourceLifetimeRelationRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'lifetime-relation';
  readonly relationKind: string;
  readonly fromLifetimeId?: string;
  readonly toLifetimeId?: string;
  readonly from?: string;
  readonly to?: string;
}

export interface SemanticResourceUnsafeBoundaryRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'unsafe-boundary';
  readonly resourceId?: string;
  readonly unsafeBoundary: true;
  readonly proofStatus: string;
}

export interface SemanticResourceConflictRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'conflict';
  readonly resourceId?: string;
  readonly ownerId?: string;
  readonly loanId?: string;
  readonly aliasId?: string;
  readonly unsafeBoundaryId?: string;
  readonly reasonCode?: string;
  readonly message?: string;
  readonly status: string;
  readonly severity: string;
}

export interface SemanticResourceProofObligationRecord extends SemanticResourceGraphBaseRecord {
  readonly recordKind: 'proof-obligation';
  readonly resourceId?: string;
  readonly conflictId?: string;
  readonly kind?: string;
  readonly status: string;
  readonly statement?: string;
}

export type SemanticResourceGraphRecord =
  | SemanticResourceRecord
  | SemanticResourceOwnerRecord
  | SemanticResourceLoanRecord
  | SemanticResourceAliasRecord
  | SemanticResourceMoveRecord
  | SemanticResourceDropRecord
  | SemanticResourceEscapeRecord
  | SemanticResourceLifetimeRegionRecord
  | SemanticResourceLifetimeRelationRecord
  | SemanticResourceUnsafeBoundaryRecord
  | SemanticResourceConflictRecord
  | SemanticResourceProofObligationRecord;

export interface SemanticResourceGraphSummary {
  readonly records: number;
  readonly resources: number;
  readonly owners: number;
  readonly loans: number;
  readonly aliases: number;
  readonly moves: number;
  readonly drops: number;
  readonly escapes: number;
  readonly lifetimeRegions: number;
  readonly lifetimeRelations: number;
  readonly unsafeBoundaries: number;
  readonly conflicts: number;
  readonly proofObligations: number;
  readonly unsafeBoundariesWithoutProof: number;
  readonly reasonCodes: readonly string[];
}

export interface SemanticResourceGraph {
  readonly kind: 'frontier.lang.semanticResourceGraph';
  readonly version: 1;
  readonly id: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly status: SemanticResourceGraphStatus;
  readonly resources: readonly SemanticResourceRecord[];
  readonly owners: readonly SemanticResourceOwnerRecord[];
  readonly loans: readonly SemanticResourceLoanRecord[];
  readonly aliases: readonly SemanticResourceAliasRecord[];
  readonly moves: readonly SemanticResourceMoveRecord[];
  readonly drops: readonly SemanticResourceDropRecord[];
  readonly escapes: readonly SemanticResourceEscapeRecord[];
  readonly lifetimeRegions: readonly SemanticResourceLifetimeRegionRecord[];
  readonly lifetimeRelations: readonly SemanticResourceLifetimeRelationRecord[];
  readonly outlives: readonly SemanticResourceLifetimeRelationRecord[];
  readonly unsafeBoundaries: readonly SemanticResourceUnsafeBoundaryRecord[];
  readonly conflicts: readonly SemanticResourceConflictRecord[];
  readonly proofObligations: readonly SemanticResourceProofObligationRecord[];
  readonly evidenceIds: readonly string[];
  readonly summary: SemanticResourceGraphSummary;
  readonly query: {
    readonly resourceIds: readonly string[];
    readonly ownerIds: readonly string[];
    readonly lifetimeRegionIds: readonly string[];
    readonly sourcePaths: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly blockerReasonCodes: readonly string[];
  };
  readonly claims: {
    readonly borrowCheckerClaim: false;
    readonly aliasSafetyClaim: false;
    readonly lifetimeSoundnessClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly autoMergeClaim: false;
  };
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticResourceGraphInput {
  readonly id?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly resources?: readonly Partial<SemanticResourceRecord>[];
  readonly owners?: readonly Partial<SemanticResourceOwnerRecord>[];
  readonly loans?: readonly Partial<SemanticResourceLoanRecord>[];
  readonly aliases?: readonly Partial<SemanticResourceAliasRecord>[];
  readonly moves?: readonly Partial<SemanticResourceMoveRecord>[];
  readonly drops?: readonly Partial<SemanticResourceDropRecord>[];
  readonly escapes?: readonly Partial<SemanticResourceEscapeRecord>[];
  readonly lifetimeRegions?: readonly Partial<SemanticResourceLifetimeRegionRecord>[];
  readonly lifetimeRelations?: readonly Partial<SemanticResourceLifetimeRelationRecord>[];
  readonly outlives?: readonly Partial<SemanticResourceLifetimeRelationRecord>[];
  readonly unsafeBoundaries?: readonly Partial<SemanticResourceUnsafeBoundaryRecord>[];
  readonly conflicts?: readonly Partial<SemanticResourceConflictRecord>[];
  readonly proofObligations?: readonly Partial<SemanticResourceProofObligationRecord>[];
  readonly resourceGraph?: Partial<SemanticResourceGraph>;
  readonly semanticResourceGraph?: Partial<SemanticResourceGraph>;
  readonly resourceGraphs?: readonly Partial<SemanticResourceGraph>[];
  readonly graphs?: readonly Partial<SemanticResourceGraph>[];
  readonly imports?: readonly Record<string, unknown>[];
  readonly ownershipRegions?: readonly Record<string, unknown>[];
  readonly paradigmSemantics?: Record<string, unknown>;
  readonly evidence?: readonly { readonly id?: string }[];
  readonly evidenceIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticResourceGraphQuery {
  readonly kind?: SemanticResourceGraphRecordKind | readonly SemanticResourceGraphRecordKind[];
  readonly resourceId?: string | readonly string[];
  readonly ownerId?: string | readonly string[];
  readonly lifetimeRegionId?: string | readonly string[];
  readonly lifetimeRelationKind?: string | readonly string[];
  readonly fromLifetimeId?: string | readonly string[];
  readonly toLifetimeId?: string | readonly string[];
  readonly escapeKind?: string | readonly string[];
  readonly sourcePath?: string | readonly string[];
  readonly status?: string | readonly string[];
  readonly evidenceId?: string | readonly string[];
  readonly unsafe?: boolean;
}

export declare const SemanticResourceGraphRecordKinds: readonly SemanticResourceGraphRecordKind[];
export declare const SemanticResourceLoanModes: readonly SemanticResourceLoanMode[];
export declare function createSemanticResourceGraph(input?: SemanticResourceGraphInput): SemanticResourceGraph;
export declare function summarizeSemanticResourceGraph(graph?: Partial<SemanticResourceGraph>): SemanticResourceGraphSummary;
export declare function querySemanticResourceGraph(
  graph?: Partial<SemanticResourceGraph>,
  query?: SemanticResourceGraphQuery
): readonly SemanticResourceGraphRecord[];
