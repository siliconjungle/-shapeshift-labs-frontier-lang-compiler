import{javaAstDeclarationName}from'./javaAstDeclarationName.js';import{javaAstName}from'./javaAstName.js';
export function javaGeneratedCodeMarker(node, kind) {
  if (node.generated || node.Generated || node.isGenerated) return true;
  if (kind === 'Annotation') {
    const name = javaAstDeclarationName(node);
    if (name && /(^|\.)(Generated|GeneratedValue)$/.test(name)) return true;
  }
  const annotations = node.annotations ?? node.modifiers?.annotations ?? node.modifiers;
  if (Array.isArray(annotations)) {
    return annotations.some((annotation) => {
      const name = javaAstDeclarationName(annotation) ?? javaAstName(annotation);
      return Boolean(name && /(^|\.)(Generated|GeneratedValue)$/.test(name));
    });
  }
  return false;
}
