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
