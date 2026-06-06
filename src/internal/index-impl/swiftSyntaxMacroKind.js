export function swiftSyntaxMacroKind(kind) {
  return /Macro/i.test(String(kind));
}
