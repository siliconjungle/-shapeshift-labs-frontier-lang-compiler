export function uniqueNativeProjectionDeclarations(declarations) {
  const seen = new Set();
  return declarations.filter((declaration) => {
    const key = `${declaration.kind}:${declaration.name}:${declaration.symbolId ?? declaration.nativeAstNodeId ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
