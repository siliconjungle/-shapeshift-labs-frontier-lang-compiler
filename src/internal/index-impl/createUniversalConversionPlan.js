import{createUniversalConversionPlan as createUniversalConversionPlanImpl}from'../../universal-conversion-plan.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function createUniversalConversionPlan(input = {}) {
  return createUniversalConversionPlanImpl(input, coverageMatrixContext());
}
