function htmlCssProjectSummary(files) {
  const htmlFiles = files.filter(isHtmlProjectFile), cssFiles = files.filter(isCssProjectFile), htmlCssFiles = [...htmlFiles, ...cssFiles];
  return {
    htmlFiles: htmlFiles.length, cssFiles: cssFiles.length, htmlCssFiles: htmlCssFiles.length,
    htmlMergedFiles: htmlFiles.filter(isMerged).length, cssMergedFiles: cssFiles.filter(isMerged).length, htmlCssMergedFiles: htmlCssFiles.filter(isMerged).length,
    htmlBlockedFiles: htmlFiles.filter(isBlocked).length, cssBlockedFiles: cssFiles.filter(isBlocked).length, htmlCssBlockedFiles: htmlCssFiles.filter(isBlocked).length,
    htmlParserEvidenceFiles: htmlFiles.filter(hasHtmlParserEvidence).length, cssParserEvidenceFiles: cssFiles.filter(hasCssParserEvidence).length, htmlCssParserEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlParserEvidence(file) || hasCssParserEvidence(file)).length,
    htmlParserEvidenceFailedFiles: htmlFiles.filter(hasParserEvidenceFailure).length, cssParserEvidenceFailedFiles: cssFiles.filter(hasParserEvidenceFailure).length, htmlCssParserEvidenceFailedFiles: htmlCssFiles.filter(hasParserEvidenceFailure).length,
    htmlIdentityEvidenceFiles: htmlFiles.filter(hasHtmlIdentityEvidence).length, cssSelectorTargetEvidenceFiles: cssFiles.filter(hasCssSelectorTargetEvidence).length, htmlCssStructuralTargetEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidence(file) || hasCssSelectorTargetEvidence(file)).length,
    htmlExplicitIdentityEvidenceFiles: htmlFiles.filter(hasHtmlExplicitIdentityEvidence).length, htmlPathOnlyIdentityResidualFiles: htmlFiles.filter(hasHtmlPathOnlyIdentityResidual).length,
    htmlRuntimeBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlRuntimeBoundaryEvidence).length, htmlFrameworkBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlFrameworkBoundaryEvidence).length, htmlProofGapBlockedFiles: htmlFiles.filter(hasHtmlProofGapBlockedConflict).length,
    htmlIdentityEvidenceFailedFiles: htmlFiles.filter(hasHtmlIdentityEvidenceFailure).length, cssSelectorTargetConflictFiles: cssFiles.filter(hasCssSelectorTargetConflict).length, htmlCssStructuralTargetEvidenceFailedFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidenceFailure(file) || hasCssSelectorTargetConflict(file)).length,
    cssSelectorTargetRebasedFiles: cssFiles.filter(hasCssSelectorTargetRebase).length,
    cssScopedCascadeFiles: cssFiles.filter(hasCssScopedCascadeScope).length, cssScopedCascadeEvidenceFiles: cssFiles.filter(hasCssScopedCascadeEvidence).length, cssScopedCascadeBlockedFiles: cssFiles.filter(hasCssScopedCascadeMissingProof).length,
    htmlCssBrowserRuntimeProofs: htmlCssFiles.filter(hasBrowserRuntimeProof).length
  };
}

function isHtmlProjectFile(file) { return String(file?.language ?? '').toLowerCase() === 'html' || /\.html?$/i.test(stripQuery(file?.sourcePath)); }
function isCssProjectFile(file) { return String(file?.language ?? '').toLowerCase() === 'css' || stripQuery(file?.sourcePath).toLowerCase().endsWith('.css'); }
function isMerged(file) { return file.status === 'merged'; }
function isBlocked(file) { return file.status === 'blocked'; }
function stripQuery(sourcePath) { return String(sourcePath ?? '').replace(/[?#].*$/, ''); }
function hasHtmlParserEvidence(file) {
  const evidence = file?.result?.parserEvidence;
  return evidence?.parseErrors === 0 && evidence.sourceCodeLocationInfo === true && evidence.parserBackedSourceSpans === true && evidence.parserNames?.includes('parse5');
}
function hasCssParserEvidence(file) {
  const evidence = file?.result?.parserEvidence;
  return evidence?.parseErrors === 0 && evidence.sourceCodeLocationInfo === true && evidence.parserBackedSourceSpans === true && evidence.parserBackedDeclarationSpans === true && evidence.parserBackedTriviaHashes === true;
}
function hasParserEvidenceFailure(file) { return (file?.result?.parserEvidence?.parseErrors ?? 0) > 0; }
function hasHtmlIdentityEvidence(file) {
  const evidence = file?.result?.identityEvidence;
  return evidence?.parserBackedStructuralSpans === true && evidence.structuralAddressability === true;
}
function hasHtmlExplicitIdentityEvidence(file) {
  const evidence = file?.result?.identityEvidence;
  return hasHtmlIdentityEvidence(file) && evidence.explicitIdentityAvailable === true;
}
function hasHtmlPathOnlyIdentityResidual(file) { return (file?.result?.identityEvidence?.pathOnlyIdentityElements ?? 0) > 0; }
function hasHtmlRuntimeBoundaryEvidence(file) { return (file?.result?.identityEvidence?.runtimeBoundaryElements ?? 0) > 0; }
function hasHtmlFrameworkBoundaryEvidence(file) { return (file?.result?.identityEvidence?.frameworkBoundaryElements ?? 0) > 0; }
function hasHtmlIdentityEvidenceFailure(file) {
  const evidence = file?.result?.identityEvidence;
  return Boolean(evidence) && (evidence.parserBackedStructuralSpans !== true || evidence.structuralAddressability !== true);
}
function hasCssSelectorTargetEvidence(file) {
  const evidence = file?.result?.selectorTargetEvidence;
  return evidence?.parserBackedRuleSpans === true;
}
function hasCssSelectorTargetConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => conflict.code === 'css-selector-target-conflict');
}
function hasHtmlProofGapBlockedConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => conflict.code === 'html-proof-gap-blocked');
}
function hasCssSelectorTargetRebase(file) { return (file?.result?.selectorTargetEvidence?.rebasedChangeCount ?? 0) > 0; }
function hasCssScopedCascadeScope(file) { return cssScopedRuleCount(file) > 0; }
function hasCssScopedCascadeEvidence(file) {
  return hasCssScopedCascadeScope(file) && file?.result?.parserEvidence?.scopedCascadeGraphHashPresent === true;
}
function hasCssScopedCascadeMissingProof(file) {
  return hasCssScopedCascadeScope(file) && (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => ScopedCascadeMissingProofReasonCodes.has(conflict?.details?.reasonCode));
}
function cssScopedRuleCount(file) {
  const sides = Object.values(file?.result?.selectorTargetEvidence?.sides ?? {});
  return sides.reduce((count, side) => Math.max(count, side?.scopedRuleCount ?? 0), 0);
}
function hasBrowserRuntimeProof(file) {
  const admission = file?.result?.admission ?? file?.admission ?? {};
  return admission.browserRuntimeEquivalenceClaim === true || admission.browserCascadeEquivalenceClaim === true || admission.browserRenderEquivalenceClaim === true;
}

const ScopedCascadeMissingProofReasonCodes = new Set(['css-scoped-cascade-equivalence-unproved', 'css-media-cascade-scope-unproved', 'css-supports-cascade-scope-unproved', 'css-container-cascade-scope-unproved', 'css-layer-cascade-scope-unproved', 'css-scope-cascade-scope-unproved']);

export { htmlCssProjectSummary };
