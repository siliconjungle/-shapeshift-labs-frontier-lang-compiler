import { createUniversalConversionRouteEvidenceReceipt as createUniversalConversionRouteEvidenceReceiptImpl } from '../../universal-conversion-route-evidence-receipt.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';

export function createUniversalConversionRouteEvidenceReceipt(routeOrInput = {}, options = {}) {
  return createUniversalConversionRouteEvidenceReceiptImpl(routeOrInput, options, coverageMatrixContext());
}
