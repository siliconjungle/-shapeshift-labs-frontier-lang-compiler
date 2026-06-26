import { assert } from './helpers.mjs';
import { safeMergeJsTsProject, safeMergeJsTsSource } from './compiler-api.mjs';

const lexicalRenameLiveReferenceBase = [
  'function step(v: number) {',
  '  return v + 1;',
  '}',
  'function callStep() {',
  '  return step(1);',
  '}',
  'function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const lexicalRenameLiveReference = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_blocks_top_level_rename_live_reference',
  language: 'typescript',
  sourcePath: 'src/lexical-rename-live-reference.ts',
  baseSourceText: lexicalRenameLiveReferenceBase,
  workerSourceText: lexicalRenameLiveReferenceBase.replace('function step', 'function renamedStep'),
  headSourceText: lexicalRenameLiveReferenceBase.replace('return 0;', 'return 10;')
});
assert.equal(lexicalRenameLiveReference.status, 'blocked');
assert.equal(lexicalRenameLiveReference.admission.reasonCodes.includes('lexical-scope-live-reference'), true);
assert.equal(lexicalRenameLiveReference.admission.reasonCodes.includes('lexical-scope-closure-reference'), true);
assert.equal(lexicalRenameLiveReference.metadata.topLevelRenameAdmission.lexicalUseDefEvidence.status, 'blocked');

const lexicalRenameShadowedBase = [
  'function step(v: number) {',
  '  return v + 1;',
  '}',
  'function callStep(step: number) {',
  '  return step + 1;',
  '}',
  'function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const lexicalRenameShadowed = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_blocks_top_level_rename_shadowed_reference',
  language: 'typescript',
  sourcePath: 'src/lexical-rename-shadowed.ts',
  baseSourceText: lexicalRenameShadowedBase,
  workerSourceText: lexicalRenameShadowedBase.replace('function step', 'function renamedStep'),
  headSourceText: lexicalRenameShadowedBase.replace('return 0;', 'return 10;')
});
assert.equal(lexicalRenameShadowed.status, 'blocked');
assert.equal(lexicalRenameShadowed.admission.reasonCodes.includes('lexical-scope-shadowed-binding'), true);
assert.equal(lexicalRenameShadowed.metadata.topLevelRenameAdmission.lexicalUseDefEvidence.summary.shadowedBindings > 0, true);

const lexicalRenameDestructuringAliasBase = [
  'function local() { return 1; }',
  'function read(source) {',
  '  const { remote: local } = source;',
  '  return local;',
  '}',
  'function keep() { return 0; }',
  ''
].join('\n');
const lexicalRenameDestructuringAlias = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_blocks_top_level_rename_destructuring_alias_shadow',
  language: 'typescript',
  sourcePath: 'src/lexical-rename-destructuring-alias.ts',
  baseSourceText: lexicalRenameDestructuringAliasBase,
  workerSourceText: lexicalRenameDestructuringAliasBase.replace('function local', 'function renamedLocal'),
  headSourceText: lexicalRenameDestructuringAliasBase.replace('return 0;', 'return 10;')
});
assert.equal(lexicalRenameDestructuringAlias.status, 'blocked');
assert.equal(lexicalRenameDestructuringAlias.admission.reasonCodes.includes('lexical-scope-shadowed-binding'), true);
assert.equal(lexicalRenameDestructuringAlias.metadata.topLevelRenameAdmission.lexicalUseDefEvidence.checks.some((check) => check.shadowedBindings?.some((binding) => binding.name === 'local' && binding.kind === 'const')), true);

const lexicalTypeReferenceBase = [
  'type Model = { id: string };',
  'function read(value: Model) {',
  '  return value.id;',
  '}',
  'function keep() {',
  '  return 0;',
  '}',
  ''
].join('\n');
const lexicalTypeReference = safeMergeJsTsSource({
  id: 'js_ts_safe_merge_blocks_type_rename_live_reference',
  language: 'typescript',
  sourcePath: 'src/lexical-type-reference.ts',
  baseSourceText: lexicalTypeReferenceBase,
  workerSourceText: lexicalTypeReferenceBase.replace('type Model', 'type RenamedModel'),
  headSourceText: lexicalTypeReferenceBase.replace('return 0;', 'return 10;')
});
assert.equal(lexicalTypeReference.status, 'blocked');
assert.equal(lexicalTypeReference.admission.reasonCodes.includes('lexical-scope-live-reference'), true);
assert.equal(lexicalTypeReference.metadata.topLevelRenameAdmission.lexicalUseDefEvidence.summary.references > 0, true);

const lexicalTemplateReferenceBase = 'function step() {\n  return 1;\n}\nfunction render() {\n  return `${step()}`;\n}\nfunction keep() {\n  return 0;\n}\n';
const lexicalTemplateReference = safeMergeJsTsSource({ id: 'js_ts_safe_merge_blocks_top_level_rename_template_literal_reference', language: 'typescript', sourcePath: 'src/lexical-template-reference.ts', baseSourceText: lexicalTemplateReferenceBase, workerSourceText: lexicalTemplateReferenceBase.replace('function step', 'function renamedStep'), headSourceText: lexicalTemplateReferenceBase.replace('return 0;', 'return 10;') });
assert.equal(lexicalTemplateReference.status, 'blocked');
assert.equal(lexicalTemplateReference.admission.reasonCodes.includes('lexical-scope-live-reference'), true);
assert.equal(lexicalTemplateReference.admission.reasonCodes.includes('lexical-scope-template-literal-unsupported'), false);
assert.equal(lexicalTemplateReference.metadata.topLevelRenameAdmission.lexicalUseDefEvidence.summary.templateLiteralReferences > 0, true);

const importRemovalLiveReferenceProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_blocks_import_removal_live_reference',
  language: 'typescript',
  outputDiagnostics: [],
  baseFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = unused;\n"
  },
  workerFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used } from './dep.js';\nexport const value = unused;\n"
  },
  headFiles: {
    'src/dep.ts': 'export const used = 1;\nexport const unused = 2;\n',
    'src/consumer.ts': "import { used, unused } from './dep.js';\nexport const value = unused;\n"
  }
});
const importRemovalLiveReferenceFile = importRemovalLiveReferenceProject.files.find((file) => file.sourcePath === 'src/consumer.ts');
assert.equal(importRemovalLiveReferenceProject.status, 'blocked');
assert.equal(importRemovalLiveReferenceFile.operation, 'blocked-import-removal-lexical-use-def');
assert.equal(importRemovalLiveReferenceFile.admission.reasonCodes.includes('project-import-removal-lexical-use-def-blocked'), true);
assert.equal(
  importRemovalLiveReferenceFile.metadata.importRemovalUsageProof.lexicalUseDefEvidence.reasonCodes.includes('lexical-scope-live-reference'),
  true
);
