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
  const documentsById = new Map((semanticIndex?.documents ?? []).map((document) => [document.id, document]));
  const importBindings = uniqueRecords(importEdges
    .filter(isCssModuleBindingEdge)
    .map((edge, index) => cssModuleImportBindingRecord(edge, index, documentsById, cssSourcesByPath)));
  const bindingsByLocal = groupBindingsByLocal(importBindings);
  const { useSites: lexicalUseSites, blockers: lexicalBlockers } = cssModuleLexicalUseSites(importBindings, sourceTextsByPath);
  const { useSites: jsxUseSites, blockers: jsxBlockers } = cssModuleJsxUseSites(bindingsByLocal, jsxPropRecords);
  const namedImportBlockers = importBindings
    .filter((binding) => binding.importKind === 'named')
    .map((binding) => cssModuleNamedExportBlocker(binding));
  const missingTransformBlockers = importBindings
    .filter((binding) => hasUseSite(binding, lexicalUseSites) || hasUseSite(binding, jsxUseSites))
    .flatMap((binding) => cssModuleTransformBlockers(binding));
  const cssModuleUseSites = uniqueRecords([...jsxUseSites, ...lexicalUseSites], cssModuleUseSiteKey);
  const bindingsById = new Map(importBindings.map((binding) => [binding.id, binding]));
  const missingExportBlockers = cssModuleMissingExportBlockers(bindingsById, cssModuleUseSites);
  const cssModuleUseSiteBlockers = uniqueRecords([
    ...lexicalBlockers,
    ...jsxBlockers,
    ...namedImportBlockers,
    ...missingExportBlockers,
    ...missingTransformBlockers
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

function cssModuleNamedExportBlocker(binding) {
  return cssModuleBindingBlocker(binding, {
    reasonCode: 'css-module-named-export-transform-unproved',
    expressionText: binding.localName
  });
}

function hasUseSite(binding, useSites) {
  return useSites.some((site) => site.cssModuleImportBindingId === binding.id);
}

export { createProjectCssModuleGraphRecords };
