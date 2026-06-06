import{idFragment}from'../../native-import-utils.js';
import{kotlinEvidenceSummary}from'./kotlinEvidenceSummary.js';
export function kotlinScriptLoss(input, nodeId, span, options = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_script_semantics`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'unsupportedSemantic',
    message: 'Kotlin script source was imported; script templates, implicit receivers, dependencies, and host execution environment require build/runtime evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      feature: 'script',
      unsupportedSemanticKind: 'kotlin.scriptContext',
      script: true,
      buildVariantEvidence: kotlinEvidenceSummary(options.buildVariantEvidence)
    }
  };
}
