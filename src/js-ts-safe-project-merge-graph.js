import { idFragment } from './native-import-utils.js';
import { createNativeProjectImportResult } from './internal/index-impl/createNativeProjectImportResult.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';

function createJsTsProjectSafeMergeGraphArtifacts(input, outputFiles, mergeId) {
  const sources = outputFiles.map((file) => ({
    id: `${mergeId}_output_${idFragment(file.sourcePath)}`,
    language: file.language ?? input.language ?? languageForPath(file.sourcePath),
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    sourceHash: file.sourceHash,
    metadata: { semanticImportExpected: true, projectSafeMergeOutput: true }
  }));
  const suppliedImports = normalizeOutputProjectImports(input.outputProjectImports);
  const importSelections = sources.map((source) => {
    const suppliedImport = matchingOutputProjectImport(source, suppliedImports);
    return {
      importResult: suppliedImport ?? importNativeSource(source),
      sourceKind: suppliedImport ? 'supplied-output-project-import' : 'lightweight-output-project-scan'
    };
  });
  const imports = importSelections.map((selection) => selection.importResult);
  const projectImport = createNativeProjectImportResult({
    id: `${mergeId}_output_project_import`,
    projectRoot: input.projectRoot,
    moduleResolution: input.moduleResolution ?? input.tsconfig,
    sources,
    metadata: {
      projectSafeMergeId: mergeId,
      outputProjectSymbolGraph: true,
      outputProjectImportSource: {
        suppliedImports: suppliedImports.length,
        matchedSuppliedImports: importSelections.filter((selection) => selection.sourceKind === 'supplied-output-project-import').length,
        scannerFallbackImports: importSelections.filter((selection) => selection.sourceKind === 'lightweight-output-project-scan').length
      }
    }
  }, imports);
  return {
    projectImport,
    projectSymbolGraph: projectImport.projectSymbolGraph
  };
}

function normalizeOutputProjectImports(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof Map) return [...value.values()].filter(Boolean);
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
}

function matchingOutputProjectImport(source, imports) {
  const sourcePath = String(source.sourcePath ?? '');
  const sourceHash = String(source.sourceHash ?? '');
  return imports.find((importResult) => {
    const importSourcePath = sourcePathForImport(importResult);
    if (importSourcePath && sourcePath && importSourcePath !== sourcePath) return false;
    const importSourceHash = sourceHashForImport(importResult);
    if (importSourceHash && sourceHash && importSourceHash !== sourceHash) return false;
    return importSourcePath === sourcePath || importSourceHash === sourceHash;
  });
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

export { createJsTsProjectSafeMergeGraphArtifacts };
