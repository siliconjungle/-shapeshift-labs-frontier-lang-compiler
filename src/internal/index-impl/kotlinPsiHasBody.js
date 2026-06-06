export function kotlinPsiHasBody(node) {
  return Boolean(node.bodyExpression || node.bodyBlockExpression || node.body || Array.isArray(node.statements));
}
