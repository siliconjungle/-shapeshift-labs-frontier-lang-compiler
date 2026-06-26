import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { fileAdmissionEvidenceRecords } from '../../src/js-ts-safe-project-merge-evidence-routing.js';

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

const nestedScopedCssWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_nested_layer_scope_with_proof',
  cssMergeOptionsByPath: { 'src/nested.css': { scopedCascadeGraphHash: 'hash_nested_scoped_cascade' } },
  files: [{ sourcePath: 'src/nested.css', baseSourceText: nestedScopedCssBase, workerSourceText: nestedScopedCssWorker, headSourceText: nestedScopedCssHead }]
});
assert.equal(nestedScopedCssWithProof.status, 'merged');
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeFiles, 1);
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeEvidenceFiles, 1);
assert.equal(nestedScopedCssWithProof.summary.cssScopedCascadeBlockedFiles, 0);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /@layer components/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /@scope \(\.card\)/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /color: blue/);
assert.match(nestedScopedCssWithProof.outputFiles[0].sourceText, /background-color: white/);

const dependencyCssBase = [
  ':root {',
  '  --motion-name: fade;',
  '  --spinner-asset: url("./spinner.svg");',
  '}',
  '.spinner {',
  '  animation-name: var(--motion-name, fade);',
  '  background-image: var(--spinner-asset, url("./fallback.svg"));',
  '  color: red;',
  '}',
  ''
].join('\n');
const dependencyCssWorker = dependencyCssBase.replace('--motion-name: fade;', '--motion-name: slide;');
const dependencyCssHead = dependencyCssBase.replace('color: red;', 'color: blue;');
const cssDependencyMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_dependency_graph_missing',
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: dependencyCssBase, workerSourceText: dependencyCssWorker, headSourceText: dependencyCssHead }]
});
assert.equal(cssDependencyMissingProof.status, 'merged');
assert.equal(cssDependencyMissingProof.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphEvidenceFiles, 0);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphMissingProofFiles, 1);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssDependencyMissingProof.confidence.missingSignals.includes('css-dependency-graph-evidence-missing'), true);
const cssDependencySurface = matrixSurface(cssDependencyMissingProof, 'css-dependency-graph-evidence');
assert.equal(cssDependencySurface.proofStatuses['css-dependency-graph'], 'missing');
assert.equal(cssDependencySurface.missingRouteIds.includes('prove-css-dependency-graph'), true);
assert.equal(matrixSurface(cssDependencyMissingProof, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const keyframesCssBase = [
  '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
  '.spinner {',
  '  animation-name: fade;',
  '  color: red;',
  '}',
  ''
].join('\n');
const keyframesCssWorker = keyframesCssBase.replace('@keyframes fade', '@keyframes slide').replace('animation-name: fade;', 'animation-name: slide;');
const keyframesCssHead = keyframesCssBase.replace('color: red;', 'color: blue;');
const cssKeyframesDependencyBlocked = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_keyframes_dependency_blocked',
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: keyframesCssBase, workerSourceText: keyframesCssWorker, headSourceText: keyframesCssHead }]
});
assert.equal(cssKeyframesDependencyBlocked.status, 'blocked');
assert.equal(cssKeyframesDependencyBlocked.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssKeyframesDependencyBlocked.summary.cssDependencyGraphEvidenceFiles, 0);
assert.equal(cssKeyframesDependencyBlocked.summary.cssDependencyGraphMissingProofFiles, 1);
assert.equal(cssKeyframesDependencyBlocked.summary.cssDependencyGraphBlockedFiles, 1);
assert.equal(matrixSurface(cssKeyframesDependencyBlocked, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'failed');

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
