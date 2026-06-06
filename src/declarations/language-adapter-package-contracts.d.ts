import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { ExternalSemanticIndexFormat } from './import-adapter-core.js';
import type { NativeImporterAdapterExactness } from './adapter-coverage.js';
import type { NativeParserAstFormatKind } from './native-parser-formats.js';
import type { ProjectionTargetLossClass } from './projection-coverage.js';

export type LanguageAdapterPackageClass =
  | 'target-projection'
  | 'native-importer'
  | 'platform-importer'
  | string;

export type LanguageAdapterPackageReleaseReadinessStatus =
  | SemanticMergeReadiness
  | string;

export interface LanguageAdapterPackageSourceParserContract {
  readonly language: FrontierSourceLanguage | string;
  readonly parser: string;
  readonly format: NativeParserAstFormatKind | string;
  readonly supportedLanguages: readonly (FrontierSourceLanguage | string)[];
  readonly supportedFormats: readonly (NativeParserAstFormatKind | string)[];
  readonly formatKind: 'abstract-ast' | 'concrete-syntax-tree' | 'compiler-ast' | 'semantic-index' | string;
  readonly exactness: NativeImporterAdapterExactness;
  readonly sourceRangeModel: string;
  readonly preservesTokens: boolean;
  readonly preservesTrivia: boolean;
  readonly supportsErrorRecovery: boolean;
  readonly caveats: readonly string[];
}

export interface LanguageAdapterPackageTargetProjectionSupport {
  readonly target: FrontierCompileTarget | string;
  readonly supported: boolean;
  readonly support: 'package-projection' | 'not-shipped' | 'preserved-source' | 'stubs' | string;
  readonly readiness: LanguageAdapterPackageReleaseReadinessStatus;
  readonly lossClass: ProjectionTargetLossClass | string;
  readonly reasons: readonly string[];
}

export interface LanguageAdapterPackageTargetProjectionContract {
  readonly supported: boolean;
  readonly targets: readonly (FrontierCompileTarget | string)[];
  readonly defaultTarget?: FrontierCompileTarget | string;
  readonly support: readonly LanguageAdapterPackageTargetProjectionSupport[];
  readonly caveats: readonly string[];
}

export interface LanguageAdapterPackageSemanticIndexContract {
  readonly supported: boolean;
  readonly formats: readonly (ExternalSemanticIndexFormat | string)[];
  readonly capabilities: readonly string[];
  readonly hostEvidenceRequired: boolean;
}

export interface LanguageAdapterPackageProofEvidenceContract {
  readonly supported: boolean;
  readonly evidenceKinds: readonly string[];
  readonly proofKinds: readonly string[];
  readonly requiredEvidenceKeys: readonly string[];
  readonly hostEvidenceRequired: boolean;
}

export interface LanguageAdapterPackageReleaseReadiness {
  readonly status: LanguageAdapterPackageReleaseReadinessStatus;
  readonly releaseReady: boolean;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly versionSource: string;
  readonly reasons: readonly string[];
  readonly blockers: readonly string[];
  readonly signals: readonly string[];
}

export interface LanguageAdapterPackageContract {
  readonly kind: 'frontier.lang.languageAdapterPackageContract';
  readonly version: 3;
  readonly id: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly package: {
    readonly name: string;
    readonly version: string;
    readonly exportPath: string;
    readonly packageClass: LanguageAdapterPackageClass;
    readonly family: string;
    readonly adapterId: string;
  };
  readonly sourceParser: LanguageAdapterPackageSourceParserContract;
  readonly targetProjection: LanguageAdapterPackageTargetProjectionContract;
  readonly semanticIndex: LanguageAdapterPackageSemanticIndexContract;
  readonly proofEvidence: LanguageAdapterPackageProofEvidenceContract;
  readonly releaseReadiness: LanguageAdapterPackageReleaseReadiness;
  readonly runtime: {
    readonly importsAdapterPackage: false;
    readonly contractOnly: true;
    readonly importPath: string;
  };
  readonly metadata: Record<string, unknown>;
}

export interface LanguageAdapterPackageContractInput {
  readonly id?: string;
  readonly packageName?: string;
  readonly packageVersion?: string;
  readonly packageClass?: LanguageAdapterPackageClass;
  readonly package?: Partial<LanguageAdapterPackageContract['package']>;
  readonly family?: string;
  readonly adapterId?: string;
  readonly exportPath?: string;
  readonly language?: FrontierSourceLanguage | string;
  readonly languages?: readonly (FrontierSourceLanguage | string)[];
  readonly parser?: string;
  readonly parserFormat?: NativeParserAstFormatKind | string;
  readonly sourceParser?: Partial<LanguageAdapterPackageSourceParserContract>;
  readonly supportedLanguages?: readonly (FrontierSourceLanguage | string)[];
  readonly supportedFormats?: readonly (NativeParserAstFormatKind | string)[];
  readonly formats?: readonly (NativeParserAstFormatKind | string)[];
  readonly target?: FrontierCompileTarget | string;
  readonly targets?: readonly (FrontierCompileTarget | string)[] | FrontierCompileTarget | string;
  readonly targetProjection?: Partial<LanguageAdapterPackageTargetProjectionContract> & {
    readonly readiness?: LanguageAdapterPackageReleaseReadinessStatus;
    readonly lossClass?: ProjectionTargetLossClass | string;
    readonly reasons?: readonly string[];
  };
  readonly semanticIndex?: Partial<LanguageAdapterPackageSemanticIndexContract>;
  readonly proofEvidence?: Partial<LanguageAdapterPackageProofEvidenceContract>;
  readonly proofKeys?: readonly string[];
  readonly releaseReadiness?: Partial<LanguageAdapterPackageReleaseReadiness> | LanguageAdapterPackageReleaseReadinessStatus;
  readonly releaseReady?: boolean;
  readonly readiness?: LanguageAdapterPackageReleaseReadinessStatus;
  readonly reasons?: readonly string[];
  readonly blockers?: readonly string[];
  readonly versionSource?: string;
  readonly signals?: readonly string[];
  readonly exactness?: NativeImporterAdapterExactness;
  readonly sourceRangeModel?: string;
  readonly preservesTokens?: boolean;
  readonly preservesTrivia?: boolean;
  readonly supportsErrorRecovery?: boolean;
  readonly parserCaveats?: readonly string[];
  readonly targetCaveats?: readonly string[];
  readonly runtime?: { readonly importPath?: string };
  readonly metadata?: Record<string, unknown>;
}

export interface LanguageAdapterPackageContractQuery {
  readonly packageName?: string;
  readonly packageClass?: LanguageAdapterPackageClass;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly semanticIndexFormat?: ExternalSemanticIndexFormat | string;
  readonly releaseReady?: boolean;
  readonly importsAdapterPackage?: boolean;
  readonly proofEvidenceSupported?: boolean;
}

export interface LanguageAdapterPackageContractSummary {
  readonly kind: 'frontier.lang.languageAdapterPackageContractSummary';
  readonly version: 1;
  readonly packages: number;
  readonly releaseReady: number;
  readonly runtimeImportsAdapterPackages: number;
  readonly languages: readonly string[];
  readonly parserFormats: readonly string[];
  readonly projectionTargets: readonly string[];
  readonly semanticIndexFormats: readonly string[];
  readonly byPackageClass: Readonly<Record<string, number>>;
  readonly byReleaseReadiness: Readonly<Record<string, number>>;
}

export declare const LanguageAdapterPackageReleaseReadinessStatuses: readonly LanguageAdapterPackageReleaseReadinessStatus[];
export declare const LanguageAdapterPackageContracts: readonly LanguageAdapterPackageContract[];
export declare function createLanguageAdapterPackageContract(input?: LanguageAdapterPackageContractInput): LanguageAdapterPackageContract;
export declare function getLanguageAdapterPackageContract(
  ref: string | LanguageAdapterPackageContractQuery,
  contracts?: readonly LanguageAdapterPackageContract[]
): LanguageAdapterPackageContract | undefined;
export declare function queryLanguageAdapterPackageContracts(
  query?: LanguageAdapterPackageContractQuery,
  contracts?: readonly LanguageAdapterPackageContract[]
): readonly LanguageAdapterPackageContract[];
export declare function summarizeLanguageAdapterPackageContracts(
  contracts?: readonly LanguageAdapterPackageContract[]
): LanguageAdapterPackageContractSummary;
