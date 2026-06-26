import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment, normalizeNativeLanguageId } from './native-import-utils.js';
import { sourceLines } from './native-region-scanner-core.js';
import {
  createPreservedSourceOwnershipAnchor,
  preservedOwnershipAnchorKind,
  preservedSourceSegmentRole
} from './native-source-preservation-ownership.js';

function scanPreservedSourceTokens(sourceText, input) {
  const tokens = [];
  const trivia = [];
  const includeTokens = input.includeTokens !== false;
  const includeTrivia = input.includeTrivia !== false;
  const maxTokens = Number.isFinite(input.maxTokens) ? Math.max(0, input.maxTokens) : 20000;
  const maxTrivia = Number.isFinite(input.maxTrivia) ? Math.max(0, input.maxTrivia) : 20000;
  let offset = 0;
  let line = 1;
  let column = 1;
  let truncated = false;
  const push = (target, kind, text, start) => {
    if ((target === tokens && !includeTokens) || (target === trivia && !includeTrivia)) return;
    const max = target === tokens ? maxTokens : maxTrivia;
    if (target.length >= max) {
      truncated = true;
      return;
    }
    target.push(preservedSourceSegment({
      index: target.length,
      kind,
      text,
      start,
      end: { offset, line, column },
      sourceHash: input.sourceHash,
      sourcePath: input.sourcePath
    }));
  };
  while (offset < sourceText.length) {
    const start = { offset, line, column };
    const char = sourceText[offset];
    const next = sourceText[offset + 1];
    if (char === '\r' || char === '\n') {
      const text = char === '\r' && next === '\n' ? '\r\n' : char;
      offset += text.length;
      line += 1;
      column = 1;
      push(trivia, 'newline', text, start);
      continue;
    }
    if (char === ' ' || char === '\t' || char === '\v' || char === '\f') {
      let text = '';
      while (offset < sourceText.length && /[ \t\v\f]/.test(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, 'whitespace', text, start);
      continue;
    }
    if (offset === 0 && char === '#' && next === '!') {
      let text = '';
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, 'shebang', text, start);
      continue;
    }
    if (char === '/' && next === '/') {
      let text = '';
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, preservedCommentKind(text), text, start);
      continue;
    }
    if (char === '/' && next === '*') {
      let text = '';
      while (offset < sourceText.length) {
        const current = sourceText[offset];
        text += current;
        offset += 1;
        if (current === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 1;
        }
        if (current === '*' && sourceText[offset] === '/') {
          text += '/';
          offset += 1;
          column += 1;
          break;
        }
      }
      push(trivia, preservedCommentKind(text), text, start);
      continue;
    }
    if (char === '#' && isHashCommentLanguage(input.language)) {
      let text = '';
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, preservedHashLineKind(text), text, start);
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') {
      const quote = char;
      let text = char;
      offset += 1;
      column += 1;
      let escaped = false;
      while (offset < sourceText.length) {
        const current = sourceText[offset];
        text += current;
        offset += 1;
        if (current === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 1;
        }
        if (escaped) {
          escaped = false;
        } else if (current === '\\') {
          escaped = true;
        } else if (current === quote) {
          break;
        }
      }
      push(tokens, 'string', text, start);
      continue;
    }
    if (/[0-9]/.test(char)) {
      let text = '';
      while (offset < sourceText.length && /[0-9a-fA-F_xXoObBeE.+-]/.test(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(tokens, 'number', text, start);
      continue;
    }
    if (isIdentifierStart(char)) {
      let text = '';
      while (offset < sourceText.length && isIdentifierPart(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(tokens, preservedKeywordSet.has(text) ? 'keyword' : 'identifier', text, start);
      continue;
    }
    let text = char;
    if (/[=+\-*/%&|^!<>?:.]/.test(char)) {
      while (offset + text.length < sourceText.length && /[=+\-*/%&|^!<>?:.]/.test(sourceText[offset + text.length])) text += sourceText[offset + text.length];
      offset += text.length;
      column += text.length;
      push(tokens, 'operator', text, start);
    } else {
      offset += 1;
      column += 1;
      push(tokens, /[()[\]{};,]/.test(char) ? 'punctuation' : 'unknown', text, start);
    }
  }
  return { tokens, trivia, truncated };
}

function scanPreservedSourceDirectives(sourceText, input) {
  const directives = [];
  const maxDirectives = Number.isFinite(input.maxDirectives) ? Math.max(0, input.maxDirectives) : 20000;
  let truncated = false;
  let offset = 0;
  for (const { line, number } of sourceLines(sourceText)) {
    const trimmed = line.trim();
    const directiveKind = preservedDirectiveKind(trimmed, input.language);
    if (directiveKind) {
      if (directives.length >= maxDirectives) {
        truncated = true;
        offset += line.length + 1;
        continue;
      }
      const startColumn = Math.max(1, line.indexOf(trimmed) + 1);
      const span = {
        sourceId: input.sourceHash,
        path: input.sourcePath,
        start: offset + startColumn - 1,
        end: offset + startColumn - 1 + trimmed.length,
        startLine: number,
        startColumn,
        endLine: number,
        endColumn: startColumn + trimmed.length
      };
      const textHash = hashSemanticValue(trimmed);
      directives.push({
        id: `directive_${idFragment(input.sourcePath ?? input.language)}_${directives.length + 1}`,
        kind: directiveKind,
        text: trimmed,
        textHash,
        span,
        ownershipAnchor: createPreservedSourceOwnershipAnchor({
          kind: directiveKind,
          role: 'directive',
          text: trimmed,
          textHash,
          sourcePath: input.sourcePath,
          sourceHash: input.sourceHash,
          span,
          anchorKind: preservedOwnershipAnchorKind(directiveKind, 'directive')
        }),
        metadata: { language: input.language }
      });
    }
    offset += line.length + 1;
  }
  return { directives, truncated };
}

function preservedSourceSegment(input) {
  const id = `${input.kind}_${input.index + 1}_${idFragment(input.start.offset)}`;
  const textHash = hashSemanticValue(input.text);
  const span = {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    start: input.start.offset,
    end: input.end.offset,
    startLine: input.start.line,
    startColumn: input.start.column,
    endLine: input.end.line,
    endColumn: input.end.column
  };
  return {
    id,
    kind: input.kind,
    text: input.text,
    textHash,
    span,
    ownershipAnchor: createPreservedSourceOwnershipAnchor({
      kind: input.kind,
      role: preservedSourceSegmentRole(input.kind),
      text: input.text,
      textHash,
      sourcePath: input.sourcePath,
      sourceHash: input.sourceHash,
      span,
      anchorKind: preservedOwnershipAnchorKind(input.kind, preservedSourceSegmentRole(input.kind))
    })
  };
}

function preservedDirectiveKind(trimmed, language) {
  if (!trimmed) return undefined;
  if (/^#\s*(include|define|if|ifdef|ifndef|elif|else|endif|pragma)\b/.test(trimmed)) return 'preprocessor';
  if (/^#!\s*/.test(trimmed)) return 'shebang';
  if (/^['"]use\s+(?:strict|client|server)['"];?$/.test(trimmed)) return 'runtime-directive';
  if (/^(import|export|package|module|namespace|use|using|from|require)\b/.test(trimmed)) return 'module-directive';
  if (normalizeNativeLanguageId(language) === 'python' && /^from\s+\S+\s+import\b/.test(trimmed)) return 'module-directive';
  return undefined;
}

function preservedCommentKind(text) {
  const value = String(text ?? '');
  if (/[#@]\s*sourceMappingURL=|[#@]\s*sourceURL=/.test(value)) return 'source-map-comment';
  if (value.startsWith('/**') && value[3] !== '/') return 'jsdoc-comment';
  if (value.startsWith('/*')) return 'block-comment';
  return 'comment';
}

function preservedHashLineKind(text) {
  return preservedDirectiveKind(String(text).trim(), 'c') ? 'directive' : 'comment';
}

function isHashCommentLanguage(language) {
  return ['python', 'ruby', 'shell', 'bash', 'zsh', 'r', 'perl', 'yaml', 'toml'].includes(normalizeNativeLanguageId(language));
}

function detectNewlineStyle(sourceText) {
  const crlf = (sourceText.match(/\r\n/g) ?? []).length;
  const normalized = sourceText.replace(/\r\n/g, '');
  const lf = (normalized.match(/\n/g) ?? []).length;
  const cr = (normalized.match(/\r/g) ?? []).length;
  const kinds = [crlf ? 'crlf' : undefined, lf ? 'lf' : undefined, cr ? 'cr' : undefined].filter(Boolean);
  if (!kinds.length) return 'none';
  if (kinds.length > 1 || cr) return 'mixed';
  return kinds[0];
}

const preservedKeywordSet = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def', 'defer',
  'do', 'else', 'enum', 'export', 'extends', 'extern', 'false', 'final', 'fn', 'for', 'from', 'func', 'function',
  'if', 'impl', 'import', 'in', 'interface', 'let', 'match', 'mod', 'module', 'mut', 'namespace', 'new', 'nil',
  'none', 'null', 'package', 'private', 'protected', 'pub', 'public', 'return', 'self', 'static', 'struct',
  'switch', 'this', 'throw', 'trait', 'true', 'try', 'type', 'use', 'using', 'var', 'while', 'yield'
]);

function isIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char ?? '');
}

function isIdentifierPart(char) {
  return /[A-Za-z0-9_$]/.test(char ?? '');
}

export {
  createPreservedSourceOwnershipAnchor,
  detectNewlineStyle,
  scanPreservedSourceDirectives,
  scanPreservedSourceTokens
};
export {
  isJavaScriptTypeScriptSource,
  scanJavaScriptTypeScriptSourceLedger
} from './native-source-ledger.js';
