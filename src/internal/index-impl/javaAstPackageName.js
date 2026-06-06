import{javaAstName}from'./javaAstName.js';
export function javaAstPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return javaAstName(node.packageName ?? node.packageDeclaration ?? node.package ?? node.name);
}
