import{kotlinGeneratedSourcePath}from'./kotlinGeneratedSourcePath.js';
export function kotlinGeneratedCodeMarker(node) {
  if (node.generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  return kotlinGeneratedSourcePath(path);
}
