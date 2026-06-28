import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { cssModuleSourceMapIdentityProof } from '../../src/js-ts-safe-project-merge-css-module-source-map.js';

const sourcePath = 'src/Card.module.css';
const cssModuleSpecifier = './Card.module.css';
const generatedClassNameMap = {
  root: 'Card_root__k9a1f',
  title: 'Card_title__0b2cd',
  toneAccent: 'Card_toneAccent__xx44a'
};
const generatedClassNameMapHash = hashSemanticValue({
  kind: 'frontier.lang.css.modules.generatedClassNameMap.v1',
  generatedClassNameMap
});
const loaderRequest = 'css-loader?modules&importLoaders=1&localIdentName=[name]_[local]__[hash:base64:5]!postcss-loader!src/Card.module.css';
const loaderQuery = {
  modules: true,
  importLoaders: 1,
  localIdentName: '[name]_[local]__[hash:base64:5]',
  namedExport: false
};
const loaderRequestHash = hashSemanticValue({ kind: 'frontier.lang.cssModuleLoaderRequest.v1', loaderRequest });
const loaderQueryHash = hashSemanticValue({ kind: 'frontier.lang.cssModuleLoaderQuery.v1', loaderQuery });
const baseSourceText = [
  '.root {',
  '  color: red;',
  '}',
  '.title {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');
const workerSourceText = [
  '.root {',
  '  color: red;',
  '}',
  '.title {',
  '  font-weight: 600;',
  '}',
'.toneAccent {',
  '  color: green;',
  '}',
  ''
].join('\n');
const headSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  '.title {',
  '  font-weight: 600;',
  '}',
  ''
].join('\n');
const outputSourceText = [
  '.root {',
  '  color: blue;',
  '}',
  '',
  '.title {',
  '  font-weight: 600;',
  '}',
  '',
'.toneAccent {',
  '  color: green;',
  '}',
  ''
].join('\n');
const generatedSourceText = [
  '.Card_root__k9a1f { color: blue; }',
  '.Card_title__0b2cd { font-weight: 600; }',
  '.Card_toneAccent__xx44a { color: green; }',
  '/*# sourceMappingURL=Card.module.css.map */',
  ''
].join('\n');
const generatedSourceHash = hashSemanticValue(generatedSourceText);
const sourceMapArtifact = {
  version: 3,
  file: 'Card.module.css',
  sources: ['../src/Card.module.css'],
  sourcesContent: [outputSourceText],
  names: ['root', 'title', 'toneAccent'],
  mappings: 'AAAA;AAGA;AAIA'
};
const sourceMapArtifactHash = hashSemanticValue({
  kind: 'frontier.lang.cssModuleSourceMapArtifact.v1',
  sourceMap: sourceMapArtifact
});
const sourcesContentHash = hashSemanticValue({
  kind: 'frontier.lang.cssModuleSourceMapSourcesContent.v1',
  sourcesContent: sourceMapArtifact.sourcesContent
});

const realBundlerProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_real_bundler_source_map_corpus',
  includeOutputProjectSymbolGraph: true,
  cssMergeOptionsByPath: {
    [sourcePath]: realBundlerMergeOptions()
  },
  files: projectInputFiles()
});
assert.equal(realBundlerProofProject.status, 'merged');
const cssFile = realBundlerProofProject.files.find((file) => file.sourcePath === sourcePath);
const contractProof = cssFile.result.cssModuleContractProofs[0];
assert.equal(contractProof.sourceMapProofHash.startsWith('fnv1a32:'), true);
assert.equal(contractProof.bundlerTransformHash, 'bundler-transform:css-loader-postcss-card-module');
assert.equal(realBundlerProofProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].sourceMapProofHash, contractProof.sourceMapProofHash);
assert.equal(matrixSurface(realBundlerProofProject, 'css-modules-use-site-graph').proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal(matrixSurface(realBundlerProofProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed');
assert.equal(matrixSurface(realBundlerProofProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed');
assert.equal(matrixSurface(realBundlerProofProject, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'passed');

const staleLoaderQueryProof = cssModuleSourceMapIdentityProof({
  sourceMapIdentityProof: realBundlerSourceMapIdentityProof({
    loaderQueryHash: hashSemanticValue({
      kind: 'frontier.lang.cssModuleLoaderQuery.v1',
      loaderQuery: { ...loaderQuery, localIdentName: '[hash:base64]' }
    })
  })
}, realBundlerProofContext());
assert.equal(staleLoaderQueryProof.status, 'failed');
assert.equal(staleLoaderQueryProof.reasonCodes.includes('css-module-source-map-proof-loader-query-hash-mismatch'), true);
assert.equal(staleLoaderQueryProof.record.semanticEquivalenceClaim, false);
assert.equal(staleLoaderQueryProof.record.runtimeEquivalenceClaim, false);

const staleSourceMapArtifactProof = cssModuleSourceMapIdentityProof({
  sourceMapIdentityProof: realBundlerSourceMapIdentityProof({
    sourceMapArtifactHash: 'source-map-artifact:stale'
  })
}, realBundlerProofContext());
assert.equal(staleSourceMapArtifactProof.status, 'failed');
assert.equal(staleSourceMapArtifactProof.reasonCodes.includes('css-module-source-map-proof-artifact-hash-mismatch'), true);

const staleSourcesContentProof = cssModuleSourceMapIdentityProof({
  sourceMapIdentityProof: realBundlerSourceMapIdentityProof({
    sourcesContentHash: 'source-map-sources-content:stale'
  })
}, realBundlerProofContext());
assert.equal(staleSourcesContentProof.status, 'failed');
assert.equal(staleSourcesContentProof.reasonCodes.includes('css-module-source-map-proof-sources-content-hash-mismatch'), true);

function realBundlerProofContext() {
  return {
    sourcePath,
    sourceHash: hashSemanticValue(outputSourceText),
    outputSourceHash: hashSemanticValue(outputSourceText),
    generatedClassNameMapHash,
    bundlerTransformHash: 'bundler-transform:css-loader-postcss-card-module',
    generatedSourceHash,
    loaderRequestHash,
    loaderQueryHash,
    sourceMapArtifactHash,
    sourcesContentHash
  };
}

function projectInputFiles() {
  const component = componentSourceText();
  return [
    { language: 'css', sourcePath, baseSourceText, workerSourceText, headSourceText },
    { language: 'tsx', sourcePath: 'src/Card.tsx', baseSourceText: component, workerSourceText: component, headSourceText: component }
  ];
}

function componentSourceText() {
  return [
    `import styles from '${cssModuleSpecifier}';`,
    'export function Card() {',
    '  return <article className={styles.root} />;',
    '}',
    ''
  ].join('\n');
}

function realBundlerMergeOptions(overrides = {}) {
  return {
    generatedClassNameMap,
    bundlerTransformHash: 'bundler-transform:css-loader-postcss-card-module',
    cssModuleGeneratedSourceHash: generatedSourceHash,
    cssModuleLoaderRequestHash: loaderRequestHash,
    cssModuleLoaderQueryHash: loaderQueryHash,
    cssModuleSourceMapArtifactHash: sourceMapArtifactHash,
    cssModuleSourceMapSourcesContentHash: sourcesContentHash,
    sourceMapIdentityProof: realBundlerSourceMapIdentityProof(),
    ...overrides
  };
}

function realBundlerSourceMapIdentityProof(overrides = {}) {
  return {
    schema: 'frontier.lang.cssModuleSourceMapIdentityProof.v1',
    kind: 'frontier.lang.cssModuleSourceMapIdentityProof',
    status: 'passed',
    sourcePath,
    originalSourceHash: hashSemanticValue(outputSourceText),
    generatedSourcePath: 'dist/assets/Card.module.css',
    generatedSourceHash,
    generatedClassNameMapHash,
    bundlerTransformHash: 'bundler-transform:css-loader-postcss-card-module',
    loaderRequest,
    loaderRequestHash,
    loaderQuery,
    loaderQueryHash,
    sourceMap: sourceMapArtifact,
    sourceMapArtifactHash,
    sourcesContentHash,
    mappings: [
      { originalSourcePath: sourcePath, generatedSourcePath: 'dist/assets/Card.module.css', originalStart: outputSourceText.indexOf('.root'), originalEnd: outputSourceText.indexOf('.root') + 5, generatedStart: generatedSourceText.indexOf('.Card_root'), generatedEnd: generatedSourceText.indexOf('.Card_root') + 17, originalName: 'root', generatedName: 'Card_root__k9a1f' },
      { originalSourcePath: sourcePath, generatedSourcePath: 'dist/assets/Card.module.css', originalStart: outputSourceText.indexOf('.title'), originalEnd: outputSourceText.indexOf('.title') + 6, generatedStart: generatedSourceText.indexOf('.Card_title'), generatedEnd: generatedSourceText.indexOf('.Card_title') + 18, originalName: 'title', generatedName: 'Card_title__0b2cd' },
      { originalSourcePath: sourcePath, generatedSourcePath: 'dist/assets/Card.module.css', originalStart: outputSourceText.indexOf('.toneAccent'), originalEnd: outputSourceText.indexOf('.toneAccent') + 11, generatedStart: generatedSourceText.indexOf('.Card_toneAccent'), generatedEnd: generatedSourceText.indexOf('.Card_toneAccent') + 25, originalName: 'toneAccent', generatedName: 'Card_toneAccent__xx44a' }
    ],
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    sourceMapIdentityClaim: true,
    claimScope: 'css-module-source-map-generated-class-identity-only',
    ...overrides
  };
}
