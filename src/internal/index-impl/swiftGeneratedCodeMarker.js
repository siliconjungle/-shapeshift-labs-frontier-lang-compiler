import{swiftGeneratedSourcePath}from'./swiftGeneratedSourcePath.js';import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';
export function swiftGeneratedCodeMarker(node, kind) {
  if (node.generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  if (swiftGeneratedSourcePath(path)) return true;
  if (kind === 'Attribute') {
    const name = swiftSyntaxDeclarationName(node);
    if (name && /(^|\.)(Generated|CompilerGenerated|_spi)Attribute?$/.test(name)) return true;
  }
  return false;
}
