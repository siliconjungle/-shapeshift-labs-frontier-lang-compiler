import { createJsTsProjectSafeMergeGraphDelta } from './js-ts-safe-project-merge-graph.js';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { projectSymbolMoveDefaultAdmissionProofs, withDefaultAdmissionProof } from './js-ts-safe-project-merge-symbol-move-default-admission.js';
import { classifySymbolMoveRisks, duplicateExportedSymbolMoveClassification } from './js-ts-safe-project-merge-symbol-move-risks.js';

const symbolMoveRequiredEvidence = ['symbol-lineage-evidence', 'import-export-rewrite-evidence', 'output-diagnostics-gate', 'output-declaration-gate'];

function classifyProjectSymbolMoves(input, files, projectId, fileMoveRenames = []) {
  if (!hasSymbolMoveSignal(files)) return [];
  const graphDelta = classificationGraphDelta(input, files, projectId);
  if (!graphDelta?.stages?.base) return [];
  return uniqueClassifications([
    ...classifyBranchSymbolMoves(graphDelta, 'worker', fileMoveRenames),
    ...classifyBranchSymbolMoves(graphDelta, 'head', fileMoveRenames)
  ]);
}

function classifyBranchSymbolMoves(graphDelta, branch, fileMoveRenames) {
  const importedSymbolMoves = classifyImportedSymbolMoves(graphDelta, branch, fileMoveRenames);
  const exportedSymbolMoves = classifyExportedSymbolMoves(graphDelta, branch, fileMoveRenames);
  const exactExportedSymbolMoves = exportedSymbolMoves.filter((classification) => classification.kind === 'exported-symbol-move');
  const defaultAdmissionProofs = projectSymbolMoveDefaultAdmissionProofs(graphDelta, branch, exactExportedSymbolMoves, importedSymbolMoves, symbolMoveRequiredEvidence);
  return [
    ...importedSymbolMoves.map((classification) => withDefaultAdmissionProof(classification, defaultAdmissionProofs)),
    ...exportedSymbolMoves.map((classification) => withDefaultAdmissionProof(classification, defaultAdmissionProofs)),
    ...classifySymbolMoveRisks(graphDelta, branch, exactExportedSymbolMoves)
  ];
}

function classifyImportedSymbolMoves(graphDelta, branch, fileMoveRenames) {
  const baseGraph = graphDelta.stages?.base?.projectSymbolGraph;
  const branchGraph = graphDelta.stages?.[branch]?.projectSymbolGraph;
  if (!baseGraph || !branchGraph) return [];
  const baseGroups = importEdgesGroupedBy(baseGraph);
  const branchGroups = importEdgesGroupedBy(branchGraph);
  const classifications = [];
  for (const [key, baseGroup] of baseGroups) {
    const branchGroup = branchGroups.get(key);
    if (baseGroup.length !== 1 || branchGroup?.length !== 1) continue;
    const baseEdge = baseGroup[0];
    const branchEdge = branchGroup[0];
    if (!baseEdge.resolvedModulePath || !branchEdge.resolvedModulePath) continue;
    if (baseEdge.resolvedModulePath === branchEdge.resolvedModulePath) continue;
    if (isWholeFileMove(fileMoveRenames, branch, baseEdge.resolvedModulePath, branchEdge.resolvedModulePath)) continue;
    classifications.push(importedSymbolMoveClassification(graphDelta, branch, baseEdge, branchEdge));
  }
  return classifications;
}

function classifyExportedSymbolMoves(graphDelta, branch, fileMoveRenames) {
  const baseGroups = exportedSymbolsGroupedBy(graphDelta, 'base');
  const branchGroups = exportedSymbolsGroupedBy(graphDelta, branch);
  const classifications = [];
  for (const [key, baseGroup] of baseGroups) {
    const branchGroup = branchGroups.get(key);
    if (baseGroup.length !== 1) continue;
    const baseSymbol = baseGroup[0];
    if ((branchGroup?.length ?? 0) > 1) {
      const fromPath = symbolSourcePath(baseSymbol);
      if (branchGroup.some((symbol) => symbolSourcePath(symbol) !== fromPath)) {
        classifications.push(duplicateExportedSymbolMoveClassification(graphDelta, branch, baseSymbol, branchGroup));
      }
      continue;
    }
    if (branchGroup?.length !== 1) continue;
    const branchSymbol = branchGroup[0];
    const fromPath = symbolSourcePath(baseSymbol);
    const toPath = symbolSourcePath(branchSymbol);
    if (!fromPath || !toPath || fromPath === toPath) continue;
    if (isWholeFileMove(fileMoveRenames, branch, fromPath, toPath)) continue;
    classifications.push(exportedSymbolMoveClassification(graphDelta, branch, baseSymbol, branchSymbol));
  }
  return classifications;
}

function importedSymbolMoveClassification(graphDelta, branch, baseEdge, branchEdge) {
  const symbolName = importTargetName(baseEdge);
  const code = `project-${branch}-imported-symbol-move-blocked`;
  const sourcePaths = uniqueStrings([baseEdge.sourcePath, baseEdge.resolvedModulePath, branchEdge.resolvedModulePath]);
  return {
    kind: 'imported-symbol-move',
    branch,
    code,
    operation: `blocked-${branch}-imported-symbol-move`,
    sourcePaths,
    pathRoles: pathRoles(sourcePaths, {
      [baseEdge.sourcePath]: 'importer',
      [baseEdge.resolvedModulePath]: 'base-export-source',
      [branchEdge.resolvedModulePath]: 'branch-export-source'
    }),
    details: compactRecord({
      reasonCode: code,
      conflictKey: stableKey(['project-imported-symbol-move', branch, baseEdge.sourcePath, baseEdge.resolvedModulePath, branchEdge.resolvedModulePath, symbolName]),
      branch,
      movementKind: 'symbol-move-between-files',
      symbolMoveKind: 'imported',
      symbolName,
      importerSourcePath: baseEdge.sourcePath,
      fromSourcePath: baseEdge.resolvedModulePath,
      toSourcePath: branchEdge.resolvedModulePath,
      baseModuleSpecifier: baseEdge.moduleSpecifier,
      branchModuleSpecifier: branchEdge.moduleSpecifier,
      baseImportedName: baseEdge.importedName,
      branchImportedName: branchEdge.importedName,
      baseLocalName: baseEdge.localName,
      branchLocalName: branchEdge.localName,
      baseTargetSymbolId: baseEdge.resolvedTargetSymbolId,
      branchTargetSymbolId: branchEdge.resolvedTargetSymbolId,
      requiredEvidence: symbolMoveRequiredEvidence,
      graphEvidence: importedGraphEvidence(graphDelta, branch, baseEdge, branchEdge)
    })
  };
}

function exportedSymbolMoveClassification(graphDelta, branch, baseSymbol, branchSymbol) {
  const fromPath = symbolSourcePath(baseSymbol);
  const toPath = symbolSourcePath(branchSymbol);
  const symbolName = String(baseSymbol.name ?? branchSymbol.name);
  const code = `project-${branch}-exported-symbol-move-blocked`;
  const sourcePaths = uniqueStrings([fromPath, toPath]);
  return {
    kind: 'exported-symbol-move',
    branch,
    code,
    operation: `blocked-${branch}-exported-symbol-move`,
    sourcePaths,
    pathRoles: pathRoles(sourcePaths, { [fromPath]: 'base-export-source', [toPath]: 'branch-export-source' }),
    details: compactRecord({
      reasonCode: code,
      conflictKey: stableKey(['project-exported-symbol-move', branch, fromPath, toPath, symbolName, baseSymbol.signatureHash]),
      branch,
      movementKind: 'symbol-move-between-files',
      symbolMoveKind: 'exported',
      symbolName,
      exportedName: symbolName,
      fromSourcePath: fromPath,
      toSourcePath: toPath,
      baseSymbolId: baseSymbol.id,
      branchSymbolId: branchSymbol.id,
      signatureHash: baseSymbol.signatureHash,
      requiredEvidence: symbolMoveRequiredEvidence,
      graphEvidence: exportedGraphEvidence(graphDelta, branch, baseSymbol, branchSymbol)
    })
  };
}

function importedGraphEvidence(graphDelta, branch, baseEdge, branchEdge) {
  return compactRecord({
    stageSummaries: stageSummaries(graphDelta),
    base: {
      importer: sourceEvidence(graphDelta, 'base', baseEdge.sourcePath),
      target: sourceEvidence(graphDelta, 'base', baseEdge.resolvedModulePath),
      importEdge: importEdgeEvidence(baseEdge)
    },
    [branch]: {
      importer: sourceEvidence(graphDelta, branch, branchEdge.sourcePath),
      target: sourceEvidence(graphDelta, branch, branchEdge.resolvedModulePath),
      importEdge: importEdgeEvidence(branchEdge)
    }
  });
}

function exportedGraphEvidence(graphDelta, branch, baseSymbol, branchSymbol) {
  return compactRecord({
    stageSummaries: stageSummaries(graphDelta),
    base: {
      source: sourceEvidence(graphDelta, 'base', symbolSourcePath(baseSymbol)),
      symbol: symbolEvidence(baseSymbol)
    },
    [branch]: {
      source: sourceEvidence(graphDelta, branch, symbolSourcePath(branchSymbol)),
      symbol: symbolEvidence(branchSymbol)
    }
  });
}

function classificationGraphDelta(input, files, projectId) {
  try {
    return createJsTsProjectSafeMergeGraphDelta(input, files, [], `${projectId}_symbol_move_classifier`);
  } catch {
    return undefined;
  }
}

function sourceEvidence(graphDelta, stageName, sourcePath) {
  const stage = graphDelta.stages?.[stageName];
  const graph = stage?.projectSymbolGraph;
  if (!graph || !sourcePath) return undefined;
  return compactRecord({
    sourcePath,
    fileHash: graph.fileHashes?.find((record) => record.sourcePath === sourcePath),
    importEdges: (graph.importEdges ?? []).filter((edge) => edge.sourcePath === sourcePath || edge.resolvedModulePath === sourcePath).map(importEdgeEvidence)
  });
}

function importEdgesGroupedBy(graph) {
  const groups = new Map();
  for (const edge of namedImportEdges(graph)) {
    const key = stableKey(['imported-symbol-move', edge.sourcePath, importTargetName(edge), edge.localName, edge.importKind, edge.isTypeOnly]);
    const entries = groups.get(key) ?? [];
    entries.push(edge);
    groups.set(key, entries);
  }
  return groups;
}

function exportedSymbolsGroupedBy(graphDelta, stageName) {
  const groups = new Map();
  for (const symbol of exportedSymbols(graphDelta, stageName)) {
    const key = stableKey(['exported-symbol-move', symbol.language, symbol.name, symbol.signatureHash]);
    if (!key) continue;
    const entries = groups.get(key) ?? [];
    entries.push(symbol);
    groups.set(key, entries);
  }
  return groups;
}

function namedImportEdges(graph) {
  return (graph?.importEdges ?? []).filter((edge) => edge?.sourcePath
    && edge.resolvedModulePath
    && edge.resolvedTargetSymbolId
    && importTargetName(edge));
}

function exportedSymbols(graphDelta, stageName) {
  return (graphDelta.stages?.[stageName]?.projectImport?.semanticIndex?.symbols ?? [])
    .filter((symbol) => symbol?.kind === 'export' && symbolSourcePath(symbol) && symbol.name);
}

function importTargetName(edge) {
  if (edge?.importKind === 'side-effect' || edge?.importKind === 'namespace') return undefined;
  const name = edge?.importedName ?? edge?.localName ?? edge?.exportedName;
  return name && name !== '*' ? String(name) : undefined;
}

function symbolSourcePath(symbol) {
  return symbol?.definitionSpan?.path ?? symbol?.metadata?.sourcePath;
}

function importEdgeEvidence(edge) {
  return compactRecord({
    id: edge.id,
    sourcePath: edge.sourcePath,
    moduleSpecifier: edge.moduleSpecifier,
    importKind: edge.importKind,
    importedName: edge.importedName,
    localName: edge.localName,
    isTypeOnly: edge.isTypeOnly,
    resolutionKind: edge.resolutionKind,
    resolvedModulePath: edge.resolvedModulePath,
    resolvedTargetSymbolId: edge.resolvedTargetSymbolId
  });
}

function symbolEvidence(symbol) {
  return compactRecord({
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    language: symbol.language,
    signatureHash: symbol.signatureHash,
    definitionSpan: symbol.definitionSpan
  });
}

function stageSummaries(graphDelta) {
  return compactRecord({
    base: graphDelta.stages?.base?.summary,
    worker: graphDelta.stages?.worker?.summary,
    head: graphDelta.stages?.head?.summary
  });
}

function hasSymbolMoveSignal(files) {
  return files.some((file) => branchText(file, 'worker') !== file.baseSourceText || branchText(file, 'head') !== file.baseSourceText);
}

function branchText(file, branch) {
  if (branch === 'worker' && file.workerDeleted) return undefined;
  if (branch === 'head' && file.headDeleted) return undefined;
  return branch === 'worker' ? file.workerSourceText ?? file.baseSourceText : file.headSourceText ?? file.baseSourceText;
}

function isWholeFileMove(fileMoveRenames, branch, fromPath, toPath) {
  return fileMoveRenames.some((item) => item.branch === branch
    && item.details?.fromSourcePath === fromPath
    && item.details?.toSourcePath === toPath);
}

function pathRoles(sourcePaths, roles) {
  return Object.fromEntries(sourcePaths.map((sourcePath) => [sourcePath, roles[sourcePath]]));
}

function uniqueClassifications(classifications) {
  const result = [];
  const seen = new Set();
  for (const classification of classifications) {
    const key = classification.details?.conflictKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(classification);
  }
  return result;
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { classifyProjectSymbolMoves };
