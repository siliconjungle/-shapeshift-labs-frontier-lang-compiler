import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { projectGraphDeltaConflicts } from './js-ts-safe-project-merge-graph-delta-conflicts.js';

function outputProjectGraphConflicts(projectSymbolGraph) {
  const limitConflicts = Array.isArray(projectSymbolGraph?.limitConflicts) ? projectSymbolGraph.limitConflicts : [];
  projectSymbolGraph = projectSymbolGraph?.projectSymbolGraph ?? projectSymbolGraph;
  const importEdges = Array.isArray(projectSymbolGraph?.importEdges) ? projectSymbolGraph.importEdges : [];
  const missingModuleGroups = new Map();
  const missingSymbolGroups = new Map();
  for (const edge of importEdges) {
    if (isMissingProjectImportEdge(edge)) {
      const key = [edge.sourcePath, edge.moduleSpecifier, edge.resolutionKind, edge.resolvedModulePath].join('\u0000');
      const group = missingModuleGroups.get(key) ?? [];
      group.push(edge);
      missingModuleGroups.set(key, group);
      continue;
    }
    if (isMissingProjectImportTargetEdge(edge)) {
      const key = [edge.sourcePath, edge.moduleSpecifier, projectImportTargetName(edge), edge.resolvedModulePath].join('\u0000');
      const group = missingSymbolGroups.get(key) ?? [];
      group.push(edge);
      missingSymbolGroups.set(key, group);
    }
  }
  return [
    ...limitConflicts,
    ...[...missingModuleGroups.values()].map(projectGraphMissingImportConflict),
    ...[...missingSymbolGroups.values()].map(projectGraphMissingTargetConflict),
    ...duplicateReExportIdentityConflicts(projectSymbolGraph?.reExportIdentities)
  ];
}

function projectGraphMissingImportConflict(group) {
  const edge = group[0] ?? {};
  return {
    code: 'project-output-module-unresolved',
    gateId: 'project-symbol-graph',
    message: `Output project graph contains unresolved ${edge.resolutionKind ?? 'missing'} import ${JSON.stringify(edge.moduleSpecifier ?? edge.resolvedModulePath ?? 'unknown')}.`,
    sourcePath: edge.sourcePath,
    details: compactRecord({
      reasonCode: 'project-output-module-unresolved',
      conflictKey: `project-module#${edge.sourcePath ?? 'unknown'}#${edge.moduleSpecifier ?? edge.resolvedModulePath ?? 'unknown'}`,
      sourcePath: edge.sourcePath,
      moduleSpecifier: edge.moduleSpecifier,
      resolutionKind: edge.resolutionKind,
      resolvedModulePath: edge.resolvedModulePath,
      edgeIds: uniqueStrings(group.map((record) => record.id)),
      importKinds: uniqueStrings(group.map((record) => record.importKind)),
      importedNames: uniqueStrings(group.map((record) => record.importedName))
    })
  };
}

function projectGraphMissingTargetConflict(group) {
  const edge = group[0] ?? {};
  const targetName = projectImportTargetName(edge);
  return {
    code: 'project-output-symbol-unresolved',
    gateId: 'project-symbol-graph',
    message: `Output project graph import ${JSON.stringify(edge.moduleSpecifier ?? 'unknown')} resolves to a module without exported symbol ${JSON.stringify(targetName ?? 'unknown')}.`,
    sourcePath: edge.sourcePath,
    details: compactRecord({
      reasonCode: 'project-output-symbol-unresolved',
      conflictKey: `project-symbol#${edge.sourcePath ?? 'unknown'}#${edge.moduleSpecifier ?? edge.resolvedModulePath ?? 'unknown'}#${targetName ?? 'unknown'}`,
      sourcePath: edge.sourcePath,
      moduleSpecifier: edge.moduleSpecifier,
      resolutionKind: edge.resolutionKind,
      resolvedModulePath: edge.resolvedModulePath,
      targetDocumentId: edge.targetDocumentId,
      targetExportName: targetName,
      edgeIds: uniqueStrings(group.map((record) => record.id)),
      importKinds: uniqueStrings(group.map((record) => record.importKind)),
      importedNames: uniqueStrings(group.map((record) => record.importedName)),
      localNames: uniqueStrings(group.map((record) => record.localName))
    })
  };
}

function isMissingProjectImportEdge(edge) {
  return typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-missing');
}

function isMissingProjectImportTargetEdge(edge) {
  return hasResolvedProjectModule(edge) && Boolean(projectImportTargetName(edge)) && !edge.resolvedTargetSymbolId;
}

function hasResolvedProjectModule(edge) {
  return Boolean(edge?.targetDocumentId) && typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-source');
}

function projectImportTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  if (!name || name === '*') return undefined;
  return String(name);
}

function duplicateReExportIdentityConflicts(records = []) {
  const groups = new Map();
  for (const record of records) {
    const key = reExportIdentityKey(record);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, group]) => new Set(group.map(reExportIdentityFingerprint)).size > 1)
    .map(([identityKey, group]) => projectGraphDuplicateReExportIdentityConflict(identityKey, group));
}

function projectGraphDuplicateReExportIdentityConflict(identityKey, group) {
  const record = group[0] ?? {};
  return {
    code: 'project-output-re-export-identity-conflict',
    gateId: 'project-symbol-graph',
    message: `Output project graph exposes incompatible re-export identity ${JSON.stringify(identityKey)}.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-output-re-export-identity-conflict',
      conflictKey: `project-output-re-export-identity#${identityKey}`,
      identityKey,
      sourcePath: record.sourcePath,
      exportedName: record.exportedName,
      records: group.map(reExportIdentityDetails)
    })
  };
}

function reExportIdentityKey(record) {
  return stableKey([
    're-export-identity',
    record?.sourcePath,
    record?.exportedName ?? record?.localName ?? record?.namespace ?? (record?.exportStar || record?.isExportStar ? '*' : undefined)
  ]);
}

function reExportIdentityFingerprint(record) {
  return hashSemanticValue({
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
  return compactRecord({
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

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { outputProjectGraphConflicts, projectGraphDeltaConflicts };
