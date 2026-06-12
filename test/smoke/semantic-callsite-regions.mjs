import { assert } from './helpers.mjs';
import {
  createSemanticEditScript,
  createSemanticImportSidecar,
  importNativeSource,
  projectSemanticEditScriptToSource
} from './compiler-api.mjs';

const baseSource = [
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value); }',
  ''
].join('\n');
const workerSource = [
  'export function helper(value) { return value; }',
  'export function run(value) { return helper(value, { trace: true }); }',
  ''
].join('\n');

const workerImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  sourceText: workerSource
});
const workerSidecar = createSemanticImportSidecar(workerImport, { generatedAt: 200 });
const callRegion = workerSidecar.ownershipRegions.find((region) => region.regionKind === 'call'
  && region.symbolName === 'run->helper');
assert.ok(callRegion);
assert.equal(sourceTextForSpan(workerSource, callRegion.sourceSpan), 'helper(value, { trace: true })');
assert.equal(callRegion.precision, 'callsite');
assert.equal(workerSidecar.regionTaxonomy.presentKinds.includes('call'), true);
assert.equal(workerSidecar.patchHints.some((hint) => hint.ownershipKey === callRegion.key
  && hint.operation === 'replace-callsite'), true);

const script = createSemanticEditScript({
  id: 'semantic_callsite_replace',
  language: 'typescript',
  sourcePath: 'src/calls.ts',
  baseSourceText: baseSource,
  workerSourceText: workerSource,
  headSourceText: baseSource,
  generatedAt: 201
});
assert.equal(script.admission.status, 'auto-merge-candidate');
assert.equal(script.summary.byKind.replaceCallsite, 1);
assert.equal(script.operations.some((operation) => operation.anchor.regionKind === 'body'
  && operation.anchor.symbolName === 'run'), false);
const callOperation = script.operations.find((operation) => operation.kind === 'replaceCallsite');
assert.ok(callOperation);
assert.equal(callOperation.anchor.symbolName, 'run->helper');
assert.equal(sourceTextForSpan(workerSource, callOperation.spans.worker), 'helper(value, { trace: true })');

const projection = projectSemanticEditScriptToSource({
  id: 'semantic_callsite_projection',
  script,
  workerSourceText: workerSource,
  headSourceText: baseSource
});
assert.equal(projection.status, 'projected');
assert.equal(projection.sourceText, workerSource);
assert.equal(projection.edits.length, 1);
assert.equal(projection.edits[0].kind, 'replaceCallsite');
assert.equal(projection.edits[0].replacementText, 'helper(value, { trace: true })');
assert.equal(projection.edits[0].deletedBytes, 'helper(value)'.length);

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
