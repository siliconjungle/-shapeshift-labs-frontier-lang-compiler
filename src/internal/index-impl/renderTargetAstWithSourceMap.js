import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{sourceMapRenderers}from'./sourceMapRenderers.js';
export function renderTargetAstWithSourceMap(ast, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const renderer = sourceMapRenderers[normalized];
  return renderer(ast, options);
}
