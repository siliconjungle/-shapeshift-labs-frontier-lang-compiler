export function csharpRoslynHasBody(node) {
  return Boolean(node.body || node.expressionBody || node.accessorList || Array.isArray(node.statements));
}
