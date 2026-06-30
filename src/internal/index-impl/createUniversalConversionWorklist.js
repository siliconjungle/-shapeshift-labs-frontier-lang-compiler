import { createUniversalConversionWorklist as createUniversalConversionWorklistImpl, queryUniversalConversionWorklist as queryUniversalConversionWorklistImpl } from '../../universal-conversion-worklist.js';
import { coverageMatrixContext } from './coverageMatrixContext.js';

export { UniversalConversionWorkItemKinds } from '../../universal-conversion-worklist.js';

export function createUniversalConversionWorklist(planOrInput = {}, options = {}) {
  return createUniversalConversionWorklistImpl(planOrInput, options, coverageMatrixContext());
}

export function queryUniversalConversionWorklist(worklistOrInput = {}, query = {}) {
  return queryUniversalConversionWorklistImpl(worklistOrInput, query, coverageMatrixContext());
}
