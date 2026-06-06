import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{renderers}from'./renderers.js';
export function renderTargetAst(ast, target = 'typescript') {
  const normalized = normalizeCompileTarget(target);
  const renderer = renderers[normalized];
  return renderer(ast);
}
