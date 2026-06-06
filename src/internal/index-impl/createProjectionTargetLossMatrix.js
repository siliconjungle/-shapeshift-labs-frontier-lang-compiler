import{createProjectionTargetLossMatrix as createProjectionTargetLossMatrixImpl}from'../../projection-target-loss-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createProjectionTargetLossMatrix(input = {}) {
  return createProjectionTargetLossMatrixImpl(input, coverageMatrixContext());
}
