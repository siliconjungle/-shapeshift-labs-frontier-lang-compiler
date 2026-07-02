import{createUniversalConversionPlan as createUniversalConversionPlanImpl}from'../../universal-conversion-plan.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
import{mergeDocumentConversionPlanInput}from'./documentConversionPlanInput.js';
export function createUniversalConversionPlan(input = {}) {
  return createUniversalConversionPlanImpl(mergeDocumentConversionPlanInput(input), coverageMatrixContext());
}
