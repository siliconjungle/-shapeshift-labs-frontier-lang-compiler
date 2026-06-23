import { assert } from './helpers.mjs';
import { JsTsSafeMergeConflictCodes, safeMergeJsTsSource } from './compiler-api.mjs';

const deletionBase = [
  'function removeInternal() { return 1; }',
  'function keepInternal() { return 2; }',
  ''
].join('\n');

const deletionWorker = [
  'function keepInternal() { return 2; }',
  ''
].join('\n');

const independentDeletionWithHeadAddition = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_independent_deletion_head_addition',
  language: 'typescript',
  sourcePath: 'src/internal-delete.ts',
  baseSourceText: deletionBase,
  workerSourceText: deletionWorker,
  headSourceText: [
    'function removeInternal() { return 1; }',
    'function keepInternal() { return 2; }',
    'function headOnly() { return 3; }',
    ''
  ].join('\n')
});

assert.equal(independentDeletionWithHeadAddition.status, 'merged');
assert.equal(independentDeletionWithHeadAddition.mergedSourceText, [
  'function keepInternal() { return 2; }',
  'function headOnly() { return 3; }',
  ''
].join('\n'));
assert.equal(independentDeletionWithHeadAddition.metadata.composed.phase, 'independent-top-level-deletion-fallback');
assert.deepEqual(independentDeletionWithHeadAddition.metadata.composed.originalReasonCodes, [JsTsSafeMergeConflictCodes.topLevelOrderChanged]);
assert.equal(independentDeletionWithHeadAddition.summary.topLevelDeclarationDeletions, 1);
assert.equal(independentDeletionWithHeadAddition.summary.semanticEditOperations, 1);
assert.equal(independentDeletionWithHeadAddition.summary.semanticEditAppliedOperations, 1);
assert.equal(independentDeletionWithHeadAddition.summary.semanticEditReplayStatus, 'accepted-clean');
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.status, 'verified');
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.script.operations[0].kind, 'jsTsRemoveTopLevelDeclaration');
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.script.operations[0].reasonCodes.includes('head-anchor-matches-base'), true);
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.script.operations[0].reasonCodes.includes('independent-top-level-deletion'), true);
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(independentDeletionWithHeadAddition.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const independentDeletionWithHeadEdit = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_independent_deletion_head_edit',
  language: 'typescript',
  sourcePath: 'src/internal-delete.ts',
  baseSourceText: deletionBase,
  workerSourceText: deletionWorker,
  headSourceText: [
    'function removeInternal() { return 1; }',
    'function keepInternal() { return 4; }',
    ''
  ].join('\n')
});

assert.equal(independentDeletionWithHeadEdit.status, 'merged');
assert.equal(independentDeletionWithHeadEdit.mergedSourceText, [
  'function keepInternal() { return 4; }',
  ''
].join('\n'));
assert.equal(independentDeletionWithHeadEdit.metadata.composed.phase, 'independent-top-level-deletion-fallback');
assert.equal(independentDeletionWithHeadEdit.metadata.composed.originalReasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged), true);
assert.equal(independentDeletionWithHeadEdit.metadata.composed.originalReasonCodes.includes(JsTsSafeMergeConflictCodes.changedExistingDeclaration), true);
assert.equal(independentDeletionWithHeadEdit.semanticArtifacts.status, 'verified');

const sameSymbolDeleteModify = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_delete_modify_same_symbol_blocked',
  language: 'typescript',
  sourcePath: 'src/internal-delete.ts',
  baseSourceText: deletionBase,
  workerSourceText: deletionWorker,
  headSourceText: [
    'function removeInternal() { return 9; }',
    'function keepInternal() { return 2; }',
    ''
  ].join('\n')
});

assert.equal(sameSymbolDeleteModify.status, 'blocked');
assert.equal(sameSymbolDeleteModify.semanticArtifacts, undefined);
assert.equal(sameSymbolDeleteModify.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.topLevelOrderChanged), true);
assert.equal(sameSymbolDeleteModify.admission.reasonCodes.includes(JsTsSafeMergeConflictCodes.changedExistingDeclaration), true);

const exportedDeletionBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_exported_deletion_blocked',
  language: 'typescript',
  sourcePath: 'src/public-delete.ts',
  baseSourceText: [
    'export function removePublic() { return 1; }',
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  workerSourceText: [
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  headSourceText: [
    'export function removePublic() { return 1; }',
    'function keepInternal() { return 2; }',
    'function headOnly() { return 3; }',
    ''
  ].join('\n')
});

assert.equal(exportedDeletionBlocked.status, 'blocked');
assert.equal(exportedDeletionBlocked.semanticArtifacts, undefined);
assert.deepEqual(exportedDeletionBlocked.admission.reasonCodes, [JsTsSafeMergeConflictCodes.topLevelOrderChanged]);

const declareDeletionBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_declare_deletion_blocked',
  language: 'typescript',
  sourcePath: 'src/ambient-delete.ts',
  baseSourceText: [
    'declare const removeAmbient: number;',
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  workerSourceText: [
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  headSourceText: [
    'declare const removeAmbient: number;',
    'function keepInternal() { return 2; }',
    'function headOnly() { return 3; }',
    ''
  ].join('\n')
});

assert.equal(declareDeletionBlocked.status, 'blocked');
assert.equal(declareDeletionBlocked.semanticArtifacts, undefined);
assert.deepEqual(declareDeletionBlocked.admission.reasonCodes, [JsTsSafeMergeConflictCodes.topLevelOrderChanged]);

const namespaceDeletionBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_namespace_deletion_blocked',
  language: 'typescript',
  sourcePath: 'src/namespace-delete.ts',
  baseSourceText: [
    'namespace Internal {',
    '  export const value = 1;',
    '}',
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  workerSourceText: [
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  headSourceText: [
    'namespace Internal {',
    '  export const value = 1;',
    '}',
    'function keepInternal() { return 2; }',
    'function headOnly() { return 3; }',
    ''
  ].join('\n')
});

assert.equal(namespaceDeletionBlocked.status, 'blocked');
assert.equal(namespaceDeletionBlocked.semanticArtifacts, undefined);
assert.deepEqual(namespaceDeletionBlocked.admission.reasonCodes, [JsTsSafeMergeConflictCodes.topLevelOrderChanged]);

const moduleDeletionBlocked = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_semantic_edit_fallback_module_deletion_blocked',
  language: 'typescript',
  sourcePath: 'src/module-delete.ts',
  baseSourceText: [
    'module Internal {',
    '  export const value = 1;',
    '}',
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  workerSourceText: [
    'function keepInternal() { return 2; }',
    ''
  ].join('\n'),
  headSourceText: [
    'module Internal {',
    '  export const value = 1;',
    '}',
    'function keepInternal() { return 2; }',
    'function headOnly() { return 3; }',
    ''
  ].join('\n')
});

assert.equal(moduleDeletionBlocked.status, 'blocked');
assert.equal(moduleDeletionBlocked.semanticArtifacts, undefined);
assert.deepEqual(moduleDeletionBlocked.admission.reasonCodes, [JsTsSafeMergeConflictCodes.topLevelOrderChanged]);
