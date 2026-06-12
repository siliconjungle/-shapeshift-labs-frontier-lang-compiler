import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const baseSource = 'export function step(value: number) { return value + 1; }\n';
const workerSource = 'export function step(value: number) { return value + 2; }\n';
const cleanScript = createSemanticEditScript({
  id: 'semantic_edit_replay_diagnostics_clean',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 50
});
const cleanProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_replay_diagnostics_projection',
  script: cleanScript,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
const conflictReplay = replaySemanticEditProjection({
  id: 'semantic_edit_conflict_replay_diagnostics',
  projection: cleanProjection,
  currentSourceText: 'export function step(value: number) { return value + 3; }\n'
});
assert.equal(conflictReplay.status, 'conflict');
assert.equal(conflictReplay.outputSourceText, undefined);
assert.equal(conflictReplay.summary.conflicts, 1);
assert.equal(conflictReplay.edits[0].diagnostics.some((diagnostic) => diagnostic.category === 'projection-mismatch' && diagnostic.code === 'current-symbol-body-content-mismatch'), true);
assert.equal(conflictReplay.diagnostics.some((diagnostic) => diagnostic.scope === 'edit' && diagnostic.category === 'projection-mismatch'), true);
const staleAnchorReplay = replaySemanticEditProjection({
  id: 'semantic_edit_stale_anchor_replay',
  projection: cleanProjection,
  currentSourceText: 'export function other(value: number) { return value + 3; }\n'
});
assert.equal(staleAnchorReplay.status, 'stale');
assert.equal(staleAnchorReplay.outputSourceText, undefined);
assert.equal(staleAnchorReplay.edits[0].diagnostics.some((diagnostic) => diagnostic.category === 'stale-anchor' && diagnostic.code === 'current-symbol-anchor-missing'), true);
assert.equal(staleAnchorReplay.diagnostics.some((diagnostic) => diagnostic.scope === 'edit' && diagnostic.category === 'stale-anchor'), true);
const missingSourceReplay = replaySemanticEditProjection({
  id: 'semantic_edit_missing_source_replay',
  projection: cleanProjection
});
assert.equal(missingSourceReplay.status, 'blocked');
assert.equal(missingSourceReplay.outputSourceText, undefined);
assert.equal(missingSourceReplay.diagnostics.some((diagnostic) => diagnostic.category === 'missing-source' && diagnostic.code === 'missing-current-source-text'), true);
const overlapProjection = {
  ...cleanProjection,
  id: 'semantic_edit_overlap_projection',
  edits: [
    { ...cleanProjection.edits[0], operationId: 'semantic_edit_overlap_left', editOrder: 0 },
    { ...cleanProjection.edits[0], operationId: 'semantic_edit_overlap_right', editOrder: 1, replacementText: ' return value + 4; ' }
  ]
};
const overlapReplay = replaySemanticEditProjection({
  id: 'semantic_edit_overlap_replay',
  projection: overlapProjection,
  currentSourceText: baseSource
});
assert.equal(overlapReplay.status, 'conflict');
assert.equal(overlapReplay.outputSourceText, undefined);
assert.equal(overlapReplay.summary.conflicts, 2);
assert.equal(overlapReplay.diagnostics.some((diagnostic) => diagnostic.category === 'overlap' && diagnostic.overlapOperationIds.includes('semantic_edit_overlap_left')), true);
