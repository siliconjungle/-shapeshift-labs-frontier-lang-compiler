export function sourceTextForSpan(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  if (typeof span.start === 'number' && typeof span.end === 'number' && span.end >= span.start) {
    return sourceText.slice(span.start, span.end);
  }
  if (typeof span.startLine === 'number') {
    const lines = sourceText.split(/\r?\n/);
    const endLine = typeof span.endLine === 'number' && span.endLine >= span.startLine ? span.endLine : span.startLine;
    return lines.slice(span.startLine - 1, endLine).join('\n');
  }
  return undefined;
}
