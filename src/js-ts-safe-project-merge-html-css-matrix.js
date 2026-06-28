const HtmlCssProjectMergeMissingSignals = Object.freeze({
  htmlParserEvidence: 'html-parser-source-evidence-missing',
  cssParserEvidence: 'css-parser-source-evidence-missing',
  htmlIdentityEvidence: 'html-identity-evidence-missing',
  cssSelectorTargetEvidence: 'css-selector-target-evidence-missing',
  htmlStructuralMerge: 'html-structural-merge-proof-blocked',
  cssCascadeMerge: 'css-cascade-merge-proof-blocked',
  cssDependencyGraphEvidence: 'css-dependency-graph-evidence-missing',
  cssRuntimeDescriptorEvidence: 'css-runtime-descriptor-evidence-missing',
  htmlCssBrowserRuntimeProof: 'html-css-browser-runtime-proof-not-available'
});

function htmlCssProjectMergeMissingEvidenceRoutes(route, signals) {
  return {
    [signals.htmlParserEvidence]: route('prove-html-parser-source-evidence', 'layout-markup-parser', 'supply-parse5-source-span-and-trivia-evidence'),
    [signals.cssParserEvidence]: route('prove-css-parser-source-evidence', 'layout-style-parser', 'supply-postcss-source-span-and-trivia-evidence'),
    [signals.htmlIdentityEvidence]: route('prove-html-identity-evidence', 'layout-markup-identity', 'supply-stable-element-identity-and-structural-addressability-evidence'),
    [signals.cssSelectorTargetEvidence]: route('prove-css-selector-target-evidence', 'layout-style-targets', 'supply-selector-target-graph-and-rebase-evidence'),
    [signals.htmlStructuralMerge]: route('admit-html-structural-merge', 'layout-markup-graph', 'prove-parser-identity-and-runtime-boundary-evidence-or-fix-duplicate-identity'),
    [signals.cssCascadeMerge]: route('admit-css-cascade-merge', 'layout-style-graph', 'supply-source-bound-css-shape-scoped-cascade-proof'),
    [signals.cssDependencyGraphEvidence]: route('prove-css-dependency-graph', 'layout-style-graph', 'supply-css-custom-property-var-fallback-animation-font-and-asset-dependency-graph'),
    [signals.cssRuntimeDescriptorEvidence]: route('prove-css-runtime-descriptor-evidence', 'layout-style-descriptors', 'supply-font-face-property-page-typed-descriptor-source-evidence'),
    [signals.htmlCssBrowserRuntimeProof]: route('prove-html-css-browser-runtime', 'browser-proof', 'produce-playwright-assertion-runtime-proof-bundle')
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
    matrixRow('css-dependency-graph-evidence', 'bounded-evidence', ['css-dependency-graph'], [signals.cssDependencyGraphEvidence]),
    matrixRow('css-runtime-descriptor-evidence', 'bounded-evidence', ['css-runtime-descriptor-evidence'], [signals.cssRuntimeDescriptorEvidence]),
    matrixRow('html-css-browser-runtime-proof', 'bounded-evidence', ['browser-runtime-proof'], [signals.htmlCssBrowserRuntimeProof])
  ];
}

function htmlCssProjectMergeMissingEvidenceItems(summary, signals, missingEvidenceItem) {
  const items = [];
  if (summary.htmlFiles && summary.htmlParserEvidenceFiles !== summary.htmlFiles) items.push(missingEvidenceItem({ code: signals.htmlParserEvidence, scope: 'layout-markup-parser', kind: 'html-parser-source-evidence', proofLevel: 'html-parser-source-evidence', action: 'review', summary: `HTML project merge has parser/source evidence for ${summary.htmlParserEvidenceFiles}/${summary.htmlFiles} file(s); require parse5 source spans, zero parse errors, and attribute/trivia spans when those surfaces are present before parser evidence admission.` }));
  if (summary.cssFiles && summary.cssParserEvidenceFiles !== summary.cssFiles) items.push(missingEvidenceItem({ code: signals.cssParserEvidence, scope: 'layout-style-parser', kind: 'css-parser-source-evidence', proofLevel: 'css-parser-source-evidence', action: 'review', summary: `CSS project merge has parser/source evidence for ${summary.cssParserEvidenceFiles}/${summary.cssFiles} file(s); require PostCSS rule/declaration spans, raw trivia hashes, and zero parse errors before parser evidence admission.` }));
  if (summary.htmlFiles && summary.htmlIdentityEvidenceFiles !== summary.htmlFiles) items.push(missingEvidenceItem({ code: signals.htmlIdentityEvidence, scope: 'layout-markup-identity', kind: 'html-identity-evidence', proofLevel: 'html-identity-evidence', action: 'review', summary: `HTML project merge has structural identity evidence for ${summary.htmlIdentityEvidenceFiles}/${summary.htmlFiles} file(s) with ${summary.htmlDuplicateIdentityEvidenceFiles ?? 0} duplicate identity evidence file(s); require parser-backed structural spans, unique explicit identity keys, and stable explicit/path identity accounting before structural admission.` }));
  if (summary.cssFiles && (summary.cssSelectorTargetEvidenceFiles !== summary.cssFiles || summary.cssSelectorTargetConflictFiles)) items.push(missingEvidenceItem({ code: signals.cssSelectorTargetEvidence, scope: 'layout-style-targets', kind: 'css-selector-target-evidence', proofLevel: 'css-selector-target-evidence', action: 'review', summary: `CSS project merge has selector-target evidence for ${summary.cssSelectorTargetEvidenceFiles}/${summary.cssFiles} file(s) with ${summary.cssSelectorTargetConflictFiles} selector target conflict(s); require selector target graph and proven rebase before target-moving merges.` }));
  if (summary.htmlFiles && htmlStructuralMergePrerequisitesStatus(summary) !== 'passed') items.push(missingEvidenceItem({ code: signals.htmlStructuralMerge, scope: 'layout-markup-graph', kind: 'html-structural-merge-proof', proofLevel: 'html-structural-merge', action: 'review', summary: `HTML structural admission has ${summary.htmlMergedFiles ?? 0}/${summary.htmlFiles} merged file(s), ${summary.htmlBlockedFiles ?? 0} blocked file(s), parser evidence for ${summary.htmlParserEvidenceFiles ?? 0}/${summary.htmlFiles} file(s), and identity evidence for ${summary.htmlIdentityEvidenceFiles ?? 0}/${summary.htmlFiles} file(s); require every HTML file to merge with parser/source evidence and stable identity evidence before structural admission. Runtime/browser proof remains a separate row.`, suggestedInput: { htmlRuntimeBoundaryProofsByPath: true, htmlUniqueExplicitIdentityKeys: true, htmlParserSourceEvidence: true, htmlIdentityEvidence: true, playwrightSourceRuntimeProof: true, playwrightAssertionRuntimeProof: true } }));
  if (summary.cssBlockedFiles) items.push(missingEvidenceItem({ code: signals.cssCascadeMerge, scope: 'layout-style-graph', kind: 'css-cascade-merge-proof', proofLevel: 'css-cascade-merge', action: 'review', summary: `CSS project merge has ${summary.cssBlockedFiles} blocked file(s), including ${summary.cssDuplicateCascadeKeyBlockedFiles ?? 0} duplicate cascade-key blocker(s), ${summary.cssOrderedCascadeOccurrenceEvidenceRecords ?? 0} ordered duplicate-occurrence evidence record(s), ${summary.cssShorthandExpansionBlockedFiles ?? 0} shorthand expansion blocker(s), ${summary.cssScopedCascadeBlockedFiles} scoped cascade proof block(s), and ${summary.cssScopedCascadeShapeEvidenceFiles ?? 0} shape-keyed scoped proof file(s); supply parser/cascade/scope evidence, require deterministic shorthand expansion evidence for changed box shorthands, require ordered cascade occurrence evidence for unstable duplicate same-property declarations, require source-bound scoped cascade proofs with exact scope shape keys and base/worker/head/output hashes for changed declarations under @media/@supports/@container/@layer/@scope or nested scopes, and keep browser claims false until runtime proof passes.` }));
  if (summary.cssDependencySurfaceFiles && (summary.cssDependencyGraphEvidenceFiles !== summary.cssDependencySurfaceFiles || summary.cssDependencyGraphMissingProofFiles || summary.cssDependencyGraphBlockedFiles)) items.push(missingEvidenceItem({ code: signals.cssDependencyGraphEvidence, scope: 'layout-style-graph', kind: 'css-dependency-graph-evidence', proofLevel: 'css-dependency-graph', action: 'review', summary: `CSS project merge has dependency graph evidence for ${summary.cssDependencyGraphEvidenceFiles}/${summary.cssDependencySurfaceFiles} dependency-surface file(s), ${summary.cssDependencyGraphMissingProofFiles} missing dependency graph proof(s), and ${summary.cssDependencyGraphBlockedFiles} dependency blocker(s); require source-bound custom property, var() fallback hash, @keyframes/animation-name, @font-face, @property, @page, and url() asset graph evidence before cascade/browser equivalence claims, and keep missing or stale dependency graph hashes on the review route.`, suggestedInput: { cssDependencyGraphEvidence: true, cssVarFallbackDependencyGraphEvidence: true } }));
  if (summary.cssRuntimeDescriptorFiles && (summary.cssRuntimeDescriptorEvidenceFiles !== summary.cssRuntimeDescriptorFiles || summary.cssRuntimeDescriptorBlockedFiles)) items.push(missingEvidenceItem({ code: signals.cssRuntimeDescriptorEvidence, scope: 'layout-style-descriptors', kind: 'css-runtime-descriptor-evidence', proofLevel: 'css-runtime-descriptor-evidence', action: 'review', summary: `CSS project merge has typed descriptor evidence for ${summary.cssRuntimeDescriptorEvidenceFiles}/${summary.cssRuntimeDescriptorFiles} runtime descriptor file(s), including @font-face family/src records, ${summary.cssPropertyDescriptorEvidenceFiles}/${summary.cssPropertyDescriptorFiles} @property file(s), and ${summary.cssPageDescriptorEvidenceFiles}/${summary.cssPageDescriptorFiles} @page file(s); require parser-backed descriptor records, descriptor source spans, @font-face font-family/src evidence, typed @property syntax/inherits/initial-value evidence, @page descriptor records, and stable at-rule shape keys before descriptor admission. Browser equivalence still requires separate cssCascadeRuntimeProofs.`, suggestedInput: { cssRuntimeDescriptorEvidence: true } }));
  if (summary.htmlCssMergedFiles && !summary.htmlCssBrowserRuntimeProofs) items.push(missingEvidenceItem({ code: signals.htmlCssBrowserRuntimeProof, scope: 'browser-proof', kind: 'browser-runtime-proof', proofLevel: 'browser-runtime-proof', action: 'review', summary: 'HTML/CSS structural source merge was available, but runtime-evidence-bound browser DOM/cascade/layout/runtime proof was not attached; run @shapeshift-labs/frontier-playwright runFrontierPlaywrightAssertionRuntimeProof or runFrontierPlaywrightSourceRuntimeProof to produce source-bound proofBuilderInput for createHtmlRuntimeProof/createHtmlRuntimeBoundaryProof or createCssCascadeRuntimeProof, then attach htmlRuntimeBoundaryProofsByPath for HTML runtime boundaries or cssCascadeRuntimeProofs for CSS runtime at-rules such as @keyframes, @font-face, @property, and @page. Runtime proofs must include command, probe id, evidence hash, required runtime signals, concrete browser assertions where applicable, and no broad proof self-claims.', suggestedInput: { browserRuntimeProof: true, playwrightSourceRuntimeProof: true, playwrightAssertionRuntimeProof: true, proofBuilderInput: true } }));
  return items;
}

function htmlCssProjectMergeMatrixProofStatus(level, summary) {
  if (level === 'html-parser-source-evidence') return summary.htmlFiles ? (summary.htmlParserEvidenceFailedFiles ? 'failed' : summary.htmlParserEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-parser-source-evidence') return summary.cssFiles ? (summary.cssParserEvidenceFailedFiles ? 'failed' : summary.cssParserEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'html-identity-evidence') return summary.htmlFiles ? (summary.htmlIdentityEvidenceFailedFiles ? 'failed' : summary.htmlIdentityEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-selector-target-evidence') return summary.cssFiles ? (summary.cssSelectorTargetConflictFiles ? 'failed' : summary.cssSelectorTargetEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'html-structural-merge') return htmlStructuralMergePrerequisitesStatus(summary);
  if (level === 'css-cascade-merge') return summary.cssFiles ? (summary.cssBlockedFiles ? 'failed' : summary.cssMergedFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-dependency-graph') return summary.cssDependencySurfaceFiles ? (summary.cssDependencyGraphBlockedFiles ? 'failed' : summary.cssDependencyGraphEvidenceFiles === summary.cssDependencySurfaceFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'css-runtime-descriptor-evidence') return summary.cssRuntimeDescriptorFiles ? (summary.cssRuntimeDescriptorBlockedFiles ? 'failed' : summary.cssRuntimeDescriptorEvidenceFiles === summary.cssRuntimeDescriptorFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'browser-runtime-proof') return summary.htmlCssFiles ? (summary.htmlCssBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent';
  return undefined;
}

function htmlStructuralMergePrerequisitesStatus(summary) {
  if (!summary.htmlFiles) return 'absent';
  if (summary.htmlBlockedFiles || summary.htmlParserEvidenceFailedFiles || summary.htmlIdentityEvidenceFailedFiles) return 'failed';
  if (summary.htmlMergedFiles !== summary.htmlFiles) return 'missing';
  if (summary.htmlParserEvidenceFiles !== summary.htmlFiles || summary.htmlIdentityEvidenceFiles !== summary.htmlFiles) return 'missing';
  return 'passed';
}

export { HtmlCssProjectMergeMissingSignals, htmlCssProjectMergeAdmissionMatrixRows, htmlCssProjectMergeMatrixProofStatus, htmlCssProjectMergeMissingEvidenceItems, htmlCssProjectMergeMissingEvidenceRoutes };
