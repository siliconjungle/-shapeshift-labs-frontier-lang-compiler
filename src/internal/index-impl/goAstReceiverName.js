import{goAstTypeName}from'./goAstTypeName.js';
export function goAstReceiverName(node) {
  const recv = node?.Recv ?? node?.recv;
  const list = recv?.List ?? recv?.list;
  if (!Array.isArray(list) || !list.length) return undefined;
  const first = list[0];
  return goAstTypeName(first?.Type ?? first?.type);
}
