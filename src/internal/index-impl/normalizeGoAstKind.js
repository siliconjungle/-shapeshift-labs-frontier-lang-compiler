export function normalizeGoAstKind(kind) {
  const text = String(kind).replace(/^(?:ast\.)?\*/, '').replace(/^(?:go\/ast\.)/, '');
  if (/^file$/i.test(text)) return 'File';
  if (/^package$/i.test(text)) return 'Package';
  if (/^funcdecl$/i.test(text) || /^func_decl$/i.test(text)) return 'FuncDecl';
  if (/^gendecl$/i.test(text) || /^gen_decl$/i.test(text)) return 'GenDecl';
  if (/^importspec$/i.test(text) || /^import_spec$/i.test(text)) return 'ImportSpec';
  if (/^typespec$/i.test(text) || /^type_spec$/i.test(text)) return 'TypeSpec';
  if (/^valuespec$/i.test(text) || /^value_spec$/i.test(text)) return 'ValueSpec';
  if (/^structtype$/i.test(text) || /^struct_type$/i.test(text)) return 'StructType';
  if (/^interfacetype$/i.test(text) || /^interface_type$/i.test(text)) return 'InterfaceType';
  if (/^fieldlist$/i.test(text) || /^field_list$/i.test(text)) return 'FieldList';
  return text;
}
