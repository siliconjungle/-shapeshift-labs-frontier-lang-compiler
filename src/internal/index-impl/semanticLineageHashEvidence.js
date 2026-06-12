import { uniqueStrings } from '../../native-import-utils.js';

export function addIdentityHashEvidence(before, after, add, note) {
  const matches = matchingIdentityHashReasons(before, after);
  if (matches.length === 0) return;
  if (!compatibleLineageSurface(before, after)) {
    note('identity-hash-match-surface-mismatch');
    return;
  }
  const primary = matches.includes('semantic-identity-hash-match')
    ? 'semantic-identity-hash-match'
    : matches.includes('source-identity-hash-match')
      ? 'source-identity-hash-match'
      : 'identity-hash-match';
  add(0.62, primary);
  for (const reason of matches) {
    if (reason !== primary) note(reason);
  }
}

export function addSourceHashEvidence(before, after, add, note, reasons, sameSymbolSurface) {
  const beforeHash = firstString(before.anchor.sourceHash, before.sourceHash);
  const afterHash = firstString(after.anchor.sourceHash, after.sourceHash);
  if (!beforeHash || !afterHash) return;
  if (beforeHash !== afterHash) {
    note('source-hash-changed');
    return;
  }
  if (!hasSourceHashSupport(before, after, reasons, sameSymbolSurface)) {
    note('source-hash-match-without-lineage-support');
    return;
  }
  add(0.04, 'source-hash-match');
  if (before.anchor.sourcePath && after.anchor.sourcePath && before.anchor.sourcePath !== after.anchor.sourcePath) {
    note('source-hash-preserved-across-path');
  }
}

export function hashEvidenceSummary(reasons) {
  return {
    semanticIdentityHashMatch: reasons.includes('semantic-identity-hash-match'),
    sourceIdentityHashMatch: reasons.includes('source-identity-hash-match'),
    identityHashMatch: reasons.includes('identity-hash-match'),
    sourceHashMatch: reasons.includes('source-hash-match'),
    signatureHashMatch: reasons.includes('signature-hash-match'),
    bodyHashMatch: reasons.includes('body-hash-match')
  };
}

function matchingIdentityHashReasons(before, after) {
  const beforeHashes = identityHashEntries(before);
  const afterHashes = new Map(identityHashEntries(after).map((entry) => [entry.value, entry.reason]));
  const reasons = [];
  for (const entry of beforeHashes) {
    const afterReason = afterHashes.get(entry.value);
    if (!afterReason) continue;
    reasons.push(identityHashMatchReason(entry.reason, afterReason));
  }
  return uniqueStrings(reasons);
}

function identityHashEntries(symbol) {
  return [
    { reason: 'semantic-identity-hash-match', value: firstString(symbol.semanticIdentityHash, symbol.anchor.metadata?.semanticIdentityHash) },
    { reason: 'source-identity-hash-match', value: firstString(symbol.sourceIdentityHash, symbol.anchor.metadata?.sourceIdentityHash) },
    { reason: 'identity-hash-match', value: firstString(symbol.identityHash, symbol.anchor.metadata?.identityHash) }
  ].filter((entry) => entry.value);
}

function identityHashMatchReason(beforeReason, afterReason) {
  if (beforeReason === afterReason) return beforeReason;
  if (beforeReason === 'semantic-identity-hash-match' || afterReason === 'semantic-identity-hash-match') return 'semantic-identity-hash-match';
  if (beforeReason === 'source-identity-hash-match' || afterReason === 'source-identity-hash-match') return 'source-identity-hash-match';
  return 'identity-hash-match';
}

function compatibleLineageSurface(before, after) {
  return (!before.language || !after.language || before.language === after.language)
    && (!before.kind || !after.kind || before.kind === after.kind)
    && (!before.anchor.kind || !after.anchor.kind || before.anchor.kind === after.anchor.kind);
}

function hasSourceHashSupport(before, after, reasons, sameSymbolSurface) {
  return reasons.some((reason) => [
    'semantic-identity-hash-match',
    'source-identity-hash-match',
    'identity-hash-match',
    'signature-hash-match',
    'body-hash-match',
    'symbol-name-match'
  ].includes(reason))
    || sameSymbolSurface(before, after);
}

function firstString(...values) {
  return values.map((value) => value === undefined || value === null ? '' : String(value)).find(Boolean);
}
