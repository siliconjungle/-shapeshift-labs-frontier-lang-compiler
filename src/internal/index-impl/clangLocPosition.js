export function clangLocPosition(loc) {
  if (!loc || typeof loc !== 'object') return undefined;
  const expanded = loc.expansionLoc ?? loc.spellingLoc ?? loc;
  const line = expanded.line ?? expanded.startLine ?? expanded.begin?.line;
  const column = expanded.col ?? expanded.column ?? expanded.startColumn ?? expanded.begin?.col ?? expanded.begin?.column;
  if (typeof line !== 'number') return undefined;
  return {
    path: expanded.file ?? expanded.filename ?? expanded.path,
    line,
    column: typeof column === 'number' ? column : undefined
  };
}
