import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { cssModuleSourceMapIdentityFixture } from './js-ts-safe-project-merge-css-modules-test-helpers.mjs';

const readyCssModuleSpecifier = './Ready.module.css';
const readyCssModuleSourceText = '.root { color: red; }\n.label { display: block; }\n';
const readyGeneratedClassNameMap = { root: '_root_123', label: '_label_456' };
const readyTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath: 'src/Ready.module.css',
  sourceText: readyCssModuleSourceText,
  generatedClassNameMap: readyGeneratedClassNameMap,
  bundlerTransformHash: 'bundler-transform:ready'
});
const readyCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Ready.module.css',
  sourceText: readyCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready',
      generatedClassNameMap: readyGeneratedClassNameMap,
      generatedClassNameMapHash: readyTransformProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready',
      cssModuleCompositionGraphHash: 'css-module-composition:ready',
      icssGraphHash: 'icss:ready'
    },
    bundlerTransformHash: 'bundler-transform:ready',
    cssModuleGeneratedSourceHash: readyTransformProof.cssModuleGeneratedSourceHash,
    sourceMapIdentityProof: readyTransformProof.sourceMapIdentityProof
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
const readyNamespaceGeneratedClassNameMap = { root: '_root_ns_123', label: '_label_ns_456', active: '_active_ns_789' };
const readyNamespaceTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath: 'src/ReadyNamespace.module.css',
  sourceText: readyNamespaceCssModuleSourceText,
  generatedClassNameMap: readyNamespaceGeneratedClassNameMap,
  bundlerTransformHash: 'bundler-transform:ready-namespace'
});
const readyNamespaceCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/ReadyNamespace.module.css',
  sourceText: readyNamespaceCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready-namespace',
      generatedClassNameMap: readyNamespaceGeneratedClassNameMap,
      generatedClassNameMapHash: readyNamespaceTransformProof.generatedClassNameMapHash,
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready-namespace',
      cssModuleCompositionGraphHash: 'css-module-composition:ready-namespace',
      icssGraphHash: 'icss:ready-namespace'
    },
    bundlerTransformHash: 'bundler-transform:ready-namespace',
    cssModuleGeneratedSourceHash: readyNamespaceTransformProof.cssModuleGeneratedSourceHash,
    sourceMapIdentityProof: readyNamespaceTransformProof.sourceMapIdentityProof
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
assert.equal(readyNamespaceGraph.sourceMapProofHash.startsWith('fnv1a32:'), true);
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
assert.equal(namedReadyCssModuleProject.status, 'merged');
assert.equal(namedReadyCssModuleProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(namedReadyCssModuleProject.summary.projectGraphCssModuleTransformProofBlockers, 0);
assert.deepEqual(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleImportBindings.map((binding) => [binding.importKind, binding.importedName, binding.localName]), [
  ['named', 'root', 'rootClass'],
  ['named', 'label', 'label']
]);
const namedUseSites = namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.filter((site) => site.useSiteKind === 'named-import-reference');
assert.equal(namedUseSites.length >= 3, true);
assert.equal(namedUseSites.every((site) => site.accessKind === 'named-import'), true);
assert.equal(namedUseSites.every((site) => typeof site.scopeReferenceRecordId === 'string'), true);
assert.equal(namedUseSites.some((site) => site.exportName === 'root' && site.localReferenceName === 'rootClass'), true);
assert.equal(namedUseSites.filter((site) => site.exportName === 'label').length >= 2, true);
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.length, 0);
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'ready');
assert.equal(namedReadyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].blockerCount, 0);
assert.equal(matrixSurface(namedReadyCssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(namedReadyCssModuleProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');

const namedMissingTransformImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Ready.module.css',
  sourceText: readyCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready-no-transform',
      generatedClassNameMap: { root: '_root_123', label: '_label_456' },
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready-no-transform'
    }
  }
});
const namedMissingTransformProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_named_css_module_import_missing_transform_shape',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [namedMissingTransformImport],
  files: [
    { language: 'css', sourcePath: 'src/Ready.module.css', headSourceText: readyCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/NamedReady.tsx', baseSourceText: namedReadyButtonSourceText, workerSourceText: namedReadyButtonSourceText, headSourceText: namedReadyButtonSourceText }
  ]
});
assert.equal(namedMissingTransformProject.status, 'blocked');
assert.equal(namedMissingTransformProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(namedMissingTransformProject.summary.projectGraphCssModuleTransformProofBlockers, 4);
assert.equal(namedMissingTransformProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.some((blocker) => blocker.reasonCode === 'css-module-named-export-reference-unproved'), false);
assert.equal(namedMissingTransformProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'blocked');
assert.equal(matrixSurface(namedMissingTransformProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(namedMissingTransformProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(matrixSurface(namedMissingTransformProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'failed');
assert.equal(matrixSurface(namedMissingTransformProject, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'failed');

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
