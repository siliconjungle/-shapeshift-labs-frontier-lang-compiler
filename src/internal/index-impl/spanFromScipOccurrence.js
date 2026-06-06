export function spanFromScipOccurrence(occurrence, sourcePath, sourceHash) {
  if (occurrence.single_line_range || occurrence.singleLineRange) {
    const range = occurrence.single_line_range ?? occurrence.singleLineRange;
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: Number(range.line ?? 0) + 1,
      startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
      endLine: Number(range.line ?? 0) + 1,
      endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
    };
  }
  if (occurrence.multi_line_range || occurrence.multiLineRange) {
    const range = occurrence.multi_line_range ?? occurrence.multiLineRange;
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: Number(range.start_line ?? range.startLine ?? 0) + 1,
      startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
      endLine: Number(range.end_line ?? range.endLine ?? 0) + 1,
      endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
    };
  }
  const range = occurrence.range;
  if (Array.isArray(range) && range.length >= 3) {
    const startLine = Number(range[0] ?? 0);
    const startColumn = Number(range[1] ?? 0);
    const endLine = range.length >= 4 ? Number(range[2] ?? startLine) : startLine;
    const endColumn = range.length >= 4 ? Number(range[3] ?? startColumn) : Number(range[2] ?? startColumn);
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: startLine + 1,
      startColumn: startColumn + 1,
      endLine: endLine + 1,
      endColumn: endColumn + 1
    };
  }
  return undefined;
}
