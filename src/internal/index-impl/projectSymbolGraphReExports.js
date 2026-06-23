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
  return edge.importKind === 'reexport' || edge.importKind === 'namespace-reexport' || edge.exportStar === true;
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

export function exportStarReExportIdentityRecords(edge, targetExports) {
  if (!edge?.exportStar || !edge.targetDocumentId) return [];
  return targetExports
    .filter((symbol) => symbol.name && symbol.name !== 'default')
    .map((symbol) => compactRecord({
      id: `reexport_star_${idFragment(edge.id)}_${idFragment(symbol.id)}`,
      sourceDocumentId: edge.sourceDocumentId,
      sourcePath: edge.sourcePath,
      sourceHash: edge.sourceHash,
      moduleSpecifier: edge.moduleSpecifier,
      symbolId: edge.targetSymbolId,
      relationId: edge.id,
      importedName: symbol.name,
      exportedName: symbol.name,
      originSymbolId: symbol.id,
      exportedSymbolId: symbol.id,
      localSymbolId: edge.targetSymbolId,
      isExportStar: true,
      publicContract: edge.publicContract
    }));
}

function idFragment(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'id';
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
