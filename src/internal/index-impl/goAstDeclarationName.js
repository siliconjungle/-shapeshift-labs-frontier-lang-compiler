import{goAstIdentName}from'./goAstIdentName.js';
export function goAstDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return goAstIdentName(node.Name ?? node.name)
    ?? goAstIdentName(node.Ident ?? node.ident)
    ?? goAstIdentName(node.Sel ?? node.sel)
    ?? (typeof node.Name === 'string' ? node.Name : undefined)
    ?? (typeof node.name === 'string' ? node.name : undefined);
}
