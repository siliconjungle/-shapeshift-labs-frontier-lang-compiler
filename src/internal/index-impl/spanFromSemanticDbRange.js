export function spanFromSemanticDbRange(range, sourcePath, sourceHash) {
  if (!range) return undefined;
  return {
    sourceId: sourceHash,
    path: sourcePath,
    startLine: Number(range.start_line ?? range.startLine ?? 0) + 1,
    startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
    endLine: Number(range.end_line ?? range.endLine ?? 0) + 1,
    endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
  };
}
