function projectProofEvidenceConflicts(proofEvidence) {
  return (proofEvidence?.records ?? [])
    .filter((record) => record?.status === 'failed' && record.level === 'source-span-roundtrip' && Number(record.metadata?.admissionBlockingFailedSourceResults ?? 0) > 0)
    .map(sourceSpanRoundtripProofConflict);
}

function sourceSpanRoundtripProofConflict(record) {
  return {
    code: 'project-source-span-roundtrip-proof-failed',
    gateId: 'project-proof-evidence',
    message: 'Project source-span roundtrip proof failed; output source admission requires review.',
    sourcePath: record.metadata?.sourcePath,
    severity: 'error',
    details: compactRecord({
      reasonCode: 'project-source-span-roundtrip-proof-failed',
      conflictKey: `project-proof#${record.level}`,
      proofLevel: record.level,
      evidenceId: record.id,
      scope: record.scope,
      status: record.status,
      summary: record.summary,
      outputFiles: record.metadata?.outputFiles,
      changedOutputFiles: record.metadata?.changedOutputFiles,
      changedSourceResults: record.metadata?.changedSourceResults,
      failedSourceResults: record.metadata?.failedSourceResults,
      admissionBlockingFailedSourceResults: record.metadata?.admissionBlockingFailedSourceResults,
      sourceSpanRoundtripAdmissionBlockerSourcePaths: record.metadata?.sourceSpanRoundtripAdmissionBlockerSourcePaths,
      missingSourceResults: record.metadata?.missingSourceResults,
      missingRequiredSourceResults: record.metadata?.missingRequiredSourceResults,
      sourceSpanOperations: record.metadata?.sourceSpanOperations,
      projectionEdits: record.metadata?.projectionEdits,
      spanLinkedProjectionEdits: record.metadata?.spanLinkedProjectionEdits,
      parserTriviaExactnessStatus: record.metadata?.parserTriviaExactnessStatus,
      parserTriviaExactnessReasonCodes: record.metadata?.parserTriviaExactnessReasonCodes,
      parserTriviaExactnessBlockReasonCodes: record.metadata?.parserTriviaExactnessBlockReasonCodes,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }

export { projectProofEvidenceConflicts };
