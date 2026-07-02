import{checkDocument}from'@shapeshift-labs/frontier-lang-checker';import{hashDocumentBase}from'@shapeshift-labs/frontier-lang-kernel';
import{idFragment}from'../../native-import-utils.js';
import{normalizeCompileTarget}from'./normalizeCompileTarget.js';import{projectFrontierAst}from'./projectFrontierAst.js';import{renderTargetAst}from'./renderTargetAst.js';
import{renderTargetAstWithSourceMap}from'./renderTargetAstWithSourceMap.js';
export function compileFrontierDocument(document, options = {}) {
  const target = normalizeCompileTarget(options.target);
  const sourcePath = options.sourcePath ?? sourceMapOptions(options.sourceMap).sourcePath;
  const check = checkDocument(document, options.check ?? {});
  const hash = hashDocumentBase(document);
  if (!check.ok && options.emitOnError !== true) {
    return {
      ok: false,
      target,
      hash,
      document,
      diagnostics: check.diagnostics,
      ...(sourcePath ? { sourcePath } : {}),
      ast: undefined,
      output: ''
    };
  }
  const ast = projectFrontierAst(document, target, options.emit ?? {});
  if (shouldEmitSourceMap(options.sourceMap)) {
    const rendered = renderTargetAstWithSourceMap(ast, target, compileSourceMapOptions(document, target, options, sourcePath));
    return {
      ok: check.ok,
      target,
      hash,
      document,
      diagnostics: check.diagnostics,
      ...(sourcePath ? { sourcePath } : {}),
      ast,
      output: rendered.code,
      sourceMap: rendered.sourceMap
    };
  }
  return {
    ok: check.ok,
    target,
    hash,
    document,
    diagnostics: check.diagnostics,
    ...(sourcePath ? { sourcePath } : {}),
    ast,
    output: renderTargetAst(ast, target)
  };
}
function shouldEmitSourceMap(sourceMap) {
  return sourceMap === true || Boolean(sourceMap && typeof sourceMap === 'object');
}
function sourceMapOptions(sourceMap) {
  return sourceMap && typeof sourceMap === 'object' ? sourceMap : {};
}
function compileSourceMapOptions(document, target, options, sourcePath) {
  const sourceMap = sourceMapOptions(options.sourceMap);
  return definedObject({
    ...(options.emit ?? {}),
    ...sourceMap,
    sourceMapId: sourceMap.sourceMapId ?? `sourcemap_${idFragment(document.id)}_${target}`,
    sourcePath: sourceMap.sourcePath ?? sourcePath
  });
}
function definedObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}
