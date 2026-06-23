import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  safeMergeJsTsProject,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const baseStep = [
  'export function step(v: number) {',
  '  return v + 1;',
  '}',
  ''
].join('\n');

const workerStep = [
  'export function step(v: number) {',
  '  return v + 2;',
  '}',
  ''
].join('\n');

const cleanBodyEdit = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_body',
  language: 'typescript',
  sourcePath: 'src/step.ts',
  baseSourceText: baseStep,
  workerSourceText: workerStep,
  headSourceText: baseStep
});

assert.equal(cleanBodyEdit.status, 'merged');
assert.equal(cleanBodyEdit.mergedSourceText, workerStep);
assert.equal(cleanBodyEdit.admission.status, 'auto-merge-candidate');
assert.equal(cleanBodyEdit.admission.autoMergeClaim, false);
assert.equal(cleanBodyEdit.admission.semanticEquivalenceClaim, false);
assert.equal(cleanBodyEdit.summary.semanticEditOperations, 1);
assert.equal(cleanBodyEdit.summary.semanticEditAppliedOperations, 1);
assert.equal(cleanBodyEdit.summary.semanticEditReplayStatus, 'accepted-clean');
assert.equal(cleanBodyEdit.metadata.composed.phase, 'semantic-edit-fallback');
assert.deepEqual(cleanBodyEdit.metadata.composed.originalReasonCodes, [JsTsSafeMergeConflictCodes.changedExistingDeclaration]);
assert.equal(cleanBodyEdit.semanticArtifacts.status, 'verified');
assert.equal(cleanBodyEdit.semanticArtifacts.admission.status, 'auto-merge-candidate');
assert.deepEqual(cleanBodyEdit.semanticArtifacts.admission.reasonCodes, []);
assert.equal(cleanBodyEdit.semanticArtifacts.script.admission.status, 'auto-merge-candidate');
assert.equal(cleanBodyEdit.semanticArtifacts.projection.status, 'projected');
assert.equal(cleanBodyEdit.semanticArtifacts.projection.sourceText, workerStep);
assert.equal(cleanBodyEdit.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(cleanBodyEdit.semanticArtifacts.replay.outputSourceText, workerStep);
assert.equal(cleanBodyEdit.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');
assert.equal(cleanBodyEdit.gates.every((gate) => gate.status === 'passed'), true);

const reanchoredBodyEdit = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_reanchored_body',
  language: 'typescript',
  sourcePath: 'src/step.ts',
  baseSourceText: baseStep,
  workerSourceText: workerStep,
  headSourceText: `// coordinator moved this file\n${baseStep}`
});

assert.equal(reanchoredBodyEdit.status, 'merged');
assert.equal(reanchoredBodyEdit.mergedSourceText, `// coordinator moved this file\n${workerStep}`);
assert.equal(reanchoredBodyEdit.semanticArtifacts.status, 'verified');
assert.equal(reanchoredBodyEdit.semanticArtifacts.projection.status, 'projected');
assert.equal(reanchoredBodyEdit.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(reanchoredBodyEdit.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const conflictingBodyEdit = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_conflict',
  language: 'typescript',
  sourcePath: 'src/step.ts',
  baseSourceText: baseStep,
  workerSourceText: workerStep,
  headSourceText: [
    'export function step(v: number) {',
    '  return v + 3;',
    '}',
    ''
  ].join('\n')
});

assert.equal(conflictingBodyEdit.status, 'blocked');
assert.equal(conflictingBodyEdit.semanticArtifacts.status, 'blocked');
assert.equal(conflictingBodyEdit.semanticArtifacts.script.admission.status, 'conflict');
assert.equal(conflictingBodyEdit.semanticArtifacts.projection.status, 'blocked');
assert.equal(conflictingBodyEdit.semanticArtifacts.replay.status, 'blocked');
assert.equal(conflictingBodyEdit.semanticArtifacts.alreadyAppliedReplay.status, 'blocked');
assert.equal(
  conflictingBodyEdit.admission.reasonCodes.includes('semantic-edit-script-conflict'),
  true
);
assert.equal(
  conflictingBodyEdit.admission.reasonCodes.includes('head-anchor-changed-since-base'),
  true
);

const duplicateName = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_skips_non_body_conflict',
  language: 'typescript',
  sourcePath: 'src/duplicate.ts',
  baseSourceText: 'export const base = 1;\n',
  workerSourceText: 'export const base = 1;\nexport const duplicate = 1;\n',
  headSourceText: 'export const base = 1;\nexport const duplicate = 2;\n'
});

assert.equal(duplicateName.status, 'blocked');
assert.equal(duplicateName.conflicts[0].code, JsTsSafeMergeConflictCodes.duplicateName);
assert.equal(duplicateName.semanticArtifacts, undefined);

const projectBodyEdit = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_semantic_edit_fallback_body',
  language: 'typescript',
  baseFiles: { 'src/step.ts': baseStep },
  workerFiles: { 'src/step.ts': workerStep },
  headFiles: { 'src/step.ts': baseStep }
});

assert.equal(projectBodyEdit.status, 'merged');
assert.equal(projectBodyEdit.summary.operations['merged-source'], 1);
assert.equal(projectBodyEdit.summary.semanticArtifactFiles, 1);
assert.equal(projectBodyEdit.outputFiles[0].operation, 'merged-source');
assert.equal(projectBodyEdit.outputFiles[0].sourceText, workerStep);
assert.equal(projectBodyEdit.files[0].result.metadata.composed.phase, 'semantic-edit-fallback');
assert.equal(projectBodyEdit.files[0].semanticArtifacts.status, 'verified');
