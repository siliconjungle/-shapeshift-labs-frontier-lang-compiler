import type {
  FrontierSourceLanguage,
  SemanticMergeReadiness
} from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { NativeImportLanguageProfile } from './native-import-losses.js';
import type { NativeSourceImportResult } from './import-adapter-core.js';

export type UniversalRuntimeCapabilityKind =
  | 'network'
  | 'fetch'
  | 'timers'
  | 'clock'
  | 'randomness'
  | 'crypto'
  | 'storage'
  | 'database'
  | 'filesystem'
  | 'process'
  | 'environment'
  | 'shell'
  | 'threading'
  | 'dom'
  | 'clipboard'
  | 'canvas'
  | 'gpu'
  | 'wasm'
  | 'sandbox'
  | 'secrets'
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

export type UniversalRuntimeProofSignalKind =
  | 'source-hash' | 'target-hash' | 'runtime-command' | 'probe-id' | 'telemetry-hash' | 'event-trace-hash' | 'network-trace-hash' | 'storage-snapshot-hash'
  | 'filesystem-trace-hash' | 'process-trace-hash' | 'environment-snapshot-hash' | 'shell-policy' | 'secret-scope-policy' | 'dom-snapshot-hash'
  | 'computed-style-hash' | 'layout-snapshot-hash' | 'accessibility-snapshot-hash' | 'focus-trace-hash' | 'bitmap-hash' | 'draw-command-trace-hash'
  | 'gpu-command-trace-hash' | 'wasm-module-hash' | 'sandbox-policy-hash' | 'worker-message-trace-hash' | 'deterministic-input-hash' | 'adapter-binding-hash'
  | string;

export interface UniversalRuntimeProofObligation {
  readonly kind: 'frontier.lang.universalRuntimeProofObligation'; readonly version: 1; readonly schema: 'frontier.lang.universalRuntimeProofObligation.v1';
  readonly id: string; readonly capability?: UniversalRuntimeCapabilityKind; readonly adapterRequirementId?: string; readonly adapterKind?: string; readonly sourceHost?: string; readonly targetHost?: string;
  readonly status: 'not-applicable' | 'satisfied' | 'needs-evidence' | 'blocked' | string; readonly action: 'skip' | 'attach-runtime-proof-obligation' | 'collect-runtime-proof-signals' | 'reject' | string;
  readonly requiredSignals: readonly UniversalRuntimeProofSignalKind[]; readonly providedSignals: readonly UniversalRuntimeProofSignalKind[]; readonly missingSignals: readonly UniversalRuntimeProofSignalKind[];
  readonly missingEvidence: readonly string[]; readonly blockers: readonly string[]; readonly review: readonly string[]; readonly evidenceIds: readonly string[];
  readonly claims: { readonly runtimeEquivalenceClaim: false; readonly semanticEquivalenceClaim: false; readonly renderEquivalenceClaim: false; readonly autoMergeClaim: false };
}

export interface UniversalRuntimeProofObligationInput {
  readonly id?: string; readonly capability?: UniversalRuntimeCapabilityKind; readonly adapterRequirement?: Partial<UniversalRuntimeAdapterRequirement>; readonly adapterKind?: string; readonly sourceHost?: string; readonly targetHost?: string;
  readonly requiredSignals?: readonly UniversalRuntimeProofSignalKind[]; readonly providedSignals?: readonly UniversalRuntimeProofSignalKind[]; readonly evidence?: readonly Record<string, unknown>[]; readonly routeEvidence?: readonly Record<string, unknown>[];
  readonly evidenceIds?: readonly string[]; readonly blockers?: readonly string[]; readonly review?: readonly string[];
}

export interface UniversalRuntimeProofObligationQuery {
  readonly runtimeProofObligationId?: string; readonly runtimeProofCapability?: UniversalRuntimeCapabilityKind; readonly runtimeProofStatus?: string;
  readonly runtimeProofMissingSignal?: UniversalRuntimeProofSignalKind; readonly runtimeProofRequiredSignal?: UniversalRuntimeProofSignalKind; readonly runtimeProofProvidedSignal?: UniversalRuntimeProofSignalKind;
}

export interface UniversalRuntimeCapabilityRoute {
  readonly id: string;
  readonly source: UniversalRuntimeHostSummary;
  readonly target: UniversalRuntimeHostSummary;
  readonly requiredCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly adapterRequirements: readonly UniversalRuntimeAdapterRequirement[];
  readonly proofObligations: readonly UniversalRuntimeProofObligation[];
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
    readonly proofObligations: number;
    readonly missingCapabilities: number;
    readonly byReadiness: Readonly<Record<SemanticMergeReadiness, number>>;
    readonly byCapability: Readonly<Record<UniversalRuntimeCapabilityKind, number>>;
    readonly byAdapterKind: Readonly<Record<string, number>>;
    readonly proofSignals: Readonly<Record<UniversalRuntimeProofSignalKind, number>>;
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

type UniversalRuntimeQueryFilter<T> = T | readonly T[];
export interface UniversalRuntimeCapabilityMatrixQuery {
  readonly sourceLanguage?: UniversalRuntimeQueryFilter<FrontierSourceLanguage | string>;
  readonly language?: UniversalRuntimeQueryFilter<FrontierSourceLanguage | string>;
  readonly target?: UniversalRuntimeQueryFilter<FrontierCompileTarget | string>;
  readonly sourceRuntime?: UniversalRuntimeQueryFilter<string>;
  readonly targetRuntime?: UniversalRuntimeQueryFilter<string>;
  readonly runtime?: UniversalRuntimeQueryFilter<string>;
  readonly capability?: UniversalRuntimeQueryFilter<UniversalRuntimeCapabilityKind>;
  readonly requiresAdapter?: boolean;
  readonly runtimeProofObligationId?: UniversalRuntimeQueryFilter<string>;
  readonly runtimeProofCapability?: UniversalRuntimeQueryFilter<UniversalRuntimeCapabilityKind>;
  readonly runtimeProofStatus?: UniversalRuntimeQueryFilter<string>;
  readonly runtimeProofMissingSignal?: UniversalRuntimeQueryFilter<UniversalRuntimeProofSignalKind>;
  readonly runtimeProofRequiredSignal?: UniversalRuntimeQueryFilter<UniversalRuntimeProofSignalKind>;
  readonly runtimeProofProvidedSignal?: UniversalRuntimeQueryFilter<UniversalRuntimeProofSignalKind>;
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
export declare const UniversalRuntimeProofSignalKinds: readonly UniversalRuntimeProofSignalKind[];
export declare function runtimeProofSignalsForCapability(capability?: UniversalRuntimeCapabilityKind): readonly UniversalRuntimeProofSignalKind[];
export declare function createUniversalRuntimeProofObligation(input?: UniversalRuntimeProofObligationInput): UniversalRuntimeProofObligation;
export declare function createUniversalRuntimeProofObligationsForRoute(
  route?: Partial<UniversalRuntimeCapabilityRoute>,
  evidence?: readonly Record<string, unknown>[]
): readonly UniversalRuntimeProofObligation[];
export declare function runtimeProofObligationMatches(obligation?: Partial<UniversalRuntimeProofObligation>, query?: UniversalRuntimeProofObligationQuery): boolean;
export declare function summarizeRuntimeProofObligations(obligations?: readonly UniversalRuntimeProofObligation[]): {
  readonly obligations: number; readonly byStatus: Readonly<Record<string, number>>; readonly byCapability: Readonly<Record<string, number>>;
  readonly missingSignals: Readonly<Record<UniversalRuntimeProofSignalKind, number>>; readonly providedSignals: Readonly<Record<UniversalRuntimeProofSignalKind, number>>;
};
export declare function createUniversalRuntimeCapabilityMatrix(
  options?: UniversalRuntimeCapabilityMatrixOptions
): UniversalRuntimeCapabilityMatrix;
export declare function queryUniversalRuntimeCapabilityMatrix(
  matrixOrOptions?: UniversalRuntimeCapabilityMatrix | UniversalRuntimeCapabilityMatrixOptions,
  query?: UniversalRuntimeCapabilityMatrixQuery
): UniversalRuntimeCapabilityMatrixQueryResult;
