import{checkDocument}from'@shapeshift-labs/frontier-lang-checker';import{hashDocumentBase}from'@shapeshift-labs/frontier-lang-kernel';
import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{projectFrontierAst}from'./projectFrontierAst.js';import{renderTargetAst}from'./renderTargetAst.js';
export function compileFrontierDocument(document, options = {}) {
  const target = normalizeCompileTarget(options.target);
  const check = checkDocument(document, options.check ?? {});
  const hash = hashDocumentBase(document);
  if (!check.ok && options.emitOnError !== true) {
    return {
      ok: false,
      target,
      hash,
      document,
      diagnostics: check.diagnostics,
      ast: undefined,
      output: ''
    };
  }
  const ast = projectFrontierAst(document, target, options.emit ?? {});
  return {
    ok: check.ok,
    target,
    hash,
    document,
    diagnostics: check.diagnostics,
    ast,
    output: renderTargetAst(ast, target)
  };
}
