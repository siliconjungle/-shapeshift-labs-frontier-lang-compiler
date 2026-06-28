import { assert } from './helpers.mjs';
import './semantic-merge-production-matrix-denominator.mjs';
import {
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createNativeParserFeatureMatrix,
  createProjectionTargetLossMatrix,
  getNativeParserAstFormatProfile,
  NativeImportLanguageProfiles,
  NativeParserAstFormats,
  queryNativeParserFeatureMatrix
} from './compiler-api.mjs';

const htmlProfile = NativeImportLanguageProfiles.find((profile) => profile.language === 'html');
assert.ok(htmlProfile);
assert.equal(htmlProfile.aliases.includes('htm'), true);
assert.equal(htmlProfile.extensions.includes('.html'), true);
assert.equal(htmlProfile.supportsLightweightScan, false);
assert.equal(htmlProfile.defaultReadiness, 'blocked');
assert.equal(htmlProfile.parserAdapters.includes('parse5'), true);
assert.equal(htmlProfile.parserAdapters.includes('tree-sitter-html'), true);
assert.equal(htmlProfile.projectionTargets.includes('html'), true);
assert.equal(htmlProfile.knownLossKinds.includes('browserRuntime'), true);

const cssProfile = NativeImportLanguageProfiles.find((profile) => profile.language === 'css');
assert.ok(cssProfile);
assert.equal(cssProfile.extensions.includes('.css'), true);
assert.equal(cssProfile.supportsLightweightScan, false);
assert.equal(cssProfile.defaultReadiness, 'blocked');
assert.equal(cssProfile.parserAdapters.includes('postcss'), true);
assert.equal(cssProfile.parserAdapters.includes('lightningcss'), true);
assert.equal(cssProfile.parserAdapters.includes('tree-sitter-css'), true);
assert.equal(cssProfile.projectionTargets.includes('css'), true);
assert.equal(cssProfile.knownLossKinds.includes('cascadeRuntime'), true);
assert.equal(cssProfile.knownLossKinds.includes('cssModuleTransform'), true);
assert.equal(cssProfile.knownLossKinds.includes('cssModuleUseSiteGraph'), true);

const coverageMatrix = createNativeImportCoverageMatrix({ generatedAt: 123, imports: [], adapters: [] });
const htmlCoverage = coverageMatrix.languages.find((entry) => entry.language === 'html');
assert.equal(htmlCoverage.imports.total, 0);
assert.equal(htmlCoverage.imports.readiness, 'blocked');
assert.equal(htmlCoverage.imports.readinessReasons.some((reason) => reason.includes('No built-in scanner coverage profile')), true);
const cssCoverage = coverageMatrix.languages.find((entry) => entry.language === 'css');
assert.equal(cssCoverage.imports.total, 0);
assert.equal(cssCoverage.imports.readiness, 'blocked');
assert.equal(cssCoverage.imports.readinessReasons.some((reason) => reason.includes('No built-in scanner coverage profile')), true);

const parserFormatMatrix = createNativeParserAstFormatMatrix({ generatedAt: 234, imports: [], adapters: [] });
for (const format of ['parse5', 'htmlparser2', 'rehype', 'postcss', 'csstree', 'lightningcss', 'tree-sitter-html', 'tree-sitter-css']) {
  assert.equal(NativeParserAstFormats.includes(format), true);
  assert.equal(parserFormatMatrix.formats.some((entry) => entry.id === format), true);
}
assert.equal(getNativeParserAstFormatProfile('parse5-html').id, 'parse5');
assert.equal(getNativeParserAstFormatProfile('htmlparser2').id, 'htmlparser2');
assert.equal(getNativeParserAstFormatProfile('hast').id, 'rehype');
assert.equal(getNativeParserAstFormatProfile('postcss').id, 'postcss');
assert.equal(getNativeParserAstFormatProfile('css-tree').id, 'csstree');
assert.equal(getNativeParserAstFormatProfile('lightning-css').id, 'lightningcss');
assert.equal(getNativeParserAstFormatProfile('tree-sitter-html').id, 'tree-sitter-html');
assert.equal(getNativeParserAstFormatProfile('tree-sitter-css').id, 'tree-sitter-css');

const parserFeatureMatrix = createNativeParserFeatureMatrix({
  generatedAt: 345,
  imports: [],
  adapters: [],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
const htmlParse5FeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'html',
  parser: 'parse5',
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
  minimumReadiness: 'ready'
});
assert.equal(htmlParse5FeatureQuery.found, true);
assert.equal(htmlParse5FeatureQuery.row.parserFormat, 'parse5');
assert.equal(htmlParse5FeatureQuery.row.features.syntax.status, 'evidence-required');
assert.equal(htmlParse5FeatureQuery.row.imports.readiness, 'blocked');
assert.equal(htmlParse5FeatureQuery.merge.mergeReady, false);
assert.equal(htmlParse5FeatureQuery.merge.blockingFeatures.includes('syntax'), true);

const cssPostcssFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'css',
  parser: 'postcss',
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
  minimumReadiness: 'ready'
});
assert.equal(cssPostcssFeatureQuery.found, true);
assert.equal(cssPostcssFeatureQuery.row.parserFormat, 'postcss');
assert.equal(cssPostcssFeatureQuery.row.features.syntax.status, 'evidence-required');
assert.equal(cssPostcssFeatureQuery.row.imports.readiness, 'blocked');
assert.equal(cssPostcssFeatureQuery.merge.mergeReady, false);
assert.equal(cssPostcssFeatureQuery.merge.blockingFeatures.includes('syntax'), true);

const projectionLossMatrix = createProjectionTargetLossMatrix({ generatedAt: 321, imports: [], adapters: [], targets: ['html', 'css'] });
const htmlProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'html');
assert.equal(htmlProjectionCoverage.knownLossKinds.includes('browserRuntime'), true);
assert.equal(htmlProjectionCoverage.targets.find((entry) => entry.target === 'html').lossClass, 'exactSourceProjection');
assert.equal(htmlProjectionCoverage.targets.find((entry) => entry.target === 'css').lossClass, 'missingAdapter');
const cssProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'css');
assert.equal(cssProjectionCoverage.knownLossKinds.includes('cascadeRuntime'), true);
assert.equal(cssProjectionCoverage.knownLossKinds.includes('cssModuleTransform'), true);
assert.equal(cssProjectionCoverage.targets.find((entry) => entry.target === 'css').lossClass, 'exactSourceProjection');
assert.equal(cssProjectionCoverage.targets.find((entry) => entry.target === 'html').lossClass, 'missingAdapter');
