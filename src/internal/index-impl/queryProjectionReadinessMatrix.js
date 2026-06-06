import{queryProjectionReadinessMatrix as queryProjectionReadinessMatrixImpl}from'../../projection-readiness-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function queryProjectionReadinessMatrix(matrixOrInput = {}, query = {}) {
  return queryProjectionReadinessMatrixImpl(matrixOrInput, query, coverageMatrixContext());
}
