import { assert } from './helpers.mjs';
import { mergeJsTsSafeMemberAdditions, safeMergeJsTsMembers } from '../../src/js-ts-semantic-merge.js';

const interfaceBase = 'export interface Options {\n  enabled: boolean;\n}\n';
const interfaceWorker = 'export interface Options {\n  enabled: boolean;\n  label?: string;\n}\n';
const interfaceHead = 'export interface Options {\n  enabled: boolean;\n  retries: number;\n}\n';
const interfaceMerged = mergeJsTsSafeMemberAdditions({
  baseSourceText: interfaceBase,
  workerSourceText: interfaceWorker,
  headSourceText: interfaceHead,
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
});
assert.equal(interfaceMerged.status, 'merged');
assert.equal(interfaceMerged.sourceText, 'export interface Options {\n  enabled: boolean;\n  retries: number;\n  label?: string;\n}\n');
assert.deepEqual(interfaceMerged.mergedRegions[0].workerAddedKeys, ['label']);
assert.deepEqual(interfaceMerged.mergedRegions[0].headAddedKeys, ['retries']);

const typeBase = 'export type Runner = {\n  run(value: string): string;\n};\n';
const typeWorker = 'export type Runner = {\n  run(value: string): string;\n  timeoutMs?: number;\n};\n';
const typeHead = 'export type Runner = {\n  run(value: string): string;\n  signal?: AbortSignal;\n};\n';
const typeMerged = safeMergeJsTsMembers({
  baseSourceText: typeBase,
  workerSourceText: typeWorker,
  headSourceText: typeHead,
  policy: { unorderedRegions: [{ kind: 'type', name: 'Runner', order: 'non-semantic' }] }
});
assert.equal(typeMerged.status, 'merged');
assert.equal(typeMerged.sourceText, 'export type Runner = {\n  run(value: string): string;\n  signal?: AbortSignal;\n  timeoutMs?: number;\n};\n');

const objectBase = "export const config = {\n  mode: 'a',\n};\n";
const objectWorker = "export const config = {\n  mode: 'a',\n  flag: true,\n};\n";
const objectHead = "export const config = {\n  mode: 'a',\n  count: 1,\n};\n";
const objectMerged = mergeJsTsSafeMemberAdditions({
  baseSourceText: objectBase,
  workerSourceText: objectWorker,
  headSourceText: objectHead,
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
});
assert.equal(objectMerged.status, 'merged');
assert.equal(objectMerged.sourceText, "export const config = {\n  mode: 'a',\n  count: 1,\n  flag: true,\n};\n");
assert.equal(objectMerged.summary.appliedAdditions, 1);

assertRejected('duplicate added property keys', {
  baseSourceText: objectBase,
  workerSourceText: objectWorker,
  headSourceText: "export const config = {\n  mode: 'a',\n  flag: false,\n};\n",
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
}, 'duplicate-added-key:flag');

assertRejected('spread object member', {
  baseSourceText: objectBase,
  workerSourceText: "export const config = {\n  mode: 'a',\n  ...defaults,\n};\n",
  headSourceText: objectHead,
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
}, 'spread-member');

assertRejected('computed object key', {
  baseSourceText: objectBase,
  workerSourceText: "export const config = {\n  mode: 'a',\n  ['flag']: true,\n};\n",
  headSourceText: objectHead,
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
}, 'computed-key');

assertRejected('changed existing member text', {
  baseSourceText: interfaceBase,
  workerSourceText: 'export interface Options {\n  enabled: string;\n  label?: string;\n}\n',
  headSourceText: interfaceHead,
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
}, 'existing-member-changed:worker:enabled');

assertRejected('order sensitive object region', {
  baseSourceText: 'export const routes = {\n  home: "/",\n};\n',
  workerSourceText: 'export const routes = {\n  home: "/",\n  admin: "/admin",\n};\n',
  headSourceText: 'export const routes = {\n  home: "/",\n  docs: "/docs",\n};\n',
  policy: { unorderedRegions: [{ kind: 'object', name: 'routes', regionKind: 'route', order: 'non-semantic' }] }
}, 'order-sensitive-region-kind:route');

assertRejected('missing non semantic policy', {
  baseSourceText: typeBase,
  workerSourceText: typeWorker,
  headSourceText: typeHead,
  policy: { unorderedRegions: [{ kind: 'type', name: 'Runner' }] }
}, 'region-not-declared-non-semantic');

function assertRejected(label, input, reason) {
  const result = mergeJsTsSafeMemberAdditions(input);
  assert.equal(result.status, 'rejected', label);
  assert.equal(result.sourceText, undefined, label);
  assert.equal(result.reasonCodes.some((code) => code.includes(reason)), true, `${label}: ${result.reasonCodes.join(', ')}`);
}
