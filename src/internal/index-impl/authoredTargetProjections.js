import { normalizeProjectionMatrixTargets } from '../../coverage-matrix-profiles.js';
import { countBy, maxSemanticMergeReadiness, normalizeNativeLanguageId, uniqueStrings } from '../../native-import-utils.js';

export function authoredTargetProjections(document) {
  const aggregateTargets = [
    ...(document?.metadata?.targetProjections?.targets ?? []),
    ...(document?.metadata?.universalAst?.targetProjections?.targets ?? [])
  ];
  const targetNodes = Object.values(document?.nodes ?? {}).filter((node) => node?.kind === 'target' && node.metadata?.authoredTargetProjection);
  return uniqueRecords([
    ...aggregateTargets.flatMap(targetProjectionRecordsFromEntry),
    ...targetNodes.flatMap(targetProjectionRecordsFromNode)
  ]);
}

export function authoredTargetProjectionSummary(records = []) {
  const contractIds = ids(records), layerIds = uniqueStrings(records.flatMap((record) => record.layerIds ?? []));
  return {
    contractCount: records.length,
    layerCount: layerIds.length,
    targetCount: uniqueStrings(records.map((record) => record.target)).length,
    targetLanguages: uniqueStrings(records.map((record) => record.target)),
    targetNodeIds: uniqueStrings(records.map((record) => record.targetNodeId)),
    adapterIds: uniqueStrings(records.map((record) => record.adapterId)),
    contractIds,
    layerIds,
    representedLayerKinds: uniqueStrings(records.flatMap((record) => record.representedLayerKinds ?? [])),
    missingLayerKinds: uniqueStrings(records.flatMap((record) => record.missingLayerKinds ?? [])),
    evidenceIds: uniqueStrings(records.flatMap((record) => record.evidenceIds ?? [])),
    proofEvidenceIds: uniqueStrings(records.flatMap((record) => record.proofEvidenceIds ?? [])),
    lossIds: uniqueStrings(records.flatMap((record) => record.lossIds ?? [])),
    missingEvidence: uniqueStrings(records.flatMap((record) => record.missingEvidence ?? [])),
    readinesses: uniqueStrings(records.map((record) => record.readiness)),
    dispositions: uniqueStrings(records.map((record) => record.disposition)),
    byTarget: countBy(records.map((record) => record.target)),
    byReadiness: countBy(records.map((record) => record.readiness ?? 'needs-review')),
    claims: { autoMergeClaim: false, semanticEquivalenceClaim: false }
  };
}

export function targetProjectionMetadataFields(records = []) {
  const summary = authoredTargetProjectionSummary(records);
  return {
    authoredTargetProjectionIds: summary.contractIds,
    authoredTargetProjectionContractIds: summary.contractIds,
    authoredTargetProjectionLayerIds: summary.layerIds,
    authoredTargetProjectionAdapterIds: summary.adapterIds,
    authoredTargetProjectionTargets: summary.targetLanguages,
    authoredTargetProjectionEvidenceIds: summary.evidenceIds,
    authoredTargetProjectionProofEvidenceIds: summary.proofEvidenceIds,
    authoredTargetProjectionLossIds: summary.lossIds,
    authoredTargetProjectionMissingEvidence: summary.missingEvidence,
    authoredTargetProjectionRepresentedLayerKinds: summary.representedLayerKinds,
    authoredTargetProjectionMissingLayerKinds: summary.missingLayerKinds,
    authoredTargetProjectionReadinesses: summary.readinesses,
    targetProjectionSummary: summary,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
}

function targetProjectionRecordsFromEntry(entry = {}) {
  return targetProjectionRecords({
    id: entry.id,
    name: entry.name,
    target: entry.target,
    metadata: {
      projectionContracts: entry.projectionContracts,
      projectionLayers: entry.projectionLayers
    }
  });
}

function targetProjectionRecordsFromNode(node = {}) { return targetProjectionRecords(node); }

function targetProjectionRecords(targetNode = {}) {
  const context = targetContext(targetNode);
  const layers = normalizeLayers(targetNode.metadata?.projectionLayers ?? targetNode.projectionLayers ?? [], context);
  return (targetNode.metadata?.projectionContracts ?? targetNode.projectionContracts ?? []).map((contract) => normalizeContract(contract, context, layers));
}

function normalizeContract(contract = {}, context = {}, layers = []) {
  const contractLayers = layersForContract(contract, layers);
  return cleanObject({
    id: contract.id,
    kind: 'frontier.lang.authoredTargetProjectionContract',
    name: contract.name,
    rowKind: contract.rowKind,
    target: context.target,
    targetLanguage: context.target,
    targetNodeId: context.targetNodeId,
    targetName: context.targetName,
    sourceLanguage: normalizeNativeLanguageId(contract.sourceLanguage),
    adapterId: contract.adapterId ?? contract.adapter ?? contract.name ?? contract.id,
    disposition: contract.disposition,
    readiness: projectionReadiness(contract.readiness, contractLayers),
    packageName: context.packageName,
    emitPath: context.emitPath,
    moduleFormat: context.moduleFormat,
    representedLayerKinds: uniqueStrings([...(contract.representedLayerKinds ?? []), ...contractLayers.filter((layer) => layer.status === 'represented').map(layerKind)]),
    missingLayerKinds: uniqueStrings([...(contract.missingLayerKinds ?? []), ...contractLayers.filter((layer) => layer.status !== 'represented').map(layerKind)]),
    requiredLayerKinds: uniqueStrings(contract.requiredLayerKinds ?? []),
    layerIds: ids(contractLayers),
    evidenceIds: uniqueStrings([...(contract.evidenceIds ?? []), ...contractLayers.flatMap((layer) => layer.evidenceIds ?? [])]),
    proofEvidenceIds: uniqueStrings(contract.proofEvidenceIds ?? []),
    lossIds: uniqueStrings(contract.lossIds ?? []),
    missingEvidence: uniqueStrings([...(contract.missingEvidence ?? []), ...contractLayers.flatMap((layer) => layer.missingEvidence ?? [])]),
    blockers: uniqueStrings([...(contract.blockers ?? []), ...contractLayers.flatMap((layer) => layer.blockers ?? [])]),
    review: uniqueStrings([...(contract.review ?? []), ...contractLayers.flatMap((layer) => layer.review ?? [])]),
    semanticEquivalenceClaim: false,
    autoMergeClaim: false,
    metadata: { authoredTargetProjection: true }
  });
}

function normalizeLayers(layers = [], context = {}) {
  return layers.map((layer) => cleanObject({ ...layer, target: context.target, targetNodeId: context.targetNodeId, semanticEquivalenceClaim: false, autoMergeClaim: false }));
}

function targetContext(node = {}) {
  const target = node.target ?? {};
  return {
    targetNodeId: node.targetNodeId ?? node.id,
    targetName: node.name,
    target: normalizeProjectionMatrixTargets([node.targetLanguage ?? target.language ?? target.target ?? node.name])[0],
    packageName: target.packageName,
    emitPath: target.emitPath,
    moduleFormat: target.moduleFormat
  };
}

function layersForContract(contract = {}, layers = []) {
  const wanted = new Set(uniqueStrings([...(contract.layerIds ?? []), ...(contract.requiredLayerKinds ?? []), ...(contract.representedLayerKinds ?? []), ...(contract.missingLayerKinds ?? [])]));
  return wanted.size ? layers.filter((layer) => wanted.has(layer.id) || wanted.has(layerKind(layer))) : layers;
}

function projectionReadiness(readiness, layers = []) {
  return layers.reduce((current, layer) => maxSemanticMergeReadiness(current, layer.status === 'missing' ? 'needs-review' : layer.status === 'blocked' ? 'blocked' : 'ready'), readiness ?? 'needs-review');
}

function layerKind(layer = {}) { return layer.layerKind ?? layer.kind ?? layer.name; }
function ids(records = []) { return records.map((record) => record?.id).filter(Boolean); }
function uniqueRecords(records = []) { const seen = new Set(); return records.filter((record) => { const key = record?.id; if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function cleanObject(object) { return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
