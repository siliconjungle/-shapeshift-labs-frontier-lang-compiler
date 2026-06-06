import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';import{rustSynIdentName}from'./rustSynIdentName.js';import{rustSynImplName}from'./rustSynImplName.js';import{rustSynMacroKind}from'./rustSynMacroKind.js';import{rustSynUseName}from'./rustSynUseName.js';
export function rustSynDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'ItemUse' || kind === 'UseTree' || kind === 'UsePath' || kind === 'UseName') {
    const name = rustSynUseName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ItemFn' || kind === 'ForeignItemFn') {
    const name = rustSynIdentName(node.sig?.ident ?? node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'function', 'definition');
  }
  if (kind === 'ImplItemFn' || kind === 'TraitItemFn') {
    const name = rustSynIdentName(node.sig?.ident ?? node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'method', 'definition');
  }
  if (kind === 'ItemStruct' || kind === 'ItemUnion') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'class', 'definition');
  }
  if (kind === 'ItemEnum' || kind === 'ItemTrait' || kind === 'ItemType') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (kind === 'ItemMod') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'definition');
  }
  if (kind === 'ItemConst' || kind === 'ItemStatic') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  if (kind === 'ItemImpl') {
    const name = rustSynImplName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (rustSynMacroKind(kind)) {
    const name = rustSynIdentName(node.ident ?? node.mac?.path ?? node.path);
    if (name) return declarationRecord(input, nativeNodeId, name, 'macro', 'definition');
  }
  return undefined;
}
