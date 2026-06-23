import { assert } from './helpers.mjs';
import { safeMergeJsTsImportsAndDeclarations } from './compiler-api.mjs';

const parentTypeOnlyImportAdditions = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_parent_type_only_import_additions_render_once',
  language: 'typescript',
  sourcePath: 'src/types.ts',
  baseSourceText: "import type { Base } from './types.js';\nexport type Stable = Base;\n",
  workerSourceText: "import type { Base, Worker } from './types.js';\nexport type Stable = Base;\nexport type WorkerStable = Worker;\n",
  headSourceText: "import type { Base, Head } from './types.js';\nexport type Stable = Base;\nexport type HeadStable = Head;\n"
});

assert.equal(parentTypeOnlyImportAdditions.status, 'merged');
assert.equal(parentTypeOnlyImportAdditions.mergedSourceText, [
  "import type { Base, Head, Worker } from './types.js';",
  'export type Stable = Base;',
  'export type HeadStable = Head;',
  'export type WorkerStable = Worker;',
  ''
].join('\n'));
assert.equal(parentTypeOnlyImportAdditions.mergedSourceText.includes('import type { type'), false);

const mixedValueTypeSpecifierAdditions = safeMergeJsTsImportsAndDeclarations({
  id: 'js_ts_safe_merge_mixed_value_type_specifier_additions_keep_type_marker',
  language: 'typescript',
  sourcePath: 'src/mixed.ts',
  baseSourceText: "import { parse } from './api.js';\nexport const stable = parse;\n",
  workerSourceText: "import { parse, type WorkerModel } from './api.js';\nexport const stable = parse;\nexport type WorkerStable = WorkerModel;\n",
  headSourceText: "import { parse, headValue } from './api.js';\nexport const stable = parse;\nexport const headStable = headValue;\n"
});

assert.equal(mixedValueTypeSpecifierAdditions.status, 'merged');
assert.equal(mixedValueTypeSpecifierAdditions.mergedSourceText, [
  "import { parse, headValue, type WorkerModel } from './api.js';",
  'export const stable = parse;',
  'export const headStable = headValue;',
  'export type WorkerStable = WorkerModel;',
  ''
].join('\n'));
