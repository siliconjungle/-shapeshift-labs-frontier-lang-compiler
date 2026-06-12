import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'public class Store {\n  public static String save(String title) {\n    return title.trim();\n  }\n\n  public String label(String title) {\n    return title.trim();\n  }\n\n  class Inner {\n    int value(int count) {\n      return count;\n    }\n  }\n}\n\nclass Helper {\n  public String save(String title) {\n    return title.trim();\n  }\n}\n';
const workerSource = baseSource.replace('return title.trim();\n  }\n\n  public String label', 'return title.trim().toUpperCase();\n  }\n\n  public String label');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'java',
  sourcePath: 'Store.java',
  sourceText: baseSource
});

const staticSymbol = symbolByName(imported, 'Store.static.save');
const memberSymbol = symbolByName(imported, 'Store.label');
const helperSymbol = symbolByName(imported, 'Helper.save');
const nestedSymbol = symbolByName(imported, 'Store.Inner.value');
assert.equal(staticSymbol.kind, 'method');
assert.equal(memberSymbol.kind, 'method');
assert.equal(helperSymbol.kind, 'method');
assert.equal(nestedSymbol.kind, 'method');
assert.equal(staticSymbol.metadata.receiverKind, 'static');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(helperSymbol.metadata.owner, 'Helper');
assert.equal(nestedSymbol.metadata.owner, 'Store.Inner');

const staticNode = nativeNodeForSymbol(imported, 'Store.static.save');
assert.equal(staticNode.kind, 'MethodDeclaration');
assert.deepEqual(staticNode.fields.parameters, ['String title']);
assert.deepEqual(staticNode.fields.modifiers, ['public', 'static']);

const nestedNode = nativeNodeForSymbol(imported, 'Store.Inner.value');
assert.equal(nestedNode.kind, 'MethodDeclaration');
assert.deepEqual(nestedNode.fields.parameters, ['int count']);
assert.equal(symbolByName(imported, 'save'), undefined);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.static.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.label'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Helper.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.Inner.value'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_java_static_method',
  language: 'java',
  sourcePath: 'Store.java',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 210
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Store.static.save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
