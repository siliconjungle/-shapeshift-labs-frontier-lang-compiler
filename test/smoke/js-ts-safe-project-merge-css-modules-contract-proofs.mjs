import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { parseCssSemanticSheet } from '@shapeshift-labs/frontier-lang-css';
import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';
import { cssModuleSourceMapIdentityFixture } from './js-ts-safe-project-merge-css-modules-test-helpers.mjs';

const sourcePath = 'src/Button.module.css';
const buttonCssModuleSpecifier = './Button.module' + '.css';
const generatedClassNameMap = { root: 'Button_root__hash', label: 'Button_label__hash' };
const jsTsUseSiteGraphHash = 'hash_css_module_use_sites';
const baseSourceText = [
  '.root {',
  '  color: red;',
  '}',
  ''
].join('\n');
const workerSourceText = [
  '.root {',
  '  color: red;',
  '}',
  '.label {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');
const headSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  ''
].join('\n');
const outputSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  '',
  '.label {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');

const missingGraphProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_missing_graph');
assert.equal(missingGraphProject.status, 'blocked');
assert.equal(missingGraphProject.summary.cssBlockedFiles, 1);
assert.equal(missingGraphProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-js-ts-use-site-graph-unproved'), true);
assert.equal(matrixSurface(missingGraphProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

const hashOnlyProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_hash_only', {
  generatedClassNameMap,
  jsTsUseSiteGraphHash
});
assert.equal(hashOnlyProject.status, 'blocked');
assert.equal(hashOnlyProject.summary.cssBlockedFiles, 1);
assert.equal(hashOnlyProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-contract-source-proof-unproved'), true);
assert.equal(matrixSurface(hashOnlyProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'failed');

const moduleHash = parseCssSemanticSheet(workerSourceText, {
  sourcePath,
  generatedClassNameMap,
  jsTsUseSiteGraphHash
}).cssModules.moduleHash;
const generatedClassNameMapHash = hashSemanticValue({
  kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
  generatedClassNameMap
});
const synthesizedTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath,
  sourceText: outputSourceText,
  generatedClassNameMap,
  bundlerTransformHash: 'bundler-transform:button-module'
});
const provenProject = mergeButtonModuleProject('js_ts_safe_project_merge_css_module_contract_source_bound_proof', {
  generatedClassNameMap,
  jsTsUseSiteGraphHash,
  cssModuleContractProofs: [{
    id: 'proof_css_project_module_label_export',
    kind: 'css-source-bound-module-contract-proof',
    status: 'passed',
    sourcePath,
    side: 'worker',
    changeKind: 'add',
    contractKey: 'export:label',
    contractKind: 'css-module-export',
    baseSourceHash: hashSemanticValue(baseSourceText),
    workerSourceHash: hashSemanticValue(workerSourceText),
    headSourceHash: hashSemanticValue(headSourceText),
    outputSourceHash: hashSemanticValue(outputSourceText),
    moduleHash,
    generatedClassNameMapHash,
    jsTsUseSiteGraphHash
  }]
});
assert.equal(provenProject.status, 'merged');
assert.equal(provenProject.summary.cssMergedFiles, 1);
assert.equal(provenProject.files[0].result.cssModuleContractProofs.length, 1);
assert.equal(provenProject.files[0].result.admission.cssModuleContractProofs.length, 1);
assert.equal(provenProject.files[0].result.workerChangedCssModuleContracts, 1);
assert.equal(provenProject.outputFiles[0].sourceText, outputSourceText);
assert.equal(matrixSurface(provenProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');

const projectSynthesizedProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_contract_project_synthesized_proof',
  includeOutputProjectSymbolGraph: true,
  cssMergeOptionsByPath: {
    [sourcePath]: {
      generatedClassNameMap,
      bundlerTransformHash: 'bundler-transform:button-module',
      cssModuleGeneratedSourceHash: synthesizedTransformProof.cssModuleGeneratedSourceHash,
      sourceMapIdentityProof: synthesizedTransformProof.sourceMapIdentityProof
    }
  },
  files: [
    { language: 'css', sourcePath, baseSourceText, workerSourceText, headSourceText },
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      baseSourceText: [
        `import styles from '${buttonCssModuleSpecifier}';`,
        'export function Button() { return <button className={styles.root} />; }',
        ''
      ].join('\n'),
      workerSourceText: [
        `import styles from '${buttonCssModuleSpecifier}';`,
        'export function Button() { return <button className={styles.root} />; }',
        ''
      ].join('\n'),
      headSourceText: [
        `import styles from '${buttonCssModuleSpecifier}';`,
        'export function Button() { return <button className={styles.root} />; }',
        ''
      ].join('\n')
    }
  ]
});
assert.equal(projectSynthesizedProof.status, 'merged');
const synthesizedCssFile = projectSynthesizedProof.files.find((file) => file.sourcePath === sourcePath);
assert.equal(synthesizedCssFile.result.cssModuleContractProofs.length >= 1, true);
assert.equal(synthesizedCssFile.result.cssModuleContractProofs.some((proof) => proof.proofLevel === 'css-module-contract-project-source-bound'), true);
assert.equal(synthesizedCssFile.result.cssModuleContractProofs.every((proof) => proof.jsTsUseSiteGraphHash?.startsWith('fnv1a32:')), true);
assert.equal(synthesizedCssFile.result.cssModuleContractProofs.every((proof) => proof.bundlerTransformHash === 'bundler-transform:button-module'), true);
assert.equal(synthesizedCssFile.result.cssModuleContractProofs.every((proof) => proof.sourceMapProofHash?.startsWith('fnv1a32:')), true);
assert.equal(projectSynthesizedProof.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'ready');
assert.equal(typeof projectSynthesizedProof.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].jsTsUseSiteGraphHash, 'string');
const projectSynthesizedSurface = matrixSurface(projectSynthesizedProof, 'css-modules-use-site-graph');
assert.equal(projectSynthesizedSurface.proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(projectSynthesizedProof, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(matrixSurface(projectSynthesizedProof, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed');
assert.equal(matrixSurface(projectSynthesizedProof, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'passed');

const projectMissingBundlerProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_contract_project_synthesis_missing_transform_proof',
  cssMergeOptionsByPath: {
    [sourcePath]: { generatedClassNameMap }
  },
  files: projectSynthesizedProofInputFiles()
});
assert.equal(projectMissingBundlerProof.status, 'blocked');
assert.equal(projectMissingBundlerProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-bundler-transform-identity-unproved'), true);
assert.equal(projectMissingBundlerProof.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-source-map-proof-unproved'), true);

const transformBoundaryProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_transform_boundaries_only',
  includeOutputProjectSymbolGraph: true,
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
assert.equal(transformBoundaryProject.status, 'blocked');
assert.equal(transformBoundaryProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(transformBoundaryProject.summary.projectGraphCssModuleGeneratedClassNameMapBlockers, 1);
assert.equal(transformBoundaryProject.summary.projectGraphCssModuleBundlerTransformIdentityBlockers, 1);
assert.equal(transformBoundaryProject.summary.projectGraphCssModuleSourceMapIdentityBlockers, 1);
assert.equal(transformBoundaryProject.summary.projectGraphCssModuleTransformProofBlockers, 3);
const transformBoundaryConflicts = transformBoundaryProject.conflicts.filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked');
assert.equal(transformBoundaryConflicts.length, 3);
assert.equal(transformBoundaryConflicts.some((conflict) => conflict.details.proofBoundary === 'css-module-generated-class-name-map'), true);
assert.equal(transformBoundaryConflicts.some((conflict) => conflict.details.proofBoundary === 'css-module-bundler-transform-identity'), true);
assert.equal(transformBoundaryConflicts.some((conflict) => conflict.details.proofBoundary === 'css-module-source-map-identity'), true);
const transformBoundarySurface = matrixSurface(transformBoundaryProject, 'css-modules-use-site-graph');
assert.equal(transformBoundarySurface.proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(transformBoundarySurface.missingRouteIds.includes('prove-css-module-use-site-graph'), false);
assert.equal(transformBoundarySurface.missingRouteIds.includes('prove-css-module-generated-class-name-map'), false);
const transformGeneratedClassNameMapSurface = matrixSurface(transformBoundaryProject, 'css-modules-generated-class-name-map');
const transformBundlerIdentitySurface = matrixSurface(transformBoundaryProject, 'css-modules-bundler-transform-identity');
const transformSourceMapIdentitySurface = matrixSurface(transformBoundaryProject, 'css-modules-source-map-identity');
assert.equal(transformGeneratedClassNameMapSurface.status, 'bounded-evidence');
assert.equal(transformBundlerIdentitySurface.status, 'bounded-evidence');
assert.equal(transformSourceMapIdentitySurface.status, 'bounded-evidence');
assert.equal(transformGeneratedClassNameMapSurface.proofStatuses['css-module-generated-class-name-map'], 'failed');
assert.equal(transformBundlerIdentitySurface.proofStatuses['css-module-bundler-transform-identity'], 'failed');
assert.equal(transformSourceMapIdentitySurface.proofStatuses['css-module-source-map-identity'], 'failed');
assert.equal(transformGeneratedClassNameMapSurface.missingRouteIds.includes('prove-css-module-generated-class-name-map'), true);
assert.equal(transformBundlerIdentitySurface.missingRouteIds.includes('prove-css-module-bundler-transform-identity'), true);
assert.equal(transformSourceMapIdentitySurface.missingRouteIds.includes('prove-css-module-source-map-identity'), true);

const useSiteOnlyTransformProof = cssModuleSourceMapIdentityFixture({
  sourcePath,
  sourceText: baseSourceText,
  generatedClassNameMap: { root: 'Button_root__hash' },
  bundlerTransformHash: 'bundler-transform:button-module'
});
const useSiteOnlyProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_use_site_only_boundary',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [importNativeSource({
    language: 'css',
    sourcePath,
    sourceText: baseSourceText,
    metadata: {
      generatedClassNameMap: { root: 'Button_root__hash' },
      bundlerTransformHash: 'bundler-transform:button-module',
      cssModuleGeneratedSourceHash: useSiteOnlyTransformProof.cssModuleGeneratedSourceHash,
      sourceMapIdentityProof: useSiteOnlyTransformProof.sourceMapIdentityProof
    }
  })],
  files: [
    { language: 'css', sourcePath, headSourceText: baseSourceText },
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      baseSourceText: missingExportButtonSourceText(),
      workerSourceText: missingExportButtonSourceText(),
      headSourceText: missingExportButtonSourceText()
    }
  ]
});
assert.equal(useSiteOnlyProject.status, 'blocked');
assert.equal(useSiteOnlyProject.summary.projectGraphCssModuleUseSiteProofBlockers >= 1, true);
assert.equal(useSiteOnlyProject.summary.projectGraphCssModuleTransformProofBlockers, 0);
const useSiteOnlySurface = matrixSurface(useSiteOnlyProject, 'css-modules-use-site-graph');
assert.equal(useSiteOnlySurface.proofStatuses['css-module-use-site-graph'], 'failed');
assert.equal(useSiteOnlySurface.missingRouteIds.includes('prove-css-module-use-site-graph'), true);
const useSiteOnlyGeneratedClassNameMapSurface = matrixSurface(useSiteOnlyProject, 'css-modules-generated-class-name-map');
const useSiteOnlyBundlerIdentitySurface = matrixSurface(useSiteOnlyProject, 'css-modules-bundler-transform-identity');
const useSiteOnlySourceMapIdentitySurface = matrixSurface(useSiteOnlyProject, 'css-modules-source-map-identity');
assert.equal(useSiteOnlyGeneratedClassNameMapSurface.proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(useSiteOnlyBundlerIdentitySurface.proofStatuses['css-module-bundler-transform-identity'], 'passed');
assert.equal(useSiteOnlySourceMapIdentitySurface.proofStatuses['css-module-source-map-identity'], 'passed');
assert.equal(useSiteOnlyBundlerIdentitySurface.missingRouteIds.includes('prove-css-module-bundler-transform-identity'), false);

function mergeButtonModuleProject(id, cssOptions = {}) {
  return safeMergeJsTsProject({
    id,
    cssMergeOptionsByPath: { [sourcePath]: cssOptions },
    files: [{ language: 'css', sourcePath, baseSourceText, workerSourceText, headSourceText }]
  });
}

function projectSynthesizedProofInputFiles() {
  const buttonTsx = [
    `import styles from '${buttonCssModuleSpecifier}';`,
    'export function Button() { return <button className={styles.root} />; }',
    ''
  ].join('\n');
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

function missingExportButtonSourceText() {
  return [
    `import styles from '${buttonCssModuleSpecifier}';`,
    'export function Button() { return <button className={styles.missing} />; }',
    ''
  ].join('\n');
}

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
