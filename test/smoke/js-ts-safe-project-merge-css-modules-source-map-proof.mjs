import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';

const sourcePath = 'src/Button.module.css';
const buttonCssModuleSpecifier = './Button.module' + '.css';
const generatedClassNameMap = { root: 'Button_root__hash', label: 'Button_label__hash' };
const baseSourceText = '.root {\n  color: red;\n}\n';
const workerSourceText = '.root {\n  color: red;\n}\n.label {\n  font-weight: 600;\n}\n';
const headSourceText = '.root {\n  color: blue;\n}\n';

const projectMissingSourceMapProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_contract_project_synthesis_missing_source_map_proof',
  includeOutputProjectSymbolGraph: true,
  cssMergeOptionsByPath: {
    [sourcePath]: {
      generatedClassNameMap,
      bundlerTransformHash: 'bundler-transform:button-module'
    }
  },
  files: projectSynthesizedProofInputFiles()
});
assert.equal(projectMissingSourceMapProof.status, 'blocked');
assert.equal(projectMissingSourceMapProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-generated-class-map-unproved'), false);
assert.equal(projectMissingSourceMapProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-bundler-transform-identity-unproved'), false);
const sourceMapOnlyContractConflict = projectMissingSourceMapProof.conflicts.find((conflict) => conflict.details.reasonCode === 'css-module-source-map-proof-unproved');
assert.equal(sourceMapOnlyContractConflict?.details.proofBoundary, 'css-module-source-map-identity');
assert.equal(sourceMapOnlyContractConflict.details.proofGap.failClosed, true);
assert.equal(sourceMapOnlyContractConflict.details.proofGap.semanticEquivalenceClaim, false);

const sourceMapOnlyBoundaryProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_source_map_boundary_only',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [importNativeSource({
    language: 'css',
    sourcePath,
    sourceText: baseSourceText,
    metadata: {
      generatedClassNameMap: { root: 'Button_root__hash' },
      bundlerTransformHash: 'bundler-transform:button-module'
    }
  })],
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
assert.equal(sourceMapOnlyBoundaryProject.status, 'blocked');
assert.equal(sourceMapOnlyBoundaryProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(sourceMapOnlyBoundaryProject.summary.projectGraphCssModuleGeneratedClassNameMapBlockers, 0);
assert.equal(sourceMapOnlyBoundaryProject.summary.projectGraphCssModuleBundlerTransformIdentityBlockers, 0);
assert.equal(sourceMapOnlyBoundaryProject.summary.projectGraphCssModuleSourceMapIdentityBlockers, 1);
assert.equal(sourceMapOnlyBoundaryProject.summary.projectGraphCssModuleTransformProofBlockers, 1);
const sourceMapOnlyConflicts = sourceMapOnlyBoundaryProject.conflicts.filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked');
assert.equal(sourceMapOnlyConflicts.length, 1);
assert.equal(sourceMapOnlyConflicts[0].details.reasonCode, 'css-module-source-map-proof-unproved');
assert.equal(sourceMapOnlyConflicts[0].details.proofBoundary, 'css-module-source-map-identity');
assert.equal(matrixSurface(sourceMapOnlyBoundaryProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(sourceMapOnlyBoundaryProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(matrixSurface(sourceMapOnlyBoundaryProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed');
const sourceMapOnlySurface = matrixSurface(sourceMapOnlyBoundaryProject, 'css-modules-source-map-identity');
assert.equal(sourceMapOnlySurface.proofStatuses['css-module-source-map-identity'], 'failed');
assert.equal(sourceMapOnlySurface.missingRouteIds.includes('prove-css-module-source-map-identity'), true);
assert.equal(sourceMapOnlySurface.missingRouteIds.includes('prove-css-module-bundler-transform-identity'), false);

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
