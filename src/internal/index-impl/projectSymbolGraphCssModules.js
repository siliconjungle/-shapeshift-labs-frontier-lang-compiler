import {
  cssModuleBlockerKey,
  cssModuleSourceRecord,
  cssModuleUseSiteKey,
  isCssModuleBindingEdge,
  localKey,
  nativeImportSourceText,
  sourcePathForImport,
  uniqueRecords
} from './projectSymbolGraphCssModuleUtils.js';
import {
  cssModuleBindingBlocker,
  cssModuleImportBindingRecord,
  cssModuleMissingExportBlockers,
  cssModuleTransformBlockers,
  cssModuleUseSiteGraphRecords
} from './projectSymbolGraphCssModuleRecords.js';
import { withProjectCssModuleDependencyGraphs } from './projectSymbolGraphCssModuleDependencyGraphs.js';
import {
  cssModuleJsxUseSites,
  cssModuleLexicalUseSites
} from './projectSymbolGraphCssModuleScanners.js';

function createProjectCssModuleGraphRecords(semanticIndex, imports, importEdges, scopeReferenceRecords, jsxPropRecords) {
  const sourceTextsByPath = new Map(imports
    .map((imported) => [sourcePathForImport(imported), nativeImportSourceText(imported)])
    .filter(([sourcePath, sourceText]) => sourcePath && typeof sourceText === 'string'));
  const cssSourcesByPath = new Map(imports
    .map((imported) => [sourcePathForImport(imported), cssModuleSourceRecord(imported)])
    .filter(([sourcePath]) => sourcePath));
  const cssSourcesWithDependencyGraphsByPath = withProjectCssModuleDependencyGraphs(cssSourcesByPath);
  const documentsById = new Map((semanticIndex?.documents ?? []).map((document) => [document.id, document]));
  const importBindings = uniqueRecords(importEdges
    .filter(isCssModuleBindingEdge)
    .map((edge, index) => cssModuleImportBindingRecord(edge, index, documentsById, cssSourcesWithDependencyGraphsByPath)));
  const bindingsByLocal = groupBindingsByLocal(importBindings);
  const { useSites: lexicalUseSites, blockers: lexicalBlockers } = cssModuleLexicalUseSites(importBindings, sourceTextsByPath, scopeReferenceRecords);
  const { useSites: jsxUseSites, blockers: jsxBlockers } = cssModuleJsxUseSites(bindingsByLocal, jsxPropRecords, importEdges);
  const cssModuleUseSites = uniqueRecords([...jsxUseSites, ...lexicalUseSites], cssModuleUseSiteKey);
  const usedImportBindings = importBindings
    .filter((binding) => hasUseSite(binding, cssModuleUseSites));
  const missingTransformBlockers = usedImportBindings
    .flatMap((binding) => cssModuleTransformBlockers(binding));
  const missingDependencyGraphBlockers = usedImportBindings
    .flatMap((binding) => cssModuleDependencyGraphBlockers(binding, cssSourcesWithDependencyGraphsByPath));
  const bindingsById = new Map(importBindings.map((binding) => [binding.id, binding]));
  const missingExportBlockers = cssModuleMissingExportBlockers(bindingsById, cssModuleUseSites);
  const cssModuleUseSiteBlockers = uniqueRecords([
    ...lexicalBlockers,
    ...jsxBlockers,
    ...missingExportBlockers,
    ...missingTransformBlockers,
    ...missingDependencyGraphBlockers
  ], cssModuleBlockerKey);
  return {
    cssModuleImportBindings: importBindings,
    cssModuleUseSites,
    cssModuleUseSiteBlockers,
    cssModuleUseSiteGraphs: cssModuleUseSiteGraphRecords(importBindings, cssModuleUseSites, cssModuleUseSiteBlockers)
  };
}

function groupBindingsByLocal(importBindings) {
  const result = new Map();
  for (const binding of importBindings) {
    const key = localKey(binding.sourcePath, binding.localName);
    if (!key) continue;
    result.set(key, [...(result.get(key) ?? []), binding]);
  }
  return result;
}

function cssModuleDependencyGraphBlockers(binding, cssSourcesByPath) {
  const cssModuleEvidence = cssSourcesByPath.get(binding.cssModuleSourcePath)?.cssModuleEvidence;
  const blockers = [];
  if (requiresCssModuleCompositionGraph(cssModuleEvidence) && !binding.cssModuleCompositionGraphHash) {
    blockers.push(cssModuleBindingBlocker(binding, {
      reasonCode: 'css-module-composition-resolution-unproved',
      expressionText: binding.localName
    }));
  }
  if (requiresIcssGraph(cssModuleEvidence) && !binding.icssGraphHash) {
    blockers.push(cssModuleBindingBlocker(binding, {
      reasonCode: 'css-module-icss-graph-unproved',
      expressionText: binding.localName
    }));
  }
  return blockers;
}

function requiresCssModuleCompositionGraph(cssModuleEvidence) {
  return hasCssModuleProofGap(cssModuleEvidence, 'css-module-composition-resolution-unproved')
    || hasRecords(cssModuleEvidence?.compositions);
}

function requiresIcssGraph(cssModuleEvidence) {
  return hasCssModuleProofGap(cssModuleEvidence, 'css-module-icss-graph-unproved')
    || hasRecords(cssModuleEvidence?.icssImports)
    || hasRecords(cssModuleEvidence?.icssExports)
    || hasRecords(cssModuleEvidence?.icss?.imports)
    || hasRecords(cssModuleEvidence?.icss?.exports);
}

function hasCssModuleProofGap(cssModuleEvidence, code) {
  return (cssModuleEvidence?.proofGaps ?? []).some((gap) => gap?.code === code);
}

function hasRecords(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value && typeof value === 'object' ? Object.keys(value).length > 0 : false;
}

function hasUseSite(binding, useSites) {
  return useSites.some((site) => site.cssModuleImportBindingId === binding.id);
}

export { createProjectCssModuleGraphRecords };
