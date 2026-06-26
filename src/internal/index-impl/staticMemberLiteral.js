function readStaticMemberLiteral(sourceText, start, limit) {
  const quote = sourceText[start];
  if (quote === '\'' || quote === '"') return readQuotedMemberLiteral(sourceText, start, limit, quote);
  if (quote === '`') return readTemplateMemberLiteral(sourceText, start, limit);
  return undefined;
}

function readQuotedMemberLiteral(sourceText, start, limit, quote) {
  let value = '';
  for (let index = start + 1; index < limit; index += 1) {
    const char = sourceText[index];
    if (char === '\\' || char === '\n' || char === '\r') return undefined;
    if (char === quote) return { value, start: start + 1, end: index, literalKind: 'string-literal' };
    value += char;
  }
  return undefined;
}

function readTemplateMemberLiteral(sourceText, start, limit) {
  let value = '';
  for (let index = start + 1; index < limit; index += 1) {
    const char = sourceText[index];
    if (char === '\\' || char === '\n' || char === '\r') return undefined;
    if (char === '$' && sourceText[index + 1] === '{') return undefined;
    if (char === '`') return { value, start: start + 1, end: index, literalKind: 'static-template-literal' };
    value += char;
  }
  return undefined;
}

export { readStaticMemberLiteral };
