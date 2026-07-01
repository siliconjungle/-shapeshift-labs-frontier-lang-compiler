import {
  idFragment,
  uniqueStrings
} from './native-import-utils.js';
import {
  createUniversalRuntimeProofObligationsForRoute,
  summarizeRuntimeProofObligations
} from './universal-runtime-proof-obligations.js';

export function runtimeRoute(sourceHost, targetHost, input) {
  const requiredCapabilities = requirementsForRoute(input.requirements, sourceHost, targetHost);
  const requirementRows = requiredCapabilities.map((capability) => runtimeCapabilityRequirement(capability, sourceHost, targetHost, input));
  const adapterRequirements = requirementRows.filter((row) => row.adapterRequired).map((row) => row.adapterRequirement);
  const satisfiedCapabilities = requirementRows.filter((row) => !row.adapterRequired).map((row) => row.capability);
  const missingCapabilities = requirementRows.filter((row) => row.targetSupport === 'unavailable').map((row) => row.capability);
  const blockers = requirementRows.filter((row) => row.sourceSupport === 'unavailable')
    .map((row) => `Source host ${sourceHost.id} does not declare required runtime capability ${row.capability}.`);
  const review = adapterRequirements.map((requirement) => requirement.reason);
  const id = `runtime_${idFragment(sourceHost.id)}_to_${idFragment(targetHost.id)}_${idFragment(targetHost.target)}`;
  const proofObligations = createUniversalRuntimeProofObligationsForRoute({
    source: { id: sourceHost.id },
    target: { id: targetHost.id },
    adapterRequirements
  }, input.evidence ?? []);
  return {
    id,
    source: runtimeHostSummary(sourceHost),
    target: runtimeHostSummary(targetHost),
    requiredCapabilities,
    satisfiedCapabilities,
    adapterRequirements,
    proofObligations,
    missingCapabilities,
    readiness: blockers.length ? 'blocked' : adapterRequirements.length ? 'needs-review' : 'ready',
    blockers,
    review: uniqueStrings([...review, ...proofObligations.flatMap((obligation) => obligation.review ?? [])]),
    metadata: {
      generatedAt: input.generatedAt,
      note: 'Runtime adapter requirements describe host API obligations only; parser, syntax, and target-projection evidence remain separate.'
    }
  };
}

function requirementsForRoute(requirements, sourceHost, targetHost) {
  return uniqueStrings((requirements ?? []).filter((requirement) => requirementApplies(requirement, sourceHost, targetHost))
    .map((requirement) => requirement.capability));
}

function requirementApplies(requirement, sourceHost, targetHost) {
  if (requirement.sourceHostId && requirement.sourceHostId !== sourceHost.id) return false;
  if (requirement.targetHostId && requirement.targetHostId !== targetHost.id) return false;
  if (requirement.sourceLanguage && !sourceHost.languageIds.includes(requirement.sourceLanguage)) return false;
  if (requirement.sourceRuntime && requirement.sourceRuntime !== sourceHost.runtime && requirement.sourceRuntime !== sourceHost.id) return false;
  if (requirement.target && requirement.target !== targetHost.target) return false;
  if (requirement.targetRuntime && requirement.targetRuntime !== targetHost.runtime && requirement.targetRuntime !== targetHost.id) return false;
  return Boolean(requirement.capability);
}

function runtimeCapabilityRequirement(capability, sourceHost, targetHost, input) {
  const sourceCapability = sourceHost.capabilities[capability] ?? unavailableCapability(capability, sourceHost.id);
  const targetCapability = targetHost.capabilities[capability] ?? unavailableCapability(capability, targetHost.id);
  const compatible = runtimeCapabilityCompatible(sourceHost, targetHost, sourceCapability, targetCapability);
  const reason = runtimeAdapterReason(capability, sourceHost, targetHost, sourceCapability, targetCapability);
  return {
    capability,
    sourceSupport: sourceCapability.support,
    targetSupport: targetCapability.support,
    sourceBinding: sourceCapability.binding,
    targetBinding: targetCapability.binding,
    adapterRequired: !compatible,
    adapterRequirement: compatible ? undefined : {
      id: `runtime_adapter_${idFragment(sourceHost.id)}_${idFragment(targetHost.id)}_${idFragment(capability)}`,
      capability,
      adapterKind: runtimeAdapterKind(capability, sourceHost, targetHost),
      sourceHost: sourceHost.id,
      targetHost: targetHost.id,
      sourceBinding: sourceCapability.binding,
      targetBinding: targetCapability.binding,
      required: true,
      reason,
      evidenceIds: uniqueStrings(input.requirements
        .filter((requirement) => requirement.capability === capability && requirementApplies(requirement, sourceHost, targetHost))
        .flatMap((requirement) => requirement.evidenceIds ?? []))
    }
  };
}

function runtimeCapabilityCompatible(sourceHost, targetHost, sourceCapability, targetCapability) {
  if (sourceHost.id === targetHost.id) return true;
  if (sourceCapability.support === 'unavailable' || targetCapability.support === 'unavailable') return false;
  return sourceCapability.binding === targetCapability.binding;
}

function unavailableCapability(kind, hostId) {
  return {
    kind,
    support: 'unavailable',
    binding: `${hostId}.${kind}.unavailable`,
    notes: []
  };
}

function runtimeHostSummary(host) {
  return {
    id: host.id,
    language: host.language,
    aliases: host.aliases,
    languageIds: host.languageIds,
    runtime: host.runtime,
    host: host.host,
    target: host.target,
    capabilities: host.capabilities
  };
}

function runtimeAdapterKind(capability, sourceHost, targetHost) {
  if (capability === 'network') return `${sourceHost.runtime}-network-to-${targetHost.runtime}-network`;
  if (capability === 'fetch' && sourceHost.runtime === 'web' && targetHost.runtime === 'cli') return 'browser-fetch-to-cli-http-client';
  if (capability === 'fetch' && sourceHost.runtime === 'cli' && targetHost.runtime === 'web') return 'cli-http-client-to-browser-fetch';
  if (capability === 'timers') return `${sourceHost.runtime}-timers-to-${targetHost.runtime}-timers`;
  if (capability === 'clock') return `${sourceHost.runtime}-clock-to-${targetHost.runtime}-clock`;
  if (capability === 'randomness') return `${sourceHost.runtime}-randomness-to-${targetHost.runtime}-randomness`;
  if (capability === 'crypto') return `${sourceHost.runtime}-crypto-to-${targetHost.runtime}-crypto`;
  if (capability === 'storage' && targetHost.runtime === 'cli') return 'browser-storage-to-cli-persistence';
  if (capability === 'storage' && targetHost.runtime === 'web') return 'cli-storage-to-browser-storage';
  if (capability === 'database') return `${sourceHost.runtime}-database-to-${targetHost.runtime}-database`;
  if (capability === 'filesystem' && targetHost.runtime === 'web') return 'filesystem-to-browser-storage';
  if (capability === 'filesystem') return `${sourceHost.runtime}-filesystem-to-${targetHost.runtime}-filesystem`;
  if (capability === 'process') return `${sourceHost.runtime}-process-to-${targetHost.runtime}-process`;
  if (capability === 'environment') return `${sourceHost.runtime}-environment-to-${targetHost.runtime}-environment`;
  if (capability === 'shell') return `${sourceHost.runtime}-shell-to-${targetHost.runtime}-shell`;
  if (capability === 'threading' && targetHost.runtime === 'web') return 'native-threading-to-web-workers';
  if (capability === 'threading') return `${sourceHost.runtime}-threading-to-${targetHost.runtime}-threading`;
  if (capability === 'dom' && targetHost.runtime === 'cli') return 'dom-to-headless-host';
  if (capability === 'dom') return `${sourceHost.runtime}-dom-to-${targetHost.runtime}-dom`;
  if (capability === 'clipboard') return `${sourceHost.runtime}-clipboard-to-${targetHost.runtime}-clipboard`;
  if (capability === 'canvas') return `${sourceHost.runtime}-canvas-to-${targetHost.runtime}-canvas`;
  if (capability === 'gpu') return `${sourceHost.runtime}-gpu-to-${targetHost.runtime}-gpu`;
  if (capability === 'wasm') return `${sourceHost.runtime}-wasm-to-${targetHost.runtime}-wasm`;
  if (capability === 'sandbox') return `${sourceHost.runtime}-sandbox-to-${targetHost.runtime}-sandbox`;
  if (capability === 'secrets') return `${sourceHost.runtime}-secrets-to-${targetHost.runtime}-secrets`;
  if (capability === 'async') return `${sourceHost.runtime}-async-to-${targetHost.runtime}-async`;
  if (capability === 'ffi' && targetHost.runtime === 'web') return 'native-ffi-to-web-boundary';
  if (capability === 'ffi') return `${sourceHost.runtime}-ffi-to-${targetHost.runtime}-ffi`;
  return `${sourceHost.runtime}-${capability}-to-${targetHost.runtime}-${capability}`;
}

function runtimeAdapterReason(capability, sourceHost, targetHost, sourceCapability, targetCapability) {
  if (targetCapability.support === 'unavailable') {
    return `${sourceHost.id} requires ${capability}, but ${targetHost.id} does not provide a compatible host capability.`;
  }
  if (sourceCapability.support === 'unavailable') {
    return `${sourceHost.id} declared ${capability}, but the source host profile marks it unavailable.`;
  }
  return `${sourceHost.id} uses ${sourceCapability.binding} for ${capability}; ${targetHost.id} exposes ${targetCapability.binding}, so a host adapter must preserve the runtime effect boundary.`;
}

export function runtimeCapabilityMatrixSummary(routes) {
  const byReadiness = {};
  const byCapability = {};
  const byAdapterKind = {};
  let adapterRequirements = 0;
  let proofObligations = 0;
  let routesWithAdapters = 0;
  let missingCapabilities = 0;
  const proofSummary = summarizeRuntimeProofObligations(routes.flatMap((route) => route.proofObligations ?? []));
  for (const route of routes) {
    byReadiness[route.readiness] = (byReadiness[route.readiness] ?? 0) + 1;
    if (route.adapterRequirements.length) routesWithAdapters += 1;
    adapterRequirements += route.adapterRequirements.length;
    proofObligations += (route.proofObligations ?? []).length;
    missingCapabilities += route.missingCapabilities.length;
    for (const capability of route.requiredCapabilities) {
      byCapability[capability] = (byCapability[capability] ?? 0) + 1;
    }
    for (const requirement of route.adapterRequirements) {
      byAdapterKind[requirement.adapterKind] = (byAdapterKind[requirement.adapterKind] ?? 0) + 1;
    }
  }
  return {
    routes: routes.length,
    routesWithAdapters,
    adapterRequirements,
    proofObligations,
    missingCapabilities,
    byReadiness,
    byCapability,
    byAdapterKind,
    proofSignals: proofSummary.missingSignals
  };
}
