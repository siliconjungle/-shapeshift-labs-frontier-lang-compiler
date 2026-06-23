import { assert } from './helpers.mjs';
import { safeMergeJsTsSource } from './compiler-api.mjs';

const mixedInterface = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_direct_interface_import_siblings',
  language: 'typescript',
  sourcePath: 'src/user.ts',
  baseSourceText: [
    'import { z } from \'zod\';',
    'export interface User {',
    '  id: string;',
    '  name: string;',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'import { z, object } from \'zod\';',
    'export interface User {',
    '  id: number;',
    '  name: string;',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'import { z, string } from \'zod\';',
    'export interface User {',
    '  id: string;',
    '  name: string | null;',
    '}',
    ''
  ].join('\n')
});

assert.equal(mixedInterface.status, 'merged');
assert.equal(mixedInterface.mergedSourceText, [
  'import { z, object, string } from \'zod\';',
  'export interface User {',
  '  id: number;',
  '  name: string | null;',
  '}',
  ''
].join('\n'));
assert.equal(mixedInterface.metadata.composed.phase, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(mixedInterface.summary.importSpecifierAdditions, 2);
assert.equal(mixedInterface.summary.semanticEditAppliedOperations, 1);
assert.equal(mixedInterface.semanticArtifacts.metadata.source, 'staged-top-level-direct-semantic-edit-fallback');
assert.equal(mixedInterface.semanticArtifacts.projection.edits[0].symbolName, 'User.id');
assert.equal(mixedInterface.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(mixedInterface.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const mixedTypeAlias = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_staged_direct_type_alias_import_declaration_siblings',
  language: 'typescript',
  sourcePath: 'src/config.ts',
  baseSourceText: [
    'export type Config = {',
    '  enabled: boolean;',
    '  label: string;',
    '};',
    ''
  ].join('\n'),
  workerSourceText: [
    'import { parse } from \'./parse.js\';',
    'export type Config = {',
    '  enabled: true;',
    '  label: string;',
    '};',
    ''
  ].join('\n'),
  headSourceText: [
    'export type Config = {',
    '  enabled: boolean;',
    '  label: string | null;',
    '};',
    'export const headOnly = 1;',
    ''
  ].join('\n')
});

assert.equal(mixedTypeAlias.status, 'merged');
assert.equal(mixedTypeAlias.mergedSourceText, [
  'import { parse } from \'./parse.js\';',
  'export type Config = {',
  '  enabled: true;',
  '  label: string | null;',
  '};',
  'export const headOnly = 1;',
  ''
].join('\n'));
assert.equal(mixedTypeAlias.summary.importDeclarationAdditions, 1);
assert.equal(mixedTypeAlias.summary.topLevelDeclarationAdditions, 1);
assert.equal(mixedTypeAlias.summary.semanticEditReplayStatus, 'accepted-clean');
