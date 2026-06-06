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
  const sourceMapEvidence=summarizeSourceMaps(hasOutputSourceMaps?outputSourceMaps:universalSourceMaps);
  const metadata={
    schema:'frontier.lang.nativeRoundtripEvidence',
    version:1,
    roundtripEvidence:{
      status,
      semanticMergeReadiness:semanticMerge,
      reviewRequired:semanticMerge!=='ready',
      sourcePath:projection?.sourcePath??importResult.sourcePath,
      language:projection?.language??importResult.language,
      target:options.target??options.targetCoverage?.target??options.targetProjection?.target,
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
        sourceMaps:summarizeSourceMaps(universalSourceMaps)
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
