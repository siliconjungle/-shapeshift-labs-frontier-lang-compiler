import { HtmlFrameworkBoundaryReasonCodes, HtmlRuntimeBoundaryReasonCodes, RequiredParserEvidenceSideNames } from './js-ts-safe-project-merge-html-css-summary-constants.js';
import { parserEvidenceSourceHashBindingValid } from './js-ts-safe-project-merge-html-css-parser-source-hash-binding.js';
import { hasBlockedBrowserRuntimeProof, hasBrowserRuntimeProof, hasHtmlRuntimeBoundaryProof } from './js-ts-safe-project-merge-html-css-runtime-summary.js';
import { htmlStructuralMergeEvidenceSummary } from './js-ts-safe-project-merge-html-class-token-evidence.js';

function isSvgProjectFile(file) {
  return String(file?.language ?? '').toLowerCase() === 'svg' || stripQuery(file?.sourcePath).toLowerCase().endsWith('.svg');
}

function hasSvgParserEvidence(file) {
  const evidence = file?.result?.svgParserEvidence;
  const sides = requiredParserEvidenceSides(evidence);
  return evidence?.kind === 'frontier.lang.svgSafeMergeParserEvidence' &&
    hasSvgEvidenceNoEquivalenceClaims(evidence) &&
    evidence.parseErrors === 0 &&
    Array.isArray(evidence.parserNames) &&
    evidence.parserNames.includes('frontier-svg-lexical-scanner') &&
    hasSvgParserSpanCounts(evidence) &&
    parserEvidenceSourceHashBindingValid(file, evidence) &&
    sides.length > 0 &&
    sides.every((side) => side.parserName === 'frontier-svg-lexical-scanner' && hasSvgEvidenceNoEquivalenceClaims(side) && hasSvgParserSpanCounts(side));
}

function hasSvgParserEvidenceFailure(file) {
  return isSvgProjectFile(file) && Boolean(file?.result?.svgParserEvidence) && !hasSvgParserEvidence(file);
}

function hasSvgReferenceGraphEvidence(file) {
  const evidence = file?.result?.svgReferenceGraphEvidence;
  const sides = Object.values(evidence?.sides ?? {}).filter(Boolean);
  return evidence?.kind === 'frontier.lang.svgReferenceGraphEvidence' &&
    hasSvgEvidenceNoEquivalenceClaims(evidence) &&
    evidence.sourceBound === true &&
    evidence.referenceErrors === 0 &&
    sides.length > 0 &&
    sides.every(hasSvgEvidenceNoEquivalenceClaims) &&
    typeof evidence.sides?.output?.graphHash === 'string';
}

function hasSvgReferenceGraphEvidenceFailure(file) {
  return isSvgProjectFile(file) && Boolean(file?.result?.svgReferenceGraphEvidence) && !hasSvgReferenceGraphEvidence(file);
}

function svgReferenceDefinitionRecordCount(file) {
  return file?.result?.svgReferenceGraphEvidence?.sides?.output?.definitionRecords ?? 0;
}

function svgReferenceRecordCount(file) {
  return file?.result?.svgReferenceGraphEvidence?.sides?.output?.referenceRecords ?? 0;
}

function svgMissingReferenceRecordCount(file) {
  return file?.result?.svgReferenceGraphEvidence?.sides?.output?.missingReferenceRecords ?? 0;
}

function svgProjectEvidenceSummary(svgFiles) {
  return {
    svgMergedFiles: svgFiles.filter(isMerged).length,
    svgBlockedFiles: svgFiles.filter(isBlocked).length,
    svgParserEvidenceFiles: svgFiles.filter(hasSvgParserEvidence).length,
    svgParserEvidenceFailedFiles: svgFiles.filter(hasSvgParserEvidenceFailure).length,
    svgReferenceGraphEvidenceFiles: svgFiles.filter(hasSvgReferenceGraphEvidence).length,
    svgReferenceGraphEvidenceFailedFiles: svgFiles.filter(hasSvgReferenceGraphEvidenceFailure).length,
    svgReferenceGraphDefinitionRecords: svgFiles.reduce((sum, file) => sum + svgReferenceDefinitionRecordCount(file), 0),
    svgReferenceGraphReferenceRecords: svgFiles.reduce((sum, file) => sum + svgReferenceRecordCount(file), 0),
    svgReferenceGraphMissingReferenceRecords: svgFiles.reduce((sum, file) => sum + svgMissingReferenceRecordCount(file), 0),
    svgIdentityEvidenceFiles: svgFiles.filter(hasSvgIdentityEvidence).length,
    svgIdentityEvidenceFailedFiles: svgFiles.filter(hasSvgIdentityEvidenceFailure).length,
    svgExplicitIdentityEvidenceFiles: svgFiles.filter(hasSvgExplicitIdentityEvidence).length,
    svgPathOnlyIdentityResidualFiles: svgFiles.filter(hasSvgPathOnlyIdentityResidual).length,
    svgDuplicateIdentityEvidenceFiles: svgFiles.filter(hasSvgDuplicateIdentityEvidence).length,
    svgDuplicateIdentityKeys: svgFiles.reduce((sum, file) => sum + svgDuplicateIdentityKeyCount(file), 0),
    svgRuntimeBoundaryEvidenceFiles: svgFiles.filter(hasSvgRuntimeBoundaryEvidence).length,
    svgFrameworkBoundaryEvidenceFiles: svgFiles.filter(hasSvgFrameworkBoundaryEvidence).length,
    svgProofGapBlockedFiles: svgFiles.filter(hasSvgProofGapBlockedConflict).length,
    svgStructuralAddFiles: svgFiles.filter((file) => htmlStructuralMergeEvidenceSummary([file]).htmlUnkeyedStructuralAddFiles > 0).length,
    svgStructuralDeleteFiles: svgFiles.filter((file) => htmlStructuralMergeEvidenceSummary([file]).htmlUnkeyedStructuralDeleteFiles > 0).length,
    svgStructuralMoveFiles: svgFiles.filter((file) => htmlStructuralMergeEvidenceSummary([file]).htmlUnkeyedStructuralMoveFiles > 0).length,
    svgBrowserRuntimeProofs: svgFiles.filter(hasBrowserRuntimeProof).length,
    svgBrowserRuntimeProofBlockedFiles: svgFiles.filter(hasBlockedBrowserRuntimeProof).length
  };
}

function hasSvgIdentityEvidence(file) {
  const evidence = file?.result?.identityEvidence;
  return evidence?.parserBackedStructuralSpans === true &&
    evidence.structuralAddressability === true &&
    !hasDuplicateExplicitIdentityKeys(evidence);
}

function hasSvgExplicitIdentityEvidence(file) {
  return hasSvgIdentityEvidence(file) && file?.result?.identityEvidence?.explicitIdentityAvailable === true;
}

function hasSvgPathOnlyIdentityResidual(file) {
  return (file?.result?.identityEvidence?.pathOnlyIdentityElements ?? 0) > 0;
}

function hasSvgDuplicateIdentityEvidence(file) {
  return hasDuplicateExplicitIdentityKeys(file?.result?.identityEvidence);
}

function svgDuplicateIdentityKeyCount(file) {
  return duplicateExplicitIdentityKeys(file?.result?.identityEvidence).length;
}

function hasSvgIdentityEvidenceFailure(file) {
  const evidence = file?.result?.identityEvidence;
  return Boolean(evidence) &&
    (evidence.parserBackedStructuralSpans !== true ||
      evidence.structuralAddressability !== true ||
      hasDuplicateExplicitIdentityKeys(evidence));
}

function requiredParserEvidenceSides(evidence) {
  const sides = evidence?.sides;
  if (!isPlainObject(sides)) return [];
  const sideNames = Object.keys(sides);
  return sideNames.length === RequiredParserEvidenceSideNames.length &&
    RequiredParserEvidenceSideNames.every((name) => isPlainObject(sides[name]))
    ? RequiredParserEvidenceSideNames.map((name) => sides[name])
    : [];
}

function hasSvgParserSpanCounts(evidence) {
  return evidence?.sourceCodeLocationInfo === true &&
    evidence.parserBackedSourceSpans === true &&
    evidence.parserBackedAttributeSpans === true &&
    hasNonNegativeCounts(evidence, ['recordCount', 'sourceSpanRecordCount', 'attributeSpanElementCount', 'attributeSpanRecordCount', 'structuralSpanRecordCount']) &&
    hasZeroCounts(evidence, ['sourceSpanMissingRecordCount', 'attributeSpanMissingElementCount', 'structuralSpanMissingRecordCount']);
}

function hasNonNegativeCounts(record, keys) {
  return keys.every((key) => Number.isInteger(record?.[key]) && record[key] >= 0);
}

function hasZeroCounts(record, keys) {
  return keys.every((key) => record?.[key] === 0);
}

function hasSvgEvidenceNoEquivalenceClaims(record) {
  return record?.autoMergeClaim === false &&
    record.semanticEquivalenceClaim === false &&
    record.runtimeEquivalenceClaim === false &&
    record.renderEquivalenceClaim === false &&
    record.browserRuntimeEquivalenceClaim === false &&
    record.browserRenderEquivalenceClaim === false;
}

function hasDuplicateExplicitIdentityKeys(evidence) {
  return duplicateExplicitIdentityKeys(evidence).length > 0;
}

function duplicateExplicitIdentityKeys(evidence) {
  return Object.values(evidence?.sides ?? {}).flatMap((side) => {
    const counts = new Map();
    for (const key of side?.explicitIdentityKeys ?? []) counts.set(key, (counts.get(key) ?? 0) + 1);
    return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  });
}

function stripQuery(sourcePath) { return String(sourcePath ?? '').replace(/[?#].*$/, ''); }
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function isMerged(file) { return file.status === 'merged'; }
function isBlocked(file) { return file.status === 'blocked'; }
function hasSvgProofGapBlockedConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? [])
    .some((conflict) => SvgProofGapConflictCodes.has(conflict.code));
}
function hasSvgRuntimeBoundaryEvidence(file) {
  if (file?.result?.svgRuntimeBoundaryEvidence?.kind === 'frontier.lang.svgRuntimeBoundaryEvidence') return true;
  return (file?.result?.identityEvidence?.runtimeBoundaryElements ?? 0) > 0 ||
    hasSvgRuntimeBoundaryConflict(file) ||
    hasHtmlRuntimeBoundaryProof(file);
}
function hasSvgFrameworkBoundaryEvidence(file) {
  return (file?.result?.identityEvidence?.frameworkBoundaryElements ?? 0) > 0 ||
    hasSvgFrameworkBoundaryConflict(file);
}
function hasSvgRuntimeBoundaryConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) =>
    conflict.code === 'svg-runtime-boundary-blocked' ||
    HtmlRuntimeBoundaryReasonCodes.has(conflict?.details?.reasonCode) ||
    (conflict?.details?.reasonCodes ?? []).some((code) => String(code).startsWith('svg-') && String(code).endsWith('-runtime-boundary')));
}
function hasSvgFrameworkBoundaryConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => HtmlFrameworkBoundaryReasonCodes.has(conflict?.details?.reasonCode));
}

const SvgProofGapConflictCodes = new Set([
  'html-proof-gap-blocked',
  'html-runtime-proof-broad-claim',
  'svg-runtime-boundary-blocked',
  'svg-runtime-proof-blocked'
]);

export {
  hasSvgIdentityEvidence,
  hasSvgIdentityEvidenceFailure,
  hasSvgParserEvidence,
  hasSvgParserEvidenceFailure,
  hasSvgReferenceGraphEvidence,
  hasSvgReferenceGraphEvidenceFailure,
  isSvgProjectFile,
  svgProjectEvidenceSummary
};
