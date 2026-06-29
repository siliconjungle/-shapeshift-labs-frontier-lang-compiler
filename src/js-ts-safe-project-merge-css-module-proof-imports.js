import { cssModuleGeneratedClassNameMapProof } from './js-ts-safe-project-merge-css-module-generated-map.js';
import { cssModuleSourceMapIdentityProof } from './js-ts-safe-project-merge-css-module-source-map.js';
import { importNativeSource } from './internal/index-impl/importNativeSource.js';

function cssModuleProofImport(input, file) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  const generatedClassNameMapProof = cssModuleGeneratedClassNameMapProof(mergeOptions);
  const bundlerTransformHash = firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash);
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath: file.sourcePath,
    generatedClassNameMapHash: generatedClassNameMapProof.generatedClassNameMapHash,
    bundlerTransformHash,
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.sourceText,
    sourceHash: file.sourceHash,
    metadata: {
      generatedClassNameMap: generatedClassNameMapProof.generatedClassNameMap,
      generatedClassNameMapHash: generatedClassNameMapProof.generatedClassNameMapHash,
      cssModuleCompositionGraphHash: mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: mergeOptions.icssGraphHash,
      bundlerTransformHash,
      sourceMapProofHash: sourceMapIdentityProof.sourceMapProofHash,
      sourceMapIdentityProof: cssModuleSourceMapProofRecord(mergeOptions),
      sourceMapIdentityProofStatus: sourceMapIdentityProof.status,
      sourceMapIdentityProofReasonCodes: sourceMapIdentityProof.reasonCodes
    }
  });
}

function cssModuleOutputProjectImport(evidence, file, input) {
  const mergeOptions = cssMergeOptionsForProjectFile(input, file.sourcePath);
  const graph = evidence.graphsByPath?.get(file.sourcePath);
  const proof = file.result?.cssModuleContractProofs?.[0] ?? file.result?.admission?.cssModuleContractProofs?.[0];
  const generatedClassNameMapProof = cssModuleGeneratedClassNameMapProof(mergeOptions);
  const bundlerTransformHash = firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash);
  const sourceMapIdentityProof = cssModuleSourceMapIdentityProof(mergeOptions, {
    sourcePath: file.sourcePath,
    sourceHash: file.outputHash,
    outputSourceHash: file.outputHash,
    generatedClassNameMapHash: proof?.generatedClassNameMapHash ?? generatedClassNameMapProof.generatedClassNameMapHash,
    bundlerTransformHash,
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    ...cssModuleSourceMapProofContext(mergeOptions)
  });
  return importNativeSource({
    language: 'css',
    sourcePath: file.sourcePath,
    sourceText: file.outputSourceText,
    sourceHash: file.outputHash,
    metadata: {
      generatedClassNameMap: generatedClassNameMapProof.generatedClassNameMap,
      generatedClassNameMapHash: generatedClassNameMapProof.status === 'hash-mismatch'
        ? undefined
        : proof?.generatedClassNameMapHash ?? generatedClassNameMapProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: proof?.jsTsUseSiteGraphHash ?? graph?.jsTsUseSiteGraphHash,
      cssModuleCompositionGraphHash: proof?.cssModuleCompositionGraphHash ?? mergeOptions.cssModuleCompositionGraphHash,
      icssGraphHash: proof?.icssGraphHash ?? mergeOptions.icssGraphHash,
      bundlerTransformHash,
      sourceMapProofHash: sourceMapIdentityProof.sourceMapProofHash,
      sourceMapIdentityProof: cssModuleSourceMapProofRecord(mergeOptions),
      sourceMapIdentityProofStatus: sourceMapIdentityProof.status,
      sourceMapIdentityProofReasonCodes: sourceMapIdentityProof.reasonCodes
    }
  });
}

function normalizeProjectImports(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof Map) return [...value.values()].filter(Boolean);
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
}

function cssMergeOptionsForProjectFile(input, sourcePath) {
  const byPath = input.cssMergeOptionsByPath ?? input.styleMergeOptionsByPath;
  return {
    ...(input.cssMergeOptions ?? input.styleMergeOptions),
    ...(byPath?.[sourcePath] ?? {})
  };
}

function cssModuleSourceMapProofContext(mergeOptions) {
  return {
    loaderRequestHash: firstString(mergeOptions.loaderRequestHash, mergeOptions.cssModuleLoaderRequestHash),
    loaderQueryHash: firstString(mergeOptions.loaderQueryHash, mergeOptions.cssModuleLoaderQueryHash),
    sourceMapArtifactHash: firstString(mergeOptions.sourceMapArtifactHash, mergeOptions.cssModuleSourceMapArtifactHash, mergeOptions.cssModuleSourceMapHash),
    sourcesContentHash: firstString(mergeOptions.sourcesContentHash, mergeOptions.sourceMapSourcesContentHash, mergeOptions.cssModuleSourceMapSourcesContentHash)
  };
}

function cssModuleSourceMapProofRecord(mergeOptions) {
  return firstObject(
    mergeOptions.cssModuleSourceMapIdentityProof,
    mergeOptions.sourceMapIdentityProof,
    mergeOptions.cssModuleSourceMapProof,
    mergeOptions.sourceMapProof
  );
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value));
}

export { cssMergeOptionsForProjectFile, cssModuleOutputProjectImport, cssModuleProofImport, cssModuleSourceMapProofContext, normalizeProjectImports };
