import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.importPath ?? node.path ?? node.modulePath ?? node.name;
  if (typeof path === 'string') return path;
  if (Array.isArray(path)) {
    return path.map((entry) => swiftSyntaxName(entry.name ?? entry.identifier ?? entry)).filter(Boolean).join('.');
  }
  if (path && typeof path === 'object') {
    if (Array.isArray(path.components)) return path.components.map((entry) => swiftSyntaxName(entry.name ?? entry.identifier ?? entry)).filter(Boolean).join('.');
    return swiftSyntaxName(path);
  }
  return undefined;
}
