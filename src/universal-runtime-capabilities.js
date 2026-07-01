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
  const sourceLanguages = q(query.sourceLanguage ?? query.language).map(normalizeNativeLanguageId).filter(Boolean);
  const targets = normalizeProjectionMatrixTargets(q(query.target));
  const sourceRuntimes = q(query.sourceRuntime ?? query.runtime).map(normalizeRuntimeId).filter(Boolean);
  const targetRuntimes = q(query.targetRuntime).map(normalizeRuntimeId).filter(Boolean);
  const capabilities = q(query.capability).map(normalizeRuntimeCapabilityKind).filter(Boolean);
  const routes = (matrix.routes ?? []).filter((route) => {
    if (sourceLanguages.length && !route.source.languageIds.some((id) => sourceLanguages.includes(id))) return false;
    if (targets.length && !targets.includes(route.target.target)) return false;
    if (sourceRuntimes.length && !sourceRuntimes.some((runtime) => route.source.runtime === runtime || route.source.id === runtime)) return false;
    if (targetRuntimes.length && !targetRuntimes.some((runtime) => route.target.runtime === runtime || route.target.id === runtime)) return false;
    if (capabilities.length && !capabilities.some((capability) => route.requiredCapabilities.includes(capability))) return false;
    if (query.requiresAdapter === true && route.adapterRequirements.length === 0) return false;
    if (query.requiresAdapter === false && route.adapterRequirements.length > 0) return false;
    if (!match(query.runtimeProofObligationId, (route.proofObligations ?? []).map((entry) => entry.id))) return false;
    if (!match(query.runtimeProofCapability, (route.proofObligations ?? []).map((entry) => entry.capability))) return false;
    if (!match(query.runtimeProofStatus, (route.proofObligations ?? []).map((entry) => entry.status))) return false;
    if (!match(query.runtimeProofMissingSignal, (route.proofObligations ?? []).flatMap((entry) => entry.missingSignals ?? []))) return false;
    if (!match(query.runtimeProofRequiredSignal, (route.proofObligations ?? []).flatMap((entry) => entry.requiredSignals ?? []))) return false;
    if (!match(query.runtimeProofProvidedSignal, (route.proofObligations ?? []).flatMap((entry) => entry.providedSignals ?? []))) return false;
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
function q(value) { return Array.isArray(value) ? value : value === undefined ? [] : [value]; }
function match(filter, values) {
  const filters = q(filter);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
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
