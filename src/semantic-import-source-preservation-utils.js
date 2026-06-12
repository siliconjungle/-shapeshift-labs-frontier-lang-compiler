import { uniqueStrings } from './native-import-utils.js';

export function sourcePreservationInspectionTags(input) {
  return uniqueStrings([
    input.compilerRecord,
    input.level,
    input.precision,
    input.exactSource ? 'exact-source-text' : undefined,
    input.sourceMapOrigin,
    input.generatedPath ? 'generated-span' : undefined,
    input.semanticSymbolId ? 'semantic-symbol' : undefined,
    input.ownershipRegionKind ? `region:${input.ownershipRegionKind}` : undefined
  ]);
}

export function sourcePreservationQueryKeys(input) {
  return uniqueStrings([
    input.compilerRecord ? `compiler-record:${input.compilerRecord}` : undefined,
    input.level ? `level:${input.level}` : undefined,
    input.precision ? `precision:${input.precision}` : undefined,
    input.sourcePath ? `source:${input.sourcePath}` : undefined,
    input.generatedPath ? `generated:${input.generatedPath}` : undefined,
    input.sourceMapOrigin ? `source-map-origin:${input.sourceMapOrigin}` : undefined,
    input.ownershipRegionKind ? `region-kind:${input.ownershipRegionKind}` : undefined
  ]);
}

export function compactSpan(span) {
  if (!span) return undefined;
  return {
    sourceId: span.sourceId,
    path: span.path,
    targetPath: span.targetPath,
    targetHash: span.targetHash,
    start: span.start,
    end: span.end,
    startLine: span.startLine,
    startColumn: span.startColumn,
    endLine: span.endLine,
    endColumn: span.endColumn,
    generatedName: span.generatedName
  };
}

export function sumCountObjects(objects) {
  const result = {};
  for (const object of objects ?? []) {
    for (const [key, value] of Object.entries(object ?? {})) {
      const count = Number(value);
      if (!Number.isFinite(count)) continue;
      result[key] = (result[key] ?? 0) + count;
    }
  }
  return result;
}
