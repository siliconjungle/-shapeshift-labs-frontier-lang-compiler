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
  if (query.runtimeProofObligationId && !(route.runtime?.proofObligations ?? []).some((entry) => entry.id === query.runtimeProofObligationId)) return false;
  if (query.runtimeProofCapability && !(route.runtime?.proofObligations ?? []).some((entry) => entry.capability === query.runtimeProofCapability)) return false;
  if (query.runtimeProofStatus && !(route.runtime?.proofObligations ?? []).some((entry) => entry.status === query.runtimeProofStatus)) return false;
  if (query.runtimeProofRequiredSignal && !(route.runtime?.proofObligations ?? []).some((entry) => (entry.requiredSignals ?? []).includes(query.runtimeProofRequiredSignal))) return false;
  if (query.runtimeProofProvidedSignal && !(route.runtime?.proofObligations ?? []).some((entry) => (entry.providedSignals ?? []).includes(query.runtimeProofProvidedSignal))) return false;
  if (query.runtimeProofMissingSignal && !(route.runtime?.proofObligations ?? []).some((entry) => (entry.missingSignals ?? []).includes(query.runtimeProofMissingSignal))) return false;
  return true;
}

function runtimeFilterMatches(filter, host) {
  const normalized = normalizeRuntimeId(filter);
  if (!normalized) return true;
  if (host?.runtime === normalized || host?.id === normalized) return true;
  return normalizeNativeLanguageId(host?.language) === normalizeNativeLanguageId(normalized);
}
