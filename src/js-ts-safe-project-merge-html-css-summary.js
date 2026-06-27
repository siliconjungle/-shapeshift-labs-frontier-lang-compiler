function htmlCssProjectSummary(files) {
  const htmlFiles = files.filter(isHtmlProjectFile), cssFiles = files.filter(isCssProjectFile), htmlCssFiles = [...htmlFiles, ...cssFiles];
  return {
    htmlFiles: htmlFiles.length, cssFiles: cssFiles.length, htmlCssFiles: htmlCssFiles.length,
    htmlMergedFiles: htmlFiles.filter(isMerged).length, cssMergedFiles: cssFiles.filter(isMerged).length, htmlCssMergedFiles: htmlCssFiles.filter(isMerged).length,
    htmlBlockedFiles: htmlFiles.filter(isBlocked).length, cssBlockedFiles: cssFiles.filter(isBlocked).length, htmlCssBlockedFiles: htmlCssFiles.filter(isBlocked).length,
    htmlParserEvidenceFiles: htmlFiles.filter(hasHtmlParserEvidence).length, cssParserEvidenceFiles: cssFiles.filter(hasCssParserEvidence).length, htmlCssParserEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlParserEvidence(file) || hasCssParserEvidence(file)).length,
    htmlParserEvidenceFailedFiles: htmlFiles.filter(hasParserEvidenceFailure).length, cssParserEvidenceFailedFiles: cssFiles.filter(hasParserEvidenceFailure).length, htmlCssParserEvidenceFailedFiles: htmlCssFiles.filter(hasParserEvidenceFailure).length,
    htmlIdentityEvidenceFiles: htmlFiles.filter(hasHtmlIdentityEvidence).length, cssSelectorTargetEvidenceFiles: cssFiles.filter(hasCssSelectorTargetEvidence).length, htmlCssStructuralTargetEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidence(file) || hasCssSelectorTargetEvidence(file)).length,
    cssSelectorTargetGraphEvidenceFiles: cssFiles.filter(hasCssSelectorTargetGraphEvidence).length, cssSelectorSpecificityEvidenceFiles: cssFiles.filter(hasCssSelectorSpecificityEvidence).length, cssSelectorTargetMoveFiles: cssFiles.filter(hasCssSelectorTargetMove).length,
    htmlExplicitIdentityEvidenceFiles: htmlFiles.filter(hasHtmlExplicitIdentityEvidence).length, htmlPathOnlyIdentityResidualFiles: htmlFiles.filter(hasHtmlPathOnlyIdentityResidual).length, htmlDuplicateIdentityEvidenceFiles: htmlFiles.filter(hasHtmlDuplicateIdentityEvidence).length, htmlDuplicateIdentityKeys: htmlFiles.reduce((sum, file) => sum + htmlDuplicateIdentityKeyCount(file), 0),
    htmlRuntimeBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlRuntimeBoundaryEvidence).length, htmlFrameworkBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlFrameworkBoundaryEvidence).length, htmlProofGapBlockedFiles: htmlFiles.filter(hasHtmlProofGapBlockedConflict).length,
    htmlIdentityEvidenceFailedFiles: htmlFiles.filter(hasHtmlIdentityEvidenceFailure).length, cssSelectorTargetConflictFiles: cssFiles.filter(hasCssSelectorTargetConflict).length, htmlCssStructuralTargetEvidenceFailedFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidenceFailure(file) || hasCssSelectorTargetConflict(file)).length,
    cssSelectorTargetRebasedFiles: cssFiles.filter(hasCssSelectorTargetRebase).length,
    cssScopedCascadeFiles: cssFiles.filter(hasCssScopedCascadeScope).length, cssScopedCascadeEvidenceFiles: cssFiles.filter(hasCssScopedCascadeEvidence).length, cssScopedCascadeBlockedFiles: cssFiles.filter(hasCssScopedCascadeMissingProof).length,
    cssDuplicateCascadeKeyBlockedFiles: cssFiles.filter(hasCssDuplicateCascadeKeyConflict).length,
    cssShorthandExpansionEvidenceFiles: cssFiles.filter(hasCssShorthandExpansionEvidence).length, cssDeterministicShorthandExpansionFiles: cssFiles.filter(hasCssDeterministicShorthandExpansionEvidence).length, cssShorthandExpansionBlockedFiles: cssFiles.filter(hasCssShorthandExpansionBlockedConflict).length,
    cssDependencySurfaceFiles: cssFiles.filter(hasCssDependencySurface).length, cssDependencyGraphEvidenceFiles: cssFiles.filter((file) => hasCssDependencySurface(file) && hasCssDependencyGraphEvidence(file)).length, cssDependencyGraphMissingProofFiles: cssFiles.filter(hasCssDependencyGraphMissingProof).length, cssDependencyGraphBlockedFiles: cssFiles.filter(hasCssDependencyGraphBlockedConflict).length,
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
  return evidence?.parserBackedStructuralSpans === true && evidence.structuralAddressability === true && !hasDuplicateExplicitIdentityKeys(evidence);
}
function hasHtmlExplicitIdentityEvidence(file) {
  const evidence = file?.result?.identityEvidence;
  return hasHtmlIdentityEvidence(file) && evidence.explicitIdentityAvailable === true;
}
function hasHtmlPathOnlyIdentityResidual(file) { return (file?.result?.identityEvidence?.pathOnlyIdentityElements ?? 0) > 0; }
function hasHtmlRuntimeBoundaryEvidence(file) {
  return (file?.result?.identityEvidence?.runtimeBoundaryElements ?? 0) > 0 || hasRuntimeBoundaryConflict(file) || hasHtmlRuntimeBoundaryProof(file);
}
function hasHtmlFrameworkBoundaryEvidence(file) {
  return (file?.result?.identityEvidence?.frameworkBoundaryElements ?? 0) > 0 || hasFrameworkBoundaryConflict(file);
}
function hasHtmlIdentityEvidenceFailure(file) {
  const evidence = file?.result?.identityEvidence;
  return Boolean(evidence) && (evidence.parserBackedStructuralSpans !== true || evidence.structuralAddressability !== true || hasDuplicateExplicitIdentityKeys(evidence));
}
function hasCssSelectorTargetEvidence(file) {
  const evidence = file?.result?.selectorTargetEvidence;
  return evidence?.parserBackedRuleSpans === true;
}
function hasCssSelectorTargetGraphEvidence(file) {
  return file?.result?.selectorTargetEvidence?.selectorTargetGraphHashPresent === true;
}
function hasCssSelectorSpecificityEvidence(file) {
  const sides = Object.values(file?.result?.selectorTargetEvidence?.sides ?? {});
  return sides.length > 0 && sides.every((side) => (side?.ruleCount ?? 0) === 0 || (side?.selectorSpecificityRecords ?? 0) >= side.ruleCount);
}
function hasCssSelectorTargetMove(file) {
  return (file?.result?.selectorTargetEvidence?.selectorMoveCount ?? 0) > 0;
}
function hasCssSelectorTargetConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => conflict.code === 'css-selector-target-conflict');
}
function hasHtmlProofGapBlockedConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => conflict.code === 'html-proof-gap-blocked');
}
function hasRuntimeBoundaryConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => HtmlRuntimeBoundaryReasonCodes.has(conflict?.details?.reasonCode));
}
function hasHtmlRuntimeBoundaryProof(file) {
  return [...(file?.result?.runtimeBoundaryProofs ?? []), ...(file?.result?.htmlRuntimeProofs ?? []), ...(file?.result?.admission?.htmlRuntimeBoundaryProofs ?? file?.admission?.htmlRuntimeBoundaryProofs ?? []), ...(file?.result?.admission?.htmlBrowserRuntimeProofs ?? file?.admission?.htmlBrowserRuntimeProofs ?? [])].some((proof) => proof?.status === 'passed' && HtmlRuntimeBoundaryReasonCodes.has(proof.reasonCode));
}
function hasFrameworkBoundaryConflict(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => HtmlFrameworkBoundaryReasonCodes.has(conflict?.details?.reasonCode));
}
function hasCssSelectorTargetRebase(file) { return (file?.result?.selectorTargetEvidence?.rebasedChangeCount ?? 0) > 0; }
function hasCssDuplicateCascadeKeyConflict(file) {
  return cssFileConflicts(file).some((conflict) => conflict.code === 'css-duplicate-cascade-key-blocked' || conflict?.details?.reasonCode === 'css-duplicate-cascade-key-order-unproved');
}
function hasCssShorthandExpansionEvidence(file) {
  return (file?.result?.shorthandExpansionEvidence?.changedShorthandCount ?? 0) > 0;
}
function hasCssDeterministicShorthandExpansionEvidence(file) {
  const evidence = file?.result?.shorthandExpansionEvidence;
  return (evidence?.changedShorthandCount ?? 0) > 0 && evidence.expandedChangedShorthandCount === evidence.changedShorthandCount && evidence.deterministicExpansionClaim === true;
}
function hasCssShorthandExpansionBlockedConflict(file) {
  return cssFileConflicts(file).some((conflict) => conflict?.details?.reasonCode === 'css-shorthand-expansion-unproved' || conflict?.details?.proofGap?.code === 'css-shorthand-expansion-unproved');
}
function hasCssScopedCascadeScope(file) {
  return cssScopedRuleCount(file) > 0 || hasCssScopedCascadeProofReason(file) || file?.result?.parserEvidence?.scopedCascadeGraphHashPresent === false;
}
function hasCssScopedCascadeEvidence(file) {
  return hasCssScopedCascadeScope(file) && !hasCssScopedCascadeMissingProof(file) && hasCssScopedCascadeProof(file);
}
function hasCssScopedCascadeMissingProof(file) {
  return hasCssScopedCascadeProofReason(file);
}
function hasCssScopedCascadeProofReason(file) {
  return (file?.result?.conflicts ?? file?.conflicts ?? []).some((conflict) => ScopedCascadeMissingProofReasonCodes.has(conflict?.details?.reasonCode));
}
function hasCssScopedCascadeProof(file) {
  return [...(file?.result?.scopedCascadeProofs ?? []), ...(file?.result?.admission?.cssScopedCascadeProofs ?? file?.admission?.cssScopedCascadeProofs ?? [])]
    .some((proof) => proof?.status === 'passed' && ScopedCascadeMissingProofReasonCodes.has(proof.reasonCode));
}
function cssScopedRuleCount(file) {
  const sides = Object.values(file?.result?.selectorTargetEvidence?.sides ?? {});
  return sides.reduce((count, side) => Math.max(count, side?.scopedRuleCount ?? 0), 0);
}
function hasCssDependencySurface(file) {
  return hasCssDependencyEvidenceSurface(file) || hasCssDependencyTextSurface(file) || hasCssDependencyConflictSurface(file);
}
function hasCssDependencyGraphEvidence(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => evidence.dependencyGraphHashPresent === true || evidence.cssDependencyGraphHashPresent === true || typeof evidence.dependencyGraphHash === 'string' || typeof evidence.cssDependencyGraphHash === 'string' || typeof evidence.graphHash === 'string' || typeof evidence.customPropertyGraphHash === 'string' || typeof evidence.animationGraphHash === 'string' || typeof evidence.fontFaceGraphHash === 'string' || typeof evidence.assetGraphHash === 'string');
}
function hasCssDependencyGraphMissingProof(file) { return hasCssDependencySurface(file) && !hasCssDependencyGraphEvidence(file); }
function hasCssDependencyEvidenceSurface(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => evidence.hasDependencySurface === true || (evidence.dependencySurfaceCount ?? 0) > 0 || (evidence.customPropertyDefinitions ?? 0) > 0 || (evidence.customPropertyReferences ?? 0) > 0 || (evidence.varReferences ?? 0) > 0 || (evidence.varFallbackReferences ?? 0) > 0 || (evidence.animationNameLinks ?? 0) > 0 || (evidence.keyframeLinks ?? 0) > 0 || (evidence.fontFaceLinks ?? 0) > 0 || (evidence.urlAssetReferences ?? 0) > 0);
}
function hasCssDependencyTextSurface(file) {
  const sourceText = cssDependencySourceText(file);
  return sourceText.length > 0 && CssDependencySurfacePatterns.some((pattern) => pattern.test(sourceText));
}
function hasCssDependencyConflictSurface(file) {
  return cssFileConflicts(file).some(isCssDependencyConflict);
}
function hasCssDependencyGraphBlockedConflict(file) {
  return cssFileConflicts(file).some((conflict) => isCssDependencyConflict(conflict) || CssDependencyMissingProofReasonCodes.has(conflict?.details?.reasonCode));
}
function cssDependencyEvidenceRecords(file) {
  const result = file?.result ?? {};
  return [result.dependencyEvidence, result.cssDependencyEvidence, result.dependencyGraphEvidence, result.cssDependencyGraphEvidence, result.parserEvidence?.dependencyEvidence, result.parserEvidence?.cssDependencyEvidence, result.parserEvidence?.dependencyGraphEvidence, result.parserEvidence?.cssDependencyGraphEvidence].filter(isPlainObject);
}
function cssDependencySourceText(file) {
  return [file?.outputSourceText, file?.sourceText, file?.result?.mergedSourceText].filter((value) => typeof value === 'string').join('\n');
}
function cssFileConflicts(file) { return file?.result?.conflicts ?? file?.conflicts ?? []; }
function isCssDependencyConflict(conflict) {
  const details = conflict?.details ?? {};
  const codes = [conflict?.code, details.reasonCode, details.proofGap?.code].map((value) => String(value ?? ''));
  return codes.some((code) => CssDependencyCodeFragments.some((fragment) => code.includes(fragment))) || isCssDependencyAtRule(details.before) || isCssDependencyAtRule(details.after);
}
function isCssDependencyAtRule(shape) { return CssDependencyAtRuleNames.has(String(shape?.atRuleName ?? '').toLowerCase()); }
function hasBrowserRuntimeProof(file) {
  const admission = file?.result?.admission ?? file?.admission ?? {};
  return admission.browserRuntimeEquivalenceClaim === true || admission.browserCascadeEquivalenceClaim === true || admission.browserRenderEquivalenceClaim === true;
}
function hasHtmlDuplicateIdentityEvidence(file) { return hasDuplicateExplicitIdentityKeys(file?.result?.identityEvidence); }
function htmlDuplicateIdentityKeyCount(file) {
  return duplicateExplicitIdentityKeys(file?.result?.identityEvidence).length;
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

const ScopedCascadeMissingProofReasonCodes = new Set(['css-scoped-cascade-equivalence-unproved', 'css-media-cascade-scope-unproved', 'css-supports-cascade-scope-unproved', 'css-container-cascade-scope-unproved', 'css-layer-cascade-scope-unproved', 'css-scope-cascade-scope-unproved']);
const HtmlRuntimeBoundaryReasonCodes = new Set(['script-runtime-boundary', 'style-runtime-boundary', 'template-runtime-boundary', 'slot-runtime-boundary', 'custom-element-runtime-boundary', 'event-handler-runtime-boundary', 'inline-style-runtime-boundary', 'iframe-runtime-boundary', 'iframe-srcdoc-runtime-boundary', 'form-runtime-boundary', 'form-submitter-runtime-boundary', 'form-control-runtime-boundary', 'document-base-runtime-boundary', 'document-metadata-runtime-boundary', 'resource-loading-runtime-boundary']);
const HtmlFrameworkBoundaryReasonCodes = new Set(['framework-directive-boundary', 'custom-element-runtime-boundary']);
const CssDependencyMissingProofReasonCodes = new Set(['css-dependency-graph-evidence-missing', 'css-custom-property-dependency-graph-unproved', 'css-var-fallback-dependency-graph-unproved', 'css-animation-name-keyframes-graph-unproved', 'css-font-face-dependency-graph-unproved', 'css-url-asset-dependency-graph-unproved']);
const CssDependencyAtRuleNames = new Set(['keyframes', 'font-face']);
const CssDependencyCodeFragments = ['custom-property', 'var-fallback', 'variable-dependency', 'dependency-graph', 'keyframes', 'animation-name', 'font-face', 'url-asset', 'asset-dependency'];
const CssDependencySurfacePatterns = [/(^|[;{\s])--[-_A-Za-z][\w-]*\s*:/, /\bvar\s*\(/i, /@(?:-[\w]+-)?keyframes\b/i, /(^|[;{\s])animation(?:-name)?\s*:/i, /@font-face\b/i, /\burl\s*\(/i];
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

export { htmlCssProjectSummary };
