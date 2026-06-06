import{idFragment}from'../../native-import-utils.js';
import{swiftEvidenceSummary}from'./swiftEvidenceSummary.js';
export function swiftGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'swift')}_swift_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Swift generated-source marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      macroExpansionEvidence: swiftEvidenceSummary(options.macroExpansionEvidence),
      ...metadata
    }
  };
}
