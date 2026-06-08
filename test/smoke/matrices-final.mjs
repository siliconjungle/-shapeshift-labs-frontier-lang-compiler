import { assert } from './helpers.mjs';
import { nativeImport, result, source } from './compile-core.mjs';
import { babelAdapterImport, estreeAdapterImport, scannedEstreeFixtureImport, tsAdapterImport, tsMock } from './js-ts-adapters.mjs';
import { pythonAstImport } from './python-adapter.mjs';
import { rustSynImport, rustSynMacroImport } from './rust-adapter.mjs';
import { clangImport, goAstImport } from './clang-go-adapters.mjs';
import { javaAstImport } from './java-adapter.mjs';
import { csharpRoslynImport } from './csharp-adapter.mjs';
import { kotlinPsiImport, projectImport, swiftSyntaxImport, treeImport } from './swift-kotlin-project.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import { scannedCImport, scannedPythonImport, scannedRImport, scannedRustImport } from './scanned-languages.mjs';
import {
  compileFrontierSource,
  createBabelNativeImporterAdapter,
  createCSharpRoslynNativeImporterAdapter,
  createClangAstNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  createJavaAstNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createSemanticMergeCandidateAdmissionRecord,
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createNativeParserFeatureMatrix,
  createProjectionTargetLossMatrix,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSemanticImportSidecar,
  createSwiftSyntaxNativeImporterAdapter,
  createTreeSitterNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  createUniversalAstFromDocument,
  createUniversalCapabilityMatrix,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  getNativeParserAstFormatProfile,
  classifyNativeImportReadiness,
  diffNativeSources,
  NativeImportLanguageProfiles,
  NativeParserAstFormatProfiles,
  NativeParserAstFormats,
  NativeParserFeatureCategories,
  NativeParserFeatureCoverageStatuses,
  ProjectionTargetLossClasses,
  queryNativeParserFeatureMatrix,
  queryUniversalConversionPlan,
  readUniversalAstJson,
  sortSemanticMergeCandidateAdmissionRecords,
  summarizeNativeImportLosses,
  writeUniversalAstJson
} from './compiler-api.mjs';

const coverageMatrix = createNativeImportCoverageMatrix({
  generatedAt: 123,
  imports: [
    nativeImport,
    scannedJsImport,
    scannedPythonImport,
    scannedRustImport,
    scannedCImport,
    scannedRImport
  ],
  adapters: [createEstreeNativeImporterAdapter()]
});
assert.equal(coverageMatrix.kind, 'frontier.lang.nativeImportCoverageMatrix');
assert.equal(coverageMatrix.generatedAt, 123);
assert.ok(coverageMatrix.summary.languages >= 20);
assert.equal(coverageMatrix.summary.imports, 6);
assert.ok(coverageMatrix.summary.sourceMapMappings >= 6);
assert.ok(coverageMatrix.summary.lossKinds.opaqueNative >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.total >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.gaps.tokens >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.effective.exactAst >= 1);
assert.equal(NativeImportLanguageProfiles.some((profile) => profile.language === 'python'), true);
const jsCoverage = coverageMatrix.languages.find((entry) => entry.language === 'javascript');
assert.ok(jsCoverage);
assert.equal(jsCoverage.imports.total, 2);
assert.equal(jsCoverage.supportsLightweightScan, true);
assert.equal(jsCoverage.parserAdapters.includes('estree'), true);
assert.ok(jsCoverage.imports.symbols >= 2);
assert.ok(jsCoverage.adapterCoverage.total >= 1);
const pythonCoverage = coverageMatrix.languages.find((entry) => entry.language === 'python');
assert.equal(pythonCoverage.imports.readiness, 'needs-review');
assert.equal(pythonCoverage.parserAdapters.includes('libcst'), true);
const haskellCoverage = coverageMatrix.languages.find((entry) => entry.language === 'haskell');
assert.equal(haskellCoverage.imports.total, 0);
assert.equal(haskellCoverage.imports.readiness, 'needs-review');
assert.deepEqual(coverageMatrix.metadata.projectionTargetLossClasses, [...ProjectionTargetLossClasses]);
const parserFormatMatrix = createNativeParserAstFormatMatrix({
  generatedAt: 234,
  imports: [estreeAdapterImport, babelAdapterImport, tsAdapterImport, pythonAstImport, rustSynImport, clangImport, goAstImport, javaAstImport, kotlinPsiImport, csharpRoslynImport, swiftSyntaxImport, treeImport],
  adapters: [
    createEstreeNativeImporterAdapter(),
    createBabelNativeImporterAdapter(),
    createTypeScriptCompilerNativeImporterAdapter({ typescript: tsMock }),
    createPythonAstNativeImporterAdapter(),
    createRustSynNativeImporterAdapter(),
    createClangAstNativeImporterAdapter(),
    createGoAstNativeImporterAdapter(),
    createJavaAstNativeImporterAdapter(),
    createKotlinPsiNativeImporterAdapter(),
    createCSharpRoslynNativeImporterAdapter(),
    createSwiftSyntaxNativeImporterAdapter(),
    createTreeSitterNativeImporterAdapter({ language: 'javascript' })
  ]
});
assert.equal(parserFormatMatrix.kind, 'frontier.lang.nativeParserAstFormatMatrix');
assert.equal(parserFormatMatrix.generatedAt, 234);
assert.equal(NativeParserAstFormats.includes('python-ast'), true);
assert.equal(NativeParserAstFormats.includes('rust-syn'), true);
assert.equal(NativeParserAstFormats.includes('clang-ast-json'), true);
assert.equal(NativeParserAstFormats.includes('go-ast'), true);
assert.equal(NativeParserAstFormats.includes('java-ast'), true);
assert.equal(NativeParserAstFormats.includes('kotlin-psi'), true);
assert.equal(NativeParserAstFormats.includes('roslyn-csharp'), true);
assert.equal(NativeParserAstFormats.includes('swift-syntax'), true);
assert.equal(NativeParserAstFormatProfiles.some((profile) => profile.id === 'tree-sitter'), true);
assert.equal(getNativeParserAstFormatProfile('python_ast').id, 'python-ast');
assert.equal(getNativeParserAstFormatProfile('syn').id, 'rust-syn');
assert.equal(getNativeParserAstFormatProfile('libclang').id, 'clang-ast-json');
assert.equal(getNativeParserAstFormatProfile('go/parser').id, 'go-ast');
assert.equal(getNativeParserAstFormatProfile('javac').id, 'java-ast');
assert.equal(getNativeParserAstFormatProfile('kotlin-compiler').id, 'kotlin-psi');
assert.equal(getNativeParserAstFormatProfile('roslyn').id, 'roslyn-csharp');
assert.equal(getNativeParserAstFormatProfile('SwiftSyntax').id, 'swift-syntax');
assert.ok(parserFormatMatrix.summary.formats >= 11);
assert.equal(parserFormatMatrix.summary.imports, 12);
assert.ok(parserFormatMatrix.summary.nativeAstNodes >= 5);
assert.ok(parserFormatMatrix.summary.effectiveCapabilities.exactAst >= 9);
const pythonAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'python-ast');
assert.equal(pythonAstFormatCoverage.imports.total, 1);
assert.equal(pythonAstFormatCoverage.imports.readiness, 'ready');
assert.equal(pythonAstFormatCoverage.imports.symbols >= 2, true);
assert.equal(pythonAstFormatCoverage.adapters.total, 1);
const rustSynFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'rust-syn');
assert.equal(rustSynFormatCoverage.imports.total, 1);
assert.equal(rustSynFormatCoverage.imports.readiness, 'ready');
assert.equal(rustSynFormatCoverage.imports.symbols >= 3, true);
assert.equal(rustSynFormatCoverage.adapters.total, 1);
const clangAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'clang-ast-json');
assert.equal(clangAstFormatCoverage.imports.total, 1);
assert.equal(clangAstFormatCoverage.imports.readiness, 'ready');
assert.equal(clangAstFormatCoverage.imports.symbols >= 3, true);
assert.equal(clangAstFormatCoverage.adapters.total, 1);
const goAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'go-ast');
assert.equal(goAstFormatCoverage.imports.total, 1);
assert.equal(goAstFormatCoverage.imports.readiness, 'ready');
assert.equal(goAstFormatCoverage.imports.symbols >= 6, true);
assert.equal(goAstFormatCoverage.adapters.total, 1);
const javaAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'java-ast');
assert.equal(javaAstFormatCoverage.imports.total, 1);
assert.equal(javaAstFormatCoverage.imports.readiness, 'ready');
assert.equal(javaAstFormatCoverage.imports.symbols >= 8, true);
assert.equal(javaAstFormatCoverage.adapters.total, 1);
const kotlinPsiFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'kotlin-psi');
assert.equal(kotlinPsiFormatCoverage.imports.total, 1);
assert.equal(kotlinPsiFormatCoverage.imports.readiness, 'needs-review');
assert.equal(kotlinPsiFormatCoverage.imports.symbols >= 5, true);
assert.equal(kotlinPsiFormatCoverage.adapters.total, 1);
const csharpRoslynFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'roslyn-csharp');
assert.equal(csharpRoslynFormatCoverage.imports.total, 1);
assert.equal(csharpRoslynFormatCoverage.imports.readiness, 'ready');
assert.equal(csharpRoslynFormatCoverage.imports.symbols >= 10, true);
assert.equal(csharpRoslynFormatCoverage.adapters.total, 1);
const swiftSyntaxFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'swift-syntax');
assert.equal(swiftSyntaxFormatCoverage.imports.total, 1);
assert.equal(swiftSyntaxFormatCoverage.imports.readiness, 'needs-review');
assert.equal(swiftSyntaxFormatCoverage.imports.symbols >= 5, true);
assert.equal(swiftSyntaxFormatCoverage.adapters.total, 1);
const treeSitterFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'tree-sitter');
assert.equal(treeSitterFormatCoverage.imports.total, 1);
assert.equal(treeSitterFormatCoverage.supportsIncremental, true);
const parserFeatureMatrix = createNativeParserFeatureMatrix({
  generatedAt: 345,
  imports: [estreeAdapterImport, scannedEstreeFixtureImport, rustSynMacroImport],
  adapters: [
    createEstreeNativeImporterAdapter(),
    createRustSynNativeImporterAdapter()
  ],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
assert.equal(parserFeatureMatrix.kind, 'frontier.lang.nativeParserFeatureMatrix');
assert.equal(parserFeatureMatrix.generatedAt, 345);
assert.deepEqual(parserFeatureMatrix.metadata.categories, [...NativeParserFeatureCategories]);
assert.deepEqual(parserFeatureMatrix.metadata.statuses, [...NativeParserFeatureCoverageStatuses]);
assert.equal(parserFeatureMatrix.metadata.requiredFeatures.includes('syntax'), true);
assert.equal(parserFeatureMatrix.summary.parsers >= 2, true);
assert.equal(parserFeatureMatrix.summary.byFeatureStatus.syntax.full >= 1, true);
assert.equal(parserFeatureMatrix.summary.byFeatureStatus.macroMetaprogramming['evidence-required'] >= 1, true);
const estreeFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'javascript',
  parser: 'estree',
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
  minimumReadiness: 'ready'
});
assert.equal(estreeFeatureQuery.kind, 'frontier.lang.nativeParserFeatureQuery');
assert.equal(estreeFeatureQuery.found, true);
assert.equal(estreeFeatureQuery.row.features.syntax.status, 'full');
assert.equal(estreeFeatureQuery.row.features.semantic.status, 'full');
assert.equal(estreeFeatureQuery.row.features.sourcePreservation.status, 'full');
assert.equal(estreeFeatureQuery.row.imports.readiness, 'ready');
assert.equal(estreeFeatureQuery.merge.mergeReady, true);
assert.deepEqual(estreeFeatureQuery.merge.blockingFeatures, []);
const lightweightFeatureQuery = queryNativeParserFeatureMatrix(
  createNativeParserFeatureMatrix({
    imports: [scannedEstreeFixtureImport],
    includeEmptyParsers: false
  }),
  {
    language: 'javascript',
    parser: 'javascript.lightweight-declaration-scan',
    requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
    minimumReadiness: 'ready'
  }
);
assert.equal(lightweightFeatureQuery.found, true);
assert.equal(lightweightFeatureQuery.row.features.syntax.status, 'partial');
assert.equal(lightweightFeatureQuery.row.imports.readiness, 'needs-review');
assert.equal(lightweightFeatureQuery.merge.mergeReady, false);
assert.equal(lightweightFeatureQuery.merge.blockingFeatures.includes('syntax'), true);
const rustMacroFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'rust',
  parser: 'syn',
  requiredFeatures: ['syntax', 'semantic', 'macroMetaprogramming'],
  minimumReadiness: 'ready'
});
assert.equal(rustMacroFeatureQuery.found, true);
assert.equal(rustMacroFeatureQuery.row.features.macroMetaprogramming.status, 'evidence-required');
assert.equal(rustMacroFeatureQuery.merge.mergeReady, false);
assert.equal(rustMacroFeatureQuery.merge.blockingFeatures.includes('macroMetaprogramming'), true);
const projectionLossMatrix = createProjectionTargetLossMatrix({
  generatedAt: 321,
  imports: [
    scannedJsImport,
    scannedPythonImport,
    scannedRustImport,
    scannedCImport,
    scannedRImport
  ],
  adapters: [createEstreeNativeImporterAdapter()]
});
assert.equal(projectionLossMatrix.kind, 'frontier.lang.projectionTargetLossMatrix');
assert.equal(projectionLossMatrix.generatedAt, 321);
assert.deepEqual(projectionLossMatrix.metadata.lossClasses, [...ProjectionTargetLossClasses]);
assert.ok(projectionLossMatrix.summary.missingAdapters > 0);
assert.ok(projectionLossMatrix.summary.unsupportedTargetFeatures > 0);
assert.ok(projectionLossMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= projectionLossMatrix.summary.languages);
assert.ok(projectionLossMatrix.summary.sourceProjectionByLossClass.nativeSourceStubs >= projectionLossMatrix.summary.languages);
const jsProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'javascript');
assert.ok(jsProjectionCoverage);
assert.equal(jsProjectionCoverage.sourceProjection.exactSource.lossClass, 'exactSourceProjection');
assert.equal(jsProjectionCoverage.sourceProjection.exactSource.evidence.importsWithExactSource, 1);
assert.equal(jsProjectionCoverage.sourceProjection.stubs.lossClass, 'nativeSourceStubs');
assert.equal(jsProjectionCoverage.targets.find((entry) => entry.target === 'typescript').lossClass, 'missingAdapter');
const cProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'c');
assert.equal(cProjectionCoverage.targets.find((entry) => entry.target === 'c').lossClass, 'unsupportedTargetFeatures');
assert.equal(cProjectionCoverage.targets.find((entry) => entry.target === 'c').lossKinds.includes('preprocessor'), true);
const rProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'r');
assert.equal(rProjectionCoverage.targets.every((entry) => entry.lossClass === 'missingAdapter'), true);
const universalCapabilityMatrix = createUniversalCapabilityMatrix({
  generatedAt: 432,
  imports: [
    scannedJsImport,
    scannedPythonImport,
    scannedRustImport,
    scannedCImport,
    scannedRImport
  ],
  adapters: [
    createEstreeNativeImporterAdapter(),
    createPythonAstNativeImporterAdapter(),
    createRustSynNativeImporterAdapter(),
    createClangAstNativeImporterAdapter()
  ],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
assert.equal(universalCapabilityMatrix.kind, 'frontier.lang.universalCapabilityMatrix');
assert.equal(universalCapabilityMatrix.generatedAt, 432);
assert.equal(universalCapabilityMatrix.summary.imports, 5);
assert.equal(universalCapabilityMatrix.matrices.importCoverage.summary.imports, 5);
assert.equal(universalCapabilityMatrix.matrices.projectionTargets.summary.languages, universalCapabilityMatrix.summary.languages);
assert.equal(universalCapabilityMatrix.matrices.projectionReadiness.summary.languages, universalCapabilityMatrix.summary.languages);
assert.ok(universalCapabilityMatrix.matrices.projectionReadiness.summary.featureCells >= universalCapabilityMatrix.summary.targetEntries);
assert.ok(universalCapabilityMatrix.summary.parserRows >= universalCapabilityMatrix.summary.languages);
assert.ok(universalCapabilityMatrix.summary.missingAdapters > 0);
assert.ok(universalCapabilityMatrix.summary.blockedLanguages > 0);
assert.deepEqual(universalCapabilityMatrix.metadata.requiredFeatures, ['syntax', 'semantic', 'sourcePreservation']);
const jsUniversalCoverage = universalCapabilityMatrix.languages.find((entry) => entry.language === 'javascript');
assert.equal(jsUniversalCoverage.imports.total, 1);
assert.ok(jsUniversalCoverage.parser.parsers.includes('estree') || jsUniversalCoverage.parser.parsers.includes('babel'));
assert.ok(jsUniversalCoverage.projection.targets.some((entry) => entry.target === 'rust' && entry.lossClass === 'missingAdapter'));
assert.ok(jsUniversalCoverage.blockers.some((reason) => reason.includes('Missing native-to-target projection adapter')));
const projectSidecar = createSemanticImportSidecar(projectImport, { generatedAt: 456 });
assert.equal(projectSidecar.summary.imports, 2);
assert.equal(projectSidecar.summary.emptySemanticIndex, false);
assert.equal(projectSidecar.imports.some((entry) => entry.emptySemanticIndex === false), true);
const universalAst = createUniversalAstFromDocument(result.document, { id: 'uast_todo', evidence: nativeImport.evidence });
assert.equal(universalAst.layers.mergeEvidence.evidenceIds.length > 0, true);
const universalJson = writeUniversalAstJson(universalAst);
assert.equal(readUniversalAstJson(universalJson).document.id, 'mod_todo');
assert.match(compileFrontierSource(source, { target: 'rust' }).output, /pub struct Todo/);
assert.match(compileFrontierSource(source, { target: 'python' }).output, /class Todo/);
assert.match(compileFrontierSource(source, { target: 'c' }).output, /typedef struct Todo/);

const bad = compileFrontierSource('module Bad @id("mod_bad")\nentity Bad @id("ent_bad") { missing: UnknownType }', { target: 'typescript' });
assert.equal(bad.ok, false);
assert.equal(bad.ast, undefined);
assert.equal(bad.output, '');
