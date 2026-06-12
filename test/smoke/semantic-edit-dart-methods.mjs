import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'class Store {\n  String save(String title) {\n    return title.trim();\n  }\n}\n\nextension StoreLabels on Store {\n  String label(String title) {\n    return title.trim();\n  }\n}\n\nString save(String title) {\n  return title.trim();\n}\n';
const workerSource = baseSource.replace('return title.trim();\n  }\n}\n\nextension StoreLabels', 'return title.trim().toUpperCase();\n  }\n}\n\nextension StoreLabels');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'dart',
  sourcePath: 'store.dart',
  sourceText: baseSource
});

const memberSymbol = symbolByName(imported, 'Store.save');
const extensionSymbol = symbolByName(imported, 'StoreLabels.extension.label');
const topLevelSymbol = symbolByName(imported, 'save');
assert.equal(memberSymbol.kind, 'method');
assert.equal(extensionSymbol.kind, 'method');
assert.equal(topLevelSymbol.kind, 'function');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(extensionSymbol.metadata.receiverKind, 'extension');
assert.equal(extensionSymbol.metadata.receiverType, 'Store');

const extensionNode = nativeNodeForSymbol(imported, 'StoreLabels.extension.label');
assert.equal(extensionNode.kind, 'FunctionDeclaration');
assert.deepEqual(extensionNode.fields.parameters, ['String title']);
assert.equal(extensionNode.fields.owner, 'StoreLabels.extension');
assert.equal(extensionNode.fields.receiverType, 'Store');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'StoreLabels.extension.label'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'save'), true);

const nestedImport = importNativeSource({
  language: 'dart',
  sourcePath: 'nested.dart',
  sourceText: 'class Store {\n  int outer() {\n    int helper() {\n      return 1;\n    }\n    return helper();\n  }\n}\n'
});
assert.equal(symbolByName(nestedImport, 'Store.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_dart_member_method',
  language: 'dart',
  sourcePath: 'store.dart',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 200
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Store.save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
