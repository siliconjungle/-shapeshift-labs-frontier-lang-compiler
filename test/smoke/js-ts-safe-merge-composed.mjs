import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeGateIds,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const composedBase = [
  "import { readFile } from 'node:fs';",
  'export interface Options {',
  '  enabled: boolean;',
  '}',
  'export function stable() {',
  '  return readFile;',
  '}',
  ''
].join('\n');

const composedWorker = [
  "import { readFile, writeFile } from 'node:fs';",
  'export interface Options {',
  '  enabled: boolean;',
  '  label?: string;',
  '}',
  'export function stable() {',
  '  return readFile;',
  '}',
  'export function workerOnly() {',
  '  return writeFile;',
  '}',
  ''
].join('\n');

const composedHead = [
  "import { readFile, stat } from 'node:fs';",
  'export interface Options {',
  '  enabled: boolean;',
  '  retries: number;',
  '}',
  'export function stable() {',
  '  return readFile;',
  '}',
  'export const headOnly = 1;',
  ''
].join('\n');

const composed = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_composes_top_level_and_member_additions',
  language: 'typescript',
  sourcePath: 'src/composed.ts',
  baseSourceText: composedBase,
  workerSourceText: composedWorker,
  headSourceText: composedHead,
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
});

assert.equal(composed.status, 'merged');
assert.equal(composed.admission.status, 'auto-merge-candidate');
assert.equal(composed.summary.importSpecifierAdditions, 2);
assert.equal(composed.summary.topLevelDeclarationAdditions, 1);
assert.equal(composed.summary.memberRegions, 1);
assert.equal(composed.summary.memberAdditions, 2);
assert.equal(composed.gates.every((gate) => gate.status === 'passed'), true);
assert.equal(composed.mergedSourceText, [
  "import { readFile, stat, writeFile } from 'node:fs';",
  'export interface Options {',
  '  enabled: boolean;',
  '  retries: number;',
  '  label?: string;',
  '}',
  'export function stable() {',
  '  return readFile;',
  '}',
  'export const headOnly = 1;',
  'export function workerOnly() {',
  '  return writeFile;',
  '}',
  ''
].join('\n'));
assert.equal(composed.semanticArtifacts.status, 'verified');
assert.equal(composed.semanticArtifacts.summary.operations, 3);
assert.equal(composed.semanticArtifacts.projection.sourceText, composed.mergedSourceText);
assert.equal(composed.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(composed.semanticArtifacts.replay.outputSourceText, composed.mergedSourceText);
assert.equal(composed.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');
assert.equal(
  composed.semanticArtifacts.projection.edits.some((edit) => edit.kind === 'jsTsReplaceDeclaration'),
  true
);

const composedMemberConflict = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_composed_member_conflict_blocks_partial_top_level_output',
  language: 'typescript',
  sourcePath: 'src/composed-conflict.ts',
  baseSourceText: composedBase,
  workerSourceText: composedWorker,
  headSourceText: [
    "import { readFile, stat } from 'node:fs';",
    'export interface Options {',
    '  enabled: boolean;',
    '  label?: number;',
    '}',
    'export function stable() {',
    '  return readFile;',
    '}',
    'export const headOnly = 1;',
    ''
  ].join('\n'),
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
});

assert.equal(composedMemberConflict.status, 'blocked');
assert.equal(composedMemberConflict.mergedSourceText, undefined);
assert.equal(composedMemberConflict.outputSourceText, undefined);
assert.equal(composedMemberConflict.admission.reasonCodes.includes('duplicate-member-name'), true);
assert.equal(
  composedMemberConflict.gates.some((gate) => gate.id === JsTsSafeMergeGateIds.uniqueNames && gate.status === 'blocked'),
  true
);
