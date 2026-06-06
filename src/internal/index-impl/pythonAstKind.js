export function pythonAstKind(node) {
  return node?._type ?? node?.type ?? node?.kind ?? node?.nodeType;
}
