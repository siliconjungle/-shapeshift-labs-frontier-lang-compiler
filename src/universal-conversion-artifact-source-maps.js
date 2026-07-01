import { countBy, uniqueStrings as u } from './native-import-utils.js';

const keys = ['sourceMapIds', 'sourceMapMappingIds', 'sourceMapLinkIds'];

export function artifactSourceMapIndex(artifacts) {
  const route = collect(artifacts, (artifact) => artifact.materialization);
  const admission = collect(artifacts, (artifact) => artifact.admissionRecord?.ids);
  const receipt = collect(artifacts, (artifact) => artifact.evidenceReceipt);
  const patch = collect(artifacts, (artifact) => artifact.patchBundle?.index);
  const operations = collect(artifacts, operationMaps);
  const all = merge(route, admission, receipt, patch, operations);
  return {
    sourceMapIds: all.sourceMapIds,
    sourceMapMappingIds: all.sourceMapMappingIds,
    sourceMapLinkIds: all.sourceMapLinkIds,
    routeSourceMapIds: route.sourceMapIds,
    routeSourceMapMappingIds: route.sourceMapMappingIds,
    routeSourceMapLinkIds: route.sourceMapLinkIds,
    admissionRecordSourceMapIds: admission.sourceMapIds,
    admissionRecordSourceMapMappingIds: admission.sourceMapMappingIds,
    admissionRecordSourceMapLinkIds: admission.sourceMapLinkIds,
    evidenceReceiptSourceMapIds: receipt.sourceMapIds,
    evidenceReceiptSourceMapMappingIds: receipt.sourceMapMappingIds,
    evidenceReceiptSourceMapLinkIds: receipt.sourceMapLinkIds
  };
}

export function artifactSourceMapMatches(record, query = {}) {
  const route = maps(record.materialization);
  const admission = maps(record.admissionRecord?.ids);
  const receipt = maps(record.evidenceReceipt);
  const all = merge(route, admission, receipt, maps(record.patchBundle?.index), operationMaps(record));
  return match(query.sourceMapId ?? query.sourceMapIds, all.sourceMapIds)
    && match(query.sourceMapMappingId ?? query.sourceMapMappingIds, all.sourceMapMappingIds)
    && match(query.sourceMapLinkId ?? query.sourceMapLinkIds, all.sourceMapLinkIds)
    && match(query.routeSourceMapId ?? query.routeSourceMapIds, route.sourceMapIds)
    && match(query.routeSourceMapMappingId ?? query.routeSourceMapMappingIds, route.sourceMapMappingIds)
    && match(query.routeSourceMapLinkId ?? query.routeSourceMapLinkIds, route.sourceMapLinkIds)
    && match(query.admissionRecordSourceMapId ?? query.admissionRecordSourceMapIds, admission.sourceMapIds)
    && match(query.admissionRecordSourceMapMappingId ?? query.admissionRecordSourceMapMappingIds, admission.sourceMapMappingIds)
    && match(query.admissionRecordSourceMapLinkId ?? query.admissionRecordSourceMapLinkIds, admission.sourceMapLinkIds)
    && match(query.evidenceReceiptSourceMapId ?? query.evidenceReceiptSourceMapIds, receipt.sourceMapIds)
    && match(query.evidenceReceiptSourceMapMappingId ?? query.evidenceReceiptSourceMapMappingIds, receipt.sourceMapMappingIds)
    && match(query.evidenceReceiptSourceMapLinkId ?? query.evidenceReceiptSourceMapLinkIds, receipt.sourceMapLinkIds);
}

export function artifactSourceMapCounts(artifacts, admissionRecords = []) {
  const routeArtifacts = artifacts.filter((artifact) => hasMaps(merge(maps(artifact.materialization), maps(artifact.patchBundle?.index), maps(artifact.evidenceReceipt), operationMaps(artifact))));
  const admission = merge(collect(artifacts, (artifact) => artifact.admissionRecord?.ids), ...admissionRecords.map((record) => maps(record.ids)));
  const all = merge(collect(artifacts, (artifact) => artifact.materialization), collect(artifacts, (artifact) => artifact.patchBundle?.index), collect(artifacts, (artifact) => artifact.evidenceReceipt), collect(artifacts, operationMaps), admission);
  return {
    routeArtifacts: routeArtifacts.length,
    admissionRecords: admissionRecords.filter((record) => hasMaps(maps(record.ids))).length,
    ids: countBy(all.sourceMapIds),
    mappingIds: countBy(all.sourceMapMappingIds),
    linkIds: countBy(all.sourceMapLinkIds)
  };
}

function collect(artifacts, select) {
  return merge(...(artifacts ?? []).map((artifact) => maps(select(artifact))));
}

function operationMaps(artifact) {
  const operations = artifact?.semanticOperations?.operations ?? [];
  return merge(...operations.map((operation) => maps({
    sourceMapIds: operation.sourceMapIds,
    sourceMapMappingIds: operation.sourceMapMappingIds,
    sourceMapLinkIds: operation.metadata?.sourceMapLinkIds
  })));
}

function maps(value = {}) {
  return Object.fromEntries(keys.map((key) => [key, u(value?.[key] ?? [])]));
}

function merge(...records) {
  return Object.fromEntries(keys.map((key) => [key, u(records.flatMap((record) => record[key] ?? []))]));
}

function hasMaps(record) {
  return keys.some((key) => record[key]?.length);
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
