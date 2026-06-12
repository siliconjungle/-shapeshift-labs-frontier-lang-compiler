import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'class Store {\n  def save(title: String): String = {\n    title.trim\n  }\n}\n\nobject Store {\n  def save(title: String): String = {\n    title.trim\n  }\n}\n\ndef save(title: String): String = {\n  title.trim\n}\n';
const workerSource = baseSource.replace('title.trim\n  }\n}\n\nobject Store', 'title.trim.toUpperCase\n  }\n}\n\nobject Store');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'scala',
  sourcePath: 'Store.scala',
  sourceText: baseSource
});

const memberSymbol = symbolByName(imported, 'Store.save');
const objectSymbol = symbolByName(imported, 'Store.object.save');
const topLevelSymbol = symbolByName(imported, 'save');
assert.equal(memberSymbol.kind, 'method');
assert.equal(objectSymbol.kind, 'method');
assert.equal(topLevelSymbol.kind, 'function');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(objectSymbol.metadata.receiverKind, 'object');

const memberNode = nativeNodeForSymbol(imported, 'Store.save');
assert.equal(memberNode.kind, 'DefDef');
assert.deepEqual(memberNode.fields.parameters, ['title: String']);
assert.equal(memberNode.fields.owner, 'Store');
assert.equal(memberNode.fields.methodName, 'save');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.object.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'save'), true);

const nestedImport = importNativeSource({
  language: 'scala',
  sourcePath: 'Nested.scala',
  sourceText: 'class Store {\n  def outer(): Int = {\n    def helper(): Int = {\n      1\n    }\n    helper()\n  }\n}\n'
});
assert.equal(symbolByName(nestedImport, 'Store.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_scala_member_method',
  language: 'scala',
  sourcePath: 'Store.scala',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 195
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceBody');
assert.equal(script.operations[0].anchor.symbolName, 'Store.save');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
