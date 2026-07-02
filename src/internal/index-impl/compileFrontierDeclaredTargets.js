import{hashDocumentBase}from'@shapeshift-labs/frontier-lang-kernel';
import{compileFrontierDocument}from'./compileFrontierDocument.js';
import{normalizeCompileTarget}from'./normalizeCompileTarget.js';

export function compileFrontierDeclaredTargets(document, options = {}) {
  const sourcePath = options.sourcePath ?? sourceMapOptions(options.sourceMap).sourcePath;
  const targetNodes = declaredTargetNodes(document).filter((node) => targetNodeMatches(node, options));
  const hash = hashDocumentBase(document);
  if (targetNodes.length === 0) {
    const diagnostic = createDiagnostic('error', 'target.none', 'Document does not declare any compile target nodes.');
    return declaredTargetResult({ ok: false, hash, document, sourcePath, diagnostics: [diagnostic], artifacts: [] });
  }
  const artifacts = targetNodes.map((node) => compileDeclaredTargetNode(document, node, options, sourcePath));
  const diagnostics = uniqueDiagnostics(artifacts.flatMap((artifact) => artifact.diagnostics ?? []));
  return declaredTargetResult({
    ok: artifacts.every((artifact) => artifact.ok),
    hash,
    document,
    sourcePath,
    diagnostics,
    artifacts
  });
}

function compileDeclaredTargetNode(document, node, options, sourcePath) {
  const declared = node.target ?? {};
  const declaredLanguage = declared.language ?? node.name;
  try {
    const target = normalizeCompileTarget(declaredLanguage);
    const sourceMap = compileDeclaredTargetSourceMapOptions(document, node, target, options, sourcePath);
    const compileResult = compileFrontierDocument(document, {
      ...options,
      target,
      sourcePath,
      sourceMap
    });
    return {
      kind: 'frontier.lang.declaredTargetArtifact',
      version: 1,
      targetNodeId: node.id,
      targetName: node.name,
      target,
      declaredTarget: declaredLanguage,
      packageName: declared.packageName,
      moduleFormat: declared.moduleFormat,
      targetPath: declared.emitPath ?? sourceMapOptions(sourceMap).targetPath,
      ok: compileResult.ok,
      hash: compileResult.hash,
      diagnostics: compileResult.diagnostics,
      ast: compileResult.ast,
      output: compileResult.output,
      sourceMap: compileResult.sourceMap
    };
  } catch (error) {
    const diagnostic = createDiagnostic(
      'error',
      'target.unsupported',
      `Target node ${node.id} declares unsupported compile target ${declaredLanguage}.`,
      node.id
    );
    return {
      kind: 'frontier.lang.declaredTargetArtifact',
      version: 1,
      targetNodeId: node.id,
      targetName: node.name,
      declaredTarget: declaredLanguage,
      packageName: declared.packageName,
      moduleFormat: declared.moduleFormat,
      targetPath: declared.emitPath,
      ok: false,
      hash: hashDocumentBase(document),
      diagnostics: [diagnostic],
      output: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function compileDeclaredTargetSourceMapOptions(document, node, target, options, sourcePath) {
  if (!shouldEmitSourceMap(options.sourceMap)) return options.sourceMap;
  const sourceMap = sourceMapOptions(options.sourceMap);
  return {
    ...sourceMap,
    sourceMapId: sourceMap.sourceMapId ?? `sourcemap_${document.id}_${node.id}_${target}`,
    sourcePath: sourceMap.sourcePath ?? sourcePath,
    targetPath: node.target?.emitPath ?? sourceMap.targetPath
  };
}

function declaredTargetNodes(document) {
  return Object.values(document?.nodes ?? {}).filter((node) => node?.kind === 'target');
}

function targetNodeMatches(node, options) {
  const ids = listOption(options.targetNodeIds);
  if (ids.length && !ids.includes(node.id)) return false;
  const names = listOption(options.targetNames);
  if (names.length && !names.includes(node.name)) return false;
  const languages = listOption(options.targetLanguages).map((language) => String(language).toLowerCase());
  if (languages.length && !languages.includes(String(node.target?.language ?? node.name).toLowerCase())) return false;
  return true;
}

function declaredTargetResult(input) {
  return {
    kind: 'frontier.lang.declaredTargetCompilation',
    version: 1,
    ok: input.ok,
    hash: input.hash,
    document: input.document,
    diagnostics: input.diagnostics,
    ...(input.sourcePath ? { sourcePath: input.sourcePath } : {}),
    artifacts: input.artifacts,
    summary: {
      targets: input.artifacts.length,
      emitted: input.artifacts.filter((artifact) => artifact.ok).length,
      failed: input.artifacts.filter((artifact) => !artifact.ok).length
    }
  };
}

function uniqueDiagnostics(diagnostics) {
  const seen = new Set();
  const unique = [];
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.severity}:${diagnostic.code}:${diagnostic.nodeId ?? ''}:${diagnostic.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(diagnostic);
  }
  return unique;
}

function createDiagnostic(severity, code, message, nodeId) {
  return { severity, code, message, ...(nodeId ? { nodeId } : {}) };
}

function shouldEmitSourceMap(sourceMap) {
  return sourceMap === true || Boolean(sourceMap && typeof sourceMap === 'object');
}

function sourceMapOptions(sourceMap) {
  return sourceMap && typeof sourceMap === 'object' ? sourceMap : {};
}

function listOption(value) {
  return Array.isArray(value) ? value.map(String) : value === undefined ? [] : [String(value)];
}
