import{kotlinPsiName}from'./kotlinPsiName.js';
export function kotlinPsiPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  const value = node.packageFqName ?? node.fqName ?? node.qualifiedName ?? node.packageName;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return kotlinPsiName(value);
  return undefined;
}
