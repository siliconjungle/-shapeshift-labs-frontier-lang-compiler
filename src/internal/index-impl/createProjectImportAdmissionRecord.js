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
  const importSummaries=projectAdmissionImports(imports,contract?.sources??[],mergeCandidates);
  const languages=admissionLanguages(importSummaries);
  const semanticEvidence=admissionSemanticEvidence(projectResult,imports,importSummaries);
  const sourcePreservation=admissionSourcePreservation(importSummaries,contract);
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
  const priorityReasons=admissionPriorityReasons({readiness,semanticEvidence,sourcePreservation,ownership,mergeCandidateRisk});
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
