import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const baseFunctions = [
  'export function a() { return 1; }',
  'export function b() { return 2; }',
  ''
].join('\n');
const workerFunctions = [
  'export function a() { return 3; }',
  'export function b() { return 2; }',
  ''
].join('\n');
const headFunctions = [
  'export function a() { return 1; }',
  'export function b() { return 4; }',
  ''
].join('\n');
const mergedFunctions = [
  'export function a() { return 3; }',
  'export function b() { return 4; }',
  ''
].join('\n');
const functionSiblings = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_top_level_function_sibling_bodies',
  language: 'typescript',
  sourcePath: 'src/functions.ts',
  baseSourceText: baseFunctions,
  workerSourceText: workerFunctions,
  headSourceText: headFunctions
});
assert.equal(functionSiblings.status, 'merged');
assert.equal(functionSiblings.mergedSourceText, mergedFunctions);
assert.equal(functionSiblings.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(functionSiblings.semanticArtifacts.projection.sourceText, mergedFunctions);
assert.equal(functionSiblings.semanticArtifacts.replay.outputSourceText, mergedFunctions);
assert.equal(functionSiblings.summary.semanticEditAppliedOperations, 1);

const importBase = [
  'import { readFile } from \'node:fs\';',
  'export function a() { return readFile; }',
  'export function b() { return 2; }',
  ''
].join('\n');
const importWorker = [
  'import { readFile, writeFile } from \'node:fs\';',
  'export function a() { return writeFile; }',
  'export function b() { return 2; }',
  ''
].join('\n');
const importHead = [
  'import { readFile, stat } from \'node:fs\';',
  'export function a() { return readFile; }',
  'export function b() { return 4; }',
  ''
].join('\n');
const importMerged = [
  'import { readFile, stat, writeFile } from \'node:fs\';',
  'export function a() { return writeFile; }',
  'export function b() { return 4; }',
  ''
].join('\n');
const importsAndSiblings = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_imports_and_top_level_function_siblings',
  language: 'typescript',
  sourcePath: 'src/imported-functions.ts',
  baseSourceText: importBase,
  workerSourceText: importWorker,
  headSourceText: importHead
});
assert.equal(importsAndSiblings.status, 'merged');
assert.equal(importsAndSiblings.mergedSourceText, importMerged);
assert.equal(importsAndSiblings.summary.importSpecifierAdditions, 2);
assert.equal(importsAndSiblings.summary.semanticEditAppliedOperations, 1);
assert.equal(importsAndSiblings.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(importsAndSiblings.semanticArtifacts.replay.outputSourceText, importMerged);

const projectSiblings = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_top_level_function_siblings',
  language: 'typescript',
  baseFiles: { 'src/functions.ts': baseFunctions },
  workerFiles: { 'src/functions.ts': workerFunctions },
  headFiles: { 'src/functions.ts': headFunctions }
});
assert.equal(projectSiblings.status, 'merged');
assert.equal(projectSiblings.outputFiles[0].sourceText, mergedFunctions);
assert.equal(projectSiblings.files[0].semanticArtifacts.status, 'verified');
