import { countBy, uniqueStrings as u } from './native-import-utils.js';

const arrayKeys = ['requiredRuntimeCapabilities', 'satisfiedRuntimeCapabilities', 'missingRuntimeCapabilities'];
const scalarKeys = ['runtimeRouteId', 'sourceHostId', 'targetHostId', 'sourceRuntime', 'targetRuntime', 'runtimeReadiness'];

export function routeRuntimeDenominators(route = {}) {
  const runtime = route.runtime ?? {};
  return {
    runtimeRouteId: runtime.routeId,
    sourceHostId: runtime.source?.id,
    targetHostId: runtime.target?.id,
    sourceRuntime: runtime.source?.runtime,
    targetRuntime: runtime.target?.runtime,
    runtimeReadiness: runtime.readiness,
    requiredRuntimeCapabilities: u(runtime.requiredCapabilities ?? []),
    satisfiedRuntimeCapabilities: u(runtime.satisfiedCapabilities ?? []),
    missingRuntimeCapabilities: u(runtime.missingCapabilities ?? [])
  };
}

export function artifactRuntimeRouteIndex(artifacts) {
  const records = (artifacts ?? []).map((artifact) => runtimeFields(artifact));
  return {
    runtimeRouteIds: u(records.map((record) => record.runtimeRouteId)),
    sourceHostIds: u(records.map((record) => record.sourceHostId)),
    targetHostIds: u(records.map((record) => record.targetHostId)),
    sourceRuntimes: u(records.map((record) => record.sourceRuntime)),
    targetRuntimes: u(records.map((record) => record.targetRuntime)),
    runtimeReadinesses: u(records.map((record) => record.runtimeReadiness)),
    requiredRuntimeCapabilities: u(records.flatMap((record) => record.requiredRuntimeCapabilities)),
    satisfiedRuntimeCapabilities: u(records.flatMap((record) => record.satisfiedRuntimeCapabilities)),
    missingRuntimeCapabilities: u(records.flatMap((record) => record.missingRuntimeCapabilities))
  };
}
export const rri = artifactRuntimeRouteIndex;

export function artifactRuntimeRouteMatches(record, query = {}) {
  const fields = runtimeFields(record);
  return match(query.runtimeRouteId ?? query.runtimeRouteIds, [fields.runtimeRouteId])
    && match(query.sourceHostId ?? query.sourceHostIds, [fields.sourceHostId])
    && match(query.targetHostId ?? query.targetHostIds, [fields.targetHostId])
    && match(query.sourceRuntime ?? query.sourceRuntimes ?? query.runtime, [fields.sourceRuntime])
    && match(query.targetRuntime ?? query.targetRuntimes, [fields.targetRuntime])
    && match(query.runtimeReadiness ?? query.runtimeReadinesses, [fields.runtimeReadiness])
    && match(query.requiredRuntimeCapability ?? query.requiredRuntimeCapabilities, fields.requiredRuntimeCapabilities)
    && match(query.satisfiedRuntimeCapability ?? query.satisfiedRuntimeCapabilities, fields.satisfiedRuntimeCapabilities)
    && match(query.missingRuntimeCapability ?? query.missingRuntimeCapabilities, fields.missingRuntimeCapabilities);
}
export const rrm = artifactRuntimeRouteMatches;

export function artifactRuntimeRouteCounts(routeArtifacts, admissionRecords = [], receipts = []) {
  return {
    routeArtifacts: routeArtifacts.filter((artifact) => artifact.runtimeRouteId).length,
    admissionRecords: admissionRecords.filter((record) => record.runtimeRouteId).length,
    evidenceReceipts: receipts.filter((receipt) => receipt.runtimeRouteId).length,
    byRouteId: countPresent(routeArtifacts.map((artifact) => artifact.runtimeRouteId)),
    bySourceHost: countPresent(routeArtifacts.map((artifact) => artifact.sourceHostId)),
    byTargetHost: countPresent(routeArtifacts.map((artifact) => artifact.targetHostId)),
    bySourceRuntime: countPresent(routeArtifacts.map((artifact) => artifact.sourceRuntime)),
    byTargetRuntime: countPresent(routeArtifacts.map((artifact) => artifact.targetRuntime)),
    byReadiness: countPresent(routeArtifacts.map((artifact) => artifact.runtimeReadiness)),
    requiredCapabilities: countBy(routeArtifacts.flatMap((artifact) => artifact.requiredRuntimeCapabilities ?? [])),
    satisfiedCapabilities: countBy(routeArtifacts.flatMap((artifact) => artifact.satisfiedRuntimeCapabilities ?? [])),
    missingCapabilities: countBy(routeArtifacts.flatMap((artifact) => artifact.missingRuntimeCapabilities ?? []))
  };
}

function runtimeFields(record = {}) {
  const direct = pick(record);
  if (direct.runtimeRouteId || direct.sourceHostId || direct.runtimeReadiness) return direct;
  const fallback = pick(record.admissionRecord ?? record.evidenceReceipt ?? record.metadata ?? {});
  return { ...fallback, ...Object.fromEntries(arrayKeys.map((key) => [key, u(fallback[key] ?? [])])) };
}

function pick(record = {}) {
  return {
    ...Object.fromEntries(scalarKeys.map((key) => [key, record[key]])),
    ...Object.fromEntries(arrayKeys.map((key) => [key, u(record[key] ?? [])]))
  };
}

function countPresent(values) {
  return countBy((values ?? []).filter((value) => value !== undefined && value !== null && String(value)));
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
