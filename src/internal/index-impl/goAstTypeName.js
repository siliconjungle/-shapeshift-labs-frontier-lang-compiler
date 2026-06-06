import{goAstDeclarationName}from'./goAstDeclarationName.js';import{goAstIdentName}from'./goAstIdentName.js';import{goAstKind}from'./goAstKind.js';
export function goAstTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const kind = goAstKind(value);
  if (kind === 'Ident') return goAstIdentName(value);
  if (kind === 'StarExpr') {
    const inner = goAstTypeName(value.X ?? value.x);
    return inner ? `*${inner}` : '*';
  }
  if (kind === 'SelectorExpr') {
    const left = goAstTypeName(value.X ?? value.x);
    const right = goAstIdentName(value.Sel ?? value.sel);
    return [left, right].filter(Boolean).join('.');
  }
  if (kind === 'ArrayType') {
    const inner = goAstTypeName(value.Elt ?? value.elt);
    return `[]${inner ?? 'unknown'}`;
  }
  if (kind === 'MapType') {
    return `map[${goAstTypeName(value.Key ?? value.key) ?? 'unknown'}]${goAstTypeName(value.Value ?? value.value) ?? 'unknown'}`;
  }
  if (kind === 'StructType') return 'struct';
  if (kind === 'InterfaceType') return 'interface';
  if (kind === 'FuncType') return 'func';
  return goAstDeclarationName(value);
}
