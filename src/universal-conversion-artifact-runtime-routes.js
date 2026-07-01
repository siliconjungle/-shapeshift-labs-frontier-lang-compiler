import { countBy, uniqueStrings as u } from './native-import-utils.js';

const arrayKeys = ['requiredRuntimeCapabilities', 'satisfiedRuntimeCapabilities', 'missingRuntimeCapabilities'];
const scalarKeys = ['runtimeRouteId', 'sourceHostId', 'targetHostId', 'sourceRuntime', 'targetRuntime', 'runtimeReadiness'];
const pluralScalarKeys = ['runtimeRouteIds', 'sourceHostIds', 'targetHostIds', 'sourceRuntimes', 'targetRuntimes', 'runtimeReadinesses'];

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

export function workItemRuntimeRouteDenominators(route = {}) {
  const record = routeRuntimeDenominators(route);
  return {
    runtimeRouteIds: u([record.runtimeRouteId]),
    sourceHostIds: u([record.sourceHostId]),
    targetHostIds: u([record.targetHostId]),
    sourceRuntimes: u([record.sourceRuntime]),
    targetRuntimes: u([record.targetRuntime]),
    runtimeReadinesses: u([record.runtimeReadiness]),
    requiredRuntimeCapabilities: record.requiredRuntimeCapabilities,
    satisfiedRuntimeCapabilities: record.satisfiedRuntimeCapabilities,
    missingRuntimeCapabilities: record.missingRuntimeCapabilities
  };
}

export function mergeWorkItemRuntimeRouteDenominators(left = {}, right = {}) {
  return {
    ...Object.fromEntries(pluralScalarKeys.map((key) => [key, u([...(left[key] ?? []), ...(right[key] ?? [])])])),
    ...Object.fromEntries(arrayKeys.map((key) => [key, u([...(left[key] ?? []), ...(right[key] ?? [])])]))
  };
}

export function worklistRuntimeRouteSummary(items = []) {
  return {
    ...Object.fromEntries(pluralScalarKeys.map((key) => [key, u(items.flatMap((item) => item[key] ?? []))])),
    ...Object.fromEntries(arrayKeys.map((key) => [key, u(items.flatMap((item) => item[key] ?? []))]))
  };
}

export function workItemRuntimeRouteMatches(item = {}, query = {}) {
  return match(query.runtimeRouteId ?? query.runtimeRouteIds, item.runtimeRouteIds)
    && match(query.sourceHostId ?? query.sourceHostIds, item.sourceHostIds)
    && match(query.targetHostId ?? query.targetHostIds, item.targetHostIds)
    && match(query.sourceRuntime ?? query.sourceRuntimes ?? query.runtime, item.sourceRuntimes)
    && match(query.targetRuntime ?? query.targetRuntimes, item.targetRuntimes)
    && match(query.runtimeReadiness ?? query.runtimeReadinesses, item.runtimeReadinesses)
    && match(query.requiredRuntimeCapability ?? query.requiredRuntimeCapabilities, item.requiredRuntimeCapabilities)
    && match(query.satisfiedRuntimeCapability ?? query.satisfiedRuntimeCapabilities, item.satisfiedRuntimeCapabilities)
    && match(query.missingRuntimeCapability ?? query.missingRuntimeCapabilities, item.missingRuntimeCapabilities);
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
