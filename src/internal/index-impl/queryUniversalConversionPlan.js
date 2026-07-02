import{queryUniversalConversionPlan as queryUniversalConversionPlanImpl}from'../../universal-conversion-plan.js';
import{coverageMatrixContext}from'./coverageMatrixContext.js';
import{mergeDocumentConversionPlanInput}from'./documentConversionPlanInput.js';
export function queryUniversalConversionPlan(planOrInput = {}, query = {}) {
  return queryUniversalConversionPlanImpl(mergeDocumentConversionPlanInput(planOrInput), query, coverageMatrixContext());
}
