const CssModuleProjectMergeMissingSignals = Object.freeze({
  cssModuleUseSiteGraph: 'css-module-use-site-graph-proof-blocked',
  cssModuleGeneratedClassNameMap: 'css-module-generated-class-name-map-proof-blocked',
  cssModuleBundlerTransformIdentity: 'css-module-bundler-transform-identity-proof-blocked',
  cssModuleSourceMapIdentity: 'css-module-source-map-identity-proof-blocked'
});

function cssModuleProjectMergeMissingEvidenceRoutes(route, signals) {
  return {
    [signals.cssModuleUseSiteGraph]: route('prove-css-module-use-site-graph', 'layout-style-graph', 'supply-css-module-transform-and-use-site-proof'),
    [signals.cssModuleGeneratedClassNameMap]: route('prove-css-module-generated-class-name-map', 'layout-style-graph', 'supply-css-module-generated-class-name-map'),
    [signals.cssModuleBundlerTransformIdentity]: route('prove-css-module-bundler-transform-identity', 'layout-style-graph', 'supply-css-module-bundler-transform-identity-proof'),
    [signals.cssModuleSourceMapIdentity]: route('prove-css-module-source-map-identity', 'layout-style-graph', 'supply-css-module-source-map-identity-proof')
  };
}

function cssModuleProjectMergeAdmissionMatrixRows(matrixRow, signals) {
  return [matrixRow('css-modules-use-site-graph', 'partial', [
    'css-module-use-site-graph',
    'css-module-transform-proof',
    'css-module-generated-class-name-map',
    'css-module-bundler-transform-identity',
    'css-module-source-map-identity',
    'project-graph-evidence'
  ], [
    signals.cssModuleUseSiteGraph,
    signals.cssModuleGeneratedClassNameMap,
    signals.cssModuleBundlerTransformIdentity,
    signals.cssModuleSourceMapIdentity
  ])];
}

function cssModuleProjectMergeMissingEvidenceItems(summary, signals, missingEvidenceItem) {
  const items = [];
  if (summary.projectGraphCssModuleUseSiteProofBlockers) items.push(missingEvidenceItem({
    code: signals.cssModuleUseSiteGraph, scope: 'layout-style-graph', kind: 'css-module-use-site-proof', proofLevel: 'css-module-use-site-graph', action: 'review',
    summary: `CSS Module use-site graph has ${summary.projectGraphCssModuleUseSiteProofBlockers} non-transform blocker(s); supply narrow use-site graph evidence before admission.`,
    suggestedInput: { includeOutputProjectSymbolGraph: true, cssModuleEvidence: true }
  }));
  if (summary.projectGraphCssModuleGeneratedClassNameMapBlockers) items.push(cssModuleTransformMissingEvidence(missingEvidenceItem, signals.cssModuleGeneratedClassNameMap, 'css-module-generated-class-name-map', summary.projectGraphCssModuleGeneratedClassNameMapBlockers, 'generated class-name map'));
  if (summary.projectGraphCssModuleBundlerTransformIdentityBlockers) items.push(cssModuleTransformMissingEvidence(missingEvidenceItem, signals.cssModuleBundlerTransformIdentity, 'css-module-bundler-transform-identity', summary.projectGraphCssModuleBundlerTransformIdentityBlockers, 'bundler transform identity'));
  if (summary.projectGraphCssModuleSourceMapIdentityBlockers) items.push(cssModuleTransformMissingEvidence(missingEvidenceItem, signals.cssModuleSourceMapIdentity, 'css-module-source-map-identity', summary.projectGraphCssModuleSourceMapIdentityBlockers, 'source-map identity'));
  return items;
}

function cssModuleProjectMergeMatrixProofStatus(level, summary) {
  if (level === 'css-module-use-site-graph') return summary.projectGraphCssModuleUseSiteProofBlockers ? 'failed' : summary.projectGraphCssModuleUseSiteGraphs ? 'passed' : summary.projectGraphEvidenceIncluded ? 'absent' : 'missing';
  if (level === 'css-module-transform-proof') return summary.projectGraphCssModuleTransformProofBlockers ? 'failed' : summary.projectGraphCssModuleImportBindings ? 'passed' : summary.projectGraphEvidenceIncluded ? 'absent' : 'missing';
  if (level === 'css-module-generated-class-name-map') return cssModuleTransformProofStatus(summary, 'projectGraphCssModuleGeneratedClassNameMapBlockers');
  if (level === 'css-module-bundler-transform-identity') return cssModuleTransformProofStatus(summary, 'projectGraphCssModuleBundlerTransformIdentityBlockers');
  if (level === 'css-module-source-map-identity') return cssModuleTransformProofStatus(summary, 'projectGraphCssModuleSourceMapIdentityBlockers');
  return undefined;
}

function cssModuleTransformMissingEvidence(missingEvidenceItem, code, proofLevel, count, label) {
  return missingEvidenceItem({
    code,
    scope: 'layout-style-graph',
    kind: 'css-module-transform-proof',
    proofLevel,
    action: 'review',
    summary: `CSS Module ${label} proof has ${count} blocker(s); attach source-bound transform evidence before admission.`,
    suggestedInput: { includeOutputProjectSymbolGraph: true, cssModuleEvidence: true }
  });
}

function cssModuleTransformProofStatus(summary, blockerField) {
  return summary[blockerField] ? 'failed' : summary.projectGraphCssModuleImportBindings ? 'passed' : summary.projectGraphEvidenceIncluded ? 'absent' : 'missing';
}

export {
  CssModuleProjectMergeMissingSignals,
  cssModuleProjectMergeAdmissionMatrixRows,
  cssModuleProjectMergeMatrixProofStatus,
  cssModuleProjectMergeMissingEvidenceItems,
  cssModuleProjectMergeMissingEvidenceRoutes
};
