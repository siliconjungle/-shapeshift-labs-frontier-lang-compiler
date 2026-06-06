export function clangLocationKind(node) {
  const loc = node.loc ?? node.range?.begin;
  if (!loc || typeof loc !== 'object') return undefined;
  if (loc.expansionLoc) return 'expansionLoc';
  if (loc.spellingLoc) return 'spellingLoc';
  if (loc.includedFrom) return 'includedFrom';
  return 'clang-loc';
}
