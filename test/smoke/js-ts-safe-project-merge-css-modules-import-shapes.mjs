import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

const readyCssModuleSpecifier = './Ready.module.css';
const readyCssModuleSourceText = '.root { color: red; }\n.label { display: block; }\n';
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

const readyNamespaceCssModuleSpecifier = './ReadyNamespace.module.css';
const readyNamespaceButtonSourceText = [
  `import * as readyStyles from '${readyNamespaceCssModuleSpecifier}';`,
  'const cx = (...values) => values.filter(Boolean).join(" ");',
  'export function ReadyNamespaceButton() {',
  '  const { active: activeClass } = readyStyles;',
  '  return <>',
  '    <button className={cx(readyStyles.root, readyStyles.label)}>{readyStyles.label}{activeClass}</button>',
  "    <span className={readyStyles['active']} />",
  '  </>;',
  '}',
  ''
].join('\n');
const readyNamespaceCssModuleSourceText = '.root { color: red; }\n.label { display: block; }\n.active { color: blue; }\n';
const readyNamespaceCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/ReadyNamespace.module.css',
  sourceText: readyNamespaceCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready-namespace',
      generatedClassNameMap: { root: '_root_ns_123', label: '_label_ns_456', active: '_active_ns_789' },
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready-namespace',
      cssModuleCompositionGraphHash: 'css-module-composition:ready-namespace',
      icssGraphHash: 'icss:ready-namespace'
    },
    bundlerTransformHash: 'bundler-transform:ready-namespace',
    sourceMapProofHash: 'source-map-proof:ready-namespace'
  }
});

const readyNamespaceCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_ready_namespace_css_module',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyNamespaceCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/ReadyNamespace.module.css', headSourceText: readyNamespaceCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/ReadyNamespace.tsx', baseSourceText: readyNamespaceButtonSourceText, workerSourceText: readyNamespaceButtonSourceText, headSourceText: readyNamespaceButtonSourceText }
  ]
});
assert.equal(readyNamespaceCssModuleProject.status, 'merged');
assert.equal(readyNamespaceCssModuleProject.summary.projectGraphCssModuleUseSiteBlockers, 0);
assert.equal(readyNamespaceCssModuleProject.summary.projectGraphCssModuleTransformProofBlockers, 0);
const readyNamespaceBinding = readyNamespaceCssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings[0];
assert.deepEqual([readyNamespaceBinding.importKind, readyNamespaceBinding.importedName, readyNamespaceBinding.localName], ['namespace', '*', 'readyStyles']);
const readyNamespaceGraph = readyNamespaceCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0];
assert.equal(readyNamespaceGraph.status, 'ready');
assert.equal(readyNamespaceGraph.importBindingCount, 1);
assert.equal(readyNamespaceGraph.useSiteCount >= 6, true);
assert.equal(readyNamespaceGraph.blockerCount, 0);
assert.equal(readyNamespaceGraph.bundlerTransformHash, 'bundler-transform:ready-namespace');
assert.equal(readyNamespaceGraph.sourceMapProofHash, 'source-map-proof:ready-namespace');
const namespaceHelperRoot = readyNamespaceCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.find((site) => site.useSiteKind === 'jsx-className-helper' && site.exportName === 'root');
assert.equal(namespaceHelperRoot?.receiverLocalName, 'readyStyles');
assert.equal(namespaceHelperRoot.helperCallProofLevel, 'css-module-class-helper-source-bounded-token-graph');
const namespaceStaticBracket = readyNamespaceCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.find((site) => site.useSiteKind === 'jsx-className' && site.exportName === 'active' && site.accessKind === 'static-bracket');
assert.equal(namespaceStaticBracket?.expressionText, "readyStyles['active']");
const namespaceDestructure = readyNamespaceCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.find((site) => site.useSiteKind === 'destructured-binding' && site.exportName === 'active');
assert.equal(namespaceDestructure?.localReferenceName, 'activeClass');
assert.equal(matrixSurface(readyNamespaceCssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(readyNamespaceCssModuleProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');

const namedReadyButtonSourceText = [
  `import { root as rootClass, label } from '${readyCssModuleSpecifier}';`,
  'export function NamedReadyButton() {',
  '  return <><button className={rootClass}>{label}</button><span className={label} /></>;',
  '}',
  ''
].join('\n');
const namedReadyCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_named_css_module_import_shape',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Ready.module.css', headSourceText: readyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/NamedReady.tsx', baseSourceText: namedReadyButtonSourceText, workerSourceText: namedReadyButtonSourceText, headSourceText: namedReadyButtonSourceText }
  ]
});
assert.equal(namedReadyCssModuleProject.status, 'blocked');
assert.equal(namedReadyCssModuleProject.summary.projectGraphCssModuleUseSiteProofBlockers, 2);
assert.equal(namedReadyCssModuleProject.summary.projectGraphCssModuleTransformProofBlockers, 0);
assert.deepEqual(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings.map((binding) => [binding.importKind, binding.importedName, binding.localName]), [
  ['named', 'root', 'rootClass'],
  ['named', 'label', 'label']
]);
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.length, 0);
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.every((blocker) => blocker.reasonCode === 'css-module-named-export-transform-unproved'), true);
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].blockerCount, 2);
assert.equal(matrixSurface(namedReadyCssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'failed');
assert.equal(matrixSurface(namedReadyCssModuleProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');

const unsafeHelperButtonSourceText = [
  `import readyStyles from '${readyCssModuleSpecifier}';`,
  'const cx = (...values) => values.filter(Boolean).join(" ");',
  'function choose(value) { return value; }',
  'export function UnsafeHelperButton() {',
  '  return <button className={cx(readyStyles.root, choose(readyStyles.label))} />;',
  '}',
  ''
].join('\n');
const unsafeHelperProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_unsafe_helper_call',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Ready.module.css', headSourceText: readyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/UnsafeReady.tsx', baseSourceText: unsafeHelperButtonSourceText, workerSourceText: unsafeHelperButtonSourceText, headSourceText: unsafeHelperButtonSourceText }
  ]
});
assert.equal(unsafeHelperProject.status, 'blocked');
assert.equal(unsafeHelperProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-helper-call-unproved'), true);
assert.equal(unsafeHelperProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'blocked');
