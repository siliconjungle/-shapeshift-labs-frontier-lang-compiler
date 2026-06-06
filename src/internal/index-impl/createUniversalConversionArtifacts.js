import { createUniversalConversionArtifacts as createUniversalConversionArtifactsImpl } from '../../universal-conversion-artifacts.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';

export function createUniversalConversionArtifacts(input = {}, options = {}) {
  return createUniversalConversionArtifactsImpl(input, { ...options, context: coverageMatrixContext() });
}
