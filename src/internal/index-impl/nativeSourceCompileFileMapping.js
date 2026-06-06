import{idFragment}from'../../native-import-utils.js';
import{nativeSourceCompileFullGeneratedSpan}from'./nativeSourceCompileFullGeneratedSpan.js';
export function nativeSourceCompileFileMapping(input) {
  const rootSpan = input.importResult.nativeAst?.nodes?.[input.importResult.nativeAst?.rootId]?.span
    ?? input.importResult.nativeSource?.ast?.nodes?.[input.importResult.nativeSource?.ast?.rootId]?.span
    ?? input.projection.declarations?.find((declaration) => declaration.sourceSpan)?.sourceSpan;
  return {
    id: `compile_map_${idFragment(input.compileResultId ?? input.id)}_file`,
    nativeSourceId: input.importResult.nativeSource?.id,
    sourceSpan: rootSpan,
    generatedSpan: nativeSourceCompileFullGeneratedSpan(input),
    target: input.target,
    evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
    precision: input.projection.mode === 'preserved-source' && input.outputHash === input.projection.sourceHash ? 'line' : 'estimated',
    preservation: input.losses?.some((loss) => loss.severity === 'error') ? 'blocked' : 'estimated',
    metadata: {
      compileResultId: input.compileResultId,
      sourceMapOrigin: 'file-fallback'
    }
  };
}
