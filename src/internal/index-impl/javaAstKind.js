import{normalizeJavaAstKind}from'./normalizeJavaAstKind.js';
export function javaAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.astKind ?? node.treeKind ?? node.nodeKind;
  if (typeof declared === 'string') return normalizeJavaAstKind(declared);
  if (Array.isArray(node.imports) || Array.isArray(node.types) || node.packageDeclaration || node.package) return 'CompilationUnit';
  if (node.name && (node.members || node.bodyDeclarations || node.extends || node.implements || node.permittedTypes)) return 'ClassDeclaration';
  if (node.name && (node.returnType || node.parameters || node.body) && (node.modifiers || node.thrownExceptions || node.throws)) return 'MethodDeclaration';
  if (node.variables || node.fragments) return 'FieldDeclaration';
  if (node.name && node.type && (node.initializer !== undefined || node.extraDimensions !== undefined)) return 'VariableDeclarator';
  return undefined;
}
