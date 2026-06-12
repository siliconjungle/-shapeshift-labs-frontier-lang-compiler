import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'class Store\n  def self.save(title)\n    title.strip\n  end\n\n  def save(title)\n    title.strip\n  end\nend\n';
const workerSource = baseSource.replace('title.strip\n  end\n\n  def save', 'title.strip.upcase\n  end\n\n  def save');
const headSource = `# coordinator moved this file\n${baseSource}`;
const expectedSource = `# coordinator moved this file\n${workerSource}`;
const laterHeadSource = `# later coordinator note\n${headSource}`;
const laterExpectedSource = `# later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'ruby',
  sourcePath: 'store.rb',
  sourceText: baseSource
});

const singletonSymbol = symbolByName(imported, 'Store.singleton.save');
const instanceSymbol = symbolByName(imported, 'Store.instance.save');
assert.equal(singletonSymbol.kind, 'method');
assert.equal(instanceSymbol.kind, 'method');
assert.equal(singletonSymbol.metadata.owner, 'Store');
assert.equal(instanceSymbol.metadata.owner, 'Store');
assert.equal(singletonSymbol.metadata.receiverKind, 'singleton');
assert.equal(instanceSymbol.metadata.receiverKind, 'instance');

const singletonNode = nativeNodeForSymbol(imported, 'Store.singleton.save');
assert.equal(singletonNode.kind, 'Def');
assert.deepEqual(singletonNode.fields.parameters, ['title']);
assert.equal(singletonNode.fields.methodName, 'save');
assert.equal(singletonNode.fields.receiverKind, 'singleton');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.singleton.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.instance.save'), true);

const nestedImport = importNativeSource({
  language: 'ruby',
  sourcePath: 'nested.rb',
  sourceText: 'class Store\n  def outer\n    def helper\n      1\n    end\n    helper\n  end\nend\n'
});
assert.equal(symbolByName(nestedImport, 'Store.instance.outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.instance.helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_ruby_singleton_method',
  language: 'ruby',
  sourcePath: 'store.rb',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 180
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceBody');
assert.equal(script.operations[0].anchor.symbolName, 'Store.singleton.save');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
