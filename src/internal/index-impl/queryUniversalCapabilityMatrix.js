import { queryUniversalCapabilityMatrix as queryUniversalCapabilityMatrixImpl } from '../../universal-capability-query.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';

export function queryUniversalCapabilityMatrix(matrixOrInput = {}, query = {}) {
  return queryUniversalCapabilityMatrixImpl(matrixOrInput, query, coverageMatrixContext());
}
