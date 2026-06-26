import { identifierTokenRegExp } from './js-ts-semantic-scope-use-def-utils.js';

function maskNonCode(sourceText) {
  const text = String(sourceText ?? '');
  const chars = [...text];
  let unsupportedTemplateLiteral = false;
  const templateExpressionRanges = [];
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const next = chars[index + 1];
    if (char === '/' && next === '/') {
      index = maskUntilLineEnd(chars, index);
    } else if (char === '/' && next === '*') {
      index = maskBlockComment(chars, index);
    } else if (char === '\'' || char === '"') {
      index = maskQuotedString(chars, index, char);
    } else if (char === '`') {
      const result = maskTemplateLiteral(chars, text, index, templateExpressionRanges, templateTag(text, index));
      unsupportedTemplateLiteral ||= result.unsupported;
      index = result.index;
    }
  }
  return { code: chars.join(''), unsupportedTemplateLiteral, templateExpressionRanges };
}

function tokenize(code) {
  return [...code.matchAll(identifierTokenRegExp)]
    .map((match) => ({ value: match[0], start: match.index, end: match.index + match[0].length }));
}

function createBraceDepthIndex(code) {
  const depthAt = new Array(code.length + 1);
  let depth = 0;
  for (let index = 0; index <= code.length; index += 1) {
    depthAt[index] = depth;
    const char = code[index];
    if (char === '{') depth += 1;
    else if (char === '}') depth = Math.max(0, depth - 1);
  }
  return depthAt;
}

function isPropertyAccess(code, start) {
  let index = start - 1;
  while (index >= 0 && /\s/.test(code[index])) index -= 1;
  return code[index] === '.' || code[index] === '#';
}

function findStatementBoundary(code, start) {
  let depth = 0;
  for (let index = start; index < code.length; index += 1) {
    const char = code[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if ((char === ';' || char === '\n') && depth === 0) return index;
  }
  return code.length;
}

function nextIdentifierToken(tokens, startIndex) {
  for (let index = startIndex; index < tokens.length; index += 1) {
    if (!isDeclarationModifier(tokens[index].value)) return tokens[index];
  }
  return undefined;
}

function previousIdentifierToken(tokens, startIndex) {
  for (let index = startIndex; index >= 0; index -= 1) return tokens[index];
  return undefined;
}

function likelyTypeReference(code, tokens, index) {
  const previous = previousIdentifierToken(tokens, index - 1)?.value;
  if (previous === 'type' || previous === 'interface' || previous === 'implements' || previous === 'extends' || previous === 'as' || previous === 'satisfies') {
    return true;
  }
  const before = code.slice(Math.max(0, tokens[index].start - 4), tokens[index].start);
  return /[:<]\s*$/.test(before);
}

function hasTypeAliasAssignment(code, start) {
  for (let index = start; index < code.length; index += 1) {
    const char = code[index];
    if (char === '=') return true;
    if (char === ';' || char === '\n' || char === '{') return false;
  }
  return false;
}

function maskUntilLineEnd(chars, start) {
  let index = start;
  while (index < chars.length && chars[index] !== '\n') {
    chars[index] = ' ';
    index += 1;
  }
  return index - 1;
}

function maskBlockComment(chars, start) {
  let index = start;
  while (index < chars.length) {
    const done = chars[index] === '*' && chars[index + 1] === '/';
    if (chars[index] !== '\n') chars[index] = ' ';
    if (done) {
      chars[index + 1] = ' ';
      return index + 1;
    }
    index += 1;
  }
  return chars.length - 1;
}

function maskQuotedString(chars, start, quote) {
  let index = start;
  chars[index] = ' ';
  index += 1;
  while (index < chars.length) {
    const char = chars[index];
    if (char === '\\') {
      chars[index] = ' ';
      if (chars[index + 1] && chars[index + 1] !== '\n') chars[index + 1] = ' ';
      index += 2;
      continue;
    }
    if (char === quote) {
      chars[index] = ' ';
      return index;
    }
    if (char !== '\n') chars[index] = ' ';
    index += 1;
  }
  return chars.length - 1;
}

function maskTemplateLiteral(chars, sourceText, start, templateExpressionRanges, tag) {
  const templateContext = templateRangeContext(start, tag);
  let index = start;
  chars[index] = ' ';
  index += 1;
  while (index < chars.length) {
    const char = chars[index];
    const next = chars[index + 1];
    if (char === '\\') {
      chars[index] = ' ';
      if (chars[index + 1] && chars[index + 1] !== '\n') chars[index + 1] = ' ';
      index += 2;
      continue;
    }
    if (char === '`') {
      chars[index] = ' ';
      return { index, unsupported: false };
    }
    if (char === '$' && next === '{') {
      const expressionStart = index + 2;
      chars[index] = ' ';
      chars[index + 1] = ' ';
      const result = preserveTemplateExpression(chars, sourceText, expressionStart, templateExpressionRanges);
      if (result.unsupported) return result;
      templateExpressionRanges.push({ start: expressionStart, end: result.index, ...templateContext });
      index = result.index + 1;
      continue;
    }
    if (char !== '\n') chars[index] = ' ';
    index += 1;
  }
  return { index: chars.length - 1, unsupported: true };
}

function templateRangeContext(templateStart, tag) {
  return {
    templateStart,
    templateKind: tag ? 'tagged-template' : 'template-literal',
    templateTagText: tag?.text,
    templateTagRoot: tag?.root,
    templateTagMemberName: tag?.memberName,
    templateTagStart: tag?.start,
    templateTagEnd: tag?.end
  };
}

function templateTag(sourceText, start) {
  const prefix = String(sourceText ?? '').slice(0, start);
  const match = /([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*)\s*$/.exec(prefix);
  if (!match) return undefined;
  const text = match[1].replace(/\s*\.\s*/g, '.');
  const parts = text.split('.');
  return { text, root: parts[0], memberName: parts.length > 1 ? parts[parts.length - 1] : undefined, start: match.index, end: match.index + match[1].length };
}

function preserveTemplateExpression(chars, sourceText, start, templateExpressionRanges) {
  let depth = 0;
  for (let index = start; index < chars.length; index += 1) {
    const char = chars[index];
    const next = chars[index + 1];
    if (char === '/' && next === '/') {
      index = maskUntilLineEnd(chars, index);
      continue;
    }
    if (char === '/' && next === '*') {
      index = maskBlockComment(chars, index);
      continue;
    }
    if (char === '\'' || char === '"') {
      index = maskQuotedString(chars, index, char);
      continue;
    }
    if (char === '`') {
      const result = maskTemplateLiteral(chars, sourceText, index, templateExpressionRanges, templateTag(sourceText, index));
      if (result.unsupported) return result;
      index = result.index;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char !== '}') continue;
    if (depth === 0) {
      chars[index] = ' ';
      return { index, unsupported: false };
    }
    depth -= 1;
  }
  return { index: chars.length - 1, unsupported: true };
}

function isDeclarationModifier(value) {
  return value === 'export' || value === 'default' || value === 'declare' || value === 'abstract' || value === 'async';
}

export {
  createBraceDepthIndex,
  findStatementBoundary,
  hasTypeAliasAssignment,
  isPropertyAccess,
  likelyTypeReference,
  maskNonCode,
  nextIdentifierToken,
  previousIdentifierToken,
  tokenize
};
