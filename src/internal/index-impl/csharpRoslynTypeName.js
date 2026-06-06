import{csharpRoslynName}from'./csharpRoslynName.js';
export function csharpRoslynTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.valueText === 'string') return value.valueText;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (value.elementType) {
    const inner = csharpRoslynTypeName(value.elementType);
    return inner ? `${inner}[]` : '[]';
  }
  if (Array.isArray(value.typeArgumentList?.arguments ?? value.typeArguments)) {
    const base = csharpRoslynName(value.name) ?? csharpRoslynName(value);
    const args = (value.typeArgumentList?.arguments ?? value.typeArguments).map(csharpRoslynTypeName).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return csharpRoslynName(value);
}
