import { performance } from 'node:perf_hooks';
import {
  createNativeImportCoverageMatrix,
  createNativeParserAstFormatMatrix,
  createNativeParserFeatureMatrix,
  createProjectionTargetLossMatrix,
  createUniversalCapabilityMatrix,
  queryNativeParserFeatureMatrix
} from '../dist/index.js';
import { createBenchMatrixAdapters } from './native-adapters.mjs';

const requiredFeatures = ['syntax', 'semantic', 'sourcePreservation'];

export function measureNativeMatrices(nativeImportResults, adapters) {
  const matrixStart = performance.now();
  const coverageMatrix = createNativeImportCoverageMatrix({ imports: nativeImportResults });
  const coverageMatrixDurationMs = performance.now() - matrixStart;

  const parserFormatMatrixStart = performance.now();
  const parserFormatMatrix = createNativeParserAstFormatMatrix({
    imports: nativeImportResults,
    adapters: createBenchMatrixAdapters(adapters)
  });
  const parserFormatMatrixDurationMs = performance.now() - parserFormatMatrixStart;

  const parserFeatureMatrixStart = performance.now();
  const parserFeatureMatrix = createNativeParserFeatureMatrix({
    imports: nativeImportResults,
    adapters: createBenchMatrixAdapters(adapters),
    requiredFeatures
  });
  const parserFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
    language: 'javascript',
    parser: 'estree',
    requiredFeatures
  });
  const parserFeatureMatrixDurationMs = performance.now() - parserFeatureMatrixStart;

  const projectionMatrixStart = performance.now();
  const projectionLossMatrix = createProjectionTargetLossMatrix({ imports: nativeImportResults });
  const projectionMatrixDurationMs = performance.now() - projectionMatrixStart;

  const universalMatrixStart = performance.now();
  const universalCapabilityMatrix = createUniversalCapabilityMatrix({
    imports: nativeImportResults,
    adapters: createBenchMatrixAdapters(adapters),
    requiredFeatures
  });
  const universalMatrixDurationMs = performance.now() - universalMatrixStart;

  return {
    coverageMatrix,
    coverageMatrixDurationMs,
    parserFormatMatrix,
    parserFormatMatrixDurationMs,
    parserFeatureMatrix,
    parserFeatureQuery,
    parserFeatureMatrixDurationMs,
    projectionLossMatrix,
    projectionMatrixDurationMs,
    universalCapabilityMatrix,
    universalMatrixDurationMs
  };
}
