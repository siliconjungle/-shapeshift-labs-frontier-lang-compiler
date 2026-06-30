import {
  idFragment,
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';

export function importsForConversionLanguage(imports, language) {
  const ids = new Set([language?.language, ...(language?.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
  return (imports ?? []).filter((imported) => ids.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language)));
}

export function conversionMergeRefs(input) {
  const routeImports = input.imports ?? [];
  const routeEvidence = evidenceRecords(input);
  const routeId = input.routeId;
  const sourceMaps = routeImports.flatMap(sourceMapsForImport);
  return {
    planId: input.planId,
    routeId,
    historyIds: [`history_${routeId}`],
    patchBundleIds: [],
    patchIds: [],
    mergeCandidateIds: uniqueStrings(routeImports.flatMap(mergeCandidateIds)),
    replayLinks: routeImports.flatMap((imported) => imported?.replayLinks ?? imported?.universalAst?.replayLinks ?? []),
    evidenceIds: uniqueStrings([
      ...routeImports.flatMap((imported) => evidenceRecords(imported).map((record) => record.id)),
      ...routeEvidence.map((record) => record.id)
    ]),
    proofIds: uniqueStrings([
      ...routeImports.flatMap(proofIdsForImport),
      ...proofIdsForEvidence(routeEvidence)
    ]),
    sources: routeImports.map(conversionSourceRef),
    semanticOwnershipKeys: uniqueStrings(routeImports.flatMap(semanticOwnershipKeysForImport)),
    conflictKeys: uniqueStrings(routeImports.flatMap(conflictKeysForImport)),
    sourceMapIds: uniqueStrings(sourceMaps.map((sourceMap) => sourceMap?.id)),
    sourceMapMappingIds: uniqueStrings(sourceMaps.flatMap((sourceMap) => (sourceMap?.mappings ?? []).map((mapping) => mapping.id))),
    sourceMapLinkIds: [],
    readiness: input.readiness,
    admissionStatus: input.admissionStatus,
    metadata: {
      plannedHistoryId: true,
      note: 'Merge refs are compact route provenance for semantic history and patch-bundle builders; planned IDs are not proof records until materialized.'
    }
  };
}

function conversionSourceRef(imported) {
  return {
    sourceId: imported?.nativeSource?.id ?? imported?.id,
    importId: imported?.id,
    sourcePath: imported?.sourcePath ?? imported?.nativeSource?.sourcePath,
    sourceHash: imported?.sourceHash
      ?? imported?.nativeSource?.sourceHash
      ?? imported?.metadata?.sourcePreservation?.sourceHash,
    baseHash: imported?.baseHash ?? imported?.metadata?.baseHash,
    targetHash: imported?.targetHash ?? imported?.metadata?.targetHash
  };
}

function evidenceRecords(imported) {
  return [
    ...(imported?.evidence ?? []),
    ...(imported?.universalAst?.evidence ?? []),
    ...(imported?.patch?.evidence ?? [])
  ].filter((record) => record?.id);
}

function proofIdsForImport(imported) {
  return [
    ...(imported?.proofIds ?? []),
    ...proofIdsForEvidence(evidenceRecords(imported))
  ];
}

function proofIdsForEvidence(evidence) {
  return (evidence ?? []).filter((record) => record?.kind === 'proof' || record?.type === 'proof' || /proof|replay/i.test(String(record?.kind ?? record?.type ?? ''))).map((record) => record.id);
}

function mergeCandidateIds(imported) {
  return (imported?.mergeCandidates ?? []).map((candidate) => candidate.id);
}

function sourceMapsForImport(imported) {
  return [
    ...(imported?.sourceMaps ?? []),
    ...(imported?.universalAst?.sourceMaps ?? [])
  ];
}

function semanticOwnershipKeysForImport(imported) {
  return uniqueStrings([
    ...ownershipKeysFromCandidates(imported),
    ...ownershipKeysFromSourceMaps(imported),
    ...ownershipKeysFromSymbols(imported)
  ]);
}

function conflictKeysForImport(imported) {
  return uniqueStrings([
    ...conflictKeysFromCandidates(imported),
    ...ownershipKeysFromSourceMaps(imported)
  ]);
}

function ownershipKeysFromCandidates(imported) {
  return uniqueStrings((imported?.mergeCandidates ?? []).flatMap((candidate) => [
    ...(candidate?.ownershipKeys ?? []),
    ...(candidate?.semanticOwnershipKeys ?? []),
    ...(candidate?.changedRegions ?? []).map((region) => region?.key)
  ]));
}

function conflictKeysFromCandidates(imported) {
  return uniqueStrings((imported?.mergeCandidates ?? []).flatMap((candidate) => [
    ...(candidate?.conflictKeys ?? []),
    ...(candidate?.changedRegions ?? []).flatMap((region) => [region?.conflictKey, ...(region?.admission?.conflictKeys ?? [])])
  ]));
}

function ownershipKeysFromSourceMaps(imported) {
  return uniqueStrings(sourceMapsForImport(imported).flatMap((sourceMap) => (sourceMap?.mappings ?? []).flatMap((mapping) => [
    mapping?.ownershipRegionKey,
    mapping?.ownershipRegionId,
    mapping?.ownershipRegionKind ? `${mapping.sourceSpan?.path ?? imported?.sourcePath ?? 'source'}#${mapping.ownershipRegionKind}` : undefined
  ])));
}

function ownershipKeysFromSymbols(imported) {
  const symbols = imported?.semanticIndex?.symbols ?? imported?.universalAst?.semanticIndex?.symbols ?? [];
  return uniqueStrings(symbols.flatMap((symbol) => [
    symbol?.metadata?.ownershipRegionKey,
    symbol?.metadata?.ownershipRegionId,
    symbol?.metadata?.ownershipRegionKind ? `${symbol.language ?? imported?.language ?? 'source'}#${idFragment(symbol.name)}#${symbol.metadata.ownershipRegionKind}` : undefined
  ]));
}
