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
  if (edge.exportStar === true) return true;
  if (edge.importKind !== 'reexport' && edge.importKind !== 'namespace-reexport') return false;
  return Boolean(edge.importedName || edge.exportedName || edge.namespace || edge.localName);
}

export function reExportIdentityInputFromEdge(edge, id) {
  return compactRecord({
    id,
    sourceDocumentId: edge.sourceDocumentId,
    sourcePath: edge.sourcePath,
    sourceHash: edge.sourceHash,
    moduleSpecifier: edge.moduleSpecifier,
    hasImportAttributes: edge.hasImportAttributes,
    importAttributeCount: edge.importAttributeCount,
    importAttributeKeys: edge.importAttributeKeys,
    importAttributeHash: edge.importAttributeHash,
    importAttributes: edge.importAttributes,
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
      hasImportAttributes: edge.hasImportAttributes,
      importAttributeCount: edge.importAttributeCount,
      importAttributeKeys: edge.importAttributeKeys,
      importAttributeHash: edge.importAttributeHash,
      importAttributes: edge.importAttributes,
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

export function commonJsAliasReExportIdentityRecords(importEdges, exportEdges, resolveDocumentExportSymbolId) {
  const requireAliases = new Map();
  for (const edge of importEdges ?? []) {
    if (edge.importKind !== 'commonjs-require' || !edge.localName || !edge.targetDocumentId || !edge.moduleSpecifier) continue;
    requireAliases.set(commonJsAliasKey(edge.sourceDocumentId, edge.localName), edge);
  }
  return (exportEdges ?? []).flatMap((edge) => {
    if (!edge.exportedName || edge.moduleSpecifier) return [];
    const member = commonJsAliasMember(edge.localName);
    const importEdge = member ? requireAliases.get(commonJsAliasKey(edge.sourceDocumentId, member.alias)) : undefined;
    if (!importEdge) return [];
    return [compactRecord({
      id: `reexport_commonjs_alias_${idFragment(edge.id)}_${idFragment(importEdge.id)}_${idFragment(member.importedName)}`,
      sourceDocumentId: edge.sourceDocumentId,
      sourcePath: edge.sourcePath,
      sourceHash: edge.sourceHash,
      moduleSpecifier: importEdge.moduleSpecifier,
      symbolId: edge.targetSymbolId,
      relationId: edge.id,
      importRelationId: importEdge.id,
      importedName: member.importedName,
      exportedName: edge.exportedName,
      localName: edge.localName,
      originSymbolId: resolveDocumentExportSymbolId(importEdge.targetDocumentId, member.importedName),
      exportedSymbolId: resolveDocumentExportSymbolId(edge.sourceDocumentId, edge.exportedName) ?? edge.targetSymbolId,
      localSymbolId: edge.targetSymbolId,
      commonJs: true,
      reExport: true,
      publicContract: edge.publicContract
    })];
  });
}

function commonJsAliasMember(localName) {
  const match = String(localName ?? '').match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);
  return match ? { alias: match[1], importedName: match[2] } : undefined;
}

function commonJsAliasKey(sourceDocumentId, alias) {
  return `${sourceDocumentId ?? ''}\u0000${alias}`;
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
