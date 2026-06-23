import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource,
  replaySemanticEditProjection
} from './compiler-api.mjs';

const baseSource = 'export const Button = React.forwardRef((props, ref) => {\n  return <button ref={ref}>{props.label}</button>;\n});\n';
const workerSource = baseSource.replace('props.label}</button>', 'props.label.toUpperCase()}</button>');
const headSource = `// coordinator moved this file\n${baseSource}`;
const expectedSource = `// coordinator moved this file\n${workerSource}`;

const imported = importNativeSource({
  language: 'tsx',
  sourcePath: 'src/button.tsx',
  sourceText: baseSource
});
assert.equal(imported.semanticIndex.facts.some((fact) => fact.predicate === 'mutation'), false);

const sidecar = createSemanticImportSidecar(imported);
assert.equal(sidecar.symbols.some((symbol) => symbol.kind === 'mutation'), false);
assert.equal(sidecar.symbols.some((symbol) => symbol.name === 'Button:controlFlow:exit#1'), true);

const script = createSemanticEditScript({
  id: 'semantic_edit_tsx_jsx_attribute',
  language: 'tsx',
  sourcePath: 'src/button.tsx',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: headSource,
  generatedAt: 180
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.operations.length, 1);
assert.equal(script.operations[0].kind, 'replaceControlFlow');
assert.equal(script.operations[0].anchor.symbolName, 'Button:controlFlow:exit#1');

const projection = projectSemanticEditScriptToSource({ script, workerSourceText: workerSource, headSourceText: headSource });
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, expectedSource);

const replay = replaySemanticEditProjection({ projection, currentSourceText: headSource });
assert.equal(replay.status, 'accepted-clean');
assert.equal(replay.outputSourceText, expectedSource);

const attributeBaseSource = 'export function View() {\n  return <Button tone="base" size="m" />;\n}\n';
const attributeWorkerSource = attributeBaseSource.replace('tone="base"', 'tone="worker"');
const attributeHeadSource = `// layout wrapper moved\n${attributeBaseSource}`;
const attributeExpectedSource = `// layout wrapper moved\n${attributeWorkerSource}`;

const attributeScript = createSemanticEditScript({
  id: 'semantic_edit_tsx_jsx_actual_attribute',
  language: 'tsx',
  sourcePath: 'src/view.tsx',
  baseSourceText: attributeBaseSource,
  workerSourceText: attributeWorkerSource,
  headSourceText: attributeHeadSource,
  generatedAt: 181
});
assert.equal(attributeScript.admission.status, 'auto-merge-candidate');
assert.equal(attributeScript.operations.length, 1);
assert.equal(attributeScript.operations[0].kind, 'replaceControlFlow');
assert.equal(attributeScript.operations[0].anchor.symbolName, 'View:controlFlow:exit#1');
assert.equal(attributeScript.operations[0].reasonCodes.includes('head-anchor-matches-base'), true);

const attributeProjection = projectSemanticEditScriptToSource({
  script: attributeScript,
  workerSourceText: attributeWorkerSource,
  headSourceText: attributeHeadSource
});
assert.equal(attributeProjection.status, 'projected');
assert.equal(attributeProjection.sourceText, attributeExpectedSource);

const attributeReplay = replaySemanticEditProjection({
  projection: attributeProjection,
  currentSourceText: attributeHeadSource
});
assert.equal(attributeReplay.status, 'accepted-clean');
assert.equal(attributeReplay.outputSourceText, attributeExpectedSource);
