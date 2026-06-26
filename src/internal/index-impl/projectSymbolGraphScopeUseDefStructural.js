import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { namespaceOverlap, rangeKey, uniqueStrings } from '../../js-ts-semantic-scope-use-def-utils.js';
import { bindingRecords, closureCaptureEvidence, compactRecord, semanticSpanForHash, sourceSpanForRange } from './projectSymbolGraphScopeUseDefRecordBuilders.js';
import { nearestPublicOwnerForOffset } from './projectSymbolGraphScopeUseDefOwners.js';
import { normalizeStructuralScopeEvidence, structuralScopeEvidenceForImport } from './projectSymbolGraphScopeUseDefStructuralNormalize.js';

function structuralScopeRecordsForImport(imported, context) {
  const evidence = structuralScopeEvidenceForImport(imported);
  if (!evidence) return undefined;
  const normalized = normalizeStructuralScopeEvidence(evidence);
  if (!normalized.bindingInputs.length && !normalized.referenceInputs.length) return undefined;
  const bindings = bindingRecords(normalized.bindingInputs, context);
  const bindingIndex = structuralBindingIndex(normalized.bindingInputs, bindings);
  const references = structuralReferenceRecords(normalized.referenceInputs, bindings, bindingIndex, context);
  return {
    scopeBindingRecords: bindings,
    scopeReferenceRecords: references
  };
}

function structuralReferenceRecords(references, bindings, bindingIndex, context) {
  const bindingKeys = new Set(bindings.map((binding) => `${binding.start}:${binding.end}`));
  return references.flatMap((reference, index) => {
    if (bindingKeys.has(rangeKey(reference)) && reference.includeDeclarationReference !== true) return [];
    const binding = structuralBindingForReference(reference, bindings, bindingIndex);
    const sourceSpan = sourceSpanForRange(context, reference.start, reference.end);
    const semanticSpan = semanticSpanForHash(sourceSpan);
    const publicOwner = nearestPublicOwnerForOffset(context.publicOwners, reference.start);
    const publicOwnerName = binding?.publicOwnerName ?? publicOwner?.name;
    const closureCapture = closureCaptureEvidence(reference.depth, binding, publicOwnerName);
    return [compactRecord({
      id: `scope_ref_${idFragment(context.sourcePath)}_external_${index + 1}`,
      name: reference.name,
      namespace: reference.namespace,
      namespaces: reference.namespaces,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      sourceSpan,
      start: reference.start,
      end: reference.end,
      depth: reference.depth,
      scopeEvidenceSource: reference.scopeEvidenceSource,
      scopeEvidenceKind: reference.scopeEvidenceKind,
      scopeType: reference.scopeType,
      referenceKind: reference.referenceKind,
      evidenceIds: reference.evidenceIds?.length ? reference.evidenceIds : undefined,
      bindingId: binding?.id,
      bindingName: binding?.name ?? reference.resolvedName,
      bindingKind: binding?.bindingKind,
      bindingOrdinal: binding?.ordinal,
      closure: Boolean(closureCapture) || undefined,
      closureDepthDelta: closureCapture?.closureDepthDelta,
      closureBindingDepth: closureCapture?.closureBindingDepth,
      closureOwnerName: closureCapture?.closureOwnerName,
      closureCaptureHash: closureCapture?.closureCaptureHash,
      publicContract: (binding?.publicContract || Boolean(publicOwnerName)) || undefined,
      publicOwnerName,
      status: binding ? undefined : 'unresolved',
      reasonCodes: binding ? undefined : ['scope-manager-unresolved-reference'],
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectScopeReferenceSignature',
        name: reference.name,
        namespace: reference.namespace,
        bindingId: binding?.id,
        sourceSpan: semanticSpan,
        evidenceSource: reference.scopeEvidenceSource,
        closureCaptureHash: closureCapture?.closureCaptureHash,
        closureDepthDelta: closureCapture?.closureDepthDelta,
        closureOwnerName: closureCapture?.closureOwnerName
      })
    })];
  });
}

function structuralBindingIndex(inputs, records) {
  const byExternalId = new Map();
  const byNameRange = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const input = inputs[index];
    const record = records[index];
    for (const externalId of uniqueStrings([input?.externalBindingId, record.externalBindingId, input?.bindingId])) byExternalId.set(externalId, record);
    byNameRange.set(nameRangeKey(record.name, record.start, record.end), record);
  }
  return { byExternalId, byNameRange };
}

function structuralBindingForReference(reference, bindings, bindingIndex) {
  for (const externalId of uniqueStrings([reference.externalBindingId, reference.bindingId, reference.resolvedBindingId])) {
    const binding = bindingIndex.byExternalId.get(externalId);
    if (binding) return binding;
  }
  const byResolvedRange = bindingIndex.byNameRange.get(nameRangeKey(reference.resolvedName, reference.resolvedStart, reference.resolvedEnd));
  if (byResolvedRange) return byResolvedRange;
  return bindings
    .filter((binding) => binding.name === (reference.resolvedName ?? reference.name) && namespaceOverlap(binding.namespaces, reference.namespaces))
    .sort((left, right) => Math.abs(left.depth - reference.depth) - Math.abs(right.depth - reference.depth) || right.start - left.start)[0];
}

function nameRangeKey(name, start, end) {
  return name && Number.isInteger(start) && Number.isInteger(end) ? `${name}:${start}:${end}` : undefined;
}

export { structuralScopeRecordsForImport };
