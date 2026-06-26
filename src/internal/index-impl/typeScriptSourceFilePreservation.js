import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import {
  createParserSpanCoverageProof,
  createPreservedSourceOwnershipAnchor,
  preservedOwnershipAnchorKind,
  preservedSourceSegmentRole
} from '../../native-source-preservation-ownership.js';
import { createNativeSourcePreservation } from './createNativeSourcePreservation.js';

const PARSER_EVIDENCE = 'typescript-compiler-api-source-file-scanner';

export function createTypeScriptSourceFilePreservation(sourceFile, input, options = {}) {
  const ts = options.ts;
  const sourceText = sourceFileText(sourceFile, input);
  if (!sourceText || !ts || typeof ts.createScanner !== 'function') return undefined;
  const sourceHash = hashSemanticValue(sourceText);
  const tokensAndTrivia = scanTypeScriptSourceFileTokens(sourceFile, input, { ...options, sourceHash, sourceText });
  if (!tokensAndTrivia) return undefined;
  return createNativeSourcePreservation({
    language: input.language ?? options.language ?? 'typescript',
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    sourceText,
    tokensAndTrivia,
    includeTokens: options.includeTokens !== false,
    includeTrivia: options.includeTrivia !== false,
    parserSpanCoverageProof: tokensAndTrivia.parserSpanCoverageProof,
    parserTriviaEvidence: tokensAndTrivia.parserTriviaEvidence,
    metadata: {
      parserTokenTriviaEvidence: PARSER_EVIDENCE,
      parserTokenTriviaSource: 'typescript-source-file',
      parserSpanCoverageProof: tokensAndTrivia.parserSpanCoverageProof,
      ...(options.sourcePreservationMetadata ?? {})
    }
  });
}

function scanTypeScriptSourceFileTokens(sourceFile, input, options) {
  const ts = options.ts;
  const sourceText = options.sourceText;
  const scanner = ts.createScanner(
    options.scriptTarget ?? ts.ScriptTarget?.Latest ?? ts.ScriptTarget?.ESNext ?? 99,
    false,
    languageVariant(ts, input, options),
    sourceText,
    undefined,
    0,
    sourceText.length
  );
  const lineStarts = sourceLineStarts(sourceFile, sourceText);
  const tokens = [];
  const trivia = [];
  const maxTokens = Number.isFinite(options.maxTokens) ? Math.max(0, options.maxTokens) : 20000;
  const maxTrivia = Number.isFinite(options.maxTrivia) ? Math.max(0, options.maxTrivia) : 20000;
  let truncated = false;
  for (let kind = scanner.scan(); !isEndOfFile(ts, kind); kind = scanner.scan()) {
    const start = scanner.getTokenPos();
    const end = scanner.getTextPos();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const text = sourceText.slice(start, end);
    const mappedKind = sourceSegmentKind(ts, kind, text, input, options);
    const target = preservedSourceSegmentRole(mappedKind) === 'trivia' ? trivia : tokens;
    const max = target === tokens ? maxTokens : maxTrivia;
    if (target.length >= max) {
      truncated = true;
      continue;
    }
    target.push(preservedParserSegment({
      index: target.length,
      kind: mappedKind,
      text,
      start,
      end,
      lineStarts,
      sourceHash: options.sourceHash,
      sourcePath: input.sourcePath,
      syntaxKind: syntaxKindName(ts, kind)
    }));
  }
  const parserSpanCoverageProof = createParserSpanCoverageProof({
    sourceText,
    sourcePath: input.sourcePath,
    sourceHash: options.sourceHash,
    segments: [...tokens, ...trivia],
    tokenCount: tokens.length,
    triviaCount: trivia.length,
    commentCount: trivia.filter((entry) => isCommentKind(entry.kind)).length,
    parserEvidence: PARSER_EVIDENCE,
    adapterId: input.adapterId ?? options.adapterId ?? 'frontier.typescript-compiler-native-importer',
    evidenceId: `${input.adapterId ?? options.adapterId ?? 'frontier.typescript-compiler-native-importer'}:parser-span-coverage:${idFragment(input.sourcePath ?? options.sourceHash)}`,
    languageMode: sourceLanguageMode(ts, input, options),
    boundedLanguages: ['javascript', 'typescript', 'jsx', 'tsx'],
    truncated
  });
  const parserTriviaEvidence = parserTriviaEvidenceForSpanCoverage(parserSpanCoverageProof, {
    sourceHash: options.sourceHash,
    sourcePath: input.sourcePath,
    adapterId: input.adapterId ?? options.adapterId ?? 'frontier.typescript-compiler-native-importer',
    truncated
  });
  return {
    tokens: tokens.map((entry) => withParserTriviaEvidence(entry, parserTriviaEvidence)),
    trivia: trivia.map((entry) => withParserTriviaEvidence(entry, parserTriviaEvidence)),
    truncated,
    parserEvidence: PARSER_EVIDENCE,
    parserSpanCoverageProof,
    parserTriviaEvidence
  };
}

function preservedParserSegment(input) {
  const role = preservedSourceSegmentRole(input.kind);
  const textHash = hashSemanticValue(input.text);
  const span = {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    ...sourceSpanPositions(input.start, input.end, input.lineStarts)
  };
  return {
    id: `${input.kind}_${input.index + 1}_${idFragment(input.start)}`,
    kind: input.kind,
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
      parserEvidence: PARSER_EVIDENCE,
      parserTriviaEvidence: {
        status: 'exact',
        exactParserTrivia: true,
        losslessCst: true,
        sourceHash: input.sourceHash,
        parserEvidence: PARSER_EVIDENCE,
        adapterId: 'typescript-compiler-api'
      }
    }),
    metadata: { syntaxKind: input.syntaxKind, parserEvidence: PARSER_EVIDENCE }
  };
}

function withParserTriviaEvidence(record, parserTriviaEvidence) {
  const role = preservedSourceSegmentRole(record.kind);
  return {
    ...record,
    ownershipAnchor: createPreservedSourceOwnershipAnchor({
      kind: record.kind,
      role,
      text: record.text,
      textHash: record.textHash,
      sourcePath: record.span.path,
      sourceHash: record.span.sourceId,
      span: record.span,
      anchorKind: preservedOwnershipAnchorKind(record.kind, role),
      parserEvidence: PARSER_EVIDENCE,
      parserTriviaEvidence
    }),
    metadata: {
      ...record.metadata,
      parserSpanCoverageStatus: parserTriviaEvidence.parserSpanCoverageProof?.status
    }
  };
}

function sourceSpanPositions(start, end, lineStarts) {
  const startLine = lineForOffset(lineStarts, start);
  const endLine = lineForOffset(lineStarts, end);
  return {
    start,
    end,
    startLine: startLine + 1,
    startColumn: start - lineStarts[startLine] + 1,
    endLine: endLine + 1,
    endColumn: end - lineStarts[endLine] + 1
  };
}

function sourceLineStarts(sourceFile, sourceText) {
  const starts = typeof sourceFile.getLineStarts === 'function' ? [...sourceFile.getLineStarts()] : [0];
  if (starts.length > 1 || sourceText.length === 0) return starts;
  for (let index = 0; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === '\r' || char === '\n') {
      if (char === '\r' && sourceText[index + 1] === '\n') index += 1;
      starts.push(index + 1);
    }
  }
  return starts;
}

function lineForOffset(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset && (mid === lineStarts.length - 1 || lineStarts[mid + 1] > offset)) return mid;
    if (lineStarts[mid] > offset) high = mid - 1;
    else low = mid + 1;
  }
  return 0;
}

function sourceSegmentKind(ts, kind, text, input, options) {
  const name = syntaxKindName(ts, kind);
  if (text === '\r' || text === '\n' || text === '\r\n') return 'newline';
  if (/^[ \t\v\f]+$/.test(text)) return 'whitespace';
  if (String(text).startsWith('//') || String(text).startsWith('/*')) return preservedCommentKind(text);
  if (/^[0-9]/.test(text)) return 'number';
  if (String(text).startsWith('`')) return 'template';
  if (String(text).startsWith('"') || String(text).startsWith("'")) return 'string';
  if (isJsxSource(ts, input, options) && (text === '<' || text === '</' || text === '/>')) return 'jsx';
  if (name === 'WhitespaceTrivia') return 'whitespace';
  if (name === 'NewLineTrivia') return 'newline';
  if (name === 'ShebangTrivia') return 'shebang';
  if (name === 'SingleLineCommentTrivia' || name === 'MultiLineCommentTrivia') return preservedCommentKind(text);
  if (name === 'Identifier' || name === 'PrivateIdentifier') return 'identifier';
  if (name.endsWith('Keyword')) return 'keyword';
  if (name.includes('StringLiteral')) return 'string';
  if (name.includes('Template')) return 'template';
  if (name === 'NumericLiteral' || name === 'BigIntLiteral') return 'number';
  if (name === 'RegularExpressionLiteral') return 'regex-like';
  if (name.includes('Jsx')) return 'jsx';
  if (/^[()[\]{};,]$/.test(text)) return 'punctuation';
  if (/^[=+\-*/%&|^!<>?:.]+$/.test(text)) return 'operator';
  return 'unknown';
}

function sourceFileText(sourceFile, input) {
  return typeof sourceFile?.getFullText === 'function'
    ? sourceFile.getFullText()
    : typeof sourceFile?.text === 'string' ? sourceFile.text : input.sourceText;
}

function languageVariant(ts, input, options) {
  return isJsxSource(ts, input, options) ? ts.LanguageVariant?.JSX ?? 1 : ts.LanguageVariant?.Standard ?? 0;
}

function parserTriviaEvidenceForSpanCoverage(parserSpanCoverageProof, input) {
  const exact = parserSpanCoverageProof?.status === 'exact';
  const blockReasonCodes = exact ? [] : [
    'exact-parser-trivia-span-coverage-blocked',
    ...(parserSpanCoverageProof?.blockReasonCodes ?? []),
    input.truncated ? 'source-preservation-truncated' : undefined
  ].filter(Boolean);
  return {
    status: exact ? 'exact' : 'blocked',
    exactParserTrivia: exact,
    losslessCst: exact,
    sourceHash: input.sourceHash,
    adapterId: input.adapterId,
    evidenceId: `${input.adapterId}:parser-trivia:${idFragment(input.sourcePath ?? input.sourceHash)}`,
    parserEvidence: PARSER_EVIDENCE,
    parserSpanCoverageProof,
    ...(exact ? {} : { blockReasonCodes })
  };
}

function sourceLanguageMode(ts, input, options) {
  const sourcePath = String(input.sourcePath ?? '').toLowerCase();
  if (sourcePath.endsWith('.tsx') || options.scriptKind === ts.ScriptKind?.TSX) return 'tsx';
  if (sourcePath.endsWith('.jsx') || options.scriptKind === ts.ScriptKind?.JSX) return 'jsx';
  if (sourcePath.endsWith('.js') || sourcePath.endsWith('.mjs') || sourcePath.endsWith('.cjs') || options.scriptKind === ts.ScriptKind?.JS) return 'javascript';
  return 'typescript';
}

function isJsxSource(ts, input, options) {
  const sourcePath = String(input.sourcePath ?? '').toLowerCase();
  return sourcePath.endsWith('.tsx') || sourcePath.endsWith('.jsx') || options.scriptKind === ts.ScriptKind?.TSX || options.scriptKind === ts.ScriptKind?.JSX;
}

function isEndOfFile(ts, kind) {
  return kind === ts.SyntaxKind?.EndOfFileToken || syntaxKindName(ts, kind) === 'EndOfFileToken';
}

function syntaxKindName(ts, kind) {
  return ts?.SyntaxKind?.[kind] ?? String(kind);
}

function preservedCommentKind(text) {
  const value = String(text ?? '');
  if (/[#@]\s*sourceMappingURL=|[#@]\s*sourceURL=/.test(value)) return 'source-map-comment';
  if (value.startsWith('/**') && value[3] !== '/') return 'jsdoc-comment';
  if (value.startsWith('/*')) return 'block-comment';
  return 'comment';
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment' || kind === 'source-map-comment';
}
