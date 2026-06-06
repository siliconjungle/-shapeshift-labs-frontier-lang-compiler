import{ignoredRustSynField}from'./ignoredRustSynField.js';
export function rustSynWrapperKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const keys = Object.keys(node).filter((key) => !ignoredRustSynField(key));
  if (keys.length !== 1) return undefined;
  const key = keys[0];
  const value = node[key];
  if (!value || typeof value !== 'object') return undefined;
  if (/^(?:Fn|Struct|Enum|Trait|Impl|Use|Mod|Type|Const|Static|Union|Macro)$/.test(key)) return key;
  if (/^(?:Item|ImplItem|TraitItem|ForeignItem)/.test(key)) return key;
  return undefined;
}
