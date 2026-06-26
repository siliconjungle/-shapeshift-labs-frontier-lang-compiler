const HtmlCssProjectMergeMissingSignals = Object.freeze({
  htmlParserEvidence: 'html-parser-source-evidence-missing',
  cssParserEvidence: 'css-parser-source-evidence-missing',
  htmlIdentityEvidence: 'html-identity-evidence-missing',
  cssSelectorTargetEvidence: 'css-selector-target-evidence-missing',
  htmlStructuralMerge: 'html-structural-merge-proof-blocked',
  cssCascadeMerge: 'css-cascade-merge-proof-blocked',
  htmlCssBrowserRuntimeProof: 'html-css-browser-runtime-proof-not-available'
});

function htmlCssProjectMergeMissingEvidenceRoutes(route, signals) {
  return {
    [signals.htmlParserEvidence]: route('prove-html-parser-source-evidence', 'layout-markup-parser', 'supply-parse5-source-span-and-trivia-evidence'),
    [signals.cssParserEvidence]: route('prove-css-parser-source-evidence', 'layout-style-parser', 'supply-postcss-source-span-and-trivia-evidence'),
    [signals.htmlIdentityEvidence]: route('prove-html-identity-evidence', 'layout-markup-identity', 'supply-stable-element-identity-and-structural-addressability-evidence'),
    [signals.cssSelectorTargetEvidence]: route('prove-css-selector-target-evidence', 'layout-style-targets', 'supply-selector-target-graph-and-rebase-evidence'),
    [signals.htmlStructuralMerge]: route('admit-html-structural-merge', 'layout-markup-graph', 'supply-html-parser-reference-and-boundary-evidence'),
    [signals.cssCascadeMerge]: route('admit-css-cascade-merge', 'layout-style-graph', 'supply-css-parser-cascade-and-scope-evidence'),
    [signals.htmlCssBrowserRuntimeProof]: route('prove-html-css-browser-runtime', 'browser-proof', 'attach-browser-runtime-proof-bundle')
  };
}

function htmlCssProjectMergeAdmissionMatrixRows(matrixRow, signals) {
  return [
    matrixRow('html-parser-source-evidence', 'bounded-evidence', ['html-parser-source-evidence'], [signals.htmlParserEvidence]),
    matrixRow('css-parser-source-evidence', 'bounded-evidence', ['css-parser-source-evidence'], [signals.cssParserEvidence]),
    matrixRow('html-identity-evidence', 'bounded-evidence', ['html-identity-evidence'], [signals.htmlIdentityEvidence]),
    matrixRow('css-selector-target-evidence', 'bounded-evidence', ['css-selector-target-evidence'], [signals.cssSelectorTargetEvidence]),
    matrixRow('html-structural-merge-admission', 'partial', ['html-structural-merge'], [signals.htmlStructuralMerge]),
    matrixRow('css-cascade-merge-admission', 'partial', ['css-cascade-merge'], [signals.cssCascadeMerge]),
    matrixRow('html-css-browser-runtime-proof', 'bounded-evidence', ['browser-runtime-proof'], [signals.htmlCssBrowserRuntimeProof])
  ];
}

function htmlCssProjectMergeMissingEvidenceItems(summary, signals, missingEvidenceItem) {
  const items = [];
  if (summary.htmlFiles && summary.htmlParserEvidenceFiles !== summary.htmlFiles) items.push(missingEvidenceItem({ code: signals.htmlParserEvidence, scope: 'layout-markup-parser', kind: 'html-parser-source-evidence', proofLevel: 'html-parser-source-evidence', action: 'review', summary: `HTML project merge has parser/source evidence for ${summary.htmlParserEvidenceFiles}/${summary.htmlFiles} file(s); require parse5 source spans, zero parse errors, and attribute/trivia spans when those surfaces are present before parser evidence admission.` }));
  if (summary.cssFiles && summary.cssParserEvidenceFiles !== summary.cssFiles) items.push(missingEvidenceItem({ code: signals.cssParserEvidence, scope: 'layout-style-parser', kind: 'css-parser-source-evidence', proofLevel: 'css-parser-source-evidence', action: 'review', summary: `CSS project merge has parser/source evidence for ${summary.cssParserEvidenceFiles}/${summary.cssFiles} file(s); require PostCSS rule/declaration spans, raw trivia hashes, and zero parse errors before parser evidence admission.` }));
  if (summary.htmlFiles && summary.htmlIdentityEvidenceFiles !== summary.htmlFiles) items.push(missingEvidenceItem({ code: signals.htmlIdentityEvidence, scope: 'layout-markup-identity', kind: 'html-identity-evidence', proofLevel: 'html-identity-evidence', action: 'review', summary: `HTML project merge has structural identity evidence for ${summary.htmlIdentityEvidenceFiles}/${summary.htmlFiles} file(s); require parser-backed structural spans and stable explicit/path identity accounting before structural admission.` }));
  if (summary.cssFiles && (summary.cssSelectorTargetEvidenceFiles !== summary.cssFiles || summary.cssSelectorTargetConflictFiles)) items.push(missingEvidenceItem({ code: signals.cssSelectorTargetEvidence, scope: 'layout-style-targets', kind: 'css-selector-target-evidence', proofLevel: 'css-selector-target-evidence', action: 'review', summary: `CSS project merge has selector-target evidence for ${summary.cssSelectorTargetEvidenceFiles}/${summary.cssFiles} file(s) with ${summary.cssSelectorTargetConflictFiles} selector target conflict(s); require selector target graph and proven rebase before target-moving merges.` }));
  if (summary.htmlBlockedFiles) items.push(missingEvidenceItem({ code: signals.htmlStructuralMerge, scope: 'layout-markup-graph', kind: 'html-structural-merge-proof', proofLevel: 'html-structural-merge', action: 'review', summary: `HTML project merge has ${summary.htmlBlockedFiles} blocked file(s); supply parser/source-span evidence, stable element identity, and runtime-boundary proof before admission.` }));
  if (summary.cssBlockedFiles) items.push(missingEvidenceItem({ code: signals.cssCascadeMerge, scope: 'layout-style-graph', kind: 'css-cascade-merge-proof', proofLevel: 'css-cascade-merge', action: 'review', summary: `CSS project merge has ${summary.cssBlockedFiles} blocked file(s); supply parser/cascade/scope evidence and keep browser claims false until runtime proof passes.` }));
  if (summary.htmlCssMergedFiles && !summary.htmlCssBrowserRuntimeProofs) items.push(missingEvidenceItem({ code: signals.htmlCssBrowserRuntimeProof, scope: 'browser-proof', kind: 'browser-runtime-proof', proofLevel: 'browser-runtime-proof', action: 'review', summary: 'HTML/CSS structural source merge was available, but browser DOM/cascade/layout/runtime proof was not attached; keep browser equivalence claims false.', suggestedInput: { browserRuntimeProof: true } }));
  return items;
}

function htmlCssProjectMergeMatrixProofStatus(level, summary) {
  if (level === 'html-parser-source-evidence') return summary.htmlFiles ? (summary.htmlParserEvidenceFailedFiles ? 'failed' : summary.htmlParserEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-parser-source-evidence') return summary.cssFiles ? (summary.cssParserEvidenceFailedFiles ? 'failed' : summary.cssParserEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'html-identity-evidence') return summary.htmlFiles ? (summary.htmlIdentityEvidenceFailedFiles ? 'failed' : summary.htmlIdentityEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-selector-target-evidence') return summary.cssFiles ? (summary.cssSelectorTargetConflictFiles ? 'failed' : summary.cssSelectorTargetEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'html-structural-merge') return summary.htmlFiles ? (summary.htmlBlockedFiles ? 'failed' : summary.htmlMergedFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-cascade-merge') return summary.cssFiles ? (summary.cssBlockedFiles ? 'failed' : summary.cssMergedFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'browser-runtime-proof') return summary.htmlCssFiles ? (summary.htmlCssBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent';
  return undefined;
}

export { HtmlCssProjectMergeMissingSignals, htmlCssProjectMergeAdmissionMatrixRows, htmlCssProjectMergeMatrixProofStatus, htmlCssProjectMergeMissingEvidenceItems, htmlCssProjectMergeMissingEvidenceRoutes };
