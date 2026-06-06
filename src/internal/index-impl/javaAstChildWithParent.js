import{isJavaAstNode}from'./isJavaAstNode.js';
export function javaAstChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isJavaAstNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}
