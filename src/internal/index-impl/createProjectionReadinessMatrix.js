import{createProjectionReadinessMatrix as createProjectionReadinessMatrixImpl}from'../../projection-readiness-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createProjectionReadinessMatrix(input = {}) {
  return createProjectionReadinessMatrixImpl(input, coverageMatrixContext());
}
