import{idFragment}from'../../native-import-utils.js';
import{javaAnnotationProcessingSummary}from'./javaAnnotationProcessingSummary.js';
export function javaGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'java')}_java_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Java generated-source, annotation-generated, or Lombok-derived code marker was imported; regenerated members and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      annotationProcessing: javaAnnotationProcessingSummary(options.annotationProcessing),
      ...metadata
    }
  };
}
