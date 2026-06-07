function sidecarSourcePaths(importEntries) {
  return [...new Set(importEntries.map((entry) => entry.sourcePath).filter(Boolean))];
}

function sidecarQualityWarning(code, message, action, sourcePaths) {
  return {
    code,
    severity: 'warning',
    message,
    action,
    sourcePaths
  };
}

export function createSemanticImportSidecarQuality(input) {
  const { importEntries, symbols, ownershipRegions, patchHints, proofSpec, evidence, readiness } = input;
  const expected = input.expected === true;
  const sourcePaths = sidecarSourcePaths(importEntries);
  const importCount = importEntries.length;
  const warnings = [];
  if (expected && importCount === 0) warnings.push(sidecarQualityWarning(
    'expected-semantic-import-missing',
    'Semantic import was expected but no import entries were selected.',
    'check-semantic-import-include-globs-and-workspace-paths',
    sourcePaths
  ));
  if (importCount === 0) warnings.push(sidecarQualityWarning(
    'missing-imports',
    'Semantic sidecar has no import entries; run native import before merge admission.',
    'run-native-import',
    sourcePaths
  ));
  if (expected && importCount > 0 && symbols.length === 0) warnings.push(sidecarQualityWarning(
    'expected-semantic-import-empty',
    'Semantic import was expected but selected imports produced zero semantic symbols.',
    'rerun-importer-with-semantic-source-selection',
    sourcePaths
  ));
  if (importCount > 0 && symbols.length === 0) warnings.push(sidecarQualityWarning(
    'empty-semantic-index',
    'Semantic sidecar has import entries but no semantic symbols.',
    'rerun-importer-with-semantic-index',
    sourcePaths
  ));
  if (importCount > 0 && ownershipRegions.length === 0) warnings.push(sidecarQualityWarning(
    'missing-ownership-regions',
    'Semantic sidecar has no ownership regions for safe merge ownership.',
    'rerun-sidecar-generation-with-ownership-regions',
    sourcePaths
  ));
  if (importCount > 0 && patchHints.length === 0) warnings.push(sidecarQualityWarning(
    'missing-patch-hints',
    'Semantic sidecar has no patch hints.',
    'generate-semantic-patch-hints',
    sourcePaths
  ));
  if (importCount > 0 && evidence.length === 0) warnings.push(sidecarQualityWarning(
    'empty-evidence',
    'Semantic sidecar has no evidence records.',
    'attach-semantic-import-evidence',
    sourcePaths
  ));
  if (proofSpec.failed > 0) warnings.push(sidecarQualityWarning(
    'failed-proof-obligations',
    'Semantic sidecar has failed proof obligations.',
    'resolve-failed-proof-obligations',
    sourcePaths
  ));
  if (proofSpec.pending > 0) warnings.push(sidecarQualityWarning(
    'pending-proof-obligations',
    'Semantic sidecar has pending proof obligations.',
    'review-pending-proof-obligations',
    sourcePaths
  ));
  if ((proofSpec.byReadinessStatus?.open ?? 0) > 0) warnings.push(sidecarQualityWarning(
    'open-proof-obligations',
    'Semantic sidecar has open proof obligations.',
    'review-open-proof-obligations',
    sourcePaths
  ));
  if (proofSpec.stale > 0) warnings.push(sidecarQualityWarning(
    'stale-proof-obligations',
    'Semantic sidecar has stale proof obligations.',
    'rerun-stale-proof-obligations',
    sourcePaths
  ));
  if (proofSpec.assumed > 0) warnings.push(sidecarQualityWarning(
    'assumed-proof-obligations',
    'Semantic sidecar has assumed proof obligations.',
    'review-proof-assumptions',
    sourcePaths
  ));
  if (proofSpec.externalToolRequired > 0) warnings.push(sidecarQualityWarning(
    'external-tool-proof-obligations',
    'Semantic sidecar has proof obligations requiring an external tool.',
    'run-required-proof-tool',
    sourcePaths
  ));
  if (proofSpec.unknown > 0) warnings.push(sidecarQualityWarning(
    'unknown-proof-obligations',
    'Semantic sidecar has proof obligations with unknown status.',
    'classify-proof-obligations',
    sourcePaths
  ));
  if (readiness === 'blocked') warnings.push(sidecarQualityWarning(
    'blocked-readiness',
    'Semantic sidecar readiness is blocked.',
    'resolve-blocking-import-losses',
    sourcePaths
  ));
  const emptyEvidenceWarnings = warnings.filter((warning) => (
    warning.code === 'empty-evidence' ||
    warning.code === 'empty-semantic-index' ||
    warning.code === 'expected-semantic-import-empty' ||
    warning.code === 'expected-semantic-import-missing' ||
    warning.code === 'missing-ownership-regions' ||
    warning.code === 'missing-patch-hints'
  ));
  const expectedMissingReasonCodes = expected
    ? emptyEvidenceWarnings.map((warning) => warning.code)
    : [];
  const expectedSatisfied = !expected || (
    importCount > 0 &&
    symbols.length > 0 &&
    ownershipRegions.length > 0 &&
    patchHints.length > 0 &&
    evidence.length > 0
  );
  const proofSummary = {
    total: proofSpec.total,
    obligations: proofSpec.obligations,
    discharged: proofSpec.discharged,
    pending: proofSpec.pending,
    failed: proofSpec.failed,
    stale: proofSpec.stale,
    assumed: proofSpec.assumed,
    externalToolRequired: proofSpec.externalToolRequired,
    open: proofSpec.open,
    unknown: proofSpec.unknown,
    empty: proofSpec.empty,
    autoMergeProof: false
  };
  return {
    schema: 'frontier.lang.semanticSidecarQuality.v1',
    expected,
    expectedSatisfied,
    expectedMissingReasonCodes,
    selected: importCount > 0,
    eligible: importCount > 0 && emptyEvidenceWarnings.length === 0 && proofSpec.failed === 0 && readiness !== 'blocked',
    imported: importCount > 0,
    importCount,
    symbolCount: symbols.length,
    ownershipRegionCount: ownershipRegions.length,
    patchHintCount: patchHints.length,
    proofSummary,
    evidenceCount: evidence.length,
    warningCount: warnings.length,
    warnings,
    emptyEvidenceWarnings
  };
}

export function createSemanticImportSidecarAdmission(quality, readiness) {
  return {
    schema: 'frontier.lang.semanticSidecarAdmission.v1',
    expected: quality.expected,
    expectedSatisfied: quality.expectedSatisfied,
    expectedMissingReasonCodes: quality.expectedMissingReasonCodes,
    selected: quality.selected,
    eligible: quality.eligible,
    imported: quality.imported,
    importCount: quality.importCount,
    readiness,
    action: sidecarAdmissionAction(quality, readiness),
    counts: {
      symbols: quality.symbolCount,
      ownershipRegions: quality.ownershipRegionCount,
      patchHints: quality.patchHintCount,
      evidence: quality.evidenceCount,
      proofRecords: quality.proofSummary.total,
      proofObligations: quality.proofSummary.obligations,
      proofFailedObligations: quality.proofSummary.failed
    },
    proofSummary: quality.proofSummary,
    warnings: quality.warnings,
    emptyEvidenceWarnings: quality.emptyEvidenceWarnings
  };
}

function sidecarAdmissionAction(quality, readiness) {
  if (!quality.imported) return 'reject-missing-imports';
  if (readiness === 'blocked') return 'reject-blocked';
  if (quality.proofSummary.failed > 0) return 'reject-failed-proof';
  if (quality.emptyEvidenceWarnings.length > 0) return 'reject-empty-evidence';
  if (!quality.eligible) return 'reject-quality';
  if (sidecarProofReviewObligations(quality.proofSummary) > 0) return 'review-proof-obligations';
  if (readiness === 'needs-review') return 'review';
  return 'admit';
}

function sidecarProofReviewObligations(proofSummary) {
  return (proofSummary.open ?? 0) + (proofSummary.stale ?? 0) + (proofSummary.assumed ?? 0) +
    (proofSummary.externalToolRequired ?? 0) + (proofSummary.unknown ?? 0);
}
