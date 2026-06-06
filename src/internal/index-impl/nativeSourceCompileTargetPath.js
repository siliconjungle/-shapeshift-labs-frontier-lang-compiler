import{nativeSourceCompileTargetExtension}from'./nativeSourceCompileTargetExtension.js';
export function nativeSourceCompileTargetPath(input) {
  if (input.targetPath) return input.targetPath;
  const sourcePath = input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath;
  if (!sourcePath) return undefined;
  const targetExt = nativeSourceCompileTargetExtension(input.target);
  if (!targetExt) return sourcePath;
  return sourcePath.replace(/(\.[^./\\]+)?$/, targetExt);
}
