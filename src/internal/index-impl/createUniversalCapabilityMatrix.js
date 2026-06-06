import{createUniversalCapabilityMatrix as createUniversalCapabilityMatrixImpl}from'../../universal-capability-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createUniversalCapabilityMatrix(input = {}) {
  return createUniversalCapabilityMatrixImpl(input, coverageMatrixContext());
}
