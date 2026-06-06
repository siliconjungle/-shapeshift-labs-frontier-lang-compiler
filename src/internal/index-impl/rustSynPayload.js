import{rustSynWrapperKind}from'./rustSynWrapperKind.js';
export function rustSynPayload(node) {
  if (!node || typeof node !== 'object') return node;
  const wrapper = rustSynWrapperKind(node);
  return wrapper ? node[wrapper] : node;
}
