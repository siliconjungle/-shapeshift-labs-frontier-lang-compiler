import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';

const readyCssModuleSpecifier = './Ready.module.css';
const readyCssModuleSourceText = [
  '.root { color: red; }',
  '.label { display: block; }',
  ''
].join('\n');
const missingExportButtonSourceText = [
  `import readyStyles from '${readyCssModuleSpecifier}';`,
  'export function BrokenButton() {',
  '  return <button className={readyStyles.missing}>{readyStyles.label}</button>;',
  '}',
  ''
].join('\n');
const dependencyCssModuleSpecifier = './Composed.module.css';
const dependencyButtonSourceText = [
  `import composedStyles from '${dependencyCssModuleSpecifier}';`,
  'export function ComposedButton() {',
  '  return <button className={composedStyles.root} />;',
  '}',
  ''
].join('\n');
const dependencyCssModuleSourceText = [
  ':im' + 'port("./tokens.module.css") {',
  '  importedColor: color;',
  '}',
  '.root {',
  '  composes: base from "./base.module.css";',
  '  color: importedColor;',
  '}',
  ''
].join('\n');
const dependencyBaseCssModuleSourceText = [
  '.base {',
  '  display: inline-flex;',
  '}',
  ''
].join('\n');
const dependencyTokensCssModuleSourceText = [
  ':export {',
  '  importedColor: red;',
  '}',
  ''
].join('\n');
const localDependencyCssModuleSpecifier = './LocalComposed.module.css';
const localDependencyButtonSourceText = [
  `import localStyles from '${localDependencyCssModuleSpecifier}';`,
  'export function LocalComposedButton() {',
  '  return <button className={localStyles.root}>{localStyles.primaryColor}</button>;',
  '}',
  ''
].join('\n');
const localDependencyCssModuleSourceText = [
  '.base { display: block; }',
  '.root {',
  '  composes: base;',
  '  color: red;',
  '}',
  ':export {',
  '  primaryColor: red;',
  '}',
  ''
].join('\n');

const unresolvedDependencyCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Composed.module.css',
  sourceText: dependencyCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:composed',
      exports: [{ name: 'root' }],
      compositions: [{ localName: 'root', names: ['base'], source: './base.module.css', sourceKind: 'file' }],
      icssImports: [{ source: './tokens.module.css', importedName: 'color', localName: 'importedColor' }],
      generatedClassNameMapHash: 'css-module-generated-map:composed',
      jsTsUseSiteGraphHash: 'css-module-use-sites:composed'
    },
    bundlerTransformHash: 'bundler-transform:composed',
    sourceMapProofHash: 'source-map-proof:composed'
  }
});
const unresolvedDependencyCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_dependency_graphs_unproved',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [unresolvedDependencyCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Composed.module.css', headSourceText: dependencyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/Composed.tsx', baseSourceText: dependencyButtonSourceText, workerSourceText: dependencyButtonSourceText, headSourceText: dependencyButtonSourceText }
  ]
});
assert.equal(unresolvedDependencyCssModuleProject.status, 'blocked');
const unresolvedDependencyReasonCodes = unresolvedDependencyCssModuleProject.conflicts
  .filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked')
  .map((conflict) => conflict.details.reasonCode);
assert.equal(unresolvedDependencyReasonCodes.includes('css-module-composition-resolution-unproved'), true);
assert.equal(unresolvedDependencyReasonCodes.includes('css-module-icss-graph-unproved'), true);
const unresolvedDependencyGraph = unresolvedDependencyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0];
assert.equal(unresolvedDependencyGraph.status, 'blocked');
assert.equal(unresolvedDependencyGraph.blockerCount, 2);

const localDependencyCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/LocalComposed.module.css',
  sourceText: localDependencyCssModuleSourceText,
  metadata: {
    generatedClassNameMap: { base: '_base_111', root: '_root_222' },
    jsTsUseSiteGraphHash: 'css-module-use-sites:local-composed',
    bundlerTransformHash: 'bundler-transform:local-composed',
    sourceMapProofHash: 'source-map-proof:local-composed'
  }
});
const localDependencyCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_local_dependency_graphs_inferred',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [localDependencyCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/LocalComposed.module.css', headSourceText: localDependencyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/LocalComposed.tsx', baseSourceText: localDependencyButtonSourceText, workerSourceText: localDependencyButtonSourceText, headSourceText: localDependencyButtonSourceText }
  ]
});
assert.equal(localDependencyCssModuleProject.status, 'merged');
const localDependencyBinding = localDependencyCssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings[0];
assert.equal(localDependencyBinding.cssModuleEvidenceSource, 'inferred-source');
assert.equal(typeof localDependencyBinding.cssModuleCompositionGraphHash, 'string');
assert.equal(typeof localDependencyBinding.icssGraphHash, 'string');
const localDependencyReasonCodes = localDependencyCssModuleProject.conflicts
  .filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked')
  .map((conflict) => conflict.details.reasonCode);
assert.equal(localDependencyReasonCodes.includes('css-module-composition-resolution-unproved'), false);
assert.equal(localDependencyReasonCodes.includes('css-module-icss-graph-unproved'), false);
assert.equal(localDependencyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'ready');

const projectDependencyCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_project_dependency_graphs_inferred',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [
    importNativeSource({
      language: 'css',
      sourcePath: 'src/Composed.module.css',
      sourceText: dependencyCssModuleSourceText,
      metadata: {
        generatedClassNameMap: { root: '_root_333' },
        bundlerTransformHash: 'bundler-transform:composed',
        sourceMapProofHash: 'source-map-proof:composed'
      }
    }),
    importNativeSource({
      language: 'css',
      sourcePath: 'src/base.module.css',
      sourceText: dependencyBaseCssModuleSourceText
    }),
    importNativeSource({
      language: 'css',
      sourcePath: 'src/tokens.module.css',
      sourceText: dependencyTokensCssModuleSourceText
    })
  ],
  files: [
    { language: 'css', sourcePath: 'src/Composed.module.css', headSourceText: dependencyCssModuleSourceText },
    { language: 'css', sourcePath: 'src/base.module.css', headSourceText: dependencyBaseCssModuleSourceText },
    { language: 'css', sourcePath: 'src/tokens.module.css', headSourceText: dependencyTokensCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/Composed.tsx', baseSourceText: dependencyButtonSourceText, workerSourceText: dependencyButtonSourceText, headSourceText: dependencyButtonSourceText }
  ]
});
assert.equal(projectDependencyCssModuleProject.status, 'merged');
const projectDependencyBinding = projectDependencyCssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings[0];
assert.equal(projectDependencyBinding.cssModuleEvidenceSource, 'inferred-source');
assert.equal(projectDependencyBinding.cssModuleCompositionGraphSource, 'project-source');
assert.equal(projectDependencyBinding.icssGraphSource, 'project-source');
assert.equal(typeof projectDependencyBinding.cssModuleCompositionGraphHash, 'string');
assert.equal(typeof projectDependencyBinding.icssGraphHash, 'string');
const projectDependencyGraph = projectDependencyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0];
assert.equal(projectDependencyGraph.status, 'ready');
assert.equal(projectDependencyGraph.cssModuleCompositionGraphSource, 'project-source');
assert.equal(projectDependencyGraph.icssGraphSource, 'project-source');
assert.equal(typeof projectDependencyGraph.cssModuleCompositionGraphHash, 'string');
assert.equal(typeof projectDependencyGraph.icssGraphHash, 'string');
const projectDependencyReasonCodes = projectDependencyCssModuleProject.conflicts
  .filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked')
  .map((conflict) => conflict.details.reasonCode);
assert.equal(projectDependencyReasonCodes.includes('css-module-composition-resolution-unproved'), false);
assert.equal(projectDependencyReasonCodes.includes('css-module-icss-graph-unproved'), false);
assert.equal(matrixSurface(projectDependencyCssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');

const readyCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Ready.module.css',
  sourceText: readyCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready',
      generatedClassNameMap: { root: '_root_123', label: '_label_456' },
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready',
      cssModuleCompositionGraphHash: 'css-module-composition:ready',
      icssGraphHash: 'icss:ready'
    },
    bundlerTransformHash: 'bundler-transform:ready',
    sourceMapProofHash: 'source-map-proof:ready'
  }
});
const missingExportProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_missing_export',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Ready.module.css', headSourceText: readyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/Broken.tsx', baseSourceText: missingExportButtonSourceText, workerSourceText: missingExportButtonSourceText, headSourceText: missingExportButtonSourceText }
  ]
});
assert.equal(missingExportProject.status, 'blocked');
assert.equal(missingExportProject.conflicts.some((conflict) => conflict.code === 'project-output-symbol-unresolved'), false);
assert.equal(missingExportProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-export-name-unresolved'), true);
assert.equal(matrixSurface(missingExportProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'failed');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
