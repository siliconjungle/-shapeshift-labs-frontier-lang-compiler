import { JsTsSafeMergeConflictCodes, JsTsSafeMergeGateIds } from './js-ts-safe-merge-constants.js';
import { addConflict } from './js-ts-safe-merge-context.js';

export function validateCrossSideExportStarAdditions(workerPlan, headPlan, context) {
  if (context.deferReExportIdentityConflictsToProjectGraph === true) return;
  for (const workerEntry of workerPlan.addedEntries) {
    for (const headEntry of headPlan.addedEntries) {
      if (!isSourceOnlyExportStarRisk(workerEntry, headEntry)) continue;
      addConflict(context, {
        code: JsTsSafeMergeConflictCodes.duplicateName,
        gateId: JsTsSafeMergeGateIds.uniqueNames,
        side: 'worker',
        message: 'Source-only merge cannot prove export-star additions have disjoint public names.',
        details: {
          reasonCode: 'source-only-export-star-requires-project-graph',
          workerKey: workerEntry.key,
          headKey: headEntry.key,
          workerStatement: workerEntry.text.trim(),
          headStatement: headEntry.text.trim()
        }
      });
      return;
    }
  }
}

function isSourceOnlyExportStarRisk(left, right) {
  const leftStar = isExportStarReExportEntry(left);
  const rightStar = isExportStarReExportEntry(right);
  if (!leftStar && !rightStar) return false;
  if (leftStar && rightStar && sameExportStarIdentity(left, right)) return false;
  return isPublicSurfaceAddition(left) && isPublicSurfaceAddition(right);
}

function isExportStarReExportEntry(entry) {
  return entry?.kind === 'export' && entry.declarationInfo?.reExport === true && entry.declarationInfo?.exportStar === true;
}

function sameExportStarIdentity(left, right) {
  return left?.declarationInfo?.moduleSpecifier === right?.declarationInfo?.moduleSpecifier
    && Boolean(left?.declarationInfo?.typeOnly) === Boolean(right?.declarationInfo?.typeOnly);
}

function isPublicSurfaceAddition(entry) {
  return entry?.kind === 'export' || entry?.declarationInfo?.exported === true;
}
