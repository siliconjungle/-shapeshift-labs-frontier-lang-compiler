import assert from 'node:assert/strict';
import { compileFrontierSource } from '../dist/index.js';

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];

export function runCoreFuzzCases() {
  for (let index = 0; index < 100; index += 1) {
    const source = `
module Fuzz${index} @id("mod_${index}")
type ItemInput @id("type_input_${index}") {
  value: Text
}
entity Item @id("ent_${index}") {
  value @id("field_value_${index}"): Text
}
action updateItem @id("action_${index}") {
  input ItemInput
  writes field_value_${index}
  returns Patch
}
`;
    const result = compileFrontierSource(source, { target: targets[index % targets.length] });
    assert.equal(result.ok, true);
    assert.ok(result.output.length > 0);
  }
}
