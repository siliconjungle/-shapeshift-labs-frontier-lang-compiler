import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type {
  UniversalConversionAdmissionAction,
  UniversalConversionPlan,
  UniversalConversionPlanOptions,
  UniversalConversionPriority,
  UniversalConversionRouteAction,
  UniversalConversionRouteMode
} from './universal-conversion-plan.js';

export type UniversalConversionWorkItemKind =
  | 'add-target-adapter'
  | 'collect-translation-proof'
  | 'prove-runtime-adapter'
  | 'collect-dialect-evidence'
  | 'collect-source-evidence'
  | 'review-route'
  | 'unblock-route';

export type UniversalConversionWorkItemAction =
  | 'add-target-adapter'
  | 'collect-translation-evidence'
  | 'collect-runtime-adapter-proof'
  | 'collect-dialect-projection-evidence'
  | 'collect-source-evidence'
  | 'review-conversion-route'
  | 'resolve-blocker';

export interface UniversalConversionWorkItem {
  readonly id: string;
  readonly kind: UniversalConversionWorkItemKind;
  readonly action: UniversalConversionWorkItemAction;
  readonly priority: UniversalConversionPriority;
  readonly routeIds: readonly string[];
  readonly sourceLanguages: readonly string[];
  readonly languageIds: readonly string[];
  readonly targets: readonly string[];
  readonly modes: readonly UniversalConversionRouteMode[];
  readonly readinesses: readonly string[];
  readonly admissionActions: readonly UniversalConversionAdmissionAction[];
  readonly routeActions: readonly UniversalConversionRouteAction[];
  readonly evidenceKeys: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly tasks: readonly string[];
  readonly runtimeAdapterRequirementIds: readonly string[];
  readonly dialectRecordIds: readonly string[];
  readonly targetAdapterIds: readonly string[];
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalConversionWorklistOptions {
  readonly generatedAt?: number;
  readonly routeId?: string | readonly string[];
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly kind?: UniversalConversionWorkItemKind | readonly UniversalConversionWorkItemKind[];
  readonly includeReviewItems?: boolean;
}

export interface UniversalConversionWorklist {
  readonly kind: 'frontier.lang.universalConversionWorklist';
  readonly version: 1;
  readonly generatedAt: number;
  readonly planId: string;
  readonly items: readonly UniversalConversionWorkItem[];
  readonly summary: {
    readonly items: number;
    readonly byKind: Readonly<Record<string, number>>;
    readonly byPriority: Readonly<Record<string, number>>;
    readonly routeIds: readonly string[];
    readonly sourceLanguages: readonly string[];
    readonly targets: readonly string[];
    readonly evidenceKeys: readonly string[];
    readonly missingEvidence: readonly string[];
    readonly blockers: number;
    readonly reviewReasons: number;
    readonly targetAdapterGaps: number;
    readonly proofEvidenceGaps: number;
    readonly runtimeAdapterGaps: number;
    readonly dialectEvidenceGaps: number;
    readonly autoMergeClaims: 0;
    readonly semanticEquivalenceClaims: 0;
  };
  readonly metadata: {
    readonly routes: number;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
    readonly note: string;
  };
}

export declare const UniversalConversionWorkItemKinds: readonly UniversalConversionWorkItemKind[];
export declare function createUniversalConversionWorklist(
  planOrOptions?: UniversalConversionPlan | UniversalConversionPlanOptions,
  options?: UniversalConversionWorklistOptions
): UniversalConversionWorklist;
