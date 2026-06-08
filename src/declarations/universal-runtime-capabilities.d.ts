import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { NativeImportLanguageProfile } from './native-import-losses.js';
import type { NativeSourceImportResult } from './import-adapter-core.js';

export type UniversalRuntimeCapabilityKind =
  | 'fetch'
  | 'timers'
  | 'storage'
  | 'filesystem'
  | 'threading'
  | 'dom'
  | 'async'
  | 'ffi'
  | string;

export type UniversalRuntimeCapabilitySupport = 'native' | 'adapter' | 'unavailable' | string;

export interface UniversalRuntimeCapabilitySupportRecord {
  readonly kind: UniversalRuntimeCapabilityKind;
  readonly support: UniversalRuntimeCapabilitySupport;
  readonly binding: string;
  readonly notes: readonly string[];
}

export interface UniversalRuntimeHostProfile {
  readonly id: string;
  readonly language: FrontierSourceLanguage | string;
  readonly aliases?: readonly string[];
  readonly languageIds?: readonly string[];
  readonly runtime: string;
  readonly host: string;
  readonly target: FrontierCompileTarget | string;
  readonly capabilities: Readonly<Record<UniversalRuntimeCapabilityKind, UniversalRuntimeCapabilitySupportRecord>>;
  readonly notes?: readonly string[];
}

export interface UniversalRuntimeHostSummary extends UniversalRuntimeHostProfile {
  readonly aliases: readonly string[];
  readonly languageIds: readonly string[];
  readonly notes?: readonly string[];
}

export interface UniversalRuntimeRequirementInput {
  readonly capability?: UniversalRuntimeCapabilityKind;
  readonly kind?: UniversalRuntimeCapabilityKind;
  readonly capabilities?: readonly UniversalRuntimeCapabilityKind[];
  readonly requiredCapabilities?: readonly UniversalRuntimeCapabilityKind[];
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly sourceRuntime?: string;
  readonly runtime?: string;
  readonly sourceHost?: string | UniversalRuntimeHostProfile;
  readonly sourceRuntimeHost?: string | UniversalRuntimeHostProfile;
  readonly target?: FrontierCompileTarget | string;
  readonly targetRuntime?: string;
  readonly targetHost?: string | UniversalRuntimeHostProfile;
  readonly targetRuntimeHost?: string | UniversalRuntimeHostProfile;
  readonly reason?: string;
  readonly evidenceIds?: readonly string[];
}

export interface UniversalRuntimeAdapterRequirement {
  readonly id: string;
  readonly capability: UniversalRuntimeCapabilityKind;
  readonly adapterKind: string;
  readonly sourceHost: string;
  readonly targetHost: string;
  readonly sourceBinding: string;
  readonly targetBinding: string;
  readonly required: true;
  readonly reason: string;
  readonly evidenceIds: readonly string[];
}

export interface UniversalRuntimeCapabilityRoute {
  readonly id: string;
  readonly source: UniversalRuntimeHostSummary;
  readonly target: UniversalRuntimeHostSummary;
  readonly requiredCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly adapterRequirements: readonly UniversalRuntimeAdapterRequirement[];
  readonly missingCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly readiness: SemanticMergeReadiness;
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly metadata: Record<string, unknown>;
}

export interface UniversalRuntimeCapabilityMatrix {
  readonly kind: 'frontier.lang.universalRuntimeCapabilityMatrix';
  readonly version: 1;
  readonly generatedAt: number;
  readonly hostProfiles: readonly UniversalRuntimeHostProfile[];
  readonly routes: readonly UniversalRuntimeCapabilityRoute[];
  readonly summary: {
    readonly routes: number;
    readonly routesWithAdapters: number;
    readonly adapterRequirements: number;
    readonly missingCapabilities: number;
    readonly byReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byCapability: Readonly<Record<UniversalRuntimeCapabilityKind, number>>;
    readonly byAdapterKind: Readonly<Record<string, number>>;
  };
  readonly metadata: {
    readonly capabilityKinds: readonly UniversalRuntimeCapabilityKind[];
    readonly sourceHosts: readonly string[];
    readonly targetHosts: readonly string[];
    readonly note: string;
  };
}

export interface UniversalRuntimeCapabilityMatrixOptions {
  readonly generatedAt?: number;
  readonly imports?: readonly NativeSourceImportResult[];
  readonly languages?: readonly (NativeImportLanguageProfile | FrontierSourceLanguage | string)[];
  readonly sourceLanguages?: readonly (NativeImportLanguageProfile | FrontierSourceLanguage | string)[];
  readonly targets?: readonly (FrontierCompileTarget | string)[];
  readonly hostProfiles?: readonly UniversalRuntimeHostProfile[];
  readonly runtimeHosts?: readonly UniversalRuntimeHostProfile[];
  readonly sourceHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly sourceRuntimeHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly targetHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly targetRuntimeHosts?: readonly (string | UniversalRuntimeHostProfile)[] | Readonly<Record<string, string | UniversalRuntimeHostProfile>>;
  readonly sourceRuntime?: string;
  readonly targetRuntime?: string;
  readonly sourceRuntimes?: Readonly<Record<string, string>>;
  readonly targetRuntimes?: Readonly<Record<string, string>>;
  readonly runtimeRequirements?:
    | readonly (UniversalRuntimeCapabilityKind | UniversalRuntimeRequirementInput)[]
    | Readonly<Record<string, readonly UniversalRuntimeCapabilityKind[]>>;
  readonly requiredRuntimeCapabilities?:
    | readonly (UniversalRuntimeCapabilityKind | UniversalRuntimeRequirementInput)[]
    | Readonly<Record<string, readonly UniversalRuntimeCapabilityKind[]>>;
  readonly effects?:
    | readonly (UniversalRuntimeCapabilityKind | UniversalRuntimeRequirementInput)[]
    | Readonly<Record<string, readonly UniversalRuntimeCapabilityKind[]>>;
}

export interface UniversalRuntimeCapabilityMatrixQuery {
  readonly sourceLanguage?: FrontierSourceLanguage | string;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly sourceRuntime?: string;
  readonly targetRuntime?: string;
  readonly runtime?: string;
  readonly capability?: UniversalRuntimeCapabilityKind;
  readonly requiresAdapter?: boolean;
}

export interface UniversalRuntimeCapabilityMatrixQueryResult {
  readonly kind: 'frontier.lang.universalRuntimeCapabilityMatrixQuery';
  readonly version: 1;
  readonly found: boolean;
  readonly routes: readonly UniversalRuntimeCapabilityRoute[];
  readonly bestRoute?: UniversalRuntimeCapabilityRoute;
  readonly reasons: readonly string[];
}

export declare const UniversalRuntimeCapabilityKinds: readonly UniversalRuntimeCapabilityKind[];
export declare const UniversalRuntimeHostProfiles: readonly UniversalRuntimeHostProfile[];
export declare function createUniversalRuntimeCapabilityMatrix(
  options?: UniversalRuntimeCapabilityMatrixOptions
): UniversalRuntimeCapabilityMatrix;
export declare function queryUniversalRuntimeCapabilityMatrix(
  matrixOrOptions?: UniversalRuntimeCapabilityMatrix | UniversalRuntimeCapabilityMatrixOptions,
  query?: UniversalRuntimeCapabilityMatrixQuery
): UniversalRuntimeCapabilityMatrixQueryResult;
