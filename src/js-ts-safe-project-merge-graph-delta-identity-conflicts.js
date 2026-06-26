import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';

function projectPublicContractDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph) {
  return changedIdentityConflicts({
    code: 'project-public-contract-delta-conflict',
    label: 'public contract',
    baseRecords: baseGraph.publicContractRegions,
    workerRecords: workerGraph.publicContractRegions,
    headRecords: headGraph.publicContractRegions,
    outputRecords: outputGraph?.publicContractRegions,
    identityKey: publicContractIdentityKey,
    fingerprint: publicContractFingerprint,
    details: publicContractDetails
  });
}

function projectReExportIdentityDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph) {
  return changedIdentityConflicts({
    code: 'project-re-export-identity-delta-conflict',
    label: 're-export identity',
    baseRecords: baseGraph.reExportIdentities,
    workerRecords: workerGraph.reExportIdentities,
    headRecords: headGraph.reExportIdentities,
    outputRecords: outputGraph?.reExportIdentities,
    identityKey: reExportIdentityKey,
    fingerprint: reExportIdentityFingerprint,
    details: reExportIdentityDetails
  });
}

function projectImportAttributeDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph) {
  return changedIdentityConflicts({
    code: 'project-import-attribute-delta-conflict',
    label: 'import attributes',
    baseRecords: attributedEdges(baseGraph),
    workerRecords: attributedEdges(workerGraph),
    headRecords: attributedEdges(headGraph),
    outputRecords: attributedEdges(outputGraph),
    identityKey: importAttributeIdentityKey,
    fingerprint: importAttributeFingerprint,
    details: importAttributeDetails
  });
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
    hasImportAttributes: record.hasImportAttributes,
    importAttributeCount: record.importAttributeCount,
    importAttributeKeys: record.importAttributeKeys, importAttributeHash: record.importAttributeHash, importAttributes: record.importAttributes,
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
    hasImportAttributes: record.hasImportAttributes,
    importAttributeCount: record.importAttributeCount,
    importAttributeKeys: record.importAttributeKeys, importAttributeHash: record.importAttributeHash, importAttributes: record.importAttributes,
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

function attributedEdges(graph) { return [...(graph?.importEdges ?? []), ...(graph?.exportEdges ?? [])].filter((edge) => edge?.hasImportAttributes || edge?.importAttributeHash); }
function importAttributeIdentityKey(edge) { return stableKey(['import-attribute', edge?.predicate, edge?.edgeKind, edge?.sourcePath, edge?.moduleSpecifier, edge?.isTypeOnly]); }
function importAttributeFingerprint(edge) { return hashSemanticValue({ kind: 'frontier.lang.projectGraphDelta.importAttributeFingerprint', hasImportAttributes: edge.hasImportAttributes, importAttributeCount: edge.importAttributeCount, importAttributeKeys: edge.importAttributeKeys, importAttributeHash: edge.importAttributeHash, importAttributes: edge.importAttributes }); }
function importAttributeDetails(edge) { if (!edge) return undefined; return compactRecord({ sourcePath: edge.sourcePath, key: importAttributeIdentityKey(edge), predicate: edge.predicate, moduleSpecifier: edge.moduleSpecifier, importedName: edge.importedName, exportedName: edge.exportedName, localName: edge.localName, importKind: edge.importKind, exportKind: edge.exportKind, isTypeOnly: edge.isTypeOnly, hasImportAttributes: edge.hasImportAttributes, importAttributeCount: edge.importAttributeCount, importAttributeKeys: edge.importAttributeKeys, importAttributeHash: edge.importAttributeHash, importAttributes: edge.importAttributes }); }
function optionalFingerprint(record, fingerprint) { return record ? fingerprint(record) : undefined; }
function stableKey(parts) { const values = parts.map((part) => part === undefined || part === null ? '' : String(part)); return values.some(Boolean) ? values.join('#') : undefined; }
function firstString(...values) { for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value); return undefined; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  projectImportAttributeDeltaConflicts,
  projectPublicContractDeltaConflicts,
  projectReExportIdentityDeltaConflicts
};
