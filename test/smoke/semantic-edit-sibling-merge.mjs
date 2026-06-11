import { assert } from './helpers.mjs';
import { createSemanticEditScript, projectSemanticEditScriptToSource, replaySemanticEditProjection } from './compiler-api.mjs';

const fixtures = [
  {
    id: 'class_method_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 2;\n  }\n  set(value) {\n    return value;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 1;\n  }\n  set(value) {\n    return value + 1;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 2;\n  }\n  set(value) {\n    return value + 1;\n  }\n}\n',
    coveredKind: 'replaceTypeDeclaration',
    portableSymbol: 'Store.get'
  },
  {
    id: 'interface_property_sibling',
    base: 'export interface User {\n  id: string;\n  name: string;\n}\n',
    worker: 'export interface User {\n  id: number;\n  name: string;\n}\n',
    head: 'export interface User {\n  id: string;\n  name: string | null;\n}\n',
    expected: 'export interface User {\n  id: number;\n  name: string | null;\n}\n',
    coveredKind: 'replaceTypeDeclaration',
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
    coveredKind: 'replaceTypeDeclaration',
    portableSymbol: 'Store.reset'
  },
  {
    id: 'class_method_remove_sibling',
    base: 'export class Store {\n  get() {\n    return 1;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    worker: 'export class Store {\n  get() {\n    return 1;\n  }\n}\n',
    head: 'export class Store {\n  get() {\n    return 2;\n  }\n  reset() {\n    return 0;\n  }\n}\n',
    expected: 'export class Store {\n  get() {\n    return 2;\n  }\n}\n',
    coveredKind: 'replaceTypeDeclaration',
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
  assert.equal(script.summary.covered >= 1, true, fixture.id);
  assert.equal(script.operations.some((operation) => operation.kind === fixture.coveredKind && operation.status === 'covered'), true, fixture.id);
  assert.equal(script.operations.some((operation) => operation.anchor.symbolName === fixture.portableSymbol && operation.status === 'portable'), true, fixture.id);
  assert.equal(script.operations.some((operation) => operation.reasonCodes.includes('container-covered-by-child-edits')), true, fixture.id);

  const projection = projectSemanticEditScriptToSource({ script, workerSourceText: fixture.worker, headSourceText: fixture.head });
  assert.equal(projection.status, 'projected', fixture.id);
  assert.equal(projection.sourceText, fixture.expected, fixture.id);
  assert.equal(projection.skippedOperations.length >= 1, true, fixture.id);
  assert.equal(projection.edits.some((edit) => edit.symbolName === fixture.portableSymbol), true, fixture.id);

  const replay = replaySemanticEditProjection({ projection, currentSourceText: fixture.head });
  assert.equal(replay.status, 'accepted-clean', fixture.id);
  assert.equal(replay.outputSourceText, fixture.expected, fixture.id);
}
