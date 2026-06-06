export function semanticSliceNativeParentMap(nativeNodes) {
  const parents = new Map();
  for (const node of nativeNodes ?? []) {
    for (const child of node.children ?? []) parents.set(child, node.id);
  }
  return parents;
}
