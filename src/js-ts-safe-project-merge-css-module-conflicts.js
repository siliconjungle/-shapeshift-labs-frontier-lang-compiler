import { compactRecord } from './js-ts-safe-merge-context.js';

function cssModuleUseSiteBlockerConflicts(blockers = []) {
  return blockers.map(cssModuleUseSiteBlockerConflict);
}

function cssModuleUseSiteBlockerConflict(blocker) {
  const reasonCode = blocker.reasonCode ?? 'css-module-use-site-proof-blocked';
  return {
    code: 'project-css-module-use-site-proof-blocked',
    gateId: 'project-css-module-use-site-graph',
    message: `Output project graph has unproved CSS Module use-site evidence: ${reasonCode}.`,
    sourcePath: blocker.sourcePath,
    details: compactRecord({
      reasonCode,
      conflictKey: cssModuleUseSiteBlockerConflictKey(blocker),
      sourcePath: blocker.sourcePath,
      sourceSpan: blocker.sourceSpan,
      moduleSpecifier: blocker.moduleSpecifier,
      localName: blocker.localName,
      cssModuleImportBindingId: blocker.cssModuleImportBindingId,
      cssModuleSourcePath: blocker.cssModuleSourcePath,
      expressionText: blocker.expressionText,
      proofBoundary: blocker.proofBoundary,
      writeOperation: blocker.writeOperation,
      jsxPropRecordId: blocker.jsxPropRecordId,
      failClosed: blocker.failClosed === true,
      semanticEquivalenceClaim: blocker.semanticEquivalenceClaim === true
    })
  };
}

function cssModuleUseSiteBlockerConflictKey(blocker) {
  return [
    'css-module-use-site',
    blocker.cssModuleSourcePath ?? blocker.moduleSpecifier ?? 'unknown-module',
    blocker.sourcePath ?? 'unknown-source',
    blocker.localName ?? 'unknown-local',
    blocker.proofBoundary ?? 'unknown-boundary',
    blocker.reasonCode ?? 'unknown-reason',
    spanKey(blocker.sourceSpan),
    blocker.expressionText
  ].map((part) => String(part ?? '')).join('#');
}

function isResolvedCssModuleImportEdge(edge) {
  return isCssModulePath(edge?.resolvedModulePath ?? edge?.moduleSpecifier)
    && Boolean(edge?.targetDocumentId)
    && typeof edge?.resolutionKind === 'string'
    && edge.resolutionKind.endsWith('-source');
}

function isCssModulePath(path) {
  return /\.module\.css(?:[?#].*)?$/i.test(String(path ?? ''));
}

function spanKey(span) {
  if (!span) return '';
  return [span.path, span.start, span.end].map((part) => String(part ?? '')).join(':');
}

export { cssModuleUseSiteBlockerConflicts, isResolvedCssModuleImportEdge };
