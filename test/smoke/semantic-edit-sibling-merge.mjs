import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const fixtures = [
  {
    id: 'class_method_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 2;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value + 1;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 2;\n  }\n  set(value) {\n    return value + 1;\n  }\n}\n',
    coveredKind: undefined,
    portableSymbol: 'Store.get:controlFlow:exit#1'
  },
  {
    id: 'interface_property_sibling',
    base: 'export interface User {\n  id: string;\n  name: string;\n}\n',
    worker: 'export interface User {\n  id: number;\n  name: string;\n}\n',
    head: 'export interface User {\n  id: string;\n  name: string | null;\n}\n',
    expected: 'export interface User {\n  id: number;\n  name: string | null;\n}\n',
    coveredKind: 'replaceProperty',
    portableSymbol: 'User.id'
  },
  {
    id: 'object_property_sibling',
    base: "export const config = {\n  mode: 'a',\n  flag: false,\n};\n",
    worker: "export const config = {\n  mode: 'b',\n  flag: false,\n};\n",
    head: "export const config = {\n  mode: 'a',\n  flag: true,\n};\n",
    expected: "export const config = {\n  mode: 'b',\n  flag: true,\n};\n",
    coveredKind: 'replaceRegion',
    portableSymbol: 'config.mode'
  },
  {
    id: 'class_method_add_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 2;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 2;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    coveredKind: 'addControlFlow',
    coveredReason: 'child-covered-by-container-edit',
    portableSymbol: 'Store.reset'
  },
  {
    id: 'class_method_remove_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 1;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 2;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 2;\n  }\n}\n',
    coveredKind: 'removeControlFlow',
    coveredReason: 'child-covered-by-container-edit',
    portableSymbol: 'Store.reset'
  }
];

for (const fixture of fixtures) {
  const script = createSemanticEditScript({
    id: `semantic_edit_sibling_${fixture.id}`,
    language: 'typescript',
    sourcePath: 'src/sibling.ts',
    baseSourceText: fixture.base,
    workerSourceText: fixture.worker,
    headSourceText: fixture.head,
    generatedAt: 70
  });
  assert.equal(script.admission.status, 'auto-merge-candidate', fixture.id);
  assert.equal(script.summary.covered >= 1, fixture.coveredKind !== undefined, fixture.id);
  assert.equal(script.operations.some((operation) => operation.kind === fixture.coveredKind && operation.status === 'covered'), fixture.coveredKind !== undefined, fixture.id);
  assert.equal(script.operations.some((operation) => operation.anchor.symbolName === fixture.portableSymbol && operation.status === 'portable'), true, fixture.id);
  assert.equal(script.operations.some((operation) => operation.reasonCodes.includes(fixture.coveredReason ?? 'container-covered-by-child-edits')), fixture.coveredKind !== undefined, fixture.id);

  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.worker, headSourceText: fixture.head });
  assert.equal(projection.status, 'projected', fixture.id);
  assert.equal(projection.sourceText, fixture.expected, fixture.id);
  assert.equal(projection.skippedOperations.length >= 1, fixture.coveredKind !== undefined, fixture.id);
  assert.equal(projection.edits.some((edit) => edit.symbolName === fixture.portableSymbol), true, fixture.id);

  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.head });
  assert.equal(replay.status, 'accepted-clean', fixture.id);
  assert.equal(replay.outputSourceText, fixture.expected, fixture.id);
}

const independentInsertionFixtures = [
  {
    id: 'function_add_independent_sibling',
    base: 'export function current() { return 1; }\n',
    worker: 'export function current() { return 1; }\nexport function workerOnly() { return 2; }\n',
    head: 'export function current() { return 1; }\nexport function headOnly() { return 3; }\n',
    expected: 'export function current() { return 1; }\nexport function workerOnly() { return 2; }\nexport function headOnly() { return 3; }\n',
    portableSymbol: 'workerOnly'
  },
  {
    id: 'class_method_add_independent_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    coveredKind: undefined,
    portableSymbol: 'Store.reset'
  },
  {
    id: 'interface_property_add_independent_sibling',
    base: 'export interface User {\n  id: string;\n}\n',
    worker: 'export interface User {\n  id: string;\n  name: string;\n}\n',
    head: 'export interface User {\n  id: string;\n  email: string;\n}\n',
    expected: 'export interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n',
    coveredKind: undefined,
    portableSymbol: 'User.name'
  },
  {
    id: 'object_property_add_independent_sibling',
    base: "export const config = {\n  mode: 'a',\n};\n",
    worker: "export const config = {\n  mode: 'a',\n  flag: true,\n};\n",
    head: "export const config = {\n  mode: 'a',\n  count: 1,\n};\n",
    expected: "export const config = {\n  mode: 'a',\n  flag: true,\n  count: 1,\n};\n",
    coveredKind: 'replaceRegion',
    portableSymbol: 'config.flag'
  }
];

for (const fixture of independentInsertionFixtures) {
  const script = createSemanticEditScript({
    id: `semantic_edit_sibling_${fixture.id}`,
    language: 'typescript',
    sourcePath: 'src/sibling.ts',
    baseSourceText: fixture.base,
    workerSourceText: fixture.worker,
    headSourceText: fixture.head,
    generatedAt: 80
  });
  assert.equal(script.admission.status, 'auto-merge-candidate', fixture.id);
  if (fixture.coveredKind) {
    assert.equal(script.operations.some((operation) => operation.kind === fixture.coveredKind && operation.status === 'covered'), true, fixture.id);
  }
  assert.equal(script.operations.some((operation) => operation.anchor.symbolName === fixture.portableSymbol && operation.status === 'portable'), true, fixture.id);

  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.worker, headSourceText: fixture.head });
  assert.equal(projection.status, 'projected', fixture.id);
  assert.equal(projection.sourceText, fixture.expected, fixture.id);
  assert.equal(projection.edits.length, 1, fixture.id);
  assert.equal(projection.edits[0].editKind, 'insert', fixture.id);
  assert.equal(projection.edits[0].symbolName, fixture.portableSymbol, fixture.id);
  assert.equal(projection.edits.some((edit) => edit.editKind === 'replace'), false, fixture.id);

  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.head });
  assert.equal(replay.status, 'accepted-clean', fixture.id);
  assert.equal(replay.outputSourceText, fixture.expected, fixture.id);
}

const siblingAnchorFallbackBase = 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n';
const siblingAnchorFallbackWorker = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n  set(value) {\n    return value;\n  }\n}\n';
const siblingAnchorFallbackScript = createSemanticEditScript({
  id: 'semantic_edit_sibling_anchor_fallback',
  language: 'typescript',
  sourcePath: 'src/sibling.ts',
  baseSourceText: siblingAnchorFallbackBase,
  workerSourceText: siblingAnchorFallbackWorker,
  headSourceText: siblingAnchorFallbackBase,
  generatedAt: 85
});
assert.equal(siblingAnchorFallbackScript.admission.status, 'auto-merge-candidate');
const siblingAnchorFallbackOperation = siblingAnchorFallbackScript.operations.find((operation) => operation.kind === 'addBody' && operation.anchor.symbolName === 'Store.reset');
assert.ok(siblingAnchorFallbackOperation);
assert.equal(siblingAnchorFallbackOperation.kind, 'addBody');
assert.equal(siblingAnchorFallbackOperation.insertion.anchorCandidates.some((candidate) => candidate.mode === 'after' && candidate.anchorSymbolName === 'Store.get'), true);
assert.equal(siblingAnchorFallbackOperation.insertion.anchorCandidates.some((candidate) => candidate.mode === 'before' && candidate.anchorSymbolName === 'Store.set'), true);
const siblingAnchorFallbackInsertionScript = {
  ...siblingAnchorFallbackScript,
  operations: [siblingAnchorFallbackOperation],
  admission: {
    ...siblingAnchorFallbackScript.admission,
    status: 'auto-merge-candidate',
    reviewRequired: false,
    autoApplyCandidate: true
  }
};
const siblingAnchorFallbackMissingAfterHead = 'export class Store {\n  get() {\n    return 1;\n  }\n}\n';
const siblingAnchorFallbackMissingAfterExpected = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n';
const siblingAnchorFallbackMissingAfterProjection = projectSemanticEditScriptToSource({
  script: siblingAnchorFallbackInsertionScript,
  workerSourceText: siblingAnchorFallbackWorker,
  headSourceText: siblingAnchorFallbackMissingAfterHead
});
assert.equal(siblingAnchorFallbackMissingAfterProjection.status, 'projected');
assert.equal(siblingAnchorFallbackMissingAfterProjection.sourceText, siblingAnchorFallbackMissingAfterExpected);
assert.equal(siblingAnchorFallbackMissingAfterProjection.edits[0].editKind, 'insert');

const siblingAnchorFallbackMissingBeforeHead = 'export class Store {\n  set(value) {\n    return value;\n  }\n}\n';
const siblingAnchorFallbackMissingBeforeExpected = 'export class Store {\n  reset() {\n    return 0;\n  }\n  set(value) {\n    return value;\n  }\n}\n';
const siblingAnchorFallbackMissingBeforeProjection = projectSemanticEditScriptToSource({
  script: siblingAnchorFallbackInsertionScript,
  workerSourceText: siblingAnchorFallbackWorker,
  headSourceText: siblingAnchorFallbackMissingBeforeHead
});
assert.equal(siblingAnchorFallbackMissingBeforeProjection.status, 'projected');
assert.equal(siblingAnchorFallbackMissingBeforeProjection.sourceText, siblingAnchorFallbackMissingBeforeExpected);

const siblingAnchorFallbackBaseProjection = projectSemanticEditScriptToSource({
  script: siblingAnchorFallbackInsertionScript,
  workerSourceText: siblingAnchorFallbackWorker,
  headSourceText: siblingAnchorFallbackBase
});
assert.equal(siblingAnchorFallbackBaseProjection.status, 'projected');
const siblingAnchorFallbackNoAnchorHead = 'export class Store {\n  other() {\n    return 9;\n  }\n  final() {\n    return 10;\n  }\n}\n';
const siblingAnchorFallbackNoAnchorProjection = projectSemanticEditScriptToSource({
  script: siblingAnchorFallbackInsertionScript,
  workerSourceText: siblingAnchorFallbackWorker,
  headSourceText: siblingAnchorFallbackNoAnchorHead
});
assert.equal(siblingAnchorFallbackNoAnchorProjection.status, 'blocked');
assert.equal(siblingAnchorFallbackNoAnchorProjection.admission.reasonCodes.some((reason) => reason.startsWith('insertion-anchor-not-resolvable:')), true);
const siblingAnchorFallbackNoAnchorReplay = replaySemanticEditProjection({
  projection: siblingAnchorFallbackBaseProjection,
  currentSourceText: siblingAnchorFallbackNoAnchorHead
});
assert.equal(siblingAnchorFallbackNoAnchorReplay.status, 'conflict');
assert.equal(siblingAnchorFallbackNoAnchorReplay.admission.reviewRequired, true);
assert.equal(siblingAnchorFallbackNoAnchorReplay.admission.reasonCodes.includes('current-insertion-anchor-missing'), true);

const sameAnchorBase = 'export class Store {\n  get() {\n    return 1;\n  }\n}\n';
const sameAnchorWorker = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n  clear() {\n    return undefined;\n  }\n}\n';
const sameAnchorHead = 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n';
const sameAnchorExpected = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n  clear() {\n    return undefined;\n  }\n  set(value) {\n    return value;\n  }\n}\n';
const sameAnchorScript = createSemanticEditScript({
  id: 'semantic_edit_sibling_same_anchor_insertions',
  language: 'typescript',
  sourcePath: 'src/sibling.ts',
  baseSourceText: sameAnchorBase,
  workerSourceText: sameAnchorWorker,
  headSourceText: sameAnchorHead,
  generatedAt: 90
});
assert.equal(sameAnchorScript.admission.status, 'auto-merge-candidate');
assert.equal(sameAnchorScript.operations.filter((operation) => operation.anchor.symbolName?.startsWith('Store.') && operation.status === 'portable').length, 2);
const sameAnchorProjection = projectSemanticEditScriptToSource({
  script: sameAnchorScript,
  workerSourceText: sameAnchorWorker,
  headSourceText: sameAnchorHead
});
assert.equal(sameAnchorProjection.status, 'projected');
assert.equal(sameAnchorProjection.sourceText, sameAnchorExpected);
assert.equal(sameAnchorProjection.edits.length, 2);
assert.equal(sameAnchorProjection.edits.every((edit) => edit.editKind === 'insert'), true);
assert.deepEqual(sameAnchorProjection.edits.map((edit) => edit.symbolName), ['Store.reset', 'Store.clear']);
assert.deepEqual(sameAnchorProjection.edits.map((edit) => edit.editOrder), [0, 1]);
assert.equal(sameAnchorProjection.skippedOperations.length, 2);
assert.equal(sameAnchorProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), false);
const sameAnchorReplay = replaySemanticEditProjection({ projection: sameAnchorProjection, currentSourceText: sameAnchorHead });
assert.equal(sameAnchorReplay.status, 'accepted-clean');
assert.equal(sameAnchorReplay.outputSourceText, sameAnchorExpected);

const conflictingInsertionBase = 'export class Store {\n  get() {\n    return 1;\n  }\n}\n';
const conflictingInsertionWorker = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n';
const conflictingInsertionHead = 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 2;\n  }\n}\n';
const conflictingInsertionScript = createSemanticEditScript({
  id: 'semantic_edit_sibling_conflicting_insertion',
  language: 'typescript',
  sourcePath: 'src/sibling.ts',
  baseSourceText: conflictingInsertionBase,
  workerSourceText: conflictingInsertionWorker,
  headSourceText: conflictingInsertionHead,
  generatedAt: 100
});
assert.equal(conflictingInsertionScript.admission.status, 'conflict');
assert.equal(conflictingInsertionScript.operations.some((operation) => operation.anchor.symbolName === 'Store.reset' && operation.status === 'conflict'), true);
const conflictingInsertionProjection = projectSemanticEditScriptToSource({
  script: conflictingInsertionScript,
  workerSourceText: conflictingInsertionWorker,
  headSourceText: conflictingInsertionHead
});
assert.equal(conflictingInsertionProjection.status, 'blocked');
assert.equal(conflictingInsertionProjection.sourceText, undefined);
assert.equal(conflictingInsertionProjection.edits.length, 0);
assert.equal(conflictingInsertionProjection.admission.reasonCodes.includes('script-not-auto-merge-candidate'), true);
assert.equal(conflictingInsertionProjection.admission.reasonCodes.some((reason) => reason.startsWith('operation-not-portable:')), true);
