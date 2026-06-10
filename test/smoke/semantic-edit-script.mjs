import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource } from './compiler-api.mjs';

const baseSource = 'export function step(value: number) { return value + 1; }\n';
const workerSource = 'export function step(value: number) { return value + 2; }\n';

const candidateOnly = createSemanticEditScript({
  id: 'semantic_edit_candidate_only',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  generatedAt: 10
});
assert.equal(candidateOnly.kind, 'frontier.lang.semanticEditScript');
assert.equal(candidateOnly.summary.operations, 1);
assert.equal(candidateOnly.summary.candidates, 1);
assert.equal(candidateOnly.admission.status, 'needs-port');
assert.equal(candidateOnly.operations[0].status, 'candidate');
assert.equal(candidateOnly.admission.autoMergeClaim, false);
assert.equal(candidateOnly.admission.semanticEquivalenceClaim, false);

const cleanHead = createSemanticEditScript({
  id: 'semantic_edit_clean_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 20
});
assert.equal(cleanHead.admission.status, 'auto-merge-candidate');
assert.equal(cleanHead.admission.autoApplyCandidate, true);
assert.equal(cleanHead.summary.autoMergeCandidates, 1);
assert.equal(cleanHead.operations[0].status, 'portable');
assert.equal(cleanHead.operations[0].reasonCodes.includes('head-source-matches-base'), true);
assert.ok(cleanHead.operations[0].spans.worker);
assert.ok(cleanHead.operations[0].hashes.headTextHash);

const cleanProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_clean_projection',
  script: cleanHead,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
assert.equal(cleanProjection.kind, 'frontier.lang.semanticEditProjection');
assert.equal(cleanProjection.status, 'projected');
assert.equal(cleanProjection.sourceText, workerSource);
assert.deepEqual(cleanProjection.appliedOperations, [cleanHead.operations[0].id]);
assert.equal(cleanProjection.edits.length, 1);
assert.equal(cleanProjection.edits[0].operationId, cleanHead.operations[0].id);
assert.equal(cleanProjection.edits[0].status, 'applied');
assert.equal(cleanProjection.edits[0].anchorKey, cleanHead.operations[0].anchor.key);
assert.equal(cleanProjection.edits[0].conflictKey, cleanHead.operations[0].anchor.conflictKey);
assert.equal(cleanProjection.edits[0].symbolName, 'step');
assert.equal(cleanProjection.edits[0].sourcePath, 'src/runtime.ts');
assert.equal(cleanProjection.edits[0].replacementText, 'export function step(value: number) { return value + 2; }');
assert.equal(cleanProjection.edits[0].deletedBytes, 'export function step(value: number) { return value + 1; }'.length);
assert.ok(cleanProjection.edits[0].replacementTextHash);
assert.equal(cleanProjection.admission.status, 'auto-merge-candidate');
assert.equal(cleanProjection.admission.autoMergeClaim, false);
assert.equal(cleanProjection.admission.semanticEquivalenceClaim, false);

const conflictingHead = createSemanticEditScript({
  id: 'semantic_edit_conflicting_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: 'export function step(value: number) { return value + 3; }\n',
  generatedAt: 30
});
assert.equal(conflictingHead.admission.status, 'conflict');
assert.equal(conflictingHead.summary.conflicts, 1);
assert.equal(conflictingHead.operations[0].reasonCodes.includes('head-anchor-changed-since-base'), true);
const blockedProjection = projectSemanticEditScriptToSource({
  script: conflictingHead,
  workerSourceText: workerSource,
  headSourceText: 'export function step(value: number) { return value + 3; }\n'
});
assert.equal(blockedProjection.status, 'blocked');
assert.equal(blockedProjection.sourceText, undefined);
assert.equal(blockedProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), true);

const movedHead = createSemanticEditScript({
  id: 'semantic_edit_moved_head',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourcePath: 'src/runtime-core.ts',
  headSourceText: baseSource,
  generatedAt: 40
});
assert.equal(movedHead.admission.status, 'needs-port');
assert.equal(movedHead.summary.needsPort, 1);
assert.equal(movedHead.operations[0].reanchor.toAnchorKey.includes('src/runtime-core.ts'), true);
assert.equal(movedHead.operations[0].reasonCodes.includes('anchor-moved-or-renamed'), true);
