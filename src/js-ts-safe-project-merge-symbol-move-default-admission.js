import { compactRecord } from './js-ts-safe-merge-context.js';

function projectSymbolMoveDefaultAdmissionProofs(graphDelta, branch, exportedSymbolMoves, importedSymbolMoves, requiredEvidence = []) {
  const proofs = new Map();
  if (exportedSymbolMoves.length !== 1) return proofs;
  const exportMove = exportedSymbolMoves[0];
  const proof = projectSymbolMoveDefaultAdmissionProof(graphDelta, branch, exportMove, importedSymbolMoves, requiredEvidence);
  const proofKey = symbolMoveProofKey(exportMove.details);
  if (proof && proofKey) proofs.set(proofKey, proof);
  return proofs;
}

function projectSymbolMoveDefaultAdmissionProof(graphDelta, branch, exportMove, importedSymbolMoves, requiredEvidence) {
  const details = exportMove.details ?? {};
  const symbolName = details.symbolName;
  const fromPath = details.fromSourcePath;
  const toPath = details.toSourcePath;
  if (!symbolName || !fromPath || !toPath) return undefined;
  const matchingImportMoves = importedSymbolMoves.filter((move) => importedMoveMatchesExportMove(move, details));
  if (!matchingImportMoves.length || matchingImportMoves.length !== importedSymbolMoves.length) return undefined;
  const baseOldReferences = projectSymbolImportReferences(graphDelta, 'base', fromPath, symbolName);
  const branchNewReferences = projectSymbolImportReferences(graphDelta, branch, toPath, symbolName);
  const branchOldReferences = projectSymbolImportReferences(graphDelta, branch, fromPath, symbolName);
  if (branchOldReferences.length) return undefined;
  const rewriteKeys = matchingImportMoves.map(importedMoveReferenceKey);
  const baseOldKeys = baseOldReferences.map(importReferenceKey);
  const branchNewKeys = branchNewReferences.map(importReferenceKey);
  if (!hasCompleteUniqueStringSet(rewriteKeys)
    || !hasCompleteUniqueStringSet(baseOldKeys)
    || !hasCompleteUniqueStringSet(branchNewKeys)) {
    return undefined;
  }
  if (!sameStringSet(rewriteKeys, baseOldKeys) || !sameStringSet(rewriteKeys, branchNewKeys)) return undefined;
  return compactRecord({
    status: 'passed',
    route: 'default-exact-exported-symbol-move',
    branch,
    symbolName,
    fromSourcePath: fromPath,
    toSourcePath: toPath,
    exportedMoveConflictKey: details.conflictKey,
    importRewriteCount: matchingImportMoves.length,
    rewrittenImportSourcePaths: uniqueStrings(matchingImportMoves.map((move) => move.details?.importerSourcePath)),
    importMoveConflictKeys: uniqueStrings(matchingImportMoves.map((move) => move.details?.conflictKey)),
    baseImportReferences: baseOldReferences.length,
    branchImportReferences: branchNewReferences.length,
    staleImportReferences: 0,
    duplicateImportReferences: 0,
    duplicateExportReferences: 0,
    requiredEvidence: ['project-graph-delta-evidence', ...requiredEvidence]
  });
}

function withDefaultAdmissionProof(classification, proofs) {
  const proof = proofs.get(symbolMoveProofKey(classification.details));
  if (!proof) return classification;
  return {
    ...classification,
    details: compactRecord({ ...classification.details, defaultAdmissionProof: proof })
  };
}

function importedMoveMatchesExportMove(move, exportMoveDetails) {
  const details = move.details ?? {};
  return move.kind === 'imported-symbol-move'
    && details.branch === exportMoveDetails.branch
    && details.symbolName === exportMoveDetails.symbolName
    && modulePathMatches(details.fromSourcePath, exportMoveDetails.fromSourcePath)
    && modulePathMatches(details.toSourcePath, exportMoveDetails.toSourcePath)
    && importedMoveReferenceKey(move);
}

function projectSymbolImportReferences(graphDelta, stageName, exportSourcePath, symbolName) {
  const graph = graphDelta.stages?.[stageName]?.projectSymbolGraph;
  return namedImportReferenceEdges(graph)
    .filter((edge) => importTargetName(edge) === symbolName && modulePathMatches(edge.resolvedModulePath, exportSourcePath))
    .map(importEdgeEvidence);
}

function namedImportReferenceEdges(graph) {
  return (graph?.importEdges ?? []).filter((edge) => edge?.sourcePath && edge.resolvedModulePath && importTargetName(edge));
}

function importedMoveReferenceKey(move) {
  const details = move.details ?? {};
  const baseEdge = details.graphEvidence?.base?.importEdge;
  const branchEdge = details.graphEvidence?.[move.branch]?.importEdge;
  if (!baseEdge || !branchEdge) return undefined;
  if (importTargetName(baseEdge) !== details.symbolName || importTargetName(branchEdge) !== details.symbolName) return undefined;
  if (!modulePathMatches(baseEdge.resolvedModulePath, details.fromSourcePath)) return undefined;
  if (!modulePathMatches(branchEdge.resolvedModulePath, details.toSourcePath)) return undefined;
  if (baseEdge.localName !== branchEdge.localName
    || baseEdge.importKind !== branchEdge.importKind
    || Boolean(baseEdge.isTypeOnly) !== Boolean(branchEdge.isTypeOnly)) {
    return undefined;
  }
  return importReferenceKey(baseEdge);
}

function importReferenceKey(reference) {
  return stableKey([
    'symbol-move-import-reference',
    reference.sourcePath,
    importTargetName(reference),
    reference.localName,
    reference.importKind,
    reference.isTypeOnly ? 'type' : 'value'
  ]);
}

function importEdgeEvidence(edge) {
  return compactRecord({
    sourcePath: edge.sourcePath,
    moduleSpecifier: edge.moduleSpecifier,
    importKind: edge.importKind,
    importedName: edge.importedName,
    localName: edge.localName,
    isTypeOnly: edge.isTypeOnly,
    resolvedModulePath: edge.resolvedModulePath
  });
}

function importTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  return name && name !== '*' ? String(name) : undefined;
}

function symbolMoveProofKey(details) {
  return stableKey(['symbol-move-default-admission', details?.branch, details?.symbolName, normalizeModulePath(details?.fromSourcePath), normalizeModulePath(details?.toSourcePath)]);
}

function modulePathMatches(left, right) { return normalizeModulePath(left) === normalizeModulePath(right); }
function normalizeModulePath(sourcePath) { return String(sourcePath ?? '').replace(/\.(?:c|m)?(?:j|t)sx?$/u, ''); }
function hasCompleteUniqueStringSet(values) { return values.every((value) => typeof value === 'string' && value.length > 0) && new Set(values).size === values.length; }
function sameStringSet(left, right) { return left.length === right.length && left.every((value) => new Set(right).has(value)); }
function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectSymbolMoveDefaultAdmissionProofs, withDefaultAdmissionProof };
