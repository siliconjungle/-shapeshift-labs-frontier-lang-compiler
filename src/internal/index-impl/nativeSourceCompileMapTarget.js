export function nativeSourceCompileMapTarget(input, targetPath) {
  return {
    language: input.target,
    emitPath: targetPath
  };
}
