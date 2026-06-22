import { idFragment } from './native-import-utils.js';
import { createNativeProjectImportResult } from './internal/index-impl/createNativeProjectImportResult.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';

function createJsTsProjectSafeMergeGraphArtifacts(input, outputFiles, mergeId) {
  const sources = outputFiles.map((file) => ({
    id: `${mergeId}_output_${idFragment(file.sourcePath)}`,
    language: file.language ?? input.language ?? languageForPath(file.sourcePath),
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    metadata: { semanticImportExpected: true, projectSafeMergeOutput: true }
  }));
  const imports = sources.map((source) => importNativeSource(source));
  const projectImport = createNativeProjectImportResult({
    id: `${mergeId}_output_project_import`,
    projectRoot: input.projectRoot,
    sources,
    metadata: {
      projectSafeMergeId: mergeId,
      outputProjectSymbolGraph: true
    }
  }, imports);
  return {
    projectImport,
    projectSymbolGraph: projectImport.projectSymbolGraph
  };
}

function languageForPath(sourcePath) {
  const path = String(sourcePath ?? '').toLowerCase();
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return 'typescript';
}

export { createJsTsProjectSafeMergeGraphArtifacts };
