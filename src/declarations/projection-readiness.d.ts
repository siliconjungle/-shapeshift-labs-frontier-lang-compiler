import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { NativeImportKnownLossKind, NativeImportTaxonomyKind } from './native-import-losses.js';
import type { NativeParserFeatureCategory } from './native-parser-features.js';
import type {
  ProjectionTargetLossClass,
  ProjectionTargetLossMatrix,
  ProjectionTargetLossMatrixOptions
} from './projection-coverage.js';

export type ProjectionReadinessStatus = 'preserve' | 'lower' | 'shim' | 'lossy' | 'blocked' | string;

export interface ProjectionReadinessFeatureCell {
  readonly category: NativeParserFeatureCategory;
  readonly status: ProjectionReadinessStatus;
  readonly readiness: SemanticMergeReadiness;
  readonly lossClass: ProjectionTargetLossClass;
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly reasons: readonly string[];
  readonly notes: readonly string[];
}

export interface ProjectionReadinessTargetCell {
  readonly sourceLanguage: FrontierSourceLanguage | string;
  readonly target: FrontierCompileTarget | string;
  readonly status: ProjectionReadinessStatus;
  readonly readiness: SemanticMergeReadiness;
  readonly lossClass: ProjectionTargetLossClass;
  readonly supported: boolean;
  readonly adapter?: string;
  readonly adapterKind?: 'importer' | 'targetProjection' | string;
  readonly features: readonly ProjectionReadinessFeatureCell[];
  readonly byFeature: Readonly<Partial<Record<NativeParserFeatureCategory, ProjectionReadinessStatus>>>;
  readonly blockingFeatures: readonly NativeParserFeatureCategory[];
  readonly lossyFeatures: readonly NativeParserFeatureCategory[];
  readonly shimFeatures: readonly NativeParserFeatureCategory[];
  readonly lowerFeatures: readonly NativeParserFeatureCategory[];
  readonly preserveFeatures: readonly NativeParserFeatureCategory[];
  readonly lossKinds: readonly NativeImportKnownLossKind[];
  readonly categories: readonly NativeImportTaxonomyKind[];
  readonly reasons: readonly string[];
  readonly notes: readonly string[];
}

export interface ProjectionReadinessLanguageRow {
  readonly language: FrontierSourceLanguage | string;
  readonly aliases: readonly string[];
  readonly extensions: readonly string[];
  readonly targets: readonly ProjectionReadinessTargetCell[];
  readonly summary: ProjectionReadinessSummary;
}

export interface ProjectionReadinessSummary {
  readonly targetEntries: number;
  readonly featureCells: number;
  readonly byStatus: Readonly<Record<ProjectionReadinessStatus, number>>;
  readonly byFeatureStatus: Readonly<Partial<Record<NativeParserFeatureCategory, Readonly<Record<ProjectionReadinessStatus, number>>>>>;
  readonly preserveTargets: number;
  readonly lowerTargets: number;
  readonly shimTargets: number;
  readonly lossyTargets: number;
  readonly blockedTargets: number;
}

export interface ProjectionReadinessMatrix {
  readonly kind: 'frontier.lang.projectionReadinessMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly languages: readonly ProjectionReadinessLanguageRow[];
  readonly summary: ProjectionReadinessSummary & { readonly languages: number };
  readonly matrices: { readonly projectionTargets: ProjectionTargetLossMatrix };
  readonly metadata: {
    readonly statuses: readonly ProjectionReadinessStatus[];
    readonly featureCategories: readonly NativeParserFeatureCategory[];
    readonly compileTargets: readonly (FrontierCompileTarget | string)[];
    readonly note: string;
  };
}

export interface ProjectionReadinessMatrixOptions extends ProjectionTargetLossMatrixOptions {
  readonly featureCategories?: readonly (NativeParserFeatureCategory | string)[] | NativeParserFeatureCategory | string;
  readonly projectionTargetMatrix?: ProjectionTargetLossMatrix;
}

export interface ProjectionReadinessMatrixQuery {
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly featureCategory?: NativeParserFeatureCategory | string;
  readonly category?: NativeParserFeatureCategory | string;
}

export interface ProjectionReadinessMatrixQueryResult {
  readonly kind: 'frontier.lang.projectionReadinessQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly featureCategory?: NativeParserFeatureCategory | string;
  readonly status: ProjectionReadinessStatus;
  readonly readiness: SemanticMergeReadiness;
  readonly cell?: ProjectionReadinessTargetCell;
  readonly feature?: ProjectionReadinessFeatureCell;
  readonly reasons: readonly string[];
}

export declare const ProjectionReadinessStatuses: readonly ProjectionReadinessStatus[];
export declare function createProjectionReadinessMatrix(options?: ProjectionReadinessMatrixOptions): ProjectionReadinessMatrix;
export declare function queryProjectionReadinessMatrix(
  matrixOrOptions?: ProjectionReadinessMatrix | ProjectionReadinessMatrixOptions,
  query?: ProjectionReadinessMatrixQuery
): ProjectionReadinessMatrixQueryResult;
