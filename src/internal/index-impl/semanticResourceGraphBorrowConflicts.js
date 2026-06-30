import { idFragment, uniqueStrings } from '../../native-import-utils.js';

export function exclusiveLoanConflicts(loans) {
  const byResource = loansByResource(loans);
  const conflicts = [];
  for (const [resourceId, resourceLoans] of byResource) {
    for (let leftIndex = 0; leftIndex < resourceLoans.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < resourceLoans.length; rightIndex += 1) {
        const left = resourceLoans[leftIndex];
        const right = resourceLoans[rightIndex];
        if (!exclusiveLoan(left) && !exclusiveLoan(right)) continue;
        conflicts.push(loanConflict(resourceId, left, right));
      }
    }
  }
  return conflicts;
}

export function proofObligationsForBorrowConflicts(conflicts) {
  return conflicts
    .filter((conflict) => /exclusive-resource-(?:alias|loan)-/.test(String(conflict.reasonCode ?? '')))
    .map((conflict) => ({
      id: `proof_${idFragment(conflict.id)}_borrow_alias`,
      kind: 'borrowAliasCompatibilityProof',
      status: 'open',
      resourceId: conflict.resourceId,
      conflictId: conflict.id,
      statement: 'Provide source-bound proof that overlapping borrows preserve aliasing and lifetime invariants.',
      sourcePath: conflict.sourcePath,
      sourceHash: conflict.sourceHash,
      evidenceIds: conflict.evidenceIds
    }));
}

function loansByResource(loans) {
  const byResource = new Map();
  for (const loan of loans) {
    if (!loan.resourceId) continue;
    const list = byResource.get(loan.resourceId) ?? [];
    list.push(loan);
    byResource.set(loan.resourceId, list);
  }
  return byResource;
}

function exclusiveLoan(loan = {}) {
  return ['mutable', 'exclusive', 'move'].includes(loan.mode);
}

function loanConflict(resourceId, left, right) {
  return {
    id: `conflict_${idFragment(left.id)}_${idFragment(right.id)}`,
    resourceId,
    ownerId: left.ownerId,
    loanId: left.id,
    reasonCode: 'exclusive-resource-loan-overlap-requires-proof',
    message: 'Mutable or exclusive resource loan overlaps another loan; admission needs borrow-scope/lifetime proof.',
    sourcePath: left.sourcePath ?? right.sourcePath,
    sourceHash: left.sourceHash ?? right.sourceHash,
    evidenceIds: uniqueStrings([...(left.evidenceIds ?? []), ...(right.evidenceIds ?? [])]),
    metadata: {
      conflictingLoanId: right.id,
      leftMode: left.mode,
      rightMode: right.mode,
      leftLifetimeRegionId: left.lifetimeRegionId,
      rightLifetimeRegionId: right.lifetimeRegionId
    }
  };
}
