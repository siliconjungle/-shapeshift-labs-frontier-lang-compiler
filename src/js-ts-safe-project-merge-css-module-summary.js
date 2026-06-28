function cssModuleProjectSummaryFields(projectSymbolGraph, cssModuleConflicts = []) {
  const blockers = projectSymbolGraph?.cssModuleUseSiteBlockers ?? cssModuleConflicts.map((conflict) => conflict.details).filter(Boolean);
  const generatedClassNameMapBlockers = countCssModuleProofBoundary(blockers, 'css-module-generated-class-name-map');
  const bundlerTransformIdentityBlockers = countCssModuleProofBoundary(blockers, 'css-module-bundler-transform-identity');
  const sourceMapIdentityBlockers = countCssModuleProofBoundary(blockers, 'css-module-source-map-identity');
  return {
    projectGraphCssModuleUseSiteBlockers: blockers.length,
    projectGraphCssModuleUseSiteProofBlockers: countCssModuleProofBoundary(blockers, 'css-module-use-site-graph'),
    projectGraphCssModuleGeneratedClassNameMapBlockers: generatedClassNameMapBlockers,
    projectGraphCssModuleBundlerTransformIdentityBlockers: bundlerTransformIdentityBlockers,
    projectGraphCssModuleSourceMapIdentityBlockers: sourceMapIdentityBlockers,
    projectGraphCssModuleTransformProofBlockers: generatedClassNameMapBlockers + bundlerTransformIdentityBlockers + sourceMapIdentityBlockers
  };
}

function countCssModuleProofBoundary(blockers, proofBoundary) {
  return blockers.filter((blocker) => cssModuleProofBoundary(blocker) === proofBoundary).length;
}

function cssModuleProofBoundary(blocker) {
  if (blocker?.proofBoundary) return blocker.proofBoundary;
  if (blocker?.reasonCode === 'css-module-generated-class-map-hash-mismatch') return 'css-module-generated-class-name-map';
  if (blocker?.reasonCode === 'css-module-generated-class-map-unproved') return 'css-module-generated-class-name-map';
  if (blocker?.reasonCode === 'css-module-bundler-transform-identity-unproved') return 'css-module-bundler-transform-identity';
  if (blocker?.reasonCode === 'css-module-source-map-proof-unproved' || blocker?.reasonCode === 'css-module-source-map-proof-hash-mismatch') return 'css-module-source-map-identity';
  return 'css-module-use-site-graph';
}

export { cssModuleProjectSummaryFields };
