import { idFragment } from '../../native-import-utils.js';

export function resourceGraphsFromInput(input) {
  return [
    ...(Array.isArray(input.graphs) ? input.graphs : []),
    ...(Array.isArray(input.resourceGraphs) ? input.resourceGraphs : []),
    input.resourceGraph,
    input.semanticResourceGraph,
    ...(input.imports ?? []).flatMap((imported) => [
      imported?.resourceGraph,
      imported?.semanticResourceGraph,
      imported?.universalAst?.resourceGraph,
      imported?.universalAst?.semanticResourceGraph,
      imported?.metadata?.resourceGraph
    ])
  ].filter((graph) => graph && typeof graph === 'object');
}

export function resourcesFromParadigmSemantics(input) {
  const records = [];
  for (const paradigm of paradigmSemanticsInputs(input)) {
    records.push(...array(paradigm?.memoryLocations).map((record) => ({
      ...record,
      resourceKind: record.resourceKind ?? record.kind ?? 'memory-location',
      sourcePath: record.sourcePath ?? input.sourcePath,
      sourceHash: record.sourceHash ?? input.sourceHash
    })));
  }
  return records;
}

export function resourcesFromOwnershipRegions(input) {
  return resourceManagementOrderRecords(input).map(({ item, region }) => ({
    id: `resource_${idFragment(region.id)}_${idFragment(item.name ?? item.declarationText)}`,
    name: item.name,
    resourceKind: item.declarationKind ?? 'lexical-resource',
    ownerId: region.metadata?.subjectId,
    ownerName: region.metadata?.subjectName,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    sourceSpan: region.sourceSpan,
    evidenceIds: region.evidenceIds ?? [`resource-management:${item.name ?? region.id}`],
    metadata: {
      declarationText: item.declarationText,
      initializerText: item.initializerText,
      acquisitionOrderIndex: item.acquisitionOrderIndex,
      disposalOrderIndex: item.disposalOrderIndex
    }
  }));
}

export function ownersFromResources(resources) {
  return resources.filter((resource) => resource.ownerId || resource.ownerName).map((resource) => ({
    id: resource.ownerId,
    name: resource.ownerName,
    sourcePath: resource.sourcePath,
    sourceHash: resource.sourceHash
  }));
}

export function ownersFromOwnershipRegions(input) {
  return (input.ownershipRegions ?? []).filter((region) => region?.metadata?.subjectId || region?.metadata?.subjectName).map((region) => ({
    id: region.metadata?.subjectId,
    name: region.metadata?.subjectName,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash
  }));
}

export function lifetimeRegionsFromOwnershipRegions(input) {
  return resourceManagementOrderRecords(input).map(({ item, region }) => ({
    id: `lifetime_${idFragment(region.id)}_${idFragment(item.name ?? item.declarationText)}`,
    name: `${item.name ?? 'resource'} lexical lifetime`,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    startLine: item.line,
    endLine: item.scopeExitLine,
    evidenceIds: region.evidenceIds ?? [`resource-management:${item.name ?? region.id}`]
  }));
}

export function dropsFromOwnershipRegions(input) {
  return resourceManagementOrderRecords(input).map(({ item, region }) => ({
    id: `drop_${idFragment(region.id)}_${idFragment(item.name ?? item.declarationText)}`,
    resourceId: `resource_${idFragment(region.id)}_${idFragment(item.name ?? item.declarationText)}`,
    ownerId: region.metadata?.subjectId,
    lifetimeRegionId: `lifetime_${idFragment(region.id)}_${idFragment(item.name ?? item.declarationText)}`,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    line: item.scopeExitLine,
    order: item.disposalOrderIndex,
    dropKind: item.awaitUsing ? 'async-dispose' : 'dispose',
    evidenceIds: region.evidenceIds ?? [`resource-management:${item.name ?? region.id}`],
    metadata: {
      disposalOrder: item.disposalOrder,
      disposalMethodPolicy: item.disposalMethodPolicy,
      disposalEffectEquivalenceClaim: item.disposalEffectEquivalenceClaim === true
    }
  }));
}

function paradigmSemanticsInputs(input) {
  return [
    input.paradigmSemantics,
    ...(input.imports ?? []).flatMap((imported) => [
      imported?.paradigmSemantics,
      imported?.universalAst?.paradigmSemantics
    ])
  ].filter((record) => record && typeof record === 'object');
}

function resourceManagementOrderRecords(input) {
  return (input.ownershipRegions ?? [])
    .flatMap((region) => (region?.metadata?.runtimeOrderEvidence?.resourceManagementOrder ?? []).map((item) => ({ region, item })))
    .filter(({ item }) => item && typeof item === 'object');
}

function array(value) {
  return Array.isArray(value) ? value : [];
}
