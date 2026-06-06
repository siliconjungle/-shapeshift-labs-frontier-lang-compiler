export function uniqueSemanticSliceNativeNodes(nodes) {
  const seen = new Set();
  const result = [];
  for (const node of nodes ?? []) {
    const id = node?.id ?? node?.nodeId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push({ ...node, id });
  }
  return result;
}
