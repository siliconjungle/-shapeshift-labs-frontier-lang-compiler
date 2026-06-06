import{idFragment}from'../../native-import-utils.js';
import{csharpEvidenceSummary}from'./csharpEvidenceSummary.js';
export function csharpGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'csharp')}_csharp_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'C# generated-source or source-generator marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      sourceGeneratorEvidence: csharpEvidenceSummary(options.sourceGeneratorEvidence),
      ...metadata
    }
  };
}
