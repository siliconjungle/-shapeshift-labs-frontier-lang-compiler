import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const siblingDeclarators = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_variable_declarator_siblings',
  language: 'typescript',
  sourcePath: 'src/constants.ts',
  baseSourceText: 'export const a = 1, b = 2;\n',
  workerSourceText: 'export const a = 3, b = 2;\n',
  headSourceText: 'export const a = 1, b = 4;\n'
});
assert.equal(siblingDeclarators.status, 'merged');
assert.equal(siblingDeclarators.mergedSourceText, 'export const a = 3, b = 4;\n');
assert.equal(siblingDeclarators.metadata.composed.phase, 'staged-top-level-variable-declarator-semantic-fallback');
assert.equal(siblingDeclarators.summary.variableDeclaratorStatements, 1);
assert.equal(siblingDeclarators.summary.variableDeclaratorEdits, 1);
assert.equal(siblingDeclarators.semanticArtifacts.status, 'verified');
assert.equal(siblingDeclarators.semanticArtifacts.projection.sourceText, siblingDeclarators.mergedSourceText);
assert.equal(siblingDeclarators.semanticArtifacts.replay.status, 'accepted-clean');
assert.equal(siblingDeclarators.semanticArtifacts.replay.outputSourceText, siblingDeclarators.mergedSourceText);
assert.equal(siblingDeclarators.semanticArtifacts.alreadyAppliedReplay.status, 'already-applied');

const importDeclarators = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_variable_declarators_with_imports',
  language: 'typescript',
  sourcePath: 'src/constants.ts',
  baseSourceText: [
    "import { readFile } from 'node:fs';",
    'export const a = readFile, b = 2;',
    ''
  ].join('\n'),
  workerSourceText: [
    "import { readFile, writeFile } from 'node:fs';",
    'export const a = writeFile, b = 2;',
    ''
  ].join('\n'),
  headSourceText: [
    "import { readFile, stat } from 'node:fs';",
    'export const a = readFile, b = 4;',
    ''
  ].join('\n')
});
assert.equal(importDeclarators.status, 'merged');
assert.equal(importDeclarators.mergedSourceText, [
  "import { readFile, stat, writeFile } from 'node:fs';",
  'export const a = writeFile, b = 4;',
  ''
].join('\n'));
assert.equal(importDeclarators.summary.importSpecifierAdditions, 2);
assert.equal(importDeclarators.summary.variableDeclaratorEdits, 1);
assert.equal(importDeclarators.semanticArtifacts.status, 'verified');
assert.equal(importDeclarators.semanticArtifacts.replay.outputSourceText, importDeclarators.mergedSourceText);

const conflictingDeclarator = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_variable_declarator_conflict',
  language: 'typescript',
  sourcePath: 'src/constants.ts',
  baseSourceText: 'export const a = 1, b = 2;\n',
  workerSourceText: 'export const a = 3, b = 2;\n',
  headSourceText: 'export const a = 4, b = 2;\n'
});
assert.equal(conflictingDeclarator.status, 'blocked');
assert.equal(conflictingDeclarator.admission.reviewRequired, true);
assert.equal(conflictingDeclarator.metadata.composed, undefined);

const projectDeclarators = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_variable_declarator_siblings',
  language: 'typescript',
  baseFiles: {
    'src/constants.ts': 'export const a = 1, b = 2;\n'
  },
  workerFiles: {
    'src/constants.ts': 'export const a = 3, b = 2;\n'
  },
  headFiles: {
    'src/constants.ts': 'export const a = 1, b = 4;\n'
  }
});
assert.equal(projectDeclarators.status, 'merged');
assert.equal(projectDeclarators.outputFiles[0].sourceText, 'export const a = 3, b = 4;\n');
assert.equal(projectDeclarators.files[0].semanticArtifacts.status, 'verified');
