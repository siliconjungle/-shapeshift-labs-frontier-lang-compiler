import{spanFromLspRange}from'./spanFromLspRange.js';import{spanFromScipOccurrence}from'./spanFromScipOccurrence.js';
export function normalizeExternalSpan(value, sourcePath, sourceHash) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return spanFromScipOccurrence({ range: value }, sourcePath, sourceHash);
  }
  if (value.start || value.end || value.line !== undefined) return spanFromLspRange(value, sourcePath, sourceHash, 0);
  if (value.startLine !== undefined || value.start_line !== undefined) {
    return {
      sourceId: value.sourceId ?? sourceHash,
      path: value.path ?? sourcePath,
      start: value.start,
      end: value.end,
      startLine: Number(value.startLine ?? value.start_line),
      startColumn: value.startColumn ?? value.start_character,
      endLine: value.endLine ?? value.end_line,
      endColumn: value.endColumn ?? value.end_character
    };
  }
  return undefined;
}
