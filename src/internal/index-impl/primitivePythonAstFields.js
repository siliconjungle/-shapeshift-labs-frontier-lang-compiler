import{pythonAliasName}from'./pythonAliasName.js';import{pythonAstLiteralValue}from'./pythonAstLiteralValue.js';
export function primitivePythonAstFields(node, kind) {
  const fields = { kind };
  for (const key of ['name', 'id', 'arg', 'module', 'level', 'attr', 'asname', 'type_comment']) {
    if (typeof node[key] === 'string' || typeof node[key] === 'number' || typeof node[key] === 'boolean' || node[key] === null) {
      fields[key] = node[key];
    }
  }
  if (Array.isArray(node.names)) {
    fields.names = node.names
      .map((entry) => pythonAliasName(entry))
      .filter(Boolean)
      .join(',');
  }
  const literal = pythonAstLiteralValue(node);
  if (literal !== undefined) fields.literal = literal;
  return fields;
}
