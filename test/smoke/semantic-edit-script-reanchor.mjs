import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const sameContentAnchorBase = 'export class A {\n  run() { return 1; }\n}\nexport class B {\n  run() { return 1; }\n}\n';
const sameContentAnchorWorker = 'export class A {\n  run() { return 1; }\n}\nexport class B {\n  run() { return 2; }\n}\n';
const sameContentAnchorCurrent = 'export class B {\n  run() { return 1; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorExpected = 'export class B {\n  run() { return 2; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorScript = createSemanticEditScript({
  id: 'semantic_edit_same_content_anchor',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: sameContentAnchorBase,
  workerSourceText: sameContentAnchorWorker,
  headSourceText: sameContentAnchorBase,
  generatedAt: 25
});

assert.equal(sameContentAnchorScript.admission.status, 'auto-merge-candidate');
assert.equal(sameContentAnchorScript.summary.covered, 0);

const sameContentAnchorProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_same_content_anchor_projection',
  script: sameContentAnchorScript,
  workerSourceText: sameContentAnchorWorker,
  headSourceText: sameContentAnchorBase
});
const sameContentAnchorReplay = replaySemanticEditProjection({
  id: 'semantic_edit_same_content_anchor_replay',
  projection: sameContentAnchorProjection,
  currentSourceText: sameContentAnchorCurrent
});

assert.equal(sameContentAnchorReplay.status, 'accepted-clean');
assert.equal(sameContentAnchorReplay.outputSourceText, sameContentAnchorExpected);
assert.equal(sameContentAnchorReplay.edits[0].reasonCodes.includes('current-symbol-anchor-matches-deleted'), true);
assert.equal(sameContentAnchorReplay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);

const sameContentAnchorChanged = 'export class B {\n  run() { return 3; }\n}\nexport class A {\n  run() { return 1; }\n}\n';
const sameContentAnchorConflict = replaySemanticEditProjection({
  id: 'semantic_edit_same_content_anchor_conflict',
  projection: sameContentAnchorProjection,
  currentSourceText: sameContentAnchorChanged
});

assert.equal(sameContentAnchorConflict.status, 'conflict');
assert.equal(sameContentAnchorConflict.outputSourceText, undefined);
assert.equal(sameContentAnchorConflict.edits[0].reasonCodes.includes('current-symbol-anchor-content-mismatch'), true);
