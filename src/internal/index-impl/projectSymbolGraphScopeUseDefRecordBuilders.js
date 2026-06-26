import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';
import { lineColumnForOffset } from './lineColumnForOffset.js';
import { nearestLexicalPublicOwner, nearestPublicOwnerForOffset } from './projectSymbolGraphScopeUseDefOwners.js';

function bindingRecords(bindings, context) {
  const lexicalPublicOwners = bindings
    .filter((binding) => binding.depth === 0 && publicKeysHas(context.publicKeys, context.sourcePath, binding.name))
    .map((binding) => ({ name: binding.name, start: binding.start, depth: binding.depth }));
  return bindings.map((binding, index) => {
    const sourceSpan = sourceSpanForRange(context, binding.start, binding.end);
    const semanticSpan = semanticSpanForHash(sourceSpan);
    const rangeOwner = nearestPublicOwnerForOffset(context.publicOwners, binding.start);
    const lexicalOwner = nearestLexicalPublicOwner(lexicalPublicOwners, binding);
    const publicOwner = binding.name === rangeOwner?.name ? undefined : (rangeOwner ?? lexicalOwner);
    const publicContract = (publicKeysHas(context.publicKeys, context.sourcePath, binding.name) && binding.depth === 0) || Boolean(publicOwner);
    return compactRecord({
      id: `scope_binding_${idFragment(context.sourcePath)}_${index + 1}`,
      name: binding.name,
      bindingKind: binding.kind,
      namespaces: binding.namespaces,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      sourceSpan,
      start: binding.start,
      end: binding.end,
      depth: binding.depth,
      ordinal: index + 1,
      scopeEvidenceSource: binding.scopeEvidenceSource,
      scopeEvidenceKind: binding.scopeEvidenceKind,
      scopeType: binding.scopeType,
      definitionType: binding.definitionType,
      externalBindingId: binding.externalBindingId,
      evidenceIds: binding.evidenceIds?.length ? binding.evidenceIds : undefined,
      publicContract: publicContract || undefined,
      publicOwnerName: publicOwner?.name,
      signatureHash: hashSemanticValue({
        kind: 'frontier.lang.projectScopeBindingSignature',
        name: binding.name,
        bindingKind: binding.kind,
        namespaces: binding.namespaces,
        depth: binding.depth,
        sourceSpan: semanticSpan
      })
    });
  });
}

function sourceSpanForRange(context, start, end) {
  const startPos = lineColumnForOffset(context.sourceText, start);
  const endPos = lineColumnForOffset(context.sourceText, end);
  return {
    sourceId: context.sourceHash,
    path: context.sourcePath,
    start,
    end,
    startLine: startPos.line,
    startColumn: startPos.column,
    endLine: endPos.line,
    endColumn: endPos.column
  };
}

function semanticSpanForHash(span) {
  return {
    path: span.path,
    start: span.start,
    end: span.end,
    startLine: span.startLine,
    startColumn: span.startColumn,
    endLine: span.endLine,
    endColumn: span.endColumn
  };
}

function closureCaptureEvidence(referenceDepth, binding, publicOwnerName) {
  if (!binding || !Number.isInteger(referenceDepth) || !Number.isInteger(binding.depth)) return undefined;
  const closureDepthDelta = referenceDepth - binding.depth;
  if (closureDepthDelta <= 0) return undefined;
  const closureBindingDepth = binding.depth;
  const closureOwnerName = publicOwnerName ?? binding.publicOwnerName;
  return compactRecord({
    closureDepthDelta,
    closureBindingDepth,
    closureOwnerName,
    closureCaptureHash: hashSemanticValue({
      kind: 'frontier.lang.projectScopeClosureCapture',
      binding: binding.signatureHash,
      bindingId: binding.id,
      bindingName: binding.name,
      bindingKind: binding.bindingKind,
      bindingDepth: closureBindingDepth,
      referenceDepth,
      closureDepthDelta,
      closureOwnerName
    })
  });
}

function publicKeysHas(keys, sourcePath, name) {
  return Boolean(sourcePath && name && keys.has(publicKey(sourcePath, name)));
}

function publicKey(sourcePath, name) {
  return sourcePath && name ? `${sourcePath}\0${name}` : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export { bindingRecords, closureCaptureEvidence, compactRecord, publicKey, publicKeysHas, semanticSpanForHash, sourceSpanForRange };
