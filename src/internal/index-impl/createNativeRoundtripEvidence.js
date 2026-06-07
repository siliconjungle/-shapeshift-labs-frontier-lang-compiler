import{validateUniversalAstEnvelope}from'@shapeshift-labs/frontier-lang-kernel';
import{countBy,idFragment,maxSemanticMergeReadiness,uniqueStrings}from'../../native-import-utils.js';
import{nativeImportEntries}from'./nativeImportEntries.js';import{nativeImportHasExactAstCoverage}from'./nativeImportHasExactAstCoverage.js';
const precisionRank=Object.freeze({exact:0,line:1,declaration:2,estimated:3,unknown:4,none:5});
export function createNativeRoundtripEvidence(importResult,options={}) {
  if(!importResult||typeof importResult!=='object') throw new Error('createNativeRoundtripEvidence requires a native import result');
  const projection=options.projection;
  const universalAst=importResult.universalAst;
  const universalIssues=universalAst?validateUniversalAstEnvelope(universalAst):['missing-universal-ast'];
  const universalSourceMaps=importResult.sourceMaps??universalAst?.sourceMaps??[];
  const outputSourceMaps=options.sourceMaps??options.targetProjection?.sourceMaps??[];
  const hasOutputSourceMaps=Object.prototype.hasOwnProperty.call(options,'sourceMaps')||Boolean(options.targetProjection);
  const importLosses=[...(importResult.losses??[]),...(importResult.imports??[]).flatMap((entry)=>entry?.losses??[])];
  const projectionLosses=projection?.losses??[];
  const targetLosses=options.targetProjection?.losses??[];
  const losses=options.losses??[...importLosses,...projectionLosses,...targetLosses];
  const lossSummary=summarizeLosses(losses);
  const importReadiness=readinessOf(importResult.readiness,importResult.metadata?.nativeImportLossSummary?.semanticMergeReadiness)??'needs-review';
  const projectionReadiness=readinessOf(projection?.readiness,projection?.lossSummary?.semanticMergeReadiness)??'needs-review';
  const targetReadiness=options.targetCoverage?.readiness??options.targetProjection?.readiness?.readiness;
  const resultReadiness=readinessOf(options.readiness);
  const semanticMerge=[importReadiness,projectionReadiness,targetReadiness,resultReadiness,lossSummary.blockingLossIds.length?'blocked':undefined]
    .filter(Boolean).reduce((current,next)=>maxSemanticMergeReadiness(current,next),'ready');
  const outputMode=options.outputMode??options.targetProjection?.outputMode??projection?.mode;
  const sourceHashVerified=Boolean(projection?.sourceHash&&projection?.outputHash===projection.sourceHash)||projection?.metadata?.sourceHashVerified===true;
  const status=semanticMerge==='blocked'?'blocked':outputMode==='target-adapter'?'target-adapter':projection?.mode==='native-source-stubs'||outputMode==='target-stubs'?'stub-only':sourceHashVerified?'preserved-source':'needs-review';
  const universalSourceMapEvidence=summarizeSourceMaps(universalSourceMaps);
  const sourceMapEvidence=summarizeSourceMaps(hasOutputSourceMaps?outputSourceMaps:universalSourceMaps);
  const sourceLanguage=projection?.language??importResult.language;
  const target=options.target??options.targetCoverage?.target??options.targetProjection?.target;
  const audit=createRoundtripAudit({
    status,
    semanticMerge,
    sourceLanguage,
    target,
    sameLanguage:Boolean(sourceLanguage&&target&&String(sourceLanguage)===String(target)),
    outputMode,
    projectionMode:projection?.mode,
    sourceHashVerified,
    hasOutputSourceMaps,
    sourceMapEvidence,
    universalSourceMapEvidence,
    targetProjection:options.targetProjection,
    targetCoverage:options.targetCoverage,
    lossSummary
  });
  const metadata={
    schema:'frontier.lang.nativeRoundtripEvidence',
    version:1,
    roundtripEvidence:{
      status,
      semanticMergeReadiness:semanticMerge,
      reviewRequired:semanticMerge!=='ready',
      sourcePath:projection?.sourcePath??importResult.sourcePath,
      language:sourceLanguage,
      target,
      audit,
      import:{
        id:importResult.id,
        readiness:importReadiness,
        exactAst:exactAst(importResult),
        lossCount:importLosses.length,
        evidenceIds:evidenceIds(importResult.evidence)
      },
      universalAst:{
        id:universalAst?.id,
        present:Boolean(universalAst),
        valid:universalIssues.length===0,
        issues:universalIssues,
        nativeSources:universalAst?.nativeSources?.length??importResult.nativeSources?.length??(importResult.nativeSource?1:0),
        semanticSymbols:(importResult.semanticIndex??universalAst?.semanticIndex)?.symbols?.length??0,
        sourceMaps:universalSourceMapEvidence
      },
      projection:{
        id:projection?.id,
        mode:projection?.mode,
        readiness:projectionReadiness,
        sourceHashVerified,
        outputHash:projection?.outputHash,
        declarationCount:projection?.declarations?.length??0,
        lossCount:projectionLosses.length,
        evidenceIds:evidenceIds(projection?.evidence)
      },
      output:{
        mode:outputMode,
        targetProjectionId:options.targetProjection?.id,
        targetProjectionAdapterId:options.targetProjection?.adapter?.id,
        targetCoverageLossClass:options.targetCoverage?.lossClass,
        targetReadiness:targetReadiness,
        targetSupported:options.targetCoverage?.supported,
        sourceMaps:sourceMapEvidence
      },
      losses:lossSummary
    }
  };
  return{
    id:options.id??`evidence_${idFragment(projection?.id??importResult.id??importResult.sourcePath)}_native_roundtrip`,
    kind:'import',
    status:semanticMerge==='blocked'?'failed':'passed',
    path:projection?.sourcePath??importResult.sourcePath,
    summary:`Recorded native roundtrip evidence for ${metadata.roundtripEvidence.language??'native'} as ${status}.`,
    metadata
  };
}
function exactAst(importResult){const imports=nativeImportEntries(importResult);return imports.length>0&&imports.every((entry)=>nativeImportHasExactAstCoverage(entry));}
function evidenceIds(evidence){return uniqueStrings((evidence??[]).map((record)=>record?.id));}
function readinessOf(classification,fallback){return classification?.readiness??fallback;}
function summarizeLosses(losses){
  const records=losses??[];
  return{
    total:records.length,
    bySeverity:countBy(records.map((loss)=>loss?.severity??'unknown')),
    byKind:countBy(records.map((loss)=>loss?.kind??'unknown')),
    blockingLossIds:uniqueStrings(records.filter((loss)=>loss?.severity==='error').map((loss)=>loss.id)),
    reviewLossIds:uniqueStrings(records.filter((loss)=>loss?.severity==='warning').map((loss)=>loss.id)),
    informationalLossIds:uniqueStrings(records.filter((loss)=>loss?.severity!=='error'&&loss?.severity!=='warning').map((loss)=>loss.id))
  };
}
function summarizeSourceMaps(sourceMaps){
  const maps=sourceMaps??[];
  const mappings=maps.flatMap((sourceMap)=>sourceMap?.mappings??[]);
  const precisions=mappings.map((mapping)=>normalizePrecision(mapping?.precision));
  return{
    total:maps.length,
    ids:uniqueStrings(maps.map((sourceMap)=>sourceMap?.id)),
    mappings:mappings.length,
    precision:worstPrecision(precisions),
    byPrecision:countBy(precisions),
    byOrigin:countBy(mappings.map((mapping)=>mapping?.metadata?.sourceMapOrigin??'native-import')),
    withSourceSpan:mappings.filter((mapping)=>mapping?.sourceSpan).length,
    withGeneratedSpan:mappings.filter((mapping)=>mapping?.generatedSpan).length,
    withSemanticSymbol:mappings.filter((mapping)=>mapping?.semanticSymbolId||mapping?.semanticNodeId).length,
    targetPaths:uniqueStrings(maps.map((sourceMap)=>sourceMap?.targetPath).concat(mappings.map((mapping)=>mapping?.generatedSpan?.targetPath)))
  };
}
function normalizePrecision(value){const precision=String(value??'unknown');return Object.prototype.hasOwnProperty.call(precisionRank,precision)?precision:'unknown';}
function worstPrecision(precisions){if(!precisions.length)return'none';return precisions.reduce((worst,next)=>precisionRank[next]>precisionRank[worst]?next:worst,'exact');}
function createRoundtripAudit(input){
  const disposition=roundtripAuditDisposition(input);
  return{
    schema:'frontier.lang.nativeRoundtripAuditSignal',
    version:1,
    disposition,
    claim:roundtripAuditClaim(disposition),
    sourceLanguage:input.sourceLanguage,
    target:input.target,
    sameLanguage:input.sameLanguage,
    outputMode:input.outputMode,
    projectionMode:input.projectionMode,
    sourceHashVerified:input.sourceHashVerified,
    outputSourceMapPrecision:input.sourceMapEvidence.precision,
    universalSourceMapPrecision:input.universalSourceMapEvidence.precision,
    targetProjectionAdapterId:input.targetProjection?.adapter?.id,
    targetCoverageLossClass:input.targetCoverage?.lossClass,
    reviewRequired:input.semanticMerge!=='ready',
    semanticMergeReadiness:input.semanticMerge,
    semanticEquivalenceClaim:false,
    autoMergeClaim:false,
    blockingLossCount:input.lossSummary.blockingLossIds.length,
    reviewLossCount:input.lossSummary.reviewLossIds.length,
    reasonCodes:uniqueStrings([
      `status:${input.status}`,
      `semantic:${input.semanticMerge}`,
      `output:${input.outputMode??'unknown'}`,
      `projection:${input.projectionMode??'unknown'}`,
      input.sourceHashVerified?'source-hash:verified':'source-hash:unverified',
      `output-source-map:${input.sourceMapEvidence.precision}`,
      `universal-source-map:${input.universalSourceMapEvidence.precision}`,
      input.targetCoverage?.lossClass?`target-loss:${input.targetCoverage.lossClass}`:undefined,
      input.targetProjection?.adapter?.id?`target-adapter:${input.targetProjection.adapter.id}`:undefined,
      input.lossSummary.blockingLossIds.length?'losses:blocking':undefined,
      input.lossSummary.reviewLossIds.length?'losses:review':undefined
    ])
  };
}
function roundtripAuditDisposition(input){
  if(input.outputMode==='target-adapter')return'adapter-projected';
  if(input.projectionMode==='native-source-stubs'||input.outputMode==='target-stubs')return'stub-only';
  if(input.sourceHashVerified&&input.outputMode==='preserved-source'&&input.hasOutputSourceMaps&&input.sourceMapEvidence.precision==='exact')return'reversible';
  if(input.sourceHashVerified||input.projectionMode==='preserved-source')return'preserved-source';
  return'review-required';
}
function roundtripAuditClaim(disposition){
  if(disposition==='reversible')return'source-text-reversible';
  if(disposition==='preserved-source')return'source-preserved';
  if(disposition==='stub-only')return'declaration-stubs-only';
  if(disposition==='adapter-projected')return'host-adapter-projected';
  return'review-required';
}
