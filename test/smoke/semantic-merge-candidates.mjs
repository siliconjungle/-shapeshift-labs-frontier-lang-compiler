import { assert } from './helpers.mjs';
import {
  createProjectImportAdmissionRecord,
  createSemanticMergeCandidateAdmissionRecord,
  diffNativeSources,
  querySemanticMergeCandidateAdmissionOverlaps,
  semanticMergeCandidateReadinessSortKey,
  SemanticMergeCandidateProjectionRisks,
  sortSemanticMergeCandidateAdmissionRecords
} from './compiler-api.mjs';

for (const risk of ['low', 'medium', 'high', 'unknown']) {
  assert.equal(SemanticMergeCandidateProjectionRisks.includes(risk), true);
}

const beforeSourceText = [
  'export function add(count) {',
  '  return count + 1;',
  '}',
  ''
].join('\n');
const afterSourceText = [
  'export function add(count, step) {',
  '  return count + step;',
  '}',
  ''
].join('\n');
const changeSet = diffNativeSources({
  id: 'semantic_merge_candidate_records',
  language: 'javascript',
  sourcePath: 'src/semantic-candidates.js',
  beforeSourceText,
  afterSourceText,
  evidenceId: 'evidence_semantic_merge_candidate_records',
  patchId: 'patch_semantic_merge_candidate_records',
  mergeCandidateId: 'candidate_semantic_merge_candidate_records'
});

const emittedCandidate = changeSet.mergeCandidate;
assert.equal(emittedCandidate.changedSemanticRegions.length > 0, true);
assert.equal(emittedCandidate.sourceHashes.baseHash, changeSet.beforeHash);
assert.equal(emittedCandidate.sourceHashes.targetHash, changeSet.afterHash);
assert.equal(emittedCandidate.evidenceIds.includes('evidence_semantic_merge_candidate_records'), true);
assert.equal(emittedCandidate.conflictKeys.length > 0, true);
assert.equal(SemanticMergeCandidateProjectionRisks.includes(emittedCandidate.projectionRisk), true);
assert.equal(typeof emittedCandidate.readinessSortKey, 'number');
assert.equal(emittedCandidate.mergeAdmission.kind, 'frontier.lang.semanticMergeCandidateAdmissionRecord');
assert.equal(emittedCandidate.mergeAdmission.changedSemanticRegions.length, emittedCandidate.changedSemanticRegions.length);

const readyRecord = createSemanticMergeCandidateAdmissionRecord(changeSet, {
  id: 'admission_candidate_ready',
  candidateId: 'candidate_ready',
  readiness: 'ready'
});
const lossesRecord = createSemanticMergeCandidateAdmissionRecord(emittedCandidate, {
  id: 'admission_candidate_losses',
  candidateId: 'candidate_losses',
  readiness: 'ready-with-losses',
  changedRegions: changeSet.changedRegions,
  evidence: changeSet.evidence,
  patch: changeSet.patch
});
const reviewRecord = createSemanticMergeCandidateAdmissionRecord(emittedCandidate, {
  id: 'admission_candidate_review',
  candidateId: 'candidate_review',
  readiness: 'needs-review',
  changedRegions: changeSet.changedRegions,
  evidence: changeSet.evidence,
  patch: changeSet.patch
});
const blockedRecord = createSemanticMergeCandidateAdmissionRecord(emittedCandidate, {
  id: 'admission_candidate_blocked',
  candidateId: 'candidate_blocked',
  readiness: 'blocked',
  changedRegions: changeSet.changedRegions,
  evidence: changeSet.evidence,
  patch: changeSet.patch
});

const sorted = sortSemanticMergeCandidateAdmissionRecords([
  blockedRecord,
  reviewRecord,
  readyRecord,
  lossesRecord
]);
assert.deepEqual(sorted.map((record) => record.readiness), ['ready', 'ready-with-losses', 'needs-review', 'blocked']);
assert.equal(semanticMergeCandidateReadinessSortKey(readyRecord) > semanticMergeCandidateReadinessSortKey(reviewRecord), true);
assert.equal(sorted[0].readinessSortKey > sorted[3].readinessSortKey, true);

const overlappingRecord = createSemanticMergeCandidateAdmissionRecord(emittedCandidate, {
  id: 'admission_candidate_overlap',
  candidateId: 'candidate_overlap',
  readiness: 'ready',
  changedRegions: changeSet.changedRegions,
  evidence: changeSet.evidence,
  patch: changeSet.patch
});
const nonOverlappingRecord = createSemanticMergeCandidateAdmissionRecord({
  id: 'candidate_non_overlap',
  language: 'javascript',
  sourcePath: 'src/other-candidates.js',
  baseHash: 'base_other',
  targetHash: 'target_other',
  readiness: 'ready',
  changedSemanticRegions: [{
    id: 'region_non_overlap',
    key: 'source#src/other-candidates.js#function#other',
    conflictKey: 'source#src/other-candidates.js#function#other',
    sourcePath: 'src/other-candidates.js',
    sourceSpan: { startLine: 20, startColumn: 1, endLine: 21, endColumn: 1 }
  }],
  evidenceIds: ['evidence_non_overlap']
});
const overlaps = querySemanticMergeCandidateAdmissionOverlaps([
  readyRecord,
  overlappingRecord,
  nonOverlappingRecord
]);
assert.equal(overlaps.length > 0, true);
assert.equal(overlaps.some((overlap) => overlap.candidateIds.includes('candidate_ready') && overlap.candidateIds.includes('candidate_overlap')), true);
assert.equal(overlaps.some((overlap) => overlap.candidateIds.includes('candidate_non_overlap')), false);
assert.equal(querySemanticMergeCandidateAdmissionOverlaps([readyRecord, overlappingRecord], { conflictKey: readyRecord.conflictKeys[0] }).length > 0, true);

const projectAdmission = createProjectImportAdmissionRecord({
  id: 'project_semantic_merge_candidate_records',
  language: 'javascript',
  projectRoot: 'src',
  imports: [{
    ...changeSet.after,
    mergeCandidates: [
      emittedCandidate,
      { ...emittedCandidate, id: 'candidate_semantic_merge_candidate_records_overlap' }
    ]
  }],
  mergeCandidates: [
    emittedCandidate,
    { ...emittedCandidate, id: 'candidate_semantic_merge_candidate_records_overlap' }
  ],
  evidence: changeSet.evidence,
  patch: changeSet.patch
});
assert.equal(projectAdmission.mergeCandidates.records.length >= 2, true);
assert.equal(projectAdmission.mergeCandidates.records[0].readinessSortKey >= projectAdmission.mergeCandidates.records[1].readinessSortKey, true);
assert.equal(projectAdmission.mergeCandidates.changedSemanticRegions.total >= emittedCandidate.changedSemanticRegions.length, true);
assert.equal(projectAdmission.mergeCandidates.overlaps.total > 0, true);
assert.equal(projectAdmission.mergeCandidates.conflictKeys.some((key) => emittedCandidate.conflictKeys.includes(key)), true);
