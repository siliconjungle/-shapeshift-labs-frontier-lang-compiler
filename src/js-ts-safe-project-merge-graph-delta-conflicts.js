import { compactRecord } from './js-ts-safe-merge-context.js';
import { publicCompilerTypeDeltaConflicts } from './js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import { projectJsxPropDeltaConflicts, projectJsxRenderRiskDeltaConflicts } from './js-ts-safe-project-merge-jsx-graph-conflicts.js';
import { projectRuntimeRegionDeltaConflicts } from './js-ts-safe-project-merge-runtime-region-conflicts.js';
import { projectScopeUseDefDeltaConflicts } from './js-ts-safe-project-merge-scope-use-def-conflicts.js';
import { projectSourceSpanDeltaConflicts } from './js-ts-safe-project-merge-source-span-conflicts.js';
import { projectModuleDeclarationDeltaConflicts } from './js-ts-safe-project-merge-graph-delta-module-declarations.js';
import { commonJsRuntimeInteropDelta, commonJsRuntimeInteropProofAssessment } from './js-ts-safe-project-merge-graph-delta-commonjs-interop.js';
import { projectImportAttributeDeltaConflicts, projectPublicContractDeltaConflicts, projectReExportIdentityDeltaConflicts } from './js-ts-safe-project-merge-graph-delta-identity-conflicts.js';

function projectGraphDeltaConflicts(projectGraphDelta, options = {}) {
  const limitConflicts = projectGraphDeltaLimitConflicts(projectGraphDelta);
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  if (!baseGraph || !workerGraph || !headGraph) return limitConflicts;
  return [
    ...limitConflicts,
    ...projectPublicContractDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph),
    ...publicCompilerTypeDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph, options),
    ...projectSourceSpanDeltaConflicts(projectGraphDelta),
    ...projectRuntimeRegionDeltaConflicts(projectGraphDelta, options),
    ...projectScopeUseDefDeltaConflicts(projectGraphDelta),
    ...projectJsxPropDeltaConflicts(projectGraphDelta),
    ...projectJsxRenderRiskDeltaConflicts(projectGraphDelta, options),
    ...projectReExportIdentityDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph),
    ...projectModuleDeclarationDeltaConflicts(projectGraphDelta, options),
    ...projectImportAttributeDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph),
    ...projectImportTargetDeltaConflicts(projectGraphDelta, options)
  ];
}

function addProjectGraphDeltaConflictSummary(projectGraphDelta, conflicts) {
  if (!projectGraphDelta) return undefined;
  return {
    ...projectGraphDelta,
    summary: {
      ...projectGraphDelta.summary,
      conflicts: conflicts.length,
      publicContractConflicts: conflicts.filter((conflict) => conflict.code === 'project-public-contract-delta-conflict').length,
      sourceSpanConflicts: conflicts.filter((conflict) => conflict.code === 'project-source-span-delta-conflict').length,
      compilerTypeConflicts: conflicts.filter((conflict) => conflict.code === 'project-public-compiler-type-delta-conflict').length,
      runtimeRegionConflicts: conflicts.filter((conflict) => conflict.code === 'project-public-runtime-region-delta-conflict').length,
      scopeUseDefConflicts: conflicts.filter(isScopeUseDefConflict).length,
      jsxPropConflicts: conflicts.filter((conflict) => conflict.code === 'project-jsx-public-prop-delta-conflict').length,
      jsxRenderRiskConflicts: conflicts.filter((conflict) => conflict.code === 'project-jsx-public-render-risk-delta-conflict').length,
      reExportIdentityConflicts: conflicts.filter((conflict) => conflict.code === 'project-re-export-identity-delta-conflict').length,
      moduleDeclarationShapeConflicts: conflicts.filter((conflict) => conflict.code === 'project-module-declaration-shape-delta-conflict').length, exportAssignmentShapeConflicts: conflicts.filter((conflict) => conflict.code === 'project-export-assignment-shape-delta-conflict').length,
      importAttributeConflicts: conflicts.filter((conflict) => conflict.code === 'project-import-attribute-delta-conflict').length,
      importTargetConflicts: conflicts.filter((conflict) => conflict.code === 'project-import-target-delta-conflict').length,
      limitConflicts: conflicts.filter((conflict) => conflict.gateId === 'project-graph-limit').length
    }
  };
}

function projectGraphDeltaLimitConflicts(projectGraphDelta) {
  return Object.values(projectGraphDelta?.stages ?? {}).flatMap((stage) => stage?.limitConflicts ?? []);
}
function isScopeUseDefConflict(conflict) { return conflict.code === 'project-public-scope-use-def-delta-conflict' || conflict.code === 'project-public-scope-reference-delta-conflict'; }

function projectImportTargetDeltaConflicts(projectGraphDelta, options = {}) {
  const baseStage = projectGraphDelta?.stages?.base;
  const workerStage = projectGraphDelta?.stages?.worker;
  const headStage = projectGraphDelta?.stages?.head;
  const outputStage = projectGraphDelta?.stages?.output;
  const workerEdges = importEdgesByIdentityKey(workerStage?.projectSymbolGraph?.importEdges);
  const baseSymbolIds = semanticSymbolIds(baseStage);
  const headSymbolIds = semanticSymbolIds(headStage);
  const conflicts = [];
  const outputGraph = outputStage?.projectSymbolGraph;
  for (const [identityKey, edge] of importEdgesByIdentityKey(outputGraph?.importEdges)) {
    if (!edge.resolvedTargetSymbolId) continue;
    const workerEdge = workerEdges.get(identityKey);
    if (!workerEdge || workerEdge.resolvedTargetSymbolId === edge.resolvedTargetSymbolId) continue;
    if (baseSymbolIds.has(edge.resolvedTargetSymbolId) || !headSymbolIds.has(edge.resolvedTargetSymbolId)) continue;
    const commonJsInteropDelta = commonJsRuntimeInteropDelta(identityKey, edge, workerEdge, outputGraph);
    const commonJsProof = commonJsInteropDelta
      ? commonJsRuntimeInteropProofAssessment(commonJsInteropDelta, options)
      : undefined;
    if (commonJsProof?.status === 'passed') continue;
    conflicts.push(projectImportTargetDeltaConflict(identityKey, edge, workerEdge, commonJsProof));
  }
  return conflicts;
}

function projectImportTargetDeltaConflict(identityKey, edge, workerEdge, commonJsProof) {
  return {
    code: 'project-import-target-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Output import ${JSON.stringify(projectImportTargetName(edge) ?? edge.moduleSpecifier ?? 'unknown')} resolves to a head-branch exported symbol that the worker import did not resolve against.`,
    sourcePath: edge.sourcePath,
    details: compactRecord({
      reasonCode: 'project-import-target-delta-conflict',
      conflictKey: `project-graph-delta#import-target#${identityKey}`,
      identityKey,
      sourcePath: edge.sourcePath,
      moduleSpecifier: edge.moduleSpecifier,
      importedName: edge.importedName,
      localName: edge.localName,
      importKind: edge.importKind,
      commonJs: edge.commonJs,
      interopHelper: edge.interopHelper,
      packageRuntimeCondition: edge.packageRuntimeCondition,
      packageRuntimeConditionEdgeKind: edge.packageRuntimeConditionEdgeKind,
      resolvedModulePath: edge.resolvedModulePath,
      outputTargetSymbolId: edge.resolvedTargetSymbolId,
      workerTargetSymbolId: workerEdge.resolvedTargetSymbolId,
      workerResolutionKind: workerEdge.resolutionKind,
      outputResolutionKind: edge.resolutionKind,
      routeId: commonJsProof?.routeId,
      routeLane: commonJsProof?.routeLane,
      routeNext: commonJsProof?.routeNext,
      reasonCodes: commonJsProof?.reasonCodes,
      commonJsRuntimeInteropProof: commonJsProof?.record,
      semanticEquivalenceClaim: false
    })
  };
}

function importEdgesByIdentityKey(records) {
  const result = new Map();
  for (const record of records ?? []) {
    const key = importEdgeIdentityKey(record);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

function importEdgeIdentityKey(edge) {
  const targetName = projectImportTargetName(edge);
  if (!edge?.sourcePath || !edge.moduleSpecifier || !targetName) return undefined;
  return stableKey(['import-target', edge.sourcePath, edge.moduleSpecifier, targetName, edge.importKind, edge.isTypeOnly]);
}

function projectImportTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  if (!name || name === '*') return undefined;
  return String(name);
}

function semanticSymbolIds(stage) {
  return new Set((stage?.projectImport?.semanticIndex?.symbols ?? []).map((symbol) => symbol.id).filter(Boolean));
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

export { addProjectGraphDeltaConflictSummary, projectGraphDeltaConflicts };
