import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { countBy, idFragment, normalizeNativeLanguageId } from './native-import-utils.js';
import { braceMetadata, endPosition, isBrace, isHorizontalWhitespace, isIdentifierPart, isIdentifierStart, isSourceMapComment, looksLikeJsxStart, mayStartRegex, readBlockCommentEnd, readJsxRegionEnd, readQuotedEnd, readRegexEnd, readStatementEnd, readTemplateEnd, readToLineEnd, readWhile } from './native-source-ledger-helpers.js';

const jsTsKeywords = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof',
  'interface', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null', 'of', 'package',
  'private', 'protected', 'public', 'readonly', 'require', 'return', 'satisfies', 'set',
  'static', 'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof',
  'undefined', 'unique', 'unknown', 'var', 'void', 'while', 'with', 'yield'
]);

export function isJavaScriptTypeScriptSource(language, sourcePath) {
  const normalized = normalizeNativeLanguageId(language);
  if (normalized === 'javascript' || normalized === 'typescript') return true;
  return /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/i.test(String(sourcePath ?? ''));
}

export function scanJavaScriptTypeScriptSourceLedger(sourceText, input = {}) {
  const maxSpans = Number.isFinite(input.maxLedgerSpans) ? Math.max(0, input.maxLedgerSpans) : 40000;
  const sourceHash = input.sourceHash ?? hashSemanticValue(sourceText);
  const ledger = {
    kind: 'frontier.lang.jsTsSourceLedger',
    version: 1,
    language: input.language ?? 'javascript',
    sourcePath: input.sourcePath,
    sourceHash,
    spans: [],
    tokens: [],
    trivia: [],
    comments: [],
    shebangs: [],
    directives: [],
    importExportSpans: [],
    braces: [],
    protectedRegions: []
  };
  let offset = 0;
  let line = 1;
  let column = 1;
  let truncated = false;
  let previous = undefined;
  const braceStack = [];

  const push = (collection, kind, role, text, start, end, metadata = {}) => {
    if (ledger.spans.length >= maxSpans) {
      truncated = true;
      return undefined;
    }
    const entry = sourceLedgerSpan({
      index: ledger.spans.length,
      kind,
      role,
      text,
      start,
      end,
      sourceHash,
      sourcePath: input.sourcePath,
      metadata
    });
    ledger.spans.push(entry);
    collection.push(entry);
    return entry;
  };
  const consume = (endOffset) => {
    const start = { offset, line, column };
    const text = sourceText.slice(offset, endOffset);
    advanceText(text);
    return { start, end: { offset, line, column }, text };
  };
  const pushToken = (kind, text, start, end, metadata) => {
    const token = push(ledger.tokens, kind, 'token', text, start, end, metadata);
    previous = token ?? { kind, text, metadata };
    return token;
  };

  while (offset < sourceText.length) {
    const char = sourceText[offset];
    const next = sourceText[offset + 1];
    if (offset === 0 && char === '#' && next === '!') {
      const part = consume(readToLineEnd(sourceText, offset));
      const entry = sourceLedgerSpan({
        index: ledger.spans.length,
        kind: 'shebang',
        role: 'directive',
        text: part.text,
        start: part.start,
        end: part.end,
        sourceHash,
        sourcePath: input.sourcePath,
        metadata: { language: input.language ?? 'javascript' }
      });
      ledger.spans.push(entry);
      ledger.shebangs.push(entry);
      ledger.directives.push(entry);
      previous = undefined;
      continue;
    }
    if (char === '\r' || char === '\n') {
      const part = consume(char === '\r' && next === '\n' ? offset + 2 : offset + 1);
      push(ledger.trivia, 'newline', 'trivia', part.text, part.start, part.end);
      previous = undefined;
      continue;
    }
    if (isHorizontalWhitespace(char)) {
      const part = consume(readWhile(sourceText, offset, isHorizontalWhitespace));
      push(ledger.trivia, 'whitespace', 'trivia', part.text, part.start, part.end);
      continue;
    }
    if (char === '/' && next === '/') {
      const part = consume(readToLineEnd(sourceText, offset));
      const kind = preservedCommentKind(part.text);
      const metadata = commentMetadata(kind);
      push(ledger.trivia, kind, 'trivia', part.text, part.start, part.end, metadata);
      push(ledger.comments, kind, 'comment', part.text, part.start, part.end, metadata);
      previous = undefined;
      continue;
    }
    if (char === '/' && next === '*') {
      const part = consume(readBlockCommentEnd(sourceText, offset));
      const kind = preservedCommentKind(part.text);
      const metadata = commentMetadata(kind);
      push(ledger.trivia, kind, 'trivia', part.text, part.start, part.end, metadata);
      push(ledger.comments, kind, 'comment', part.text, part.start, part.end, metadata);
      previous = undefined;
      continue;
    }
    if (char === '\'' || char === '"') {
      const part = consume(readQuotedEnd(sourceText, offset, char));
      pushToken('string', part.text, part.start, part.end, { quote: char });
      push(ledger.protectedRegions, 'string', 'protected', part.text, part.start, part.end, { quote: char });
      continue;
    }
    if (char === '`') {
      const part = consume(readTemplateEnd(sourceText, offset));
      pushToken('template', part.text, part.start, part.end);
      push(ledger.protectedRegions, 'template', 'protected', part.text, part.start, part.end);
      continue;
    }
    if (looksLikeJsxStart(sourceText, offset, previous)) {
      const jsxEnd = readJsxRegionEnd(sourceText, offset);
      if (jsxEnd > offset + 1) {
        const part = consume(jsxEnd);
        pushToken('jsx', part.text, part.start, part.end);
        push(ledger.protectedRegions, 'jsx', 'protected', part.text, part.start, part.end);
        continue;
      }
    }
    if (char === '/' && mayStartRegex(previous)) {
      const regexEnd = readRegexEnd(sourceText, offset);
      if (regexEnd) {
        const part = consume(regexEnd);
        pushToken('regex-like', part.text, part.start, part.end);
        push(ledger.protectedRegions, 'regex-like', 'protected', part.text, part.start, part.end);
        continue;
      }
    }
    if (/[0-9]/.test(char)) {
      const part = consume(readWhile(sourceText, offset, (value) => /[0-9a-fA-F_xXoObBeE.+-]/.test(value)));
      pushToken('number', part.text, part.start, part.end);
      continue;
    }
    if (isIdentifierStart(char)) {
      const part = consume(readWhile(sourceText, offset, isIdentifierPart));
      const kind = jsTsKeywords.has(part.text) ? 'keyword' : 'identifier';
      pushToken(kind, part.text, part.start, part.end);
      if (part.text === 'import' || part.text === 'export') {
        push(ledger.importExportSpans, part.text, 'module-keyword', part.text, part.start, part.end, {
          statementEnd: readStatementEnd(sourceText, offset)
        });
      }
      continue;
    }
    if (isBrace(char)) {
      const part = consume(offset + 1);
      const token = pushToken('punctuation', part.text, part.start, part.end);
      const brace = braceMetadata(char, braceStack, token?.id);
      push(ledger.braces, 'brace', 'brace', part.text, part.start, part.end, brace);
      continue;
    }
    if (/[=+\-*/%&|^!<>?:.]/.test(char)) {
      const part = consume(readWhile(sourceText, offset, (value) => /[=+\-*/%&|^!<>?:.]/.test(value)));
      pushToken('operator', part.text, part.start, part.end);
      continue;
    }
    const part = consume(offset + 1);
    pushToken(/[;,]/.test(char) ? 'punctuation' : 'unknown', part.text, part.start, part.end);
  }

  for (const directive of sourceLedgerDirectives(sourceText, input, sourceHash)) {
    if (directive.kind === 'shebang' && ledger.shebangs.some((entry) => entry.span.start === directive.span.start && entry.span.end === directive.span.end)) continue;
    if (ledger.spans.length >= maxSpans) {
      truncated = true;
      break;
    }
    ledger.spans.push(directive);
    ledger.directives.push(directive);
  }
  ledger.summary = {
    spans: ledger.spans.length,
    tokens: ledger.tokens.length,
    trivia: ledger.trivia.length,
    comments: ledger.comments.length,
    shebangs: ledger.shebangs.length,
    directives: ledger.directives.length,
    sourceMapComments: ledger.comments.filter((entry) => entry.kind === 'source-map-comment').length,
    importExportSpans: ledger.importExportSpans.length,
    braces: ledger.braces.length,
    protectedRegions: ledger.protectedRegions.length,
    stringRegions: ledger.protectedRegions.filter((entry) => entry.kind === 'string').length,
    templateRegions: ledger.protectedRegions.filter((entry) => entry.kind === 'template').length,
    regexLikeRegions: ledger.protectedRegions.filter((entry) => entry.kind === 'regex-like').length,
    jsxRegions: ledger.protectedRegions.filter((entry) => entry.kind === 'jsx').length,
    triviaByKind: countBy(ledger.trivia.map((entry) => entry.kind)),
    tokenByKind: countBy(ledger.tokens.map((entry) => entry.kind)),
    directiveByKind: countBy(ledger.directives.map((entry) => entry.kind)),
    truncated
  };
  return ledger;

  function advanceText(text) {
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] === '\r') {
        if (text[index + 1] === '\n') {
          offset += 2;
          index += 1;
        } else {
          offset += 1;
        }
        line += 1;
        column = 1;
      } else if (text[index] === '\n') {
        offset += 1;
        line += 1;
        column = 1;
      } else {
        offset += 1;
        column += 1;
      }
    }
  }
}

function sourceLedgerSpan(input) {
  const entry = {
    id: `${input.role}_${input.kind}_${input.index + 1}_${idFragment(input.start.offset)}`,
    kind: input.kind,
    role: input.role,
    text: input.text,
    textHash: hashSemanticValue(input.text),
    span: {
      sourceId: input.sourceHash,
      path: input.sourcePath,
      start: input.start.offset,
      end: input.end.offset,
      startLine: input.start.line,
      startColumn: input.start.column,
      endLine: input.end.line,
      endColumn: input.end.column
    }
  };
  if (input.metadata && Object.keys(input.metadata).length) entry.metadata = input.metadata;
  return entry;
}

function sourceLedgerDirectives(sourceText, input, sourceHash) {
  const directives = [];
  let offset = 0;
  let line = 1;
  while (offset <= sourceText.length) {
    const lineEnd = readToLineEnd(sourceText, offset);
    const lineText = sourceText.slice(offset, lineEnd);
    const trimmed = lineText.trim();
    const kind = directiveKind(trimmed);
    if (kind) {
      const startColumn = lineText.indexOf(trimmed) + 1;
      const start = { offset: offset + startColumn - 1, line, column: startColumn };
      directives.push(sourceLedgerSpan({
        index: directives.length,
        kind,
        role: 'directive',
        text: trimmed,
        start,
        end: endPosition(start, trimmed),
        sourceHash,
        sourcePath: input.sourcePath,
        metadata: { language: input.language ?? 'javascript' }
      }));
    }
    if (lineEnd >= sourceText.length) break;
    const newlineLength = sourceText[lineEnd] === '\r' && sourceText[lineEnd + 1] === '\n' ? 2 : 1;
    offset = lineEnd + newlineLength;
    line += 1;
  }
  return directives;
}

function directiveKind(trimmed) {
  if (!trimmed) return undefined;
  if (/^#!\s*/.test(trimmed)) return 'shebang';
  if (isSourceMapComment(trimmed)) return 'source-map-comment';
  if (/^\/\/\/\s*<reference\b/.test(trimmed)) return 'typescript-reference';
  if (/^['"]use\s+(?:strict|client|server)['"];?$/.test(trimmed)) return 'runtime-directive';
  if (/^(?:import|export)\b/.test(trimmed)) return 'module-directive';
  return undefined;
}

function preservedCommentKind(text) {
  const value = String(text ?? '');
  if (isSourceMapComment(value)) return 'source-map-comment';
  if (value.startsWith('/**') && value[3] !== '/') return 'jsdoc-comment';
  if (value.startsWith('/*')) return 'block-comment';
  return 'comment';
}

function commentMetadata(kind) {
  return kind === 'source-map-comment' ? { sourceMap: true } : kind === 'jsdoc-comment' ? { jsdoc: true } : kind === 'block-comment' ? { blockComment: true } : {};
}
