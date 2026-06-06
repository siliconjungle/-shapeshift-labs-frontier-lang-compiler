import{normalizeGoAstKind}from'./normalizeGoAstKind.js';
export function goAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.astKind;
  if (typeof declared === 'string') return normalizeGoAstKind(declared);
  if (Array.isArray(node.Decls) || Array.isArray(node.decls)) return 'File';
  if (node.Files || node.files) return 'Package';
  if (node.Name && node.Type && (node.Body || node.Recv !== undefined || node.recv !== undefined)) return 'FuncDecl';
  if (node.Tok && (node.Specs || node.specs)) return 'GenDecl';
  if (node.Path && (node.Name !== undefined || node.EndPos !== undefined)) return 'ImportSpec';
  if (node.Names && node.Type !== undefined) return 'ValueSpec';
  if (node.Name && node.Type !== undefined) return 'TypeSpec';
  if (node.List && (node.Opening !== undefined || node.Closing !== undefined)) return 'FieldList';
  return undefined;
}
