export function goReceiverFieldCount(node) {
  const list = (node?.Recv ?? node?.recv)?.List ?? (node?.Recv ?? node?.recv)?.list;
  return Array.isArray(list) ? list.length : 0;
}
