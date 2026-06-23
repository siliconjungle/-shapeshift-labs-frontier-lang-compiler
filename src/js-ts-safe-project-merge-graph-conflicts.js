import { compactRecord } from './js-ts-safe-merge-context.js';

function outputProjectGraphConflicts(projectSymbolGraph) {
  const importEdges = Array.isArray(projectSymbolGraph?.importEdges) ? projectSymbolGraph.importEdges : [];
  const groups = new Map();
  for (const edge of importEdges) {
    if (!isMissingProjectImportEdge(edge)) continue;
    const key = [edge.sourcePath, edge.moduleSpecifier, edge.resolutionKind, edge.resolvedModulePath].join('\u0000');
    const group = groups.get(key) ?? [];
    group.push(edge);
    groups.set(key, group);
  }
  return [...groups.values()].map(projectGraphMissingImportConflict);
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

function isMissingProjectImportEdge(edge) {
  return typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-missing');
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { outputProjectGraphConflicts };
