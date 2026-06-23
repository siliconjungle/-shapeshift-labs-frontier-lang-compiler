export function reExportIdentityRecord(identity, edge, resolveDocumentExportSymbolId, extra = {}) {
  const exportedName = firstString(identity.exportedName, edge?.exportedName, edge?.importedName === '*' ? undefined : (edge?.exportedName ?? edge?.importedName));
  const importedName = firstString(identity.importedName, edge?.importedName);
  const localName = firstString(identity.localName, edge?.localName, exportedName);
  return compactRecord({
    ...identity,
    exportedName,
    importedName,
    localName,
    originSymbolId: firstString(identity.originSymbolId, edge?.resolvedTargetSymbolId),
    exportedSymbolId: firstString(identity.exportedSymbolId, resolveDocumentExportSymbolId(edge?.sourceDocumentId, exportedName), edge?.predicate === 'exports' ? edge?.targetSymbolId : undefined),
    localSymbolId: firstString(identity.localSymbolId, edge?.targetSymbolId),
    ...extra
  });
}

export function isReExportImportEdge(edge) {
  return edge.importKind === 'reexport' || edge.importKind === 'namespace-reexport';
}

export function reExportIdentityInputFromEdge(edge, id) {
  return compactRecord({
    id,
    sourceDocumentId: edge.sourceDocumentId,
    sourcePath: edge.sourcePath,
    sourceHash: edge.sourceHash,
    moduleSpecifier: edge.moduleSpecifier,
    symbolId: edge.targetSymbolId,
    relationId: edge.id,
    publicContract: edge.publicContract
  });
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}
