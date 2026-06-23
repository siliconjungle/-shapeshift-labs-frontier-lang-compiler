import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const enumValues = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_enum_member_sibling_values',
  language: 'typescript',
  sourcePath: 'src/status.ts',
  baseSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'export enum Status {',
    '  Open = 3,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '  Closed = 4,',
    '}',
    ''
  ].join('\n')
});
assert.equal(enumValues.status, 'merged');
assert.equal(enumValues.mergedSourceText, [
  'export enum Status {',
  '  Open = 3,',
  '  Closed = 4,',
  '}',
  ''
].join('\n'));
assert.equal(enumValues.metadata.composed.phase, 'staged-top-level-enum-member-semantic-fallback');
assert.equal(enumValues.summary.enumMemberDeclarations, 1);
assert.equal(enumValues.summary.enumMemberEdits, 1);
assert.equal(enumValues.semanticArtifacts.status, 'verified');
assert.equal(enumValues.semanticArtifacts.projection.edits[0].symbolKind, 'type');
assert.equal(enumValues.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(enumValues.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const enumAdditions = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_enum_member_sibling_additions',
  language: 'typescript',
  sourcePath: 'src/status.ts',
  baseSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '  Pending = 2,',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '  Closed = 3,',
    '}',
    ''
  ].join('\n')
});
assert.equal(enumAdditions.status, 'merged');
assert.equal(enumAdditions.mergedSourceText, [
  'export enum Status {',
  '  Open = 1,',
  '  Closed = 3,',
  '  Pending = 2,',
  '}',
  ''
].join('\n'));
assert.equal(enumAdditions.summary.enumMemberAdditions, 1);
assert.equal(enumAdditions.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const importEnumValues = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_enum_members_with_imports',
  language: 'typescript',
  sourcePath: 'src/status.ts',
  baseSourceText: [
    "import { base } from './values.js';",
    'export enum Status {',
    '  Open = base,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    "import { base, worker } from './values.js';",
    'export enum Status {',
    '  Open = worker,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    "import { base, head } from './values.js';",
    'export enum Status {',
    '  Open = base,',
    '  Closed = head,',
    '}',
    ''
  ].join('\n')
});
assert.equal(importEnumValues.status, 'merged');
assert.equal(importEnumValues.mergedSourceText, [
  "import { base, head, worker } from './values.js';",
  'export enum Status {',
  '  Open = worker,',
  '  Closed = head,',
  '}',
  ''
].join('\n'));
assert.equal(importEnumValues.summary.importSpecifierAdditions, 2);
assert.equal(importEnumValues.semanticArtifacts.status, 'verified');

const conflictingEnum = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_enum_member_conflict',
  language: 'typescript',
  sourcePath: 'src/status.ts',
  baseSourceText: [
    'export enum Status {',
    '  Open = 1,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  workerSourceText: [
    'export enum Status {',
    '  Open = 3,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n'),
  headSourceText: [
    'export enum Status {',
    '  Open = 4,',
    '  Closed = 2,',
    '}',
    ''
  ].join('\n')
});
assert.equal(conflictingEnum.status, 'blocked');
assert.equal(conflictingEnum.admission.reviewRequired, true);
assert.equal(conflictingEnum.metadata.composed, undefined);

const projectEnum = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_enum_member_siblings',
  language: 'typescript',
  baseFiles: {
    'src/status.ts': [
      'export enum Status {',
      '  Open = 1,',
      '  Closed = 2,',
      '}',
      ''
    ].join('\n')
  },
  workerFiles: {
    'src/status.ts': [
      'export enum Status {',
      '  Open = 3,',
      '  Closed = 2,',
      '}',
      ''
    ].join('\n')
  },
  headFiles: {
    'src/status.ts': [
      'export enum Status {',
      '  Open = 1,',
      '  Closed = 4,',
      '}',
      ''
    ].join('\n')
  }
});
assert.equal(projectEnum.status, 'merged');
assert.equal(projectEnum.outputFiles[0].sourceText, enumValues.mergedSourceText);
assert.equal(projectEnum.files[0].semanticArtifacts.status, 'verified');
