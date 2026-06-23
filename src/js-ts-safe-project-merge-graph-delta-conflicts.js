import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function projectGraphDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return [];
  return [
    ...changedIdentityConflicts({
      code: 'project-public-contract-delta-conflict',
      label: 'public contract',
      baseRecords: baseGraph.publicContractRegions,
      workerRecords: workerGraph.publicContractRegions,
      headRecords: headGraph.publicContractRegions,
      outputRecords: outputGraph?.publicContractRegions,
      identityKey: publicContractIdentityKey,
      fingerprint: publicContractFingerprint,
      details: publicContractDetails
    }),
    ...changedIdentityConflicts({
      code: 'project-re-export-identity-delta-conflict',
      label: 're-export identity',
      baseRecords: baseGraph.reExportIdentities,
      workerRecords: workerGraph.reExportIdentities,
      headRecords: headGraph.reExportIdentities,
      outputRecords: outputGraph?.reExportIdentities,
      identityKey: reExportIdentityKey,
      fingerprint: reExportIdentityFingerprint,
      details: reExportIdentityDetails
    }),
    ...projectImportTargetDeltaConflicts(projectGraphDelta)
  ];
}

function addProjectGraphDeltaConflictSummary(projectGraphDelta, conflicts) {
  if (!projectGraphDelta) return undefined;
  return {
    ...projectGraphDelta,
    summary: {
      ...projectGraphDelta.summary,
      conflicts: conflicts.length,
      publicContractConflicts: conflicts.filter((conflict) => conflict.code === 'project-public-contract-delta-conflict').length,
      reExportIdentityConflicts: conflicts.filter((conflict) => conflict.code === 'project-re-export-identity-delta-conflict').length,
      importTargetConflicts: conflicts.filter((conflict) => conflict.code === 'project-import-target-delta-conflict').length
    }
  };
}

function changedIdentityConflicts(input) {
  const base = recordsByIdentityKey(input.baseRecords, input.identityKey);
  const worker = recordsByIdentityKey(input.workerRecords, input.identityKey);
  const head = recordsByIdentityKey(input.headRecords, input.identityKey);
  const output = recordsByIdentityKey(input.outputRecords, input.identityKey);
  const keys = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]);
  return keys.flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const baseFingerprint = optionalFingerprint(baseRecord, input.fingerprint);
    const workerFingerprint = optionalFingerprint(workerRecord, input.fingerprint);
    const headFingerprint = optionalFingerprint(headRecord, input.fingerprint);
    if (baseFingerprint === workerFingerprint || baseFingerprint === headFingerprint || workerFingerprint === headFingerprint) return [];
    return [projectGraphDeltaConflict({
      code: input.code,
      label: input.label,
      identityKey,
      baseRecord,
      workerRecord,
      headRecord,
      outputRecord: output.get(identityKey),
      details: input.details
    })];
  });
}

function projectImportTargetDeltaConflicts(projectGraphDelta) {
  const baseStage = projectGraphDelta?.stages?.base;
  const workerStage = projectGraphDelta?.stages?.worker;
  const headStage = projectGraphDelta?.stages?.head;
  const outputStage = projectGraphDelta?.stages?.output;
  const workerEdges = importEdgesByIdentityKey(workerStage?.projectSymbolGraph?.importEdges);
  const baseSymbolIds = semanticSymbolIds(baseStage);
  const headSymbolIds = semanticSymbolIds(headStage);
  const conflicts = [];
  for (const [identityKey, edge] of importEdgesByIdentityKey(outputStage?.projectSymbolGraph?.importEdges)) {
    if (!edge.resolvedTargetSymbolId) continue;
    const workerEdge = workerEdges.get(identityKey);
    if (!workerEdge || workerEdge.resolvedTargetSymbolId === edge.resolvedTargetSymbolId) continue;
    if (baseSymbolIds.has(edge.resolvedTargetSymbolId) || !headSymbolIds.has(edge.resolvedTargetSymbolId)) continue;
    conflicts.push(projectImportTargetDeltaConflict(identityKey, edge, workerEdge));
  }
  return conflicts;
}

function projectGraphDeltaConflict(input) {
  const sourcePath = input.workerRecord?.sourcePath ?? input.headRecord?.sourcePath ?? input.baseRecord?.sourcePath;
  const conflictKey = `project-graph-delta#${input.label.replace(/\s+/g, '-')}#${input.identityKey}`;
  return {
    code: input.code,
    gateId: 'project-graph-delta',
    message: `Worker and head both changed ${input.label} ${JSON.stringify(input.identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: input.code,
      conflictKey,
      identityKey: input.identityKey,
      sourcePath,
      base: input.details(input.baseRecord),
      worker: input.details(input.workerRecord),
      head: input.details(input.headRecord),
      output: input.details(input.outputRecord)
    })
  };
}

function projectImportTargetDeltaConflict(identityKey, edge, workerEdge) {
  return {
    code: 'project-import-target-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Output import ${JSON.stringify(projectImportTargetName(edge) ?? edge.moduleSpecifier ?? 'unknown')} resolves to a head-branch exported symbol that the worker import did not resolve against.`,
    sourcePath: edge.sourcePath,
    details: compactRecord({
      reasonCode: 'project-import-target-delta-conflict',
      conflictKey: `project-graph-delta#import-target#${identityKey}`,
      identityKey,
      sourcePath: edge.sourcePath,
      moduleSpecifier: edge.moduleSpecifier,
      importedName: edge.importedName,
      localName: edge.localName,
      importKind: edge.importKind,
      resolvedModulePath: edge.resolvedModulePath,
      outputTargetSymbolId: edge.resolvedTargetSymbolId,
      workerTargetSymbolId: workerEdge.resolvedTargetSymbolId,
      workerResolutionKind: workerEdge.resolutionKind,
      outputResolutionKind: edge.resolutionKind
    })
  };
}

function recordsByIdentityKey(records, identityKey) {
  const result = new Map();
  for (const record of records ?? []) {
    const key = identityKey(record);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

function publicContractIdentityKey(record) {
  return firstString(
    record?.key,
    stableKey(['public-contract', record?.sourcePath, record?.apiSurfaceKind, record?.edgeKind, record?.moduleSpecifier, record?.exportedName ?? record?.symbolName ?? record?.symbolId])
  );
}

function publicContractFingerprint(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.projectGraphDelta.publicContractFingerprint',
    contractHash: record.contractHash,
    signatureHash: record.signatureHash,
    symbolName: record.symbolName,
    symbolKind: record.symbolKind,
    apiSurfaceKind: record.apiSurfaceKind,
    exportedName: record.exportedName,
    moduleSpecifier: record.moduleSpecifier,
    edgeKind: record.edgeKind
  });
}

function publicContractDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    key: publicContractIdentityKey(record),
    symbolName: record.symbolName,
    symbolKind: record.symbolKind,
    apiSurfaceKind: record.apiSurfaceKind,
    exportedName: record.exportedName,
    moduleSpecifier: record.moduleSpecifier,
    edgeKind: record.edgeKind,
    signatureHash: record.signatureHash,
    contractHash: record.contractHash,
    sourceHash: record.sourceHash
  });
}

function reExportIdentityKey(record) {
  return stableKey(['re-export-identity', record?.sourcePath, record?.exportedName ?? record?.localName ?? record?.namespace ?? (record?.exportStar || record?.isExportStar ? '*' : undefined)]);
}

function reExportIdentityFingerprint(record) {
  return hashSemanticValue({
    kind: 'frontier.lang.projectGraphDelta.reExportIdentityFingerprint',
    sourcePath: record.sourcePath,
    moduleSpecifier: record.moduleSpecifier,
    exportedName: record.exportedName,
    importedName: record.importedName,
    localName: record.localName,
    namespace: record.namespace,
    isTypeOnly: record.isTypeOnly,
    exportStar: record.exportStar,
    isExportStar: record.isExportStar,
    originSymbolId: record.originSymbolId,
    exportedSymbolId: record.exportedSymbolId,
    localSymbolId: record.localSymbolId
  });
}

function reExportIdentityDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    key: reExportIdentityKey(record),
    moduleSpecifier: record.moduleSpecifier,
    exportedName: record.exportedName,
    importedName: record.importedName,
    localName: record.localName,
    namespace: record.namespace,
    isTypeOnly: record.isTypeOnly,
    exportStar: record.exportStar,
    isExportStar: record.isExportStar,
    originSymbolId: record.originSymbolId,
    exportedSymbolId: record.exportedSymbolId,
    localSymbolId: record.localSymbolId,
    sourceHash: record.sourceHash
  });
}

function importEdgesByIdentityKey(records) {
  const result = new Map();
  for (const record of records ?? []) {
    const key = importEdgeIdentityKey(record);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

function importEdgeIdentityKey(edge) {
  const targetName = projectImportTargetName(edge);
  if (!edge?.sourcePath || !edge.moduleSpecifier || !targetName) return undefined;
  return stableKey(['import-target', edge.sourcePath, edge.moduleSpecifier, targetName, edge.importKind, edge.isTypeOnly]);
}

function projectImportTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  if (!name || name === '*') return undefined;
  return String(name);
}

function optionalFingerprint(record, fingerprint) {
  return record ? fingerprint(record) : undefined;
}

function semanticSymbolIds(stage) {
  return new Set((stage?.projectImport?.semanticIndex?.symbols ?? []).map((symbol) => symbol.id).filter(Boolean));
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { addProjectGraphDeltaConflictSummary, projectGraphDeltaConflicts };
