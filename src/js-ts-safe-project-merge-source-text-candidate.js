function sourceTextMergeSummary(files = []) {
  const mergedFiles = files.filter((file) => file.status === 'merged');
  const blockedFiles = files.filter((file) => file.status === 'blocked');
  const outputFiles = files.filter((file) => typeof file.outputSourceText === 'string');
  return {
    mergedFiles: mergedFiles.length,
    blockedFiles: blockedFiles.length,
    outputFiles: outputFiles.length,
    sourceTextMergeCandidateFiles: mergedFiles.length,
    sourceTextMergeBlockedFiles: blockedFiles.length,
    sourceTextMergeOutputFiles: outputFiles.length,
    sourceTextMergeCandidateStatus: files.length ? (blockedFiles.length ? 'failed' : 'passed') : 'absent'
  };
}

function sourceTextMergeCandidateEvidenceRecord(id, summary) {
  const passed = summary.sourceTextMergeCandidateStatus === 'passed';
  const failed = summary.sourceTextMergeCandidateStatus === 'failed';
  return {
    id: `${id}_source_text_merge_candidate`,
    kind: 'js-ts-source-text-merge-candidate',
    level: 'source-text-merge-candidate',
    status: passed ? 'passed' : failed ? 'failed' : 'skipped',
    scope: 'source-files',
    summary: sourceTextMergeCandidateEvidenceSummary(summary, passed, failed),
    metadata: compactRecord({
      files: summary.files,
      sourceTextMergeCandidateFiles: summary.sourceTextMergeCandidateFiles,
      sourceTextMergeBlockedFiles: summary.sourceTextMergeBlockedFiles,
      sourceTextMergeOutputFiles: summary.sourceTextMergeOutputFiles,
      outputFiles: summary.outputFiles,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function sourceTextMergeMissingEvidenceItem(summary, signal, missingEvidenceItem) {
  if (!summary.files || summary.sourceTextMergeCandidateFiles || summary.sourceTextMergeBlockedFiles) return undefined;
  return missingEvidenceItem({
    code: signal,
    scope: 'source-files',
    kind: 'source-text-merge-candidate',
    proofLevel: 'source-text-merge-candidate',
    action: 'review',
    summary: 'No concrete source text merge candidate was produced; run the conservative source merge substrate before semantic graph admission.',
    suggestedInput: { baseFiles: {}, workerFiles: {}, headFiles: {} }
  });
}

function sourceTextMergeMatrixProofStatus(level, summary) {
  if (level !== 'source-text-merge-candidate') return undefined;
  if (!summary.files) return 'absent';
  if (summary.sourceTextMergeBlockedFiles) return 'failed';
  return summary.sourceTextMergeCandidateFiles === summary.files ? 'passed' : 'missing';
}

function sourceTextMergeCandidateEvidenceSummary(summary, passed, failed) {
  if (passed) return `Produced concrete source merge candidates for ${summary.sourceTextMergeCandidateFiles} file(s).`;
  if (failed) return `Source merge candidate blocked for ${summary.sourceTextMergeBlockedFiles} file(s) before semantic admission.`;
  return 'No source files were available for source text merge candidate production.';
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export { sourceTextMergeCandidateEvidenceRecord, sourceTextMergeMatrixProofStatus, sourceTextMergeMissingEvidenceItem, sourceTextMergeSummary };
