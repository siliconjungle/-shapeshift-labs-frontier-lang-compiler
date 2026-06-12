import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export class Store {\n  save = (title: string) => {\n    return title.trim();\n  };\n}\n';
const workerSource = baseSource.replace('title.trim()', 'title.trim().toUpperCase()');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/store.ts',
  sourceText: baseSource
});
const saveSymbol = imported.semanticIndex.symbols.find((symbol) => symbol.name === 'Store.save');
assert.equal(saveSymbol.kind, 'function');
assert.equal(saveSymbol.metadata.ownershipRegionKind, 'body');
assert.equal(saveSymbol.metadata.hasBody, true);
assert.equal(saveSymbol.definitionSpan.startLine, 2);
assert.equal(saveSymbol.definitionSpan.endLine, 4);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'Store.save'), true);
assert.equal(sidecar.symbols.some((symbol) => symbol.kind === 'controlFlow' && symbol.name === 'Store.save:controlFlow:exit#1'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_typescript_class_field_arrow',
  language: 'typescript',
  sourcePath: 'src/store.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 160
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Store.save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: headSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, expectedSource);
