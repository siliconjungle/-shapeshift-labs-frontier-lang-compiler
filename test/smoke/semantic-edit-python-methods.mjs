import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'class Store:\n    @classmethod\n    def save(cls, title):\n        clean = title.strip()\n        return clean\n\n';
const workerSource = baseSource.replace('title.strip()', 'title.strip().upper()');
const headSource = `# coordinator moved this file\n${baseSource}`;
const expectedSource = `# coordinator moved this file\n${workerSource}`;
const laterHeadSource = `# later coordinator note\n${headSource}`;
const laterExpectedSource = `# later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'python',
  sourcePath: 'store.py',
  sourceText: baseSource
});

const saveSymbol = symbolByName(imported, 'Store.save');
assert.equal(saveSymbol.kind, 'method');
assert.equal(saveSymbol.metadata.owner, 'Store');
assert.equal(saveSymbol.metadata.methodName, 'save');
assert.deepEqual(saveSymbol.metadata.decorators, ['classmethod']);
assert.equal(saveSymbol.metadata.ownershipRegionKind, 'body');
assert.equal(saveSymbol.definitionSpan.startLine, 3);
assert.equal(saveSymbol.definitionSpan.endLine, 7);

const saveNode = nativeNodeForSymbol(imported, 'Store.save');
assert.equal(saveNode.kind, 'FunctionDef');
assert.equal(saveNode.fields.owner, 'Store');
assert.equal(saveNode.fields.methodName, 'save');
assert.deepEqual(saveNode.fields.parameters, ['cls', 'title']);
assert.deepEqual(saveNode.fields.decorators, ['classmethod']);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(
  sidecar.ownershipRegions.some((region) => region.regionKind === 'mutation' && region.symbolName === 'Store.save:mutation:assignment#1'),
  true
);
assert.equal(
  sidecar.ownershipRegions.some((region) => region.regionKind === 'controlFlow' && region.symbolName === 'Store.save:controlFlow:exit#1'),
  true
);

const nestedImport = importNativeSource({
  language: 'python',
  sourcePath: 'nested.py',
  sourceText: 'class Store:\n    def outer(self):\n        def helper():\n            return 1\n        return helper()\n'
});
assert.equal(symbolByName(nestedImport, 'Store.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_python_decorated_method',
  language: 'python',
  sourcePath: 'store.py',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 175
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceMutation');
assert.equal(script.operations[0].anchor.symbolName, 'Store.save:mutation:assignment#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
