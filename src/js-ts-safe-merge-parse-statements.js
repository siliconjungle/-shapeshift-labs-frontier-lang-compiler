export function skipTopLevelTrivia(sourceText, offset) {
  let index = offset;
  while (index < sourceText.length) {
    const char = sourceText[index];
    const next = sourceText[index + 1];
    if (char === '#' && next === '!' && isHashbangAtFileStart(sourceText, index)) {
      index = consumeLineComment(sourceText, index + 2);
      continue;
    }
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '/' && next === '/') {
      index = consumeLineComment(sourceText, index + 2);
      continue;
    }
    if (char === '/' && next === '*') {
      const end = sourceText.indexOf('*/', index + 2);
      if (end === -1) return { offset: index, error: 'unterminated-block-comment' };
      index = end + 2;
      continue;
    }
    break;
  }
  return { offset: index };
}

function isHashbangAtFileStart(sourceText, offset) {
  return offset === 0 || (offset === 1 && sourceText.charCodeAt(0) === 0xfeff);
}

function consumeLineComment(sourceText, offset) {
  const lineEnd = sourceText.indexOf('\n', offset);
  return lineEnd === -1 ? sourceText.length : lineEnd + 1;
}

export function findStatementEnd(sourceText, start) {
  const text = sourceText.slice(start);
  const endOnBalancedBlock = statementCanEndOnBalancedBlock(text);
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let openedBrace = false;
  let quote;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = start; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    const next = sourceText[index + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (inTemplate) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '`') {
        inTemplate = false;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '`') {
      inTemplate = true;
      continue;
    }
    if (char === '(') {
      parenDepth += 1;
      continue;
    }
    if (char === ')') {
      parenDepth -= 1;
      if (parenDepth < 0) return { error: 'unbalanced-paren' };
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth -= 1;
      if (bracketDepth < 0) return { error: 'unbalanced-bracket' };
      continue;
    }
    if (char === '{') {
      braceDepth += 1;
      openedBrace = true;
      continue;
    }
    if (char === '}') {
      braceDepth -= 1;
      if (braceDepth < 0) return { error: 'unbalanced-brace' };
      if (endOnBalancedBlock && openedBrace && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        return { offset: consumeOptionalSameLineSemicolon(sourceText, index + 1) };
      }
      continue;
    }
    if (char === ';' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return { offset: index + 1 };
    }
  }

  if (quote || inTemplate || inBlockComment || braceDepth !== 0 || parenDepth !== 0 || bracketDepth !== 0) {
    return { error: 'unterminated-statement' };
  }
  return { error: 'missing-top-level-statement-terminator' };
}

function consumeOptionalSameLineSemicolon(sourceText, offset) {
  let index = offset;
  while (index < sourceText.length && (sourceText[index] === ' ' || sourceText[index] === '\t')) index += 1;
  if (sourceText[index] === ';') return index + 1;
  return offset;
}

function statementCanEndOnBalancedBlock(text) {
  const trimmed = text.trimStart();
  return new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:async\\s+)?function\\*?\\b`).test(trimmed)
    || new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:abstract\\s+)?class\\b`).test(trimmed)
    || new RegExp(`^(?:export\\s+)?(?:declare\\s+)?interface\\b`).test(trimmed)
    || new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:const\\s+)?enum\\b`).test(trimmed)
    || new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:namespace|module)\\b`).test(trimmed)
    || new RegExp(`^export\\s+default\\s+(?:async\\s+)?function\\*?\\b`).test(trimmed)
    || new RegExp(`^export\\s+default\\s+(?:abstract\\s+)?class\\b`).test(trimmed);
}
