import type { FrontierSourceLanguage } from '@shapeshift-labs/frontier-lang-kernel';
import type { FrontierCompileTarget } from './compile.js';
import type { UniversalRuntimeCapabilityKind } from './universal-runtime-capabilities.js';

export type UniversalRepresentationConstructKind =
  | 'source-import'
  | 'semantic-symbol'
  | 'source-map'
  | 'parser-feature'
  | 'source-preservation'
  | 'declaration-stub'
  | 'target-adapter'
  | 'runtime-capability'
  | 'dialect-projection'
  | 'semantic-ownership'
  | 'proof-evidence'
  | string;

export type UniversalRepresentationConstructStatus = 'represented' | 'missing' | 'review' | 'blocked' | string;

export interface UniversalRepresentationConstructRecord {
  readonly kind: UniversalRepresentationConstructKind;
  readonly status: UniversalRepresentationConstructStatus;
  readonly surface: string;
  readonly count: number;
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalRepresentationCoverage {
  readonly kind: 'frontier.lang.universalRepresentationCoverage';
  readonly version: 1;
  readonly language?: FrontierSourceLanguage | string;
  readonly target?: FrontierCompileTarget | string;
  readonly constructKinds: readonly UniversalRepresentationConstructKind[];
  readonly constructs: readonly UniversalRepresentationConstructRecord[];
  readonly surfaces: {
    readonly sourceImport: { readonly total: number; readonly readiness?: string };
    readonly semanticIndex: { readonly symbols: number; readonly sourceMapMappings: number };
    readonly sourceMaps: { readonly mappings: number; readonly precisions: readonly string[] };
    readonly parser: { readonly rows: number; readonly mergeReadyParsers: readonly string[] };
    readonly projection: {
      readonly targetEntries: number;
      readonly missingTargets: readonly string[];
      readonly unsupportedTargets: readonly string[];
    };
    readonly runtime: {
      readonly requiredCapabilities: readonly UniversalRuntimeCapabilityKind[];
      readonly satisfiedCapabilities: readonly UniversalRuntimeCapabilityKind[];
      readonly missingCapabilities: readonly UniversalRuntimeCapabilityKind[];
      readonly adapterRequirements: readonly string[];
    };
    readonly dialect: {
      readonly readiness: string;
      readonly registryIds: readonly string[];
      readonly recordIds: readonly string[];
      readonly constructKinds: readonly string[];
      readonly externKinds: readonly string[];
      readonly projectionDispositions: readonly string[];
    };
    readonly mergeRefs: {
      readonly ownershipKeys: readonly string[];
      readonly conflictKeys: readonly string[];
      readonly sourceMapIds: readonly string[];
      readonly sourceMapMappingIds: readonly string[];
      readonly transformIdentityHashes: readonly string[];
    };
    readonly evidence: { readonly records: number; readonly proofRecords: number };
  };
  readonly missing: readonly string[];
  readonly blockers: readonly string[];
  readonly review: readonly string[];
  readonly summary: {
    readonly constructs: number;
    readonly representedConstructs: number;
    readonly reviewConstructs: number;
    readonly blockedConstructs: number;
    readonly missing: number;
    readonly blockers: number;
    readonly review: number;
  };
  readonly autoMergeClaim: false;
  readonly semanticEquivalenceClaim: false;
}

export interface UniversalRepresentationCoverageQuery {
  readonly constructKind?: UniversalRepresentationConstructKind | readonly UniversalRepresentationConstructKind[];
  readonly construct?: UniversalRepresentationConstructKind | readonly UniversalRepresentationConstructKind[];
  readonly runtimeCapability?: UniversalRuntimeCapabilityKind | readonly UniversalRuntimeCapabilityKind[];
  readonly dialectConstructKind?: string | readonly string[];
  readonly dialectReadiness?: string | readonly string[];
  readonly sourceMapPrecision?: string | readonly string[];
  readonly transformIdentityHash?: string | readonly string[];
}

export declare const UniversalRepresentationConstructKinds: readonly UniversalRepresentationConstructKind[];
export declare function createUniversalRepresentationCoverage(input?: Record<string, unknown>): UniversalRepresentationCoverage;
export declare function representationCoverageMatches(
  coverage?: UniversalRepresentationCoverage,
  query?: UniversalRepresentationCoverageQuery
): boolean;
