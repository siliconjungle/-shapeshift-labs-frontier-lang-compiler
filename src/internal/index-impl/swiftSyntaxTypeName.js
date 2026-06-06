import{swiftSyntaxName}from'./swiftSyntaxName.js';
export function swiftSyntaxTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.trimmedDescription === 'string') return value.trimmedDescription;
  if (typeof value.description === 'string' && !value.description.includes('[object Object]')) return value.description.trim();
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (value.baseType) {
    const base = swiftSyntaxTypeName(value.baseType);
    return base && value.name ? `${base}.${swiftSyntaxName(value.name)}` : base;
  }
  if (value.argumentList && Array.isArray(value.argumentList)) {
    const base = swiftSyntaxName(value.name) ?? swiftSyntaxTypeName(value.baseName);
    const args = value.argumentList.map((entry) => swiftSyntaxTypeName(entry.type ?? entry)).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return swiftSyntaxName(value);
}
