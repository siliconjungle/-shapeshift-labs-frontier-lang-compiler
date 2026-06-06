import{createNativeParserFeatureMatrix as createNativeParserFeatureMatrixImpl}from'../../native-parser-feature-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createNativeParserFeatureMatrix(input = {}) {
  return createNativeParserFeatureMatrixImpl(input, coverageMatrixContext());
}
