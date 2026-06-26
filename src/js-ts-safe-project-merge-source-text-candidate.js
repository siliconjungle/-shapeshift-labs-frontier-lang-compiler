function sourceTextMergeSummary(files = []) {
  const mergedFiles = files.filter((file) => file.status === 'merged');
  const blockedFiles = files.filter((file) => file.status === 'blocked');
  const outputFiles = files.filter((file) => typeof file.outputSourceText === 'string');
  const sourceTextMergeDisposition = sourceTextMergeDispositionFor(files.length, mergedFiles.length, blockedFiles.length);
  return {
    mergedFiles: mergedFiles.length,
    blockedFiles: blockedFiles.length,
    outputFiles: outputFiles.length,
    sourceTextMergeCandidateFiles: mergedFiles.length,
    sourceTextMergeBlockedFiles: blockedFiles.length,
    sourceTextMergeOutputFiles: outputFiles.length,
    sourceTextMergeCandidateStatus: files.length ? (blockedFiles.length ? 'failed' : 'passed') : 'absent',
    sourceTextMergeDisposition,
    sourceTextMergeAdmissionBoundary: sourceTextMergeAdmissionBoundary(sourceTextMergeDisposition),
    sourceTextMergeFileStatusCounts: countFileStatuses(files)
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
      sourceTextMergeDisposition: summary.sourceTextMergeDisposition,
      sourceTextMergeAdmissionBoundary: summary.sourceTextMergeAdmissionBoundary,
      sourceTextMergeFileStatusCounts: summary.sourceTextMergeFileStatusCounts,
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
  if (passed) return `Produced concrete mechanical source merge candidates for ${summary.sourceTextMergeCandidateFiles} file(s); semantic review remains required for equivalence claims.`;
  if (failed) return `Source merge candidate blocked for ${summary.sourceTextMergeBlockedFiles} overlapping file(s) before semantic admission.`;
  return 'No source files were available; no mechanical source merge candidate was produced.';
}

function sourceTextMergeDispositionFor(files, candidateFiles, blockedFiles) {
  if (!files) return 'absent-source-files';
  if (blockedFiles) return 'blocked-overlap';
  return candidateFiles === files ? 'passed-candidate' : 'incomplete-candidate';
}

function sourceTextMergeAdmissionBoundary(disposition) {
  if (disposition === 'passed-candidate') return 'mechanical-candidate-needs-semantic-review';
  if (disposition === 'blocked-overlap') return 'blocked-overlap-before-semantic-review';
  if (disposition === 'absent-source-files') return 'absent-source-files-no-candidate';
  return 'mechanical-candidate-incomplete';
}

function countFileStatuses(files) {
  const counts = {};
  for (const file of files) if (file?.status) counts[file.status] = (counts[file.status] ?? 0) + 1;
  return counts;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export { sourceTextMergeCandidateEvidenceRecord, sourceTextMergeMatrixProofStatus, sourceTextMergeMissingEvidenceItem, sourceTextMergeSummary };
