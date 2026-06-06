import{csharpGeneratedSourcePath}from'./csharpGeneratedSourcePath.js';import{csharpRoslynDeclarationName}from'./csharpRoslynDeclarationName.js';
export function csharpGeneratedCodeMarker(node, kind) {
  if (node.generated || node.Generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  if (csharpGeneratedSourcePath(path)) return true;
  if (kind === 'Attribute') {
    const name = csharpRoslynDeclarationName(node);
    if (name && /(^|\.)(GeneratedCode|CompilerGenerated|DebuggerNonUserCode)Attribute?$/.test(name)) return true;
  }
  const attributes = node.attributeLists ?? node.attributes;
  if (Array.isArray(attributes)) {
    return JSON.stringify(attributes).includes('GeneratedCode')
      || JSON.stringify(attributes).includes('CompilerGenerated');
  }
  return false;
}
