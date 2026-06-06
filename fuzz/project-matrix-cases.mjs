import assert from 'node:assert/strict';
import {
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createNativeParserFeatureMatrix,
  createProjectionTargetLossMatrix,
  createSemanticImportSidecar,
  createUniversalConversionPlan,
  createUniversalCapabilityMatrix,
  importNativeProject,
  queryNativeParserFeatureMatrix
} from '../dist/index.js';
import { allFuzzNativeAdapters } from './native-adapters.mjs';

export async function runProjectMatrixCases(adapters) {
  const project = await importNativeProject({
    sources: [{
      language: 'javascript',
      sourcePath: 'src/project-fuzz.js',
      sourceText: 'export function projectFuzz() {}\n'
    }, {
      language: 'python',
      sourcePath: 'project_fuzz.py',
      sourceText: 'def project_fuzz():\n    return True\n'
    }]
  });
  assert.equal(project.kind, 'frontier.lang.projectImportResult');
  assert.equal(project.imports.length, 2);
  assert.ok(project.semanticIndex.symbols.length >= 2);

  const matrix = createNativeImportCoverageMatrix({ imports: project.imports });
  assert.equal(matrix.summary.imports, 2);
  assert.ok(matrix.languages.find((entry) => entry.language === 'javascript').imports.symbols >= 1);
  assert.ok(matrix.languages.find((entry) => entry.language === 'python').imports.symbols >= 1);

  const adapterList = allFuzzNativeAdapters(adapters);
  const parserFormatMatrix = createNativeParserAstFormatMatrix({
    imports: project.imports,
    adapters: adapterList
  });
  assert.ok(parserFormatMatrix.summary.formats >= 2);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'python-ast').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'rust-syn').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'clang-ast-json').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'go-ast').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'java-ast').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'kotlin-psi').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'roslyn-csharp').adapters.total >= 1);
  assert.ok(parserFormatMatrix.formats.find((entry) => entry.id === 'swift-syntax').adapters.total >= 1);

  const parserFeatureMatrix = createNativeParserFeatureMatrix({
    imports: project.imports,
    adapters: adapterList,
    requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
  });
  assert.ok(parserFeatureMatrix.summary.parsers >= 2);
  assert.ok(parserFeatureMatrix.summary.byFeatureStatus.syntax.partial >= 1);

  const projectFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
    language: 'javascript',
    parser: 'javascript.lightweight-declaration-scan',
    requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
  });
  assert.equal(projectFeatureQuery.found, true);
  assert.equal(projectFeatureQuery.merge.mergeReady, false);

  const projectionMatrix = createProjectionTargetLossMatrix({ imports: project.imports });
  assert.equal(projectionMatrix.summary.languages, matrix.summary.languages);
  assert.ok(projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 2);
  assert.ok(projectionMatrix.summary.byLossClass.missingAdapter > 0);

  const universalMatrix = createUniversalCapabilityMatrix({
    imports: project.imports,
    adapters: adapterList,
    requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
  });
  assert.equal(universalMatrix.summary.imports, project.imports.length);
  assert.equal(universalMatrix.matrices.importCoverage.summary.imports, matrix.summary.imports);
  assert.equal(universalMatrix.matrices.projectionTargets.summary.languages, projectionMatrix.summary.languages);
  assert.ok(universalMatrix.summary.parserRows >= universalMatrix.summary.languages);
  assert.ok(universalMatrix.summary.blockers > 0);

  const conversionPlan = createUniversalConversionPlan({
    imports: project.imports,
    adapters: adapterList,
    targets: ['javascript', 'rust']
  });
  assert.equal(conversionPlan.summary.routes >= project.imports.length, true);
  assert.equal(conversionPlan.summary.autoMergeClaims, 0);
  assert.ok(conversionPlan.routes.some((route) => route.missingEvidence.includes('proof-or-replay-evidence')));

  const projectSidecar = createSemanticImportSidecar(project);
  assert.equal(projectSidecar.summary.imports, 2);
  assert.equal(projectSidecar.summary.emptySemanticIndex, false);
}
