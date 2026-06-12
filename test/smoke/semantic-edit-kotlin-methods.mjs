import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'class Store {\n  fun save(title: String): String {\n    return title.trim()\n  }\n}\n\nfun Store.saveStatic(title: String): String {\n  return title.trim()\n}\n';
const workerSource = baseSource.replace('title.trim()\n  }\n}\n\nfun Store.saveStatic', 'title.trim().uppercase()\n  }\n}\n\nfun Store.saveStatic');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'kotlin',
  sourcePath: 'Store.kt',
  sourceText: baseSource
});

const memberSymbol = symbolByName(imported, 'Store.save');
const extensionSymbol = symbolByName(imported, 'Store.extension.saveStatic');
assert.equal(memberSymbol.kind, 'method');
assert.equal(extensionSymbol.kind, 'method');
assert.equal(memberSymbol.metadata.owner, 'Store');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(extensionSymbol.metadata.owner, 'Store');
assert.equal(extensionSymbol.metadata.receiverKind, 'extension');
assert.equal(extensionSymbol.metadata.receiverType, 'Store');

const memberNode = nativeNodeForSymbol(imported, 'Store.save');
assert.equal(memberNode.kind, 'FunctionDeclaration');
assert.deepEqual(memberNode.fields.parameters, ['title: String']);
assert.equal(memberNode.fields.methodName, 'save');
assert.equal(memberNode.fields.receiverKind, 'member');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(
  sidecar.ownershipRegions.some((region) => region.regionKind === 'controlFlow' && region.symbolName === 'Store.save:controlFlow:exit#1'),
  true
);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.extension.saveStatic'), true);

const nestedImport = importNativeSource({
  language: 'kotlin',
  sourcePath: 'Nested.kt',
  sourceText: 'class Store {\n  fun outer(): Int {\n    fun helper(): Int {\n      return 1\n    }\n    return helper()\n  }\n}\n'
});
assert.equal(symbolByName(nestedImport, 'Store.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_kotlin_member_method',
  language: 'kotlin',
  sourcePath: 'Store.kt',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 185
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
