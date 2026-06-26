import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from './native-import-utils.js';

function createParserTriviaExactnessRecord(evidence, context = {}) {
  const declared = isPlainObject(evidence) ? evidence : {};
  const hasDeclaredEvidence = Object.keys(declared).length > 0;
  const parserSpanCoverageProof = isPlainObject(declared.parserSpanCoverageProof)
    ? declared.parserSpanCoverageProof
    : isPlainObject(context.parserSpanCoverageProof) ? context.parserSpanCoverageProof : undefined;
  const observedSourceHash = firstString(context.sourceHash, context.sourceId);
  const evidenceSourceHash = firstString(declared.evidenceSourceHash, declared.sourceHash, declared.sourceId, declared.roundtripHash);
  const adapterId = firstString(declared.adapterId, declared.parserAdapterId, declared.parserId, declared.adapter, context.adapterId);
  const evidenceId = firstString(declared.evidenceId, declared.id, context.evidenceId);
  const declaredParserEvidence = firstString(declared.parserEvidence);
  const tokenTriviaParserEvidence = firstString(context.parserTokenTriviaEvidence, context.parserEvidence);
  const declaredScannerEvidence = isLightweightScannerParserEvidence(declaredParserEvidence);
  const tokenTriviaScannerEvidence = isLightweightScannerParserEvidence(tokenTriviaParserEvidence);
  const hasDeclaredParserBackedEvidence = Boolean(adapterId || (declaredParserEvidence && !declaredScannerEvidence));
  const hasParserBackedTokenTriviaEvidence = Boolean(tokenTriviaParserEvidence && !tokenTriviaScannerEvidence);
  const exactClaim = declared.exactParserTrivia === true || declared.exact === true || declared.status === 'exact' || declared.losslessCst === true;
  const declaredBlocked = declared.status === 'blocked' || declared.blocked === true;
  const parserSpanCoverageBlocked = exactClaim && parserSpanCoverageProof && parserSpanCoverageProof.status !== 'exact';
  const blockReasonCodes = declaredBlocked
    ? uniqueStrings(declared.blockReasonCodes ?? declared.reasonCodes ?? ['parser-trivia-proof-stale-or-incomplete'])
    : exactClaim ? uniqueStrings([
      evidenceSourceHash ? undefined : 'parser-trivia-source-hash-missing',
      evidenceSourceHash && observedSourceHash && evidenceSourceHash !== observedSourceHash ? 'parser-trivia-source-hash-mismatch' : undefined,
      hasDeclaredParserBackedEvidence ? undefined : 'exact-parser-trivia-parser-evidence-missing',
      hasParserBackedTokenTriviaEvidence ? undefined : 'exact-parser-trivia-token-comment-evidence-missing',
      declaredScannerEvidence || tokenTriviaScannerEvidence ? 'exact-parser-trivia-scanner-evidence-not-parser' : undefined,
      parserSpanCoverageBlocked ? 'exact-parser-trivia-span-coverage-blocked' : undefined,
      context.truncated ? 'source-preservation-truncated' : undefined
    ].concat(parserSpanCoverageBlocked ? parserSpanCoverageProof.blockReasonCodes ?? [] : [])) : [];
  const parserSpanCoverageReasonCodes = parserSpanCoverageProof
    ? uniqueStrings(parserSpanCoverageProof.reasonCodes ?? [])
    : [];
  const parserSpanCoverageBlockReasonCodes = parserSpanCoverageProof
    ? uniqueStrings(parserSpanCoverageProof.blockReasonCodes ?? [])
    : [];
  const status = blockReasonCodes.length ? 'blocked' : exactClaim ? 'exact' : 'approximate';
  const parserEvidence = status === 'exact'
    ? firstString(tokenTriviaParserEvidence, declaredParserEvidence, adapterId ? `parser-adapter:${adapterId}` : undefined)
    : firstString(context.parserEvidence, tokenTriviaParserEvidence, declaredParserEvidence, 'frontier-lightweight-lexical-scan');
  const reasonCodes = uniqueStrings([
    status === 'exact' ? 'exact-parser-trivia-evidence' : undefined,
    status === 'approximate' ? 'parser-trivia-proof-approximate' : undefined,
    status === 'approximate' && hasDeclaredEvidence ? 'exact-parser-trivia-evidence-not-claimed' : undefined,
    status === 'approximate' && !hasDeclaredEvidence ? 'exact-parser-trivia-evidence-missing' : undefined,
    status === 'blocked' ? 'parser-trivia-proof-stale-or-incomplete' : undefined,
    status === 'exact' && parserSpanCoverageProof?.status === 'exact' ? 'parser-token-comment-span-coverage-exact' : undefined,
    ...blockReasonCodes
  ]);
  return compactRecord({
    schema: 'frontier.lang.parserTriviaExactness.v1',
    version: 1,
    status,
    exactParserTrivia: status === 'exact',
    losslessCst: status === 'exact' && declared.losslessCst === true,
    sourcePath: context.sourcePath,
    sourceHash: observedSourceHash,
    evidenceSourceHash,
    sourceHashVerified: evidenceSourceHash && observedSourceHash ? evidenceSourceHash === observedSourceHash : undefined,
    parserEvidence,
    adapterId,
    evidenceId,
    parserSpanCoverageStatus: parserSpanCoverageProof?.status,
    parserSpanCoverageEvidenceId: firstString(parserSpanCoverageProof?.evidenceId, parserSpanCoverageProof?.id),
    parserSpanCoverageReasonCodes,
    parserSpanCoverageBlockReasonCodes,
    reasonCodes,
    blockReasonCodes,
    reviewRequired: status !== 'exact',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function createParserSpanCoverageProof(input = {}) {
  const sourceTextProvided = typeof input.sourceText === 'string';
  const sourceText = sourceTextProvided ? input.sourceText : '';
  const sourceLength = sourceText.length;
  const parserEvidence = firstString(input.parserEvidence);
  const adapterId = firstString(input.adapterId, input.parserAdapterId, input.parserId, input.adapter);
  const sourceHash = firstString(input.sourceHash, sourceTextProvided ? hashSemanticValue(sourceText) : undefined);
  const segments = arrayValue(input.segments)
    .map(normalizeCoverageSegment)
    .filter(Boolean)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  let cursor = 0;
  let coveredSourceLength = 0;
  let hasGap = false;
  let hasOverlap = false;
  let hasOutOfBounds = false;
  let hasTextMismatch = false;
  for (const segment of segments) {
    if (segment.start < 0 || segment.end > sourceLength || segment.end <= segment.start) hasOutOfBounds = true;
    if (segment.start > cursor) hasGap = true;
    if (segment.start < cursor) hasOverlap = true;
    if (typeof segment.text === 'string' && segment.text !== sourceText.slice(segment.start, segment.end)) {
      hasTextMismatch = true;
    }
    coveredSourceLength += Math.max(0, segment.end - segment.start);
    cursor = Math.max(cursor, segment.end);
  }
  const startsAtZero = sourceLength === 0 || segments[0]?.start === 0;
  const endsAtSourceLength = sourceLength === 0 ? segments.length === 0 || cursor === 0 : cursor === sourceLength;
  const parserEvidenceIsScanner = isLightweightScannerParserEvidence(parserEvidence);
  const blockReasonCodes = uniqueStrings([
    sourceTextProvided ? undefined : 'parser-span-coverage-source-text-missing',
    parserEvidence ? undefined : 'parser-span-coverage-parser-evidence-missing',
    parserEvidenceIsScanner ? 'parser-span-coverage-scanner-evidence-not-parser' : undefined,
    input.truncated ? 'parser-span-coverage-truncated' : undefined,
    sourceLength > 0 && segments.length === 0 ? 'parser-span-coverage-empty' : undefined,
    startsAtZero ? undefined : 'parser-span-coverage-start-missing',
    hasGap ? 'parser-span-coverage-gap' : undefined,
    hasOverlap ? 'parser-span-coverage-overlap' : undefined,
    hasOutOfBounds ? 'parser-span-coverage-out-of-bounds' : undefined,
    endsAtSourceLength ? undefined : 'parser-span-coverage-end-missing',
    hasTextMismatch ? 'parser-span-coverage-text-mismatch' : undefined
  ]);
  const status = blockReasonCodes.length ? 'blocked' : 'exact';
  const reasonCodes = uniqueStrings([
    status === 'exact' ? 'parser-token-comment-span-coverage-exact' : undefined,
    status === 'blocked' ? 'parser-token-comment-span-coverage-blocked' : undefined,
    ...blockReasonCodes
  ]);
  return compactRecord({
    schema: 'frontier.lang.parserSpanCoverageProof.v1',
    version: 1,
    status,
    exactParserSpans: status === 'exact',
    sourcePath: input.sourcePath,
    sourceHash,
    sourceLength: sourceTextProvided ? sourceLength : undefined,
    coveredSourceLength,
    spanCount: segments.length,
    tokenCount: numberOrUndefined(input.tokenCount),
    triviaCount: numberOrUndefined(input.triviaCount),
    commentCount: numberOrUndefined(input.commentCount),
    parserEvidence,
    adapterId,
    evidenceId: firstString(input.evidenceId, adapterId && sourceHash ? `${adapterId}:parser-span-coverage:${idFragment(sourceHash)}` : undefined),
    languageMode: input.languageMode,
    boundedLanguages: uniqueStrings(input.boundedLanguages),
    startsAtZero,
    endsAtSourceLength,
    nonOverlapping: !hasOverlap,
    contiguous: !hasGap && !hasOverlap && startsAtZero && endsAtSourceLength,
    textMatchesSource: !hasTextMismatch,
    reasonCodes,
    blockReasonCodes,
    reviewRequired: status !== 'exact',
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function createPreservedSourceOwnershipAnchor(input = {}) {
  const span = input.span ?? {};
  const text = typeof input.text === 'string' ? input.text : undefined;
  const textHash = input.textHash ?? (text === undefined ? undefined : hashSemanticValue(text));
  const sourceHash = input.sourceHash ?? span.sourceHash ?? span.sourceId;
  const sourcePath = input.sourcePath ?? span.path;
  const start = numberOrUndefined(span.start);
  const end = numberOrUndefined(span.end);
  const anchorKind = input.anchorKind ?? preservedOwnershipAnchorKind(input.kind, input.role);
  const identityAnchor = input.identityAnchor ?? preservedOwnershipIdentityAnchor(input.kind, input.role, anchorKind);
  const parserTriviaExactness = input.parserTriviaExactness ?? createParserTriviaExactnessRecord(input.parserTriviaEvidence, {
    sourcePath,
    sourceHash,
    parserEvidence: input.parserEvidence ?? 'frontier-lightweight-lexical-scan'
  });
  const parserEvidence = parserTriviaExactness.status === 'exact'
    ? firstString(parserTriviaExactness.parserEvidence, parserTriviaExactness.adapterId ? `parser-adapter:${parserTriviaExactness.adapterId}` : undefined, input.parserEvidence)
    : firstString(input.parserEvidence, parserTriviaExactness.parserEvidence, 'frontier-lightweight-lexical-scan');
  return compactRecord({
    schema: 'frontier.lang.sourceOwnershipAnchor.v1',
    version: 1,
    mode: 'exact-source-span',
    anchorKind,
    identityAnchor,
    sourcePath,
    sourceHash,
    role: input.role,
    kind: input.kind,
    textHash,
    textLength: text === undefined ? input.textLength : text.length,
    start,
    end,
    startLine: numberOrUndefined(span.startLine),
    startColumn: numberOrUndefined(span.startColumn),
    endLine: numberOrUndefined(span.endLine),
    endColumn: numberOrUndefined(span.endColumn),
    spanHash: hashSemanticValue({
      kind: 'frontier.lang.sourceOwnershipAnchor.span',
      sourcePath,
      sourceHash,
      role: input.role,
      spanKind: input.kind,
      textHash,
      start,
      end
    }),
    losslessCst: parserTriviaExactness.losslessCst === true,
    parserEvidence,
    parserTriviaExactnessStatus: parserTriviaExactness.status,
    exactParserTrivia: parserTriviaExactness.exactParserTrivia,
    parserTriviaEvidenceId: parserTriviaExactness.evidenceId,
    parserTriviaAdapterId: parserTriviaExactness.adapterId,
    parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
    parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes
  });
}

function preservedSourceSegmentRole(kind) {
  if (isCommentKind(kind) || kind === 'source-map-comment' || kind === 'whitespace' || kind === 'newline' || kind === 'shebang') return 'trivia';
  return 'token';
}

function preservedOwnershipAnchorKind(kind, role) {
  if (kind === 'source-map-comment') return 'generated-source-boundary';
  if (kind === 'shebang') return 'file-entrypoint-directive';
  if (role === 'directive' && kind === 'runtime-directive') return 'directive-prologue';
  if (role === 'directive') return 'source-directive';
  if (role === 'protected') return 'protected-source-span';
  if (kind === 'jsdoc-comment') return 'jsdoc-comment-trivia';
  if (kind === 'block-comment') return 'block-comment-trivia';
  if (kind === 'comment') return 'comment-trivia';
  if (kind === 'whitespace' || kind === 'newline') return 'formatting-trivia';
  return 'lexical-source-span';
}

function preservedOwnershipIdentityAnchor(kind, role, anchorKind) {
  if (role === 'directive' && kind === 'runtime-directive') return 'runtime-directive-prologue';
  if (kind === 'source-map-comment') return 'source-map-comment';
  if (kind === 'jsdoc-comment') return 'jsdoc-comment';
  if (kind === 'block-comment') return 'block-comment';
  if (kind === 'typescript-reference') return 'typescript-reference';
  return anchorKind ?? kind ?? role;
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment';
}

function numberOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined;
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeCoverageSegment(entry) {
  const span = entry?.span ?? entry;
  const start = numberOrUndefined(span?.start);
  const end = numberOrUndefined(span?.end);
  if (start === undefined || end === undefined) return undefined;
  return {
    start,
    end,
    text: typeof entry?.text === 'string' ? entry.text : undefined
  };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function isLightweightScannerParserEvidence(value) {
  return value === 'frontier-lightweight-lexical-scan' || value === 'frontier-lightweight-js-ts-source-ledger';
}

export {
  createParserSpanCoverageProof,
  createParserTriviaExactnessRecord,
  createPreservedSourceOwnershipAnchor,
  preservedOwnershipAnchorKind,
  preservedSourceSegmentRole
};
