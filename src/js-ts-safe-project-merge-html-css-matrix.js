const HtmlCssProjectMergeMissingSignals = Object.freeze({
  htmlStructuralMerge: 'html-structural-merge-proof-blocked',
  cssCascadeMerge: 'css-cascade-merge-proof-blocked',
  htmlCssBrowserRuntimeProof: 'html-css-browser-runtime-proof-not-available'
});

function htmlCssProjectMergeMissingEvidenceRoutes(route, signals) {
  return {
    [signals.htmlStructuralMerge]: route('admit-html-structural-merge', 'layout-markup-graph', 'supply-html-parser-reference-and-boundary-evidence'),
    [signals.cssCascadeMerge]: route('admit-css-cascade-merge', 'layout-style-graph', 'supply-css-parser-cascade-and-scope-evidence'),
    [signals.htmlCssBrowserRuntimeProof]: route('prove-html-css-browser-runtime', 'browser-proof', 'attach-browser-runtime-proof-bundle')
  };
}

function htmlCssProjectMergeAdmissionMatrixRows(matrixRow, signals) {
  return [
    matrixRow('html-structural-merge-admission', 'partial', ['html-structural-merge'], [signals.htmlStructuralMerge]),
    matrixRow('css-cascade-merge-admission', 'partial', ['css-cascade-merge'], [signals.cssCascadeMerge]),
    matrixRow('html-css-browser-runtime-proof', 'bounded-evidence', ['browser-runtime-proof'], [signals.htmlCssBrowserRuntimeProof])
  ];
}

function htmlCssProjectMergeMissingEvidenceItems(summary, signals, missingEvidenceItem) {
  const items = [];
  if (summary.htmlBlockedFiles) items.push(missingEvidenceItem({ code: signals.htmlStructuralMerge, scope: 'layout-markup-graph', kind: 'html-structural-merge-proof', proofLevel: 'html-structural-merge', action: 'review', summary: `HTML project merge has ${summary.htmlBlockedFiles} blocked file(s); supply parser/source-span evidence, stable element identity, and runtime-boundary proof before admission.` }));
  if (summary.cssBlockedFiles) items.push(missingEvidenceItem({ code: signals.cssCascadeMerge, scope: 'layout-style-graph', kind: 'css-cascade-merge-proof', proofLevel: 'css-cascade-merge', action: 'review', summary: `CSS project merge has ${summary.cssBlockedFiles} blocked file(s); supply parser/cascade/scope evidence and keep browser claims false until runtime proof passes.` }));
  if (summary.htmlCssMergedFiles && !summary.htmlCssBrowserRuntimeProofs) items.push(missingEvidenceItem({ code: signals.htmlCssBrowserRuntimeProof, scope: 'browser-proof', kind: 'browser-runtime-proof', proofLevel: 'browser-runtime-proof', action: 'review', summary: 'HTML/CSS structural source merge was available, but browser DOM/cascade/layout/runtime proof was not attached; keep browser equivalence claims false.', suggestedInput: { browserRuntimeProof: true } }));
  return items;
}

function htmlCssProjectMergeMatrixProofStatus(level, summary) {
  if (level === 'html-structural-merge') return summary.htmlFiles ? (summary.htmlBlockedFiles ? 'failed' : summary.htmlMergedFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-cascade-merge') return summary.cssFiles ? (summary.cssBlockedFiles ? 'failed' : summary.cssMergedFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'browser-runtime-proof') return summary.htmlCssFiles ? (summary.htmlCssBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent';
  return undefined;
}

export { HtmlCssProjectMergeMissingSignals, htmlCssProjectMergeAdmissionMatrixRows, htmlCssProjectMergeMatrixProofStatus, htmlCssProjectMergeMissingEvidenceItems, htmlCssProjectMergeMissingEvidenceRoutes };
