import { compactRecord } from './js-ts-safe-merge-context.js';
import { moduleEdgeResolutionRoute } from './js-ts-safe-project-merge-module-resolution-routes.js';

function projectGraphImportAttributeConflict(group) {
  const edge = group[0] ?? {};
  const moduleEdgeFailureReasons = uniqueStrings(group.flatMap(importAttributeFailureReasonCodes));
  const route = moduleEdgeResolutionRoute(moduleEdgeFailureReasons, {
    targetKind: 'module',
    hasPackageImportEdge: group.some((record) => record?.packageImportKey)
  });
  return {
    code: 'project-output-import-attribute-unresolved',
    gateId: 'project-symbol-graph',
    message: `Output project graph import ${JSON.stringify(edge.moduleSpecifier ?? 'unknown')} contains import attribute syntax without static key/value evidence.`,
    sourcePath: edge.sourcePath,
    details: compactRecord({
      reasonCode: 'project-output-import-attribute-unresolved',
      conflictKey: `project-import-attribute#${edge.sourcePath ?? 'unknown'}#${edge.moduleSpecifier ?? 'unknown'}#${edge.importKind ?? 'unknown'}`,
      sourcePath: edge.sourcePath,
      sourceHash: edge.sourceHash,
      moduleSpecifier: edge.moduleSpecifier,
      resolutionKind: edge.resolutionKind,
      resolvedModulePath: edge.resolvedModulePath,
      targetDocumentId: edge.targetDocumentId,
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

function isAmbiguousImportAttributeEdge(edge) {
  return importAttributeFailureReasonCodes(edge).length > 0;
}

function importAttributeFailureReasonCodes(edge) {
  if (!edge?.hasImportAttributes) return [];
  const count = edge.importAttributeCount;
  return uniqueStrings([
    Number.isInteger(count) && count > 0 ? undefined : 'import-attribute-static-value-missing',
    edge.importAttributeHash ? undefined : 'import-attribute-static-hash-missing',
    Array.isArray(edge.importAttributes) && edge.importAttributes.length === count ? undefined : 'import-attribute-static-records-missing'
  ]);
}

function moduleEdgeEvidence(edge) {
  return compactRecord(Object.fromEntries(moduleEdgeEvidenceFields.map((field) => [field, edge?.[field]])));
}

const moduleEdgeEvidenceFields = [
  'id',
  'sourcePath',
  'sourceHash',
  'moduleSpecifier',
  'resolutionKind',
  'resolvedModulePath',
  'targetDocumentId',
  'resolvedTargetSymbolId',
  'edgeKind',
  'importKind',
  'exportKind',
  'importedName',
  'exportedName',
  'localName',
  'isTypeOnly',
  'resolutionPathVariant',
  'packageName',
  'packageSubpath',
  'packageExportKey',
  'packageExportCondition',
  'packageExportTarget',
  'packageImportKey',
  'packageImportCondition',
  'packageImportTarget',
  'packageType',
  'packageRuntimeCondition',
  'packageRuntimeConditionEvidenceSource',
  'packageRuntimeConditionEdgeKind',
  'packageRuntimeConditionCandidates',
  'packageRuntimeConditionReasonCode',
  'packageEnvironmentCondition',
  'packageEnvironmentConditionEvidenceSource',
  'packageEnvironmentConditionCandidates',
  'packageEnvironmentConditionReasonCode',
  'packageWorkspaceRootAmbiguous',
  'packageWorkspaceRoots',
  'packageResolutionReasonCode',
  'hostDependencyKind',
  'hostDependencyBase',
  'hostDependencyExpressionHash',
  'hostDependencyStaticSpecifierEvidence',
  'hostDependencyRuntimeResolutionClaim',
  'hostDependencyResolutionProofRequired',
  'dynamicImport',
  'dynamicImportSpecifierKind',
  'dynamicImportExpressionText',
  'dynamicImportExpressionHash',
  'dynamicImportStaticSpecifierEvidence',
  'dynamicImportRuntimeResolutionClaim',
  'dynamicImportResolutionProofRequired',
  'hasImportAttributes',
  'importAttributeCount',
  'importAttributeKeys',
  'importAttributeHash',
  'importAttributes'
];

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { isAmbiguousImportAttributeEdge, moduleEdgeEvidence, projectGraphImportAttributeConflict };
