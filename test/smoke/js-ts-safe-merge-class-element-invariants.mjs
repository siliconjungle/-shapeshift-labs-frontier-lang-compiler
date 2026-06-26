import { strict as assert } from 'node:assert';
import {
  JsTsSafeMergeConflictCodes,
  JsTsSafeMergeGateIds
} from '../../src/js-ts-safe-merge-constants.js';
import { mergeJsTsSafeMemberAdditions } from '../../src/js-ts-safe-member-merge.js';

const policy = { unorderedRegions: [{ kind: 'class', name: 'Store', order: 'non-semantic' }] };
const baseSource = source([
  'export class Store {',
  '  save(value: string) {',
  '    return value.trim();',
  '  }',
  '}'
]);

const ordinary = mergeJsTsSafeMemberAdditions({
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  load(value: string) {',
    '    return value;',
    '  }',
    '}'
  ]),
  headSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  static create() {',
    '    return new Store();',
    '  }',
    '}'
  ]),
  policy
});
assert.equal(ordinary.status, 'merged');
assert.deepEqual(ordinary.mergedRegions[0].workerAddedKeys, ['load']);
assert.deepEqual(ordinary.mergedRegions[0].headAddedKeys, ['static.create']);

assertRejected('private static/member name scope', {
  baseSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '}'
  ]),
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  #token = "worker";',
    '}'
  ]),
  headSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  static #token = "head";',
    '}'
  ]),
  policy
}, 'private-name-scope:worker-head:#token', JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames, 'private-name-scope');

assertRejected('private reference without same-side declaration', {
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  read() {',
    '    return this.#token;',
    '  }',
    '}'
  ]),
  headSourceText: baseSource,
  policy
}, 'private-name-scope:worker:#token', JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames, 'private-name-scope');

assertRejected('static block ordering', {
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  static {',
    '    this.ready = true;',
    '  }',
    '}'
  ]),
  headSourceText: baseSource,
  policy
}, 'static-block-ordering:worker', JsTsSafeMergeConflictCodes.topLevelOrderChanged, JsTsSafeMergeGateIds.preserveBaseOrder, 'static-block-ordering');

assertRejected('getter setter pairing', {
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  get value() {',
    '    return this.save("x");',
    '  }',
    '}'
  ]),
  headSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  set value(next: string) {',
    '    this.save(next);',
    '  }',
    '}'
  ]),
  policy
}, 'accessor-pairing:worker-head:value', JsTsSafeMergeConflictCodes.duplicateName, JsTsSafeMergeGateIds.uniqueNames, 'accessor-pairing');

assertRejected('decorated member', {
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  @tracked',
    '  value() {',
    '    return "worker";',
    '  }',
    '}'
  ]),
  headSourceText: baseSource,
  policy
}, 'decorator-member:worker', JsTsSafeMergeConflictCodes.unsupportedDecorator, JsTsSafeMergeGateIds.parseLedger, 'decorator-member');

assertRejected('computed member name', {
  baseSourceText: baseSource,
  workerSourceText: source([
    'export class Store {',
    '  save(value: string) {',
    '    return value.trim();',
    '  }',
    '  ["value"]() {',
    '    return "worker";',
    '  }',
    '}'
  ]),
  headSourceText: baseSource,
  policy
}, 'computed-key:worker', JsTsSafeMergeConflictCodes.computedKey, JsTsSafeMergeGateIds.parseLedger, 'computed-key');

function assertRejected(label, input, reason, code, gateId, admissionReasonCode) {
  const result = mergeJsTsSafeMemberAdditions(input);
  assert.equal(result.status, 'rejected', label);
  assert.equal(result.reasonCodes.some((code) => code.includes(reason)), true, `${label}: ${result.reasonCodes.join(', ')}`);
  assert.equal(result.conflicts.some((conflict) => conflict.code === code), true, `${label}: conflict code`);
  assert.equal(result.gates.some((gate) => gate.id === gateId && gate.status === 'blocked'), true, `${label}: gate`);
  assert.equal(result.admission.reasonCodes.includes(admissionReasonCode), true, `${label}: admission reason`);
}

function source(lines) {
  return `${lines.join('\n')}\n`;
}
