export function spanFromLoc(loc, input) {
  if (!loc?.start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath ?? loc.filename,
    startLine: loc.start.line,
    startColumn: typeof loc.start.column === 'number' ? loc.start.column + 1 : undefined,
    endLine: loc.end?.line,
    endColumn: typeof loc.end?.column === 'number' ? loc.end.column + 1 : undefined
  };
}
