import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { createSemanticLineageEvent } from './semanticLineageRecords.js';

export function matchExactAnchors(beforeSymbols, afterSymbols) {
  const afterByKey = new Map(afterSymbols.map((symbol) => [symbol.anchor.key, symbol]));
  const matched = [];
  const unmatchedBefore = [];
  const matchedAfterKeys = new Set();
  for (const before of beforeSymbols) {
    const after = afterByKey.get(before.anchor.key);
    if (after && anchorsSameLocation(before.anchor, after.anchor)) {
      matched.push({ before: symbolSummary(before), after: symbolSummary(after) });
      matchedAfterKeys.add(after.anchor.key);
    } else {
      unmatchedBefore.push(before);
    }
  }
  return {
    matched,
    unmatchedBefore,
    unmatchedAfter: afterSymbols.filter((symbol) => !matchedAfterKeys.has(symbol.anchor.key))
  };
}

export function matchLineageCandidates(beforeSymbols, afterSymbols, input, options) {
  const claimedAfter = new Set();
  const events = [];
  const ambiguous = [];
  const unmatchedBefore = [];
  for (const before of beforeSymbols) {
    const ranked = afterSymbols
      .filter((after) => !claimedAfter.has(after.anchor.key))
      .map((after) => ({ after, score: scoreLineagePair(before, after) }))
      .filter((candidate) => candidate.score.confidence >= options.minConfidence)
      .sort(compareCandidateScores);
    const best = ranked[0];
    const runnerUp = ranked[1];
    if (!best) {
      unmatchedBefore.push(before);
      continue;
    }
    if (runnerUp && best.score.confidence - runnerUp.score.confidence < options.ambiguityMargin) {
      ambiguous.push(ambiguousMatch(before, ranked));
      unmatchedBefore.push(before);
      continue;
    }
    claimedAfter.add(best.after.anchor.key);
    events.push(inferredEvent(before, best.after, best.score, input));
  }
  return {
    events,
    ambiguous,
    unmatchedBefore,
    unmatchedAfter: afterSymbols.filter((symbol) => !claimedAfter.has(symbol.anchor.key))
  };
}

export function symbolSummary(symbol) {
  return {
    key: symbol.anchor.key,
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    language: symbol.language,
    sourcePath: symbol.anchor.sourcePath,
    sourceHash: symbol.anchor.sourceHash,
    sourceSpan: symbol.anchor.sourceSpan,
    signatureHash: symbol.signatureHash,
    bodyHash: symbol.spanHash,
    ownershipRegionKind: symbol.ownershipRegionKind
  };
}

function ambiguousMatch(before, ranked) {
  return {
    before: symbolSummary(before),
    candidates: ranked.slice(0, 4).map((candidate) => ({
      after: symbolSummary(candidate.after),
      confidence: candidate.score.confidence,
      reasons: candidate.score.reasons
    })),
    reasonCodes: ['ambiguous-lineage-candidates']
  };
}

function compareCandidateScores(left, right) {
  return right.score.confidence - left.score.confidence
    || String(left.after.anchor.key).localeCompare(String(right.after.anchor.key));
}

function inferredEvent(before, after, score, input) {
  const nameChanged = before.anchor.symbolName
    && after.anchor.symbolName
    && before.anchor.symbolName !== after.anchor.symbolName;
  const pathChanged = before.anchor.sourcePath !== after.anchor.sourcePath;
  const spanMoved = JSON.stringify(before.anchor.sourceSpan ?? null) !== JSON.stringify(after.anchor.sourceSpan ?? null);
  const eventKind = nameChanged ? 'renamed' : 'moved';
  return createSemanticLineageEvent({
    id: `lineage_inferred_${idFragment(firstString(input.id, before.anchor.key))}_${idFragment(after.anchor.key)}`,
    createdAt: input.generatedAt,
    eventKind,
    from: before.anchor,
    to: after.anchor,
    confidence: score.confidence,
    actor: input.actor,
    actorId: input.actorId,
    actorRole: input.actorRole ?? 'semantic-lineage-inference',
    operationId: input.operationId,
    deps: input.deps,
    heads: input.heads,
    stateVector: input.stateVector,
    evidenceIds: [input.evidenceId ?? `evidence_${idFragment(input.id ?? before.anchor.key)}_lineage_inference`],
    signatureHashMatch: score.reasons.includes('signature-hash-match'),
    bodyHashMatch: score.reasons.includes('body-hash-match'),
    pathMatch: !pathChanged,
    sourceSpanMoved: pathChanged || spanMoved,
    conflictKeys: uniqueStrings([before.anchor.key, after.anchor.key]),
    metadata: {
      inferred: true,
      algorithm: 'frontier.semantic-lineage-inference.v1',
      reasonCodes: score.reasons,
      moved: pathChanged || spanMoved,
      renamed: nameChanged,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
}

function scoreLineagePair(before, after) {
  const reasons = [];
  let score = 0;
  const add = (value, reason) => {
    score += value;
    reasons.push(reason);
  };
  if (before.anchor.key && before.anchor.key === after.anchor.key) add(0.4, 'anchor-key-match');
  if (before.name && before.name === after.name) add(0.28, 'symbol-name-match');
  if (before.kind && before.kind === after.kind) add(0.12, 'symbol-kind-match');
  if (before.signatureHash && before.signatureHash === after.signatureHash) add(0.52, 'signature-hash-match');
  if (before.spanHash && before.spanHash === after.spanHash) add(0.22, 'body-hash-match');
  if (before.anchor.kind && before.anchor.kind === after.anchor.kind) add(0.06, 'anchor-kind-match');
  if (before.anchor.sourcePath && before.anchor.sourcePath === after.anchor.sourcePath) add(0.04, 'source-path-match');
  if (sourceSpanRangeSame(before.anchor.sourceSpan, after.anchor.sourceSpan)) add(0.18, 'source-span-range-match');
  if (before.ownershipRegionKind && before.ownershipRegionKind === after.ownershipRegionKind) add(0.04, 'ownership-kind-match');
  if (before.nativeAstNodeId && before.nativeAstNodeId === after.nativeAstNodeId) add(0.06, 'native-node-id-match');
  if (before.anchor.sourcePath !== after.anchor.sourcePath && (before.name === after.name || before.signatureHash === after.signatureHash)) add(0.04, 'source-path-moved');
  return { confidence: Math.max(0, Math.min(1, Number(score.toFixed(3)))), reasons };
}

function anchorsSameLocation(before, after) {
  return (before.sourcePath ?? '') === (after.sourcePath ?? '')
    && JSON.stringify(before.sourceSpan ?? null) === JSON.stringify(after.sourceSpan ?? null);
}

function sourceSpanRangeSame(before, after) {
  return before
    && after
    && before.startLine === after.startLine
    && before.startColumn === after.startColumn
    && before.endLine === after.endLine
    && before.endColumn === after.endColumn;
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}
