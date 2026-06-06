import{javaAstDeclarationName}from'./javaAstDeclarationName.js';
export function javaLombokAnnotationMarker(node, kind) {
  if (kind !== 'Annotation') return false;
  const name = javaAstDeclarationName(node);
  return Boolean(name && /^(lombok\.|Data$|Value$|Builder$|Getter$|Setter$|AllArgsConstructor$|NoArgsConstructor$|RequiredArgsConstructor$)/.test(name));
}
