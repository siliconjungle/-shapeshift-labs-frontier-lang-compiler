import { matchingParenIndex, statementEnd } from './semantic-import-source-range-utils.js';

function dynamicImportRange(line) {
  const text = String(line ?? '');
  for (let index = 0; index < text.length; index += 1) {
    if (!dynamicImportAt(text, index)) continue;
    const open = text.indexOf('(', index);
    const close = matchingParenIndex(text, open);
    return { start: index, end: close === undefined ? statementEnd(text, open) : close + 1, kind: 'dynamic-import' };
  }
  return undefined;
}

function dynamicImportAt(text, index) {
  return text.slice(index, index + 6) === 'import' &&
    !isIdentifierPart(text[index - 1]) &&
    !isIdentifierPart(text[index + 6]) &&
    text[skipSpaces(text, index + 6)] === '(';
}

function skipSpaces(text, index) { let cursor = index; while (/\s/.test(text[cursor] ?? '')) cursor += 1; return cursor; }
function isIdentifierPart(char) { return /[A-Za-z0-9_$]/.test(char ?? ''); }

export { dynamicImportRange };
