import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { cssModuleUseSiteBlockerConflicts, isResolvedCssModuleImportEdge } from './js-ts-safe-project-merge-css-module-conflicts.js';
import { projectGraphDeltaConflicts } from './js-ts-safe-project-merge-graph-delta-conflicts.js';
import { isAmbiguousImportAttributeEdge, moduleEdgeEvidence, projectGraphImportAttributeConflict } from './js-ts-safe-project-merge-import-attribute-conflicts.js';
import { moduleEdgeResolutionRoute } from './js-ts-safe-project-merge-module-resolution-routes.js';

function outputProjectGraphConflicts(projectSymbolGraph) {
  const limitConflicts = Array.isArray(projectSymbolGraph?.limitConflicts) ? projectSymbolGraph.limitConflicts : [];
  projectSymbolGraph = projectSymbolGraph?.projectSymbolGraph ?? projectSymbolGraph;
  const importEdges = Array.isArray(projectSymbolGraph?.importEdges) ? projectSymbolGraph.importEdges : [];
  const exportEdges = Array.isArray(projectSymbolGraph?.exportEdges) ? projectSymbolGraph.exportEdges : [];
  const cssModuleBlockers = Array.isArray(projectSymbolGraph?.cssModuleUseSiteBlockers) ? projectSymbolGraph.cssModuleUseSiteBlockers : [];
  const missingModuleGroups = new Map();
  const missingSymbolGroups = new Map();
  const importAttributeGroups = new Map();
  for (const edge of importEdges) {
    if (isMissingProjectImportEdge(edge)) {
      const key = [edge.sourcePath, edge.moduleSpecifier, edge.resolutionKind, edge.resolvedModulePath].join('\u0000');
      const group = missingModuleGroups.get(key) ?? [];
      group.push(edge);
      missingModuleGroups.set(key, group);
      continue;
    }
    if (isMissingProjectImportTargetEdge(edge, exportEdges)) {
      const key = [edge.sourcePath, edge.moduleSpecifier, projectImportTargetName(edge), edge.resolvedModulePath].join('\u0000');
      const group = missingSymbolGroups.get(key) ?? [];
      group.push(edge);
      missingSymbolGroups.set(key, group);
    }
    if (isAmbiguousImportAttributeEdge(edge)) {
      const key = [edge.sourcePath, edge.moduleSpecifier, edge.edgeKind, edge.importKind, edge.importedName, edge.localName].join('\u0000');
      const group = importAttributeGroups.get(key) ?? [];
      group.push(edge);
      importAttributeGroups.set(key, group);
    }
  }
  return [
    ...limitConflicts,
    ...cssModuleUseSiteBlockerConflicts(cssModuleBlockers),
    ...[...missingModuleGroups.values()].map(projectGraphMissingImportConflict),
    ...[...missingSymbolGroups.values()].map(projectGraphMissingTargetConflict),
    ...[...importAttributeGroups.values()].map(projectGraphImportAttributeConflict),
    ...duplicateReExportIdentityConflicts(projectSymbolGraph?.reExportIdentities)
  ];
}

function projectGraphMissingImportConflict(group) {
  const edge = group[0] ?? {};
  const moduleEdgeFailureReasons = uniqueStrings(group.flatMap(moduleEdgeFailureReasonCodes));
  const route = moduleEdgeResolutionRoute(moduleEdgeFailureReasons, { targetKind: 'module', hasPackageImportEdge: group.some((record) => record?.packageImportKey) });
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
      importedNames: uniqueStrings(group.map((record) => record.importedName)),
      moduleEdgeFailureReasonCodes: moduleEdgeFailureReasons,
      moduleEdgeEvidence: group.map(moduleEdgeEvidence),
      requiredProof: route.requiredProof,
      routeId: route.routeId,
      routeLane: route.routeLane,
      routeNext: route.routeNext,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    })
  };
}

function projectGraphMissingTargetConflict(group) {
  const edge = group[0] ?? {};
  const targetName = projectImportTargetName(edge);
  const moduleEdgeFailureReasons = uniqueStrings(['project-output-symbol-unresolved', ...group.flatMap(moduleEdgeFailureReasonCodes)]);
  const route = moduleEdgeResolutionRoute(moduleEdgeFailureReasons, { targetKind: 'symbol', hasPackageImportEdge: group.some((record) => record?.packageImportKey) });
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
      localNames: uniqueStrings(group.map((record) => record.localName)),
      moduleEdgeFailureReasonCodes: moduleEdgeFailureReasons,
      moduleEdgeEvidence: group.map(moduleEdgeEvidence),
      requiredProof: route.requiredProof,
      routeId: route.routeId,
      routeLane: route.routeLane,
      routeNext: route.routeNext,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    })
  };
}

function isMissingProjectImportEdge(edge) {
  return typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-missing');
}

function isMissingProjectImportTargetEdge(edge, exportEdges = []) {
  return hasResolvedProjectModule(edge)
    && Boolean(projectImportTargetName(edge))
    && !edge.resolvedTargetSymbolId
    && !isResolvedCssModuleImportEdge(edge)
    && !commonJsRequireResolvedByExportAssignment(edge, exportEdges);
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

function commonJsRequireResolvedByExportAssignment(edge, exportEdges) {
  if (edge?.importKind !== 'commonjs-require' || projectImportTargetName(edge) !== 'default') return false;
  return exportEdges.some((exportEdge) => exportEdge?.exportKind === 'assignment'
    && exportEdge.exportedName === 'module.exports'
    && sameProjectDocument(edge, exportEdge));
}

function sameProjectDocument(importEdge, exportEdge) {
  if (importEdge?.targetDocumentId && exportEdge?.sourceDocumentId) {
    return importEdge.targetDocumentId === exportEdge.sourceDocumentId;
  }
  if (importEdge?.resolvedModulePath && exportEdge?.sourcePath) {
    return importEdge.resolvedModulePath === exportEdge.sourcePath;
  }
  return false;
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
    hasImportAttributes: record.hasImportAttributes,
    importAttributeCount: record.importAttributeCount,
    importAttributeKeys: record.importAttributeKeys,
    importAttributeHash: record.importAttributeHash,
    importAttributes: record.importAttributes,
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
    hasImportAttributes: record.hasImportAttributes,
    importAttributeCount: record.importAttributeCount,
    importAttributeKeys: record.importAttributeKeys,
    importAttributeHash: record.importAttributeHash,
    importAttributes: record.importAttributes,
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

function moduleEdgeFailureReasonCodes(edge) {
  return [
    edge?.packageRuntimeConditionReasonCode,
    edge?.packageEnvironmentConditionReasonCode,
    edge?.packageResolutionReasonCode,
    typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-missing') ? edge.resolutionKind : undefined
  ];
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { outputProjectGraphConflicts, projectGraphDeltaConflicts };
