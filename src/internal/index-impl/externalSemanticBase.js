import{externalSemanticCoverageLoss}from'./externalSemanticCoverageLoss.js';import{externalSemanticEvidence}from'./externalSemanticEvidence.js';
export function externalSemanticBase(context, metadata = {}) {
  return {
    repository: context.projectRoot ? { root: context.projectRoot } : undefined,
    documents: [],
    symbols: [],
    occurrences: [],
    relations: [],
    facts: [],
    ownershipRegions: [],
    evidence: [externalSemanticEvidence(context, 'passed', `Imported ${context.format} semantic index payload.`)],
    losses: [externalSemanticCoverageLoss(context)],
    semanticStatus: 'external-semantic-index',
    metadata
  };
}
