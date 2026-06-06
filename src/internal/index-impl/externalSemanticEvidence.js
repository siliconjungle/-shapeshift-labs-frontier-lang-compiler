import{idFragment}from'../../native-import-utils.js';
export function externalSemanticEvidence(context, status, summary, metadata = {}) {
  return {
    id: `evidence_${context.idPart}_${idFragment(context.format)}_external_semantic_index`,
    kind: 'import',
    status,
    path: context.sourcePath,
    summary,
    metadata: {
      format: context.format,
      parser: context.parser,
      projectRoot: context.projectRoot,
      ...metadata
    }
  };
}
