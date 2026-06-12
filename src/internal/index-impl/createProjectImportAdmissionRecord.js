import{maxSemanticMergeReadiness,uniqueRecordsById,uniqueStrings}from'../../native-import-utils.js';
import{nativeImportEntries}from'./nativeImportEntries.js';
import{admissionPriority,admissionPriorityReasons,admissionRejectionReasons}from'./projectImportAdmissionDecision.js';
import{admissionMergeScore}from'./projectImportAdmissionMergeScore.js';
import{
  admissionLanguages,
  admissionMergeCandidates,
  admissionOwnership,
  admissionSemanticEvidence,
  admissionSourcePreservation,
  projectAdmissionImports
}from'./projectImportAdmissionSummaries.js';

export function createProjectImportAdmissionRecord(projectResult,options={}){
  const imports=nativeImportEntries(projectResult);
  const contract=options.importResultContract??projectResult?.metadata?.importResultContract;
  const lossSummary=options.lossSummary??contract?.lossSummary??projectResult?.metadata?.nativeImportLossSummary;
  const mergeCandidates=uniqueRecordsById([
    ...(projectResult?.mergeCandidates??[]),
    ...imports.flatMap((imported)=>imported?.mergeCandidates??[])
  ]);
  const importSummaries=projectAdmissionImports(imports,contract?.sources??[],mergeCandidates,projectResult);
  const languages=admissionLanguages(importSummaries);
  const semanticEvidence=admissionSemanticEvidence(projectResult,imports,importSummaries);
  const sourceStaleness=admissionSourceStaleness(imports,importSummaries,contract);
  const sourcePreservation=admissionSourcePreservationWithStaleness(admissionSourcePreservation(importSummaries,contract),sourceStaleness);
  const ownership=admissionOwnership(contract,mergeCandidates);
  const mergeCandidateRisk=admissionMergeCandidates(projectResult,imports,mergeCandidates,lossSummary);
  const readiness=maxSemanticMergeReadiness(
    contract?.readiness?.semanticMergeReadiness??lossSummary?.semanticMergeReadiness??projectResult?.metadata?.semanticMergeReadiness??'ready',
    mergeCandidateRisk.readiness
  );
  const failedEvidenceIds=uniqueStrings([
    ...(contract?.readiness?.failedEvidenceIds??[]),
    ...(lossSummary?.failedEvidenceIds??[]),
    ...(projectResult?.evidence??[]).filter((record)=>record?.status==='failed').map((record)=>record.id)
  ].filter(Boolean));
  const rejectionReasons=admissionRejectionReasons({
    readiness,
    semanticEvidence,
    sourcePreservation,
    failedEvidenceIds,
    blockingLossIds:contract?.readiness?.blockingLossIds??lossSummary?.blockingLossIds??[]
  });
  const priorityReasons=uniqueStrings([
    ...admissionPriorityReasons({readiness,semanticEvidence,sourcePreservation,ownership,mergeCandidateRisk}),
    ...semanticAdmissionWarningReasons(semanticEvidence)
  ]);
  const action=rejectionReasons.length?'reject':priorityReasons.length?'prioritize':'admit';
  const priority=admissionPriority(action,readiness,sourcePreservation,mergeCandidateRisk);
  const mergeScore=admissionMergeScore({
    projectResult,
    imports,
    contract,
    lossSummary,
    action,
    priority,
    readiness,
    sourceCount:imports.length,
    semanticEvidence,
    sourceStaleness,
    sourcePreservation,
    ownership,
    mergeCandidateRisk,
    failedEvidenceIds
  });
  return {
    kind:'frontier.lang.projectImportAdmission',
    version:1,
    projectImportId:projectResult?.id,
    language:projectResult?.language??(languages.rows.length===1?languages.rows[0].language:'mixed'),
    projectRoot:projectResult?.projectRoot,
    action,
    priority,
    readiness,
    sourceCount:imports.length,
    languages,
    semanticEvidence,
    sourceStaleness,
    sourcePreservation,
    ownership,
    mergeCandidates:mergeCandidateRisk,
    mergeScore,
    reasons:uniqueStrings([
      ...rejectionReasons,
      ...priorityReasons,
      ...(contract?.readiness?.reasons??[]),
      ...(lossSummary?.readinessReasons??[])
    ]),
    metadata:{
      importResultContractId:contract?.importResultId,
      nativeImportLossSummaryReadiness:lossSummary?.semanticMergeReadiness,
      compact:true,
      note:'Project import admission compacts language readiness, semantic evidence, source preservation, ownership regions, merge-candidate risk, and a sortable merge score for coordinator queue decisions.'
    }
  };
}

function admissionSourceStaleness(imports,importSummaries,contract){
  const total=Math.max(imports.length,importSummaries.length,contract?.sources?.length??0);
  const records=[];
  for(let index=0;index<total;index+=1){
    const record=sourceStalenessRecord(imports[index],importSummaries[index],contract?.sources?.[index]);
    if(record.reasonCodes.length) records.push(record);
  }
  const staleRecords=records.filter((record)=>record.staleByContentHash||record.staleByBaseHash);
  const contentHashRecords=records.filter((record)=>record.staleByContentHash);
  const baseHashRecords=records.filter((record)=>record.staleByBaseHash);
  const dirtyWorkspaceRecords=records.filter((record)=>record.dirtyWorkspace);
  const unverifiedRecords=records.filter((record)=>record.unverifiedSourceHash);
  return {
    total,
    stale:staleRecords.length,
    contentHashStale:contentHashRecords.length,
    baseHashStale:baseHashRecords.length,
    dirtyWorkspace:dirtyWorkspaceRecords.length,
    unverified:unverifiedRecords.length,
    staleSourcePaths:sourcePaths(staleRecords),
    contentHashStaleSourcePaths:sourcePaths(contentHashRecords),
    baseHashStaleSourcePaths:sourcePaths(baseHashRecords),
    dirtyWorkspaceSourcePaths:sourcePaths(dirtyWorkspaceRecords),
    unverifiedSourcePaths:sourcePaths(unverifiedRecords),
    records
  };
}

function sourceStalenessRecord(imported,summary,source){
  const nativeSource=imported?.nativeSource;
  const nativeAst=imported?.nativeAst??nativeSource?.ast;
  const preservation=imported?.metadata?.sourcePreservation
    ??nativeSource?.metadata?.sourcePreservation
    ??nativeAst?.metadata?.sourcePreservation
    ??imported?.universalAst?.metadata?.sourcePreservation;
  const metadata=[
    imported?.metadata,
    nativeSource?.metadata,
    nativeAst?.metadata,
    preservation?.metadata,
    imported?.universalAst?.metadata,
    imported?.patch?.metadata
  ].filter((entry)=>entry&&typeof entry==='object');
  const lossReasons=(imported?.losses??nativeAst?.losses??[]).flatMap((loss)=>[
    loss?.reason,
    loss?.metadata?.reason,
    ...(Array.isArray(loss?.reasonCodes)?loss.reasonCodes:[]),
    ...(Array.isArray(loss?.metadata?.reasonCodes)?loss.metadata.reasonCodes:[])
  ]);
  const observedReasonCodes=uniqueStrings([
    ...metadata.flatMap((entry)=>[
      entry.reason,
      ...(Array.isArray(entry.reasonCodes)?entry.reasonCodes:[]),
      ...(Array.isArray(entry.reasons)?entry.reasons:[])
    ]),
    ...lossReasons
  ]);
  const sourcePath=firstString(summary?.sourcePath,source?.sourcePath,imported?.sourcePath,nativeSource?.sourcePath,nativeAst?.sourcePath,preservation?.sourcePath);
  const sourceHash=firstString(summary?.sourceHash,source?.sourceHash,imported?.sourceHash,nativeSource?.sourceHash,nativeAst?.sourceHash,preservation?.sourceHash);
  const declaredSourceHash=firstMetadataString(metadata,'declaredSourceHash');
  const contentHash=firstMetadataString(metadata,'currentContentHash','actualContentHash','contentHash')??sourceHash;
  const declaredContentHash=firstMetadataString(metadata,'declaredContentHash','expectedContentHash','expectedSourceHash')??declaredSourceHash;
  const sourceHashMismatch=Boolean(declaredSourceHash&&sourceHash&&declaredSourceHash!==sourceHash);
  const contentHashMismatch=Boolean(declaredContentHash&&contentHash&&declaredContentHash!==contentHash);
  const preservationHashMismatch=Boolean(preservation?.sourceHash&&sourceHash&&preservation.sourceHash!==sourceHash);
  const sourceHashVerifiedFalse=metadata.some((entry)=>entry.sourceHashVerified===false);
  const staleByContentHash=sourceHashMismatch
    ||contentHashMismatch
    ||preservationHashMismatch
    ||(sourceHashVerifiedFalse&&Boolean(declaredSourceHash||declaredContentHash));
  const baseHash=firstString(imported?.baseHash,imported?.patch?.baseHash,firstMetadataString(metadata,'baseHash'));
  const expectedBaseHash=firstMetadataString(metadata,'expectedBaseHash','declaredBaseHash','sourceBaseHash');
  const currentBaseHash=firstMetadataString(metadata,'currentBaseHash','actualBaseHash','headBaseHash','workspaceBaseHash');
  const staleByBaseHash=Boolean(
    expectedBaseHash&&currentBaseHash&&expectedBaseHash!==currentBaseHash
  )||metadata.some((entry)=>entry.baseHashVerified===false)||observedReasonCodes.includes('base-hash-mismatch');
  const dirtyWorkspace=metadata.some((entry)=>
    entry.dirtyWorkspace===true
    ||entry.workspaceDirty===true
    ||entry.worktreeDirty===true
    ||entry.dirtyWorktree===true
  )||observedReasonCodes.some((reason)=>reason==='dirty-workspace'||reason==='workspace-dirty'||reason==='dirty-worktree');
  const unverifiedSourceHash=sourceHashVerifiedFalse&&!staleByContentHash;
  const reasonCodes=uniqueStrings([
    ...(sourceHashMismatch?['source-hash-mismatch']:[]),
    ...(contentHashMismatch?['content-hash-mismatch']:[]),
    ...(preservationHashMismatch?['source-preservation-hash-mismatch']:[]),
    ...(staleByContentHash&&sourceHashVerifiedFalse?['source-hash-unverified']:[]),
    ...(staleByBaseHash?['base-hash-mismatch']:[]),
    ...(dirtyWorkspace?['dirty-workspace']:[]),
    ...(unverifiedSourceHash?['source-hash-unverified']:[])
  ]);
  return {
    ...(sourcePath?{sourcePath}:{}),
    ...(sourceHash?{sourceHash}:{}),
    ...(declaredSourceHash?{declaredSourceHash}:{}),
    ...(contentHash?{contentHash}:{}),
    ...(declaredContentHash?{declaredContentHash}:{}),
    ...(baseHash?{baseHash}:{}),
    ...(expectedBaseHash?{expectedBaseHash}:{}),
    ...(currentBaseHash?{currentBaseHash}:{}),
    staleByContentHash,
    staleByBaseHash,
    dirtyWorkspace,
    unverifiedSourceHash,
    reasonCodes
  };
}

function admissionSourcePreservationWithStaleness(sourcePreservation,sourceStaleness){
  const stale=sourceStaleness.stale;
  const quality=stale>0?'stale':sourcePreservation.quality==='stale'
    ? sourcePreservation.missing>0?'missing':sourcePreservation.lossy>0||sourcePreservation.truncated?'lossy':sourcePreservation.total===0?'empty':'exact'
    : sourcePreservation.quality;
  return {
    ...sourcePreservation,
    quality,
    stale,
    staleSourcePaths:sourceStaleness.staleSourcePaths,
    contentHashStale:sourceStaleness.contentHashStale,
    baseHashStale:sourceStaleness.baseHashStale,
    dirtyWorkspace:sourceStaleness.dirtyWorkspace,
    contentHashStaleSourcePaths:sourceStaleness.contentHashStaleSourcePaths,
    baseHashStaleSourcePaths:sourceStaleness.baseHashStaleSourcePaths,
    dirtyWorkspaceSourcePaths:sourceStaleness.dirtyWorkspaceSourcePaths
  };
}

function semanticAdmissionWarningReasons(semanticEvidence){
  return (semanticEvidence?.warnings??[]).map((warning)=>{
    const reasonCode=warning.reasonCode??warning.code;
    const sourcePaths=warning.sourcePaths?.length?warning.sourcePaths:warning.sourcePath?[warning.sourcePath]:[];
    const sourceText=sourcePaths.length?` for ${sourcePaths.join(', ')}`:'';
    return `Project import semantic admission warning ${reasonCode}${sourceText}.`;
  });
}

function sourcePaths(records){
  return uniqueStrings(records.map((record)=>record.sourcePath).filter(Boolean));
}

function firstMetadataString(metadata,...keys){
  for(const key of keys){
    const value=firstString(...metadata.map((entry)=>entry?.[key]));
    if(value) return value;
  }
  return undefined;
}

function firstString(...values){
  for(const value of values){
    if(value!==undefined&&value!==null&&String(value)) return String(value);
  }
  return undefined;
}
