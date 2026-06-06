import{javaAstName}from'./javaAstName.js';
export function javaAstTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.typeName === 'string') return value.typeName;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (value.elementType) {
    const inner = javaAstTypeName(value.elementType);
    return inner ? `${inner}[]` : '[]';
  }
  if (value.componentType) {
    const inner = javaAstTypeName(value.componentType);
    return inner ? `${inner}[]` : '[]';
  }
  if (Array.isArray(value.typeArguments)) {
    const base = javaAstName(value.name) ?? javaAstName(value);
    const args = value.typeArguments.map(javaAstTypeName).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return javaAstName(value);
}
