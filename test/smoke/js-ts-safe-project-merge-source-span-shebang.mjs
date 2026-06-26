import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const cliSource = [
  '#!/usr/bin/env node',
  '"use strict";',
  'export const cli = true;',
  ''
].join('\n');

const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_source_span_shebang',
  language: 'javascript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/cli.js': cliSource },
  workerFiles: { 'src/cli.js': cliSource },
  headFiles: { 'src/cli.js': cliSource }
});

assert.equal(project.status, 'merged');
const shebangRecord = project.outputProjectSymbolGraph.sourceSpanRecords.find((record) => record.kind === 'shebang');
assert.equal(shebangRecord.role, 'directive');
assert.equal(shebangRecord.identityKey, 'source-span#src/cli.js#directive#shebang#file-entrypoint-directive');
assert.equal(shebangRecord.ownershipAnchor.anchorKind, 'file-entrypoint-directive');
assert.equal(shebangRecord.ownershipAnchor.identityAnchor, 'file-entrypoint-directive');
assert.equal(shebangRecord.parserTriviaOwnershipRelation, 'file-entrypoint-directive');
assert.equal(shebangRecord.ownershipAnchor.insertionAnchor.anchorKind, 'trivia-insertion');
assert.equal(shebangRecord.ownershipAnchor.insertionAnchor.mode, 'before');
assert.equal(shebangRecord.directive, true);
