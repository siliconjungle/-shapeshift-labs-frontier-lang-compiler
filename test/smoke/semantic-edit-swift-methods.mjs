import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'protocol Renderable {\n  func draw() -> String\n}\n\nstruct Counter {\n  static func make(count: Int) -> Int {\n    return count + 1\n  }\n\n  func add(count: Int) -> Int {\n    return count + 1\n  }\n\n  var label: String {\n    return "counter"\n  }\n}\n\nextension Counter {\n  func reset() -> Int {\n    return 0\n  }\n\n  static var empty: Counter {\n    return Counter()\n  }\n}\n\nextension Renderable {\n  func render() -> String {\n    return draw()\n  }\n}\n\nstruct Helper {\n  func add(count: Int) -> Int {\n    return count + 1\n  }\n}\n';
const workerSource = baseSource.replace('return count + 1\n  }\n\n  func add', 'return count + 2\n  }\n\n  func add');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'swift',
  sourcePath: 'Sources/Counter.swift',
  sourceText: baseSource
});

const staticSymbol = symbolByName(imported, 'Counter.static.make');
const memberSymbol = symbolByName(imported, 'Counter.add');
const helperSymbol = symbolByName(imported, 'Helper.add');
const propertySymbol = symbolByName(imported, 'Counter.label');
const extensionSymbol = symbolByName(imported, 'Counter.extension.reset');
const staticExtensionProperty = symbolByName(imported, 'Counter.extension.static.empty');
const protocolExtensionSymbol = symbolByName(imported, 'Renderable.protocolExtension.render');
assert.equal(staticSymbol.kind, 'method');
assert.equal(memberSymbol.kind, 'method');
assert.equal(helperSymbol.kind, 'method');
assert.equal(propertySymbol.kind, 'property');
assert.equal(extensionSymbol.kind, 'method');
assert.equal(staticExtensionProperty.kind, 'property');
assert.equal(protocolExtensionSymbol.kind, 'method');
assert.equal(staticSymbol.metadata.receiverKind, 'static');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(extensionSymbol.metadata.receiverKind, 'extension');
assert.equal(staticExtensionProperty.metadata.receiverKind, 'static');
assert.equal(protocolExtensionSymbol.metadata.receiverKind, 'protocolExtension');
assert.equal(symbolByName(imported, 'add'), undefined);

const staticNode = nativeNodeForSymbol(imported, 'Counter.static.make');
assert.equal(staticNode.kind, 'FunctionDecl');
assert.deepEqual(staticNode.fields.parameters, ['count: Int']);
assert.deepEqual(staticNode.fields.modifiers, ['static']);

const protocolExtensionNode = nativeNodeForSymbol(imported, 'Renderable.protocolExtension.render');
assert.equal(protocolExtensionNode.fields.receiverType, 'Renderable');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Counter.static.make'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Counter.add'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Helper.add'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Counter.extension.reset'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Counter.extension.static.empty'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_swift_static_method',
  language: 'swift',
  sourcePath: 'Sources/Counter.swift',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 215
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Counter.static.make:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
