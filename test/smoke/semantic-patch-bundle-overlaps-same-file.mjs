import { assert } from './helpers.mjs';
import {
  compareSemanticPatchBundleRecords,
  createSemanticEditScript,
  createSemanticPatchBundleRecord,
  diffNativeSources,
  projectSemanticEditScriptToSource,
  querySemanticPatchBundleOverlaps,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const sameFileDisjointBaseSource = [
  'export function score(value) { return value + 1; }',
  'export function total(value) { return value * 2; }',
  ''
].join('\n');
const sameFileScoreWorkerSource = [
  'export function score(value) { return value + 2; }',
  'export function total(value) { return value * 2; }',
  ''
].join('\n');
const sameFileTotalWorkerSource = [
  'export function score(value) { return value + 1; }',
  'export function total(value) { return value * 3; }',
  ''
].join('\n');
const sameFileScore = createProjectedEditBundle({
  id: 'same_file_disjoint_score',
  sourcePath: 'src/same-file-disjoint.js',
  baseSourceText: sameFileDisjointBaseSource,
  workerSourceText: sameFileScoreWorkerSource,
  generatedAt: 23
});
const sameFileTotal = createProjectedEditBundle({
  id: 'same_file_disjoint_total',
  sourcePath: 'src/same-file-disjoint.js',
  baseSourceText: sameFileDisjointBaseSource,
  workerSourceText: sameFileTotalWorkerSource,
  generatedAt: 24
});

assert.equal(
  sameFileScore.bundle.index.semanticEditKeys.some((key) => sameFileTotal.bundle.index.semanticEditKeys.includes(key)),
  false
);
const sameFileDisjointKeyOverlap = compareSemanticPatchBundleRecords(sameFileScore.bundle, sameFileTotal.bundle);
assert.equal(sameFileDisjointKeyOverlap.admission.status, 'independent');
assert.equal(sameFileDisjointKeyOverlap.admission.reviewRequired, false);
assert.equal(sameFileDisjointKeyOverlap.overlapKinds.includes('source-path'), false);
assert.equal(sameFileDisjointKeyOverlap.overlapKinds.includes('replay-current'), false);
assert.equal(sameFileDisjointKeyOverlap.admission.reasonCodes.includes('same-source-path'), false);
assert.equal(sameFileDisjointKeyOverlap.admission.reasonCodes.includes('target-hash-mismatch'), false);
assert.equal(querySemanticPatchBundleOverlaps([sameFileScore.bundle, sameFileTotal.bundle]).length, 0);

const queriedSameFileDisjoint = querySemanticPatchBundleOverlaps(
  [sameFileScore.bundle, sameFileTotal.bundle],
  { includeIndependent: true, reviewRequired: false }
);
assert.equal(queriedSameFileDisjoint.length, 1);
assert.equal(queriedSameFileDisjoint[0].admission.status, 'independent');

function createProjectedEditBundle({ id, sourcePath, baseSourceText, workerSourceText, generatedAt }) {
  const changeSet = diffNativeSources({
    id: `${id}_change`,
    language: 'javascript',
    sourcePath,
    beforeSourceText: baseSourceText,
    afterSourceText: workerSourceText
  });
  const script = createSemanticEditScript({
    id: `${id}_script`,
    language: 'javascript',
    sourcePath,
    baseSourceText,
    workerSourceText,
    headSourceText: baseSourceText,
    generatedAt
  });
  const projection = projectSemanticEditScriptToSource({
    id: `${id}_projection`,
    script,
    workerSourceText,
    headSourceText: baseSourceText
  });
  const replay = replaySemanticEditProjection({
    id: `${id}_replay`,
    projection,
    currentSourceText: baseSourceText
  });
  const bundle = createSemanticPatchBundleRecord(changeSet, {
    id: `${id}_bundle`,
    semanticEditScripts: [script],
    semanticEditProjections: [projection],
    semanticEditReplays: [replay]
  });
  return { changeSet, script, projection, replay, bundle };
}
