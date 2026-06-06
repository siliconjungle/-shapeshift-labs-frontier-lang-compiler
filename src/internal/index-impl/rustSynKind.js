import{normalizeRustSynKind}from'./normalizeRustSynKind.js';import{rustSynWrapperKind}from'./rustSynWrapperKind.js';
export function rustSynKind(node) {
  const declared = node?._type ?? node?.type ?? node?.kind ?? node?.nodeType ?? node?.synKind;
  if (typeof declared === 'string') return normalizeRustSynKind(declared);
  const wrapper = rustSynWrapperKind(node);
  if (wrapper) return normalizeRustSynKind(wrapper);
  if (Array.isArray(node?.items)) return 'File';
  if (node?.sig && node?.block) return 'ItemFn';
  if (node?.ident && node?.fields && Array.isArray(node?.variants)) return 'ItemEnum';
  if (node?.ident && node?.fields) return 'ItemStruct';
  if (node?.ident && Array.isArray(node?.items)) return 'ItemMod';
  if (node?.trait_ || node?.self_ty || node?.selfType) return 'ItemImpl';
  if (node?.path && (node?.tree || node?.trees)) return 'ItemUse';
  return undefined;
}
