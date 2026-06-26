import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const admittedProject = safeMergeJsTsProject({
  id: 'oracle_source_text_merge_candidate_admitted',
  language: 'typescript',
  baseFiles: {},
  workerFiles: { 'src/a.ts': 'export const a = 1;\n' },
  headFiles: {}
});
const admittedSurface = admittedProject.confidence.admissionMatrixAudit.surfaces.find(sourceTextSurface);
const admittedEvidence = admittedProject.evidence.find(sourceTextEvidence);
assert.equal(admittedProject.status, 'merged');
assert.equal(admittedProject.summary.sourceTextMergeCandidateStatus, 'passed');
assert.equal(admittedProject.summary.sourceTextMergeCandidateFiles, 1);
assert.equal(admittedProject.summary.sourceTextMergeDisposition, 'passed-candidate');
assert.equal(admittedProject.summary.sourceTextMergeAdmissionBoundary, 'mechanical-candidate-needs-semantic-review');
assert.equal(admittedProject.summary.confidenceDimensions.sourceText, 'passed');
assert.equal(admittedEvidence.status, 'passed');
assert.equal(admittedEvidence.metadata.sourceTextMergeDisposition, 'passed-candidate');
assert.equal(admittedEvidence.metadata.sourceTextMergeAdmissionBoundary, 'mechanical-candidate-needs-semantic-review');
assert.equal(admittedEvidence.metadata.sourceTextMergeFileStatusCounts.merged, 1);
assert.equal(admittedEvidence.metadata.autoMergeClaim, false);
assert.equal(admittedEvidence.metadata.semanticEquivalenceClaim, false);
assert.equal(admittedSurface.status, 'baseline');
assert.equal(admittedSurface.proofStatuses['source-text-merge-candidate'], 'passed');

const blockedProject = safeMergeJsTsProject({
  id: 'oracle_source_text_merge_candidate_blocked',
  language: 'typescript',
  baseFiles: { 'src/value.ts': 'export const value = 1;\n' },
  workerFiles: { 'src/value.ts': 'export const value = 2;\n' },
  headFiles: { 'src/value.ts': 'export const value = 3;\n' }
});
const blockedSurface = blockedProject.confidence.admissionMatrixAudit.surfaces.find(sourceTextSurface);
const blockedEvidence = blockedProject.evidence.find(sourceTextEvidence);
assert.equal(blockedProject.status, 'blocked');
assert.equal(blockedProject.summary.sourceTextMergeCandidateStatus, 'failed');
assert.equal(blockedProject.summary.sourceTextMergeBlockedFiles, 1);
assert.equal(blockedProject.summary.sourceTextMergeDisposition, 'blocked-overlap');
assert.equal(blockedProject.summary.sourceTextMergeAdmissionBoundary, 'blocked-overlap-before-semantic-review');
assert.equal(blockedProject.summary.confidenceDimensions.sourceText, 'failed');
assert.equal(blockedEvidence.status, 'failed');
assert.equal(blockedEvidence.metadata.sourceTextMergeDisposition, 'blocked-overlap');
assert.equal(blockedEvidence.metadata.sourceTextMergeAdmissionBoundary, 'blocked-overlap-before-semantic-review');
assert.equal(blockedEvidence.metadata.sourceTextMergeFileStatusCounts.blocked, 1);
assert.equal(blockedEvidence.metadata.autoMergeClaim, false);
assert.equal(blockedEvidence.metadata.semanticEquivalenceClaim, false);
assert.equal(blockedSurface.proofStatuses['source-text-merge-candidate'], 'failed');

const absentProject = safeMergeJsTsProject({
  id: 'oracle_source_text_merge_candidate_absent',
  language: 'typescript',
  baseFiles: {},
  workerFiles: {},
  headFiles: {}
});
const absentSurface = absentProject.confidence.admissionMatrixAudit.surfaces.find(sourceTextSurface);
const absentEvidence = absentProject.evidence.find(sourceTextEvidence);
assert.equal(absentProject.summary.files, 0);
assert.equal(absentProject.summary.sourceTextMergeCandidateStatus, 'absent');
assert.equal(absentProject.summary.sourceTextMergeCandidateFiles, 0);
assert.equal(absentProject.summary.sourceTextMergeDisposition, 'absent-source-files');
assert.equal(absentProject.summary.sourceTextMergeAdmissionBoundary, 'absent-source-files-no-candidate');
assert.equal(absentProject.summary.confidenceDimensions.sourceText, 'absent');
assert.equal(absentEvidence.status, 'skipped');
assert.equal(absentEvidence.metadata.sourceTextMergeDisposition, 'absent-source-files');
assert.equal(absentEvidence.metadata.sourceTextMergeAdmissionBoundary, 'absent-source-files-no-candidate');
assert.equal(absentEvidence.metadata.autoMergeClaim, false);
assert.equal(absentEvidence.metadata.semanticEquivalenceClaim, false);
assert.equal(absentSurface.proofStatuses['source-text-merge-candidate'], 'absent');

function sourceTextSurface(surface) {
  return surface.surface === 'source-text-merge-candidate';
}

function sourceTextEvidence(record) {
  return record.level === 'source-text-merge-candidate';
}
