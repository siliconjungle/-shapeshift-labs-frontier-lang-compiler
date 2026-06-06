export function javaAstHasBody(node) {
  return Boolean(node.body || node.block || node.statements || node.defaultValue || Array.isArray(node.bodyDeclarations));
}
