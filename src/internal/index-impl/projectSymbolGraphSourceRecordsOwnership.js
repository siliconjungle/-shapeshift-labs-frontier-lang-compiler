import {
  createParserTriviaExactnessRecord,
  createPreservedSourceOwnershipAnchor
} from '../../native-source-preservation-ownership.js';

function sourceFileOwnershipEvidence(context, summary) {
  const reasonCodes = [];
  const blockReasonCodes = [];
  const hasExactSourceText = summary.exactSourceAvailable === true && typeof context.preservation.sourceText === 'string';
  const sourceLedgerAvailable = Boolean(context.preservation.ledger?.summary);
  const parserTriviaExactness = parserTriviaExactnessForContext(context);
  const exactParserTrivia = parserTriviaExactness.status === 'exact' && parserTriviaExactness.exactParserTrivia === true;
  reasonCodes.push(parserTriviaExactness.losslessCst === true ? 'lossless-cst-available' : 'lossless-cst-unavailable');
  if (hasExactSourceText) reasonCodes.push('exact-source-text');
  else blockReasonCodes.push('source-text-unavailable-for-trivia-ownership');
  if (summary.truncated) blockReasonCodes.push('source-preservation-truncated');
  if (sourceLedgerAvailable) reasonCodes.push('source-ledger-spans');
  else if (isJavaScriptTypeScriptEvidence(context)) blockReasonCodes.push('js-ts-source-ledger-missing');
  reasonCodes.push(...(parserTriviaExactness.reasonCodes ?? []));
  blockReasonCodes.push(...(parserTriviaExactness.blockReasonCodes ?? []));
  const parserEvidence = parserEvidenceForContext(context, parserTriviaExactness);
  return {
    status: blockReasonCodes.length ? 'blocked' : exactParserTrivia ? 'exact' : 'deterministic-lightweight',
    reasonCodes: uniqueStrings([...reasonCodes, ...blockReasonCodes]),
    blockReasonCodes: uniqueStrings(blockReasonCodes),
    parserEvidence,
    sourceLedgerAvailable,
    generatedSourceBoundaryEvidence: (summary.sourceMapComments ?? summary.ledger?.sourceMapComments ?? 0) > 0 ? 'source-map-comment-detected' : undefined,
    parserTriviaExactness
  };
}

function sourceSpanOwnershipAnchor(span, role, context, spans, index) {
  const before = nearestOwnershipBoundary(spans, index, -1);
  const after = nearestOwnershipBoundary(spans, index, 1);
  const anchorKind = sourceSpanOwnershipAnchorKind(span, role);
  const identityAnchor = sourceSpanOwnershipIdentityAnchor(span, role, before, after);
  const parserTriviaExactness = parserTriviaExactnessForContext(context);
  const parserEvidence = parserEvidenceForContext(context, parserTriviaExactness);
  const parserTriviaOwnership = sourceSpanParserTriviaOwnership(span, role, parserTriviaExactness, before, after);
  const base = span.ownershipAnchor ?? createPreservedSourceOwnershipAnchor({
    kind: span.kind,
    role,
    text: span.text,
    textHash: span.textHash,
    textLength: typeof span.text === 'string' ? span.text.length : undefined,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    span: span.span,
    anchorKind,
    identityAnchor,
    parserEvidence,
    parserTriviaExactness
  });
  const key = base?.key ?? stableKey(['source-ownership', context.sourcePath, role, span.kind, base?.identityAnchor ?? identityAnchor ?? base?.spanHash]);
  return compactRecord({
    ...base,
    key,
    identityKey: base?.identityKey ?? key,
    identityAnchor: base?.identityAnchor ?? identityAnchor,
    boundaryBefore: ownershipBoundaryRecord(before),
    boundaryAfter: ownershipBoundaryRecord(after),
    insertionAnchor: sourceSpanInsertionAnchor(role, span, ownershipBoundaryRecord(before), ownershipBoundaryRecord(after)),
    parserEvidence,
    losslessCst: parserTriviaExactness.losslessCst === true,
    parserTriviaExactnessStatus: parserTriviaExactness.status,
    exactParserTrivia: parserTriviaExactness.exactParserTrivia,
    parserTriviaEvidenceId: parserTriviaExactness.evidenceId,
    parserTriviaAdapterId: parserTriviaExactness.adapterId,
    parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
    parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes,
    ...parserTriviaOwnership
  });
}

function sourceSpanOwnershipBlockReasonCodes(span, ownershipAnchor, context) {
  const parserTriviaExactness = parserTriviaExactnessForContext(context);
  return uniqueStrings([
    ownershipAnchor ? undefined : 'source-ownership-anchor-missing',
    context.preservation.summary?.exactSourceAvailable === true && typeof context.preservation.sourceText === 'string' ? undefined : 'source-text-unavailable-for-trivia-ownership',
    context.preservation.summary?.truncated ? 'source-preservation-truncated' : undefined,
    !span.span ? 'source-span-missing' : undefined,
    !context.sourceHash ? 'source-hash-missing' : undefined,
    ...(parserTriviaExactness.blockReasonCodes ?? [])
  ]);
}

function parserTriviaExactnessForContext(context) {
  const parserEvidence = parserTokenTriviaEvidenceForContext(context);
  const existing = context.preservation.metadata?.parserTriviaExactness;
  if (existing?.status === 'exact' || existing?.exactParserTrivia === true) {
    return createParserTriviaExactnessRecord(existing, {
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      parserEvidence,
      parserTokenTriviaEvidence: parserEvidence,
      truncated: context.preservation.summary?.truncated === true
    });
  }
  return existing ?? createParserTriviaExactnessRecord(context.preservation.metadata?.parserTriviaEvidence, {
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    parserEvidence,
    parserTokenTriviaEvidence: parserEvidence,
    truncated: context.preservation.summary?.truncated === true
  });
}

function parserEvidenceForContext(context, parserTriviaExactness) {
  const lightweightEvidence = lightweightParserEvidenceForContext(context);
  if (parserTriviaExactness?.status !== 'exact') return lightweightEvidence;
  return firstString(parserTriviaExactness.parserEvidence, parserTriviaExactness.adapterId ? `parser-adapter:${parserTriviaExactness.adapterId}` : undefined, lightweightEvidence);
}

function parserTokenTriviaEvidenceForContext(context) {
  return firstString(
    context.preservation.metadata?.tokenization,
    context.preservation.metadata?.parserTokenTriviaEvidence,
    lightweightParserEvidenceForContext(context)
  );
}

function lightweightParserEvidenceForContext(context) {
  return context.preservation.ledger?.summary ? 'frontier-lightweight-js-ts-source-ledger' : 'frontier-lightweight-lexical-scan';
}

function sourceSpanOwnershipAnchorKind(span, role) {
  if (span.kind === 'source-map-comment') return 'generated-source-boundary';
  if (span.kind === 'shebang') return 'file-entrypoint-directive';
  if (role === 'directive' && span.kind === 'runtime-directive') return 'directive-prologue';
  if (role === 'directive') return 'source-directive';
  if (role === 'protected') return 'protected-source-span';
  if (role === 'comment' || role === 'trivia' || isCommentKind(span.kind)) return sourceCommentAnchorKind(span.kind);
  return 'lexical-source-span';
}

function sourceSpanOwnershipIdentityAnchor(span, role, before, after) {
  if (role === 'directive') {
    if (span.kind === 'runtime-directive') return 'runtime-directive-prologue';
    if (span.kind === 'source-map-comment') return 'source-map-comment';
    if (span.kind === 'typescript-reference') return 'typescript-reference';
    if (span.kind === 'module-directive') return span.textHash ?? span.kind;
    if (span.kind === 'shebang') return 'file-entrypoint-directive';
    return stableKey(['directive', span.kind, boundaryIdentity(before), boundaryIdentity(after)]);
  }
  if (span.kind === 'source-map-comment') return 'source-map-comment';
  if (role === 'protected') return stableKey(['protected', span.kind, boundaryIdentity(before), boundaryIdentity(after)]);
  if (role === 'comment' || role === 'trivia' || isCommentKind(span.kind) || span.kind === 'shebang') {
    return stableKey(['trivia', span.kind, boundaryIdentity(before), boundaryIdentity(after)]);
  }
  return span.textHash ?? span.kind ?? role;
}

function sourceSpanParserTriviaOwnership(span, role, parserTriviaExactness, before, after) {
  const relation = sourceSpanParserTriviaOwnershipRelation(span, role, before, after);
  if (!relation) return undefined;
  const exact = parserTriviaExactness.status === 'exact' && parserTriviaExactness.exactParserTrivia === true;
  const blockReasonCodes = exact ? [] : uniqueStrings([
    'exact-parser-trivia-ownership-requires-parser-evidence',
    parserTriviaExactness.status === 'blocked' ? 'exact-parser-trivia-ownership-blocked' : undefined,
    ...(parserTriviaExactness.blockReasonCodes ?? [])
  ]);
  return compactRecord({
    parserTriviaOwnershipStatus: exact ? 'exact' : 'blocked',
    parserTriviaOwnershipRelation: relation,
    parserTriviaOwnershipReasonCodes: uniqueStrings([
      exact ? 'exact-parser-trivia-ownership' : 'exact-parser-trivia-ownership-blocked',
      relationReasonCode(relation),
      ...(parserTriviaExactness.reasonCodes ?? [])
    ]),
    parserTriviaOwnershipBlockReasonCodes: blockReasonCodes
  });
}

function sourceSpanParserTriviaOwnershipRelation(span, role, before, after) {
  if (role === 'directive') {
    if (span.kind === 'runtime-directive') return 'directive-prologue';
    if (span.kind === 'source-map-comment') return 'generated-source-boundary';
    if (span.kind === 'shebang') return 'file-entrypoint-directive';
    return 'source-directive';
  }
  if (span.kind === 'source-map-comment') return 'generated-source-boundary';
  if (span.kind === 'shebang') return 'file-entrypoint-directive';
  if (!isCommentKind(span.kind)) return undefined;
  if (span.kind === 'jsdoc-comment') return 'jsdoc-comment';
  if (span.kind === 'block-comment') return 'block-comment';
  if (sameLineTrailingComment(span, before)) return 'trailing-comment';
  if (after) return 'leading-comment';
  if (before) return 'trailing-comment';
  return 'file-comment';
}

function sameLineTrailingComment(span, before) {
  const commentStartLine = span?.span?.startLine;
  const beforeEndLine = before?.span?.endLine ?? before?.span?.startLine;
  return Number.isFinite(commentStartLine)
    && Number.isFinite(beforeEndLine)
    && commentStartLine === beforeEndLine
    && Number.isFinite(before?.span?.end)
    && Number.isFinite(span?.span?.start)
    && before.span.end <= span.span.start;
}

function relationReasonCode(relation) {
  if (relation === 'directive-prologue') return 'directive-prologue-ownership';
  if (relation === 'leading-comment') return 'leading-comment-ownership';
  if (relation === 'trailing-comment') return 'trailing-comment-ownership';
  if (relation === 'jsdoc-comment') return 'jsdoc-comment-ownership';
  if (relation === 'block-comment') return 'block-comment-ownership';
  if (relation === 'generated-source-boundary') return 'generated-source-boundary-ownership';
  if (relation === 'file-entrypoint-directive') return 'file-entrypoint-directive-ownership';
  if (relation === 'file-comment') return 'file-comment-ownership';
  return 'source-directive-ownership';
}

function sourceSpanInsertionAnchor(role, span, before, after) {
  if (!(role === 'comment' || role === 'trivia' || isCommentKind(span.kind) || span.kind === 'source-map-comment' || span.kind === 'shebang')) return undefined;
  return compactRecord({
    mode: before && after ? 'between' : before ? 'after' : after ? 'before' : 'file',
    anchorKind: span.kind === 'source-map-comment' ? 'generated-source-boundary' : 'trivia-insertion',
    before,
    after,
    reasonCodes: [
      before ? 'nearest-previous-source-span' : 'file-start-boundary',
      after ? 'nearest-next-source-span' : 'file-end-boundary'
    ]
  });
}

function nearestOwnershipBoundary(spans, index, direction) {
  for (let cursor = index + direction; cursor >= 0 && cursor < spans.length; cursor += direction) {
    const span = spans[cursor];
    if (isOwnershipBoundarySpan(span)) return span;
  }
  return undefined;
}

function isOwnershipBoundarySpan(span) {
  const role = span?.role ?? fallbackRole(span?.kind);
  if (!span?.span) return false;
  if (role === 'trivia' || role === 'comment') return false;
  if (span.kind === 'whitespace' || span.kind === 'newline' || isCommentKind(span.kind) || span.kind === 'source-map-comment') return false;
  return true;
}

function ownershipBoundaryRecord(span) {
  if (!span) return undefined;
  const role = span.role ?? fallbackRole(span.kind);
  return compactRecord({
    key: boundaryIdentity(span),
    role,
    kind: span.kind,
    textHash: span.textHash,
    startLine: span.span?.startLine,
    startColumn: span.span?.startColumn,
    endLine: span.span?.endLine,
    endColumn: span.span?.endColumn
  });
}

function boundaryIdentity(span) {
  if (!span) return undefined;
  const role = span.role ?? fallbackRole(span.kind);
  return stableKey(['boundary', role, span.kind, span.textHash]);
}

function isJavaScriptTypeScriptEvidence(context) {
  const language = String(context.preservation.language ?? '').toLowerCase();
  if (language === 'javascript' || language === 'typescript') return true;
  return /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/i.test(String(context.sourcePath ?? ''));
}

function fallbackRole(kind) {
  if (isCommentKind(kind) || kind === 'source-map-comment' || kind === 'whitespace' || kind === 'newline' || kind === 'shebang') return 'trivia';
  return 'token';
}

function sourceCommentAnchorKind(kind) {
  if (kind === 'jsdoc-comment') return 'jsdoc-comment-trivia';
  if (kind === 'block-comment') return 'block-comment-trivia';
  return 'comment-trivia';
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment';
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

export {
  sourceFileOwnershipEvidence,
  sourceSpanOwnershipAnchor,
  sourceSpanOwnershipBlockReasonCodes
};
