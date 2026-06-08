import type {
  FrontierSourceLanguage,
  SemanticMergeCandidateRecord,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type {
  SemanticMergeCandidateAdmissionRecord,
  SemanticMergeCandidateChangedRegion,
  SemanticMergeCandidateProjectionRisk
} from './semantic-merge-candidates.js';

export type SemanticMergeConflictClass =
  | 'same-symbol-edit'
  | 'delete-modify'
  | 'shifted-code'
  | 'duplicate-signature'
  | 'dependency-drift'
  | 'behavior-evidence-needed';

export type SemanticMergeConflictRisk = 'low' | 'medium' | 'high';

export interface SemanticMergeConflictClassRecord {
  readonly schema: 'frontier.lang.semanticMergeConflictClass.v1';
  readonly id: string;
  readonly class: SemanticMergeConflictClass;
  readonly risk: SemanticMergeConflictRisk;
  readonly readiness: SemanticMergeReadiness;
  readonly conflictKeys: readonly string[];
  readonly symbolIds: readonly string[];
  readonly regionKeys: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly reasonCode: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SemanticMergeConflictSummary {
  readonly schema: 'frontier.lang.semanticMergeConflictSummary.v1';
  readonly total: number;
  readonly classes: readonly SemanticMergeConflictClass[];
  readonly byClass: Readonly<Record<string, number>>;
  readonly byRisk: Readonly<Record<string, number>>;
  readonly highestRisk: SemanticMergeConflictRisk;
  readonly readiness: SemanticMergeReadiness;
  readonly riskScore: number;
  readonly conflictKeys: readonly string[];
  readonly language?: FrontierSourceLanguage | string;
  readonly sourcePath?: string;
}

export type SemanticMergeCandidateWithConflicts = SemanticMergeCandidateRecord & {
  readonly changedSemanticRegions?: readonly SemanticMergeCandidateChangedRegion[];
  readonly sourceHashes?: SemanticMergeCandidateAdmissionRecord['sourceHashes'];
  readonly evidenceIds?: readonly string[];
  readonly proofIds?: readonly string[];
  readonly projectionRisk?: SemanticMergeCandidateProjectionRisk;
  readonly readinessSortKey?: number;
  readonly mergeAdmission?: SemanticMergeCandidateAdmissionRecord;
  readonly conflictClasses?: readonly SemanticMergeConflictClassRecord[];
  readonly conflictSummary?: SemanticMergeConflictSummary;
  readonly metadata?: SemanticMergeCandidateRecord['metadata'] & {
    readonly conflictClasses?: readonly SemanticMergeConflictClassRecord[];
    readonly conflictSummary?: SemanticMergeConflictSummary;
  };
};

export interface SemanticMergeConflictClassQueryOptions {
  readonly class?: SemanticMergeConflictClass | string;
  readonly classes?: readonly (SemanticMergeConflictClass | string)[];
  readonly risk?: SemanticMergeConflictRisk | string;
  readonly risks?: readonly (SemanticMergeConflictRisk | string)[];
  readonly readiness?: SemanticMergeReadiness | string;
  readonly readinesses?: readonly (SemanticMergeReadiness | string)[];
  readonly conflictKey?: string;
  readonly sort?: boolean;
}

export type QueriedSemanticMergeConflictClassRecord = SemanticMergeConflictClassRecord & {
  readonly candidateId?: string;
  readonly candidateReadiness?: SemanticMergeReadiness;
  readonly candidateRiskScore: number;
};

export declare const SemanticMergeConflictClasses: readonly SemanticMergeConflictClass[];
export declare function querySemanticMergeConflictClasses(candidates: SemanticMergeCandidateWithConflicts | readonly SemanticMergeCandidateWithConflicts[], options?: SemanticMergeConflictClassQueryOptions): readonly QueriedSemanticMergeConflictClassRecord[];
export declare function semanticMergeConflictRiskScore(candidateOrSummary: SemanticMergeCandidateWithConflicts | SemanticMergeConflictSummary): number;
export declare function sortSemanticMergeCandidatesByConflictRisk<T extends SemanticMergeCandidateWithConflicts>(candidates: readonly T[], options?: { readonly desc?: boolean }): readonly T[];
export declare function summarizeSemanticMergeConflicts(conflictClasses?: readonly SemanticMergeConflictClassRecord[], context?: {
  readonly readiness?: SemanticMergeReadiness;
  readonly conflictKeys?: readonly string[];
  readonly sourcePath?: string;
  readonly language?: FrontierSourceLanguage | string;
}): SemanticMergeConflictSummary;
