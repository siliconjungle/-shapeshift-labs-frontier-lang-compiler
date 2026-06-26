import { idFragment } from './native-import-utils.js';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { augmentProjectSymbolGraphPublicContracts } from './js-ts-safe-project-merge-public-contracts.js';
import { createNativeProjectImportResult } from './internal/index-impl/createNativeProjectImportResult.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';
import {
  normalizeProjectGraphLimits,
  projectGraphEdgeLimitConflicts,
  projectGraphSerializedLimitConflict,
  projectGraphSourceLimitConflicts,
  projectGraphSourceStats
} from './js-ts-safe-project-merge-graph-limits.js';

function createJsTsProjectSafeMergeGraphArtifacts(input, outputFiles, mergeId) {
  return createProjectGraphStageArtifacts(input, outputFiles, mergeId, 'output', projectImportsForStage(input, 'output'));
}

function createJsTsProjectSafeMergeGraphDelta(input, files, outputFiles, mergeId) {
  const stageFiles = projectGraphDeltaStageFiles(files, outputFiles, input);
  const stages = {};
  for (const stageName of ['base', 'worker', 'head', 'output']) {
    const files = stageFiles?.[stageName];
    if (!Array.isArray(files)) continue;
    stages[stageName] = createProjectGraphStageArtifacts(input, files, mergeId, stageName, projectImportsForStage(input, stageName));
  }
  const stageSummaries = Object.fromEntries(Object.entries(stages).map(([stageName, artifacts]) => [stageName, artifacts.summary]));
  return {
    kind: 'frontier.lang.jsTsProjectGraphDelta',
    version: 1,
    stages,
    summary: {
      stages: Object.keys(stages).length,
      sourceFiles: sumStageSummary(stageSummaries, 'sourceFiles'),
      sourceFileRecords: sumStageSummary(stageSummaries, 'sourceFileRecords'),
      sourceSpanRecords: sumStageSummary(stageSummaries, 'sourceSpanRecords'),
      publicContractRegions: sumStageSummary(stageSummaries, 'publicContractRegions'),
      reExportIdentities: sumStageSummary(stageSummaries, 'reExportIdentities'),
      moduleDeclarationRecords: sumStageSummary(stageSummaries, 'moduleDeclarationRecords'),
      exportAssignmentRecords: sumStageSummary(stageSummaries, 'exportAssignmentRecords'),
      importEdges: sumStageSummary(stageSummaries, 'importEdges'),
      exportEdges: sumStageSummary(stageSummaries, 'exportEdges'),
      compilerSymbolRecords: sumStageSummary(stageSummaries, 'compilerSymbolRecords'),
      compilerTypeRecords: sumStageSummary(stageSummaries, 'compilerTypeRecords'),
      runtimeRegionRecords: sumStageSummary(stageSummaries, 'runtimeRegionRecords'),
      scopeBindingRecords: sumStageSummary(stageSummaries, 'scopeBindingRecords'),
      scopeReferenceRecords: sumStageSummary(stageSummaries, 'scopeReferenceRecords'),
      jsxElementRecords: sumStageSummary(stageSummaries, 'jsxElementRecords'),
      jsxPropRecords: sumStageSummary(stageSummaries, 'jsxPropRecords'),
      unresolvedImportEdges: sumStageSummary(stageSummaries, 'unresolvedImportEdges'),
      suppliedImports: sumStageSummary(stageSummaries, 'suppliedImports'),
      matchedSuppliedImports: sumStageSummary(stageSummaries, 'matchedSuppliedImports'),
      scannerFallbackImports: sumStageSummary(stageSummaries, 'scannerFallbackImports'),
      sourceBytes: sumStageSummary(stageSummaries, 'sourceBytes'),
      serializedBytes: sumStageSummary(stageSummaries, 'serializedBytes'),
      limitConflicts: sumStageSummary(stageSummaries, 'limitConflicts'),
      stageSummaries
    }
  };
}

function createProjectGraphStageArtifacts(input, files, mergeId, stageName, stageImports) {
  const limits = normalizeProjectGraphLimits(input.projectGraphLimits);
  const sourceStats = projectGraphSourceStats(files);
  const sourceLimitConflicts = projectGraphSourceLimitConflicts(limits, stageName, sourceStats);
  const suppliedImports = normalizeProjectImports(stageImports);
  const projectGraphImportSource = {
    stage: stageName,
    suppliedImports: suppliedImports.length,
    matchedSuppliedImports: 0,
    scannerFallbackImports: 0
  };
  if (sourceLimitConflicts.length) {
    return limitedProjectGraphStage(stageName, projectGraphImportSource, sourceStats, undefined, sourceLimitConflicts);
  }
  const sources = files.map((file) => ({
    id: `${mergeId}_${stageName}_${idFragment(file.sourcePath)}`,
    language: file.language ?? input.language ?? languageForPath(file.sourcePath),
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    sourceHash: file.sourceHash,
    parserTriviaEvidence: file.parserTriviaEvidence,
    metadata: { semanticImportExpected: true, projectSafeMergeStage: stageName, projectSafeMergeOutput: stageName === 'output' }
  }));
  const importSelections = sources.map((source) => {
    const suppliedImport = matchingProjectImport(source, suppliedImports);
    return {
      importResult: suppliedImport ?? importNativeSource(source),
      sourceKind: suppliedImport ? `supplied-${stageName}-project-import` : `lightweight-${stageName}-project-scan`
    };
  });
  const imports = importSelections.map((selection) => selection.importResult);
  projectGraphImportSource.matchedSuppliedImports = importSelections.filter((selection) => selection.sourceKind === `supplied-${stageName}-project-import`).length;
  projectGraphImportSource.scannerFallbackImports = importSelections.filter((selection) => selection.sourceKind === `lightweight-${stageName}-project-scan`).length;
  const projectImport = createNativeProjectImportResult({
    id: `${mergeId}_${stageName}_project_import`,
    projectRoot: input.projectRoot,
    moduleResolution: input.moduleResolution ?? input.tsconfig,
    sources,
    metadata: {
      projectSafeMergeId: mergeId,
      projectGraphStage: stageName,
      outputProjectSymbolGraph: stageName === 'output',
      projectGraphImportSource,
      ...(stageName === 'output' ? { outputProjectImportSource: projectGraphImportSource } : {})
    }
  }, imports);
  const projectSymbolGraph = augmentProjectSymbolGraphPublicContracts(projectImport.projectSymbolGraph, files, input, stageName);
  const stageProjectImport = projectSymbolGraph === projectImport.projectSymbolGraph
    ? projectImport
    : attachProjectSymbolGraph(projectImport, projectSymbolGraph);
  const edgeLimitConflicts = projectGraphEdgeLimitConflicts(limits, stageName, projectSymbolGraph);
  const serialized = projectGraphSerializedLimitConflict(limits, stageName, {
    projectImport: stageProjectImport,
    projectSymbolGraph
  });
  const limitConflicts = [...edgeLimitConflicts, serialized.conflict].filter(Boolean);
  if (limitConflicts.length) {
    return limitedProjectGraphStage(stageName, projectGraphImportSource, sourceStats, projectSymbolGraph, limitConflicts, serialized.serializedBytes);
  }
  return {
    kind: 'frontier.lang.jsTsProjectGraphStage',
    version: 1,
    stage: stageName,
    projectImport: stageProjectImport,
    projectSymbolGraph,
    summary: projectGraphStageSummary(stageName, projectSymbolGraph, projectGraphImportSource, sourceStats, serialized.serializedBytes, [])
  };
}

function limitedProjectGraphStage(stageName, importSource, sourceStats, projectSymbolGraph, limitConflicts, serializedBytes) {
  return {
    kind: 'frontier.lang.jsTsProjectGraphStage',
    version: 1,
    stage: stageName,
    summary: projectGraphStageSummary(stageName, projectSymbolGraph, importSource, sourceStats, serializedBytes, limitConflicts),
    limitConflicts
  };
}

function normalizeProjectImports(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof Map) return [...value.values()].filter(Boolean);
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
}

function projectImportsForStage(input, stageName) {
  if (stageName === 'output') return input.outputProjectImports ?? input.projectGraphImports?.output;
  if (stageName === 'base') return input.baseProjectImports ?? input.projectGraphImports?.base;
  if (stageName === 'worker') return input.workerProjectImports ?? input.projectGraphImports?.worker;
  if (stageName === 'head') return input.headProjectImports ?? input.projectGraphImports?.head;
  return input.projectGraphImports?.[stageName];
}

function matchingProjectImport(source, imports) {
  const sourcePath = String(source.sourcePath ?? '');
  const sourceHash = String(source.sourceHash ?? '');
  return imports.find((importResult) => {
    const importSourcePath = sourcePathForImport(importResult);
    if (importSourcePath && sourcePath && importSourcePath !== sourcePath) return false;
    const importSourceHash = sourceHashForImport(importResult);
    if (sourceHash && importSourceHash !== sourceHash) return false;
    if (importSourceHash && sourceHash && importSourceHash !== sourceHash) return false;
    return importSourcePath === sourcePath || importSourceHash === sourceHash;
  });
}

function projectGraphStageSummary(stageName, projectSymbolGraph, importSource, sourceStats, serializedBytes, limitConflicts) {
  const importEdges = Array.isArray(projectSymbolGraph?.importEdges) ? projectSymbolGraph.importEdges : [];
  return {
    stage: stageName,
    sourceFiles: projectSymbolGraph?.sourceCount ?? sourceStats.sourceFiles,
    sourceBytes: sourceStats.sourceBytes,
    documents: projectSymbolGraph?.documentCount ?? 0,
    symbols: projectSymbolGraph?.symbolCount ?? 0,
    fileHashes: projectSymbolGraph?.fileHashes?.length ?? 0,
    sourceFileRecords: projectSymbolGraph?.sourceFileRecords?.length ?? 0,
    sourceSpanRecords: projectSymbolGraph?.sourceSpanRecords?.length ?? 0,
    importEdges: importEdges.length,
    exportEdges: projectSymbolGraph?.exportEdges?.length ?? 0,
    publicContractRegions: projectSymbolGraph?.publicContractRegions?.length ?? 0,
    compilerSymbolRecords: projectSymbolGraph?.compilerSymbolRecords?.length ?? 0,
    compilerTypeRecords: projectSymbolGraph?.compilerTypeRecords?.length ?? 0,
    runtimeRegionRecords: projectSymbolGraph?.runtimeRegionRecords?.length ?? 0,
    scopeBindingRecords: projectSymbolGraph?.scopeBindingRecords?.length ?? 0,
    scopeReferenceRecords: projectSymbolGraph?.scopeReferenceRecords?.length ?? 0,
    jsxElementRecords: projectSymbolGraph?.jsxElementRecords?.length ?? 0,
    jsxPropRecords: projectSymbolGraph?.jsxPropRecords?.length ?? 0,
    reExportIdentities: projectSymbolGraph?.reExportIdentities?.length ?? 0,
    moduleDeclarationRecords: projectSymbolGraph?.moduleDeclarationRecords?.length ?? 0,
    exportAssignmentRecords: projectSymbolGraph?.exportAssignmentRecords?.length ?? 0,
    unresolvedImportEdges: importEdges.filter(isMissingProjectImportEdge).length,
    suppliedImports: importSource.suppliedImports,
    matchedSuppliedImports: importSource.matchedSuppliedImports,
    scannerFallbackImports: importSource.scannerFallbackImports,
    serializedBytes,
    limitConflicts: limitConflicts.length
  };
}

function isMissingProjectImportEdge(edge) {
  return typeof edge?.resolutionKind === 'string' && edge.resolutionKind.endsWith('-missing');
}

function sumStageSummary(stageSummaries, field) {
  return Object.values(stageSummaries).reduce((total, summary) => total + Number(summary?.[field] ?? 0), 0);
}

function projectGraphDeltaStageFiles(files, outputFiles, input) {
  return {
    base: files
      .map((file) => stageFile(file, file.baseSourceText, input, 'base'))
      .filter(Boolean),
    worker: files
      .map((file) => stageFile(file, workerStageSourceText(file), input, 'worker'))
      .filter(Boolean),
    head: files
      .map((file) => stageFile(file, headStageSourceText(file), input, 'head'))
      .filter(Boolean),
    output: outputFiles
  };
}

function workerStageSourceText(file) {
  if (file.workerDeleted) return undefined;
  return file.workerSourceText ?? file.baseSourceText;
}

function headStageSourceText(file) {
  if (file.headDeleted) return undefined;
  return file.headSourceText ?? file.baseSourceText;
}

function stageFile(file, sourceText, input, stageName) {
  if (typeof sourceText !== 'string' || !file.sourcePath) return undefined;
  return compactRecord({
    sourcePath: file.sourcePath,
    language: file.language ?? input.language,
    sourceText,
    sourceHash: hashText(sourceText),
    parserTriviaEvidence: parserTriviaEvidenceForStage(file, stageName)
  });
}

function parserTriviaEvidenceForStage(file, stageName) {
  if (stageName === 'base') return file.baseParserTriviaEvidence ?? file.parserTriviaEvidence;
  if (stageName === 'worker') return file.workerParserTriviaEvidence ?? file.parserTriviaEvidence;
  if (stageName === 'head') return file.headParserTriviaEvidence ?? file.parserTriviaEvidence;
  if (stageName === 'output') return file.outputParserTriviaEvidence ?? file.parserTriviaEvidence;
  return file.parserTriviaEvidence;
}

function attachProjectSymbolGraph(projectImport, projectSymbolGraph) {
  return {
    ...projectImport,
    projectSymbolGraph,
    semanticIndex: projectImport.semanticIndex ? {
      ...projectImport.semanticIndex,
      metadata: {
        ...projectImport.semanticIndex.metadata,
        projectSymbolGraph
      }
    } : projectImport.semanticIndex,
    metadata: {
      ...projectImport.metadata,
      projectSymbolGraph
    }
  };
}

function hashText(sourceText) {
  return hashSemanticValue(sourceText);
}

function sourcePathForImport(importResult) {
  return firstString(
    importResult?.sourcePath,
    importResult?.nativeSource?.sourcePath,
    importResult?.nativeAst?.sourcePath,
    importResult?.semanticIndex?.documents?.[0]?.path
  );
}

function sourceHashForImport(importResult) {
  return firstString(
    importResult?.sourceHash,
    importResult?.nativeSource?.sourceHash,
    importResult?.nativeAst?.sourceHash,
    importResult?.semanticIndex?.documents?.[0]?.sourceHash
  );
}

function languageForPath(sourcePath) {
  const path = String(sourcePath ?? '').toLowerCase();
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return 'typescript';
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}

export { createJsTsProjectSafeMergeGraphArtifacts, createJsTsProjectSafeMergeGraphDelta };
