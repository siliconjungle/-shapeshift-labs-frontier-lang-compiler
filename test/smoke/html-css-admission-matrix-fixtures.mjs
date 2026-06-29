import { HtmlCssProjectMergeMissingSignals } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';

export const matrixCells = [
  { id: 'source-text-merge/baseline-candidate-recorded', status: 'done', support: 'baseline', evidence: 'js-ts-project-source-text-merge-candidate', note: 'project admission records the conservative concrete source merge candidate as the baseline reviewed by semantic proof surfaces' },
  { id: 'html-css/html-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML parser/source evidence is parse5/source-span bounded and does not imply browser DOM or render equivalence' },
  { id: 'html-css/css-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS parser/source evidence is PostCSS/source-span bounded and does not imply cascade or browser equivalence' },
  { id: 'html-css/svg-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'SVG parser/source evidence is XML-shaped source-span and attribute-span bounded and does not imply paint, layout, or interaction equivalence' },
  { id: 'html-css/svg-reference-graph-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'SVG reference graph evidence records local id definitions, href references, and url(#id) paint/resource references without implying browser paint or layout equivalence' },
  { id: 'html-css/html-identity-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML identity evidence records explicit/path identity and duplicate identity blockers before structural admission' },
  { id: 'html-css/svg-identity-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'SVG identity evidence records explicit id/data-frontier-key identity and duplicate identity blockers before structural admission' },
  { id: 'html-css/css-selector-target-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS selector target evidence records target/specificity/rebase proof status before cascade admission' },
  { id: 'html-css/html-structural-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML structural merges require parser-backed identity evidence, carry token-list plus bounded add/delete/move unkeyed structural evidence, and keep runtime/browser proof as a separate row' },
  { id: 'html-css/svg-structural-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'SVG structural merges require SVG parser-backed identity evidence and keep paint, layout, focus, accessibility, and event proof as separate runtime rows' },
  { id: 'html-css/css-cascade-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS cascade merges require selector target, specificity, scoped cascade, and dependency evidence before admission' },
  { id: 'html-css/css-dependency-graph-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS dependency graph evidence is absent until custom property, animation, font, and asset dependency surfaces require it' },
  { id: 'html-css/css-runtime-descriptor-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS runtime descriptor evidence for property and page at-rules is parser/source bounded and separate from browser proof' },
  { id: 'css-modules/use-site-graph-proof', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-css-modules-use-sites', note: 'CSS Module use-site graph proof is a distinct project graph row and does not absorb transform proof gaps' },
  { id: 'css-modules/generated-class-name-map-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-contract-proofs', note: 'CSS Module generated class-name maps are proof-gated transform evidence and fail closed when absent' },
  { id: 'css-modules/bundler-transform-identity-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-contract-proofs', note: 'CSS Module bundler transform identity is proof-gated transform evidence and fail closed when absent' },
  { id: 'css-modules/source-map-identity-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-source-map-proof', note: 'CSS Module source-map identity is a distinct proof-gated transform boundary and fails closed when absent' },
  { id: 'html-css/svg-browser-runtime-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'SVG browser runtime proof is explicit bounded evidence for DOM/style/layout/accessibility/paint behavior and is missing by default without a proof bundle' },
  { id: 'html-css/browser-runtime-proof-bounded', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML/CSS browser runtime proof remains explicit bounded evidence and is missing by default without a proof bundle' }
];

export const htmlCssSummaryFieldOracles = [
  {
    surface: 'html-parser-source-evidence',
    readmeLabel: 'HTML parser/source evidence',
    cellId: 'html-parser-source-evidence',
    support: 'bounded-evidence',
    proofLevel: 'html-parser-source-evidence',
    routeId: 'prove-html-parser-source-evidence',
    routeLane: 'layout-markup-parser',
    routeNext: 'supply-parse5-source-span-and-trivia-evidence',
    signal: HtmlCssProjectMergeMissingSignals.htmlParserEvidence,
    fields: ['htmlFiles', 'htmlParserEvidenceFiles', 'htmlParserEvidenceFailedFiles'],
    missingSummary: { htmlFiles: 1, htmlParserEvidenceFiles: 0, htmlParserEvidenceFailedFiles: 0, htmlIdentityEvidenceFiles: 1 },
    expectedProofStatus: (summary) => summary.htmlFiles ? (summary.htmlParserEvidenceFailedFiles ? 'failed' : summary.htmlParserEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlFiles && summary.htmlParserEvidenceFiles !== summary.htmlFiles)
  },
  {
    surface: 'css-parser-source-evidence',
    readmeLabel: 'CSS parser/source evidence',
    cellId: 'css-parser-source-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-parser-source-evidence',
    routeId: 'prove-css-parser-source-evidence',
    routeLane: 'layout-style-parser',
    routeNext: 'supply-postcss-source-span-and-trivia-evidence',
    signal: HtmlCssProjectMergeMissingSignals.cssParserEvidence,
    fields: ['cssFiles', 'cssParserEvidenceFiles', 'cssParserEvidenceFailedFiles'],
    missingSummary: { cssFiles: 1, cssParserEvidenceFiles: 0, cssParserEvidenceFailedFiles: 0, cssSelectorTargetEvidenceFiles: 1, cssSelectorTargetConflictFiles: 0 },
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssParserEvidenceFailedFiles ? 'failed' : summary.cssParserEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssFiles && summary.cssParserEvidenceFiles !== summary.cssFiles)
  },
  {
    surface: 'svg-parser-source-evidence',
    readmeLabel: 'SVG parser/source evidence',
    cellId: 'svg-parser-source-evidence',
    support: 'bounded-evidence',
    proofLevel: 'svg-parser-source-evidence',
    routeId: 'prove-svg-parser-source-evidence',
    routeLane: 'layout-svg-parser',
    routeNext: 'supply-svg-source-span-attribute-span-and-trivia-evidence',
    signal: HtmlCssProjectMergeMissingSignals.svgParserEvidence,
    fields: ['svgFiles', 'svgParserEvidenceFiles', 'svgParserEvidenceFailedFiles'],
    missingSummary: { svgFiles: 1, svgParserEvidenceFiles: 0, svgParserEvidenceFailedFiles: 0, svgIdentityEvidenceFiles: 1 },
    expectedProofStatus: (summary) => summary.svgFiles ? (summary.svgParserEvidenceFailedFiles ? 'failed' : summary.svgParserEvidenceFiles === summary.svgFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.svgFiles && summary.svgParserEvidenceFiles !== summary.svgFiles)
  },
  {
    surface: 'svg-reference-graph-evidence',
    readmeLabel: 'SVG reference graph evidence',
    cellId: 'svg-reference-graph-evidence',
    support: 'bounded-evidence',
    proofLevel: 'svg-reference-graph',
    routeId: 'prove-svg-reference-graph-evidence',
    routeLane: 'layout-svg-graph',
    routeNext: 'supply-svg-id-href-and-url-reference-graph-evidence',
    signal: HtmlCssProjectMergeMissingSignals.svgReferenceGraphEvidence,
    fields: ['svgFiles', 'svgReferenceGraphEvidenceFiles', 'svgReferenceGraphEvidenceFailedFiles', 'svgReferenceGraphMissingReferenceRecords'],
    missingSummary: { svgFiles: 1, svgParserEvidenceFiles: 1, svgReferenceGraphEvidenceFiles: 0, svgReferenceGraphEvidenceFailedFiles: 0, svgIdentityEvidenceFiles: 1 },
    expectedProofStatus: (summary) => summary.svgFiles ? (summary.svgReferenceGraphEvidenceFailedFiles ? 'failed' : summary.svgReferenceGraphEvidenceFiles === summary.svgFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.svgFiles && summary.svgReferenceGraphEvidenceFiles !== summary.svgFiles)
  },
  {
    surface: 'html-identity-evidence',
    readmeLabel: 'HTML identity evidence',
    cellId: 'html-identity-evidence',
    support: 'bounded-evidence',
    proofLevel: 'html-identity-evidence',
    routeId: 'prove-html-identity-evidence',
    routeLane: 'layout-markup-identity',
    routeNext: 'supply-stable-element-identity-and-structural-addressability-evidence',
    signal: HtmlCssProjectMergeMissingSignals.htmlIdentityEvidence,
    fields: ['htmlFiles', 'htmlIdentityEvidenceFiles', 'htmlIdentityEvidenceFailedFiles'],
    missingSummary: { htmlFiles: 1, htmlParserEvidenceFiles: 1, htmlIdentityEvidenceFiles: 0, htmlIdentityEvidenceFailedFiles: 0 },
    expectedProofStatus: (summary) => summary.htmlFiles ? (summary.htmlIdentityEvidenceFailedFiles ? 'failed' : summary.htmlIdentityEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlFiles && summary.htmlIdentityEvidenceFiles !== summary.htmlFiles)
  },
  {
    surface: 'svg-identity-evidence',
    readmeLabel: 'SVG identity evidence',
    cellId: 'svg-identity-evidence',
    support: 'bounded-evidence',
    proofLevel: 'svg-identity-evidence',
    routeId: 'prove-svg-identity-evidence',
    routeLane: 'layout-svg-identity',
    routeNext: 'supply-stable-svg-id-reference-and-structural-addressability-evidence',
    signal: HtmlCssProjectMergeMissingSignals.svgIdentityEvidence,
    fields: ['svgFiles', 'svgIdentityEvidenceFiles', 'svgIdentityEvidenceFailedFiles'],
    missingSummary: { svgFiles: 1, svgParserEvidenceFiles: 1, svgIdentityEvidenceFiles: 0, svgIdentityEvidenceFailedFiles: 0 },
    expectedProofStatus: (summary) => summary.svgFiles ? (summary.svgIdentityEvidenceFailedFiles ? 'failed' : summary.svgIdentityEvidenceFiles === summary.svgFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.svgFiles && summary.svgIdentityEvidenceFiles !== summary.svgFiles)
  },
  {
    surface: 'css-selector-target-evidence',
    readmeLabel: 'CSS selector target evidence',
    cellId: 'css-selector-target-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-selector-target-evidence',
    routeId: 'prove-css-selector-target-evidence',
    routeLane: 'layout-style-targets',
    routeNext: 'supply-selector-target-graph-and-rebase-evidence',
    signal: HtmlCssProjectMergeMissingSignals.cssSelectorTargetEvidence,
    fields: ['cssFiles', 'cssSelectorTargetEvidenceFiles', 'cssSelectorTargetConflictFiles'],
    missingSummary: { cssFiles: 1, cssParserEvidenceFiles: 1, cssSelectorTargetEvidenceFiles: 0, cssSelectorTargetConflictFiles: 0 },
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssSelectorTargetConflictFiles ? 'failed' : summary.cssSelectorTargetEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssFiles && (summary.cssSelectorTargetEvidenceFiles !== summary.cssFiles || summary.cssSelectorTargetConflictFiles))
  },
  {
    surface: 'html-structural-merge-admission',
    readmeLabel: 'HTML structural merge admission',
    cellId: 'html-structural-merge-admission',
    support: 'partial',
    proofLevel: 'html-structural-merge',
    routeId: 'admit-html-structural-merge',
    routeLane: 'layout-markup-graph',
    routeNext: 'prove-parser-identity-and-runtime-boundary-evidence-or-fix-duplicate-identity',
    signal: HtmlCssProjectMergeMissingSignals.htmlStructuralMerge,
    fields: ['htmlFiles', 'htmlMergedFiles', 'htmlBlockedFiles', 'htmlParserEvidenceFiles', 'htmlIdentityEvidenceFiles', 'htmlUnkeyedStructuralAddFiles', 'htmlUnkeyedStructuralAddEvidenceRecords', 'htmlUnkeyedStructuralDeleteFiles', 'htmlUnkeyedStructuralDeleteEvidenceRecords', 'htmlUnkeyedStructuralMoveFiles', 'htmlUnkeyedStructuralMoveEvidenceRecords'],
    missingSummary: { htmlFiles: 1, htmlParserEvidenceFiles: 1, htmlIdentityEvidenceFiles: 1, htmlMergedFiles: 0, htmlBlockedFiles: 1, htmlUnkeyedStructuralAddFiles: 0, htmlUnkeyedStructuralAddEvidenceRecords: 0, htmlUnkeyedStructuralDeleteFiles: 0, htmlUnkeyedStructuralDeleteEvidenceRecords: 0, htmlUnkeyedStructuralMoveFiles: 0, htmlUnkeyedStructuralMoveEvidenceRecords: 0 },
    expectedProofStatus: (summary) => {
      if (!summary.htmlFiles) return 'absent';
      if (summary.htmlBlockedFiles || summary.htmlParserEvidenceFailedFiles || summary.htmlIdentityEvidenceFailedFiles) return 'failed';
      if (summary.htmlMergedFiles !== summary.htmlFiles) return 'missing';
      if (summary.htmlParserEvidenceFiles !== summary.htmlFiles || summary.htmlIdentityEvidenceFiles !== summary.htmlFiles) return 'missing';
      return 'passed';
    },
    expectedMissingRoute: (summary) => Boolean(summary.htmlFiles && (
      summary.htmlBlockedFiles ||
      summary.htmlParserEvidenceFailedFiles ||
      summary.htmlIdentityEvidenceFailedFiles ||
      summary.htmlMergedFiles !== summary.htmlFiles ||
      summary.htmlParserEvidenceFiles !== summary.htmlFiles ||
      summary.htmlIdentityEvidenceFiles !== summary.htmlFiles
    ))
  },
  {
    surface: 'svg-structural-merge-admission',
    readmeLabel: 'SVG structural merge admission',
    cellId: 'svg-structural-merge-admission',
    support: 'partial',
    proofLevel: 'svg-structural-merge',
    routeId: 'admit-svg-structural-merge',
    routeLane: 'layout-svg-graph',
    routeNext: 'prove-svg-parser-identity-reference-and-runtime-boundary-evidence-or-fix-duplicate-identity',
    signal: HtmlCssProjectMergeMissingSignals.svgStructuralMerge,
    fields: ['svgFiles', 'svgMergedFiles', 'svgBlockedFiles', 'svgParserEvidenceFiles', 'svgReferenceGraphEvidenceFiles', 'svgIdentityEvidenceFiles', 'svgStructuralAddFiles', 'svgStructuralDeleteFiles', 'svgStructuralMoveFiles'],
    missingSummary: { svgFiles: 1, svgParserEvidenceFiles: 1, svgReferenceGraphEvidenceFiles: 1, svgIdentityEvidenceFiles: 1, svgMergedFiles: 0, svgBlockedFiles: 1, svgStructuralAddFiles: 0, svgStructuralDeleteFiles: 0, svgStructuralMoveFiles: 0 },
    expectedProofStatus: (summary) => {
      if (!summary.svgFiles) return 'absent';
      if (summary.svgBlockedFiles || summary.svgParserEvidenceFailedFiles || summary.svgReferenceGraphEvidenceFailedFiles || summary.svgIdentityEvidenceFailedFiles) return 'failed';
      if (summary.svgMergedFiles !== summary.svgFiles) return 'missing';
      if (summary.svgParserEvidenceFiles !== summary.svgFiles || summary.svgReferenceGraphEvidenceFiles !== summary.svgFiles || summary.svgIdentityEvidenceFiles !== summary.svgFiles) return 'missing';
      return 'passed';
    },
    expectedMissingRoute: (summary) => Boolean(summary.svgFiles && (
      summary.svgBlockedFiles ||
      summary.svgParserEvidenceFailedFiles ||
      summary.svgReferenceGraphEvidenceFailedFiles ||
      summary.svgIdentityEvidenceFailedFiles ||
      summary.svgMergedFiles !== summary.svgFiles ||
      summary.svgParserEvidenceFiles !== summary.svgFiles ||
      summary.svgReferenceGraphEvidenceFiles !== summary.svgFiles ||
      summary.svgIdentityEvidenceFiles !== summary.svgFiles
    ))
  },
  {
    surface: 'css-cascade-merge-admission',
    readmeLabel: 'CSS cascade merge admission',
    cellId: 'css-cascade-merge-admission',
    support: 'partial',
    proofLevel: 'css-cascade-merge',
    routeId: 'admit-css-cascade-merge',
    routeLane: 'layout-style-graph',
    routeNext: 'supply-source-bound-css-shape-scoped-cascade-proof',
    signal: HtmlCssProjectMergeMissingSignals.cssCascadeMerge,
    fields: ['cssFiles', 'cssMergedFiles', 'cssBlockedFiles'],
    missingSummary: { cssFiles: 1, cssParserEvidenceFiles: 1, cssSelectorTargetEvidenceFiles: 1, cssSelectorTargetConflictFiles: 0, cssMergedFiles: 0, cssBlockedFiles: 1, cssDuplicateCascadeKeyBlockedFiles: 0, cssShorthandExpansionBlockedFiles: 0, cssScopedCascadeBlockedFiles: 0, cssScopedCascadeShapeEvidenceFiles: 0 },
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssBlockedFiles ? 'failed' : summary.cssMergedFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssBlockedFiles)
  },
  {
    surface: 'css-dependency-graph-evidence',
    readmeLabel: 'CSS dependency graph evidence',
    cellId: 'css-dependency-graph-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-dependency-graph',
    routeId: 'prove-css-dependency-graph',
    routeLane: 'layout-style-graph',
    routeNext: 'supply-css-custom-property-var-fallback-animation-font-and-asset-dependency-graph',
    signal: HtmlCssProjectMergeMissingSignals.cssDependencyGraphEvidence,
    fields: ['cssDependencySurfaceFiles', 'cssDependencyGraphEvidenceFiles', 'cssDependencyGraphMissingProofFiles', 'cssDependencyGraphBlockedFiles'],
    missingSummary: { cssDependencySurfaceFiles: 1, cssDependencyGraphEvidenceFiles: 0, cssDependencyGraphMissingProofFiles: 1, cssDependencyGraphBlockedFiles: 0 },
    expectedProofStatus: (summary) => summary.cssDependencySurfaceFiles ? (summary.cssDependencyGraphBlockedFiles ? 'failed' : summary.cssDependencyGraphEvidenceFiles === summary.cssDependencySurfaceFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssDependencySurfaceFiles && (summary.cssDependencyGraphEvidenceFiles !== summary.cssDependencySurfaceFiles || summary.cssDependencyGraphMissingProofFiles || summary.cssDependencyGraphBlockedFiles))
  },
  {
    surface: 'css-runtime-descriptor-evidence',
    readmeLabel: 'CSS runtime descriptor evidence',
    cellId: 'css-runtime-descriptor-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-runtime-descriptor-evidence',
    routeId: 'prove-css-runtime-descriptor-evidence',
    routeLane: 'layout-style-descriptors',
    routeNext: 'supply-font-face-property-page-typed-descriptor-source-evidence',
    signal: HtmlCssProjectMergeMissingSignals.cssRuntimeDescriptorEvidence,
    fields: ['cssRuntimeDescriptorFiles', 'cssRuntimeDescriptorEvidenceFiles', 'cssRuntimeDescriptorBlockedFiles'],
    missingSummary: { cssRuntimeDescriptorFiles: 1, cssRuntimeDescriptorEvidenceFiles: 0, cssRuntimeDescriptorBlockedFiles: 0, cssPropertyDescriptorFiles: 1, cssPropertyDescriptorEvidenceFiles: 0, cssPageDescriptorFiles: 0, cssPageDescriptorEvidenceFiles: 0 },
    expectedProofStatus: (summary) => summary.cssRuntimeDescriptorFiles ? (summary.cssRuntimeDescriptorBlockedFiles ? 'failed' : summary.cssRuntimeDescriptorEvidenceFiles === summary.cssRuntimeDescriptorFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssRuntimeDescriptorFiles && (summary.cssRuntimeDescriptorEvidenceFiles !== summary.cssRuntimeDescriptorFiles || summary.cssRuntimeDescriptorBlockedFiles))
  },
  {
    surface: 'html-css-browser-runtime-proof',
    readmeLabel: 'HTML/CSS browser runtime proof',
    cellId: 'browser-runtime-proof-bounded',
    support: 'bounded-evidence',
    proofLevel: 'browser-runtime-proof',
    routeId: 'prove-html-css-browser-runtime',
    routeLane: 'browser-proof',
    routeNext: 'produce-playwright-assertion-runtime-proof-bundle',
    signal: HtmlCssProjectMergeMissingSignals.htmlCssBrowserRuntimeProof,
    fields: ['htmlCssFiles', 'htmlCssMergedFiles', 'htmlCssBrowserRuntimeProofs', 'htmlCssBrowserRuntimeProofBlockedFiles'],
    missingSummary: { htmlCssFiles: 2, htmlCssMergedFiles: 2, htmlCssBrowserRuntimeProofs: 0, htmlCssBrowserRuntimeProofBlockedFiles: 0 },
    expectedProofStatus: (summary) => summary.htmlCssFiles ? (summary.htmlCssBrowserRuntimeProofBlockedFiles ? 'failed' : summary.htmlCssBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlCssMergedFiles && !summary.htmlCssBrowserRuntimeProofs)
  },
  {
    surface: 'svg-browser-runtime-proof',
    readmeLabel: 'SVG browser runtime proof',
    cellId: 'svg-browser-runtime-proof',
    support: 'bounded-evidence',
    proofLevel: 'svg-browser-runtime-proof',
    routeId: 'prove-svg-browser-runtime',
    routeLane: 'browser-proof',
    routeNext: 'produce-svg-dom-style-layout-accessibility-and-paint-proof-bundle',
    signal: HtmlCssProjectMergeMissingSignals.svgBrowserRuntimeProof,
    fields: ['svgFiles', 'svgMergedFiles', 'svgBrowserRuntimeProofs', 'svgBrowserRuntimeProofBlockedFiles'],
    missingSummary: { svgFiles: 1, svgMergedFiles: 1, svgBrowserRuntimeProofs: 0, svgBrowserRuntimeProofBlockedFiles: 0 },
    expectedProofStatus: (summary) => summary.svgFiles ? (summary.svgBrowserRuntimeProofBlockedFiles ? 'failed' : summary.svgBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.svgMergedFiles && !summary.svgBrowserRuntimeProofs)
  }
];
