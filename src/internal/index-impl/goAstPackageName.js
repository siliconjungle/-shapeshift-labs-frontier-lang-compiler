import{goAstIdentName}from'./goAstIdentName.js';
export function goAstPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return goAstIdentName(node.Name ?? node.name) ?? node.PackageName ?? node.packageName;
}
