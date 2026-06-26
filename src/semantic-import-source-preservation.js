import { createSourcePreservationRecord, explainSourcePreservation } from '@shapeshift-labs/frontier-lang-kernel';
import { countBy, idFragment, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { compactSpan, sourcePreservationInspectionTags, sourcePreservationQueryKeys, sumCountObjects } from './semantic-import-source-preservation-utils.js';

function createKernelSourcePreservationRecords(input) {
  const records = [];
  if (input.sourcePreservation) {
    const exactSource = input.sourcePreservation.summary?.exactSourceAvailable === true &&
      (!input.sourceHash || input.sourcePreservation.sourceHash === input.sourceHash);
    const hashMismatch = input.sourceHash &&
      input.sourcePreservation.sourceHash &&
      input.sourcePreservation.sourceHash !== input.sourceHash;
    records.push(createSourcePreservationRecord({
      id: `source_preservation_${idFragment(input.idPart ?? input.sourcePath ?? input.language)}_file`,
      level: hashMismatch ? 'blocked' : exactSource ? 'exact' : 'estimated',
      precision: exactSource ? 'exact' : 'estimated',
      nativeSourceId: input.nativeSource?.id,
      nativeAstNodeId: input.nativeAst?.rootId,
      sourceSpan: {
        sourceId: input.sourceHash,
        path: input.sourcePath,
        startLine: 1,
        startColumn: 1
      },
      lossIds: (input.losses ?? []).filter((loss) => loss.kind === 'sourcePreservation' || loss.sourceMapId).map((loss) => loss.id),
      evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
      losses: input.losses ?? [],
      evidence: input.evidence ?? [],
      reasons: hashMismatch
        ? [`Preserved source hash ${input.sourcePreservation.sourceHash} does not match import hash ${input.sourceHash}.`]
        : exactSource
          ? ['Exact native source text is preserved for source-level replay and semantic merge review.']
          : ['Native source preservation metadata exists, but exact source text is unavailable or unverified.'],
      metadata: {
        compilerRecord: 'nativeSourcePreservation',
        nativeSourcePreservationId: input.sourcePreservation.id,
        sourceBytes: input.sourcePreservation.sourceBytes,
        lineCount: input.sourcePreservation.lineCount,
        tokens: input.sourcePreservation.summary?.tokens ?? 0,
        trivia: input.sourcePreservation.summary?.trivia ?? 0,
        directives: input.sourcePreservation.summary?.directives ?? 0,
        comments: input.sourcePreservation.summary?.comments ?? 0,
        whitespace: input.sourcePreservation.summary?.whitespace ?? 0,
        truncated: input.sourcePreservation.summary?.truncated === true,
        triviaByKind: input.sourcePreservation.summary?.triviaByKind ?? countBy((input.sourcePreservation.trivia ?? []).map((entry) => entry.kind ?? 'unknown')),
        directivesByKind: input.sourcePreservation.summary?.directivesByKind ?? countBy((input.sourcePreservation.directives ?? []).map((entry) => entry.kind ?? 'directive')),
        directiveKinds: input.sourcePreservation.summary?.directiveKinds ?? uniqueStrings((input.sourcePreservation.directives ?? []).map((entry) => entry.kind ?? 'directive')),
        commentSpanIds: input.sourcePreservation.summary?.commentSpanIds ?? (input.sourcePreservation.trivia ?? []).filter((entry) => isCommentKind(entry.kind)).map((entry) => entry.id).filter(Boolean),
        directiveSpanIds: input.sourcePreservation.summary?.directiveSpanIds ?? (input.sourcePreservation.directives ?? []).map((entry) => entry.id).filter(Boolean),
        inspectionTags: sourcePreservationInspectionTags({
          compilerRecord: 'nativeSourcePreservation',
          level: hashMismatch ? 'blocked' : exactSource ? 'exact' : 'estimated',
          precision: exactSource ? 'exact' : 'estimated',
          sourcePath: input.sourcePath,
          exactSource
        }),
        queryKeys: sourcePreservationQueryKeys({
          compilerRecord: 'nativeSourcePreservation',
          level: hashMismatch ? 'blocked' : exactSource ? 'exact' : 'estimated',
          precision: exactSource ? 'exact' : 'estimated',
          sourcePath: input.sourcePath
        })
      }
    }));
  }

  for (const sourceMap of input.sourceMaps ?? []) {
    for (const [index, mapping] of (sourceMap.mappings ?? []).entries()) {
      records.push(explainSourcePreservation({
        id: `source_preservation_${idFragment(sourceMap.id)}_${index + 1}_${idFragment(mapping.id)}`,
        sourceMap,
        mapping,
        level: mapping.preservation,
        losses: input.losses ?? [],
        evidence: uniqueRecordsById([...(input.evidence ?? []), ...(sourceMap.evidence ?? [])]),
        metadata: {
          compilerRecord: 'sourceMapMapping',
          language: input.language,
          semanticIndexId: input.semanticIndex?.id,
          sourceMapId: sourceMap.id,
          sourceMapMappingId: mapping.id,
          ...sourceMapMappingInspectionMetadata(input, sourceMap, mapping)
        }
      }));
    }
  }

  return uniqueRecordsById(records);
}

function summarizeKernelSourcePreservationRecords(records) {
  const compactRecords = records.map(compactKernelSourcePreservationRecord);
  const byLevel = countBy(compactRecords.map((record) => record.level ?? 'unknown'));
  const sourceMapRecords = compactRecords.filter((record) => record.compilerRecord === 'sourceMapMapping' || record.sourceMapMappingId);
  return {
    total: compactRecords.length,
    ids: compactRecords.map((record) => record.id).filter(Boolean),
    byLevel,
    byPrecision: countBy(compactRecords.map((record) => record.precision ?? 'unknown')),
    byCompilerRecord: countBy(compactRecords.map((record) => record.compilerRecord ?? 'unknown')),
    bySourceMapOrigin: countBy(sourceMapRecords.map((record) => record.sourceMapOrigin ?? 'native-import')),
    byOwnershipRegionKind: countBy(compactRecords.map((record) => record.ownershipRegionKind).filter(Boolean)),
    exact: byLevel.exact ?? 0,
    declaration: byLevel.declaration ?? 0,
    estimated: byLevel.estimated ?? 0,
    blocked: byLevel.blocked ?? 0,
    sourcePaths: uniqueStrings(compactRecords.map((record) => record.sourcePath).filter(Boolean)),
    generatedPaths: uniqueStrings(compactRecords.map((record) => record.generatedPath).filter(Boolean)),
    generatedNames: uniqueStrings(compactRecords.map((record) => record.generatedName).filter(Boolean)),
    sourceMapIds: uniqueStrings(compactRecords.map((record) => record.sourceMapId).filter(Boolean)),
    sourceMapMappingIds: uniqueStrings(compactRecords.map((record) => record.sourceMapMappingId).filter(Boolean)),
    declarationMappingIds: uniqueStrings(sourceMapRecords.filter((record) => record.level === 'declaration' || record.precision === 'declaration').map((record) => record.sourceMapMappingId).filter(Boolean)),
    generatedSpanMappingIds: uniqueStrings(sourceMapRecords.filter((record) => record.generatedRange || record.generatedPath).map((record) => record.sourceMapMappingId).filter(Boolean)),
    semanticSymbolIds: uniqueStrings(compactRecords.map((record) => record.semanticSymbolId).filter(Boolean)),
    semanticOccurrenceIds: uniqueStrings(compactRecords.map((record) => record.semanticOccurrenceId).filter(Boolean)),
    nativeAstNodeIds: uniqueStrings(compactRecords.map((record) => record.nativeAstNodeId).filter(Boolean)),
    ownershipRegionIds: uniqueStrings(compactRecords.map((record) => record.ownershipRegionId).filter(Boolean)),
    queryKeys: uniqueStrings(compactRecords.flatMap((record) => record.queryKeys ?? [])),
    records: compactRecords
  };
}

function collectKernelSourcePreservationFromImport(imported) {
  return uniqueRecordsById([
    ...(imported?.metadata?.kernelSourcePreservationRecords ?? []),
    ...(imported?.metadata?.sourcePreservationRecords ?? []),
    ...(imported?.universalAst?.metadata?.kernelSourcePreservationRecords ?? []),
    ...(imported?.universalAst?.metadata?.sourcePreservationRecords ?? [])
  ].filter((record) => record?.kind === 'frontier.lang.sourcePreservation'));
}

function summarizeKernelSourcePreservation(importResult, imports) {
  return summarizeKernelSourcePreservationRecords(uniqueRecordsById([
    ...collectKernelSourcePreservationFromImport(importResult),
    ...imports.flatMap((imported) => collectKernelSourcePreservationFromImport(imported))
  ]));
}

function compactKernelSourcePreservationRecord(record) {
  return {
    id: record.id,
    level: record.level,
    precision: record.precision,
    compilerRecord: record.metadata?.compilerRecord,
    preservation: record.metadata?.preservation ?? record.level,
    sourceMapId: record.sourceMapId,
    sourceMapMappingId: record.sourceMapMappingId,
    sourceMapOrigin: record.metadata?.sourceMapOrigin,
    semanticNodeId: record.semanticNodeId,
    nativeSourceId: record.nativeSourceId,
    nativeAstNodeId: record.nativeAstNodeId,
    semanticSymbolId: record.semanticSymbolId,
    semanticOccurrenceId: record.semanticOccurrenceId,
    sourcePath: record.sourceSpan?.path,
    generatedPath: record.generatedSpan?.path ?? record.generatedSpan?.targetPath,
    generatedName: record.generatedSpan?.generatedName ?? record.metadata?.generatedName,
    sourceRange: compactSpan(record.sourceSpan),
    generatedRange: compactSpan(record.generatedSpan),
    target: record.generatedSpan?.target?.language ?? record.generatedSpan?.target ?? record.metadata?.target,
    targetPath: record.generatedSpan?.targetPath ?? record.metadata?.targetPath,
    ownershipRegionId: record.metadata?.ownershipRegionId,
    ownershipRegionKey: record.metadata?.ownershipRegionKey,
    ownershipRegionKind: record.metadata?.ownershipRegionKind,
    declarationKind: record.metadata?.declarationKind,
    semanticKind: record.metadata?.semanticKind,
    lossIds: record.lossIds ?? [],
    evidenceIds: record.evidenceIds ?? [],
    reasons: record.reasons ?? [],
    inspectionTags: record.metadata?.inspectionTags ?? [],
    queryKeys: record.metadata?.queryKeys ?? []
  };
}

function summarizeImportSourcePreservation(importResult, imports) {
  const records = uniqueSourcePreservationRecords([
    ...collectSourcePreservationFromImport(importResult),
    ...imports.flatMap((imported) => collectSourcePreservationFromImport(imported))
  ]);
  const compactRecords = records.map(compactSourcePreservationRecord);
  return {
    total: compactRecords.length,
    ids: compactRecords.map((record) => record.id).filter(Boolean),
    sourcePaths: uniqueStrings(compactRecords.map((record) => record.sourcePath).filter(Boolean)),
    sourceHashes: uniqueStrings(compactRecords.map((record) => record.sourceHash).filter(Boolean)),
    exactSourceAvailable: compactRecords.filter((record) => record.exactSourceAvailable).length,
    sourceBytes: compactRecords.reduce((sum, record) => sum + (record.sourceBytes ?? 0), 0),
    lineCount: compactRecords.reduce((sum, record) => sum + (record.lineCount ?? 0), 0),
    tokens: compactRecords.reduce((sum, record) => sum + (record.tokens ?? 0), 0),
    trivia: compactRecords.reduce((sum, record) => sum + (record.trivia ?? 0), 0),
    directives: compactRecords.reduce((sum, record) => sum + (record.directives ?? 0), 0),
    comments: compactRecords.reduce((sum, record) => sum + (record.comments ?? 0), 0),
    whitespace: compactRecords.reduce((sum, record) => sum + (record.whitespace ?? 0), 0),
    triviaByKind: sumCountObjects(compactRecords.map((record) => record.triviaByKind)),
    directivesByKind: sumCountObjects(compactRecords.map((record) => record.directivesByKind)),
    directiveKinds: uniqueStrings(compactRecords.flatMap((record) => record.directiveKinds ?? [])),
    commentSpanIds: uniqueStrings(compactRecords.flatMap((record) => record.commentSpanIds ?? [])),
    directiveSpanIds: uniqueStrings(compactRecords.flatMap((record) => record.directiveSpanIds ?? [])),
    truncated: compactRecords.some((record) => record.truncated),
    records: compactRecords
  };
}

function collectSourcePreservationFromImport(imported) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  return [
    imported?.metadata?.sourcePreservation,
    imported?.nativeSource?.metadata?.sourcePreservation,
    nativeAst?.metadata?.sourcePreservation,
    imported?.universalAst?.metadata?.sourcePreservation,
    ...(imported?.nativeSources ?? []).map((nativeSource) => nativeSource?.metadata?.sourcePreservation ?? nativeSource?.ast?.metadata?.sourcePreservation)
  ].filter(Boolean);
}

function uniqueSourcePreservationRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = record.id ?? `${record.sourcePath ?? 'source'}#${record.sourceHash ?? result.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function compactSourcePreservationRecord(record) {
  return {
    id: record.id,
    language: record.language,
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    sourceBytes: record.sourceBytes,
    lineCount: record.lineCount,
    newline: record.newline,
    encoding: record.encoding,
    exactSourceAvailable: record.summary?.exactSourceAvailable === true,
    tokens: record.summary?.tokens ?? record.tokens?.length ?? 0,
    trivia: record.summary?.trivia ?? record.trivia?.length ?? 0,
    directives: record.summary?.directives ?? record.directives?.length ?? 0,
    comments: record.summary?.comments ?? 0,
    whitespace: record.summary?.whitespace ?? 0,
    triviaByKind: record.summary?.triviaByKind ?? countBy((record.trivia ?? []).map((entry) => entry.kind ?? 'unknown')),
    directivesByKind: record.summary?.directivesByKind ?? countBy((record.directives ?? []).map((entry) => entry.kind ?? 'directive')),
    directiveKinds: record.summary?.directiveKinds ?? uniqueStrings((record.directives ?? []).map((entry) => entry.kind ?? 'directive')),
    commentSpanIds: record.summary?.commentSpanIds ?? (record.trivia ?? []).filter((entry) => isCommentKind(entry.kind)).map((entry) => entry.id).filter(Boolean),
    directiveSpanIds: record.summary?.directiveSpanIds ?? (record.directives ?? []).map((entry) => entry.id).filter(Boolean),
    truncated: record.summary?.truncated === true
  };
}

function sourceMapMappingInspectionMetadata(input, sourceMap, mapping) {
  const sourcePath = mapping.sourceSpan?.path ?? sourceMap.sourcePath ?? input.sourcePath;
  const generatedPath = mapping.generatedSpan?.targetPath ?? mapping.generatedSpan?.path ?? sourceMap.targetPath;
  const generatedName = mapping.generatedName ?? mapping.generatedSpan?.generatedName;
  const origin = mapping.metadata?.sourceMapOrigin ?? (mapping.generatedSpan ? 'generated' : 'native-import');
  const base = {
    compilerRecord: 'sourceMapMapping',
    level: mapping.preservation,
    precision: mapping.precision,
    sourcePath,
    generatedPath,
    sourceMapOrigin: origin,
    ownershipRegionKind: mapping.ownershipRegionKind,
    semanticSymbolId: mapping.semanticSymbolId
  };
  return {
    preservation: mapping.preservation,
    precision: mapping.precision,
    sourceMapOrigin: origin,
    sourcePath,
    generatedPath,
    targetPath: generatedPath,
    generatedName,
    sourceRange: compactSpan(mapping.sourceSpan),
    generatedRange: compactSpan(mapping.generatedSpan),
    target: mapping.target?.language ?? mapping.generatedSpan?.target?.language ?? mapping.target ?? mapping.generatedSpan?.target,
    ownershipRegionId: mapping.ownershipRegionId,
    ownershipRegionKey: mapping.ownershipRegionKey,
    ownershipRegionKind: mapping.ownershipRegionKind,
    declarationKind: mapping.metadata?.declarationKind,
    semanticKind: mapping.metadata?.semanticKind,
    inspectionTags: sourcePreservationInspectionTags(base),
    queryKeys: sourcePreservationQueryKeys(base)
  };
}

function isCommentKind(kind) {
  return kind === 'comment' || kind === 'jsdoc-comment' || kind === 'block-comment';
}

export {
  collectKernelSourcePreservationFromImport,
  createKernelSourcePreservationRecords,
  summarizeImportSourcePreservation,
  summarizeKernelSourcePreservation,
  summarizeKernelSourcePreservationRecords
};
