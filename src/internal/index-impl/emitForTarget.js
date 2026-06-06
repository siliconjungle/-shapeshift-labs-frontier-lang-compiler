import{projectFrontierAst}from'./projectFrontierAst.js';import{renderTargetAst}from'./renderTargetAst.js';
export function emitForTarget(document, target = 'typescript', options = {}) {
  return renderTargetAst(projectFrontierAst(document, target, options), target);
}
