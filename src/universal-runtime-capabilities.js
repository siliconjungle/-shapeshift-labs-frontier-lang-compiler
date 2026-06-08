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

export function createUniversalRuntimeCapabilityMatrix(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const hostProfiles = normalizeRuntimeHostProfiles(input.hostProfiles ?? input.runtimeHosts ?? UniversalRuntimeHostProfiles);
  const sourceHosts = runtimeSourceHosts(input, hostProfiles);
  const targetHosts = runtimeTargetHosts(input, hostProfiles, context);
  const requirements = normalizeRuntimeRequirements(input, hostProfiles);
  const routes = sourceHosts.flatMap((sourceHost) => targetHosts.map((targetHost) => runtimeRoute(sourceHost, targetHost, {
    generatedAt,
    requirements
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

export function runtimeRouteForConversion(runtimeMatrix, language, target) {
  const languageIds = uniqueStrings([language?.language, ...(language?.aliases ?? [])].map(normalizeNativeLanguageId));
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target ?? '');
  return (runtimeMatrix?.routes ?? []).find((route) => {
    if (normalizedTarget && route.target.target !== normalizedTarget) return false;
    return route.source.languageIds.some((id) => languageIds.includes(id));
  });
}
