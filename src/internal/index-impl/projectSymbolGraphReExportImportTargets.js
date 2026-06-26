function resolveReExportIdentityImportTargets(importEdges = [], reExportIdentities = []) {
  const identityMatches = reExportIdentityTargetIndex(reExportIdentities);
  const edgeById = new Map(importEdges.map((edge) => [edge.id, edge]));
  return importEdges.map((edge) => {
    if (edge?.resolvedTargetSymbolId || !edge?.targetDocumentId || !projectImportTargetName(edge)) return edge;
    const matches = identityMatches.get(`${edge.targetDocumentId}\0${projectImportTargetName(edge)}`) ?? [];
    if (matches.length !== 1 || !matches[0].originSymbolId) return edge;
    return resolvedReExportImportEdge(edge, matches[0], edgeById.get(matches[0].relationId));
  });
}

function reExportIdentityTargetIndex(reExportIdentities = []) {
  const result = new Map();
  for (const identity of reExportIdentities) {
    if (!identity?.sourceDocumentId || !identity.exportedName) continue;
    const key = `${identity.sourceDocumentId}\0${identity.exportedName}`;
    result.set(key, [...(result.get(key) ?? []), identity]);
  }
  return result;
}

function resolvedReExportImportEdge(edge, identity, relationEdge) {
  return {
    ...edge,
    resolvedTargetSymbolId: identity.originSymbolId,
    reExportResolved: true,
    reExportResolutionKind: identity.isExportStar ? 'export-star' : 're-export-identity',
    reExportIdentityId: identity.id,
    reExportRelationId: identity.relationId,
    reExportSourcePath: identity.sourcePath,
    reExportModuleSpecifier: identity.moduleSpecifier,
    reExportTargetSourcePath: relationEdge?.resolvedModulePath,
    reExportTargetDocumentId: relationEdge?.targetDocumentId
  };
}

function projectImportTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace' || edge?.importKind === 'module') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  return name && name !== '*' ? String(name) : undefined;
}

export { resolveReExportIdentityImportTargets };
