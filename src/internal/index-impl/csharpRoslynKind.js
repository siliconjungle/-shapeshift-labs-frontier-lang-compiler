import{normalizeCSharpRoslynKind}from'./normalizeCSharpRoslynKind.js';
export function csharpRoslynKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.Kind ?? node._type ?? node.type ?? node.nodeType ?? node.syntaxKind ?? node.SyntaxKind;
  if (typeof declared === 'string') return normalizeCSharpRoslynKind(declared);
  if (Array.isArray(node.members) || Array.isArray(node.usings) || Array.isArray(node.externs)) return 'CompilationUnit';
  if (node.identifier && (node.members || node.baseList || node.parameterList || node.modifiers)) return 'ClassDeclaration';
  if (node.declaration && (node.eventKeyword || node.eventField)) return 'EventFieldDeclaration';
  if (node.declaration && Array.isArray(node.declaration.variables)) return 'FieldDeclaration';
  return undefined;
}
