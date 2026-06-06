import { performance } from 'node:perf_hooks';
import { compileFrontierSource } from '../dist/index.js';

const source = `
module Bench @id("mod_bench")
type TodoInput @id("type_input") {
  title: Text
}
entity Todo @id("ent_todo") {
  title @id("field_title"): Text
}
action addTodo @id("action_add") {
  input TodoInput
  writes field_title
  returns Patch
}
`;

const targets = ['typescript', 'javascript', 'rust', 'python', 'c'];

export function measureFrontierCompile() {
  const start = performance.now();
  let bytes = 0;
  for (let index = 0; index < 250; index += 1) {
    bytes += compileFrontierSource(source, { target: targets[index % targets.length] }).output.length;
  }
  return {
    bytes,
    compileDurationMs: performance.now() - start
  };
}
