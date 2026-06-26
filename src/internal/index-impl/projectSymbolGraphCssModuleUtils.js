import { lineColumnForOffset } from './lineColumnForOffset.js';

const CssModulePathPattern = /\.module\.css(?:[?#].*)?$/i;

function cssModuleSourceRecord(imported) {
  const sourcePath = sourcePathForImport(imported);
  if (!isCssModulePath(sourcePath)) return undefined;
  const metadata = objectValue(imported?.metadata);
  const nativeMetadata = objectValue(imported?.nativeSource?.metadata);
  const astMetadata = objectValue(imported?.nativeAst?.metadata);
  return compactRecord({
    sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? imported?.metadata?.sourceHash,
    cssModuleEvidence: firstObject(
      metadata.cssModuleEvidence,
      metadata.cssModules,
      nativeMetadata.cssModuleEvidence,
      nativeMetadata.cssModules,
      astMetadata.cssModuleEvidence,
      astMetadata.cssModules
    ),
    bundlerTransformHash: firstString(metadata.bundlerTransformHash, nativeMetadata.bundlerTransformHash, astMetadata.bundlerTransformHash),
    sourceMapProofHash: firstString(metadata.sourceMapProofHash, nativeMetadata.sourceMapProofHash, astMetadata.sourceMapProofHash)
  });
}

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.sourceText;
}

function sourcePathForImport(imported) {
  return imported?.sourcePath ?? imported?.nativeSource?.sourcePath;
}

function isCssModuleBindingEdge(edge) {
  return isCssModulePath(edge?.resolvedModulePath ?? edge?.moduleSpecifier) && Boolean(edge.localName);
}

function isCssModulePath(path) {
  return CssModulePathPattern.test(String(path ?? ''));
}

function cssModuleSpecifierPath(moduleSpecifier) {
  return String(moduleSpecifier ?? '').replace(/^\.\//, '');
}

function bindingsForSourcePath(bindingsByLocal, sourcePath) {
  const result = [];
  for (const [key, bindings] of bindingsByLocal.entries()) {
    if (key.startsWith(`${sourcePath}\0`)) result.push(...bindings);
  }
  return result;
}

function localKey(sourcePath, localName) {
  return sourcePath && localName ? `${sourcePath}\0${localName}` : '';
}

function groupBy(records, keyFn) {
  const result = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!key) continue;
    result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}

function uniqueRecords(records, keyFn = (record) => record.id ?? JSON.stringify(record)) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cssModuleUseSiteKey(site) {
  return [site.cssModuleImportBindingId, site.jsSourcePath, site.sourceSpan?.start, site.sourceSpan?.end, site.exportName, site.useSiteKind].join('\0');
}

function cssModuleBlockerKey(blocker) {
  return [blocker.cssModuleImportBindingId, blocker.sourcePath, blocker.sourceSpan?.start, blocker.sourceSpan?.end, blocker.reasonCode].join('\0');
}

function sourceSpanForRange(sourceText, sourcePath, sourceHash, start, end) {
  const startPos = lineColumnForOffset(sourceText, start);
  const endPos = lineColumnForOffset(sourceText, end);
  return {
    sourceId: sourceHash,
    path: sourcePath,
    start,
    end,
    startLine: startPos.line,
    startColumn: startPos.column,
    endLine: endPos.line,
    endColumn: endPos.column
  };
}

function semanticSpanForHash(span) {
  return span ? { path: span.path, start: span.start, end: span.end, startLine: span.startLine, startColumn: span.startColumn, endLine: span.endLine, endColumn: span.endColumn } : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIdentifierChar(char) {
  return typeof char === 'string' && /[A-Za-z0-9_$]/.test(char);
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value));
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

export {
  bindingsForSourcePath,
  compactRecord,
  cssModuleBlockerKey,
  cssModuleSourceRecord,
  cssModuleSpecifierPath,
  cssModuleUseSiteKey,
  escapeRegExp,
  groupBy,
  isCssModuleBindingEdge,
  isIdentifierChar,
  localKey,
  nativeImportSourceText,
  semanticSpanForHash,
  sourcePathForImport,
  sourceSpanForRange,
  uniqueRecords
};
