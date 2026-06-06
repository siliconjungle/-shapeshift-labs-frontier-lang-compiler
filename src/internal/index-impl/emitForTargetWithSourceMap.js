import{idFragment}from'../../native-import-utils.js';
import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{projectFrontierAst}from'./projectFrontierAst.js';import{renderTargetAstWithSourceMap}from'./renderTargetAstWithSourceMap.js';
export function emitForTargetWithSourceMap(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const ast = projectFrontierAst(document, normalized, options);
  const result = renderTargetAstWithSourceMap(ast, normalized, {
    sourceMapId: options.sourceMapId ?? `sourcemap_${idFragment(document.id)}_${normalized}`,
    ...options
  });
  return { ...result, ast };
}
