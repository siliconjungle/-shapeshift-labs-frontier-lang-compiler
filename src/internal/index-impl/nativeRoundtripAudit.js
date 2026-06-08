import{countBy,uniqueStrings}from'../../native-import-utils.js';

const precisionRank=Object.freeze({exact:0,line:1,declaration:2,estimated:3,unknown:4,none:5});

export function createRoundtripAudit(input){
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
    targetCoverageLossClass:selectedTargetCoverageLossClass(input),
    reviewRequired:input.semanticMerge!=='ready',
    semanticMergeReadiness:input.semanticMerge,
    semanticEquivalenceClaim:false,
    autoMergeClaim:false,
    paths:roundtripAuditPaths(input,disposition),
    sourcePreservation:input.sourcePreservation,
    generatedStubs:summarizeGeneratedStubs(input,disposition),
    adapterProjection:summarizeAdapterProjection(input,disposition),
    sourceMaps:summarizeRouteSourceMaps(input),
    hashChecks:input.hashChecks,
    commentsTrivia:summarizeCommentsTrivia(input.sourcePreservation),
    targetCoverage:summarizeTargetCoverage(input),
    semanticEquivalence:summarizeSemanticEquivalence(),
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
      selectedTargetCoverageLossClass(input)?`target-loss:${selectedTargetCoverageLossClass(input)}`:undefined,
      matrixTargetCoverageLossClass(input)?`target-matrix-loss:${matrixTargetCoverageLossClass(input)}`:undefined,
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
function roundtripAuditPaths(input,disposition){
  const reversibleAvailable=input.sourceHashVerified&&input.outputMode==='preserved-source'&&input.hasOutputSourceMaps&&input.sourceMapEvidence.precision==='exact';
  const preservedAvailable=input.sourceHashVerified||input.projectionMode==='preserved-source';
  const stubAvailable=input.projectionMode==='native-source-stubs'||input.outputMode==='target-stubs';
  const adapterAvailable=input.outputMode==='target-adapter'||Boolean(input.targetProjection?.adapter?.id);
  return{
    reversible:routePathSignal(disposition==='reversible',reversibleAvailable,[
      input.sourceHashVerified?'source-hash:verified':'source-hash:unverified',
      input.hasOutputSourceMaps?'output-source-map:present':'output-source-map:missing',
      `output-source-map:${input.sourceMapEvidence.precision}`
    ]),
    preservedSource:routePathSignal(disposition==='preserved-source',preservedAvailable,[
      `projection:${input.projectionMode??'unknown'}`,
      input.sourceHashVerified?'source-hash:verified':'source-hash:unverified'
    ]),
    stubOnly:routePathSignal(disposition==='stub-only',stubAvailable,[
      `projection:${input.projectionMode??'unknown'}`,
      `output:${input.outputMode??'unknown'}`
    ]),
    adapterProjected:routePathSignal(disposition==='adapter-projected',adapterAvailable,[
      `output:${input.outputMode??'unknown'}`,
      input.targetProjection?.adapter?.id?`target-adapter:${input.targetProjection.adapter.id}`:undefined
    ])
  };
}
function routePathSignal(selected,available,reasonCodes){
  return{
    selected,
    available,
    reasonCodes:uniqueStrings([
      selected?'path:selected':undefined,
      available?'path:available':'path:not-available',
      ...reasonCodes
    ])
  };
}
function summarizeGeneratedStubs(input,disposition){
  const declarations=input.targetProjection?[]:input.projection?.declarations??[];
  const projectionDeclarations=input.projection?.declarations??[];
  return{
    available:input.projectionMode==='native-source-stubs'||input.outputMode==='target-stubs'||projectionDeclarations.length>0,
    selected:disposition==='stub-only',
    projectionMode:input.projectionMode,
    outputMode:input.outputMode,
    declarationCount:projectionDeclarations.length,
    emittedDeclarationCount:declarations.length,
    declarationKinds:countBy(projectionDeclarations.map((declaration)=>declaration?.kind??'unknown')),
    declarationsWithSourceSpan:projectionDeclarations.filter((declaration)=>declaration?.sourceSpan).length,
    symbolIds:uniqueStrings(projectionDeclarations.map((declaration)=>declaration?.symbolId)),
    nativeAstNodeIds:uniqueStrings(projectionDeclarations.map((declaration)=>declaration?.nativeAstNodeId)),
    lossCount:input.projection?.losses?.length??0
  };
}
function summarizeAdapterProjection(input,disposition){
  const targetProjection=input.targetProjection;
  return{
    available:Boolean(targetProjection),
    selected:disposition==='adapter-projected',
    id:targetProjection?.id,
    adapterId:targetProjection?.adapter?.id,
    adapterVersion:targetProjection?.adapter?.version,
    outputMode:targetProjection?.outputMode,
    readiness:targetProjection?.readiness?.readiness,
    lossCount:targetProjection?.losses?.length??0,
    evidenceIds:evidenceIds(targetProjection?.evidence),
    sourceMaps:summarizeSourceMaps(targetProjection?.sourceMaps??[])
  };
}
function summarizeRouteSourceMaps(input){
  return{
    hasOutputSourceMaps:input.hasOutputSourceMaps,
    output:input.sourceMapEvidence,
    universal:input.universalSourceMapEvidence,
    outputExact:input.sourceMapEvidence.precision==='exact',
    outputEstimated:input.sourceMapEvidence.precision==='estimated'||numeric(input.sourceMapEvidence.byPrecision?.estimated)>0,
    universalEstimated:input.universalSourceMapEvidence.precision==='estimated'||numeric(input.universalSourceMapEvidence.byPrecision?.estimated)>0
  };
}
function summarizeCommentsTrivia(sourcePreservation){
  return{
    comments:sourcePreservation.comments,
    trivia:sourcePreservation.trivia,
    directives:sourcePreservation.directives,
    tokens:sourcePreservation.tokens,
    whitespace:sourcePreservation.whitespace,
    truncated:sourcePreservation.truncated,
    exactSourceAvailable:sourcePreservation.exactSourceAvailable,
    sourceTextAvailable:sourcePreservation.sourceTextAvailable
  };
}
function summarizeTargetCoverage(input){
  const coverage=input.targetCoverage;
  const lossClass=selectedTargetCoverageLossClass(input);
  return{
    target:input.target??coverage?.target??input.targetProjection?.target,
    supported:adapterProjectionSelected(input)?true:coverage?.supported,
    readiness:coverage?.readiness??input.targetProjection?.readiness?.readiness,
    lossClass,
    adapterId:coverage?.adapter??input.targetProjection?.adapter?.id,
    adapterKind:adapterProjectionSelected(input)?'targetProjection':coverage?.adapterKind,
    adapterVersion:coverage?.adapterVersion??input.targetProjection?.adapter?.version,
    lossKinds:uniqueStrings(coverage?.lossKinds),
    categories:uniqueStrings(coverage?.categories),
    reason:coverage?.reason,
    notes:uniqueStrings(coverage?.notes)
  };
}
function selectedTargetCoverageLossClass(input){
  const projectedLossClass=input.targetProjection?.coverage?.lossClass
    ??input.targetProjection?.metadata?.targetProjectionCoverage?.lossClass
    ??input.targetProjection?.metadata?.lossClass;
  if(projectedLossClass)return projectedLossClass;
  if(adapterProjectionSelected(input))return'targetAdapterProjection';
  return input.targetCoverage?.lossClass;
}
function matrixTargetCoverageLossClass(input){
  const selected=selectedTargetCoverageLossClass(input);
  const matrix=input.targetCoverage?.lossClass;
  return matrix&&matrix!==selected?matrix:undefined;
}
function adapterProjectionSelected(input){
  return input.outputMode==='target-adapter'||Boolean(input.targetProjection?.adapter?.id);
}
function summarizeSemanticEquivalence(){
  return{
    claimed:false,
    evidenceIds:[],
    reasonCode:'proof-adapter:not-provided'
  };
}
function evidenceIds(evidence){return uniqueStrings((evidence??[]).map((record)=>record?.id));}
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
function numeric(value,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback;}
