import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface, scopedProof } from './html-css-merge-test-helpers.mjs';

const nestedScopedCssBase = [
  '@layer components {',
  '  @scope (.card) {',
  '    .button {',
  '      color: red;',
  '      padding-left: 1rem;',
  '    }',
  '  }',
  '}',
  ''
].join('\n');
const nestedScopedCssWorker = nestedScopedCssBase.replace('color: red', 'color: blue');
const nestedScopedCssHead = nestedScopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n      background-color: white;');
const nestedScopedCssMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_layer_scope_missing_proof',
  files: [{ sourcePath: 'src/nested.css', baseSourceText: nestedScopedCssBase, workerSourceText: nestedScopedCssWorker, headSourceText: nestedScopedCssHead }]
});
assert.equal(nestedScopedCssMissingProof.status, 'blocked');
assert.equal(nestedScopedCssMissingProof.summary.cssScopedCascadeFiles, 1);
assert.equal(nestedScopedCssMissingProof.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(nestedScopedCssMissingProof.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(nestedScopedCssMissingProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-scoped-cascade-equivalence-unproved'), true);

const nestedScopedCssHashOnly = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_layer_scope_hash_only',
  cssMergeOptionsByPath: { 'src/nested.css': { scopedCascadeGraphHash: 'hash_nested_scoped_cascade' } },
  files: [{ sourcePath: 'src/nested.css', baseSourceText: nestedScopedCssBase, workerSourceText: nestedScopedCssWorker, headSourceText: nestedScopedCssHead }]
});
assert.equal(nestedScopedCssHashOnly.status, 'blocked');
assert.equal(nestedScopedCssHashOnly.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(nestedScopedCssHashOnly.summary.cssScopedCascadeBlockedFiles, 1);
const nestedScopedCssOutput = '@layer components {\n  @scope (.card) {\n    .button {\n      color: blue;\n      padding-left: 1rem;\n      background-color: white;\n    }\n  }\n}\n';
const nestedScopedCssShapeKey = '@layer components::@scope (.card)';
const nestedScopedCssShapeHash = 'hash_nested_scoped_cascade_shape';
const nestedScopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_layer_scope_with_proof',
  cssMergeOptionsByPath: { 'src/nested.css': { scopedCascadeGraphHashesByShapeKey: { [nestedScopedCssShapeKey]: nestedScopedCssShapeHash }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_nested_layer_scope', sourcePath: 'src/nested.css', graphHash: nestedScopedCssShapeHash, shapeKey: nestedScopedCssShapeKey, base: nestedScopedCssBase, worker: nestedScopedCssWorker, head: nestedScopedCssHead, output: nestedScopedCssOutput, scopes: ['@layer components', '@scope (.card)'], cascadeKeys: ['@layer components::@scope (.card)::.button::color', '@layer components::@scope (.card)::.button::background-color'], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/nested.css', baseSourceText: nestedScopedCssBase, workerSourceText: nestedScopedCssWorker, headSourceText: nestedScopedCssHead }]
});
assert.equal(nestedScopedCssWithProof.status, 'merged');
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeFiles, 1);
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeShapeEvidenceFiles, 1);
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /@layer components/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /@scope \(\.card\)/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /color: blue/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /background-color: white/);
assert.equal(nestedScopedCssWithProof.files[0].result.scopedCascadeProofs.length, 2);
assert.equal(nestedScopedCssWithProof.files[0].result.scopedCascadeProofs.every((proof) => proof.scopedCascadeGraphShapeKey === nestedScopedCssShapeKey), true);

const containerScopedCssBase = '@container card (min-width: 300px) {\n  .button {\n    color: red;\n    padding-left: 1rem;\n  }\n}\n';
const containerScopedCssWorker = containerScopedCssBase.replace('color: red', 'color: blue');
const containerScopedCssHead = containerScopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n    background-color: white;');
const containerScopedCssOutput = '@container card (min-width: 300px) {\n  .button {\n    color: blue;\n    padding-left: 1rem;\n    background-color: white;\n  }\n}\n';
const containerScopedCssShapeKey = '@container card (min-width: 300px)';
const containerScopedCssShapeHash = 'hash_container_scoped_cascade_shape';
const containerScopedCssWrongShape = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_container_scope_wrong_shape',
  cssMergeOptionsByPath: { 'src/card.css': { scopedCascadeGraphHashesByShapeKey: { [containerScopedCssShapeKey]: containerScopedCssShapeHash }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_container_wrong_shape', sourcePath: 'src/card.css', graphHash: containerScopedCssShapeHash, shapeKey: '@media (min-width: 300px)', base: containerScopedCssBase, worker: containerScopedCssWorker, head: containerScopedCssHead, output: containerScopedCssOutput, scopes: ['@container card (min-width: 300px)'], cascadeKeys: ['@container card (min-width: 300px)::.button::color', '@container card (min-width: 300px)::.button::background-color'], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/card.css', baseSourceText: containerScopedCssBase, workerSourceText: containerScopedCssWorker, headSourceText: containerScopedCssHead }]
});
assert.equal(containerScopedCssWrongShape.status, 'blocked');
assert.equal(containerScopedCssWrongShape.summary.cssScopedCascadeShapeEvidenceFiles, 0);
assert.equal(containerScopedCssWrongShape.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked'), true);
const containerScopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_container_scope_with_proof',
  cssMergeOptionsByPath: { 'src/card.css': { scopedCascadeGraphHashesByShapeKey: { [containerScopedCssShapeKey]: containerScopedCssShapeHash }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_container_scope', sourcePath: 'src/card.css', graphHash: containerScopedCssShapeHash, shapeKey: containerScopedCssShapeKey, base: containerScopedCssBase, worker: containerScopedCssWorker, head: containerScopedCssHead, output: containerScopedCssOutput, scopes: ['@container card (min-width: 300px)'], cascadeKeys: ['@container card (min-width: 300px)::.button::color', '@container card (min-width: 300px)::.button::background-color'], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/card.css', baseSourceText: containerScopedCssBase, workerSourceText: containerScopedCssWorker, headSourceText: containerScopedCssHead }]
});
assert.equal(containerScopedCssWithProof.status, 'merged');
assert.equal(containerScopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(containerScopedCssWithProof.summary.cssScopedCascadeShapeEvidenceFiles, 1);
assert.equal(containerScopedCssWithProof.outputFiles[0].sourceText, containerScopedCssOutput);

const combinedScopedCssBase = [
  '@media (min-width: 48rem) {',
  '  @layer components {',
  '    @scope (.card) {',
  '      .button {',
  '        color: red;',
  '        padding-left: 1rem;',
  '      }',
  '    }',
  '  }',
  '}',
  ''
].join('\n');
const combinedScopedCssWorker = combinedScopedCssBase.replace('color: red', 'color: blue');
const combinedScopedCssHead = combinedScopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n        background-color: white;');
const combinedScopedCssOutput = '@media (min-width: 48rem) {\n  @layer components {\n    @scope (.card) {\n      .button {\n        color: blue;\n        padding-left: 1rem;\n        background-color: white;\n      }\n    }\n  }\n}\n';
const combinedScopedCssShapeKey = '@media (min-width: 48rem)::@layer components::@scope (.card)';
const combinedScopedCssShapeHash = 'hash_media_layer_scope_cascade_shape';
const combinedScopedCssWrongShape = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_media_layer_scope_wrong_shape',
  cssMergeOptionsByPath: { 'src/combined.css': { scopedCascadeGraphHashesByShapeKey: { [combinedScopedCssShapeKey]: combinedScopedCssShapeHash }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_media_layer_scope_wrong_shape', sourcePath: 'src/combined.css', graphHash: combinedScopedCssShapeHash, shapeKey: '@layer components::@scope (.card)', base: combinedScopedCssBase, worker: combinedScopedCssWorker, head: combinedScopedCssHead, output: combinedScopedCssOutput, scopes: ['@media (min-width: 48rem)', '@layer components', '@scope (.card)'], cascadeKeys: [`${combinedScopedCssShapeKey}::.button::color`, `${combinedScopedCssShapeKey}::.button::background-color`], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/combined.css', baseSourceText: combinedScopedCssBase, workerSourceText: combinedScopedCssWorker, headSourceText: combinedScopedCssHead }]
});
assert.equal(combinedScopedCssWrongShape.status, 'blocked');
assert.equal(combinedScopedCssWrongShape.summary.cssScopedCascadeFiles, 1);
assert.equal(combinedScopedCssWrongShape.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(combinedScopedCssWrongShape.summary.cssScopedCascadeShapeEvidenceFiles, 0);
assert.equal(combinedScopedCssWrongShape.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(combinedScopedCssWrongShape.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked' && conflict.details.scopedCascadeGraphShapeKey === combinedScopedCssShapeKey), true);
assert.equal(matrixSurface(combinedScopedCssWrongShape, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');
const combinedScopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_media_layer_scope_with_proof',
  cssMergeOptionsByPath: { 'src/combined.css': { scopedCascadeGraphHashesByShapeKey: { [combinedScopedCssShapeKey]: combinedScopedCssShapeHash }, cssScopedCascadeProofs: [scopedProof({ id: 'proof_css_media_layer_scope', sourcePath: 'src/combined.css', graphHash: combinedScopedCssShapeHash, shapeKey: combinedScopedCssShapeKey, base: combinedScopedCssBase, worker: combinedScopedCssWorker, head: combinedScopedCssHead, output: combinedScopedCssOutput, scopes: ['@media (min-width: 48rem)', '@layer components', '@scope (.card)'], cascadeKeys: [`${combinedScopedCssShapeKey}::.button::color`, `${combinedScopedCssShapeKey}::.button::background-color`], properties: ['color', 'background-color'], sides: ['worker', 'head'] })] } },
  files: [{ sourcePath: 'src/combined.css', baseSourceText: combinedScopedCssBase, workerSourceText: combinedScopedCssWorker, headSourceText: combinedScopedCssHead }]
});
assert.equal(combinedScopedCssWithProof.status, 'merged');
assert.equal(combinedScopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(combinedScopedCssWithProof.summary.cssScopedCascadeShapeEvidenceFiles, 1);
assert.equal(combinedScopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(combinedScopedCssWithProof.files[0].result.scopedCascadeProofs.length, 2);
assert.equal(combinedScopedCssWithProof.files[0].result.scopedCascadeProofs.every((proof) => proof.scopedCascadeGraphShapeKey === combinedScopedCssShapeKey), true);
assert.equal(combinedScopedCssWithProof.outputFiles[0].sourceText, combinedScopedCssOutput);
assert.equal(matrixSurface(combinedScopedCssWithProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

const nestedRuleScopedCssBase = [
  '@media (min-width: 48rem) {',
  '  @layer components {',
  '    @scope (.card) {',
  '      .card {',
  '        & .button {',
  '          color: red;',
  '          padding-left: 1rem;',
  '        }',
  '      }',
  '    }',
  '  }',
  '}',
  ''
].join('\n');
const nestedRuleScopedCssWorker = nestedRuleScopedCssBase.replace('color: red', 'color: blue');
const nestedRuleScopedCssHead = nestedRuleScopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n          background-color: white;');
const nestedRuleScopedCssOutput = '@media (min-width: 48rem) {\n  @layer components {\n    @scope (.card) {\n      .card .button {\n        color: blue;\n        padding-left: 1rem;\n        background-color: white;\n      }\n    }\n  }\n}\n';
const nestedRuleScopedCssShapeKey = '@media (min-width: 48rem)::@layer components::@scope (.card)';
const nestedRuleScopedCssShapeHash = 'hash_nested_rule_media_layer_scope_cascade_shape';
const nestedRuleScopedCssMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_rule_scope_missing_proof',
  cssMergeOptionsByPath: { 'src/nested-rule.css': { scopedCascadeGraphHashesByShapeKey: { [nestedRuleScopedCssShapeKey]: nestedRuleScopedCssShapeHash } } },
  files: [{ sourcePath: 'src/nested-rule.css', baseSourceText: nestedRuleScopedCssBase, workerSourceText: nestedRuleScopedCssWorker, headSourceText: nestedRuleScopedCssHead }]
});
assert.equal(nestedRuleScopedCssMissingProof.status, 'blocked');
assert.equal(nestedRuleScopedCssMissingProof.summary.cssParserEvidenceFiles, 1);
assert.equal(nestedRuleScopedCssMissingProof.summary.cssParserEvidenceFailedFiles, 0);
assert.equal(nestedRuleScopedCssMissingProof.summary.cssScopedCascadeFiles, 1);
assert.equal(nestedRuleScopedCssMissingProof.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(nestedRuleScopedCssMissingProof.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked' && conflict.details.reasonCode === 'css-scoped-cascade-equivalence-unproved'), true);
assert.equal(nestedRuleScopedCssMissingProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-scoped-cascade-nesting-unproved'), false);
assert.equal(nestedRuleScopedCssMissingProof.outputFiles.some((file) => file.sourcePath === 'src/nested-rule.css'), false);
assert.equal(matrixSurface(nestedRuleScopedCssMissingProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

const nestedRuleScopedCssProof = scopedProof({
  id: 'proof_css_nested_rule_media_layer_scope',
  sourcePath: 'src/nested-rule.css',
  graphHash: nestedRuleScopedCssShapeHash,
  shapeKey: nestedRuleScopedCssShapeKey,
  base: nestedRuleScopedCssBase,
  worker: nestedRuleScopedCssWorker,
  head: nestedRuleScopedCssHead,
  output: nestedRuleScopedCssOutput,
  scopes: ['@media (min-width: 48rem)', '@layer components', '@scope (.card)'],
  selectors: ['.card .button'],
  cascadeKeys: [`${nestedRuleScopedCssShapeKey}::.card .button::color`, `${nestedRuleScopedCssShapeKey}::.card .button::background-color`],
  properties: ['color', 'background-color'],
  sides: ['worker', 'head']
});
const nestedRuleScopedCssStaleProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_rule_scope_stale_proof',
  cssMergeOptionsByPath: { 'src/nested-rule.css': { scopedCascadeGraphHashesByShapeKey: { [nestedRuleScopedCssShapeKey]: nestedRuleScopedCssShapeHash }, cssScopedCascadeProofs: [{ ...nestedRuleScopedCssProof, outputSourceHash: 'stale-output' }] } },
  files: [{ sourcePath: 'src/nested-rule.css', baseSourceText: nestedRuleScopedCssBase, workerSourceText: nestedRuleScopedCssWorker, headSourceText: nestedRuleScopedCssHead }]
});
assert.equal(nestedRuleScopedCssStaleProof.status, 'blocked');
assert.equal(nestedRuleScopedCssStaleProof.conflicts.some((conflict) => conflict.code === 'css-scoped-cascade-proof-blocked'), true);

const nestedRuleScopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_rule_scope_with_proof',
  cssMergeOptionsByPath: { 'src/nested-rule.css': { scopedCascadeGraphHashesByShapeKey: { [nestedRuleScopedCssShapeKey]: nestedRuleScopedCssShapeHash }, cssScopedCascadeProofs: [nestedRuleScopedCssProof] } },
  files: [{ sourcePath: 'src/nested-rule.css', baseSourceText: nestedRuleScopedCssBase, workerSourceText: nestedRuleScopedCssWorker, headSourceText: nestedRuleScopedCssHead }]
});
assert.equal(nestedRuleScopedCssWithProof.status, 'merged');
assert.equal(nestedRuleScopedCssWithProof.summary.cssParserEvidenceFiles, 1);
assert.equal(nestedRuleScopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(nestedRuleScopedCssWithProof.summary.cssScopedCascadeShapeEvidenceFiles, 1);
assert.equal(nestedRuleScopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(nestedRuleScopedCssWithProof.files[0].result.scopedCascadeProofs.length, 2);
assert.equal(nestedRuleScopedCssWithProof.files[0].result.scopedCascadeProofs.every((proof) => proof.scopedCascadeGraphShapeKey === nestedRuleScopedCssShapeKey), true);
assert.equal(nestedRuleScopedCssWithProof.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(nestedRuleScopedCssWithProof.outputFiles[0].sourceText, nestedRuleScopedCssOutput);
assert.equal(matrixSurface(nestedRuleScopedCssWithProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
