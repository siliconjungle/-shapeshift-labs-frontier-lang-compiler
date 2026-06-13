import { assert, nativeNodeForSymbol, symbolByName } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export class Store {\n  static save(title: string) {\n    return title.trim();\n  }\n\n  save(title: string) {\n    return title.trim();\n  }\n\n  static make = (title: string) => {\n    return title.trim();\n  };\n\n  label = (title: string) => {\n    return title.trim();\n  };\n\n  get summary() {\n    return this.label("x");\n  }\n}\n';
const workerSource = baseSource.replace('return title.trim();\n  }\n\n  save', 'return title.trim().toUpperCase();\n  }\n\n  save');
const memberWorkerSource = baseSource.replace(
  '  save(title: string) {\n    return title.trim();\n  }',
  '  save(title: string) {\n    return title.trim().toLowerCase();\n  }'
);
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;
const laterHeadSource = `// later coordinator note\n${headSource}`;
const laterExpectedSource = `// later coordinator note\n${expectedSource}`;
const staticAndMemberExpectedSource = workerSource.replace(
  '  save(title: string) {\n    return title.trim();\n  }',
  '  save(title: string) {\n    return title.trim().toLowerCase();\n  }'
);

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/store.ts',
  sourceText: baseSource
});

assert.equal(imported.semanticIndex.symbols.filter((symbol) => symbol.name === 'Store.save').length, 1);
assert.equal(symbolByName(imported, 'Store.static.save').kind, 'method');
assert.equal(symbolByName(imported, 'Store.save').kind, 'method');
assert.equal(symbolByName(imported, 'Store.static.make').kind, 'function');
assert.equal(symbolByName(imported, 'Store.label').kind, 'function');
assert.equal(symbolByName(imported, 'Store.summary').kind, 'method');
assert.equal(symbolByName(imported, 'Store.static.save').metadata.receiverKind, 'static');
assert.equal(symbolByName(imported, 'Store.save').metadata.receiverKind, 'member');
assert.equal(symbolByName(imported, 'Store.static.make').metadata.receiverKind, 'static');
assert.equal(symbolByName(imported, 'Store.summary').metadata.accessorKind, 'get');

const staticNode = nativeNodeForSymbol(imported, 'Store.static.save');
assert.equal(staticNode.kind, 'MethodDefinition');
assert.deepEqual(staticNode.fields.modifiers, ['static']);
assert.deepEqual(staticNode.fields.parameters, ['title: string']);

const staticFieldNode = nativeNodeForSymbol(imported, 'Store.static.make');
assert.equal(staticFieldNode.kind, 'PropertyDefinition');
assert.equal(staticFieldNode.fields.initializerKind, 'function');

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.static.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.static.make'), true);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'Store.static.save:controlFlow:exit#1'), true);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'Store.save:controlFlow:exit#1'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_typescript_static_class_member',
  language: 'typescript',
  sourcePath: 'src/store.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 220
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

const memberScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_member_class_method_static_head',
  language: 'typescript',
  sourcePath: 'src/store.ts',
  baseSourceText: baseSource,
  workerSourceText: memberWorkerSource,
  headSourceText: workerSource,
  generatedAt: 221
});
assert.equal(memberScript.admission.status, 'auto-merge-candidate');
assert.equal(memberScript.operations.length, 1);
assert.equal(memberScript.operations[0].kind, 'replaceControlFlow');
assert.equal(memberScript.operations[0].anchor.symbolName, 'Store.save:controlFlow:exit#1');
assert.notEqual(memberScript.operations[0].anchor.conflictKey, script.operations[0].anchor.conflictKey);

const memberProjection = projectSemanticEditScriptToSource({
  script: memberScript,
  workerSourceText: memberWorkerSource,
  headSourceText: workerSource
});
assert.equal(memberProjection.status, 'projected');
assert.equal(memberProjection.sourceText, staticAndMemberExpectedSource);

const memberReplay = replaySemanticEditProjection({
  projection: memberProjection,
  currentSourceText: workerSource
});
assert.equal(memberReplay.status, 'accepted-clean');
assert.equal(memberReplay.outputSourceText, staticAndMemberExpectedSource);

const splitReceiverHeadSource = baseSource.replace(
  'return title.trim();\n  }\n\n  static make',
  'return title.trim().toLowerCase();\n  }\n\n  static make'
);
const splitReceiverExpectedSource = workerSource.replace(
  'return title.trim();\n  }\n\n  static make',
  'return title.trim().toLowerCase();\n  }\n\n  static make'
);
const splitReceiverScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_static_instance_same_name_sibling',
  language: 'typescript',
  sourcePath: 'src/store.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: splitReceiverHeadSource,
  generatedAt: 222
});
assert.equal(splitReceiverScript.admission.status, 'auto-merge-candidate');
assert.equal(splitReceiverScript.operations.length, 1);
assert.equal(splitReceiverScript.operations[0].kind, 'replaceControlFlow');
assert.equal(splitReceiverScript.operations[0].anchor.symbolName, 'Store.static.save:controlFlow:exit#1');
assert.equal(splitReceiverScript.operations[0].reasonCodes.includes('head-anchor-matches-base'), true);

const splitReceiverProjection = projectSemanticEditScriptToSource({
  script: splitReceiverScript,
  workerSourceText: workerSource,
  headSourceText: splitReceiverHeadSource
});
assert.equal(splitReceiverProjection.status, 'projected');
assert.equal(splitReceiverProjection.sourceText, splitReceiverExpectedSource);

const splitReceiverReplay = replaySemanticEditProjection({
  projection: splitReceiverProjection,
  currentSourceText: splitReceiverHeadSource
});
assert.equal(splitReceiverReplay.status, 'accepted-clean');
assert.equal(splitReceiverReplay.outputSourceText, splitReceiverExpectedSource);

const jsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/store.js',
  sourceText: 'class Store {\n  static save(title) { return title.trim(); }\n  save(title) { return title.trim(); }\n}\n'
});
assert.equal(symbolByName(jsImport, 'Store.static.save').kind, 'method');
assert.equal(symbolByName(jsImport, 'Store.save').kind, 'method');
