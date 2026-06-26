import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { LexicalUseDefReasonCodes } from '../../js-ts-semantic-scope-use-def-utils.js';
import { resolveRelativeProjectModule } from './projectSymbolGraphModuleResolution.js';

function createScopeGraphContext(semanticIndex, imports, publicKeys) {
  const sourceTextsByPath = new Map(imports
    .map((imported) => [imported?.sourcePath ?? imported?.nativeSource?.sourcePath, nativeImportSourceText(imported)])
    .filter(([sourcePath, sourceText]) => sourcePath && sourceText));
  const documentsByPath = new Map((semanticIndex?.documents ?? [])
    .filter((document) => document?.path)
    .map((document) => [document.path, document]));
  for (const imported of imports ?? []) {
    const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
    if (!sourcePath || documentsByPath.has(sourcePath)) continue;
    documentsByPath.set(sourcePath, {
      id: `doc_${idFragment(sourcePath)}`,
      path: sourcePath,
      sourceHash: imported?.nativeSource?.sourceHash ?? imported?.metadata?.sourceHash
    });
  }
  const importAliases = importAliasRecords(semanticIndex, documentsByPath);
  const exportAliases = exportAliasRecords(semanticIndex, documentsByPath, sourceTextsByPath);
  return {
    publicKeys,
    sourceTextsByPath,
    importAliases,
    exportAliases,
    importAliasesByLocalKey: groupFirst(importAliases, (alias) => localKey(alias.sourcePath, alias.localName)),
    exportAliasesByExportKey: groupFirst(exportAliases, (alias) => exportKey(alias.sourcePath, alias.exportedName)),
    exportAliasesByLocalKey: groupByKey(exportAliases.filter((alias) => !alias.moduleSpecifier), (alias) => localKey(alias.sourcePath, alias.localName))
  };
}

function importAliasRecords(semanticIndex, documentsByPath) {
  return (semanticIndex?.symbols ?? []).flatMap((symbol) => {
    if (symbol?.kind !== 'import') return [];
    const metadata = objectValue(symbol.metadata);
    const sourcePath = symbol.definitionSpan?.path ?? metadata.sourcePath;
    const moduleSpecifier = firstString(metadata.moduleSpecifier, metadata.importPath, metadata.source);
    const localName = firstString(metadata.localName, symbol.name);
    if (!sourcePath || !localName || !moduleSpecifier) return [];
    const importedName = firstString(metadata.importedName, metadata.exportedName, localName);
    const resolved = moduleSpecifier.startsWith('.')
      ? resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath)
      : undefined;
    return [compactRecord({
      symbolId: symbol.id,
      sourcePath,
      localName,
      importedName,
      exportedName: firstString(metadata.exportedName),
      moduleSpecifier,
      importKind: firstString(metadata.importKind),
      isTypeOnly: metadata.isTypeOnly === true || metadata.typeOnly === true || undefined,
      resolvedSourcePath: resolved?.path,
      targetDocumentId: resolved?.documentId,
      resolutionKind: resolved?.kind,
      resolutionPathVariant: resolved?.resolutionPathVariant
    })];
  });
}

function exportAliasRecords(semanticIndex, documentsByPath, sourceTextsByPath) {
  return (semanticIndex?.symbols ?? []).flatMap((symbol) => {
    if (symbol?.kind !== 'export') return [];
    const metadata = objectValue(symbol.metadata);
    const sourcePath = symbol.definitionSpan?.path ?? metadata.sourcePath;
    const exportedName = firstString(metadata.exportedName, symbol.name);
    if (!sourcePath || !exportedName || exportedName.startsWith('{')) return [];
    const moduleSpecifier = firstString(metadata.moduleSpecifier, metadata.importPath, metadata.exportPath, metadata.source);
    const resolved = moduleSpecifier?.startsWith('.')
      ? resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath)
      : undefined;
    return [compactRecord({
      symbolId: symbol.id,
      sourcePath,
      localName: firstString(metadata.localName, defaultExportLocalName(sourceTextsByPath.get(sourcePath), exportedName, moduleSpecifier), exportedName),
      importedName: firstString(metadata.importedName, metadata.localName, exportedName),
      exportedName,
      exportKind: firstString(metadata.exportKind),
      moduleSpecifier,
      resolvedSourcePath: resolved?.path,
      targetDocumentId: resolved?.documentId,
      resolutionKind: resolved?.kind,
      resolutionPathVariant: resolved?.resolutionPathVariant,
      isTypeOnly: metadata.isTypeOnly === true || metadata.typeOnly === true || undefined
    })];
  });
}

function attachAliasMetadata(bindings, directUseHashes, context) {
  const bindingsByLocal = groupFirst(bindings, (binding) => localKey(binding.sourcePath, binding.name));
  return bindings.map((binding) => {
    const localUseHash = directUseHashes.get(binding.id);
    const exportAliases = exportAliasesForBinding(binding, context);
    const importAlias = binding.bindingKind === 'import'
      ? context.importAliasesByLocalKey.get(localKey(binding.sourcePath, binding.name))
      : undefined;
    const resolved = importAlias ? resolveImportAliasBinding(importAlias, bindingsByLocal, directUseHashes, context) : undefined;
    const exportedNames = uniqueStrings(exportAliases.filter((alias) => alias.sourcePath === binding.sourcePath).map((alias) => alias.exportedName));
    const reExportedNames = uniqueStrings(exportAliases.filter((alias) => alias.sourcePath !== binding.sourcePath).map((alias) => alias.exportedName));
    const scopeUseDefReasonCodes = uniqueStrings([...(binding.scopeUseDefReasonCodes ?? []), ...(resolved?.aliasResolutionReasonCodes ?? [])]);
    const aliasHash = exportAliases.length || importAlias ? hashSemanticValue({
      kind: 'frontier.lang.projectScopeAliasHash',
      binding: binding.signatureHash,
      importAlias: aliasHashRecord(importAlias),
      exportAliases: exportAliases.map(aliasHashRecord).sort(compareJson)
    }) : undefined;
    const resolvedUseHash = resolved?.resolvedBindingUseHash ? hashSemanticValue({
      kind: 'frontier.lang.projectScopeImportResolvedUseHash',
      binding: binding.signatureHash,
      moduleSpecifier: importAlias.moduleSpecifier,
      importedName: importAlias.importedName,
      resolvedBinding: resolved.resolvedBindingSignatureHash,
      resolvedUseHash: resolved.resolvedBindingUseHash
    }) : undefined;
    return compactRecord({
      ...binding,
      localUseHash,
      exportedNames: exportedNames.length ? exportedNames : undefined,
      reExportedNames: reExportedNames.length ? reExportedNames : undefined,
      aliasHash,
      importAlias: importAlias ? true : undefined,
      moduleSpecifier: importAlias?.moduleSpecifier,
      importedName: importAlias?.importedName,
      localName: importAlias?.localName,
      importKind: importAlias?.importKind,
      isTypeOnly: importAlias?.isTypeOnly,
      resolvedSourcePath: importAlias?.resolvedSourcePath,
      targetDocumentId: importAlias?.targetDocumentId,
      resolutionKind: importAlias?.resolutionKind,
      resolutionPathVariant: importAlias?.resolutionPathVariant,
      ...resolved,
      aliasResolutionStatus: resolved?.aliasResolutionStatus,
      aliasResolutionReasonCodes: resolved?.aliasResolutionReasonCodes,
      scopeUseDefStatus: resolved?.aliasResolutionStatus === 'blocked' ? 'blocked' : binding.scopeUseDefStatus,
      scopeUseDefReasonCodes: scopeUseDefReasonCodes.length ? scopeUseDefReasonCodes : undefined,
      resolvedUseHash
    });
  });
}

function resolveImportAliasBinding(importAlias, bindingsByLocal, directUseHashes, context) {
  if (!importAlias.resolvedSourcePath || !importAlias.importedName || importAlias.importedName === '*') return undefined;
  const origin = resolveExportOrigin(context, importAlias.resolvedSourcePath, importAlias.importedName);
  const target = bindingsByLocal.get(localKey(origin?.sourcePath ?? importAlias.resolvedSourcePath, origin?.localName ?? importAlias.importedName));
  if (!target) return compactRecord({
    resolvedExportName: importAlias.importedName,
    originSourcePath: origin?.sourcePath,
    originExportedName: origin?.exportedName,
    originSymbolId: origin?.symbolId,
    aliasResolutionStatus: 'blocked',
    aliasResolutionReasonCodes: [LexicalUseDefReasonCodes.importAliasTargetUnresolved]
  });
  return compactRecord({
    resolvedExportName: importAlias.importedName,
    originSourcePath: target.sourcePath,
    originExportedName: origin?.exportedName,
    originSymbolId: origin?.symbolId,
    resolvedBindingId: target.id,
    resolvedBindingName: target.name,
    resolvedBindingKind: target.bindingKind,
    resolvedBindingSignatureHash: target.signatureHash,
    resolvedBindingUseHash: directUseHashes.get(target.id),
    resolvedPublicOwnerName: target.publicOwnerName
  });
}

function exportAliasesForBinding(binding, context) {
  const directAliases = context.exportAliasesByLocalKey.get(localKey(binding.sourcePath, binding.name)) ?? [];
  const reExportAliases = context.exportAliases
    .filter((alias) => alias.moduleSpecifier && alias.resolvedSourcePath)
    .filter((alias) => {
      const origin = resolveExportOrigin(context, alias.resolvedSourcePath, alias.importedName ?? alias.localName);
      return origin?.sourcePath === binding.sourcePath && origin?.localName === binding.name;
    });
  const reExportImportAliases = context.importAliases
    .filter((alias) => alias.exportedName && alias.resolvedSourcePath)
    .filter((alias) => {
      const origin = resolveExportOrigin(context, alias.resolvedSourcePath, alias.importedName ?? alias.localName);
      return origin?.sourcePath === binding.sourcePath && origin?.localName === binding.name;
    });
  return uniqueAliasRecords([...directAliases, ...reExportAliases, ...reExportImportAliases]);
}

function resolveExportOrigin(context, sourcePath, exportedName, seen = new Set()) {
  if (!sourcePath || !exportedName || exportedName === '*') return undefined;
  const key = exportKey(sourcePath, exportedName);
  if (seen.has(key)) return { sourcePath, localName: exportedName, exportedName };
  seen.add(key);
  const alias = context.exportAliasesByExportKey.get(key);
  if (!alias) return { sourcePath, localName: exportedName, exportedName };
  if (alias.moduleSpecifier && alias.resolvedSourcePath) {
    return resolveExportOrigin(context, alias.resolvedSourcePath, alias.importedName ?? alias.localName, seen);
  }
  return { sourcePath, localName: alias.localName ?? alias.exportedName, exportedName: alias.exportedName, symbolId: alias.symbolId };
}

function attachReferenceAliasMetadata(references, bindings) {
  const bindingsById = new Map(bindings.map((binding) => [binding.id, binding]));
  return references.map((reference) => {
    const binding = bindingsById.get(reference.bindingId);
    const reasonCodes = uniqueStrings([...(reference.reasonCodes ?? []), ...(binding?.aliasResolutionReasonCodes ?? [])]);
    const resolvedUseHash = binding?.resolvedUseHash ? hashSemanticValue({
      kind: 'frontier.lang.projectScopeReferenceResolvedUseHash',
      reference: reference.signatureHash,
      resolvedUseHash: binding.resolvedUseHash,
      resolvedBindingUseHash: binding.resolvedBindingUseHash
    }) : undefined;
    return compactRecord({
      ...reference,
      importAlias: binding?.importAlias,
      moduleSpecifier: binding?.moduleSpecifier,
      importedName: binding?.importedName,
      resolvedSourcePath: binding?.resolvedSourcePath,
      originSourcePath: binding?.originSourcePath,
      resolvedExportName: binding?.resolvedExportName,
      resolvedBindingId: binding?.resolvedBindingId,
      resolvedBindingName: binding?.resolvedBindingName,
      resolvedBindingUseHash: binding?.resolvedBindingUseHash,
      aliasResolutionStatus: binding?.aliasResolutionStatus,
      aliasResolutionReasonCodes: binding?.aliasResolutionReasonCodes,
      status: binding?.aliasResolutionStatus ?? reference.status,
      reasonCodes: reasonCodes.length ? reasonCodes : undefined,
      resolvedUseHash
    });
  });
}

function defaultExportLocalName(sourceText, exportedName, moduleSpecifier) {
  if (exportedName !== 'default' || moduleSpecifier || typeof sourceText !== 'string') return undefined;
  return firstString(
    sourceText.match(/\bexport\s+default\s+(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)/)?.[1],
    sourceText.match(/\bexport\s+default\s+(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)?.[1],
    sourceText.match(/\bexport\s+default\s+([A-Za-z_$][\w$]*)\s*;(?=\s*(?:$|\n))/)?.[1],
    sourceText.match(/\bexport\s+default\s+([A-Za-z_$][\w$]*)\s*(?=$)/)?.[1]
  );
}

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.sourceText;
}

function aliasHashRecord(alias) {
  return alias ? JSON.stringify(compactRecord({
    sourcePath: alias.sourcePath,
    moduleSpecifier: alias.moduleSpecifier,
    localName: alias.localName,
    importedName: alias.importedName,
    exportedName: alias.exportedName,
    symbolId: alias.symbolId,
    resolvedSourcePath: alias.resolvedSourcePath
  })) : undefined;
}

function localKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function exportKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function compareJson(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function groupByKey(records, keyFn) {
  const result = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (key) result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}

function groupFirst(records, keyFn) {
  const result = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function uniqueAliasRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = aliasHashRecord(record);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export {
  attachAliasMetadata,
  attachReferenceAliasMetadata,
  compactRecord,
  createScopeGraphContext,
  nativeImportSourceText
};
