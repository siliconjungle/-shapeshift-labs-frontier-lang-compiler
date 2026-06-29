import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { cssModuleSourceMapIdentityFixture } from './js-ts-safe-project-merge-css-modules-test-helpers.mjs';

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
const dynamicIcssModuleComponentSource = [
  'import styles from ' + JSON.stringify('./Theme.module.css') + ';',
  'export function ThemeButton({ tokenName }) {',
  '  const accent = styles[tokenName];',
  '  return <button className={styles.root} data-accent={accent} />;',
  '}',
  ''
].join('\n');
const themeGeneratedClassNameMap = { root: '_theme_root_123' };
const themeTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath: 'src/Theme.module.css',
  sourceText: icssModuleSource,
  generatedClassNameMap: themeGeneratedClassNameMap,
  bundlerTransformHash: 'bundler-transform:theme'
});
const provenIcssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Theme.module.css',
  sourceText: icssModuleSource,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:theme',
      exports: [{ name: 'root' }],
      icssExports: [{ name: 'accentColor', value: 'var(--accent)' }],
      generatedClassNameMap: themeGeneratedClassNameMap,
      generatedClassNameMapHash: themeTransformProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: 'css-module-use-sites:theme',
      icssGraphHash: 'icss-graph:theme'
    },
    bundlerTransformHash: 'bundler-transform:theme',
    cssModuleGeneratedSourceHash: themeTransformProof.cssModuleGeneratedSourceHash,
    sourceMapIdentityProof: themeTransformProof.sourceMapIdentityProof
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

const dynamicIcssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_icss_dynamic_use_site',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [provenIcssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Theme.module.css', headSourceText: icssModuleSource },
    { language: 'tsx', sourcePath: 'src/ThemeButton.tsx', baseSourceText: dynamicIcssModuleComponentSource, workerSourceText: dynamicIcssModuleComponentSource, headSourceText: dynamicIcssModuleComponentSource }
  ]
});
assert.equal(dynamicIcssModuleProject.status, 'blocked');
const dynamicIcssConflict = dynamicIcssModuleProject.conflicts.find((conflict) => conflict.details.reasonCode === 'css-module-dynamic-member-access-unproved');
assert.equal(dynamicIcssConflict?.details.requiredProof, 'css-module-source-bound-dynamic-use-site-proof');
assert.equal(dynamicIcssConflict.details.proofGap.code, 'css-module-dynamic-member-access-unproved');
assert.equal(dynamicIcssConflict.details.proofGap.proofBoundary, 'css-module-use-site-graph');
assert.equal(dynamicIcssConflict.details.proofGap.failClosed, true);
assert.equal(dynamicIcssConflict.details.semanticEquivalenceClaim, false);
assert.equal(matrixSurface(dynamicIcssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'failed');
assert.equal(matrixSurface(dynamicIcssModuleProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(matrixSurface(dynamicIcssModuleProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed');
assert.equal(matrixSurface(dynamicIcssModuleProject, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'passed');

const unprovedIcssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Theme.module.css',
  sourceText: icssModuleSource,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:theme',
      exports: [{ name: 'root' }],
      icssExports: [{ name: 'accentColor', value: 'var(--accent)' }],
      generatedClassNameMap: themeGeneratedClassNameMap,
      generatedClassNameMapHash: themeTransformProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: 'css-module-use-sites:theme'
    },
    bundlerTransformHash: 'bundler-transform:theme',
    cssModuleGeneratedSourceHash: themeTransformProof.cssModuleGeneratedSourceHash,
    sourceMapIdentityProof: themeTransformProof.sourceMapIdentityProof
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
