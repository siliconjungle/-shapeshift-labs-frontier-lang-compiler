import{swiftSyntaxDeclarationName}from'./swiftSyntaxDeclarationName.js';import{swiftSyntaxPatternName}from'./swiftSyntaxPatternName.js';
export function swiftSyntaxVariableNames(node) {
  const bindings = node.bindings ?? node.bindingSpecifier?.bindings ?? node.patternBindings;
  if (Array.isArray(bindings)) return bindings.map((binding) => swiftSyntaxPatternName(binding.pattern ?? binding)).filter(Boolean);
  const name = swiftSyntaxPatternName(node.pattern) ?? swiftSyntaxDeclarationName(node);
  return name ? [name] : [];
}
