import { CssDependencyAtRuleNames, CssDependencyCodeFragments, CssDependencyMissingProofReasonCodes, CssDependencySurfacePatterns, CssRuntimeDescriptorReasonCodes, CssRuntimeEquivalenceReasonCodes, HtmlFrameworkBoundaryReasonCodes, HtmlRuntimeBoundaryReasonCodes, RequiredParserEvidenceSideNames, ScopedCascadeMissingProofReasonCodes } from './js-ts-safe-project-merge-html-css-summary-constants.js';
import { cssOrderedCascadeOccurrenceEvidenceRecords, hasCssOrderedCascadeOccurrenceEvidence } from './js-ts-safe-project-merge-css-ordered-cascade-evidence.js';
import { cssDescriptorEvidenceCount, cssFontFaceDescriptorEvidenceCount, cssPageDescriptorEvidenceCount, cssPropertyDescriptorEvidenceCount, hasSourceBoundPageDescriptorEvidence, hasSourceBoundPropertyDescriptorEvidence } from './js-ts-safe-project-merge-css-runtime-descriptor-evidence.js';
import { htmlStructuralMergeEvidenceSummary } from './js-ts-safe-project-merge-html-class-token-evidence.js';
import { parserEvidenceSourceHashBindingValid } from './js-ts-safe-project-merge-html-css-parser-source-hash-binding.js';

function htmlCssProjectSummary(files) {
  const htmlFiles = files.filter(isHtmlProjectFile), cssFiles = files.filter(isCssProjectFile), htmlCssFiles = [...htmlFiles, ...cssFiles];
  return {
    htmlFiles: htmlFiles.length, cssFiles: cssFiles.length, htmlCssFiles: htmlCssFiles.length,
    htmlMergedFiles: htmlFiles.filter(isMerged).length, cssMergedFiles: cssFiles.filter(isMerged).length, htmlCssMergedFiles: htmlCssFiles.filter(isMerged).length,
    htmlBlockedFiles: htmlFiles.filter(isBlocked).length, cssBlockedFiles: cssFiles.filter(isBlocked).length, htmlCssBlockedFiles: htmlCssFiles.filter(isBlocked).length,
    htmlParserEvidenceFiles: htmlFiles.filter(hasHtmlParserEvidence).length, cssParserEvidenceFiles: cssFiles.filter(hasCssParserEvidence).length, htmlCssParserEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlParserEvidence(file) || hasCssParserEvidence(file)).length,
    htmlParserEvidenceFailedFiles: htmlFiles.filter(hasHtmlParserEvidenceFailure).length, cssParserEvidenceFailedFiles: cssFiles.filter(hasCssParserEvidenceFailure).length, htmlCssParserEvidenceFailedFiles: htmlCssFiles.filter((file) => hasHtmlParserEvidenceFailure(file) || hasCssParserEvidenceFailure(file)).length,
    htmlIdentityEvidenceFiles: htmlFiles.filter(hasHtmlIdentityEvidence).length, cssSelectorTargetEvidenceFiles: cssFiles.filter(hasCssSelectorTargetEvidence).length, htmlCssStructuralTargetEvidenceFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidence(file) || hasCssSelectorTargetEvidence(file)).length,
    cssSelectorTargetGraphEvidenceFiles: cssFiles.filter(hasCssSelectorTargetGraphEvidence).length, cssSelectorSpecificityEvidenceFiles: cssFiles.filter(hasCssSelectorSpecificityEvidence).length, cssSelectorTargetMoveFiles: cssFiles.filter(hasCssSelectorTargetMove).length,
    htmlExplicitIdentityEvidenceFiles: htmlFiles.filter(hasHtmlExplicitIdentityEvidence).length, htmlPathOnlyIdentityResidualFiles: htmlFiles.filter(hasHtmlPathOnlyIdentityResidual).length, htmlDuplicateIdentityEvidenceFiles: htmlFiles.filter(hasHtmlDuplicateIdentityEvidence).length, htmlDuplicateIdentityKeys: htmlFiles.reduce((sum, file) => sum + htmlDuplicateIdentityKeyCount(file), 0),
    htmlRuntimeBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlRuntimeBoundaryEvidence).length, htmlFrameworkBoundaryEvidenceFiles: htmlFiles.filter(hasHtmlFrameworkBoundaryEvidence).length, htmlProofGapBlockedFiles: htmlFiles.filter(hasHtmlProofGapBlockedConflict).length,
    ...htmlStructuralMergeEvidenceSummary(htmlFiles),
    htmlIdentityEvidenceFailedFiles: htmlFiles.filter(hasHtmlIdentityEvidenceFailure).length, cssSelectorTargetConflictFiles: cssFiles.filter(hasCssSelectorTargetConflict).length, htmlCssStructuralTargetEvidenceFailedFiles: htmlCssFiles.filter((file) => hasHtmlIdentityEvidenceFailure(file) || hasCssSelectorTargetConflict(file)).length,
    cssSelectorTargetRebasedFiles: cssFiles.filter(hasCssSelectorTargetRebase).length,
    cssScopedCascadeFiles: cssFiles.filter(hasCssScopedCascadeScope).length, cssScopedCascadeEvidenceFiles: cssFiles.filter(hasCssScopedCascadeEvidence).length, cssScopedCascadeShapeEvidenceFiles: cssFiles.filter(hasCssScopedCascadeShapeEvidence).length, cssScopedCascadeBlockedFiles: cssFiles.filter(hasCssScopedCascadeMissingProof).length,
    cssDuplicateCascadeKeyBlockedFiles: cssFiles.filter(hasCssDuplicateCascadeKeyConflict).length, cssOrderedCascadeOccurrenceEvidenceFiles: cssFiles.filter(hasCssOrderedCascadeOccurrenceEvidence).length, cssOrderedCascadeOccurrenceEvidenceRecords: cssFiles.reduce((sum, file) => sum + cssOrderedCascadeOccurrenceEvidenceRecords(file).length, 0),
    cssShorthandExpansionEvidenceFiles: cssFiles.filter(hasCssShorthandExpansionEvidence).length, cssDeterministicShorthandExpansionFiles: cssFiles.filter(hasCssDeterministicShorthandExpansionEvidence).length, cssShorthandExpansionBlockedFiles: cssFiles.filter(hasCssShorthandExpansionBlockedConflict).length,
    cssDependencySurfaceFiles: cssFiles.filter(hasCssDependencySurface).length, cssDependencyGraphEvidenceFiles: cssFiles.filter((file) => hasCssDependencySurface(file) && hasCssDependencyGraphEvidence(file)).length, cssDependencyGraphMissingProofFiles: cssFiles.filter(hasCssDependencyGraphMissingProof).length, cssDependencyGraphBlockedFiles: cssFiles.filter(hasCssDependencyGraphBlockedConflict).length,
    cssRuntimeDescriptorFiles: cssFiles.filter(hasCssRuntimeDescriptorSurface).length, cssRuntimeDescriptorEvidenceFiles: cssFiles.filter((file) => hasCssRuntimeDescriptorSurface(file) && hasCssRuntimeDescriptorEvidence(file)).length, cssRuntimeDescriptorBlockedFiles: cssFiles.filter(hasCssRuntimeDescriptorBlockedConflict).length,
    cssPropertyDescriptorFiles: cssFiles.filter(hasCssPropertyDescriptorSurface).length, cssPropertyDescriptorEvidenceFiles: cssFiles.filter((file) => hasCssPropertyDescriptorSurface(file) && hasCssPropertyDescriptorEvidence(file)).length,
    cssPageDescriptorFiles: cssFiles.filter(hasCssPageDescriptorSurface).length, cssPageDescriptorEvidenceFiles: cssFiles.filter((file) => hasCssPageDescriptorSurface(file) && hasCssPageDescriptorEvidence(file)).length,
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
  const sides = requiredParserEvidenceSides(evidence);
  return evidence?.kind === 'frontier.lang.htmlSafeMergeParserEvidence' &&
    evidence.parseErrors === 0 &&
    Array.isArray(evidence.parserNames) &&
    evidence.parserNames.includes('parse5') &&
    hasHtmlParserSpanCounts(evidence) &&
    htmlParserSideEvidenceValid(evidence) &&
    parserEvidenceSourceHashBindingValid(file, evidence) &&
    sides.length > 0 &&
    sides.every((side) => side.parserName === 'parse5' && hasHtmlParserSpanCounts(side) && htmlParserSideEvidenceValid(side));
}
function hasCssParserEvidence(file) {
  const evidence = file?.result?.parserEvidence;
  const sides = requiredParserEvidenceSides(evidence);
  return evidence?.kind === 'frontier.lang.cssSafeMergeParserEvidence' &&
    evidence.parseErrors === 0 &&
    Array.isArray(evidence.parserNames) &&
    evidence.parserNames.includes('postcss') &&
    cssParserEvidenceValid(evidence) &&
    parserEvidenceSourceHashBindingValid(file, evidence) &&
    sides.length > 0 &&
    sides.every((side) => side.parserName === 'postcss' && cssParserSideEvidenceValid(side));
}
function hasHtmlParserEvidenceFailure(file) {
  return isHtmlProjectFile(file) && Boolean(file?.result?.parserEvidence) && !hasHtmlParserEvidence(file);
}
function hasCssParserEvidenceFailure(file) {
  return isCssProjectFile(file) && Boolean(file?.result?.parserEvidence) && !hasCssParserEvidence(file);
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
function hasHtmlParserSpanCounts(evidence) {
  return hasNonNegativeCounts(evidence, ['recordCount', 'sourceSpanRecordCount', 'attributeSpanElementCount', 'structuralSpanRecordCount', 'leadingTriviaSpanRecordCount']) &&
    hasZeroCounts(evidence, ['sourceSpanMissingRecordCount', 'attributeSpanMissingElementCount', 'structuralSpanMissingRecordCount']);
}
function htmlParserSideEvidenceValid(evidence) {
  return evidence?.sourceCodeLocationInfo === true &&
    evidence.parserBackedSourceSpans === true &&
    ((evidence.attributeSpanElementCount ?? 0) === 0 || evidence.parserBackedAttributeSpans === true) &&
    (evidence.leadingTriviaSpanRecordCount === 0 || evidence.parserBackedTriviaSpans === true);
}
function cssParserSideEvidenceValid(evidence) {
  return cssParserEvidenceValid(evidence) &&
    hasNonNegativeCounts(evidence, ['recordCount', 'declarationCount']);
}
function cssParserEvidenceValid(evidence) {
  return evidence?.sourceCodeLocationInfo === true &&
    evidence.parserBackedSourceSpans === true &&
    evidence.parserBackedDeclarationSpans === true &&
    evidence.parserBackedTriviaHashes === true &&
    evidence.parseErrors === 0;
}
function hasNonNegativeCounts(record, keys) {
  return keys.every((key) => Number.isInteger(record?.[key]) && record[key] >= 0);
}
function hasZeroCounts(record, keys) {
  return keys.every((key) => record?.[key] === 0);
}
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
  return hasAdmittedBrowserRuntimeProof(file) &&
    htmlRuntimeProofRecords(file).some((proof) => isRuntimeEvidenceBoundProof(proof) && HtmlRuntimeBoundaryReasonCodes.has(proof.reasonCode));
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
function hasCssScopedCascadeShapeEvidence(file) {
  return [...(file?.result?.scopedCascadeProofs ?? []), ...(file?.result?.admission?.cssScopedCascadeProofs ?? file?.admission?.cssScopedCascadeProofs ?? [])]
    .some((proof) => proof?.status === 'passed' && ScopedCascadeMissingProofReasonCodes.has(proof.reasonCode) && typeof proof.scopedCascadeGraphShapeKey === 'string');
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
  return cssDependencyEvidenceRecords(file).some((evidence) => evidence.hasDependencySurface === true || (evidence.dependencySurfaceCount ?? 0) > 0 || (evidence.customPropertyDefinitions ?? 0) > 0 || (evidence.customPropertyReferences ?? 0) > 0 || (evidence.varReferences ?? 0) > 0 || (evidence.varFallbackReferences ?? 0) > 0 || (evidence.animationNameLinks ?? 0) > 0 || (evidence.keyframeLinks ?? 0) > 0 || (evidence.fontFaceLinks ?? 0) > 0 || (evidence.urlAssetReferences ?? 0) > 0 || cssDescriptorEvidenceCount(evidence) > 0);
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
function hasCssRuntimeDescriptorSurface(file) { return hasCssFontFaceDescriptorSurface(file) || hasCssPropertyDescriptorSurface(file) || hasCssPageDescriptorSurface(file); }
function hasCssRuntimeDescriptorEvidence(file) { return hasCssFontFaceDescriptorEvidence(file) || hasCssPropertyDescriptorEvidence(file) || hasCssPageDescriptorEvidence(file); }
function hasCssFontFaceDescriptorSurface(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => cssFontFaceDescriptorEvidenceCount(evidence) > 0) || /@font-face\b/i.test(cssDependencySourceText(file));
}
function hasCssPropertyDescriptorSurface(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => cssPropertyDescriptorEvidenceCount(evidence) > 0) || /@property\b/i.test(cssDependencySourceText(file));
}
function hasCssPageDescriptorSurface(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => cssPageDescriptorEvidenceCount(evidence) > 0) || /@page\b/i.test(cssDependencySourceText(file));
}
function hasCssFontFaceDescriptorEvidence(file) {
  return cssDependencyEvidenceRecords(file).some((evidence) => cssFontFaceDescriptorEvidenceCount(evidence) > 0);
}
function hasCssPropertyDescriptorEvidence(file) {
  return cssDependencyEvidenceRecords(file).some(hasSourceBoundPropertyDescriptorEvidence);
}
function hasCssPageDescriptorEvidence(file) {
  return cssDependencyEvidenceRecords(file).some(hasSourceBoundPageDescriptorEvidence);
}
function hasCssRuntimeDescriptorBlockedConflict(file) {
  return cssFileConflicts(file).some((conflict) => CssRuntimeDescriptorReasonCodes.has(conflict?.details?.reasonCode) || CssRuntimeDescriptorReasonCodes.has(conflict?.details?.proofGap?.code));
}
function cssDependencyEvidenceRecords(file) {
  const result = file?.result ?? {};
  const records = [result.dependencyEvidence, result.cssDependencyEvidence, result.dependencyGraphEvidence, result.cssDependencyGraphEvidence, result.parserEvidence?.dependencyEvidence, result.parserEvidence?.cssDependencyEvidence, result.parserEvidence?.dependencyGraphEvidence, result.parserEvidence?.cssDependencyGraphEvidence].filter(isPlainObject);
  return [...records, ...records.flatMap(cssDependencyEvidenceSides)];
}
function cssDependencyEvidenceSides(evidence) { return Object.values(evidence?.sides ?? {}).filter(isPlainObject); }
function cssDependencySourceText(file) {
  return [file?.outputSourceText, file?.sourceText, file?.result?.mergedSourceText].filter((value) => typeof value === 'string').join('\n');
}
function cssFileConflicts(file) { return file?.result?.conflicts ?? file?.conflicts ?? []; }
function isCssDependencyConflict(conflict) {
  if (isCssRuntimeEquivalenceConflict(conflict)) return false;
  const details = conflict?.details ?? {};
  const codes = [conflict?.code, details.reasonCode, details.proofGap?.code].map((value) => String(value ?? ''));
  return codes.some((code) => CssDependencyCodeFragments.some((fragment) => code.includes(fragment))) || isCssDependencyAtRule(details.before) || isCssDependencyAtRule(details.after);
}
function isCssDependencyAtRule(shape) { return CssDependencyAtRuleNames.has(String(shape?.atRuleName ?? '').toLowerCase()); }
function isCssRuntimeEquivalenceConflict(conflict) {
  const details = conflict?.details ?? {};
  return CssRuntimeEquivalenceReasonCodes.has(String(details.reasonCode ?? '')) || CssRuntimeEquivalenceReasonCodes.has(String(details.proofGap?.code ?? ''));
}
function hasBrowserRuntimeProof(file) {
  return hasAdmittedBrowserRuntimeProof(file) && browserRuntimeProofRecords(file).some(isRuntimeEvidenceBoundProof);
}

function hasAdmittedBrowserRuntimeProof(file) {
  const admission = file?.result?.admission ?? file?.admission ?? {};
  return admission.browserRuntimeEquivalenceClaim === true ||
    admission.browserCascadeEquivalenceClaim === true ||
    admission.browserRenderEquivalenceClaim === true;
}

function htmlRuntimeProofRecords(file) {
  return [
    ...(file?.result?.runtimeBoundaryProofs ?? []),
    ...(file?.result?.htmlRuntimeProofs ?? []),
    ...(file?.result?.admission?.htmlRuntimeBoundaryProofs ?? file?.admission?.htmlRuntimeBoundaryProofs ?? []),
    ...(file?.result?.admission?.htmlBrowserRuntimeProofs ?? file?.admission?.htmlBrowserRuntimeProofs ?? [])
  ];
}

function browserRuntimeProofRecords(file) {
  return [
    ...htmlRuntimeProofRecords(file),
    ...(file?.result?.cascadeRuntimeProofs ?? []),
    ...(file?.result?.admission?.cssCascadeRuntimeProofs ?? file?.admission?.cssCascadeRuntimeProofs ?? [])
  ];
}

function isRuntimeEvidenceBoundProof(proof) {
  return proof?.status === 'passed' &&
    proof.runtimeEvidenceBound === true &&
    typeof proof.runtimeCommand === 'string' &&
    typeof proof.runtimeProbeId === 'string' &&
    typeof proof.runtimeEvidenceHash === 'string' &&
    Array.isArray(proof.runtimeSignals) &&
    proof.runtimeSignals.length > 0;
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

function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

export { htmlCssProjectSummary };
