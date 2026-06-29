import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { cssModuleSourceMapIdentityFixture } from './js-ts-safe-project-merge-css-modules-test-helpers.mjs';

const boundedCssModuleSpecifier = './Bounded.module.css';
const boundedButtonSourceText = [
  `import styles from '${boundedCssModuleSpecifier}';`,
  "type ClassKey = 'root' | 'active';",
  'export function BoundedButton({ state }: { state: { kind: ClassKey } }) {',
  '  const direct: ClassKey = state.kind;',
  '  const directClass = styles[direct];',
  "  const inlineClass = styles[state.kind === 'active' ? 'active' : 'root'];",
  '  return <button className={styles[state.kind]}>{directClass}{inlineClass}</button>;',
  '}',
  ''
].join('\n');
const boundedCssModuleSourceText = [
  '.root { color: red; }',
  '.active { color: blue; }',
  ''
].join('\n');
const boundedGeneratedClassNameMap = { root: '_root_123', active: '_active_456' };
const boundedTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath: 'src/Bounded.module.css',
  sourceText: boundedCssModuleSourceText,
  generatedClassNameMap: boundedGeneratedClassNameMap,
  bundlerTransformHash: 'bundler-transform:bounded'
});
const boundedCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Bounded.module.css',
  sourceText: boundedCssModuleSourceText,
  metadata: {
    generatedClassNameMap: boundedGeneratedClassNameMap,
    bundlerTransformHash: 'bundler-transform:bounded',
    cssModuleGeneratedSourceHash: boundedTransformProof.cssModuleGeneratedSourceHash,
    sourceMapIdentityProof: boundedTransformProof.sourceMapIdentityProof
  }
});

const boundedCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_bounded_dynamic_css_module_use_sites',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [boundedCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Bounded.module.css', headSourceText: boundedCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/Bounded.tsx', baseSourceText: boundedButtonSourceText, workerSourceText: boundedButtonSourceText, headSourceText: boundedButtonSourceText }
  ]
});
assert.equal(boundedCssModuleProject.status, 'merged');
const boundedCssModuleGraph = boundedCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0];
assert.equal(boundedCssModuleGraph.status, 'ready');
assert.equal(boundedCssModuleGraph.blockerCount, 0);
const boundedDynamicUseSites = boundedCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.filter((site) => site.accessKind === 'bounded-dynamic-bracket');
assert.equal(boundedDynamicUseSites.length >= 6, true);
assert.deepEqual([...new Set(boundedDynamicUseSites.flatMap((site) => site.dynamicKeyDomain))].sort(), ['active', 'root']);
assert.equal(boundedDynamicUseSites.every((site) => site.dynamicKeyProofLevel === 'css-module-source-bound-finite-dynamic-key-domain'), true);
assert.equal(boundedDynamicUseSites.every((site) => typeof site.dynamicKeyDomainHash === 'string'), true);
assert.equal(boundedCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.some((blocker) => blocker.reasonCode === 'css-module-dynamic-member-access-unproved'), false);
assert.equal(boundedCssModuleProject.summary.projectGraphCssModuleUseSiteConflicts, 0);
assert.equal(matrixSurface(boundedCssModuleProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');

const boundedMissingSourceText = '.root { color: red; }\n';
const boundedMissingGeneratedClassNameMap = { root: '_root_123' };
const boundedMissingTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath: 'src/BoundedMissing.module.css',
  sourceText: boundedMissingSourceText,
  generatedClassNameMap: boundedMissingGeneratedClassNameMap,
  bundlerTransformHash: 'bundler-transform:bounded-missing'
});
const missingBoundedExportProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_bounded_dynamic_css_module_missing_export',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [
    importNativeSource({
      language: 'css',
      sourcePath: 'src/BoundedMissing.module.css',
      sourceText: boundedMissingSourceText,
      metadata: {
        generatedClassNameMap: boundedMissingGeneratedClassNameMap,
        bundlerTransformHash: 'bundler-transform:bounded-missing',
        cssModuleGeneratedSourceHash: boundedMissingTransformProof.cssModuleGeneratedSourceHash,
        sourceMapIdentityProof: boundedMissingTransformProof.sourceMapIdentityProof
      }
    })
  ],
  files: [
    { language: 'css', sourcePath: 'src/BoundedMissing.module.css', headSourceText: boundedMissingSourceText },
    {
      language: 'tsx',
      sourcePath: 'src/BoundedMissing.tsx',
      baseSourceText: boundedButtonSourceText.replace(boundedCssModuleSpecifier, './BoundedMissing.module.css'),
      workerSourceText: boundedButtonSourceText.replace(boundedCssModuleSpecifier, './BoundedMissing.module.css'),
      headSourceText: boundedButtonSourceText.replace(boundedCssModuleSpecifier, './BoundedMissing.module.css')
    }
  ]
});
assert.equal(missingBoundedExportProject.status, 'blocked');
assert.equal(missingBoundedExportProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.some((blocker) => blocker.reasonCode === 'css-module-export-name-unresolved'), true);
assert.equal(missingBoundedExportProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.some((blocker) => blocker.reasonCode === 'css-module-dynamic-member-access-unproved'), false);
assert.equal(matrixSurface(missingBoundedExportProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'failed');

const constObjectDomainSourceText = [
  `import styles from '${boundedCssModuleSpecifier}';`,
  'export function BoundedObject({ flag }) {',
  "  const state = flag ? { kind: 'root' } : { kind: 'active' };",
  '  return <button className={styles[state.kind]} />;',
  '}',
  ''
].join('\n');
const constObjectDomainProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_bounded_dynamic_css_module_const_object',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [boundedCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Bounded.module.css', headSourceText: boundedCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/BoundedObject.tsx', baseSourceText: constObjectDomainSourceText, workerSourceText: constObjectDomainSourceText, headSourceText: constObjectDomainSourceText }
  ]
});
assert.equal(constObjectDomainProject.status, 'merged');
const constObjectUseSites = constObjectDomainProject.outputProjectSymbolGraph.cssModuleUseSites.filter((site) => site.accessKind === 'bounded-dynamic-bracket');
assert.equal(constObjectUseSites.every((site) => site.dynamicKeyProofSource === 'local-const-object-literal-domain'), true);
assert.deepEqual([...new Set(constObjectUseSites.flatMap((site) => site.dynamicKeyDomain))].sort(), ['active', 'root']);

const dynamicWriteSourceText = boundedButtonSourceText.replace('const directClass = styles[direct];', "styles[state.kind] = 'x';");
const dynamicWriteProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_bounded_dynamic_css_module_write',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [boundedCssModuleImport],
  files: [
    { language: 'css', sourcePath: 'src/Bounded.module.css', headSourceText: boundedCssModuleSourceText },
    { language: 'tsx', sourcePath: 'src/BoundedWrite.tsx', baseSourceText: dynamicWriteSourceText, workerSourceText: dynamicWriteSourceText, headSourceText: dynamicWriteSourceText }
  ]
});
assert.equal(dynamicWriteProject.status, 'blocked');
assert.equal(dynamicWriteProject.outputProjectSymbolGraph.cssModuleUseSiteBlockers.some((blocker) => blocker.reasonCode === 'css-module-member-write-unsupported'), true);
