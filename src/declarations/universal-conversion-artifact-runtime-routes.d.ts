import type { SemanticMergeReadiness } from '@shapeshift-labs/frontier-lang-kernel';
import type { UniversalRuntimeCapabilityKind } from './universal-runtime-capabilities.js';

type RS = readonly string[];
type QS = string | RS;

export interface UniversalConversionRuntimeRouteFields {
  readonly runtimeRouteId?: string;
  readonly sourceHostId?: string;
  readonly targetHostId?: string;
  readonly sourceRuntime?: string;
  readonly targetRuntime?: string;
  readonly runtimeReadiness?: SemanticMergeReadiness | string;
  readonly requiredRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly missingRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
}

export interface UniversalConversionArtifactRuntimeRouteIndex {
  readonly runtimeRouteIds: RS;
  readonly sourceHostIds: RS;
  readonly targetHostIds: RS;
  readonly sourceRuntimes: RS;
  readonly targetRuntimes: RS;
  readonly runtimeReadinesses: RS;
  readonly requiredRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
  readonly missingRuntimeCapabilities: readonly UniversalRuntimeCapabilityKind[];
}

export interface UniversalConversionArtifactRuntimeRouteQuery {
  readonly runtimeRouteId?: QS;
  readonly runtimeRouteIds?: RS;
  readonly sourceHostId?: QS;
  readonly sourceHostIds?: RS;
  readonly targetHostId?: QS;
  readonly targetHostIds?: RS;
  readonly sourceRuntime?: QS;
  readonly sourceRuntimes?: RS;
  readonly runtime?: QS;
  readonly targetRuntime?: QS;
  readonly targetRuntimes?: RS;
  readonly runtimeReadiness?: SemanticMergeReadiness | QS;
  readonly runtimeReadinesses?: RS;
  readonly requiredRuntimeCapability?: UniversalRuntimeCapabilityKind | readonly UniversalRuntimeCapabilityKind[];
  readonly requiredRuntimeCapabilities?: readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedRuntimeCapability?: UniversalRuntimeCapabilityKind | readonly UniversalRuntimeCapabilityKind[];
  readonly satisfiedRuntimeCapabilities?: readonly UniversalRuntimeCapabilityKind[];
  readonly missingRuntimeCapability?: UniversalRuntimeCapabilityKind | readonly UniversalRuntimeCapabilityKind[];
  readonly missingRuntimeCapabilities?: readonly UniversalRuntimeCapabilityKind[];
}

export interface UniversalConversionRuntimeRouteCompactCounts {
  readonly routeArtifacts: number;
  readonly admissionRecords: number;
  readonly evidenceReceipts: number;
  readonly byRouteId: Readonly<Record<string, number>>;
  readonly bySourceHost: Readonly<Record<string, number>>;
  readonly byTargetHost: Readonly<Record<string, number>>;
  readonly bySourceRuntime: Readonly<Record<string, number>>;
  readonly byTargetRuntime: Readonly<Record<string, number>>;
  readonly byReadiness: Readonly<Record<string, number>>;
  readonly requiredCapabilities: Readonly<Record<string, number>>;
  readonly satisfiedCapabilities: Readonly<Record<string, number>>;
  readonly missingCapabilities: Readonly<Record<string, number>>;
}
