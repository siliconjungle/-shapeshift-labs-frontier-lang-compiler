import{idFragment}from'../../native-import-utils.js';
import{kotlinEvidenceSummary}from'./kotlinEvidenceSummary.js';
export function kotlinUnsupportedSemanticLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_${idFragment(metadata.feature ?? 'semantic')}`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'unsupportedSemantic',
    message: metadata.message ?? 'Kotlin semantic feature requires host compiler evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      unsupportedSemanticKind: metadata.unsupportedSemanticKind ?? `kotlin.${idFragment(metadata.feature ?? 'semantic')}`,
      analysisApiEvidence: kotlinEvidenceSummary(options.analysisApiEvidence),
      firEvidence: kotlinEvidenceSummary(options.firEvidence),
      multiplatformEvidence: kotlinEvidenceSummary(options.multiplatformEvidence),
      ...metadata
    }
  };
}
