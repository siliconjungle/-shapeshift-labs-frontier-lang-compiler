import{pythonAstLiteralValue}from'./pythonAstLiteralValue.js';
export function pythonAstNodeValue(node) {
  return node.name ?? node.id ?? node.arg ?? node.module ?? pythonAstLiteralValue(node);
}
