import{isCSharpRoslynNode}from'./isCSharpRoslynNode.js';
export function csharpRoslynRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isCSharpRoslynNode(value)) return value;
  if (isCSharpRoslynNode(value.ast)) return value.ast;
  if (isCSharpRoslynNode(value.root)) return value.root;
  if (isCSharpRoslynNode(value.rootNode)) return value.rootNode;
  if (isCSharpRoslynNode(value.compilationUnit)) return value.compilationUnit;
  if (isCSharpRoslynNode(value.syntaxTree)) return csharpRoslynRoot(value.syntaxTree);
  if (isCSharpRoslynNode(value.tree)) return csharpRoslynRoot(value.tree);
  if (Array.isArray(value.members) || Array.isArray(value.usings) || Array.isArray(value.externs)) {
    return { kind: 'CompilationUnit', ...value };
  }
  return undefined;
}
