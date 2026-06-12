import { idFragment, uniqueStrings } from '../../native-import-utils.js';
import { addIdentityHashEvidence, addSourceHashEvidence, hashEvidenceSummary } from './semanticLineageHashEvidence.js';
import { createSemanticLineageEvent } from './semanticLineageRecords.js';

export function matchExactAnchors(beforeSymbols, afterSymbols) {
  const afterByKey = new Map(afterSymbols.map((symbol) => [symbol.anchor.key, symbol]));
  const matched = [];
  const unmatchedBefore = [];
  const matchedAfterKeys = new Set();
  for (const before of beforeSymbols) {
    const after = afterByKey.get(before.anchor.key);
    if (after) {
      matched.push({
        before: symbolSummary(before),
        after: symbolSummary(after),
        sourceSpanMoved: !anchorsSameLocation(before.anchor, after.anchor)
      });
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
  const rankedByBefore = beforeSymbols.map((before) => ({
    before,
    ranked: rankLineageCandidates(before, afterSymbols, options)
  }));
  const contendersByAfter = afterContenderIndex(rankedByBefore);
  for (const entry of rankedByBefore) {
    const before = entry.before;
    const ranked = entry.ranked.filter((candidate) => !claimedAfter.has(candidate.after.anchor.key));
    const best = ranked[0];
    const runnerUp = ranked[1];
    if (!best) {
      unmatchedBefore.push(before);
      continue;
    }
    const splitTargets = splitLineageCandidates(before, ranked, contendersByAfter, options);
    if (splitTargets.length > 1) {
      for (const candidate of splitTargets) claimedAfter.add(candidate.after.anchor.key);
      events.push(inferredSplitEvent(before, splitTargets, input));
      continue;
    }
    const targetContention = ambiguousTargetContention(before, best, contendersByAfter, options);
    if (targetContention.length > 0) {
      ambiguous.push(ambiguousMatch(before, ranked, ['ambiguous-lineage-candidates', 'ambiguous-target-lineage-candidates']));
      continue;
    }
    if (runnerUp && best.score.confidence - runnerUp.score.confidence < options.ambiguityMargin) {
      ambiguous.push(ambiguousMatch(before, ranked));
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

function rankLineageCandidates(before, afterSymbols, options) {
  return afterSymbols
    .filter((after) => before.anchor.key !== after.anchor.key)
    .map((after) => ({ before, after, score: scoreLineagePair(before, after) }))
    .filter((candidate) => candidate.score.confidence >= options.minConfidence)
    .sort(compareCandidateScores);
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
    identityHash: firstString(symbol.identityHash, symbol.anchor.metadata?.identityHash),
    semanticIdentityHash: firstString(symbol.semanticIdentityHash, symbol.anchor.metadata?.semanticIdentityHash),
    sourceIdentityHash: firstString(symbol.sourceIdentityHash, symbol.anchor.metadata?.sourceIdentityHash),
    sourceSpan: symbol.anchor.sourceSpan,
    signatureHash: symbol.signatureHash,
    bodyHash: symbol.spanHash,
    ownershipRegionKind: symbol.ownershipRegionKind
  };
}

function ambiguousMatch(before, ranked, reasonCodes = ['ambiguous-lineage-candidates']) {
  return {
    before: symbolSummary(before),
    candidates: ranked.slice(0, 4).map((candidate) => ({
      after: symbolSummary(candidate.after),
      confidence: candidate.score.confidence,
      reasons: candidate.score.reasons
    })),
    reasonCodes: uniqueStrings(reasonCodes)
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
  const recreated = !nameChanged && score.reasons.includes('delete-recreate-candidate');
  const eventKind = nameChanged ? 'renamed' : recreated ? 'recreated' : 'moved';
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
      hashEvidence: hashEvidenceSummary(score.reasons),
      moved: pathChanged || spanMoved,
      renamed: nameChanged,
      recreated,
      anchorKeyChanged: before.anchor.key !== after.anchor.key,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  });
}

function inferredSplitEvent(before, candidates, input) {
  const targets = candidates.map((candidate) => candidate.after);
  const reasons = uniqueStrings([
    ...candidates.flatMap((candidate) => candidate.score.reasons),
    'split-lineage-candidate'
  ]);
  const confidence = Math.min(...candidates.map((candidate) => candidate.score.confidence));
  const pathMatch = targets.every((target) => before.anchor.sourcePath === target.anchor.sourcePath);
  const spanMoved = targets.some((target) => (
    before.anchor.sourcePath !== target.anchor.sourcePath
    || JSON.stringify(before.anchor.sourceSpan ?? null) !== JSON.stringify(target.anchor.sourceSpan ?? null)
  ));
  return createSemanticLineageEvent({
    id: `lineage_split_${idFragment(firstString(input.id, before.anchor.key))}_${idFragment(targets.map((target) => target.anchor.key).join('_'))}`,
    createdAt: input.generatedAt,
    eventKind: 'split',
    from: before.anchor,
    to: targets.map((target) => target.anchor),
    confidence,
    actor: input.actor,
    actorId: input.actorId,
    actorRole: input.actorRole ?? 'semantic-lineage-inference',
    operationId: input.operationId,
    deps: input.deps,
    heads: input.heads,
    stateVector: input.stateVector,
    evidenceIds: [input.evidenceId ?? `evidence_${idFragment(input.id ?? before.anchor.key)}_lineage_inference`],
    signatureHashMatch: candidates.every((candidate) => candidate.score.reasons.includes('signature-hash-match')),
    bodyHashMatch: candidates.every((candidate) => candidate.score.reasons.includes('body-hash-match')),
    pathMatch,
    sourceSpanMoved: spanMoved,
    conflictKeys: uniqueStrings([before.anchor.key, ...targets.map((target) => target.anchor.key)]),
    metadata: {
      inferred: true,
      algorithm: 'frontier.semantic-lineage-inference.v1',
      reasonCodes: reasons,
      hashEvidence: hashEvidenceSummary(reasons),
      split: true,
      targetCount: targets.length,
      candidateConfidences: candidates.map((candidate) => candidate.score.confidence),
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
  const note = (reason) => reasons.push(reason);
  if (before.anchor.key && before.anchor.key === after.anchor.key) add(0.4, 'anchor-key-match');
  if (before.name && before.name === after.name) add(0.28, 'symbol-name-match');
  if (before.kind && before.kind === after.kind) add(0.12, 'symbol-kind-match');
  addIdentityHashEvidence(before, after, add, note);
  if (before.signatureHash && before.signatureHash === after.signatureHash) add(0.52, 'signature-hash-match');
  if (before.spanHash && before.spanHash === after.spanHash) add(0.22, 'body-hash-match');
  if (before.anchor.kind && before.anchor.kind === after.anchor.kind) add(0.06, 'anchor-kind-match');
  if (before.anchor.sourcePath && before.anchor.sourcePath === after.anchor.sourcePath) add(0.04, 'source-path-match');
  addSourceHashEvidence(before, after, add, note, reasons, sameSymbolSurface);
  if (sourceSpanRangeSame(before.anchor.sourceSpan, after.anchor.sourceSpan)) add(0.18, 'source-span-range-match');
  if (before.ownershipRegionKind && before.ownershipRegionKind === after.ownershipRegionKind) add(0.04, 'ownership-kind-match');
  if (before.nativeAstNodeId && before.nativeAstNodeId === after.nativeAstNodeId) add(0.06, 'native-node-id-match');
  if (before.anchor.sourcePath !== after.anchor.sourcePath && (before.name === after.name || before.signatureHash === after.signatureHash)) add(0.04, 'source-path-moved');
  if (before.anchor.key && after.anchor.key && before.anchor.key !== after.anchor.key) note('anchor-key-changed');
  if (sameSymbolSurface(before, after)) note('same-symbol-surface');
  if (deleteRecreateCandidate(before, after, reasons)) note('delete-recreate-candidate');
  return { confidence: Math.max(0, Math.min(1, Number(score.toFixed(3)))), reasons: uniqueStrings(reasons) };
}

function afterContenderIndex(rankedByBefore) {
  const contenders = new Map();
  for (const entry of rankedByBefore) {
    for (const candidate of entry.ranked) {
      const key = candidate.after.anchor.key;
      if (!key) continue;
      contenders.set(key, [...(contenders.get(key) ?? []), candidate]);
    }
  }
  return contenders;
}

function ambiguousTargetContention(before, candidate, contendersByAfter, options) {
  return (contendersByAfter.get(candidate.after.anchor.key) ?? []).filter((contender) => (
    contender.before.anchor.key !== before.anchor.key
    && candidate.score.confidence - contender.score.confidence < options.ambiguityMargin
  ));
}

function splitLineageCandidates(before, ranked, contendersByAfter, options) {
  const best = ranked[0];
  if (!best) return [];
  const close = ranked.filter((candidate) => best.score.confidence - candidate.score.confidence < options.ambiguityMargin);
  if (close.length < 2 || close.length > 4) return [];
  if (!close.every((candidate) => hasStrongLineageEvidence(candidate.score))) return [];
  if (!close.every((candidate) => splitNameEvidence(before, candidate.after))) return [];
  if (close.some((candidate) => ambiguousTargetContention(before, candidate, contendersByAfter, options).length > 0)) return [];
  return close;
}

function hasStrongLineageEvidence(score) {
  return score.reasons.includes('signature-hash-match') || score.reasons.includes('body-hash-match');
}

function splitNameEvidence(before, after) {
  const beforeName = normalizedName(before.name);
  const afterName = normalizedName(after.name);
  return Boolean(beforeName && afterName && beforeName !== afterName && afterName.includes(beforeName));
}

function deleteRecreateCandidate(before, after, reasons) {
  return before.anchor.key !== after.anchor.key
    && sameSymbolSurface(before, after)
    && (reasons.includes('signature-hash-match') || reasons.includes('body-hash-match'));
}

function sameSymbolSurface(before, after) {
  return Boolean(
    before.name
    && before.name === after.name
    && before.kind
    && before.kind === after.kind
    && before.anchor.sourcePath
    && before.anchor.sourcePath === after.anchor.sourcePath
  );
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

function normalizedName(value) {
  return String(value ?? '').replace(/[^A-Za-z0-9_$]+/g, '').toLowerCase();
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}
