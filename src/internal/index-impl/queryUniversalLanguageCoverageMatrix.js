import {
  queryUniversalLanguageCoverageMatrix as queryUniversalLanguageCoverageMatrixImpl
} from '../../universal-language-coverage-matrix.js';

export function queryUniversalLanguageCoverageMatrix(matrixOrInput = {}, query = {}) {
  return queryUniversalLanguageCoverageMatrixImpl(matrixOrInput, query);
}
