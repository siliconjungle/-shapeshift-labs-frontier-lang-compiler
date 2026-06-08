import{idFragment,maxSemanticMergeReadiness,uniqueByLossId,uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';import{createPatch,createSemanticMergeCandidateRecord}from'@shapeshift-labs/frontier-lang-kernel';
import{attachNativeChangeRegionProjectionMetadata}from'./attachNativeChangeRegionProjectionMetadata.js';import{classifyNativeSourceMergeConflicts}from'./semanticMergeConflicts.js';import{createSemanticImportSidecar}from'./createSemanticImportSidecar.js';import{diffNativeOwnershipRegions}from'./diffNativeOwnershipRegions.js';import{diffNativeSymbols}from'./diffNativeSymbols.js';import{fileLevelNativeChangeRegion}from'./fileLevelNativeChangeRegion.js';import{mapDiffSymbols}from'./mapDiffSymbols.js';import{nativeChangeSpans}from'./nativeChangeSpans.js';import{nativeChangeTouchedSymbol}from'./nativeChangeTouchedSymbol.js';import{nativeImportReadiness}from'./nativeImportReadiness.js';import{nativeSourceChangeReasons}from'./nativeSourceChangeReasons.js';import{nativeSourceChangeSummary}from'./nativeSourceChangeSummary.js';import{normalizeNativeDiffImport}from'./normalizeNativeDiffImport.js';import{summarizeNativeChangedRegionProjections}from'./summarizeNativeChangedRegionProjections.js';
import{decorateSemanticMergeCandidateForAdmission}from'./semanticMergeCandidateRecords.js';
export function diffNativeSourceImports(input) {
  const before = normalizeNativeDiffImport(input.before, input, 'before');
  const after = normalizeNativeDiffImport(input.after, input, 'after');
  if (!before && !after) throw new Error('diffNativeSourceImports requires before or after native source input');
  const language = input.language ?? after?.language ?? before?.language;
  const sourcePath = input.sourcePath ?? after?.sourcePath ?? before?.sourcePath;
  const beforeHash = before?.nativeSource?.sourceHash ?? before?.nativeAst?.sourceHash ?? before?.sourceHash;
  const afterHash = after?.nativeSource?.sourceHash ?? after?.nativeAst?.sourceHash ?? after?.sourceHash;
  const idPart = idFragment(input.id ?? sourcePath ?? language ?? 'native_source_change');
  const beforeSidecar = before ? createSemanticImportSidecar(before, { id: `sidecar_before_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const afterSidecar = after ? createSemanticImportSidecar(after, { id: `sidecar_after_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const beforeSymbols = mapDiffSymbols(before, beforeSidecar);
  const afterSymbols = mapDiffSymbols(after, afterSidecar);
  const changedSymbols = diffNativeSymbols(beforeSymbols, afterSymbols);
  let changedRegions = diffNativeOwnershipRegions(beforeSidecar, afterSidecar, changedSymbols);
  const sourceChanged = Boolean(beforeHash && afterHash && beforeHash !== afterHash);
  if (sourceChanged && changedSymbols.length === 0 && changedRegions.length === 0) {
    changedRegions = [fileLevelNativeChangeRegion({ language, sourcePath, beforeHash, afterHash, before, after })];
  }
  const readiness = maxSemanticMergeReadiness(
    maxSemanticMergeReadiness(nativeImportReadiness(before), nativeImportReadiness(after)),
    sourceChanged && changedSymbols.length === 0 ? 'needs-review' : 'ready'
  );
  const reasons = nativeSourceChangeReasons({ before, after, beforeHash, afterHash, changedSymbols, changedRegions, readiness });
  changedRegions = attachNativeChangeRegionProjectionMetadata(changedRegions, {
    before,
    after,
    beforeSidecar,
    afterSidecar,
    changedSymbols,
    language,
    sourcePath,
    beforeHash,
    afterHash,
    readiness,
    reasons
  });
  const changedRegionProjectionSummary = summarizeNativeChangedRegionProjections(changedRegions);
  const evidence = [{
    id: input.evidenceId ?? `evidence_${idPart}_native_source_diff`,
    kind: 'import',
    status: input.evidenceStatus ?? 'passed',
    path: sourcePath,
    summary: `Compared ${language ?? 'native'} source imports: ${changedSymbols.length} changed symbol(s), ${changedRegions.length} changed region(s).`,
    metadata: {
      beforeImportId: before?.id,
      afterImportId: after?.id,
      beforeHash,
      afterHash,
      sourceChanged,
      addedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'added').length,
      removedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'removed').length,
      modifiedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'modified').length,
      changedRegionProjectionSummary
    }
  }];
  const conflictKeys = uniqueStrings([
    ...changedSymbols.map((symbol) => symbol.conflictKey),
    ...changedRegions.map((region) => region.conflictKey ?? region.key ?? region.id),
    ...(sourcePath ? [`source:${sourcePath}`] : [])
  ]);
  const mergeConflictProfile = classifyNativeSourceMergeConflicts({
    before,
    after,
    beforeHash,
    afterHash,
    beforeSymbols: [...beforeSymbols.values()],
    afterSymbols: [...afterSymbols.values()],
    changedSymbols,
    changedRegions,
    sourceChanged,
    conflictKeys,
    readiness,
    evidence,
    language,
    sourcePath
  });
  evidence[0].metadata.semanticMergeConflictSummary = mergeConflictProfile.conflictSummary;
  const touches = changedRegions.map((region) => ({ id: region.id, access: 'write' }));
  const operations = [
    ...(after?.nativeSource ? [{ op: 'upsertNode', node: after.nativeSource, touches: touches.length ? touches : [{ id: after.nativeSource.id, access: 'evidence' }] }] : []),
    ...(!after && before?.nativeSource ? [{ op: 'removeNode', id: before.nativeSource.id, touches: touches.length ? touches : [{ id: before.nativeSource.id, access: 'evidence' }] }] : []),
    { op: 'addEvidence', evidence: evidence[0], touches }
  ];
  const patch = createPatch({
    id: input.patchId ?? `patch_${idPart}_native_source_diff`,
    baseHash: beforeHash,
    targetHash: afterHash,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/diffNativeSourceImports',
    risk: readiness === 'blocked' ? 'high' : readiness === 'needs-review' ? 'medium' : 'low',
    operations,
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      beforeImportId: before?.id,
      afterImportId: after?.id,
      beforeHash,
      afterHash,
      changedSymbols: changedSymbols.length,
      changedRegions: changedRegions.length,
      semanticMergeConflictSummary: mergeConflictProfile.conflictSummary
    }
  });
  const mergeCandidate = decorateSemanticMergeCandidateForAdmission(createSemanticMergeCandidateRecord({
    id: input.mergeCandidateId ?? `merge_candidate_${idPart}_native_source_diff`,
    importResultId: after?.id ?? before?.id,
    patchId: patch.id,
    language,
    sourcePath,
    baseHash: beforeHash,
    targetHash: afterHash,
    touchedSymbols: changedSymbols.map(nativeChangeTouchedSymbol),
    touchedSemanticNodes: [],
    nativeSpans: nativeChangeSpans(changedSymbols, changedRegions, { language, sourcePath }),
    conflictKeys,
    readiness,
    reasons,
    evidence,
    conflictClasses: mergeConflictProfile.conflictClasses,
    conflictSummary: mergeConflictProfile.conflictSummary,
    metadata: {
      kind: 'native-source-change-set',
      beforeImportId: before?.id,
      afterImportId: after?.id,
      sourceChanged,
      changeSummary: nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged),
      changedRegionProjectionSummary,
      conflictClasses: mergeConflictProfile.conflictClasses,
      conflictSummary: mergeConflictProfile.conflictSummary
    }
  }),{changedRegions,evidence,patch,baseHash:beforeHash,targetHash:afterHash,metadata:{source:'diffNativeSourceImports'}});
  return {
    kind: 'frontier.lang.nativeSourceChangeSet',
    version: 1,
    id: input.id ?? `native_source_change_${idPart}`,
    language,
    sourcePath,
    before,
    after,
    beforeHash,
    afterHash,
    changedSymbols,
    changedRegions,
    patch,
    mergeCandidate,
    evidence,
    readiness,
    reasons,
    sourceMaps: uniqueRecordsById([...(before?.sourceMaps ?? []), ...(after?.sourceMaps ?? [])]),
    semanticIndex: after?.semanticIndex ?? before?.semanticIndex,
    losses: uniqueByLossId([...(before?.losses ?? []), ...(after?.losses ?? [])]),
    summary: nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged),
    metadata: {
      beforeSidecarId: beforeSidecar?.id,
      afterSidecarId: afterSidecar?.id,
      beforeImportContract: before?.metadata?.importResultContract,
      afterImportContract: after?.metadata?.importResultContract,
      changedRegionProjectionSummary,
      semanticMergeConflictSummary: mergeConflictProfile.conflictSummary,
      ...input.metadata
    }
  };
}
