import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{projectors}from'./projectors.js';
export function projectFrontierAst(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const projector = projectors[normalized];
  return projector(document, options);
}
