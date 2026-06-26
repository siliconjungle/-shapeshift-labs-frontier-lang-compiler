import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { sourceTextForSpan } from './sourceTextForSpan.js';

export function callsiteArgumentAppendMergeClassification(input) {
  if (input.region?.regionKind !== 'call') return undefined;
  if (!input.baseSymbol || !input.workerSymbol || !input.headSymbol) return undefined;
  const baseText = symbolSourceText(input.context.base, input.baseSymbol, input.region);
  const workerText = symbolSourceText(input.context.worker, input.workerSymbol, input.region);
  const headText = symbolSourceText(input.context.head, input.headSymbol, input.region);
  const parsed = [baseText, workerText, headText].map(parseSimpleCallsite);
  if (parsed.some((entry) => !entry.ok)) return undefined;
  const [base, worker, head] = parsed.map((entry) => entry.value);
  if (base.callee !== worker.callee || base.callee !== head.callee) return undefined;
  if (!hasBaseArgumentPrefix(worker.args, base.args) || !hasBaseArgumentPrefix(head.args, base.args)) return undefined;
  const workerTail = worker.args.slice(base.args.length);
  const headTail = head.args.slice(base.args.length);
  if (!workerTail.length || !headTail.length) return undefined;
  if (!callsiteTargetHasRestParameter(input, base.callee)) return undefined;
  if (![...workerTail, ...headTail].every(isPureAppendArgument)) return undefined;
  if (duplicateArgumentHashes(workerTail, headTail).length) return undefined;

  const sourceReplacementText = `${base.callee}(${[...base.args, ...workerTail, ...headTail].join(', ')})`;
  return {
    sourceBackprojection: {
      mode: 'same-language-callsite-argument-append',
      sourceEditSpan: input.headSymbol.sourceSpan,
      sourceEditTextHash: hashSemanticValue(headText),
      sourceReplacementText,
      sourceReplacementTextHash: hashSemanticValue(sourceReplacementText),
      lineEndingStable: true,
      callsite: {
        callee: base.callee,
        baseArgumentCount: base.args.length,
        workerAppendedArgumentCount: workerTail.length,
        headAppendedArgumentCount: headTail.length,
        mergedArgumentCount: base.args.length + workerTail.length + headTail.length
      }
    },
    reasonCodes: uniqueStrings([
      'callsite-argument-append-rest-callee-signature-evidence',
      'callsite-argument-append-pure-argument-effect-evidence',
      'callsite-argument-append-order-evidence'
    ]),
    evidenceIds: [`evidence_${idFragment(input.anchorKey ?? base.callee)}_callsite_argument_append`]
  };
}

function parseSimpleCallsite(text) {
  const source = String(text ?? '').trim().replace(/;$/, '');
  const open = source.indexOf('(');
  if (open <= 0 || !source.endsWith(')')) return { ok: false };
  const callee = source.slice(0, open).trim();
  if (!/^[A-Za-z_$][\w$]*$/.test(callee)) return { ok: false };
  const args = splitTopLevelComma(source.slice(open + 1, -1));
  if (!args.ok) return { ok: false };
  return { ok: true, value: { callee, args: args.items } };
}

function splitTopLevelComma(text) {
  const items = [];
  let start = 0;
  let depth = 0;
  let quote;
  let comment;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (comment === 'line') {
      if (char === '\n' || char === '\r') comment = undefined;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        index += 1;
        comment = undefined;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '/') {
      index += 1;
      comment = 'line';
      continue;
    }
    if (char === '/' && next === '*') {
      index += 1;
      comment = 'block';
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === ',' && depth === 0) {
      items.push(text.slice(start, index).trim());
      start = index + 1;
    }
    if (depth < 0) return { ok: false };
  }
  if (quote || comment || depth !== 0) return { ok: false };
  const tail = text.slice(start).trim();
  if (tail) items.push(tail);
  return { ok: true, items };
}

function hasBaseArgumentPrefix(args, baseArgs) {
  if (args.length < baseArgs.length) return false;
  return baseArgs.every((arg, index) => args[index] === arg);
}

function callsiteTargetHasRestParameter(input, callee) {
  const symbolName = input.region?.symbolName ?? input.baseSymbol?.name ?? '';
  const targetName = symbolName.includes('->') ? symbolName.split('->').pop() : callee;
  if (!targetName || targetName !== callee) return false;
  const sourceText = nativeImportSourceText(input.context.base);
  return topLevelFunctionDeclarationHasRestParameter(String(sourceText ?? ''), targetName);
}

function isPureAppendArgument(argument) {
  const text = String(argument ?? '').trim();
  if (!text) return false;
  if (/^(true|false|null|undefined|\d+(?:\.\d+)?|['"][^'"]*['"])$/.test(text)) return true;
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(text)) return true;
  if (text.startsWith('{') && text.endsWith('}')) {
    if (text.includes('`')) return false;
    const codeText = maskNonCodeCharacters(text);
    return !/[()=]|\.\.\.|=>|\b(await|new|yield|delete|throw|function|class)\b/.test(codeText);
  }
  return false;
}

function duplicateArgumentHashes(left, right) { const rightHashes = new Set(right.map(argumentIdentityHash)); return left.map(argumentIdentityHash).filter((hash) => rightHashes.has(hash)); }

function argumentIdentityHash(argument) { return hashSemanticValue(canonicalArgumentText(argument)); }

function canonicalArgumentText(argument) {
  const source = String(argument ?? '').trim();
  let result = '';
  let quote;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quote) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '/') {
      index += 1;
      while (index + 1 < source.length && source[index + 1] !== '\n' && source[index + 1] !== '\r') index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      index += 1;
      while (index + 1 < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      result += char;
      continue;
    }
    if (/\s/.test(char)) continue;
    result += char;
  }
  return result;
}

function topLevelFunctionDeclarationHasRestParameter(sourceText, targetName) {
  const codeText = maskNonCodeCharacters(sourceText);
  const pattern = new RegExp(`\\bfunction\\s*\\*?\\s*(${identifierPatternSource()})\\s*\\(`, 'g');
  const matches = [];
  for (let match = pattern.exec(codeText); match; match = pattern.exec(codeText)) {
    if (match[1] !== targetName) continue;
    if (braceDepthAt(codeText, match.index) !== 0) continue;
    if (!hasDeclarationPrefix(codeText, match.index)) continue;
    const open = codeText.indexOf('(', match.index + match[0].indexOf('('));
    const close = matchingParen(codeText, open);
    if (!Number.isFinite(close)) return false;
    matches.push(/(?:^|,)\s*\.\.\.\s*[A-Za-z_$]/.test(codeText.slice(open + 1, close)));
  }
  return matches.length === 1 && matches[0] === true;
}

function maskNonCodeCharacters(value) {
  const source = String(value ?? '');
  let result = '';
  let state = 'code';
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      result += maskedChar(char);
      if (char === '\n' || char === '\r') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      result += maskedChar(char);
      if (char === '*' && next === '/') {
        result += ' ';
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      result += maskedChar(char);
      if (char === '\\') {
        if (index + 1 < source.length) {
          result += maskedChar(source[index + 1]);
          index += 1;
        }
        continue;
      }
      if ((state === 'single' && char === "'") || (state === 'double' && char === '"') || (state === 'template' && char === '`')) {
        state = 'code';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      result += '  ';
      index += 1;
      state = 'line-comment';
    } else if (char === '/' && next === '*') {
      result += '  ';
      index += 1;
      state = 'block-comment';
    } else if (char === "'") {
      result += ' ';
      state = 'single';
    } else if (char === '"') {
      result += ' ';
      state = 'double';
    } else if (char === '`') {
      result += ' ';
      state = 'template';
    } else {
      result += char;
    }
  }
  return result;
}

function maskedChar(char) { return char === '\n' || char === '\r' ? char : ' '; }

function braceDepthAt(codeText, endIndex) {
  let depth = 0;
  for (let index = 0; index < endIndex; index += 1) {
    if (codeText[index] === '{') depth += 1;
    else if (codeText[index] === '}') depth = Math.max(0, depth - 1);
  }
  return depth;
}

function hasDeclarationPrefix(codeText, functionIndex) {
  const allowedModifiers = new Set(['export', 'default', 'async', 'declare']);
  let index = functionIndex;
  const seen = new Set();
  for (;;) {
    index = skipWhitespaceBackward(codeText, index);
    const word = wordBefore(codeText, index);
    if (!word || !allowedModifiers.has(word.value)) break;
    if (seen.has(word.value)) return false;
    seen.add(word.value);
    index = word.start;
  }
  index = skipWhitespaceBackward(codeText, index);
  if (index === 0) return true;
  const previous = codeText[index - 1];
  return previous === ';' || previous === '{' || previous === '}';
}

function skipWhitespaceBackward(text, endIndex) {
  let index = endIndex;
  while (index > 0 && /\s/.test(text[index - 1])) index -= 1;
  return index;
}

function wordBefore(text, endIndex) {
  let index = endIndex;
  while (index > 0 && /[A-Za-z0-9_$]/.test(text[index - 1])) index -= 1;
  if (index === endIndex) return undefined;
  const value = text.slice(index, endIndex);
  if (!/^[A-Za-z_$][\w$]*$/.test(value)) return undefined;
  return { value, start: index };
}

function matchingParen(codeText, open) {
  if (open < 0 || codeText[open] !== '(') return undefined;
  let depth = 0;
  for (let index = open; index < codeText.length; index += 1) {
    if (codeText[index] === '(') depth += 1;
    else if (codeText[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return undefined;
}

function identifierPatternSource() { return '[A-Za-z_$][\\w$]*'; }

function symbolSourceText(imported, symbol, region) {
  const span = symbol?.sourceSpan ?? region?.metadata?.changedRegionProjection?.before?.sourceSpan ?? region?.sourceSpan;
  return sourceTextForSpan(nativeImportSourceText(imported), span);
}
