import {
  idFragment,
  normalizeNativeLanguageId
} from './native-import-utils.js';
import { normalizeRuntimeId } from './universal-runtime-host-selectors.js';
import { runtimeRoutesForConversion } from './universal-runtime-capabilities.js';

export function conversionRuntimeRoutes(runtimeMatrix, language, target) {
  const routes = runtimeRoutesForConversion(runtimeMatrix, language, target);
  return routes.length ? routes : [undefined];
}

export function conversionRouteIdForRuntime(language, target, runtimeRoute, runtimeRouteCount) {
  const base = `conversion_${idFragment(language.language)}_to_${idFragment(target)}`;
  return runtimeRouteCount > 1 && runtimeRoute?.id ? `${base}_via_${idFragment(runtimeRoute.id)}` : base;
}

export function conversionRouteMatchesRuntimeQuery(route, query = {}) {
  if (query.runtimeRouteId && route.runtime?.routeId !== query.runtimeRouteId) return false;
  if (query.sourceHostId && route.runtime?.source?.id !== query.sourceHostId) return false;
  if (query.targetHostId && route.runtime?.target?.id !== query.targetHostId) return false;
  if (!runtimeFilterMatches(query.sourceRuntime ?? query.runtime, route.runtime?.source)) return false;
  if (!runtimeFilterMatches(query.targetRuntime, route.runtime?.target)) return false;
  if (query.runtimeReadiness && route.runtime?.readiness !== query.runtimeReadiness) return false;
  if (query.missingRuntimeCapability && !(route.runtime?.missingCapabilities ?? []).includes(query.missingRuntimeCapability)) return false;
  if (query.runtimeAdapterRequirementId && !(route.runtimeAdapterRequirements ?? []).some((entry) => entry.id === query.runtimeAdapterRequirementId)) return false;
  return true;
}

function runtimeFilterMatches(filter, host) {
  const normalized = normalizeRuntimeId(filter);
  if (!normalized) return true;
  if (host?.runtime === normalized || host?.id === normalized) return true;
  return normalizeNativeLanguageId(host?.language) === normalizeNativeLanguageId(normalized);
}
