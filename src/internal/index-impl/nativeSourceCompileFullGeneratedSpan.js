export function nativeSourceCompileFullGeneratedSpan(input, generatedName) {
  const lines = String(input.output ?? '').split(/\r?\n/);
  const lastLine = lines.at(-1) ?? '';
  return {
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    startLine: 1,
    startColumn: 1,
    endLine: Math.max(1, lines.length),
    endColumn: Math.max(1, lastLine.length + 1),
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}
