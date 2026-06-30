import type { EvidenceRecord, FrontierSourceLanguage, SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionRoute,
  UniversalConversionRouteMode,
  UniversalTranslationAdmissionAction,
  UniversalTranslationAdmissionStatus
} from './universal-conversion-plan.js';

export type UniversalConversionRouteEvidenceBinding = 'bound' | 'rejected';
export type UniversalConversionRouteEvidenceRejectionReason =
  | 'unscoped-evidence'
  | 'route-id-mismatch'
  | 'source-language-mismatch'
  | 'target-mismatch'
  | 'not-route-bound'
  | string;

export interface UniversalConversionRouteEvidenceReceiptRecord {
  readonly id: string;
  readonly kind: string;
  readonly status: string;
  readonly binding: UniversalConversionRouteEvidenceBinding;
  readonly routeIds: readonly string[];
  readonly sourceLanguages: readonly string[];
  readonly targets: readonly string[];
  readonly proof: boolean;
  readonly reason?: UniversalConversionRouteEvidenceRejectionReason;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalConversionRouteEvidenceReceiptOptions {
  readonly routeId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly mode?: UniversalConversionRouteMode;
  readonly readiness?: SemanticMergeReadiness | string;
  readonly admissionAction?: UniversalConversionAdmissionAction;
  readonly translationAdmissionStatus?: UniversalTranslationAdmissionStatus;
  readonly translationAdmissionAction?: UniversalTranslationAdmissionAction;
  readonly targetAdapterId?: string;
  readonly evidence?: readonly EvidenceRecord[] | readonly Record<string, unknown>[];
  readonly includeRejectedEvidence?: boolean;
}

export interface UniversalConversionRouteEvidenceReceipt {
  readonly kind: 'frontier.lang.universalConversionRouteEvidenceReceipt';
  readonly version: 1;
  readonly schema: 'frontier.lang.universalConversionRouteEvidenceReceipt.v1';
  readonly routeId: string;
  readonly planId?: string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly languageIds: readonly string[];
  readonly target?: FrontierCompileTarget | string;
  readonly mode: UniversalConversionRouteMode;
  readonly readiness: SemanticMergeReadiness | string;
  readonly admissionAction: UniversalConversionAdmissionAction;
  readonly translationAdmissionStatus?: UniversalTranslationAdmissionStatus;
  readonly translationAdmissionAction?: UniversalTranslationAdmissionAction;
  readonly evidenceIds: readonly string[];
  readonly proofEvidenceIds: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly sources: UniversalConversionRoute['mergeRefs']['sources'];
  readonly ownershipKeys: readonly string[];
  readonly conflictKeys: readonly string[];
  readonly records: {
    readonly bound: readonly UniversalConversionRouteEvidenceReceiptRecord[];
    readonly rejected: readonly UniversalConversionRouteEvidenceReceiptRecord[];
  };
  readonly summary: {
    readonly boundEvidence: number;
    readonly rejectedEvidence: number;
    readonly proofEvidence: number;
    readonly missingEvidence: number;
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly byStatus: Readonly<Record<string, number>>;
    readonly rejectedByReason: Readonly<Record<string, number>>;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
  readonly metadata: {
    readonly routeEvidenceRequired: true;
    readonly sourceBound: boolean;
    readonly note: string;
  };
}

export type CreateUniversalConversionRouteEvidenceReceiptInput =
  | UniversalConversionRoute
  | UniversalConversionPlan
  | UniversalConversionPlanOptions;

export declare function createUniversalConversionRouteEvidenceReceipt(
  routeOrInput?: CreateUniversalConversionRouteEvidenceReceiptInput,
  options?: UniversalConversionRouteEvidenceReceiptOptions
): UniversalConversionRouteEvidenceReceipt;
