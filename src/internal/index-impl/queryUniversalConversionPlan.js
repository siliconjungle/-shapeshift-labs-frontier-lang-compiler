import{queryUniversalConversionPlan as queryUniversalConversionPlanImpl}from'../../universal-conversion-plan.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
export function queryUniversalConversionPlan(planOrInput = {}, query = {}) {
  return queryUniversalConversionPlanImpl(planOrInput, query, coverageMatrixContext());
}
