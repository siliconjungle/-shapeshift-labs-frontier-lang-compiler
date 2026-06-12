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
assert.equal(cleanProjection.edits[0].sourceIdentityStatus, 'same-source');
assert.equal(cleanProjection.edits[0].sourceIdentityAnchorKey, cleanProjection.edits[0].anchorKey);
assert.equal(cleanProjection.edits[0].targetIdentityAnchorKey, cleanProjection.edits[0].anchorKey);
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
const staleAnchorDiagnostic = staleAnchorReplay.edits[0].diagnostics.find((diagnostic) => diagnostic.code === 'current-symbol-anchor-missing');
assert.equal(staleAnchorDiagnostic.sourceIdentityStatus, 'same-source');
assert.equal(staleAnchorDiagnostic.sourceIdentityHash, cleanProjection.edits[0].sourceIdentityHash);
assert.equal(staleAnchorDiagnostic.semanticIdentityHash, cleanProjection.edits[0].semanticIdentityHash);
assert.equal(staleAnchorDiagnostic.sourceIdentityAnchorKey, cleanProjection.edits[0].anchorKey);
assert.equal(staleAnchorDiagnostic.targetIdentityAnchorKey, cleanProjection.edits[0].anchorKey);
assert.equal(staleAnchorDiagnostic.sourceIdentitySourcePath, 'src/runtime.ts');
assert.equal(staleAnchorDiagnostic.targetIdentitySourcePath, 'src/runtime.ts');
const movedSourceScript = createSemanticEditScript({
  id: 'semantic_edit_moved_source_replay_diagnostics',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourcePath: 'src/runtime-core.ts',
  headSourceText: baseSource,
  generatedAt: 55
});
const movedSourceProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_moved_source_replay_diagnostics_projection',
  script: movedSourceScript,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  headSourcePath: 'src/runtime-core.ts'
});
assert.equal(movedSourceProjection.edits[0].sourceIdentityStatus, 'moved-source');
assert.equal(movedSourceProjection.edits[0].sourceIdentityAnchorKey, movedSourceProjection.edits[0].anchorKey);
assert.equal(movedSourceProjection.edits[0].targetIdentityAnchorKey, movedSourceProjection.edits[0].targetAnchorKey);
assert.equal(movedSourceProjection.edits[0].sourceIdentitySourcePath, 'src/runtime.ts');
assert.equal(movedSourceProjection.edits[0].targetIdentitySourcePath, 'src/runtime-core.ts');
const movedSourceStaleReplay = replaySemanticEditProjection({
  id: 'semantic_edit_moved_source_stale_replay',
  projection: movedSourceProjection,
  currentSourcePath: 'src/runtime-core.ts',
  currentSourceText: 'export function other(value: number) { return value + 3; }\n'
});
assert.equal(movedSourceStaleReplay.status, 'stale');
assert.equal(movedSourceStaleReplay.outputSourceText, undefined);
const movedSourceStaleDiagnostic = movedSourceStaleReplay.edits[0].diagnostics.find((diagnostic) => diagnostic.code === 'current-symbol-anchor-missing');
assert.equal(movedSourceStaleDiagnostic.sourceIdentityStatus, 'moved-source');
assert.equal(movedSourceStaleDiagnostic.sourceIdentityHash, movedSourceProjection.edits[0].sourceIdentityHash);
assert.equal(movedSourceStaleDiagnostic.semanticIdentityHash, movedSourceProjection.edits[0].semanticIdentityHash);
assert.equal(movedSourceStaleDiagnostic.anchorKey, movedSourceProjection.edits[0].anchorKey);
assert.equal(movedSourceStaleDiagnostic.targetAnchorKey, movedSourceProjection.edits[0].targetAnchorKey);
assert.equal(movedSourceStaleDiagnostic.sourceIdentityAnchorKey, movedSourceProjection.edits[0].anchorKey);
assert.equal(movedSourceStaleDiagnostic.targetIdentityAnchorKey, movedSourceProjection.edits[0].targetAnchorKey);
assert.equal(movedSourceStaleDiagnostic.sourceIdentitySourcePath, 'src/runtime.ts');
assert.equal(movedSourceStaleDiagnostic.targetIdentitySourcePath, 'src/runtime-core.ts');
assert.equal(movedSourceStaleDiagnostic.originalSourcePath, 'src/runtime.ts');
assert.equal(movedSourceStaleDiagnostic.targetSourcePath, 'src/runtime-core.ts');
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
const crlfBaseSource = 'export function crlf(value) {\r\n  return value + 1;\r\n}\r\n';
const crlfWorkerSource = 'export function crlf(value) {\r\n  return value + 2;\r\n}\r\n';
const crlfScript = createSemanticEditScript({
  id: 'semantic_edit_replay_diagnostics_crlf',
  language: 'typescript',
  sourcePath: 'src/crlf.ts',
  baseSourceText: crlfBaseSource,
  workerSourceText: crlfWorkerSource,
  headSourceText: crlfBaseSource,
  generatedAt: 60
});
const crlfProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_replay_diagnostics_crlf_projection',
  script: crlfScript,
  workerSourceText: crlfWorkerSource,
  headSourceText: crlfBaseSource
});
const crlfWhitespaceReplay = replaySemanticEditProjection({
  id: 'semantic_edit_replay_diagnostics_crlf_whitespace',
  projection: crlfProjection,
  currentSourceText: 'export function crlf(value) {\n  return value + 1;\n}'
});
assert.equal(crlfWhitespaceReplay.status, 'accepted-clean');
assert.equal(crlfWhitespaceReplay.diagnostics.some((diagnostic) => diagnostic.category === 'projection-mismatch'), false);
const crlfWhitespaceConflictReplay = replaySemanticEditProjection({
  id: 'semantic_edit_replay_diagnostics_crlf_conflict',
  projection: crlfProjection,
  currentSourceText: 'export function crlf(value) {\n  return value + 3;\n}'
});
assert.equal(crlfWhitespaceConflictReplay.status, 'conflict');
assert.equal(crlfWhitespaceConflictReplay.outputSourceText, undefined);
assert.equal(crlfWhitespaceConflictReplay.edits[0].diagnostics.some((diagnostic) => diagnostic.category === 'projection-mismatch'
  && diagnostic.code === 'current-symbol-anchor-content-mismatch'), true);
