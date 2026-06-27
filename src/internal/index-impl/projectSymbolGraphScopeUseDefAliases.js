import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { LexicalUseDefReasonCodes } from '../../js-ts-semantic-scope-use-def-utils.js';
import {
  exportAliasRecords,
  importAliasRecords,
  nativeImportSourceText
} from './projectSymbolGraphScopeUseDefAliasRecords.js';

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
    const resolvedUseEvidenceHash = resolved?.resolvedBindingUseHash ?? resolved?.resolvedExportUseHash;
    const resolvedUseHash = resolvedUseEvidenceHash ? hashSemanticValue({
      kind: 'frontier.lang.projectScopeImportResolvedUseHash',
      binding: binding.signatureHash,
      moduleSpecifier: importAlias.moduleSpecifier,
      importedName: importAlias.importedName,
      resolvedBinding: resolved.resolvedBindingSignatureHash,
      resolvedBindingUseHash: resolved.resolvedBindingUseHash,
      resolvedExportUseHash: resolved.resolvedExportUseHash,
      resolvedUseHash: resolvedUseEvidenceHash,
      originSourcePath: resolved.originSourcePath,
      originSourceHash: resolved.originSourceHash,
      originExportedName: resolved.originExportedName,
      aliasResolutionEvidenceKind: resolved.aliasResolutionEvidenceKind
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
  const sourceBoundOrigin = target ? undefined : sourceBoundDefaultExportOrigin(origin, importAlias);
  if (sourceBoundOrigin) return sourceBoundOrigin;
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

function sourceBoundDefaultExportOrigin(origin, importAlias) {
  if (importAlias.importedName !== 'default' || origin?.exportedName !== 'default') return undefined;
  if (!origin.sourcePath || !origin.sourceHash || !origin.sourceSpan || !origin.sourceSymbolId || !origin.sourceSymbolSignatureHash) return undefined;
  const resolvedExportUseHash = hashSemanticValue({
    kind: 'frontier.lang.projectScopeImportResolvedSourceBoundDefaultExportUseHash',
    moduleSpecifier: importAlias.moduleSpecifier,
    importedName: importAlias.importedName,
    resolvedSourcePath: importAlias.resolvedSourcePath,
    originSourcePath: origin.sourcePath,
    originSourceHash: origin.sourceHash,
    originExportedName: origin.exportedName,
    originSymbolId: origin.symbolId,
    originSignatureHash: origin.signatureHash,
    originSourceSymbolId: origin.sourceSymbolId,
    originSourceSymbolKind: origin.sourceSymbolKind,
    originSourceSymbolSignatureHash: origin.sourceSymbolSignatureHash,
    originSourceSpan: semanticSourceSpanForHash(origin.sourceSpan)
  });
  return compactRecord({
    resolvedExportName: importAlias.importedName,
    originSourcePath: origin.sourcePath,
    originSourceHash: origin.sourceHash,
    originSourceSpan: origin.sourceSpan,
    originExportedName: origin.exportedName,
    originSymbolId: origin.symbolId,
    originSignatureHash: origin.signatureHash,
    originSourceSymbolId: origin.sourceSymbolId,
    originSourceSymbolKind: origin.sourceSymbolKind,
    originSourceSymbolSignatureHash: origin.sourceSymbolSignatureHash,
    aliasResolutionEvidenceKind: 'source-bound-default-export',
    resolvedExportUseHash
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
  return {
    sourcePath,
    sourceHash: alias.sourceHash,
    sourceSpan: alias.sourceSpan,
    localName: alias.localName ?? alias.exportedName,
    exportedName: alias.exportedName,
    symbolId: alias.symbolId,
    signatureHash: alias.signatureHash,
    sourceSymbolId: alias.sourceSymbolId,
    sourceSymbolKind: alias.sourceSymbolKind,
    sourceSymbolSignatureHash: alias.sourceSymbolSignatureHash
  };
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
      originSourceHash: binding?.originSourceHash,
      originSourceSpan: binding?.originSourceSpan,
      originSignatureHash: binding?.originSignatureHash,
      originSourceSymbolId: binding?.originSourceSymbolId,
      originSourceSymbolKind: binding?.originSourceSymbolKind,
      originSourceSymbolSignatureHash: binding?.originSourceSymbolSignatureHash,
      resolvedExportName: binding?.resolvedExportName,
      resolvedExportUseHash: binding?.resolvedExportUseHash,
      resolvedBindingId: binding?.resolvedBindingId,
      resolvedBindingName: binding?.resolvedBindingName,
      resolvedBindingUseHash: binding?.resolvedBindingUseHash,
      aliasResolutionStatus: binding?.aliasResolutionStatus,
      aliasResolutionEvidenceKind: binding?.aliasResolutionEvidenceKind,
      aliasResolutionReasonCodes: binding?.aliasResolutionReasonCodes,
      status: binding?.aliasResolutionStatus ?? reference.status,
      reasonCodes: reasonCodes.length ? reasonCodes : undefined,
      resolvedUseHash
    });
  });
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

function semanticSourceSpanForHash(span) {
  return span ? compactRecord({
    path: span.path,
    start: span.start,
    end: span.end,
    startLine: span.startLine,
    startColumn: span.startColumn,
    endLine: span.endLine,
    endColumn: span.endColumn
  }) : undefined;
}

function localKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function exportKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function compareJson(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

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
