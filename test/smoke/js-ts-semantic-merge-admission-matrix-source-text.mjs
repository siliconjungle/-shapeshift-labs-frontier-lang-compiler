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
assert.equal(admittedProject.status, 'merged');
assert.equal(admittedProject.summary.sourceTextMergeCandidateStatus, 'passed');
assert.equal(admittedProject.summary.sourceTextMergeCandidateFiles, 1);
assert.equal(admittedProject.summary.confidenceDimensions.sourceText, 'passed');
assert.equal(admittedProject.evidence.find(sourceTextEvidence).status, 'passed');
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
assert.equal(blockedProject.status, 'blocked');
assert.equal(blockedProject.summary.sourceTextMergeCandidateStatus, 'failed');
assert.equal(blockedProject.summary.sourceTextMergeBlockedFiles, 1);
assert.equal(blockedProject.summary.confidenceDimensions.sourceText, 'failed');
assert.equal(blockedProject.evidence.find(sourceTextEvidence).status, 'failed');
assert.equal(blockedSurface.proofStatuses['source-text-merge-candidate'], 'failed');

function sourceTextSurface(surface) {
  return surface.surface === 'source-text-merge-candidate';
}

function sourceTextEvidence(record) {
  return record.level === 'source-text-merge-candidate';
}
