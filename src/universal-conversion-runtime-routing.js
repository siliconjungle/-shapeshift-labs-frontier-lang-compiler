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
  if (!match(query.runtimeRouteId, [route.runtime?.routeId])) return false;
  if (!match(query.sourceHostId, [route.runtime?.source?.id])) return false;
  if (!match(query.targetHostId, [route.runtime?.target?.id])) return false;
  if (!runtimeFilterMatches(query.sourceRuntime ?? query.runtime, route.runtime?.source)) return false;
  if (!runtimeFilterMatches(query.targetRuntime, route.runtime?.target)) return false;
  if (!match(query.runtimeReadiness, [route.runtime?.readiness])) return false;
  if (!match(query.missingRuntimeCapability, route.runtime?.missingCapabilities ?? [])) return false;
  if (!match(query.runtimeAdapterRequirementId, (route.runtimeAdapterRequirements ?? []).map((entry) => entry.id ?? entry.capability))) return false;
  if (!match(query.runtimeProofObligationId, (route.runtime?.proofObligations ?? []).map((entry) => entry.id))) return false;
  if (!match(query.runtimeProofCapability, (route.runtime?.proofObligations ?? []).map((entry) => entry.capability))) return false;
  if (!match(query.runtimeProofStatus, (route.runtime?.proofObligations ?? []).map((entry) => entry.status))) return false;
  if (!match(query.runtimeProofRequiredSignal, (route.runtime?.proofObligations ?? []).flatMap((entry) => entry.requiredSignals ?? []))) return false;
  if (!match(query.runtimeProofProvidedSignal, (route.runtime?.proofObligations ?? []).flatMap((entry) => entry.providedSignals ?? []))) return false;
  if (!match(query.runtimeProofMissingSignal, (route.runtime?.proofObligations ?? []).flatMap((entry) => entry.missingSignals ?? []))) return false;
  return true;
}

function runtimeFilterMatches(filter, host) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  return filters.some((entry) => {
    const normalized = normalizeRuntimeId(entry);
    if (!normalized) return true;
    if (host?.runtime === normalized || host?.id === normalized) return true;
    return normalizeNativeLanguageId(host?.language) === normalizeNativeLanguageId(normalized);
  });
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
