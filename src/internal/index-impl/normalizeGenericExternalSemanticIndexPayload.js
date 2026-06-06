import{idFragment}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{externalSemanticBase}from'./externalSemanticBase.js';
export function normalizeGenericExternalSemanticIndexPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: context.format, genericPayload: true });
  result.losses.push({
    id: `loss_${context.idPart}_${idFragment(context.format)}_unsupported_payload`,
    severity: 'warning',
    phase: 'index',
    sourceFormat: context.format,
    kind: 'unsupportedSemantic',
    message: `External semantic index format ${context.format} is not recognized; payload hash is preserved as evidence only.`,
    metadata: { format: context.format, payloadHash: hashSemanticValue(payload) }
  });
  return result;
}
