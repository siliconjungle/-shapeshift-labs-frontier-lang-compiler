import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict } from './js-ts-safe-merge-context.js';
import { mergedNewImportBindings } from './js-ts-safe-merge-import-entry-utils.js';

export function validateNewImportDeclarations(workerPlan, headPlan, context) {
  validateNoNewSideEffectImports(workerPlan, context);
  validateNoNewSideEffectImports(headPlan, context);
  validateCrossSideNewImportBindings(workerPlan, headPlan, context);
}

function validateNoNewSideEffectImports(plan, context) {
  for (const entry of plan.newImportEntries ?? []) {
    if (!entry.importInfo?.sideEffectOnly) continue;
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.sideEffectImportReorder,
      gateId: JsTsSafeMergeGateIds.preserveBaseOrder,
      side: plan.side,
      message: `${plan.side} source adds a side-effect import; new side-effect ordering requires human review.`,
      details: {
        reasonCode: 'new-side-effect-import',
        key: entry.key,
        statement: entry.text.trim()
      }
    });
  }
}

function validateCrossSideNewImportBindings(workerPlan, headPlan, context) {
  const ownersByLocalName = new Map();
  for (const binding of mergedNewImportBindings(workerPlan, headPlan)) {
    const owner = ownersByLocalName.get(binding.localName);
    if (!owner) {
      ownersByLocalName.set(binding.localName, binding);
      continue;
    }
    addConflict(context, {
      code: JsTsSafeMergeConflictCodes.duplicateName,
      gateId: JsTsSafeMergeGateIds.uniqueNames,
      side: 'worker',
      message: 'Worker and head add new imports with duplicate local binding names.',
      details: {
        localName: binding.localName,
        firstImportKey: owner.importKey,
        secondImportKey: binding.importKey,
        firstSpecifier: owner.canonical,
        secondSpecifier: binding.canonical
      }
    });
  }
}
