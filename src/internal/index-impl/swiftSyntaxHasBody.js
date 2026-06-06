export function swiftSyntaxHasBody(node) {
  return Boolean(node.body || node.accessorBlock || node.memberBlock || Array.isArray(node.statements));
}
