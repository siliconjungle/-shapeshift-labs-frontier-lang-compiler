import type { FrontierSourceLanguage, SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { NativeImportLossSummary } from './native-import-losses.js';
import type { NativeImportResultContract } from './native-import-contracts.js';
import type { NativeProjectImportResult } from './native-project.js';

export type NativeProjectImportAdmissionAction = 'admit' | 'prioritize' | 'reject';
export type NativeProjectImportAdmissionPriority = 'low' | 'normal' | 'high' | 'critical' | 'blocker';
export type NativeProjectImportAdmissionRisk = 'low' | 'medium' | 'high' | 'unknown';
export type NativeProjectSourcePreservationQuality = 'exact' | 'lossy' | 'missing' | 'stale' | 'empty';

export interface NativeProjectAdmissionLanguageSummary {
  readonly language: FrontierSourceLanguage | string;
  readonly sourceCount: number;
  readonly sourcePaths: readonly string[];
  readonly readiness: SemanticMergeReadiness;
  readonly semanticSymbols: number;
  readonly emptySemanticEvidenceSources: number;
  readonly sourcePreservationQuality: NativeProjectSourcePreservationQuality;
  readonly staleSourcePaths: readonly string[];
  readonly mergeCandidates: number;
  readonly highestRisk: NativeProjectImportAdmissionRisk;
}

export interface NativeProjectAdmissionLanguages {
  readonly total: number;
  readonly byReadiness: Readonly<Record<string, number>>;
  readonly bySourcePreservationQuality: Readonly<Record<string, number>>;
  readonly rows: readonly NativeProjectAdmissionLanguageSummary[];
}

export interface NativeProjectAdmissionSemanticEvidence {
  readonly empty: boolean;
  readonly emptySourceCount: number;
  readonly emptySourcePaths: readonly string[];
  readonly symbols: number;
  readonly occurrences: number;
  readonly relations: number;
  readonly facts: number;
  readonly evidenceRecords: number;
}

export interface NativeProjectAdmissionSourcePreservation {
  readonly quality: NativeProjectSourcePreservationQuality;
  readonly total: number;
  readonly exactSourceAvailable: number;
  readonly sourceBytes: number;
  readonly tokens: number;
  readonly trivia: number;
  readonly directives: number;
  readonly comments: number;
  readonly truncated: boolean;
  readonly stale: number;
  readonly missing: number;
  readonly lossy: number;
  readonly staleSourcePaths: readonly string[];
  readonly lossySourcePaths: readonly string[];
  readonly byQuality: Readonly<Record<string, number>>;
}

export interface NativeProjectAdmissionOwnership {
  readonly total: number;
  readonly changed: number;
  readonly ids: readonly string[];
  readonly keys: readonly string[];
  readonly changedIds: readonly string[];
  readonly changedKeys: readonly string[];
  readonly candidateRegionConflictKeys: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly byKind: Readonly<Record<string, number>>;
  readonly byGranularity: Readonly<Record<string, number>>;
  readonly byPrecision: Readonly<Record<string, number>>;
  readonly byLanguage: Readonly<Record<string, number>>;
}

export interface NativeProjectAdmissionMergeCandidates {
  readonly total: number;
  readonly readiness: SemanticMergeReadiness;
  readonly highestRisk: NativeProjectImportAdmissionRisk;
  readonly byRisk: Readonly<Record<string, number>>;
  readonly byReadiness: Readonly<Record<string, number>>;
  readonly highRiskCandidateIds: readonly string[];
  readonly reviewCandidateIds: readonly string[];
  readonly blockedCandidateIds: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly patchRisk?: NativeProjectImportAdmissionRisk;
}

export type NativeProjectAdmissionScoreComponentKey =
  | 'semanticEvidence'
  | 'sourcePreservation'
  | 'sourceFreshness'
  | 'ownershipChange'
  | 'proofReadiness'
  | 'targetProjectionCoverage';

export type NativeProjectAdmissionScoreComponentStatus = 'strong' | 'partial' | 'weak' | 'blocked';

export interface NativeProjectAdmissionScoreComponent {
  readonly key: NativeProjectAdmissionScoreComponentKey;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly status: NativeProjectAdmissionScoreComponentStatus;
  readonly reasons: readonly string[];
  readonly signals: Record<string, unknown>;
}

export interface NativeProjectAdmissionMergeScoreComponents {
  readonly semanticEvidence: NativeProjectAdmissionScoreComponent;
  readonly sourcePreservation: NativeProjectAdmissionScoreComponent;
  readonly sourceFreshness: NativeProjectAdmissionScoreComponent;
  readonly ownershipChange: NativeProjectAdmissionScoreComponent;
  readonly proofReadiness: NativeProjectAdmissionScoreComponent;
  readonly targetProjectionCoverage: NativeProjectAdmissionScoreComponent;
}

export interface NativeProjectAdmissionMergeScore {
  readonly schema: 'frontier.lang.semanticMergeScore.v1';
  readonly version: 1;
  readonly value: number;
  readonly uncappedValue: number;
  readonly sortKey: number;
  readonly higherIsBetter: true;
  readonly readiness: SemanticMergeReadiness;
  readonly risk: NativeProjectImportAdmissionRisk;
  readonly action: NativeProjectImportAdmissionAction;
  readonly priority: NativeProjectImportAdmissionPriority;
  readonly components: NativeProjectAdmissionMergeScoreComponents;
  readonly penalties: readonly string[];
}

export interface NativeProjectImportAdmission {
  readonly kind: 'frontier.lang.projectImportAdmission';
  readonly version: 1;
  readonly projectImportId?: string;
  readonly language?: FrontierSourceLanguage | 'mixed' | string;
  readonly projectRoot?: string;
  readonly action: NativeProjectImportAdmissionAction;
  readonly priority: NativeProjectImportAdmissionPriority;
  readonly readiness: SemanticMergeReadiness;
  readonly sourceCount: number;
  readonly languages: NativeProjectAdmissionLanguages;
  readonly semanticEvidence: NativeProjectAdmissionSemanticEvidence;
  readonly sourcePreservation: NativeProjectAdmissionSourcePreservation;
  readonly ownership: NativeProjectAdmissionOwnership;
  readonly mergeCandidates: NativeProjectAdmissionMergeCandidates;
  readonly mergeScore?: NativeProjectAdmissionMergeScore;
  readonly reasons: readonly string[];
  readonly metadata: Record<string, unknown>;
}

export interface CreateProjectImportAdmissionRecordOptions {
  readonly importResultContract?: NativeImportResultContract;
  readonly lossSummary?: NativeImportLossSummary;
}

export declare function createProjectImportAdmissionRecord(
  projectResult: NativeProjectImportResult,
  options?: CreateProjectImportAdmissionRecordOptions
): NativeProjectImportAdmission;
