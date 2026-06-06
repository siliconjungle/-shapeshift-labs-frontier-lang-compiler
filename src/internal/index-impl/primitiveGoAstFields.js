import{goAstDeclarationName}from'./goAstDeclarationName.js';import{goAstIdentName}from'./goAstIdentName.js';import{goAstImportPath}from'./goAstImportPath.js';import{goAstReceiverName}from'./goAstReceiverName.js';import{goAstTokenName}from'./goAstTokenName.js';import{goAstTypeName}from'./goAstTypeName.js';
export function primitiveGoAstFields(node, kind) {
  const fields = { kind };
  const name = goAstDeclarationName(node);
  if (name) fields.name = name;
  const type = goAstTypeName(node.Type ?? node.type);
  if (type) fields.type = type;
  const tok = goAstTokenName(node.Tok ?? node.tok);
  if (tok) fields.token = tok;
  const importPath = goAstImportPath(node);
  if (importPath) fields.importPath = importPath;
  const receiver = goAstReceiverName(node);
  if (receiver) fields.receiver = receiver;
  for (const key of ['Incomplete', 'Doc', 'Comment']) {
    const value = node[key] ?? node[key[0].toLowerCase() + key.slice(1)];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key[0].toLowerCase() + key.slice(1)] = value;
  }
  if (Array.isArray(node.Names ?? node.names)) {
    fields.names = (node.Names ?? node.names).map(goAstIdentName).filter(Boolean).join(',');
  }
  return fields;
}
