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

const interfaceSiblingEdits = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_interface_member_sibling_edits',
  language: 'typescript',
  sourcePath: 'src/user.ts',
  baseSourceText: [
    'export interface User {',
    '  id: string;',
    '  name: string;',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'export interface User {',
    '  id: number;',
    '  name: string;',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'export interface User {',
    '  id: string;',
    '  name: string | null;',
    '}',
    ''
  ].join('\n')
});
assert.equal(interfaceSiblingEdits.status, 'merged');
assert.equal(interfaceSiblingEdits.mergedSourceText, [
  'export interface User {',
  '  id: number;',
  '  name: string | null;',
  '}',
  ''
].join('\n'));
assert.equal(interfaceSiblingEdits.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(interfaceSiblingEdits.semanticArtifacts.status, 'verified');
assert.equal(interfaceSiblingEdits.semanticArtifacts.replay.outputSourceText, interfaceSiblingEdits.mergedSourceText);

const typeAliasSiblingEdits = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_type_alias_member_sibling_edits',
  language: 'typescript',
  sourcePath: 'src/user-type.ts',
  baseSourceText: [
    'export type User = {',
    '  id: string;',
    '  name: string;',
    '};',
    ''
  ].join('\n'),
  workerSourceText: [
    'export type User = {',
    '  id: number;',
    '  name: string;',
    '};',
    ''
  ].join('\n'),
  headSourceText: [
    'export type User = {',
    '  id: string;',
    '  name: string | null;',
    '};',
    ''
  ].join('\n')
});
assert.equal(typeAliasSiblingEdits.status, 'merged');
assert.equal(typeAliasSiblingEdits.mergedSourceText, [
  'export type User = {',
  '  id: number;',
  '  name: string | null;',
  '};',
  ''
].join('\n'));
assert.equal(typeAliasSiblingEdits.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(typeAliasSiblingEdits.semanticArtifacts.status, 'verified');

const namespaceDeclarationSiblingEdits = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_namespace_declaration_sibling_edits',
  language: 'typescript',
  sourcePath: 'src/namespace.ts',
  baseSourceText: [
    'namespace Runtime {',
    '  export const a = 1;',
    '  export const b = 2;',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'namespace Runtime {',
    '  export const a = 3;',
    '  export const b = 2;',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'namespace Runtime {',
    '  export const a = 1;',
    '  export const b = 4;',
    '}',
    ''
  ].join('\n')
});
assert.equal(namespaceDeclarationSiblingEdits.status, 'merged');
assert.equal(namespaceDeclarationSiblingEdits.mergedSourceText, [
  'namespace Runtime {',
  '  export const a = 3;',
  '  export const b = 4;',
  '}',
  ''
].join('\n'));
assert.equal(namespaceDeclarationSiblingEdits.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(namespaceDeclarationSiblingEdits.semanticArtifacts.status, 'verified');

const moduleDeclarationSiblingEdits = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_module_declaration_sibling_edits',
  language: 'typescript',
  sourcePath: 'src/module.ts',
  baseSourceText: [
    'module Runtime {',
    '  export const a = 1;',
    '  export const b = 2;',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'module Runtime {',
    '  export const a = 3;',
    '  export const b = 2;',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'module Runtime {',
    '  export const a = 1;',
    '  export const b = 4;',
    '}',
    ''
  ].join('\n')
});
assert.equal(moduleDeclarationSiblingEdits.status, 'merged');
assert.equal(moduleDeclarationSiblingEdits.mergedSourceText, [
  'module Runtime {',
  '  export const a = 3;',
  '  export const b = 4;',
  '}',
  ''
].join('\n'));
assert.equal(moduleDeclarationSiblingEdits.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(moduleDeclarationSiblingEdits.semanticArtifacts.status, 'verified');
