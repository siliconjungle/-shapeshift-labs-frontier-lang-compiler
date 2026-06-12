import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const stableRenameMoveBase = [
  'export function step(value: number) { return value + 1; }',
  'export function keep() { return 0; }',
  ''
].join('\n');
const stableRenameMoveWorker = [
  'export function renamedStep(value: number) { return value + 2; }',
  'export function keep() { return 0; }',
  ''
].join('\n');
const stableRenameMoveScript = createSemanticEditScript({
  id: 'semantic_edit_stable_rename_move',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  base: indexedSemanticSource('stable_rename_move_base', 'src/runtime.ts', stableRenameMoveBase, [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  worker: indexedSemanticSource('stable_rename_move_worker', 'src/runtime.ts', stableRenameMoveWorker, [
    { id: 'symbol:stable:step', name: 'renamedStep' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  head: indexedSemanticSource('stable_rename_move_head', 'src/runtime-core.ts', stableRenameMoveBase, [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  generatedAt: 45
});
assert.equal(stableRenameMoveScript.admission.status, 'auto-merge-candidate');
assert.equal(stableRenameMoveScript.summary.portable, 2);
assert.equal(stableRenameMoveScript.summary.byKind.removeBody, 1);
assert.equal(stableRenameMoveScript.summary.byKind.addBody, 1);
const stableRenameMoveRemove = stableRenameMoveScript.operations.find((operation) => operation.kind === 'removeBody');
const stableRenameMoveAdd = stableRenameMoveScript.operations.find((operation) => operation.kind === 'addBody');
assert.equal(stableRenameMoveRemove.reanchor.toSourcePath, 'src/runtime-core.ts');
assert.equal(stableRenameMoveRemove.reanchor.toSymbolName, 'step');
assert.equal(stableRenameMoveRemove.reasonCodes.includes('anchor-reanchored-head-matches-base'), true);
assert.equal(stableRenameMoveAdd.anchor.symbolName, 'renamedStep');
assert.equal(stableRenameMoveAdd.insertion.insertedSymbolId, 'symbol:stable:step');
assert.equal(stableRenameMoveAdd.reasonCodes.includes('added-anchor-absent-from-head'), true);

const stableRenameMoveProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_stable_rename_move_projection',
  script: stableRenameMoveScript,
  workerSourceText: stableRenameMoveWorker,
  headSourceText: stableRenameMoveBase,
  headSourcePath: 'src/runtime-core.ts'
});
assert.equal(stableRenameMoveProjection.status, 'projected');
assert.equal(stableRenameMoveProjection.sourcePath, 'src/runtime-core.ts');
assert.equal(stableRenameMoveProjection.sourceText, stableRenameMoveWorker);
assert.equal(stableRenameMoveProjection.edits.length, 2);
assert.equal(stableRenameMoveProjection.edits.every((edit) => edit.sourcePath === 'src/runtime-core.ts'), true);
assert.equal(stableRenameMoveProjection.edits.every((edit) => edit.originalSourcePath === 'src/runtime.ts'), true);
assert.equal(stableRenameMoveProjection.edits.every((edit) => edit.targetSourcePath === 'src/runtime-core.ts'), true);
assert.equal(stableRenameMoveProjection.edits.some((edit) => edit.editKind === 'delete' && edit.symbolName === 'step'), true);
assert.equal(stableRenameMoveProjection.edits.some((edit) => edit.editKind === 'insert' && edit.symbolName === 'renamedStep'), true);

const stableRenameMoveReplay = replaySemanticEditProjection({
  id: 'semantic_edit_stable_rename_move_replay',
  projection: stableRenameMoveProjection,
  currentSourceText: stableRenameMoveBase,
  currentSourcePath: 'src/runtime-core.ts'
});
assert.equal(stableRenameMoveReplay.status, 'accepted-clean');
assert.equal(stableRenameMoveReplay.outputSourceText, stableRenameMoveWorker);

const stableRenameNeedsPortScript = createSemanticEditScript({
  id: 'semantic_edit_stable_rename_needs_port',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  base: indexedSemanticSource('stable_rename_needs_port_base', 'src/runtime.ts', stableRenameMoveBase, [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  worker: indexedSemanticSource('stable_rename_needs_port_worker', 'src/runtime.ts', workerSourceWithReturn(stableRenameMoveBase, 2), [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  head: indexedSemanticSource('stable_rename_needs_port_head', 'src/runtime.ts', workerSourceWithName(stableRenameMoveBase, 'renamedStep'), [
    { id: 'symbol:stable:step', name: 'renamedStep' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  generatedAt: 46
});
assert.equal(stableRenameNeedsPortScript.admission.status, 'needs-port');
assert.equal(stableRenameNeedsPortScript.summary.needsPort, 1);
assert.equal(stableRenameNeedsPortScript.operations[0].reasonCodes.includes('anchor-moved-or-renamed'), true);
assert.equal(stableRenameNeedsPortScript.operations[0].reanchor.toSymbolName, 'renamedStep');
const stableRenameNeedsPortProjection = projectSemanticEditScriptToSource({
  id: 'semantic_edit_stable_rename_needs_port_projection',
  script: stableRenameNeedsPortScript,
  workerSourceText: workerSourceWithReturn(stableRenameMoveBase, 2),
  headSourceText: workerSourceWithName(stableRenameMoveBase, 'renamedStep')
});
assert.equal(stableRenameNeedsPortProjection.status, 'blocked');
assert.equal(stableRenameNeedsPortProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), true);

const stableRenameConflictScript = createSemanticEditScript({
  id: 'semantic_edit_stable_rename_conflict',
  language: 'typescript',
  sourcePath: 'src/runtime.ts',
  base: indexedSemanticSource('stable_rename_conflict_base', 'src/runtime.ts', stableRenameMoveBase, [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  worker: indexedSemanticSource('stable_rename_conflict_worker', 'src/runtime.ts', workerSourceWithReturn(stableRenameMoveBase, 2), [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  head: indexedSemanticSource('stable_rename_conflict_head', 'src/runtime.ts', workerSourceWithReturn(stableRenameMoveBase, 3), [
    { id: 'symbol:stable:step', name: 'step' },
    { id: 'symbol:stable:keep', name: 'keep' }
  ]),
  generatedAt: 47
});
assert.equal(stableRenameConflictScript.admission.status, 'conflict');
assert.equal(stableRenameConflictScript.summary.conflicts, 1);
assert.equal(stableRenameConflictScript.operations[0].reasonCodes.includes('head-anchor-changed-since-base'), true);

function indexedSemanticSource(id, sourcePath, sourceText, symbols) {
  const indexedSymbols = symbols.map((symbol) => {
    const definitionSpan = declarationSpan(sourceText, sourcePath, symbol.name);
    return {
      id: symbol.id,
      name: symbol.name,
      kind: symbol.kind ?? 'function',
      language: 'typescript',
      signatureHash: `signature:${symbol.id}`,
      definitionSpan,
      metadata: { ownershipRegionKind: 'body' }
    };
  });
  return {
    language: 'typescript',
    sourcePath,
    sourceText,
    semanticIndex: { id: `semantic_index_${id}`, symbols: indexedSymbols, occurrences: [], relations: [], facts: [] },
    mappings: indexedSymbols.map((symbol) => ({
      id: `map_${id}_${symbol.name.toLowerCase()}`,
      semanticSymbolId: symbol.id,
      sourceSpan: symbol.definitionSpan,
      precision: 'declaration',
      ownershipRegionKind: 'body'
    }))
  };
}

function declarationSpan(sourceText, sourcePath, name) {
  const marker = `function ${name}`;
  const markerOffset = sourceText.indexOf(marker);
  assert.equal(markerOffset >= 0, true);
  const start = sourceText.lastIndexOf('\n', markerOffset) + 1;
  const endBreak = sourceText.indexOf('\n', markerOffset);
  const end = endBreak === -1 ? sourceText.length : endBreak;
  const startLine = sourceText.slice(0, start).split('\n').length;
  return { path: sourcePath, startLine, startColumn: 1, endLine: startLine, endColumn: end - start + 1 };
}

function workerSourceWithReturn(sourceText, value) {
  return sourceText.replace('return value + 1', `return value + ${value}`);
}

function workerSourceWithName(sourceText, name) {
  return sourceText.replace('function step', `function ${name}`);
}
