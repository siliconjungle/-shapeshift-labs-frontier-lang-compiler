import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  diffNativeSourceImports,
  importNativeSource,
  querySemanticMergeConflictClasses,
  SemanticMergeConflictClasses,
  semanticMergeConflictRiskScore,
  sortSemanticMergeCandidatesByConflictRisk,
  summarizeSemanticMergeConflicts
} from './compiler-api.mjs';

for (const conflictClass of [
  'same-symbol-edit',
  'delete-modify',
  'shifted-code',
  'duplicate-signature',
  'dependency-drift',
  'behavior-evidence-needed'
]) {
  assert.equal(SemanticMergeConflictClasses.includes(conflictClass), true);
}

const beforeImport = importNativeSource({
  id: 'import_conflicts_before',
  language: 'javascript',
  sourcePath: 'src/conflicts.js',
  sourceText: [
    'export function touch(value) { return value; }',
    'export function move(value) { return value; }',
    'export function removeMe(value) { return value; }',
    'export function duplicateA(value) { return value; }',
    ''
  ].join('\n')
});
const afterImport = importNativeSource({
  id: 'import_conflicts_after',
  language: 'javascript',
  sourcePath: 'src/conflicts.js',
  sourceText: [
    "import helper from './helper.js';",
    '',
    'export function touch(value, factor) { return value * factor; }',
    'export function move(value) { return value; }',
    'export function duplicateA(value) { return value; }',
    'export function duplicateB(value) { return helper(value); }',
    ''
  ].join('\n')
});
const duplicateA = afterImport.semanticIndex.symbols.find((symbol) => symbol.name === 'duplicateA');
const duplicateB = afterImport.semanticIndex.symbols.find((symbol) => symbol.name === 'duplicateB');
duplicateB.signatureHash = duplicateA.signatureHash;

const conflictChangeSet = diffNativeSourceImports({
  id: 'semantic_merge_conflict_classes',
  before: beforeImport,
  after: afterImport
});
const conflictCandidate = conflictChangeSet.mergeCandidate;
const classNames = conflictCandidate.conflictSummary.classes;
for (const conflictClass of SemanticMergeConflictClasses) {
  assert.equal(classNames.includes(conflictClass), true, `missing conflict class ${conflictClass}`);
}
assert.equal(conflictCandidate.conflictClasses.every((record) => Array.isArray(record.conflictKeys)), true);
assert.equal(conflictCandidate.conflictClasses.every((record) => typeof record.reasonCode === 'string'), true);
assert.equal(conflictChangeSet.metadata.semanticMergeConflictSummary.total, conflictCandidate.conflictClasses.length);
assert.equal(conflictChangeSet.evidence[0].metadata.semanticMergeConflictSummary.classes.includes('dependency-drift'), true);

const duplicateSignatureRecords = querySemanticMergeConflictClasses(conflictCandidate, {
  classes: ['duplicate-signature']
});
assert.equal(duplicateSignatureRecords.length, 1);
assert.equal(duplicateSignatureRecords[0].metadata.symbolNames.includes('duplicateA'), true);
assert.equal(duplicateSignatureRecords[0].metadata.symbolNames.includes('duplicateB'), true);

const behaviorRecords = querySemanticMergeConflictClasses([conflictCandidate], {
  class: 'behavior-evidence-needed',
  risk: 'medium'
});
assert.equal(behaviorRecords.length, 1);
assert.equal(behaviorRecords[0].evidenceIds.length > 0, true);

const shiftedRecords = querySemanticMergeConflictClasses(conflictCandidate, {
  classes: ['shifted-code'],
  sort: false
});
assert.equal(shiftedRecords.some((record) => record.symbolIds.some((id) => id.includes('move'))), true);

const summary = summarizeSemanticMergeConflicts(conflictCandidate.conflictClasses, {
  readiness: conflictCandidate.readiness,
  conflictKeys: conflictCandidate.conflictKeys,
  sourcePath: conflictCandidate.sourcePath,
  language: conflictCandidate.language
});
assert.equal(summary.byClass['delete-modify'] >= 1, true);
assert.equal(summary.highestRisk, 'high');
assert.equal(summary.riskScore, semanticMergeConflictRiskScore(conflictCandidate));

const lowerRiskCandidate = {
  ...conflictCandidate,
  id: 'merge_candidate_lower_risk',
  conflictClasses: conflictCandidate.conflictClasses.filter((record) => record.class === 'same-symbol-edit'),
  conflictSummary: summarizeSemanticMergeConflicts(
    conflictCandidate.conflictClasses.filter((record) => record.class === 'same-symbol-edit'),
    { readiness: 'needs-review', conflictKeys: conflictCandidate.conflictKeys }
  )
};
assert.equal(sortSemanticMergeCandidatesByConflictRisk([lowerRiskCandidate, conflictCandidate])[0].id, conflictCandidate.id);

const sidecar = createSemanticImportSidecar({
  ...afterImport,
  id: 'import_result_conflict_sidecar',
  mergeCandidates: [conflictCandidate]
});
assert.equal(sidecar.mergeCandidates[0].conflictClasses.includes('delete-modify'), true);
assert.equal(sidecar.mergeCandidates[0].conflictSummary.classes.includes('same-symbol-edit'), true);
