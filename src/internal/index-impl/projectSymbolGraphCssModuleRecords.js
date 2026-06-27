import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import {
  compactRecord,
  cssModuleSpecifierPath,
  groupBy,
  semanticSpanForHash,
  sourceSpanForRange
} from './projectSymbolGraphCssModuleUtils.js';

function cssModuleImportBindingRecord(edge, index, documentsById, cssSourcesByPath) {
  const cssSourcePath = edge.resolvedModulePath ?? cssModuleSpecifierPath(edge.moduleSpecifier);
  const document = documentsById.get(edge.targetDocumentId);
  const cssSource = cssSourcesByPath.get(cssSourcePath);
  const cssModuleEvidence = cssSource?.cssModuleEvidence;
  const cssModuleExportNames = cssModuleEvidenceExportNames(cssModuleEvidence);
  const cssModuleHash = cssModuleEvidence?.moduleHash ?? hashSemanticValue({
    kind: 'frontier.lang.cssModuleUnprovedSource.v1',
    sourcePath: cssSourcePath,
    sourceHash: document?.sourceHash ?? cssSource?.sourceHash
  });
  const signatureHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleImportBinding.v1',
    sourcePath: edge.sourcePath,
    moduleSpecifier: edge.moduleSpecifier,
    resolvedModulePath: edge.resolvedModulePath,
    importKind: edge.importKind,
    importedName: edge.importedName,
    localName: edge.localName,
    cssModuleSourcePath: cssSourcePath,
    cssModuleSourceHash: document?.sourceHash ?? cssSource?.sourceHash,
    cssModuleHash
  });
  return compactRecord({
    id: `css_module_import_${idFragment(edge.id ?? `${edge.sourcePath}_${index}`)}`,
    kind: 'css-module-import-binding',
    sourcePath: edge.sourcePath,
    sourceHash: edge.sourceHash,
    sourceSpan: edge.sourceSpan,
    importEdgeId: edge.id,
    moduleSpecifier: edge.moduleSpecifier,
    resolvedModulePath: edge.resolvedModulePath,
    targetDocumentId: edge.targetDocumentId,
    importKind: edge.importKind,
    importedName: edge.importedName,
    localName: edge.localName,
    cssModuleSourcePath: cssSourcePath,
    cssModuleSourceHash: document?.sourceHash ?? cssSource?.sourceHash,
    cssModuleHash,
    cssModuleEvidenceStatus: cssModuleEvidence ? 'supplied' : 'unproved',
    cssModuleEvidenceSource: cssSource?.cssModuleEvidenceSource,
    cssModuleExportNames: cssModuleExportNames.length ? cssModuleExportNames : undefined,
    cssModuleExportNamesHash: cssModuleExportNames.length ? hashSemanticValue(cssModuleExportNames) : undefined,
    generatedClassNameMapHash: cssModuleEvidence?.generatedClassNameMapHash ?? cssModuleGeneratedClassNameMapHash(cssModuleEvidence),
    jsTsUseSiteGraphHash: cssModuleEvidence?.jsTsUseSiteGraphHash,
    cssModuleCompositionGraphHash: cssModuleEvidence?.cssModuleCompositionGraphHash,
    cssModuleCompositionGraphSource: cssModuleEvidence?.cssModuleCompositionGraphSource,
    icssGraphHash: cssModuleEvidence?.icssGraphHash,
    icssGraphSource: cssModuleEvidence?.icssGraphSource,
    bundlerTransformHash: cssSource?.bundlerTransformHash,
    sourceMapProofHash: cssSource?.sourceMapProofHash,
    signatureHash
  });
}

function cssModuleUseSiteRecord(binding, input) {
  const signatureHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleUseSite.v1',
    binding: binding.signatureHash,
    useSiteKind: input.useSiteKind,
    accessKind: input.accessKind,
    exportName: input.exportName,
    expressionText: input.expressionText,
    sourceSpan: semanticSpanForHash(input.sourceSpan)
  });
  return compactRecord({
    id: `css_module_use_${idFragment(binding.id)}_${idFragment(signatureHash)}`,
    kind: 'css-module-use-site',
    cssModuleImportBindingId: binding.id,
    importEdgeId: binding.importEdgeId,
    cssModuleSourcePath: binding.cssModuleSourcePath,
    cssModuleHash: binding.cssModuleHash,
    exportName: input.exportName,
    cssModuleExportHash: cssModuleExportHash(binding, input.exportName),
    useSiteKind: input.useSiteKind,
    jsSourcePath: input.sourcePath,
    jsSourceHash: input.sourceHash,
    sourceSpan: input.sourceSpan,
    accessKind: input.accessKind,
    receiverLocalName: input.receiverLocalName,
    localReferenceName: input.localReferenceName,
    expressionText: input.expressionText,
    jsxPropRecordId: input.jsxPropRecordId,
    scopeReferenceRecordId: input.scopeReferenceRecordId,
    conditionalRuntimePresence: input.conditionalRuntimePresence,
    signatureHash
  });
}

function cssModuleAccessBlocker(binding, sourceText, start, end, reasonCode, expressionText, extra = {}) {
  return cssModuleBindingBlocker(binding, {
    sourceSpan: sourceSpanForRange(sourceText, binding.sourcePath, binding.sourceHash, start, end),
    expressionText,
    reasonCode,
    ...extra
  });
}

function cssModulePropBlocker(binding, prop, reasonCode) {
  return cssModuleBindingBlocker(binding, {
    sourcePath: prop.sourcePath,
    sourceHash: prop.sourceHash,
    sourceSpan: prop.sourceSpan,
    expressionText: prop.propValueExpressionText ?? prop.propValueText ?? prop.propValueDynamicText,
    reasonCode,
    jsxPropRecordId: prop.id
  });
}

function cssModuleBindingBlocker(binding, input = {}) {
  const sourcePath = input.sourcePath ?? binding.sourcePath;
  const sourceHash = input.sourceHash ?? binding.sourceHash;
  const reasonCode = input.reasonCode ?? 'css-module-import-resolution-unproved';
  const expressionText = input.expressionText ?? binding.localName ?? binding.moduleSpecifier;
  const blockerHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleUseSiteBlocker.v1',
    binding: binding.signatureHash,
    reasonCode,
    sourcePath,
    sourceSpan: semanticSpanForHash(input.sourceSpan),
    expressionText
  });
  return compactRecord({
    id: `css_module_blocker_${idFragment(binding.id)}_${idFragment(blockerHash)}`,
    kind: 'css-module-use-site-blocker',
    sourcePath,
    sourceHash,
    sourceSpan: input.sourceSpan,
    moduleSpecifier: binding.moduleSpecifier,
    localName: binding.localName,
    cssModuleImportBindingId: binding.id,
    cssModuleSourcePath: binding.cssModuleSourcePath,
    expressionText,
    reasonCode,
    writeOperation: input.writeOperation,
    jsxPropRecordId: input.jsxPropRecordId,
    failClosed: true,
    semanticEquivalenceClaim: false,
    signatureHash: blockerHash
  });
}

function cssModuleTransformBlockers(binding) {
  const blockers = [];
  if (binding.cssModuleEvidenceStatus !== 'supplied') blockers.push(cssModuleBindingBlocker(binding, { reasonCode: 'css-module-import-resolution-unproved' }));
  if (!binding.generatedClassNameMapHash) blockers.push(cssModuleBindingBlocker(binding, { reasonCode: 'css-module-generated-class-map-unproved' }));
  if (!binding.bundlerTransformHash) blockers.push(cssModuleBindingBlocker(binding, { reasonCode: 'css-module-bundler-transform-identity-unproved' }));
  if (!binding.sourceMapProofHash) blockers.push(cssModuleBindingBlocker(binding, { reasonCode: 'css-module-source-map-proof-unproved' }));
  return blockers;
}

function cssModuleMissingExportBlockers(bindingsById, useSites) {
  return useSites
    .filter((site) => cssModuleExportNameMissing(bindingsById.get(site.cssModuleImportBindingId), site.exportName))
    .map((site) => cssModuleBindingBlocker(bindingsById.get(site.cssModuleImportBindingId), {
      sourcePath: site.jsSourcePath,
      sourceHash: site.jsSourceHash,
      sourceSpan: site.sourceSpan,
      expressionText: site.expressionText,
      reasonCode: 'css-module-export-name-unresolved'
    }));
}

function cssModuleExportNameMissing(binding, exportName) {
  if (!binding || !exportName || !Array.isArray(binding.cssModuleExportNames)) return false;
  return !binding.cssModuleExportNames.includes(exportName);
}

function cssModuleUseSiteGraphRecords(importBindings, useSites, blockers) {
  return [...groupBy(importBindings, (binding) => binding.cssModuleSourcePath).values()].map((bindings) => {
    const cssModuleSourcePath = bindings[0]?.cssModuleSourcePath;
    const bindingIds = new Set(bindings.map((binding) => binding.id));
    const graphUseSites = useSites.filter((site) => bindingIds.has(site.cssModuleImportBindingId));
    const graphBlockers = blockers.filter((blocker) => bindingIds.has(blocker.cssModuleImportBindingId));
    return cssModuleUseSiteGraphRecord(cssModuleSourcePath, bindings, graphUseSites, graphBlockers);
  });
}

function cssModuleUseSiteGraphRecord(cssModuleSourcePath, bindings, graphUseSites, graphBlockers) {
  const jsTsUseSiteGraphHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleJsTsUseSiteGraph.v1',
    cssModuleSourcePath,
    bindings: bindings.map(cssModuleUseSiteBindingSignature).sort(stableStringCompare),
    useSites: graphUseSites.map(cssModuleUseSiteSignature).sort(stableStringCompare),
    blockers: graphBlockers.map(cssModuleUseSiteBlockerSignature).sort(stableStringCompare)
  });
  const graphHash = hashSemanticValue({
    kind: 'frontier.lang.cssModuleUseSiteGraph.v1',
    cssModuleSourcePath,
    bindings: bindings.map((binding) => binding.signatureHash).sort(),
    useSites: graphUseSites.map((site) => site.signatureHash).sort(),
    blockers: graphBlockers.map((blocker) => blocker.signatureHash).sort()
  });
  return compactRecord({
    kind: 'frontier.lang.cssModuleUseSiteGraph',
    version: 1,
    cssModuleSourcePath,
    cssModuleHash: bindings[0]?.cssModuleHash,
    cssModuleSourceHash: bindings[0]?.cssModuleSourceHash,
    importBindingIds: bindings.map((binding) => binding.id),
    useSiteIds: graphUseSites.map((site) => site.id),
    blockerIds: graphBlockers.map((blocker) => blocker.id),
    importBindingCount: bindings.length,
    useSiteCount: graphUseSites.length,
    blockerCount: graphBlockers.length,
    generatedClassNameMapHash: bindings.find((binding) => binding.generatedClassNameMapHash)?.generatedClassNameMapHash,
    cssModuleExportNamesHash: bindings.find((binding) => binding.cssModuleExportNamesHash)?.cssModuleExportNamesHash,
    cssModuleCompositionGraphHash: bindings.find((binding) => binding.cssModuleCompositionGraphHash)?.cssModuleCompositionGraphHash,
    cssModuleCompositionGraphSource: bindings.find((binding) => binding.cssModuleCompositionGraphSource)?.cssModuleCompositionGraphSource,
    icssGraphHash: bindings.find((binding) => binding.icssGraphHash)?.icssGraphHash,
    icssGraphSource: bindings.find((binding) => binding.icssGraphSource)?.icssGraphSource,
    bundlerTransformHash: bindings.find((binding) => binding.bundlerTransformHash)?.bundlerTransformHash,
    sourceMapProofHash: bindings.find((binding) => binding.sourceMapProofHash)?.sourceMapProofHash,
    jsTsUseSiteGraphHash,
    status: graphBlockers.length ? 'blocked' : 'ready',
    graphHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function cssModuleUseSiteBindingSignature(binding) {
  return JSON.stringify({
    sourcePath: binding.sourcePath,
    sourceHash: binding.sourceHash,
    moduleSpecifier: binding.moduleSpecifier,
    resolvedModulePath: binding.resolvedModulePath,
    importKind: binding.importKind,
    importedName: binding.importedName,
    localName: binding.localName
  });
}

function cssModuleUseSiteSignature(site) {
  return JSON.stringify({
    jsSourcePath: site.jsSourcePath,
    jsSourceHash: site.jsSourceHash,
    exportName: site.exportName,
    useSiteKind: site.useSiteKind,
    accessKind: site.accessKind,
    receiverLocalName: site.receiverLocalName,
    localReferenceName: site.localReferenceName,
    expressionText: site.expressionText,
    sourceSpan: semanticSpanForHash(site.sourceSpan),
    conditionalRuntimePresence: site.conditionalRuntimePresence
  });
}

function cssModuleUseSiteBlockerSignature(blocker) {
  return JSON.stringify({
    sourcePath: blocker.sourcePath,
    sourceHash: blocker.sourceHash,
    moduleSpecifier: blocker.moduleSpecifier,
    localName: blocker.localName,
    expressionText: blocker.expressionText,
    reasonCode: blocker.reasonCode,
    writeOperation: blocker.writeOperation,
    sourceSpan: semanticSpanForHash(blocker.sourceSpan)
  });
}

function stableStringCompare(left, right) { return left.localeCompare(right); }

function cssModuleExportHash(binding, exportName) {
  if (!exportName || !Array.isArray(binding.cssModuleExportNames) || !binding.cssModuleExportNames.includes(exportName)) return undefined;
  return hashSemanticValue({ kind: 'frontier.lang.cssModuleExport.v1', cssModuleHash: binding.cssModuleHash, exportName });
}

function cssModuleEvidenceExportNames(evidence) {
  return uniqueSortedStrings([
    ...arrayValue(evidence?.exportNames),
    ...arrayValue(evidence?.localClassNames),
    ...arrayValue(evidence?.classNames),
    ...cssModuleExportRecordNames(evidence?.exports),
    ...objectKeys(evidence?.exports),
    ...objectKeys(evidence?.generatedClassNameMap),
    ...objectKeys(evidence?.classMap)
  ]);
}

function cssModuleExportRecordNames(value) {
  return Array.isArray(value)
    ? value.map((entry) => entry?.name ?? entry?.localName).filter(Boolean)
    : [];
}

function cssModuleGeneratedClassNameMapHash(evidence) {
  const map = objectValue(evidence?.generatedClassNameMap) ?? objectValue(evidence?.classMap) ?? objectValue(evidence?.exports);
  return map ? hashSemanticValue({ kind: 'frontier.lang.cssModuleGeneratedClassNameMap.v1', map }) : undefined;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function objectKeys(value) {
  const object = objectValue(value);
  return object ? Object.keys(object) : [];
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function uniqueSortedStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort();
}

export { cssModuleAccessBlocker, cssModuleBindingBlocker, cssModuleImportBindingRecord, cssModuleMissingExportBlockers, cssModulePropBlocker, cssModuleTransformBlockers, cssModuleUseSiteGraphRecords, cssModuleUseSiteRecord };
