import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import {
  normalizeProjectionMatrixTargets
} from './coverage-matrix-profiles.js';
import {
  UniversalRuntimeCapabilityKinds,
  UniversalRuntimeHostProfiles
} from './universal-runtime-profiles.js';
import {
  normalizeRuntimeCapabilityKind,
  normalizeRuntimeHostProfiles,
  normalizeRuntimeId,
  normalizeRuntimeRequirements,
  runtimeSourceHosts,
  runtimeTargetHosts
} from './universal-runtime-host-selectors.js';
import {
  runtimeCapabilityMatrixSummary,
  runtimeRoute
} from './universal-runtime-route-records.js';

export {
  UniversalRuntimeCapabilityKinds,
  UniversalRuntimeHostProfiles
} from './universal-runtime-profiles.js';
export {
  createUniversalRuntimeProofObligation,
  createUniversalRuntimeProofObligationsForRoute,
  runtimeProofObligationMatches,
  runtimeProofSignalsForCapability,
  summarizeRuntimeProofObligations,
  UniversalRuntimeProofSignalKinds
} from './universal-runtime-proof-obligations.js';

export function createUniversalRuntimeCapabilityMatrix(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const hostProfiles = normalizeRuntimeHostProfiles(input.hostProfiles ?? input.runtimeHosts ?? UniversalRuntimeHostProfiles);
  const sourceHosts = runtimeSourceHosts(input, hostProfiles);
  const targetHosts = runtimeTargetHosts(input, hostProfiles, context);
  const requirements = normalizeRuntimeRequirements(input, hostProfiles);
  const routes = sourceHosts.flatMap((sourceHost) => targetHosts.map((targetHost) => runtimeRoute(sourceHost, targetHost, {
    generatedAt,
    requirements,
    evidence: input.evidence ?? []
  })));
  return {
    kind: 'frontier.lang.universalRuntimeCapabilityMatrix',
    version: 1,
    generatedAt,
    hostProfiles,
    routes,
    summary: runtimeCapabilityMatrixSummary(routes),
    metadata: {
      capabilityKinds: [...UniversalRuntimeCapabilityKinds],
      sourceHosts: sourceHosts.map((host) => host.id),
      targetHosts: targetHosts.map((host) => host.id),
      note: 'Runtime capability coverage is declarative host evidence for adapter planning. It does not import, polyfill, or execute host APIs.'
    }
  };
}

export function queryUniversalRuntimeCapabilityMatrix(matrixOrInput = {}, query = {}, context = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.universalRuntimeCapabilityMatrix'
    ? matrixOrInput
    : createUniversalRuntimeCapabilityMatrix(matrixOrInput, context);
  const sourceLanguage = normalizeNativeLanguageId(query.sourceLanguage ?? query.language);
  const target = normalizeProjectionMatrixTargets(query.target ? [query.target] : [])[0];
  const sourceRuntime = normalizeRuntimeId(query.sourceRuntime ?? query.runtime);
  const targetRuntime = normalizeRuntimeId(query.targetRuntime);
  const capability = normalizeRuntimeCapabilityKind(query.capability);
  const routes = (matrix.routes ?? []).filter((route) => {
    if (sourceLanguage && !route.source.languageIds.includes(sourceLanguage)) return false;
    if (target && route.target.target !== target) return false;
    if (sourceRuntime && route.source.runtime !== sourceRuntime && route.source.id !== sourceRuntime) return false;
    if (targetRuntime && route.target.runtime !== targetRuntime && route.target.id !== targetRuntime) return false;
    if (capability && !route.requiredCapabilities.includes(capability)) return false;
    if (query.requiresAdapter === true && route.adapterRequirements.length === 0) return false;
    if (query.requiresAdapter === false && route.adapterRequirements.length > 0) return false;
    if (query.runtimeProofObligationId && !(route.proofObligations ?? []).some((entry) => entry.id === query.runtimeProofObligationId)) return false;
    if (query.runtimeProofCapability && !(route.proofObligations ?? []).some((entry) => entry.capability === query.runtimeProofCapability)) return false;
    if (query.runtimeProofStatus && !(route.proofObligations ?? []).some((entry) => entry.status === query.runtimeProofStatus)) return false;
    if (query.runtimeProofMissingSignal && !(route.proofObligations ?? []).some((entry) => (entry.missingSignals ?? []).includes(query.runtimeProofMissingSignal))) return false;
    if (query.runtimeProofRequiredSignal && !(route.proofObligations ?? []).some((entry) => (entry.requiredSignals ?? []).includes(query.runtimeProofRequiredSignal))) return false;
    if (query.runtimeProofProvidedSignal && !(route.proofObligations ?? []).some((entry) => (entry.providedSignals ?? []).includes(query.runtimeProofProvidedSignal))) return false;
    return true;
  });
  return {
    kind: 'frontier.lang.universalRuntimeCapabilityMatrixQuery',
    version: 1,
    found: routes.length > 0,
    routes,
    bestRoute: routes[0],
    reasons: routes.length ? [] : [`No runtime capability route matched source=${query.sourceLanguage ?? query.language ?? '*'} target=${query.target ?? '*'}.`]
  };
}

export function runtimeRoutesForConversion(runtimeMatrix, language, target) {
  const languageIds = uniqueStrings([language?.language, ...(language?.aliases ?? [])].map(normalizeNativeLanguageId));
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target ?? '');
  return (runtimeMatrix?.routes ?? []).filter((route) => {
    if (normalizedTarget && route.target.target !== normalizedTarget) return false;
    return route.source.languageIds.some((id) => languageIds.includes(id));
  });
}

export function runtimeRouteForConversion(runtimeMatrix, language, target) {
  return runtimeRoutesForConversion(runtimeMatrix, language, target)[0];
}
