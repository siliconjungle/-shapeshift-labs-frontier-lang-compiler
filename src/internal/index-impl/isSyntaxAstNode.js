export function isSyntaxAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof (value.type ?? value.kind) === 'string');
}
