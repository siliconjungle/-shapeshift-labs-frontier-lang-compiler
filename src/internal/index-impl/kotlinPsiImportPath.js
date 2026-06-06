import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.importedFqName ?? node.importedReference ?? node.importPath ?? node.path ?? node.name;
  if (typeof path === 'string') return path;
  if (path && typeof path === 'object') return kotlinPsiName(path.fqName ?? path.name ?? path);
  return undefined;
}
