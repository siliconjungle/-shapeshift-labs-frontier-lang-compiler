import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { fileAdmissionEvidenceRecords } from '../../src/js-ts-safe-project-merge-evidence-routing.js';

const htmlBase = [
  '<main id="app">',
  '  <h1>Todo</h1>',
  '  <button data-frontier-key="save" type="button">Save</button>',
  '</main>',
  ''
].join('\n');
const htmlWorker = htmlBase.replace('Todo</h1>', 'Todos</h1>');
const htmlHead = htmlBase.replace('type="button"', 'type="button" disabled');
const cssBase = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '}',
  ''
].join('\n');
const cssWorker = cssBase.replace('color: red', 'color: blue');
const cssHead = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '  background-color: white;',
  '}',
  ''
].join('\n');

const mixedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css',
  baseFiles: {
    'src/view.html': htmlBase,
    'src/button.css': cssBase
  },
  workerFiles: {
    'src/view.html': htmlWorker,
    'src/button.css': cssWorker
  },
  headFiles: {
    'src/view.html': htmlHead,
    'src/button.css': cssHead
  }
});
assert.equal(mixedProject.status, 'merged');
assert.equal(mixedProject.summary.htmlFiles, 1);
assert.equal(mixedProject.summary.cssFiles, 1);
assert.equal(mixedProject.summary.htmlCssFiles, 2);
assert.equal(mixedProject.summary.htmlMergedFiles, 1);
assert.equal(mixedProject.summary.cssMergedFiles, 1);
assert.equal(mixedProject.summary.htmlCssMergedFiles, 2);
assert.equal(mixedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlCssParserEvidenceFiles, 2);
assert.equal(mixedProject.summary.htmlIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlExplicitIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlPathOnlyIdentityResidualFiles, 1);
assert.equal(mixedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlFrameworkBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(mixedProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlCssStructuralTargetEvidenceFiles, 2);
assert.equal(mixedProject.summary.cssScopedCascadeFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(mixedProject.summary.htmlCssBrowserRuntimeProofs, 0);
const outputByPath = new Map(mixedProject.outputFiles.map((file) => [file.sourcePath, file]));
assert.equal(outputByPath.get('src/view.html').language, 'html');
assert.equal(outputByPath.get('src/view.html').operation, 'merged-html-source');
assert.match(outputByPath.get('src/view.html').sourceText, /<h1>Todos<\/h1>/);
assert.match(outputByPath.get('src/view.html').sourceText, /disabled/);
assert.equal(outputByPath.get('src/button.css').language, 'css');
assert.equal(outputByPath.get('src/button.css').operation, 'merged-css-source');
assert.match(outputByPath.get('src/button.css').sourceText, /color: blue/);
assert.match(outputByPath.get('src/button.css').sourceText, /background-color: white/);
assert.equal(matrixSurface(mixedProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-parser-source-evidence').proofStatuses['html-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-parser-source-evidence').proofStatuses['css-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-identity-evidence').proofStatuses['html-identity-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');
const browserSurface = matrixSurface(mixedProject, 'html-css-browser-runtime-proof');
assert.equal(browserSurface.proofStatuses['browser-runtime-proof'], 'missing');
assert.equal(browserSurface.missingRouteIds.includes('prove-html-css-browser-runtime'), true);

const htmlBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_block',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: '<script>window.value = 1;</script>\n',
    workerSourceText: '<script>window.value = 2;</script>\n',
    headSourceText: '<script>window.value = 1;</script>\n'
  }]
});
assert.equal(htmlBlockedProject.status, 'blocked');
assert.equal(htmlBlockedProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlExplicitIdentityEvidenceFiles, 0);
assert.equal(htmlBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked'), true);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'script-runtime-boundary'), true);
const htmlBlockedSurface = matrixSurface(htmlBlockedProject, 'html-structural-merge-admission');
assert.equal(htmlBlockedSurface.proofStatuses['html-structural-merge'], 'failed');
assert.equal(htmlBlockedSurface.missingRouteIds.includes('admit-html-structural-merge'), true);

const cssBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssBase,
    workerSourceText: cssWorker,
    headSourceText: cssBase.replace('color: red', 'color: green')
  }]
});
assert.equal(cssBlockedProject.status, 'blocked');
assert.equal(cssBlockedProject.summary.cssBlockedFiles, 1);
assert.equal(cssBlockedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(cssBlockedProject.conflicts.some((conflict) => conflict.code === 'css-cascade-declaration-conflict'), true);
const cssBlockedSurface = matrixSurface(cssBlockedProject, 'css-cascade-merge-admission');
assert.equal(cssBlockedSurface.proofStatuses['css-cascade-merge'], 'failed');
assert.equal(cssBlockedSurface.missingRouteIds.includes('admit-css-cascade-merge'), true);

const cssSelectorMoveProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; }\n',
    workerSourceText: '.primary { color: red; }\n',
    headSourceText: '.button { color: red; background-color: white; }\n'
  }]
});
assert.equal(cssSelectorMoveProject.status, 'blocked');
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(cssSelectorMoveProject.summary.cssSelectorTargetConflictFiles, 1);
assert.equal(cssSelectorMoveProject.conflicts.some((conflict) => conflict.code === 'css-selector-target-conflict'), true);
const cssSelectorMoveSurface = matrixSurface(cssSelectorMoveProject, 'css-selector-target-evidence');
assert.equal(cssSelectorMoveSurface.proofStatuses['css-selector-target-evidence'], 'failed');
assert.equal(cssSelectorMoveSurface.missingRouteIds.includes('prove-css-selector-target-evidence'), true);

const cssSelectorMoveRebasedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_selector_move_rebased',
  cssMergeOptionsByPath: { 'src/button.css': { selectorTargetEquivalences: [{ fromSelectors: ['.button'], toSelectors: ['.primary'] }] } },
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: '.button { color: red; }\n',
    workerSourceText: '.primary { color: red; }\n',
    headSourceText: '.button { color: red; background-color: white; }\n'
  }]
});
assert.equal(cssSelectorMoveRebasedProject.status, 'merged');
assert.equal(cssSelectorMoveRebasedProject.summary.cssSelectorTargetRebasedFiles, 1);
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /\.primary \{/);
assert.match(cssSelectorMoveRebasedProject.outputFiles[0].sourceText, /background-color: white/);
assert.equal(matrixSurface(cssSelectorMoveRebasedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');

const scopedCssBase = '@media (min-width: 700px) {\n  .button {\n    color: red;\n    padding-left: 1rem;\n  }\n}\n';
const scopedCssWorker = scopedCssBase.replace('color: red', 'color: blue');
const scopedCssHead = scopedCssBase.replace('padding-left: 1rem;', 'padding-left: 1rem;\n    background-color: white;');
const scopedCssMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_missing_proof',
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssMissingProof.status, 'blocked');
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeFiles, 1);
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(scopedCssMissingProof.summary.cssScopedCascadeBlockedFiles, 1);
assert.equal(scopedCssMissingProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-scoped-cascade-equivalence-unproved'), true);

const scopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_scope_with_proof',
  cssMergeOptionsByPath: { 'src/button.css': { scopedCascadeGraphHash: 'hash_scoped_cascade' } },
  files: [{ sourcePath: 'src/button.css', baseSourceText: scopedCssBase, workerSourceText: scopedCssWorker, headSourceText: scopedCssHead }]
});
assert.equal(scopedCssWithProof.status, 'merged');
assert.equal(scopedCssWithProof.summary.cssMergedFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(scopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(matrixSurface(scopedCssWithProof, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

const icssModuleSource = [
  ':export {',
  '  accentColor: var(--accent);',
  '}',
  '.root {',
  '  color: var(--accent);',
  '}',
  ''
].join('\n');
const icssModuleComponentSource = [
  'import styles from ' + JSON.stringify('./Theme.module.css') + ';',
  'export function ThemeButton() {',
  '  const accent = styles.accentColor;',
  '  return <button className={styles.root} data-accent={accent} />;',
  '}',
  ''
].join('\n');
const provenIcssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Theme.module.css',
  sourceText: icssModuleSource,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:theme',
      exports: [{ name: 'root' }],
      icssExports: [{ name: 'accentColor', value: 'var(--accent)' }],
      generatedClassNameMapHash: 'css-module-generated-map:theme',
      jsTsUseSiteGraphHash: 'css-module-use-sites:theme',
      icssGraphHash: 'icss-graph:theme'
    },
    bundlerTransformHash: 'bundler-transform:theme',
    sourceMapProofHash: 'source-map-proof:theme'
  }
});
const provenIcssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_icss_use_site',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [provenIcssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Theme.module.css', headSourceText: icssModuleSource },
    { language: 'tsx', sourcePath: 'src/ThemeButton.tsx', baseSourceText: icssModuleComponentSource, workerSourceText: icssModuleComponentSource, headSourceText: icssModuleComponentSource }
  ]
});
assert.equal(provenIcssModuleProject.status, 'merged');
const provenIcssBinding = provenIcssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings[0];
assert.equal(provenIcssBinding.cssModuleExportNames.includes('accentColor'), true);
assert.equal(provenIcssBinding.cssModuleExportNames.includes('root'), true);
const provenIcssTokenUseSite = provenIcssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.find((site) => site.exportName === 'accentColor');
assert.equal(provenIcssTokenUseSite?.useSiteKind, 'scope-member-read');
assert.equal(provenIcssTokenUseSite.cssModuleSourcePath, 'src/Theme.module.css');
assert.equal(typeof provenIcssTokenUseSite.cssModuleExportHash, 'string');
assert.equal(provenIcssModuleProject.summary.projectGraphCssModuleUseSiteConflicts, 0);
assert.equal(provenIcssModuleProject.summary.projectGraphCssModuleUseSiteBlockers, 0);
assert.equal(provenIcssModuleProject.summary.projectGraphCssModuleUseSiteGraphs, 1);
assert.equal(matrixSurface(provenIcssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');

const unprovedIcssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Theme.module.css',
  sourceText: icssModuleSource,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:theme',
      exports: [{ name: 'root' }],
      icssExports: [{ name: 'accentColor', value: 'var(--accent)' }],
      generatedClassNameMapHash: 'css-module-generated-map:theme',
      jsTsUseSiteGraphHash: 'css-module-use-sites:theme'
    },
    bundlerTransformHash: 'bundler-transform:theme',
    sourceMapProofHash: 'source-map-proof:theme'
  }
});
const unprovedIcssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_icss_use_site_missing_graph',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [unprovedIcssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Theme.module.css', headSourceText: icssModuleSource },
    { language: 'tsx', sourcePath: 'src/ThemeButton.tsx', baseSourceText: icssModuleComponentSource, workerSourceText: icssModuleComponentSource, headSourceText: icssModuleComponentSource }
  ]
});
assert.equal(unprovedIcssModuleProject.status, 'blocked');
assert.equal(unprovedIcssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings[0].cssModuleExportNames.includes('accentColor'), false);
assert.equal(unprovedIcssModuleProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-export-name-unresolved'), true);
assert.equal(matrixSurface(unprovedIcssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'failed');

const genericAdmissionEvidence = fileAdmissionEvidenceRecords([{
  summary: {
    genericAdmissionEvidence: [
      { id: 'safe_exact', kind: 'js-ts-project-generic-admission', status: 'passed', details: { exactBranchOutput: true } },
      { id: 'blocked_conflict', kind: 'js-ts-project-generic-admission', status: 'failed', details: { reasonCode: 'generic-conflict' } }
    ]
  },
  metadata: {
    genericAdmissions: [{
      id: 'review_missing',
      kind: 'js-ts-project-generic-admission',
      status: 'missing',
      admissionRoute: { status: 'missing', reasonCodes: ['missing-proof'] }
    }]
  }
}]);
const genericAdmissionById = new Map(genericAdmissionEvidence.map((record) => [record.id, record]));
assert.equal(genericAdmissionById.get('safe_exact').admissionOutcome, 'safe');
assert.equal(genericAdmissionById.get('safe_exact').admissionOutcomeReasonCode, 'passed-exact-branch-output');
assert.equal(genericAdmissionById.get('blocked_conflict').admissionOutcome, 'blocked');
assert.equal(genericAdmissionById.get('blocked_conflict').admissionOutcomeReasonCode, 'generic-conflict');
assert.equal(genericAdmissionById.get('review_missing').admissionOutcome, 'review');
assert.equal(genericAdmissionById.get('review_missing').admissionOutcomeReasonCode, 'missing-proof');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
