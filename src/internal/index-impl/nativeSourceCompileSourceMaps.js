import{commonGeneratedTargetPath}from'../../native-import-utils.js';import{createSourceMapRecord}from'@shapeshift-labs/frontier-lang-kernel';
import{nativeSourceCompileDeclarationMappings}from'./nativeSourceCompileDeclarationMappings.js';import{nativeSourceCompileFileMapping}from'./nativeSourceCompileFileMapping.js';import{nativeSourceCompileMapTarget}from'./nativeSourceCompileMapTarget.js';import{nativeSourceCompilePreservedMappings}from'./nativeSourceCompilePreservedMappings.js';import{nativeSourceCompileTargetPath}from'./nativeSourceCompileTargetPath.js';
export function nativeSourceCompileSourceMaps(input) {
  const adapterSourceMaps = input.targetProjection?.sourceMaps ?? [];
  if (adapterSourceMaps.length) return adapterSourceMaps;
  const targetPath = nativeSourceCompileTargetPath(input);
  const targetHash = input.targetHash ?? input.outputHash;
  const target = nativeSourceCompileMapTarget(input, targetPath);
  const mappings = input.projection.mode === 'preserved-source'
    ? nativeSourceCompilePreservedMappings({ ...input, targetPath, targetHash, target })
    : nativeSourceCompileDeclarationMappings({ ...input, targetPath, targetHash, target });
  const resolvedMappings = mappings.length
    ? mappings
    : [nativeSourceCompileFileMapping({ ...input, targetPath, targetHash, target })];
  return [createSourceMapRecord({
    id: input.id,
    sourcePath: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
    sourceHash: input.importResult.nativeSource?.sourceHash ?? input.importResult.nativeAst?.sourceHash ?? input.importResult.sourceHash,
    target,
    targetPath: targetPath ?? commonGeneratedTargetPath(resolvedMappings),
    targetHash,
    semanticIndexId: input.importResult.semanticIndex?.id ?? input.importResult.universalAst?.semanticIndex?.id,
    universalAstId: input.importResult.universalAst?.id,
    nativeAstId: input.importResult.nativeAst?.id ?? input.importResult.nativeSource?.ast?.id,
    nativeSourceId: input.importResult.nativeSource?.id,
    mappings: resolvedMappings,
    evidence: input.evidence ?? [],
    metadata: {
      compileResultId: input.compileResultId,
      importId: input.importResult.id,
      projectionId: input.projection.id,
      targetProjectionId: input.targetProjection?.id,
      targetProjectionAdapterId: input.targetProjection?.adapter?.id,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      outputMode: input.outputMode,
      outputHash: input.outputHash,
      generatedBy: 'compileNativeSource'
    }
  })];
}
