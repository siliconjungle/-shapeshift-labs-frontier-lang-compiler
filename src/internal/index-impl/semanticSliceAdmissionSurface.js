import{idFragment,uniqueStrings}from'../../native-import-utils.js';

export function semanticSliceAdmissionSelectedSurface(slice){
  return{
    entryRefs:[...(slice?.entryRefs??[])],
    matchedEntryRefs:[...(slice?.matchedEntryRefs??[])],
    unresolvedEntryRefs:[...(slice?.unresolvedEntryRefs??[])],
    symbols:(slice?.symbols??[]).map(compactAdmissionSymbol),
    ownershipRegions:(slice?.ownershipRegions??[]).map(compactAdmissionRegion),
    nativeNodes:(slice?.nativeNodes??[]).map(compactAdmissionNativeNode),
    relations:(slice?.relations??[]).map(compactAdmissionRelation),
    occurrences:(slice?.occurrences??[]).map(compactAdmissionOccurrence),
    sourceMapLinks:(slice?.sourceMapLinks??[]).map(compactAdmissionSourceMapLink),
    sourceSpans:(slice?.sourceSpans??[]).map(compactAdmissionSpan),
    sourceFiles:(slice?.sourceFiles??[]).map((file)=>({
      path:file.path,
      sourceHash:file.sourceHash,
      spanCount:file.spanCount,
      excerptCount:file.excerptCount,
      sourceTextAvailable:file.sourceTextAvailable
    })),
    sourceHashes:slice?.mergeAdmission?.sourceHashes??[],
    conflictKeys:uniqueStrings(slice?.mergeAdmission?.conflictKeys??[]),
    ownershipKeys:uniqueStrings(slice?.mergeAdmission?.ownershipKeys??[])
  };
}

export function semanticSliceSelectedSurfaceEvidence(slice,selectedSurface,testResult,readiness,action){
  return{
    id:`evidence_${idFragment(slice?.id??'slice')}_selected_surface`,
    kind:'semantic-slice-selected-surface',
    status:readiness==='blocked'||testResult?.status==='failed'?'failed':'passed',
    path:slice?.sourcePath,
    summary:`Semantic slice admission selected ${selectedSurface.symbols.length} symbol(s), ${selectedSurface.ownershipRegions.length} ownership region(s), ${selectedSurface.relations.length} relation(s), and ${selectedSurface.sourceFiles.length} source file(s).`,
    metadata:{
      sliceId:slice?.id,
      action,
      readiness,
      testStatus:testResult?.status,
      selectedSurface
    }
  };
}

function compactAdmissionSymbol(symbol){
  return{
    id:symbol.id,
    name:symbol.name,
    displayName:symbol.displayName,
    kind:symbol.kind,
    signature:symbol.signature,
    nativeAstNodeId:symbol.nativeAstNodeId,
    sourcePath:symbol.sourcePath,
    sourceSpan:compactAdmissionSpan(symbol.sourceSpan),
    ownershipRegionId:symbol.ownershipRegionId??symbol.metadata?.ownershipRegionId,
    ownershipRegionKey:symbol.ownershipRegionKey??symbol.metadata?.ownershipRegionKey,
    ownershipRegionKind:symbol.ownershipRegionKind??symbol.metadata?.ownershipRegionKind
  };
}

function compactAdmissionRegion(region){
  return{
    id:region.id,
    key:region.key,
    conflictKey:region.conflictKey,
    kind:region.kind??region.regionKind,
    granularity:region.granularity,
    symbolId:region.symbolId,
    symbolName:region.symbolName,
    nativeAstNodeId:region.nativeAstNodeId,
    sourcePath:region.sourcePath,
    sourceSpan:compactAdmissionSpan(region.sourceSpan)
  };
}

function compactAdmissionNativeNode(node){
  return{
    id:node.id,
    kind:node.kind,
    languageKind:node.languageKind,
    sourcePath:node.sourcePath,
    sourceSpan:compactAdmissionSpan(node.sourceSpan??node.span),
    parentId:node.parentId,
    childCount:(node.children??[]).length
  };
}

function compactAdmissionRelation(relation){
  return{
    id:relation.id,
    predicate:relation.predicate,
    kind:relation.kind,
    sourceId:relation.sourceId,
    targetId:relation.targetId
  };
}

function compactAdmissionOccurrence(occurrence){
  return{
    id:occurrence.id,
    symbolId:occurrence.symbolId,
    nativeAstNodeId:occurrence.nativeAstNodeId,
    role:occurrence.role,
    sourcePath:occurrence.sourcePath,
    sourceSpan:compactAdmissionSpan(occurrence.sourceSpan??occurrence.span)
  };
}

function compactAdmissionSourceMapLink(link){
  return{
    id:link.id,
    sourceMapId:link.sourceMapId,
    sourcePath:link.sourcePath,
    sourceHash:link.sourceHash,
    targetPath:link.targetPath,
    targetHash:link.targetHash,
    semanticSymbolId:link.semanticSymbolId,
    semanticOccurrenceId:link.semanticOccurrenceId,
    semanticNodeId:link.semanticNodeId,
    nativeAstNodeId:link.nativeAstNodeId,
    ownershipRegionId:link.ownershipRegionId,
    ownershipRegionKey:link.ownershipRegionKey,
    ownershipRegionKind:link.ownershipRegionKind,
    precision:link.precision,
    sourceSpan:compactAdmissionSpan(link.sourceSpan)
  };
}

function compactAdmissionSpan(span){
  if(!span)return undefined;
  return{
    path:span.path,
    sourceId:span.sourceId,
    sourceHash:span.sourceHash,
    startLine:span.startLine,
    startColumn:span.startColumn,
    endLine:span.endLine,
    endColumn:span.endColumn,
    startOffset:span.startOffset,
    endOffset:span.endOffset
  };
}
