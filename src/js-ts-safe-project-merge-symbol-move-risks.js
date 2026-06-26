import { compactRecord } from './js-ts-safe-merge-context.js';

const symbolMoveRequiredEvidence = [
  'symbol-lineage-evidence',
  'import-export-rewrite-evidence',
  'output-diagnostics-gate',
  'output-declaration-gate'
];

function classifySymbolMoveRisks(graphDelta, branch, exportedSymbolMoves) {
  const branchGraph = graphDelta.stages?.[branch]?.projectSymbolGraph;
  if (!branchGraph) return [];
  const classifications = [];
  for (const move of exportedSymbolMoves) {
    const fromPath = move.details?.fromSourcePath;
    const toPath = move.details?.toSourcePath;
    const symbolName = move.details?.symbolName;
    if (!fromPath || !toPath || !symbolName) continue;
    const staleEdges = namedImportReferenceEdges(branchGraph).filter((edge) => (
      importTargetName(edge) === symbolName
      && modulePathMatches(edge.resolvedModulePath, fromPath)
      && !modulePathMatches(edge.resolvedModulePath, toPath)
    ));
    if (staleEdges.length) classifications.push(staleImportedSymbolMoveClassification(graphDelta, branch, move, staleEdges));
  }
  return classifications;
}

function duplicateExportedSymbolMoveClassification(graphDelta, branch, baseSymbol, branchSymbols) {
  const fromPath = symbolSourcePath(baseSymbol);
  const candidateSourcePaths = uniqueStrings(branchSymbols.map(symbolSourcePath));
  const symbolName = String(baseSymbol.name ?? branchSymbols[0]?.name);
  const code = `project-${branch}-exported-symbol-move-duplicate-export-blocked`;
  const sourcePaths = uniqueStrings([fromPath, ...candidateSourcePaths]);
  return {
    kind: 'duplicate-exported-symbol-move',
    branch,
    code,
    operation: `blocked-${branch}-exported-symbol-move`,
    sourcePaths,
    pathRoles: Object.fromEntries(sourcePaths.map((sourcePath) => [
      sourcePath,
      sourcePath === fromPath ? 'base-export-source' : 'duplicate-export-source'
    ])),
    details: compactRecord({
      reasonCode: code,
      conflictKey: stableKey(['project-exported-symbol-move-duplicate-export', branch, fromPath, candidateSourcePaths.join('|'), symbolName, baseSymbol.signatureHash]),
      branch,
      movementKind: 'symbol-move-between-files',
      symbolMoveKind: 'exported',
      ambiguityKind: 'duplicate-export',
      symbolName,
      exportedName: symbolName,
      fromSourcePath: fromPath,
      candidateSourcePaths,
      duplicateExportCount: branchSymbols.length,
      baseSymbolId: baseSymbol.id,
      branchSymbolIds: uniqueStrings(branchSymbols.map((symbol) => symbol.id)),
      signatureHash: baseSymbol.signatureHash,
      requiredEvidence: symbolMoveRequiredEvidence,
      graphEvidence: duplicateExportedGraphEvidence(graphDelta, branch, baseSymbol, branchSymbols)
    })
  };
}

function staleImportedSymbolMoveClassification(graphDelta, branch, exportedMove, staleEdges) {
  const symbolName = exportedMove.details?.symbolName;
  const fromPath = exportedMove.details?.fromSourcePath;
  const toPath = exportedMove.details?.toSourcePath;
  const code = `project-${branch}-imported-symbol-move-stale-import-blocked`;
  const sourcePaths = uniqueStrings([fromPath, toPath, ...staleEdges.map((edge) => edge.sourcePath)]);
  return {
    kind: 'stale-imported-symbol-move',
    branch,
    code,
    operation: `blocked-${branch}-imported-symbol-move`,
    sourcePaths,
    pathRoles: pathRoles(sourcePaths, {
      [fromPath]: 'base-export-source',
      [toPath]: 'branch-export-source',
      ...Object.fromEntries(staleEdges.map((edge) => [edge.sourcePath, edge.importKind === 'reexport' ? 'stale-re-exporter' : 'stale-importer']))
    }),
    details: compactRecord({
      reasonCode: code,
      conflictKey: stableKey(['project-imported-symbol-move-stale-import', branch, fromPath, toPath, symbolName, ...staleEdges.map((edge) => `${edge.sourcePath}:${edge.moduleSpecifier}`)]),
      branch,
      movementKind: 'symbol-move-between-files',
      symbolMoveKind: 'imported',
      ambiguityKind: 'stale-import-reference',
      symbolName,
      importerSourcePaths: uniqueStrings(staleEdges.map((edge) => edge.sourcePath)),
      fromSourcePath: fromPath,
      toSourcePath: toPath,
      staleImportCount: staleEdges.length,
      staleImports: staleEdges.map(importEdgeEvidence),
      baseSymbolMoveConflictKey: exportedMove.details?.conflictKey,
      requiredEvidence: symbolMoveRequiredEvidence,
      graphEvidence: staleImportGraphEvidence(graphDelta, branch, exportedMove, staleEdges)
    })
  };
}

function duplicateExportedGraphEvidence(graphDelta, branch, baseSymbol, branchSymbols) {
  return compactRecord({
    stageSummaries: stageSummaries(graphDelta),
    base: {
      source: sourceEvidence(graphDelta, 'base', symbolSourcePath(baseSymbol)),
      symbol: symbolEvidence(baseSymbol)
    },
    [branch]: {
      sources: uniqueStrings(branchSymbols.map(symbolSourcePath)).map((sourcePath) => sourceEvidence(graphDelta, branch, sourcePath)),
      symbols: branchSymbols.map(symbolEvidence)
    }
  });
}

function staleImportGraphEvidence(graphDelta, branch, exportedMove, staleEdges) {
  return compactRecord({
    stageSummaries: stageSummaries(graphDelta),
    base: {
      source: sourceEvidence(graphDelta, 'base', exportedMove.details?.fromSourcePath),
      symbolMove: exportedMove.details
    },
    [branch]: {
      source: sourceEvidence(graphDelta, branch, exportedMove.details?.toSourcePath),
      staleImporters: uniqueStrings(staleEdges.map((edge) => edge.sourcePath)).map((sourcePath) => sourceEvidence(graphDelta, branch, sourcePath)),
      staleImports: staleEdges.map(importEdgeEvidence)
    }
  });
}

function sourceEvidence(graphDelta, stageName, sourcePath) {
  const graph = graphDelta.stages?.[stageName]?.projectSymbolGraph;
  if (!graph || !sourcePath) return undefined;
  return compactRecord({
    sourcePath,
    fileHash: graph.fileHashes?.find((record) => record.sourcePath === sourcePath),
    importEdges: (graph.importEdges ?? []).filter((edge) => edge.sourcePath === sourcePath || edge.resolvedModulePath === sourcePath).map(importEdgeEvidence)
  });
}

function namedImportReferenceEdges(graph) {
  return (graph?.importEdges ?? []).filter((edge) => edge?.sourcePath
    && edge.resolvedModulePath
    && importTargetName(edge));
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

function pathRoles(sourcePaths, roles) {
  return Object.fromEntries(sourcePaths.map((sourcePath) => [sourcePath, roles[sourcePath]]));
}

function modulePathMatches(left, right) {
  return normalizeModulePath(left) === normalizeModulePath(right);
}

function normalizeModulePath(sourcePath) {
  return String(sourcePath ?? '').replace(/\.(?:c|m)?(?:j|t)sx?$/u, '');
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

export { classifySymbolMoveRisks, duplicateExportedSymbolMoveClassification };
