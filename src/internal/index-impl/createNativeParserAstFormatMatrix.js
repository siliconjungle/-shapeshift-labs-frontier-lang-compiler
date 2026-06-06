import{createNativeParserAstFormatMatrix as createNativeParserAstFormatMatrixImpl}from'../../native-parser-ast-format-matrix.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createNativeParserAstFormatMatrix(input = {}) {
  return createNativeParserAstFormatMatrixImpl(input, coverageMatrixContext());
}
