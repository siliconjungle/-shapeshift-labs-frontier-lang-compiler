import{javaAstName}from'./javaAstName.js';
export function javaAstImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const candidate = node.qualifiedIdentifier ?? node.qualifiedName ?? node.path ?? node.name ?? node.identifier;
  const path = javaAstName(candidate);
  if (!path) return undefined;
  return node.asterisk || node.wildcard || node.onDemand || node.isAsterisk ? `${path.replace(/\.\*$/, '')}.*` : path;
}
