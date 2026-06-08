import{idFragment,uniqueByEvidenceId,uniqueByLossId,uniqueRecordsById}from'../../native-import-utils.js';
import{attachExternalOwnership}from'./attachExternalOwnership.js';
export function withExternalEmptyLoss(result, context) {
  if (!result.documents.length) {
    result.documents.push({
      id: `doc_${context.idPart}_${idFragment(context.format)}`,
      path: context.sourcePath ?? `${context.format}:memory`,
      language: context.language,
      sourceHash: context.sourceHash,
      metadata: { format: context.format, inferred: true }
    });
  }
  if (!result.symbols.length && !result.occurrences.length) {
    result.losses.push({
      id: `loss_${context.idPart}_${idFragment(context.format)}_empty_semantic_index`,
      severity: 'warning',
      phase: 'index',
      sourceFormat: context.format,
      kind: 'partialSemanticIndex',
      message: `${context.format} payload did not contain symbols or occurrences that Frontier can map.`,
      metadata: { format: context.format }
    });
  }
  attachExternalOwnership(result, context);
  result.symbols = uniqueRecordsById(result.symbols);
  result.occurrences = uniqueRecordsById(result.occurrences);
  result.relations = uniqueRecordsById(result.relations);
  result.facts = uniqueRecordsById(result.facts);
  result.ownershipRegions = uniqueRecordsById(result.ownershipRegions);
  result.losses = uniqueByLossId(result.losses);
  result.evidence = uniqueByEvidenceId(result.evidence);
  return result;
}
