import { createUniversalConversionArtifacts as createUniversalConversionArtifactsImpl } from '../../universal-conversion-artifacts.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';
import { mergeDocumentConversionPlanInput } from './documentConversionPlanInput.js';

export function createUniversalConversionArtifacts(input = {}, options = {}) {
  return createUniversalConversionArtifactsImpl(mergeDocumentConversionPlanInput(input), { ...options, context: coverageMatrixContext() });
}
