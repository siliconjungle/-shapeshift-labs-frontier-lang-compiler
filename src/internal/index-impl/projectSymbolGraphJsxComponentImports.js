import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function jsxImportedComponentOwnerIndexes(importEdges = [], exportEdges = [], componentOwnersBySourcePath = new Map()) {
  const exportLocalNames = exportLocalNameIndex(exportEdges);
  const reExportTargets = reExportTargetIndex(exportEdges);
  const result = new Map();
  for (const edge of importEdges) {
    const localName = plainComponentName(edge?.localName);
    if (!localName || edge.isTypeOnly || edge.importKind === 'module' || !edge.resolvedModulePath) continue;
    const target = importedOwnerTarget(edge, exportLocalNames, reExportTargets, componentOwnersBySourcePath);
    if (!target) continue;
    addImportedOwner(result, edge.sourcePath, localName, importedOwnerRecord(target.owner, edge, target));
  }
  return result;
}

function jsxImportedMemberComponentOwnerIndexes(importEdges = [], exportEdges = [], memberOwnersBySourcePath = new Map()) {
  const exportLocalNames = exportLocalNameIndex(exportEdges);
  const reExportTargets = reExportTargetIndex(exportEdges);
  const result = new Map();
  for (const edge of importEdges) {
    const localObjectName = plainComponentName(edge?.localName);
    if (!localObjectName || edge.isTypeOnly || edge.importKind === 'module' || !edge.resolvedModulePath) continue;
    const target = importedMemberOwnerTarget(edge, exportLocalNames, reExportTargets, memberOwnersBySourcePath);
    if (!target) continue;
    for (const [propertyName, owners] of target.members) {
      if (owners.length !== 1) continue;
      const tagName = `${localObjectName}.${propertyName}`;
      addImportedOwner(result, edge.sourcePath, tagName, importedMemberOwnerRecord(owners[0], edge, target, propertyName));
    }
  }
  return result;
}

function mergeJsxComponentOwnerIndexes(localOwners = new Map(), importedOwners = new Map()) {
  const result = new Map([...localOwners].map(([name, owners]) => [name, [...owners]]));
  for (const [name, owners] of importedOwners) result.set(name, [...(result.get(name) ?? []), ...owners]);
  return result;
}

function importedOwnerName(edge, exportLocalNames) {
  const importedName = edge.importedName || edge.localName;
  if (importedName !== 'default') return importedName;
  return exportLocalNames.get(`${edge.resolvedModulePath}\0default`) ?? edge.localName;
}

function importedOwnerTarget(edge, exportLocalNames, reExportTargets, componentOwnersBySourcePath) {
  const directOwnerName = importedOwnerName(edge, exportLocalNames);
  const directOwners = componentOwnersBySourcePath.get(edge.resolvedModulePath)?.get(directOwnerName) ?? [];
  if (directOwners.length === 1) return { owner: directOwners[0], ownerName: directOwnerName, targetExportName: edge.importedName ?? directOwnerName };
  const reExport = reExportTargets.get(`${edge.resolvedModulePath}\0${edge.importedName || edge.localName}`);
  const starReExport = reExport ?? starReExportTarget(edge);
  if (!starReExport) return undefined;
  return importedReExportOwnerTarget(edge, starReExport, exportLocalNames, componentOwnersBySourcePath);
}

function importedMemberOwnerTarget(edge, exportLocalNames, reExportTargets, memberOwnersBySourcePath) {
  const directObjectName = importedOwnerName(edge, exportLocalNames);
  const directMembers = memberOwnersBySourcePath.get(edge.resolvedModulePath)?.get(directObjectName);
  if (directMembers?.size) return { members: directMembers, objectName: directObjectName, targetExportName: edge.importedName ?? directObjectName };
  const reExport = reExportTargets.get(`${edge.resolvedModulePath}\0${edge.importedName || edge.localName}`);
  const starReExport = reExport ?? starReExportTarget(edge);
  if (!starReExport) return undefined;
  return importedReExportMemberOwnerTarget(edge, starReExport, exportLocalNames, memberOwnersBySourcePath);
}

function importedReExportOwnerTarget(edge, reExport, exportLocalNames, componentOwnersBySourcePath) {
  const targetExportName = reExport.localName ?? reExport.exportedName;
  const ownerName = targetExportName === 'default' ? exportLocalNames.get(`${reExport.resolvedModulePath}\0default`) ?? edge.localName : targetExportName;
  const owners = componentOwnersBySourcePath.get(reExport.resolvedModulePath)?.get(ownerName) ?? [];
  return owners.length === 1 ? { owner: owners[0], ownerName, targetExportName, reExport } : undefined;
}

function importedReExportMemberOwnerTarget(edge, reExport, exportLocalNames, memberOwnersBySourcePath) {
  const targetExportName = reExport.localName ?? reExport.exportedName;
  const objectName = targetExportName === 'default' ? exportLocalNames.get(`${reExport.resolvedModulePath}\0default`) ?? edge.localName : targetExportName;
  const members = memberOwnersBySourcePath.get(reExport.resolvedModulePath)?.get(objectName);
  return members?.size ? { members, objectName, targetExportName, reExport } : undefined;
}

function starReExportTarget(edge) {
  if (edge.reExportResolutionKind !== 'export-star' || !edge.reExportTargetSourcePath) return undefined;
  return {
    id: edge.reExportRelationId,
    sourcePath: edge.reExportSourcePath,
    exportedName: edge.importedName ?? edge.localName,
    localName: edge.importedName ?? edge.localName,
    resolvedModulePath: edge.reExportTargetSourcePath,
    exportStar: true,
    reExportIdentityId: edge.reExportIdentityId
  };
}

function importedMemberOwnerRecord(owner, edge, target, propertyName) {
  const reExport = target.reExport;
  const scope = reExport ? 'project-import-reexport-member-component' : 'project-import-member-component';
  const componentCallMemberBindingHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxImportedMemberComponentBinding',
    localObjectName: edge.localName,
    targetObjectName: target.objectName,
    propertyName,
    localName: owner.componentCallMemberLocalName,
    targetSourcePath: reExport?.resolvedModulePath ?? edge.resolvedModulePath,
    importEdgeId: edge.id,
    reExportEdgeId: reExport?.id,
    reExportIdentityId: reExport?.reExportIdentityId,
    sourceMemberBindingHash: owner.componentCallMemberBindingHash
  });
  return {
    ...importedOwnerRecord(owner, edge, target),
    componentProviderLookupScope: scope,
    componentCallLookupStatus: reExport ? 'project-import-reexport-member-component-target-evidence' : 'project-import-member-component-target-evidence',
    componentCallTargetSourcePath: owner.sourcePath,
    componentCallMemberObjectName: edge.localName,
    componentCallMemberPropertyName: propertyName,
    componentCallMemberBindingHash
  };
}

function importedOwnerRecord(owner, edge, target) {
  const reExport = target.reExport;
  return {
    ...owner,
    componentProviderLookupScope: reExport ? 'project-import-reexport-component' : 'project-import-direct-component',
    componentCallLookupStatus: reExport ? 'project-import-reexport-component-target-evidence' : 'project-import-component-target-evidence',
    componentCallTargetSourcePath: reExport?.resolvedModulePath ?? edge.resolvedModulePath,
    componentCallImportEdgeId: edge.id,
    componentCallImportKind: edge.importKind,
    componentCallImportedName: edge.importedName,
    componentCallLocalName: edge.localName,
    componentCallTargetExportName: target.targetExportName,
    componentCallReExportEdgeId: reExport?.id,
    componentCallReExportSourcePath: reExport?.sourcePath,
    componentCallReExportExportedName: reExport?.exportedName,
    componentCallReExportLocalName: reExport?.localName,
    componentCallReExportTargetSourcePath: reExport?.resolvedModulePath,
    componentCallReExportKind: reExport?.exportStar ? 'export-star' : reExport ? 'named' : undefined,
    componentCallReExportIdentityId: reExport?.reExportIdentityId
  };
}

function exportLocalNameIndex(exportEdges = []) {
  const result = new Map();
  for (const edge of exportEdges) {
    if (!edge?.sourcePath || !edge.exportedName) continue;
    result.set(`${edge.sourcePath}\0${edge.exportedName}`, edge.localName ?? edge.exportedName);
  }
  return result;
}

function reExportTargetIndex(exportEdges = []) {
  const result = new Map();
  for (const edge of exportEdges) {
    if (!edge?.sourcePath || !edge.resolvedModulePath || !edge.isReExport || edge.exportStar || !plainComponentName(edge.exportedName)) continue;
    result.set(`${edge.sourcePath}\0${edge.exportedName}`, edge);
  }
  return result;
}

function addImportedOwner(result, sourcePath, localName, owner) {
  const byName = result.get(sourcePath) ?? new Map();
  byName.set(localName, [...(byName.get(localName) ?? []), owner]);
  result.set(sourcePath, byName);
}

function plainComponentName(name) {
  return /^[A-Z][A-Za-z0-9_$]*$/.test(String(name ?? '')) ? String(name) : undefined;
}

export { jsxImportedComponentOwnerIndexes, jsxImportedMemberComponentOwnerIndexes, mergeJsxComponentOwnerIndexes };
