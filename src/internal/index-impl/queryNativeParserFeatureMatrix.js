import{queryNativeParserFeatureMatrix as queryNativeParserFeatureMatrixImpl}from'../../native-parser-feature-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function queryNativeParserFeatureMatrix(matrixOrInput = {}, query = {}) {
  return queryNativeParserFeatureMatrixImpl(matrixOrInput, query, coverageMatrixContext());
}
