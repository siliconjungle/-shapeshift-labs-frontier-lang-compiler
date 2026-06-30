export function rustRecordBody(sourceText, record) {
  const start = record.bodySpan?.startOffset;
  const end = record.bodySpan?.endOffset;
  if (typeof start === 'number' && typeof end === 'number' && end > start) {
    return { text: sourceText.slice(start, end), span: record.bodySpan };
  }
  const fallback = fallbackBodySpan(sourceText, record);
  return fallback ? { text: sourceText.slice(fallback.startOffset, fallback.endOffset), span: fallback } : { text: '', span: record.bodySpan };
}

export function rustRecordSignature(sourceText, record) {
  const start = record.sourceSpan?.startOffset ?? 0;
  const bodyStart = record.bodySpan?.startOffset ?? record.sourceSpan?.endOffset ?? sourceText.length;
  return sourceText.slice(start, bodyStart);
}

export function rustStatementSpan(statement, bundle, record) {
  const startOffset = (statement.bodyStartOffset ?? record.bodySpan?.startOffset ?? 0) + statement.offset;
  return {
    path: bundle.sourcePath,
    startOffset,
    endOffset: startOffset + statement.text.length,
    startLine: statement.line,
    endLine: statement.line
  };
}

export function rustLineAt(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function fallbackBodySpan(sourceText, record) {
  const searchStart = record.sourceSpan?.startOffset ?? 0;
  const open = sourceText.indexOf('{', searchStart);
  if (open < 0) return undefined;
  let depth = 0;
  for (let index = open; index < sourceText.length; index += 1) {
    if (sourceText[index] === '{') depth += 1;
    else if (sourceText[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          path: record.sourceSpan?.path,
          startOffset: open + 1,
          endOffset: index,
          startLine: rustLineAt(sourceText, open),
          endLine: rustLineAt(sourceText, index)
        };
      }
    }
  }
  return undefined;
}
