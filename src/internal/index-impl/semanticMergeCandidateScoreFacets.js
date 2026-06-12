import { uniqueStrings } from '../../native-import-utils.js';

const scoreFacetWeights = Object.freeze({ ownership: 18, staleStatus: 20, testEvidence: 18, overlap: 18, size: 10, semanticSidecarQuality: 16 });

export function semanticMergeCandidateScoreFacets(input) {
  const components = {
    ownership: ownershipFacet(input),
    staleStatus: staleStatusFacet(input),
    testEvidence: testEvidenceFacet(input),
    overlap: overlapFacet(input),
    size: sizeFacet(input),
    semanticSidecarQuality: semanticSidecarQualityFacet(input)
  };
  const weightedTotal = Object.values(components).reduce((sum, component) => sum + component.weightedScore, 0);
  const weightTotal = Object.values(components).reduce((sum, component) => sum + component.weight, 0);
  const value = roundScore(weightTotal ? weightedTotal * 100 / weightTotal : 0);
  const weakFacets = Object.values(components).filter((component) => component.status === 'weak').map((component) => component.key);
  const blockedFacets = Object.values(components).filter((component) => component.status === 'blocked').map((component) => component.key);
  const lowestScore = Math.min(...Object.values(components).map((component) => component.score));
  return {
    schema: 'frontier.lang.semanticMergeCandidateScoreFacets.v1',
    version: 1,
    higherIsBetter: true,
    value,
    risk: value < 50 || blockedFacets.length ? 'high' : value < 80 || weakFacets.length ? 'medium' : 'low',
    components,
    summary: {
      value,
      risk: value < 50 || blockedFacets.length ? 'high' : value < 80 || weakFacets.length ? 'medium' : 'low',
      lowestScore,
      weakFacets,
      blockedFacets,
      availableFacets: Object.values(components).filter((component) => component.signals.available !== false).map((component) => component.key)
    }
  };
}

function ownershipFacet(input) {
  const regions = input.changedSemanticRegions;
  const keyedRegions = regions.filter((region) => region.key || region.conflictKey);
  const kindedRegions = regions.filter((region) => region.regionKind);
  const spannedRegions = regions.filter((region) => region.sourceSpan);
  const score = regions.length
    ? roundScore(keyedRegions.length * 70 / regions.length + kindedRegions.length * 15 / regions.length + spannedRegions.length * 15 / regions.length)
    : input.conflictKeys.length ? 45 : 70;
  return scoreFacet('ownership', score, [
    ...(regions.length === 0 ? ['missing-changed-semantic-regions'] : []),
    ...(regions.length && keyedRegions.length < regions.length ? ['missing-ownership-keys'] : [])
  ], {
    changedSemanticRegions: regions.length,
    keyedRegions: keyedRegions.length,
    regionKinds: uniqueStrings(regions.map((region) => region.regionKind)),
    conflictKeys: input.conflictKeys,
    ownershipKeys: uniqueStrings(regions.map((region) => region.key))
  });
}

function staleStatusFacet(input) {
  const staleEvidence = input.evidenceRecords.filter((record) => evidenceStatus(record) === 'stale' || record?.metadata?.stale === true);
  const sourceHashVerified = [
    input.source?.metadata?.sourceHashVerified,
    input.source?.before?.metadata?.sourceHashVerified,
    input.source?.after?.metadata?.sourceHashVerified,
    input.candidate?.metadata?.sourceHashVerified,
    input.patch?.metadata?.sourceHashVerified
  ].filter((value) => value !== undefined);
  const staleProofs = semanticSidecarQuality(input)?.proofSummary?.stale ?? 0;
  const sourceHashStale = sourceHashVerified.includes(false);
  const score = sourceHashStale ? 0 : staleEvidence.length ? 35 : staleProofs > 0 ? 55 : 100;
  return scoreFacet('staleStatus', score, [
    ...(sourceHashStale ? ['stale-source-hash'] : []),
    ...(staleEvidence.length ? ['stale-evidence'] : []),
    ...(staleProofs > 0 ? ['stale-sidecar-proof-obligations'] : [])
  ], {
    staleEvidenceIds: staleEvidence.map((record) => record.id).filter(Boolean),
    staleProofObligations: staleProofs,
    sourceHashVerified
  });
}

function testEvidenceFacet(input) {
  const failed = input.evidenceRecords.filter((record) => evidenceStatus(record) === 'failed');
  const stale = input.evidenceRecords.filter((record) => evidenceStatus(record) === 'stale');
  const pending = input.evidenceRecords.filter((record) => ['pending', 'assumed', 'unknown'].includes(evidenceStatus(record)));
  const passed = input.evidenceRecords.filter((record) => ['passed', 'ok', 'success'].includes(evidenceStatus(record)));
  const score = failed.length ? 0 : stale.length ? 45 : pending.length ? 65 : input.proofIds.length ? 100 : input.evidenceIds.length ? 82 : 35;
  return scoreFacet('testEvidence', score, [
    ...(failed.length ? ['failed-evidence'] : []),
    ...(stale.length ? ['stale-evidence'] : []),
    ...(pending.length ? ['pending-evidence'] : []),
    ...(!input.evidenceIds.length && !input.proofIds.length ? ['missing-evidence'] : [])
  ], {
    evidenceIds: input.evidenceIds,
    proofIds: input.proofIds,
    evidenceRecords: input.evidenceRecords.length,
    passedEvidenceIds: passed.map((record) => record.id).filter(Boolean),
    failedEvidenceIds: failed.map((record) => record.id).filter(Boolean),
    staleEvidenceIds: stale.map((record) => record.id).filter(Boolean),
    pendingEvidenceIds: pending.map((record) => record.id).filter(Boolean)
  });
}

function overlapFacet(input) {
  const high = input.overlaps.filter((overlap) => overlap.risk === 'high').length;
  const medium = input.overlaps.filter((overlap) => overlap.risk === 'medium').length;
  const score = clampScore(100 - high * 45 - medium * 25 - Math.max(0, input.overlaps.length - high - medium) * 15);
  return scoreFacet('overlap', score, [
    ...(input.overlaps.length ? ['overlapping-semantic-regions'] : [])
  ], {
    overlaps: input.overlaps.length,
    highRiskOverlaps: high,
    mediumRiskOverlaps: medium,
    conflictKeys: uniqueStrings(input.overlaps.flatMap((overlap) => overlap.conflictKeys ?? [])),
    byKind: countBy(input.overlaps.map((overlap) => overlap.overlapKind))
  });
}

function sizeFacet(input) {
  const operationCount = array(input.candidate?.operations ?? input.patch?.operations).length;
  const changedSemanticRegions = input.changedSemanticRegions.length;
  const conflictKeys = input.conflictKeys.length;
  const score = clampScore(100 - Math.max(0, changedSemanticRegions - 3) * 8 - Math.max(0, operationCount - 3) * 4 - Math.max(0, conflictKeys - 4) * 3);
  return scoreFacet('size', score, [
    ...(changedSemanticRegions > 3 ? ['large-changed-region-set'] : []),
    ...(operationCount > 3 ? ['large-operation-set'] : []),
    ...(conflictKeys > 4 ? ['many-conflict-keys'] : [])
  ], { changedSemanticRegions, operationCount, conflictKeys });
}

function semanticSidecarQualityFacet(input) {
  const quality = semanticSidecarQuality(input);
  if (!quality) return scoreFacet('semanticSidecarQuality', 100, [], { available: false });
  const proofSummary = quality.proofSummary ?? {};
  const warningCodes = uniqueStrings([...(quality.warnings ?? []).map((warning) => warning.code), ...strings(quality.expectedMissingReasonCodes)]);
  const reviewProofs = (proofSummary.open ?? 0) + (proofSummary.stale ?? 0) + (proofSummary.assumed ?? 0) + (proofSummary.externalToolRequired ?? 0) + (proofSummary.unknown ?? 0);
  const score = clampScore(
    (quality.imported === false || quality.selected === false ? 25 : 100)
    - (quality.eligible === false ? 35 : 0)
    - Math.min(35, (quality.warningCount ?? warningCodes.length ?? 0) * 7)
    - Math.min(40, (proofSummary.failed ?? 0) * 20)
    - Math.min(25, reviewProofs * 5)
  );
  return scoreFacet('semanticSidecarQuality', score, [
    ...(quality.imported === false || quality.selected === false ? ['semantic-sidecar-not-imported'] : []),
    ...(quality.eligible === false ? ['semantic-sidecar-not-eligible'] : []),
    ...warningCodes
  ], {
    available: true,
    expected: quality.expected,
    expectedSatisfied: quality.expectedSatisfied,
    selected: quality.selected,
    imported: quality.imported,
    eligible: quality.eligible,
    importCount: quality.importCount,
    symbolCount: quality.symbolCount,
    ownershipRegionCount: quality.ownershipRegionCount,
    patchHintCount: quality.patchHintCount,
    evidenceCount: quality.evidenceCount,
    warningCount: quality.warningCount ?? warningCodes.length,
    warningCodes,
    proofSummary
  });
}

function semanticSidecarQuality(input) {
  return [
    input.candidate?.semanticSidecarQuality,
    input.candidate?.sidecarQuality,
    input.candidate?.semanticSidecar?.quality,
    input.candidate?.sidecar?.quality,
    input.candidate?.metadata?.semanticSidecarQuality,
    input.candidate?.metadata?.sidecarQuality,
    input.source?.semanticSidecarQuality,
    input.source?.sidecarQuality,
    input.source?.semanticSidecar?.quality,
    input.source?.sidecar?.quality,
    input.source?.metadata?.semanticSidecarQuality,
    input.source?.metadata?.sidecarQuality,
    input.patch?.semanticSidecarQuality,
    input.patch?.metadata?.semanticSidecarQuality
  ].find(looksLikeSemanticSidecarQuality);
}

function looksLikeSemanticSidecarQuality(value) {
  return value && typeof value === 'object' && (
    value.schema === 'frontier.lang.semanticSidecarQuality.v1'
    || value.eligible !== undefined
    || value.imported !== undefined
    || value.proofSummary !== undefined
    || value.warningCount !== undefined
  );
}

function scoreFacet(key, score, reasonCodes, signals) {
  const normalizedScore = clampScore(score);
  const weight = scoreFacetWeights[key] ?? 1;
  return {
    key,
    score: normalizedScore,
    weight,
    weightedScore: roundScore(normalizedScore * weight / 100),
    status: facetStatus(normalizedScore),
    reasonCodes: uniqueStrings(reasonCodes),
    signals: compactRecord(signals)
  };
}

function facetStatus(score) {
  if (score <= 0) return 'blocked';
  if (score < 50) return 'weak';
  if (score < 80) return 'partial';
  return 'strong';
}

function evidenceStatus(record) { return String(record?.status ?? record?.metadata?.status ?? '').toLowerCase(); }
function countBy(values) { const counts = {}; for (const value of values ?? []) { const key = String(value ?? 'unknown'); counts[key] = (counts[key] ?? 0) + 1; } return counts; }
function clampScore(value) { return Math.max(0, Math.min(100, roundScore(value))); }
function roundScore(value) { return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100; }
function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }
function compactRecord(value) { return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0))); }
