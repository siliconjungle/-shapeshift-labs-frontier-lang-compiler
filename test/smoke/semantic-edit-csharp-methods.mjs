import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'public class Store {\n  public static string Save(string title) {\n    return title.Trim();\n  }\n\n  public string Label(string title) {\n    return title.Trim();\n  }\n}\n\npublic static class StoreExtensions {\n  public static string Save(this Store store, string title) {\n    return title.Trim();\n  }\n}\n';
const workerSource = baseSource.replace('return title.Trim();\n  }\n\n  public string Label', 'return title.Trim().ToUpperInvariant();\n  }\n\n  public string Label');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;

const imported = importNativeSource({
  language: 'csharp',
  sourcePath: 'Store.cs',
  sourceText: baseSource
});

const staticSymbol = symbolByName(imported, 'Store.static.Save');
const memberSymbol = symbolByName(imported, 'Store.Label');
const extensionSymbol = symbolByName(imported, 'Store.extension.Save');
assert.equal(staticSymbol.kind, 'method');
assert.equal(memberSymbol.kind, 'method');
assert.equal(extensionSymbol.kind, 'method');
assert.equal(staticSymbol.metadata.receiverKind, 'static');
assert.equal(memberSymbol.metadata.receiverKind, 'member');
assert.equal(extensionSymbol.metadata.receiverKind, 'extension');

const extensionNode = nativeNodeForSymbol(imported, 'Store.extension.Save');
assert.equal(extensionNode.kind, 'ExtensionMethodDeclaration');
assert.deepEqual(extensionNode.fields.parameters, ['this Store store', 'string title']);
assert.deepEqual(extensionNode.fields.extensionReceiver, { type: 'Store', name: 'store' });

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.static.Save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.Label'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.extension.Save'), true);

const nestedImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'Nested.cs',
  sourceText: 'class Store {\n  int Outer() {\n    int Helper() {\n      return 1;\n    }\n    return Helper();\n  }\n}\n'
});
assert.equal(symbolByName(nestedImport, 'Store.Outer').kind, 'method');
assert.equal(symbolByName(nestedImport, 'Helper').kind, 'function');
assert.equal(symbolByName(nestedImport, 'Store.Helper'), undefined);

const script = createSemanticEditScript({
  id: 'semantic_edit_csharp_static_method',
  language: 'csharp',
  sourcePath: 'Store.cs',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 205
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Store.static.Save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: laterHeadSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, laterExpectedSource);
assert.equal(replay.edits[0].reasonCodes.includes('offset-reanchored-by-symbol'), true);
