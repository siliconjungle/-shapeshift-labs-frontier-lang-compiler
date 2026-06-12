import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export const actions = {\n  save: (title: string) => {\n    return title.trim();\n  },\n  reset() {\n    return 0;\n  }\n};\n';
const workerSource = baseSource.replace('title.trim()', 'title.trim().toUpperCase()');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/actions.ts',
  sourceText: baseSource
});
for (const name of ['actions.save', 'actions.reset']) {
  const symbol = imported.semanticIndex.symbols.find((entry) => entry.name === name);
  assert.equal(symbol.kind, 'function');
  assert.equal(symbol.metadata.ownershipRegionKind, 'body');
  assert.equal(symbol.metadata.hasBody, true);
}
assert.equal(imported.semanticIndex.facts.some((fact) => fact.subjectId === 'symbol:typescript:actions' && fact.predicate === 'controlFlow'), false);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'actions:controlFlow:exit#1'), false);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'actions.save:controlFlow:exit#1'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_typescript_object_function_property',
  language: 'typescript',
  sourcePath: 'src/actions.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 170
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'actions.save:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: headSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, expectedSource);

const wrappedBaseSource = 'export const actions = defineActions({\n  save(ctx) {\n    return ctx.title.trim();\n  },\n  reset(ctx) {\n    return ctx.empty();\n  }\n});\n';
const wrappedWorkerSource = wrappedBaseSource.replace('ctx.title.trim()', 'ctx.title.trim().toUpperCase()');
const wrappedHeadSource = `// coordinator moved this file\n${wrappedBaseSource}`;
const wrappedExpectedSource = `// coordinator moved this file\n${wrappedWorkerSource}`;
const wrappedImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/wrapped-actions.ts',
  sourceText: wrappedBaseSource
});
assert.equal(wrappedImport.semanticIndex.symbols.some((symbol) => symbol.name === 'actions.save' && symbol.metadata.ownershipRegionKind === 'body'), true);

const wrappedSidecar = createSemanticImportSidecar(wrappedImport);
assert.equal(wrappedSidecar.symbols.some((symbol) => symbol.name === 'actions.save:controlFlow:exit#1'), true);
assert.equal(wrappedSidecar.symbols.some((symbol) => symbol.name === 'actions:controlFlow:exit#1'), false);

const wrappedScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_wrapped_object_function',
  language: 'typescript',
  sourcePath: 'src/wrapped-actions.ts',
  baseSourceText: wrappedBaseSource,
  workerSourceText: wrappedWorkerSource,
  headSourceText: wrappedHeadSource,
  generatedAt: 171
});
assert.equal(wrappedScript.admission.status, 'auto-merge-candidate');
assert.equal(wrappedScript.operations.length, 1);
assert.equal(wrappedScript.operations[0].kind, 'replaceControlFlow');
assert.equal(wrappedScript.operations[0].anchor.symbolName, 'actions.save:controlFlow:exit#1');

const wrappedProjection = projectSemanticEditScriptToSource({ script: wrappedScript, workerSourceText: wrappedWorkerSource, headSourceText: wrappedHeadSource });
assert.equal(wrappedProjection.status, 'projected');
assert.equal(wrappedProjection.sourceText, wrappedExpectedSource);

const wrappedReplay = replaySemanticEditProjection({ projection: wrappedProjection, currentSourceText: wrappedHeadSource });
assert.equal(wrappedReplay.status, 'accepted-clean');
assert.equal(wrappedReplay.outputSourceText, wrappedExpectedSource);
