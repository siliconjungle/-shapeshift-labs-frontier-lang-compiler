import { createUniversalConversionRouteEvidenceReceipt as createUniversalConversionRouteEvidenceReceiptImpl } from '../../universal-conversion-route-evidence-receipt.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';
import { mergeDocumentConversionPlanInput } from './documentConversionPlanInput.js';

export function createUniversalConversionRouteEvidenceReceipt(routeOrInput = {}, options = {}) {
  return createUniversalConversionRouteEvidenceReceiptImpl(mergeDocumentConversionPlanInput(routeOrInput), options, coverageMatrixContext());
}
