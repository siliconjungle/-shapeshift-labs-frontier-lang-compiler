import { assert } from './helpers.mjs';
import { createSemanticImportSidecar, importNativeSource } from './compiler-api.mjs';

const storageSource = [
  'export function saveBoth(state) {',
  '  localStorage.setItem("a", state.a); sessionStorage.setItem("b", state.b);',
  '}',
  ''
].join('\n');
const storageSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/storage-occurrences.ts',
  sourceText: storageSource
}), { generatedAt: 211 });
const storageRegions = storageSidecar.ownershipRegions
  .filter((region) => region.symbolName?.startsWith('saveBoth:effect:storage#'));
assert.deepEqual(storageRegions.map((region) => region.symbolName), [
  'saveBoth:effect:storage#1',
  'saveBoth:effect:storage#2'
]);
assert.equal(sourceTextForSpan(storageSource, storageRegions[0].sourceSpan), 'localStorage.setItem("a", state.a);');
assert.equal(sourceTextForSpan(storageSource, storageRegions[1].sourceSpan), 'sessionStorage.setItem("b", state.b);');

const hostSource = [
  'export function report(value) {',
  '  console.log(value); process.emit("metric", value);',
  '}',
  ''
].join('\n');
const hostSidecar = createSemanticImportSidecar(importNativeSource({
  language: 'typescript',
  sourcePath: 'src/host-occurrences.ts',
  sourceText: hostSource
}), { generatedAt: 212 });
const hostRegions = hostSidecar.ownershipRegions
  .filter((region) => region.symbolName?.startsWith('report:effect:host#'));
assert.equal(hostRegions.length, 2);
assert.equal(sourceTextForSpan(hostSource, hostRegions[0].sourceSpan), 'console.log(value);');
assert.equal(sourceTextForSpan(hostSource, hostRegions[1].sourceSpan), 'process.emit("metric", value);');

function sourceTextForSpan(sourceText, span) {
  const line = String(sourceText).split(/\r\n|\n|\r/)[span.startLine - 1];
  return line.slice(span.startColumn - 1, span.endColumn - 1);
}
