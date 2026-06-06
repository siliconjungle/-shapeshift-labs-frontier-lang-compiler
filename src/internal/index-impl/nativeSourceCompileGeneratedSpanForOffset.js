import{lineColumnForOffset}from'./lineColumnForOffset.js';
export function nativeSourceCompileGeneratedSpanForOffset(input, offset, length, generatedName) {
  const start = lineColumnForOffset(input.output, offset);
  const end = lineColumnForOffset(input.output, offset + Math.max(1, length));
  return {
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end.line,
    endColumn: end.column,
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}
