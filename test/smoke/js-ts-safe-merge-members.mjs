import { assert } from './helpers.mjs';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds,
  mergeJsTsSafeMemberAdditions,
  safeMergeJsTsMembers
} from '../../src/js-ts-semantic-merge.js';

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

const classBase = 'export class Store {\n  save(value: string) {\n    return value.trim();\n  }\n}\n';
const classWorker = 'export class Store {\n  save(value: string) {\n    return value.trim();\n  }\n\n  load(value: string) {\n    return value;\n  }\n}\n';
const classHead = 'export class Store {\n  save(value: string) {\n    return value.trim();\n  }\n\n  static create() {\n    return new Store();\n  }\n}\n';
const classMerged = mergeJsTsSafeMemberAdditions({
  baseSourceText: classBase,
  workerSourceText: classWorker,
  headSourceText: classHead,
  policy: { unorderedRegions: [{ kind: 'class', name: 'Store', order: 'non-semantic' }] }
});
assert.equal(classMerged.status, 'merged');
assert.equal(classMerged.sourceText, 'export class Store {\n  save(value: string) {\n    return value.trim();\n  }\n\n  static create() {\n    return new Store();\n  }\n  load(value: string) {\n    return value;\n  }\n}\n');
assert.deepEqual(classMerged.mergedRegions[0].workerAddedKeys, ['load']);
assert.deepEqual(classMerged.mergedRegions[0].headAddedKeys, ['static.create']);

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
}, 'duplicate-added-key:flag', JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames, 'duplicate-member-name');

assertRejected('spread object member', {
  baseSourceText: objectBase,
  workerSourceText: "export const config = {\n  mode: 'a',\n  ...defaults,\n};\n",
  headSourceText: objectHead,
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
}, 'spread-like-member', JsTsSafeMergeConflictCodes.parserLedgerLoss, JsTsSafeMergeGateIds.parseLedger, 'spread-like-member');

assertRejected('computed object key', {
  baseSourceText: objectBase,
  workerSourceText: "export const config = {\n  mode: 'a',\n  ['flag']: true,\n};\n",
  headSourceText: objectHead,
  policy: { unorderedRegions: [{ kind: 'object', name: 'config', regionKind: 'config', order: 'non-semantic' }] }
}, 'computed-key', JsTsSafeMergeConflictCodes.computedKey, JsTsSafeMergeGateIds.parseLedger, 'computed-key');

assertRejected('computed interface key', {
  baseSourceText: interfaceBase,
  workerSourceText: 'export interface Options {\n  enabled: boolean;\n  readonly [key: string]: unknown;\n}\n',
  headSourceText: interfaceHead,
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
}, 'computed-key', JsTsSafeMergeConflictCodes.computedKey, JsTsSafeMergeGateIds.parseLedger, 'computed-key');

assertRejected('type overload collision', {
  baseSourceText: typeBase,
  workerSourceText: 'export type Runner = {\n  run(value: string): string;\n  run(value: number): string;\n};\n',
  headSourceText: typeHead,
  policy: { unorderedRegions: [{ kind: 'type', name: 'Runner', order: 'non-semantic' }] }
}, 'overload-collision:worker:run', JsTsSafeMergeConflictCodes.unsupportedOverload, JsTsSafeMergeGateIds.uniqueNames, 'overload-collision');

assertRejected('class overload collision', {
  baseSourceText: classBase,
  workerSourceText: 'export class Store {\n  save(value: string): string;\n  save(value: number): string;\n  save(value: string | number) {\n    return String(value);\n  }\n}\n',
  headSourceText: classHead,
  policy: { unorderedRegions: [{ kind: 'class', name: 'Store', order: 'non-semantic' }] }
}, 'overload-collision:worker:save', JsTsSafeMergeConflictCodes.unsupportedOverload, JsTsSafeMergeGateIds.uniqueNames, 'overload-collision');

assertRejected('changed existing member text', {
  baseSourceText: interfaceBase,
  workerSourceText: 'export interface Options {\n  enabled: string;\n  label?: string;\n}\n',
  headSourceText: interfaceHead,
  policy: { unorderedRegions: [{ kind: 'interface', name: 'Options', order: 'non-semantic' }] }
}, 'existing-member-changed:worker:enabled', JsTsSafeMergeConflictCodes.changedExistingDeclaration, JsTsSafeMergeGateIds.stableExistingDeclarations, 'changed-existing-member');

assertRejected('order sensitive object region', {
  baseSourceText: 'export const routes = {\n  home: "/",\n};\n',
  workerSourceText: 'export const routes = {\n  home: "/",\n  admin: "/admin",\n};\n',
  headSourceText: 'export const routes = {\n  home: "/",\n  docs: "/docs",\n};\n',
  policy: { unorderedRegions: [{ kind: 'object', name: 'routes', regionKind: 'route', order: 'non-semantic' }] }
}, 'order-sensitive-region-kind:route', JsTsSafeMergeConflictCodes.topLevelOrderChanged, JsTsSafeMergeGateIds.preserveBaseOrder, 'order-sensitive-region-kind');

assertRejected('missing non semantic policy', {
  baseSourceText: typeBase,
  workerSourceText: typeWorker,
  headSourceText: typeHead,
  policy: { unorderedRegions: [{ kind: 'type', name: 'Runner' }] }
}, 'region-not-declared-non-semantic', JsTsSafeMergeConflictCodes.invalidInput, JsTsSafeMergeGateIds.parseLedger, 'invalid-input');

function assertRejected(label, input, reason, code, gateId, blockedReasonCode) {
  const result = mergeJsTsSafeMemberAdditions(input);
  assert.equal(result.status, 'rejected', label);
  assert.equal(result.sourceText, undefined, label);
  assert.equal(result.reasonCodes.some((code) => code.includes(reason)), true, `${label}: ${result.reasonCodes.join(', ')}`);
  assert.equal(result.admission.status, 'blocked', label);
  assert.equal(result.admission.reviewRequired, true, label);
  assert.equal(result.conflicts.length > 0, true, label);
  if (code) assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${label}: conflict code`);
  if (gateId) assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${label}: gate`);
  if (blockedReasonCode) {
    assert.equal(
      result.admission.reasonCodes.includes(blockedReasonCode),
      true,
      `${label}: blocked reasons ${result.admission.reasonCodes.join(', ')}`
    );
  }
}
