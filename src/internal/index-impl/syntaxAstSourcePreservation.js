import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import {
  createPreservedSourceOwnershipAnchor,
  preservedOwnershipAnchorKind,
  preservedSourceSegmentRole
} from '../../native-source-preservation-ownership.js';
import { createNativeSourcePreservation } from './createNativeSourcePreservation.js';

export function createSyntaxAstSourcePreservation(ast, input, options = {}) {
  if (!ast || typeof input.sourceText !== 'string') return undefined;
  const sourceText = input.sourceText;
  const sourceHash = hashSemanticValue(sourceText);
  const parserEvidence = `${options.parser ?? input.parser ?? 'syntax-ast'}-parser-token-comment-ranges`;
  const tokensAndTrivia = syntaxAstTokensAndTrivia(ast, input, {
    ...options,
    parserEvidence,
    sourceHash,
    sourceText
  });
  if (!tokensAndTrivia?.exact) return undefined;
  const adapterId = input.adapterId ?? options.adapterId ?? `${options.parser ?? input.parser ?? 'syntax'}-native-importer`;
  return createNativeSourcePreservation({
    language: input.language ?? options.language ?? 'javascript',
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    sourceText,
    tokensAndTrivia,
    includeTokens: options.includeTokens !== false,
    includeTrivia: options.includeTrivia !== false,
    parserTriviaEvidence: {
      status: 'exact',
      exactParserTrivia: true,
      losslessCst: true,
      sourceHash,
      adapterId,
      evidenceId: `${adapterId}:parser-token-comment:${idFragment(input.sourcePath ?? sourceHash)}`,
      parserEvidence
    },
    metadata: {
      parserTokenTriviaEvidence: parserEvidence,
      parserTokenTriviaSource: options.astFormat ?? options.parser ?? 'syntax-ast'
    }
  });
}

function syntaxAstTokensAndTrivia(ast, input, options) {
  const sourceText = options.sourceText;
  const parserSegments = parserTokenCommentSegments(ast)
    .map((entry, index) => segmentFromParserEntry(entry, index, input, options))
    .filter(Boolean)
    .sort((left, right) => left.span.start - right.span.start || left.span.end - right.span.end);
  if (!parserSegments.length) return undefined;
  const exact = parserSegmentsCoverSource(parserSegments, sourceText);
  if (!exact) return { exact: false };
  const whitespaceSegments = whitespaceTriviaSegments(parserSegments, input, options);
  const allTrivia = [...parserSegments.filter((segment) => segment.role === 'trivia'), ...whitespaceSegments]
    .sort((left, right) => left.span.start - right.span.start || left.span.end - right.span.end);
  const tokens = limitRecords(parserSegments.filter((segment) => segment.role !== 'trivia'), options.maxTokens);
  const trivia = limitRecords(allTrivia, options.maxTrivia);
  return {
    exact: true,
    tokens: tokens.records,
    trivia: trivia.records,
    truncated: tokens.truncated || trivia.truncated,
    parserEvidence: options.parserEvidence
  };
}

function parserTokenCommentSegments(ast) {
  return uniqueParserEntries([
    ...arrayValue(ast.tokens),
    ...arrayValue(ast.comments),
    ...arrayValue(ast.program?.tokens),
    ...arrayValue(ast.program?.comments)
  ]);
}

function segmentFromParserEntry(entry, index, input, options) {
  const range = sourceRange(entry);
  if (!range || range.end <= range.start || range.end > options.sourceText.length) return undefined;
  const text = options.sourceText.slice(range.start, range.end);
  if (!parserEntrySourceTextMatches(entry, text)) return undefined;
  const parserKind = parserEntryKind(entry);
  const kind = entryIsComment(entry, text) ? preservedCommentKind(text) : syntaxTokenKind(parserKind, text, input.sourcePath);
  return preservedParserSegment({
    index,
    kind,
    text,
    start: range.start,
    end: range.end,
    sourceHash: options.sourceHash,
    sourcePath: input.sourcePath,
    sourceText: options.sourceText,
    parserEvidence: options.parserEvidence,
    parserKind
  });
}

function whitespaceTriviaSegments(parserSegments, input, options) {
  const result = [];
  let cursor = 0;
  for (const segment of parserSegments) {
    if (segment.span.start > cursor) {
      result.push(...whitespaceSegmentsForText(options.sourceText.slice(cursor, segment.span.start), cursor, input, options, result.length));
    }
    cursor = Math.max(cursor, segment.span.end);
  }
  if (cursor < options.sourceText.length) {
    result.push(...whitespaceSegmentsForText(options.sourceText.slice(cursor), cursor, input, options, result.length));
  }
  return result;
}

function whitespaceSegmentsForText(text, baseOffset, input, options, startIndex) {
  const records = [];
  const matches = text.matchAll(/\r\n|\r|\n|[ \t\v\f]+/g);
  for (const match of matches) {
    const start = baseOffset + match.index;
    const end = start + match[0].length;
    records.push(preservedParserSegment({
      index: startIndex + records.length,
      kind: /\r|\n/.test(match[0]) ? 'newline' : 'whitespace',
      text: match[0],
      start,
      end,
      sourceHash: options.sourceHash,
      sourcePath: input.sourcePath,
      sourceText: options.sourceText,
      parserEvidence: options.parserEvidence,
      parserKind: 'source-gap'
    }));
  }
  return records;
}

function preservedParserSegment(input) {
  const role = preservedSourceSegmentRole(input.kind);
  const textHash = hashSemanticValue(input.text);
  const span = {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    ...sourceSpanPositions(input.start, input.end, input.sourceText)
  };
  return {
    id: `${input.kind}_${input.index + 1}_${idFragment(input.start)}`,
    kind: input.kind,
    role,
    text: input.text,
    textHash,
    span,
    ownershipAnchor: createPreservedSourceOwnershipAnchor({
      kind: input.kind,
      role,
      text: input.text,
      textHash,
      sourcePath: input.sourcePath,
      sourceHash: input.sourceHash,
      span,
      anchorKind: preservedOwnershipAnchorKind(input.kind, role),
      parserEvidence: input.parserEvidence,
      parserTriviaEvidence: {
        status: 'exact',
        exactParserTrivia: true,
        losslessCst: true,
        sourceHash: input.sourceHash,
        parserEvidence: input.parserEvidence,
        adapterId: 'syntax-ast'
      }
    }),
    metadata: { parserKind: input.parserKind, parserEvidence: input.parserEvidence }
  };
}

function parserSegmentsCoverSource(segments, sourceText) {
  let cursor = 0;
  for (const segment of segments) {
    if (segment.span.start < cursor) return false;
    if (!/^[\s]*$/.test(sourceText.slice(cursor, segment.span.start))) return false;
    cursor = segment.span.end;
  }
  return /^[\s]*$/.test(sourceText.slice(cursor));
}

function sourceSpanPositions(start, end, sourceText) {
  const beforeStart = String(sourceText ?? '').slice(0, start);
  const beforeEnd = String(sourceText ?? '').slice(0, end);
  const startLine = lineCount(beforeStart);
  const endLine = lineCount(beforeEnd);
  return {
    start,
    end,
    startLine,
    startColumn: start - lastLineStart(beforeStart) + 1,
    endLine,
    endColumn: end - lastLineStart(beforeEnd) + 1
  };
}

function sourceRange(entry) {
  if (Number.isFinite(entry?.start) && Number.isFinite(entry?.end)) return { start: entry.start, end: entry.end };
  if (Array.isArray(entry?.range) && Number.isFinite(entry.range[0]) && Number.isFinite(entry.range[1])) {
    return { start: entry.range[0], end: entry.range[1] };
  }
  return undefined;
}

function parserEntryKind(entry) {
  const type = entry?.type;
  if (typeof type === 'string') return type;
  return type?.label ?? type?.keyword ?? type?.name ?? entry?.kind ?? 'Token';
}

function parserEntrySourceTextMatches(entry, text) {
  const expected = entry?.raw ?? entry?.extra?.raw ?? entry?.text ?? entry?.source;
  return typeof expected === 'string' ? expected === text : true;
}

function entryIsComment(entry, text) {
  const kind = String(parserEntryKind(entry));
  return kind.includes('Comment') || text.startsWith('//') || text.startsWith('/*');
}

function syntaxTokenKind(parserKind, text, sourcePath) {
  const kind = String(parserKind);
  if (kind === 'Identifier' || kind === 'name') return 'identifier';
  if (kind === 'Keyword' || kind.endsWith('Keyword')) return 'keyword';
  if (kind === 'String' || kind === 'StringLiteral' || kind === 'string') return 'string';
  if (kind === 'Numeric' || kind === 'NumericLiteral' || kind === 'num') return 'number';
  if (kind === 'RegularExpression' || kind === 'regexp') return 'regex-like';
  if (kind.includes('Template') || text.startsWith('`')) return 'template';
  if (kind.includes('JSX') || /\.(?:jsx|tsx)$/i.test(String(sourcePath ?? '')) && /^(?:<|<\/|\/>|>)$/.test(text)) return 'jsx';
  if (/^[()[\]{};,]$/.test(text)) return 'punctuation';
  if (/^[=+\-*/%&|^!<>?:.]+$/.test(text)) return 'operator';
  return 'unknown';
}

function preservedCommentKind(text) {
  const value = String(text ?? '');
  if (/[#@]\s*sourceMappingURL=|[#@]\s*sourceURL=/.test(value)) return 'source-map-comment';
  if (value.startsWith('/**') && value[3] !== '/') return 'jsdoc-comment';
  if (value.startsWith('/*')) return 'block-comment';
  return 'comment';
}

function limitRecords(records, maxValue) {
  const max = Number.isFinite(maxValue) ? Math.max(0, maxValue) : 20000;
  return { records: records.slice(0, max), truncated: records.length > max };
}

function uniqueParserEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const range = sourceRange(entry);
    if (!range) return false;
    const key = `${range.start}:${range.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function lineCount(text) {
  return text.split(/\r\n|\r|\n/).length;
}

function lastLineStart(text) {
  return Math.max(text.lastIndexOf('\n') + 1, text.lastIndexOf('\r') + 1, 0);
}
