import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { semanticSpanForHash } from './projectSymbolGraphCssModuleUtils.js';

function cssModuleUseSiteGraphHashes(cssModuleSourcePath, bindings, graphUseSites, graphBlockers) {
  const helperGraph = cssModuleClassNameHelperGraphSummary(graphUseSites);
  return {
    jsTsUseSiteGraphHash: hashSemanticValue({
      kind: 'frontier.lang.cssModuleJsTsUseSiteGraph.v1',
      cssModuleSourcePath,
      bindings: bindings.map(cssModuleUseSiteBindingSignature).sort(stableStringCompare),
      useSites: graphUseSites.map(cssModuleUseSiteSignature).sort(stableStringCompare),
      blockers: graphBlockers.map(cssModuleUseSiteBlockerSignature).sort(stableStringCompare)
    }),
    graphHash: hashSemanticValue({
      kind: 'frontier.lang.cssModuleUseSiteGraph.v1',
      cssModuleSourcePath,
      bindings: bindings.map((binding) => binding.signatureHash).sort(),
      useSites: graphUseSites.map((site) => site.signatureHash).sort(),
      blockers: graphBlockers.map((blocker) => blocker.signatureHash).sort()
    }),
    ...helperGraph
  };
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
    dynamicKeyExpressionText: site.dynamicKeyExpressionText,
    dynamicKeyDomain: site.dynamicKeyDomain,
    dynamicKeyDomainHash: site.dynamicKeyDomainHash,
    dynamicKeyProofLevel: site.dynamicKeyProofLevel,
    dynamicKeyProofSource: site.dynamicKeyProofSource,
    sourceSpan: semanticSpanForHash(site.sourceSpan),
    conditionalRuntimePresence: site.conditionalRuntimePresence,
    helperCallProofLevel: site.helperCallProofLevel,
    helperCallGraphHash: site.helperCallGraphHash,
    helperCalleeName: site.helperCalleeName,
    helperCalleeSource: site.helperCalleeSource,
    helperModuleSpecifier: site.helperModuleSpecifier
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

function cssModuleClassNameHelperGraphSummary(useSites) {
  const helperHashes = uniqueSortedStrings(useSites.map((site) => site.helperCallGraphHash));
  if (!helperHashes.length) return {};
  return {
    cssModuleClassNameHelperGraphHash: hashSemanticValue({
      kind: 'frontier.lang.cssModuleClassNameHelperGraph.v1',
      helperCallGraphHashes: helperHashes
    }),
    cssModuleClassNameHelperProofLevels: uniqueSortedStrings(useSites.map((site) => site.helperCallProofLevel)),
    cssModuleClassNameHelperSources: uniqueSortedStrings(useSites.map((site) => site.helperCalleeSource))
  };
}

function stableStringCompare(left, right) { return left.localeCompare(right); }

function uniqueSortedStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort();
}

export { cssModuleUseSiteGraphHashes };
