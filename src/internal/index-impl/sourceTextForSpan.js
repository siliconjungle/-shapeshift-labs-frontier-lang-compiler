import { spanOffsets } from './semanticEditSourceRanges.js';

export function sourceTextForSpan(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  const range = spanOffsets(sourceText, span);
  return range ? sourceText.slice(range.start, range.end) : undefined;
}
