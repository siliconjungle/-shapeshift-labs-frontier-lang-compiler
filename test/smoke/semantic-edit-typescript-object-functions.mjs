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

const arrayBaseSource = 'export const tools = defineTools([\n  {\n    name: "save",\n    run(ctx) {\n      return ctx.title.trim();\n    }\n  },\n  {\n    name: "reset",\n    run(ctx) {\n      return ctx.empty();\n    }\n  }\n]);\n';
const arrayWorkerSource = arrayBaseSource.replace('ctx.title.trim()', 'ctx.title.trim().toUpperCase()');
const arrayHeadSource = `// coordinator moved this file\n${arrayBaseSource}`;
const arrayExpectedSource = `// coordinator moved this file\n${arrayWorkerSource}`;
const arrayImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/tool-array.ts',
  sourceText: arrayBaseSource
});
assert.equal(arrayImport.semanticIndex.symbols.some((symbol) => symbol.name === 'tools.save.run' && symbol.metadata.ownershipRegionKind === 'body'), true);

const arraySidecar = createSemanticImportSidecar(arrayImport);
assert.equal(arraySidecar.symbols.some((symbol) => symbol.name === 'tools.save.run:controlFlow:exit#1'), true);
assert.equal(arraySidecar.symbols.some((symbol) => symbol.name === 'tools:controlFlow:exit#1'), false);

const arrayScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_array_object_function',
  language: 'typescript',
  sourcePath: 'src/tool-array.ts',
  baseSourceText: arrayBaseSource,
  workerSourceText: arrayWorkerSource,
  headSourceText: arrayHeadSource,
  generatedAt: 172
});
assert.equal(arrayScript.admission.status, 'auto-merge-candidate');
assert.equal(arrayScript.operations.length, 1);
assert.equal(arrayScript.operations[0].kind, 'replaceControlFlow');
assert.equal(arrayScript.operations[0].anchor.symbolName, 'tools.save.run:controlFlow:exit#1');

const arrayProjection = projectSemanticEditScriptToSource({ script: arrayScript, workerSourceText: arrayWorkerSource, headSourceText: arrayHeadSource });
assert.equal(arrayProjection.status, 'projected');
assert.equal(arrayProjection.sourceText, arrayExpectedSource);

const arrayReplay = replaySemanticEditProjection({ projection: arrayProjection, currentSourceText: arrayHeadSource });
assert.equal(arrayReplay.status, 'accepted-clean');
assert.equal(arrayReplay.outputSourceText, arrayExpectedSource);

const computedBaseSource = 'export const actions = {\n  ["save-action"]: (ctx) => {\n    return ctx.title.trim();\n  },\n  `reset-action`: {\n    run(ctx) {\n      return ctx.empty();\n    }\n  }\n};\n';
const computedWorkerSource = computedBaseSource.replace('ctx.title.trim()', 'ctx.title.trim().toUpperCase()');
const computedHeadSource = `// coordinator moved this file\n${computedBaseSource}`;
const computedExpectedSource = `// coordinator moved this file\n${computedWorkerSource}`;
const computedImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/computed-actions.ts',
  sourceText: computedBaseSource
});
assert.equal(computedImport.semanticIndex.symbols.some((symbol) => symbol.name === 'actions.save-action' && symbol.kind === 'function'), true);
assert.equal(computedImport.semanticIndex.symbols.some((symbol) => symbol.name === 'actions.reset-action' && symbol.kind === 'property'), true);
assert.equal(computedImport.semanticIndex.symbols.some((symbol) => symbol.name === 'actions.reset-action.run' && symbol.kind === 'function'), true);

const computedSidecar = createSemanticImportSidecar(computedImport);
assert.equal(computedSidecar.symbols.some((symbol) => symbol.name === 'actions.save-action:controlFlow:exit#1'), true);
assert.equal(computedSidecar.ownershipRegions.some((region) => region.regionKind === 'body' && region.symbolName === 'actions.reset-action.run'), true);

const computedScript = createSemanticEditScript({
  id: 'semantic_edit_typescript_computed_object_function',
  language: 'typescript',
  sourcePath: 'src/computed-actions.ts',
  baseSourceText: computedBaseSource,
  workerSourceText: computedWorkerSource,
  headSourceText: computedHeadSource,
  generatedAt: 221
});
assert.equal(computedScript.admission.status, 'auto-merge-candidate');
assert.equal(computedScript.operations.length, 1);
assert.equal(computedScript.operations[0].kind, 'replaceControlFlow');
assert.equal(computedScript.operations[0].anchor.symbolName, 'actions.save-action:controlFlow:exit#1');

const computedProjection = projectSemanticEditScriptToSource({ script: computedScript, workerSourceText: computedWorkerSource, headSourceText: computedHeadSource });
assert.equal(computedProjection.status, 'projected');
assert.equal(computedProjection.sourceText, computedExpectedSource);

const computedReplay = replaySemanticEditProjection({ projection: computedProjection, currentSourceText: computedHeadSource });
assert.equal(computedReplay.status, 'accepted-clean');
assert.equal(computedReplay.outputSourceText, computedExpectedSource);
