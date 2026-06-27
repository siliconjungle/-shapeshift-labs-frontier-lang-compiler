import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { createParserTriviaExactnessRecord } from '../../native-source-preservation-ownership.js';
import {
  sourceFileOwnershipEvidence,
  sourceSpanOwnershipAnchor,
  sourceSpanOwnershipBlockReasonCodes
} from './projectSymbolGraphSourceRecordsOwnership.js';
import {
  sourceMapGeneratedBoundaryGateForImport,
  sourceMapGeneratedBoundaryRecord,
  sourceMapGeneratedBoundaryRecordForSpan,
  sourceMapsForImport
} from './projectSymbolGraphSourceMapGeneratedBoundary.js';

function createProjectSourceEvidenceRecords(imports) {
  const records = imports.map(sourceRecordsForImport).filter(Boolean);
  return {
    sourceFileRecords: uniqueRecords(records.flatMap((record) => record.sourceFileRecords)),
    sourceSpanRecords: uniqueRecords(records.flatMap((record) => record.sourceSpanRecords))
  };
}

function sourceRecordsForImport(imported) {
  const preservation = sourcePreservationForImport(imported);
  const sourcePath = preservation?.sourcePath ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
  if (!preservation || !sourcePath) return undefined;
  const sourceHash = preservation.sourceHash ?? imported?.nativeSource?.sourceHash ?? imported?.metadata?.sourceHash;
  const sourceMaps = sourceMapsForImport(imported);
  const generatedBoundaryGate = sourceMapGeneratedBoundaryGateForImport(imported, sourceMaps, { preservation, sourcePath, sourceHash });
  const context = { preservation, sourcePath, sourceHash, sourceMaps, generatedBoundaryGate };
  return {
    sourceFileRecords: [sourceFileRecord(context)],
    sourceSpanRecords: sourceSpanRecords(context)
  };
}

function sourceFileRecord(context) {
  const summary = context.preservation.summary ?? {};
  const ledger = summary.ledger ?? {};
  const ownership = sourceFileOwnershipEvidence(context, summary);
  const parserTriviaExactness = parserTriviaExactnessForPreservation(context.preservation);
  const generatedBoundary = sourceMapGeneratedBoundaryRecord(context, summary);
  return compactRecord({
    id: `source_file_${idFragment(context.sourcePath)}`,
    sourcePath: context.sourcePath,
    language: context.preservation.language,
    sourceHash: context.sourceHash,
    preservationId: context.preservation.id,
    sourceBytes: context.preservation.sourceBytes,
    lineCount: context.preservation.lineCount,
    newline: context.preservation.newline,
    encoding: context.preservation.encoding,
    exactSourceAvailable: summary.exactSourceAvailable,
    tokenCount: summary.tokens,
    triviaCount: summary.trivia,
    directiveCount: summary.directives,
    commentCount: summary.comments,
    whitespaceCount: summary.whitespace,
    sourceMapCommentCount: summary.sourceMapComments ?? ledger.sourceMapComments,
    protectedRegionCount: summary.protectedRegions ?? ledger.protectedRegions,
    importExportSpanCount: summary.importExportSpans ?? ledger.importExportSpans,
    braceCount: summary.braces ?? ledger.braces,
    truncated: summary.truncated,
    sourceTextHash: typeof context.preservation.sourceText === 'string' ? hashSemanticValue(context.preservation.sourceText) : undefined,
    roundtripHash: context.sourceHash,
    parserEvidence: ownership.parserEvidence,
    losslessCst: parserTriviaExactness.losslessCst === true,
    parserTriviaExactnessStatus: parserTriviaExactness.status,
    exactParserTrivia: parserTriviaExactness.exactParserTrivia,
    parserTriviaEvidenceId: parserTriviaExactness.evidenceId,
    parserTriviaAdapterId: parserTriviaExactness.adapterId,
    parserSpanCoverageStatus: parserTriviaExactness.parserSpanCoverageStatus,
    parserSpanCoverageEvidenceId: parserTriviaExactness.parserSpanCoverageEvidenceId,
    parserSpanCoverageReasonCodes: parserTriviaExactness.parserSpanCoverageReasonCodes,
    parserSpanCoverageBlockReasonCodes: parserTriviaExactness.parserSpanCoverageBlockReasonCodes,
    parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
    parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes,
    sourceLedgerAvailable: ownership.sourceLedgerAvailable,
    triviaOwnershipStatus: ownership.status,
    triviaOwnershipReasonCodes: ownership.reasonCodes,
    triviaOwnershipBlockReasonCodes: ownership.blockReasonCodes,
    ownershipAnchorMode: 'exact-source-span',
    generatedSourceBoundaryEvidence: ownership.generatedSourceBoundaryEvidence,
    ...generatedBoundary,
    shapeHash: hashSemanticValue({ kind: 'frontier.lang.projectSourceFileShape', sourcePath: context.sourcePath, sourceHash: context.sourceHash, summary })
  });
}

function sourceSpanRecords(context) {
  const preservation = context.preservation;
  const ledgerSpans = Array.isArray(preservation.ledger?.spans) ? preservation.ledger.spans : [];
  const spans = ledgerSpans.length ? ledgerSpans : fallbackSpans(preservation);
  const identityCounts = new Map();
  return spans.map((span, index) => {
    const sourceSpan = span.span;
    if (!sourceSpan) return undefined;
    const role = span.role ?? fallbackRole(span.kind);
    const ownershipAnchor = sourceSpanOwnershipAnchor(span, role, context, spans, index);
    const ownershipBlockReasonCodes = sourceSpanOwnershipBlockReasonCodes(span, ownershipAnchor, context);
    const identitySeed = sourceSpanIdentitySeed(span, role, context, ownershipAnchor);
    const occurrence = (identityCounts.get(identitySeed) ?? 0) + 1;
    identityCounts.set(identitySeed, occurrence);
    const identityKey = occurrence === 1 ? identitySeed : stableKey([identitySeed, occurrence]);
    return sourceSpanRecord(span, index, context, { role, identityKey, occurrence, ownershipAnchor, ownershipBlockReasonCodes });
  }).filter(Boolean);
}

function sourceSpanRecord(span, index, context, identity) {
  const sourceSpan = span.span;
  if (!sourceSpan) return undefined;
  const role = identity?.role ?? span.role ?? fallbackRole(span.kind);
  const identityKey = identity?.identityKey ?? sourceSpanIdentitySeed(span, role, context);
  const textLength = typeof span.text === 'string' ? span.text.length : undefined;
  const trivia = role === 'trivia' || role === 'comment' || isCommentKind(span.kind) || span.kind === 'source-map-comment' || undefined;
  const directive = role === 'directive' || span.kind === 'runtime-directive' || span.kind === 'module-directive' || span.kind === 'typescript-reference' || undefined;
  const protectedSpan = role === 'protected' || undefined;
  const baseOwnershipAnchor = identity?.ownershipAnchor ?? sourceSpanOwnershipAnchor(span, role, context, [], index);
  const ownershipAnchor = baseOwnershipAnchor ? { ...baseOwnershipAnchor, key: identityKey, identityKey, identityOccurrence: identity?.occurrence } : undefined;
  const ownershipAnchorKey = ownershipAnchor?.key ?? ownershipAnchor?.identityKey;
  const ownershipBlockReasonCodes = identity?.ownershipBlockReasonCodes ?? sourceSpanOwnershipBlockReasonCodes(span, ownershipAnchor, context);
  const ownershipAnchorStatus = ownershipBlockReasonCodes.length ? 'blocked' : 'deterministic-lightweight';
  const parserTriviaExactness = parserTriviaExactnessForPreservation(context.preservation);
  const parserEvidence = parserEvidenceForPreservation(context.preservation, parserTriviaExactness);
  const parserTriviaOwnershipStatus = ownershipAnchor?.parserTriviaOwnershipStatus;
  const parserTriviaOwnershipRelation = ownershipAnchor?.parserTriviaOwnershipRelation;
  const parserTriviaOwnershipReasonCodes = ownershipAnchor?.parserTriviaOwnershipReasonCodes;
  const parserTriviaOwnershipBlockReasonCodes = ownershipAnchor?.parserTriviaOwnershipBlockReasonCodes;
  const generatedBoundary = sourceMapGeneratedBoundaryRecordForSpan(context, span);
  const ownershipAnchorHash = ownershipAnchor ? hashSemanticValue({
    kind: 'frontier.lang.projectSourceSpanOwnershipAnchor',
    ownershipAnchor,
    identityKey,
    sourcePath: context.sourcePath
  }) : undefined;
  return compactRecord({
    id: `source_span_${idFragment(context.sourcePath)}_${index + 1}`,
    stableId: `source_span_${idFragment(identityKey)}`,
    identityKey,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    preservationId: context.preservation.id,
    sourceSpan,
    start: sourceSpan.start,
    end: sourceSpan.end,
    role,
    kind: span.kind,
    ordinal: index + 1,
    identityOccurrence: identity?.occurrence,
    textHash: span.textHash,
    textLength,
    trivia,
    directive,
    protected: protectedSpan,
    ownershipAnchor,
    ownershipAnchorKey,
    ownershipAnchorHash,
    ownershipAnchorStatus,
    ownershipBlockReasonCodes,
    parserEvidence,
    losslessCst: parserTriviaExactness.losslessCst === true,
    parserTriviaExactnessStatus: parserTriviaExactness.status,
    exactParserTrivia: parserTriviaExactness.exactParserTrivia,
    parserTriviaEvidenceId: parserTriviaExactness.evidenceId,
    parserTriviaAdapterId: parserTriviaExactness.adapterId,
    parserSpanCoverageStatus: parserTriviaExactness.parserSpanCoverageStatus,
    parserSpanCoverageEvidenceId: parserTriviaExactness.parserSpanCoverageEvidenceId,
    parserSpanCoverageReasonCodes: parserTriviaExactness.parserSpanCoverageReasonCodes,
    parserSpanCoverageBlockReasonCodes: parserTriviaExactness.parserSpanCoverageBlockReasonCodes,
    parserTriviaExactnessReasonCodes: parserTriviaExactness.reasonCodes,
    parserTriviaExactnessBlockReasonCodes: parserTriviaExactness.blockReasonCodes,
    parserTriviaOwnershipStatus,
    parserTriviaOwnershipRelation,
    parserTriviaOwnershipReasonCodes,
    parserTriviaOwnershipBlockReasonCodes,
    ...generatedBoundary,
    roundtripHash: context.sourceHash,
    stableHash: hashSemanticValue({ kind: 'frontier.lang.projectSourceSpanStableEvidence', sourcePath: context.sourcePath, role, spanKind: span.kind, textHash: span.textHash, textLength, trivia, directive, protected: protectedSpan, ownershipAnchorKey, ownershipAnchorStatus, parserTriviaOwnershipStatus, parserTriviaOwnershipRelation, parserTriviaOwnershipBlockReasonCodes }),
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectSourceSpanSignature', sourcePath: context.sourcePath, role, spanKind: span.kind, textHash: span.textHash, sourceSpan: semanticSpanForHash(sourceSpan), ownershipAnchorKey })
  });
}

function sourceSpanIdentitySeed(span, role, context, ownershipAnchor) {
  return stableKey(['source-span', context.sourcePath, role, span.kind, sourceSpanIdentityAnchor(span, role, ownershipAnchor)]);
}

function sourceSpanIdentityAnchor(span, role, ownershipAnchor) {
  if (ownershipAnchor?.identityAnchor) return ownershipAnchor.identityAnchor;
  if (role === 'directive') {
    if (span.kind === 'runtime-directive') return 'runtime-directive-prologue';
    if (span.kind === 'source-map-comment') return 'source-map-comment';
    if (span.kind === 'typescript-reference') return 'typescript-reference';
    if (span.kind === 'shebang') return 'file-entrypoint-directive';
    return span.textHash ?? span.kind ?? 'directive';
  }
  if (span.kind === 'source-map-comment') return 'source-map-comment';
  if (role === 'protected') return stableKey(['protected', span.textHash ?? span.kind]);
  if (role === 'comment' || role === 'trivia') return stableKey(['trivia', span.textHash ?? span.kind]);
  return span.textHash ?? span.kind ?? role;
}

function fallbackSpans(preservation) {
  return [
    ...(preservation.trivia ?? []).map((span) => ({ ...span, role: fallbackRole(span.kind) })),
    ...(preservation.directives ?? []).map((span) => ({ ...span, role: 'directive' }))
  ];
}

function sourcePreservationForImport(imported) {
  return imported?.metadata?.sourcePreservation
    ?? imported?.nativeSource?.metadata?.sourcePreservation
    ?? imported?.nativeAst?.metadata?.sourcePreservation
    ?? imported?.universalAst?.metadata?.sourcePreservation;
}

function semanticSpanForHash(span) {
  return { path: span.path, start: span.start, end: span.end, startLine: span.startLine, startColumn: span.startColumn, endLine: span.endLine, endColumn: span.endColumn };
}

function parserTriviaExactnessForPreservation(preservation) {
  const existing = preservation?.metadata?.parserTriviaExactness;
  const tokenTriviaParserEvidence = parserTokenTriviaEvidenceForPreservation(preservation);
  if (existing?.status === 'exact' || existing?.exactParserTrivia === true) {
    return createParserTriviaExactnessRecord(existing, {
      sourcePath: preservation?.sourcePath,
      sourceHash: preservation?.sourceHash,
      parserEvidence: tokenTriviaParserEvidence,
      parserTokenTriviaEvidence: tokenTriviaParserEvidence,
      parserSpanCoverageProof: preservation?.metadata?.parserSpanCoverageProof,
      truncated: preservation?.summary?.truncated === true
    });
  }
  return existing ?? {
    status: preservation?.summary?.parserTriviaExactnessStatus ?? 'approximate',
    exactParserTrivia: preservation?.summary?.exactParserTrivia === true,
    reasonCodes: preservation?.summary?.parserTriviaExactnessReasonCodes ?? ['parser-trivia-proof-approximate'],
    blockReasonCodes: preservation?.summary?.parserTriviaExactnessBlockReasonCodes ?? []
  };
}

function parserEvidenceForPreservation(preservation, parserTriviaExactness) {
  const lightweightEvidence = preservation?.ledger?.summary ? 'frontier-lightweight-js-ts-source-ledger' : 'frontier-lightweight-lexical-scan';
  if (parserTriviaExactness?.status !== 'exact') return lightweightEvidence;
  return firstString(parserTriviaExactness.parserEvidence, parserTokenTriviaEvidenceForPreservation(preservation), parserTriviaExactness.adapterId ? `parser-adapter:${parserTriviaExactness.adapterId}` : undefined, lightweightEvidence);
}

function parserTokenTriviaEvidenceForPreservation(preservation) {
  const lightweightEvidence = preservation?.ledger?.summary ? 'frontier-lightweight-js-ts-source-ledger' : 'frontier-lightweight-lexical-scan';
  return firstString(preservation?.metadata?.tokenization, preservation?.metadata?.parserTokenTriviaEvidence, lightweightEvidence);
}

function fallbackRole(kind) {
  if (isCommentKind(kind) || kind === 'source-map-comment' || kind === 'whitespace' || kind === 'newline' || kind === 'shebang') return 'trivia';
  return 'token';
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment';
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function firstString(...values) { return values.find((value) => typeof value === 'string' && value.length > 0); }
function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.id ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { createProjectSourceEvidenceRecords };
