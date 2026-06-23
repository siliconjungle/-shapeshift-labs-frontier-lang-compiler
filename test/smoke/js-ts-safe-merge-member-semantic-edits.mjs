import { assert } from './helpers.mjs';
import {
  safeMergeJsTsMembers,
  safeMergeJsTsSource
} from './compiler-api.mjs';

const objectBase = [
  'export const counter = {',
  '  step: 1',
  '};',
  ''
].join('\n');
const objectWorker = [
  'export const counter = {',
  '  step: 1,',
  '  label: "worker"',
  '};',
  ''
].join('\n');
const objectHead = [
  'export const counter = {',
  '  step: 1,',
  '  retries: 3',
  '};',
  ''
].join('\n');
const objectPolicy = { unorderedRegions: [{ kind: 'object', name: 'counter', order: 'non-semantic', regionKind: 'config' }] };
const objectAdditions = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_object_member_additions_insert_commas',
  language: 'typescript',
  sourcePath: 'src/object.ts',
  baseSourceText: objectBase,
  workerSourceText: objectWorker,
  headSourceText: objectHead,
  policy: objectPolicy
});

assert.equal(objectAdditions.status, 'merged');
assert.equal(objectAdditions.mergedSourceText, [
  'export const counter = {',
  '  step: 1,',
  '  retries: 3,',
  '  label: "worker"',
  '};',
  ''
].join('\n'));
assert.equal(objectAdditions.summary.memberAdditions, 2);
assert.equal(objectAdditions.semanticArtifacts.status, 'verified');

const objectTrailingCommaPolicy = { unorderedRegions: [{ kind: 'object', name: 'config', order: 'non-semantic', regionKind: 'config' }] };
const objectTrailingCommaAdditions = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_object_member_additions_preserve_base_trailing_comma',
  language: 'typescript',
  sourcePath: 'src/config.ts',
  baseSourceText: [
    'export const config = {',
    '  mode: "a",',
    '};',
    ''
  ].join('\n'),
  workerSourceText: [
    'export const config = {',
    '  mode: "a",',
    '  flag: true,',
    '};',
    ''
  ].join('\n'),
  headSourceText: [
    'export const config = {',
    '  mode: "a",',
    '  count: 1,',
    '};',
    ''
  ].join('\n'),
  policy: objectTrailingCommaPolicy
});

assert.equal(objectTrailingCommaAdditions.status, 'merged');
assert.deepEqual(objectTrailingCommaAdditions.metadata.composed.phases, ['top-level', 'member']);
assert.equal(objectTrailingCommaAdditions.mergedSourceText, [
  'export const config = {',
  '  mode: "a",',
  '  count: 1,',
  '  flag: true,',
  '};',
  ''
].join('\n'));
assert.equal(objectTrailingCommaAdditions.summary.memberAdditions, 2);
assert.equal(objectTrailingCommaAdditions.semanticArtifacts.status, 'verified');

const classBase = [
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '}',
  ''
].join('\n');
const classWorker = [
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 2;',
  '  }',
  '  label() {',
  '    return "worker";',
  '  }',
  '}',
  ''
].join('\n');
const classHead = [
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 1;',
  '  }',
  '  retries() {',
  '    return 3;',
  '  }',
  '}',
  ''
].join('\n');
const classPolicy = { unorderedRegions: [{ kind: 'class', name: 'Counter', order: 'non-semantic' }] };
const classMethodAndMembers = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_class_method_edit_and_member_additions',
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  baseSourceText: classBase,
  workerSourceText: classWorker,
  headSourceText: classHead,
  policy: classPolicy
});

assert.equal(classMethodAndMembers.status, 'merged');
assert.equal(classMethodAndMembers.mergedSourceText, [
  'export class Counter {',
  '  step(v: number) {',
  '    return v + 2;',
  '  }',
  '  retries() {',
  '    return 3;',
  '  }',
  '  label() {',
  '    return "worker";',
  '  }',
  '}',
  ''
].join('\n'));
assert.deepEqual(classMethodAndMembers.metadata.composed.phases, ['top-level-neutralization', 'top-level-ledger', 'semantic-edit', 'member']);
assert.equal(classMethodAndMembers.summary.semanticEditOperations, 1);
assert.equal(classMethodAndMembers.summary.memberAdditions, 2);
assert.equal(classMethodAndMembers.semanticArtifacts.status, 'verified');

const standaloneMemberMerge = safeMergeJsTsMembers({
  id: 'js_ts_members_still_reject_existing_method_edits',
  language: 'typescript',
  sourcePath: 'src/counter.ts',
  baseSourceText: classBase,
  workerSourceText: classWorker,
  headSourceText: classHead,
  policy: classPolicy
});
assert.equal(standaloneMemberMerge.status, 'rejected');
assert.equal(standaloneMemberMerge.admission.reasonCodes.includes('changed-existing-member'), true);

const objectArrow = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_object_arrow_edit_and_properties',
  language: 'typescript',
  sourcePath: 'src/counter-object.ts',
  baseSourceText: [
    'export const counter = {',
    '  step: (v: number) => v + 1',
    '};',
    ''
  ].join('\n'),
  workerSourceText: [
    'export const counter = {',
    '  step: (v: number) => v + 2,',
    '  label: "worker"',
    '};',
    ''
  ].join('\n'),
  headSourceText: [
    'export const counter = {',
    '  step: (v: number) => v + 1,',
    '  retries: 3',
    '};',
    ''
  ].join('\n'),
  policy: objectPolicy
});

assert.equal(objectArrow.status, 'merged');
assert.equal(objectArrow.mergedSourceText, [
  'export const counter = {',
  '  step: (v: number) => v + 2,',
  '  retries: 3,',
  '  label: "worker"',
  '};',
  ''
].join('\n'));
assert.equal(objectArrow.semanticArtifacts.status, 'verified');

const classConflict = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_class_method_conflict_with_member_additions',
  language: 'typescript',
  sourcePath: 'src/counter-conflict.ts',
  baseSourceText: classBase,
  workerSourceText: classWorker,
  headSourceText: classHead.replace('return v + 1;', 'return v + 3;'),
  policy: classPolicy
});

assert.equal(classConflict.status, 'blocked');
assert.equal(classConflict.summary.memberRegions, 1);
assert.equal(classConflict.summary.memberAdditions, 0);
assert.equal(classConflict.semanticArtifacts.status, 'blocked');
assert.equal(classConflict.semanticArtifacts.script.admission.status, 'conflict');
assert.equal(classConflict.admission.reasonCodes.includes('head-anchor-changed-since-base'), true);
