import{uniqueStrings}from'../../native-import-utils.js';
import{nativeImportCategoryForLossKind}from'./nativeImportCategoryForLossKind.js';

export function importLosses(imported){
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const losses=[
    ...(imported?.losses??[]),
    ...(nativeAst?.losses??[]),
    ...(imported?.universalAst?.losses??[])
  ];
  const seen=new Set();
  const result=[];
  for(const loss of losses){
    const id=loss?.id??`loss_${result.length+1}`;
    if(seen.has(id)) continue;
    seen.add(id);
    result.push(loss?.id?loss:{...loss,id});
  }
  return result;
}

export function sourceLossClasses(imported,losses){
  const lossSummary=imported?.metadata?.nativeImportLossSummary
    ??imported?.nativeSource?.metadata?.nativeImportLossSummary
    ??imported?.nativeAst?.metadata?.nativeImportLossSummary
    ??imported?.universalAst?.metadata?.nativeImportLossSummary;
  return uniqueStrings([
    ...(lossSummary?.categories??[]),
    ...(losses??[]).map(lossClassForLoss),
    ...sourceProjectionLossClasses(imported)
  ].filter(Boolean));
}

function lossClassForLoss(loss){
  return loss?.metadata?.targetLossClass
    ??loss?.metadata?.lossClass
    ??loss?.metadata?.lossCategory
    ??nativeImportCategoryForLossKind(loss?.kind);
}

function sourceProjectionLossClasses(imported){
  const matrixClasses=projectionMatricesForImport(imported).flatMap((matrix)=>[
    ...Object.entries(matrix?.summary?.byLossClass??{}).filter(([,count])=>count>0).map(([lossClass])=>lossClass),
    ...(matrix?.languages??[]).flatMap((language)=>[
      ...Object.entries(language?.summary?.byLossClass??{}).filter(([,count])=>count>0).map(([lossClass])=>lossClass),
      ...(language?.targets??[]).map((target)=>target?.lossClass)
    ])
  ]);
  return uniqueStrings([
    ...targetProjectionEntriesForImport(imported).map((entry)=>entry.lossClass),
    ...matrixClasses
  ].filter(Boolean));
}

function targetProjectionEntriesForImport(imported){
  return [
    imported?.targetCoverage,
    imported?.metadata?.targetCoverage,
    imported?.metadata?.targetProjectionCoverage,
    ...(imported?.targetCoverages??[]),
    ...(imported?.metadata?.targetCoverages??[])
  ].flatMap((entry)=>Array.isArray(entry)?entry:[entry])
    .filter((entry)=>entry&&typeof entry==='object'&&(entry.target||entry.lossClass||entry.supported!==undefined));
}

function projectionMatricesForImport(imported){
  return [
    imported?.projectionMatrix,
    imported?.metadata?.projectionMatrix,
    ...(imported?.projectionMatrices??[]),
    ...(imported?.metadata?.projectionMatrices??[])
  ].filter((matrix)=>matrix?.kind==='frontier.lang.projectionTargetLossMatrix'||Array.isArray(matrix?.languages));
}

export function summarizeParserEvidence(imported,source,losses){
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const rootNode=nativeAst?.nodes?.[nativeAst?.rootId];
  const coverage=imported?.adapter?.coverage
    ??imported?.metadata?.adapterCoverage
    ??imported?.nativeSource?.adapter?.coverage
    ??nativeAst?.metadata?.adapterCoverage;
  const observed=coverage?.observed;
  const effective=coverage?.capabilityEvidence?.effective;
  const diagnostics=[
    ...(imported?.diagnostics??[]),
    ...(imported?.nativeSource?.diagnostics??[])
  ];
  const parserDiagnosticLosses=(losses??[]).filter((loss)=>
    loss?.kind==='parserDiagnostic'
    || loss?.phase==='parse'&&loss?.severity==='error'
    || loss?.metadata?.parserDiagnostic===true
  );
  const parser=source?.parser
    ??imported?.adapter?.parser
    ??coverage?.parser
    ??nativeAst?.parser
    ??imported?.metadata?.parser
    ??imported?.nativeSource?.parser;
  return {
    parser,
    astFormat:imported?.metadata?.astFormat??nativeAst?.metadata?.astFormat,
    exactness:coverage?.exactness??effective?.exactness??observed?.exactness,
    semanticCoverageLevel:coverage?.semanticCoverage?.level??effective?.semanticCoverage?.level??observed?.semanticCoverage?.level,
    exactAst:Boolean(coverage?.exactAst??effective?.exactAst??observed?.exactAst),
    tokens:Boolean(coverage?.tokens??effective?.tokens??observed?.tokens),
    trivia:Boolean(coverage?.trivia??effective?.trivia??observed?.trivia),
    diagnostics:Boolean(coverage?.diagnostics??effective?.diagnostics)||(diagnostics.length+parserDiagnosticLosses.length)>0,
    diagnosticCount:diagnostics.length+parserDiagnosticLosses.length+(observed?.parserDiagnostics??0),
    sourceRanges:Boolean(coverage?.sourceRanges??effective?.sourceRanges??observed?.sourceRanges),
    generatedRanges:Boolean(coverage?.generatedRanges??effective?.generatedRanges??observed?.generatedRanges),
    evidenceRecords:source?.evidenceCount??imported?.evidence?.length??0,
    missing:Boolean(
      imported?.metadata?.missingInjectedParser
      || nativeAst?.metadata?.missingInjectedParser
      || rootNode?.kind==='MissingInjectedParser'
      || rootNode?.metadata?.reason==='missing-injected-parser'
      || parserDiagnosticLosses.some((loss)=>loss?.metadata?.reason==='missing-injected-parser'||loss?.metadata?.missingInjectedParser)
    )
  };
}

export function compactAdmissionSource(imported,index){
  const semanticIndex=imported?.semanticIndex??imported?.universalAst?.semanticIndex;
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const sourceMaps=imported?.sourceMaps??imported?.universalAst?.sourceMaps??[];
  return {
    id:imported?.id??`import_${index+1}`,
    language:imported?.language??imported?.nativeSource?.language??nativeAst?.language,
    sourcePath:imported?.sourcePath??imported?.nativeSource?.sourcePath??nativeAst?.sourcePath,
    sourceHash:imported?.nativeSource?.sourceHash??nativeAst?.sourceHash,
    parser:nativeAst?.parser??imported?.nativeSource?.parser,
    sourceMapIds:sourceMaps.map((sourceMap)=>sourceMap.id).filter(Boolean),
    sourceMapMappings:sourceMaps.reduce((sum,sourceMap)=>sum+(sourceMap.mappings?.length??0),0),
    symbolCount:semanticIndex?.symbols?.length??0,
    lossCount:imported?.losses?.length??nativeAst?.losses?.length??0,
    evidenceCount:imported?.evidence?.length??0,
    readiness:imported?.metadata?.semanticMergeReadiness??imported?.mergeCandidates?.[0]?.readiness
  };
}

export function summarizeImportPreservation(imported,source){
  const nativeAst=imported?.nativeAst??imported?.nativeSource?.ast;
  const record=imported?.metadata?.sourcePreservation
    ??imported?.nativeSource?.metadata?.sourcePreservation
    ??nativeAst?.metadata?.sourcePreservation
    ??imported?.universalAst?.metadata?.sourcePreservation;
  const sourceHash=source?.sourceHash??imported?.nativeSource?.sourceHash??nativeAst?.sourceHash;
  const sourcePreservationLosses=(imported?.losses??nativeAst?.losses??[]).filter((loss)=>loss.kind==='sourcePreservation');
  const stale=imported?.metadata?.sourceHashVerified===false
    ||imported?.nativeSource?.metadata?.sourceHashVerified===false
    ||nativeAst?.metadata?.sourceHashVerified===false
    ||record?.metadata?.sourceHashVerified===false
    ||Boolean(record?.sourceHash&&sourceHash&&record.sourceHash!==sourceHash);
  const missing=!record;
  const truncated=record?.summary?.truncated===true;
  const exactSourceAvailable=record?.summary?.exactSourceAvailable===true;
  const quality=stale?'stale':missing?'missing':truncated||!exactSourceAvailable||sourcePreservationLosses.length?'lossy':'exact';
  return {quality,missing,stale,truncated,exactSourceAvailable,lossCount:sourcePreservationLosses.length,id:record?.id};
}

