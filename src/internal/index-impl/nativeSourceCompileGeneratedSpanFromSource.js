import{nativeSourceCompileFullGeneratedSpan}from'./nativeSourceCompileFullGeneratedSpan.js';
export function nativeSourceCompileGeneratedSpanFromSource(sourceSpan, input, generatedName) {
  if (!sourceSpan) return nativeSourceCompileFullGeneratedSpan(input, generatedName);
  return {
    ...sourceSpan,
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}
