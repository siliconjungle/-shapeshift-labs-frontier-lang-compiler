import{createNativeImportCoverageMatrix as createNativeImportCoverageMatrixImpl}from'../../native-import-coverage-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createNativeImportCoverageMatrix(input = {}) {
  return createNativeImportCoverageMatrixImpl(input, coverageMatrixContext());
}
