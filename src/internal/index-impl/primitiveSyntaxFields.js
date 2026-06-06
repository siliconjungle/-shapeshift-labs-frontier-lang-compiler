import{literalSyntaxValue}from'./literalSyntaxValue.js';
export function primitiveSyntaxFields(node) {
  const fields = {};
  for (const key of ['name', 'operator', 'sourceType', 'async', 'generator', 'computed', 'static', 'exportKind', 'importKind', 'optional']) {
    if (typeof node[key] === 'string' || typeof node[key] === 'number' || typeof node[key] === 'boolean' || node[key] === null) {
      fields[key] = node[key];
    }
  }
  const literal = literalSyntaxValue(node);
  if (literal !== undefined) fields.literal = literal;
  if (node.source && typeof node.source === 'object' && typeof node.source.value === 'string') fields.source = node.source.value;
  return fields;
}
