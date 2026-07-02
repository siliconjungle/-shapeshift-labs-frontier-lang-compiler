import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { NativeImportLanguageProfile } from './native-import-losses.js';
import type { LanguageAdapterPackageContract } from './language-adapter-package-contracts.js';

export type UniversalLanguageCoverageSurfaceId =
  | 'parserSourceSpanTrivia'
  | 'scopeUseDefGraph'
  | 'moduleExportImportGraph'
  | 'typePublicApiGraph'
  | 'controlFlowEffectGraph'
  | 'semanticEditAdmission'
  | 'targetLowering'
  | 'roundtripProjection'
  | 'runtimeProof'
  | 'packageBuildGraph'
  | 'crossLanguageConversion'
  | string;

export type UniversalLanguageCoverageStatus =
  | 'high'
  | 'bounded-evidence'
  | 'partial'
  | 'adapter-only'
  | 'planned'
  | 'missing'
  | 'blocked'
  | 'not-applicable'
  | string;

export type UniversalLanguageCoverageReadinessStatus =
  | 'high'
  | 'bounded-evidence'
  | 'partial'
  | 'planned'
  | 'blocked'
  | string;

export type UniversalLanguageCoverageRowKind =
  | 'language'
  | 'dialect'
  | 'artifact'
  | 'runtime-surface'
  | string;

export interface UniversalLanguageCoverageSurface {
  readonly surface: UniversalLanguageCoverageSurfaceId;
  readonly status: UniversalLanguageCoverageStatus;
  readonly estimate?: number;
  readonly evidence: readonly string[];
  readonly blockers: readonly string[];
  readonly notes: readonly string[];
}

export interface UniversalLanguageCoveragePackageEvidence {
  readonly status:
    | 'target-projection'
    | 'dependency-only'
    | 'platform-importer'
    | 'planned-platform'
    | 'missing-package'
    | string;
  readonly packageNames: readonly string[];
  readonly packageVersions: readonly string[];
  readonly packageClasses: readonly string[];
  readonly releaseReady: boolean;
  readonly releaseReadyCount: number;
  readonly plannedOnly: boolean;
  readonly hostEvidenceRequired: boolean;
  readonly targetProjectionSupported: boolean;
  readonly targetProjectionTargets: readonly (FrontierCompileTarget | string)[];
  readonly requiredEvidenceKeys: readonly string[];
  readonly notes: readonly string[];
}

export interface UniversalLanguageCoverageRow {
  readonly kind: 'frontier.lang.universalLanguageCoverageRow';
  readonly version: 1;
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly rowKind: UniversalLanguageCoverageRowKind;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly readiness: UniversalLanguageCoverageReadinessStatus;
  readonly completionEstimate: number;
  readonly surfaces: readonly UniversalLanguageCoverageSurface[];
  readonly surfaceStatusCounts: Readonly<Record<string, number>>;
  readonly package: UniversalLanguageCoveragePackageEvidence;
  readonly target: {
    readonly compileTarget?: FrontierCompileTarget | string;
    readonly lowerable: boolean;
    readonly targetProjectionSupported: boolean;
  };
  readonly evidence: {
    readonly parserAdapters: readonly string[];
    readonly knownLossKinds: readonly string[];
    readonly production?: unknown;
    readonly profileDefaultReadiness?: string;
    readonly source: string;
  };
  readonly remainingWork: readonly string[];
  readonly notes: readonly string[];
}

export interface UniversalLanguageCoverageMatrixSummary {
  readonly rows: number;
  readonly languages: readonly string[];
  readonly rowKinds: Readonly<Record<string, number>>;
  readonly byReadiness: Readonly<Record<string, number>>;
  readonly byPackageStatus: Readonly<Record<string, number>>;
  readonly bySurfaceStatus: Readonly<Record<string, number>>;
  readonly averageCompletionEstimate: number;
  readonly highRows: number;
  readonly boundedEvidenceRows: number;
  readonly partialRows: number;
  readonly plannedRows: number;
  readonly blockedRows: number;
  readonly missingSurfaceCells: number;
  readonly blockedSurfaceCells: number;
  readonly packages: readonly string[];
  readonly targetProjectionRows: number;
  readonly remainingWorkItems: number;
}

export interface UniversalLanguageCoverageMatrix {
  readonly kind: 'frontier.lang.universalLanguageCoverageMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly surfaces: readonly UniversalLanguageCoverageSurfaceId[];
  readonly languages: readonly UniversalLanguageCoverageRow[];
  readonly summary: UniversalLanguageCoverageMatrixSummary;
  readonly metadata: {
    readonly languageDenominator: readonly string[];
    readonly statusVocabulary: readonly UniversalLanguageCoverageStatus[];
    readonly readinessVocabulary: readonly UniversalLanguageCoverageReadinessStatus[];
    readonly note: string;
  };
}

export interface UniversalLanguageCoverageMatrixOptions {
  readonly generatedAt?: number;
  readonly languages?: readonly (NativeImportLanguageProfile | FrontierSourceLanguage | string)[];
  readonly languageDenominator?: readonly (FrontierSourceLanguage | string)[];
  readonly requiredLanguages?: readonly (FrontierSourceLanguage | string)[];
  readonly includeDefaultSemanticSurfaces?: boolean;
  readonly packageContracts?: readonly LanguageAdapterPackageContract[];
  readonly surfaceOverrides?: Readonly<Record<string, Readonly<Record<string, UniversalLanguageCoverageStatus | Partial<UniversalLanguageCoverageSurface>>>>>;
  readonly rowOverrides?: Readonly<Record<string, Partial<Pick<UniversalLanguageCoverageRow, 'readiness' | 'completionEstimate' | 'notes'>>>>;
  readonly productionEvidence?: Readonly<Record<string, unknown>>;
}

type UniversalLanguageCoverageQueryFilter<T> = T | readonly T[];

export interface UniversalLanguageCoverageMatrixQuery {
  readonly id?: UniversalLanguageCoverageQueryFilter<string>;
  readonly language?: UniversalLanguageCoverageQueryFilter<FrontierSourceLanguage | string>;
  readonly rowKind?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageRowKind>;
  readonly readiness?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageReadinessStatus>;
  readonly packageStatus?: UniversalLanguageCoverageQueryFilter<string>;
  readonly packageName?: UniversalLanguageCoverageQueryFilter<string>;
  readonly surface?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageSurfaceId>;
  readonly surfaceStatus?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageStatus>;
  readonly missingSurface?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageSurfaceId>;
  readonly blockedSurface?: UniversalLanguageCoverageQueryFilter<UniversalLanguageCoverageSurfaceId>;
  readonly minCompletionEstimate?: number;
  readonly maxCompletionEstimate?: number;
}

export interface UniversalLanguageCoverageMatrixQueryResult {
  readonly kind: 'frontier.lang.universalLanguageCoverageQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly rows: readonly UniversalLanguageCoverageRow[];
  readonly bestRow?: UniversalLanguageCoverageRow;
  readonly summary: UniversalLanguageCoverageMatrixSummary;
  readonly reasons: readonly string[];
}

export declare const UniversalLanguageCoverageSurfaceIds: readonly UniversalLanguageCoverageSurfaceId[];
export declare const UniversalLanguageCoverageStatuses: readonly UniversalLanguageCoverageStatus[];
export declare const UniversalLanguageCoverageReadinessStatuses: readonly UniversalLanguageCoverageReadinessStatus[];
export declare function createUniversalLanguageCoverageMatrix(
  options?: UniversalLanguageCoverageMatrixOptions
): UniversalLanguageCoverageMatrix;
export declare function queryUniversalLanguageCoverageMatrix(
  matrixOrOptions?: UniversalLanguageCoverageMatrix | UniversalLanguageCoverageMatrixOptions,
  query?: UniversalLanguageCoverageMatrixQuery
): UniversalLanguageCoverageMatrixQueryResult;
