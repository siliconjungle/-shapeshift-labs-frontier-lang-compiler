import{rustSynIdentName}from'./rustSynIdentName.js';import{rustSynLiteralValue}from'./rustSynLiteralValue.js';import{rustSynPathName}from'./rustSynPathName.js';
export function rustSynNodeValue(node) {
  return rustSynIdentName(node.ident ?? node.name ?? node.sig?.ident)
    ?? rustSynPathName(node.path ?? node.trait_ ?? node.self_ty ?? node.selfType ?? node.ty)
    ?? rustSynLiteralValue(node);
}
