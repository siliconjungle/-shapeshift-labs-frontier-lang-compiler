import {
  createUniversalLanguageCoverageMatrix as createUniversalLanguageCoverageMatrixImpl
} from '../../universal-language-coverage-matrix.js';

export function createUniversalLanguageCoverageMatrix(input = {}) {
  return createUniversalLanguageCoverageMatrixImpl(input);
}
