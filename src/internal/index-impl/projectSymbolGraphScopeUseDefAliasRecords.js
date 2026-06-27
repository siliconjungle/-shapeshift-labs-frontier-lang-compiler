import { idFragment } from '../../native-import-utils.js';
import { resolveRelativeProjectModule } from './projectSymbolGraphModuleResolution.js';

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
  const symbols = semanticIndex?.symbols ?? [];
  const declarationsByLocalKey = groupFirst(
    symbols.filter((symbol) => symbol?.kind !== 'import' && symbol?.kind !== 'export' && symbol?.name),
    (symbol) => localKey(symbol.definitionSpan?.path ?? symbol.metadata?.sourcePath, symbol.name)
  );
  return symbols.flatMap((symbol) => {
    if (symbol?.kind !== 'export') return [];
    const metadata = objectValue(symbol.metadata);
    const sourcePath = symbol.definitionSpan?.path ?? metadata.sourcePath;
    const exportedName = firstString(metadata.exportedName, symbol.name);
    if (!sourcePath || !exportedName || exportedName.startsWith('{')) return [];
    const moduleSpecifier = firstString(metadata.moduleSpecifier, metadata.importPath, metadata.exportPath, metadata.source);
    const resolved = moduleSpecifier?.startsWith('.')
      ? resolveRelativeProjectModule(sourcePath, moduleSpecifier, documentsByPath)
      : undefined;
    const localName = firstString(metadata.localName, defaultExportLocalName(sourceTextsByPath.get(sourcePath), exportedName, moduleSpecifier), exportedName);
    const declaration = declarationsByLocalKey.get(localKey(sourcePath, localName));
    const document = documentsByPath.get(sourcePath);
    return [compactRecord({
      symbolId: symbol.id,
      sourcePath,
      sourceHash: document?.sourceHash ?? symbol.definitionSpan?.sourceId ?? declaration?.definitionSpan?.sourceId,
      sourceSpan: declaration?.definitionSpan ?? symbol.definitionSpan,
      signatureHash: symbol.signatureHash,
      sourceSymbolId: declaration?.id,
      sourceSymbolKind: declaration?.kind,
      sourceSymbolSignatureHash: declaration?.signatureHash,
      localName,
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

function localKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function groupFirst(records, keyFn) {
  const result = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

export { exportAliasRecords, importAliasRecords, nativeImportSourceText };
