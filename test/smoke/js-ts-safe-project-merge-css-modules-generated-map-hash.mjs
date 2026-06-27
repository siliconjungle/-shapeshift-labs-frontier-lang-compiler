import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/Button.module.css';
const buttonCssModuleSpecifier = './Button.module' + '.css';
const generatedClassNameMap = { root: 'Button_root__hash', label: 'Button_label__hash' };
const baseSourceText = '.root {\n  color: red;\n}\n';
const workerSourceText = '.root {\n  color: red;\n}\n.label {\n  font-weight: 600;\n}\n';
const headSourceText = '.root {\n  color: blue;\n}\n';
const generatedClassNameMapHash = hashSemanticValue({
  kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
  generatedClassNameMap
});
const staleGeneratedClassNameMapHash = hashSemanticValue({
  kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
  generatedClassNameMap: { root: 'Button_root__stale', label: 'Button_label__hash' }
});

const projectStaleGeneratedClassNameMapHash = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_contract_stale_generated_map_hash',
  includeOutputProjectSymbolGraph: true,
  cssMergeOptionsByPath: {
    [sourcePath]: {
      generatedClassNameMap,
      generatedClassNameMapHash: staleGeneratedClassNameMapHash,
      bundlerTransformHash: 'bundler-transform:button-module',
      sourceMapProofHash: 'source-map-proof:button-module'
    }
  },
  files: projectSynthesizedProofInputFiles()
});
assert.equal(projectStaleGeneratedClassNameMapHash.status, 'blocked');
const staleGeneratedClassNameMapHashConflict = projectStaleGeneratedClassNameMapHash.conflicts.find((conflict) => conflict.details.reasonCode === 'css-module-generated-class-map-hash-mismatch');
assert.equal(staleGeneratedClassNameMapHashConflict?.details.proofBoundary, 'css-module-generated-class-name-map');
assert.equal(staleGeneratedClassNameMapHashConflict.details.declaredGeneratedClassNameMapHash, staleGeneratedClassNameMapHash);
assert.equal(staleGeneratedClassNameMapHashConflict.details.computedGeneratedClassNameMapHash, generatedClassNameMapHash);
assert.equal(projectStaleGeneratedClassNameMapHash.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-bundler-transform-identity-unproved'), false);
assert.equal(projectStaleGeneratedClassNameMapHash.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-source-map-proof-unproved'), false);

const staleGeneratedClassNameMapOutputGraphProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_stale_generated_map_output_graph',
  includeOutputProjectSymbolGraph: true,
  cssMergeOptionsByPath: {
    [sourcePath]: {
      generatedClassNameMap,
      generatedClassNameMapHash: staleGeneratedClassNameMapHash,
      bundlerTransformHash: 'bundler-transform:button-module',
      sourceMapProofHash: 'source-map-proof:button-module'
    }
  },
  files: [
    { language: 'css', sourcePath, headSourceText: baseSourceText },
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      baseSourceText: staticButtonSourceText(),
      workerSourceText: staticButtonSourceText(),
      headSourceText: staticButtonSourceText()
    }
  ]
});
assert.equal(staleGeneratedClassNameMapOutputGraphProject.status, 'blocked');
assert.equal(staleGeneratedClassNameMapOutputGraphProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(staleGeneratedClassNameMapOutputGraphProject.summary.projectGraphCssModuleGeneratedClassNameMapBlockers, 1);
assert.equal(staleGeneratedClassNameMapOutputGraphProject.summary.projectGraphCssModuleBundlerTransformIdentityBlockers, 0);
assert.equal(staleGeneratedClassNameMapOutputGraphProject.summary.projectGraphCssModuleSourceMapIdentityBlockers, 0);
assert.equal(staleGeneratedClassNameMapOutputGraphProject.summary.projectGraphCssModuleTransformProofBlockers, 1);
const staleGeneratedClassNameMapOutputGraphConflicts = staleGeneratedClassNameMapOutputGraphProject.conflicts.filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked');
assert.equal(staleGeneratedClassNameMapOutputGraphConflicts.length, 1);
assert.equal(staleGeneratedClassNameMapOutputGraphConflicts[0].details.reasonCode, 'css-module-generated-class-map-unproved');
assert.equal(staleGeneratedClassNameMapOutputGraphConflicts[0].details.proofBoundary, 'css-module-generated-class-name-map');
assert.equal(matrixSurface(staleGeneratedClassNameMapOutputGraphProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(staleGeneratedClassNameMapOutputGraphProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'failed');
assert.equal(matrixSurface(staleGeneratedClassNameMapOutputGraphProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed');
assert.equal(matrixSurface(staleGeneratedClassNameMapOutputGraphProject, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'passed');

function projectSynthesizedProofInputFiles() {
  const buttonTsx = staticButtonSourceText();
  return [
    { language: 'css', sourcePath, baseSourceText, workerSourceText, headSourceText },
    { language: 'tsx', sourcePath: 'src/Button.tsx', baseSourceText: buttonTsx, workerSourceText: buttonTsx, headSourceText: buttonTsx }
  ];
}

function staticButtonSourceText() {
  return [
    `import styles from '${buttonCssModuleSpecifier}';`,
    'export function Button() { return <button className={styles.root} />; }',
    ''
  ].join('\n');
}

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
