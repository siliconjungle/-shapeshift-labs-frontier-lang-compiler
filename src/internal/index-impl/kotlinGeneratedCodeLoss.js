import{idFragment}from'../../native-import-utils.js';
import{kotlinEvidenceSummary}from'./kotlinEvidenceSummary.js';
export function kotlinGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Kotlin generated-source marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      kspEvidence: kotlinEvidenceSummary(options.kspEvidence),
      kaptEvidence: kotlinEvidenceSummary(options.kaptEvidence),
      compilerPluginEvidence: kotlinEvidenceSummary(options.compilerPluginEvidence),
      ...metadata
    }
  };
}
