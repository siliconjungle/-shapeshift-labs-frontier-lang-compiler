import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function directUseHashesByBinding(bindings, references) {
  const referencesByBinding = groupBy(references, 'bindingId');
  return new Map(bindings.map((binding) => [binding.id, hashSemanticValue({
    kind: 'frontier.lang.projectScopeBindingLocalUseHash',
    binding: binding.signatureHash,
    references: (referencesByBinding.get(binding.id) ?? []).map((reference) => reference.signatureHash).sort()
  })]));
}

function finalizeBindingUseHashes(bindings, references) {
  const referencesByBinding = groupBy(references, 'bindingId');
  const ownerReferencesByKey = groupByKey(references.filter((reference) => reference.publicOwnerName), (reference) => localKey(reference.sourcePath, reference.publicOwnerName));
  return bindings.map((binding) => bindingWithUseHash(binding, referencesByBinding.get(binding.id) ?? [], ownerReferencesByKey.get(localKey(binding.sourcePath, binding.name)) ?? []));
}

function bindingWithUseHash(binding, references, ownerReferences) {
  const referenceUseHashes = references.map(referenceUseHash).sort();
  const closureReferences = references.filter((reference) => reference.closure);
  const closureCaptureUseHashes = closureReferences.map(closureCaptureUseHash).sort();
  const scopeUseDefReasonCodes = uniqueStrings([
    ...(binding.scopeUseDefReasonCodes ?? []),
    ...references.flatMap((reference) => reference.reasonCodes ?? []),
    ...ownerReferences.flatMap((reference) => reference.reasonCodes ?? [])
  ]);
  const closureUseHash = closureReferences.length ? hashSemanticValue({
    kind: 'frontier.lang.projectScopeBindingClosureUseHash',
    binding: binding.signatureHash,
    references: closureReferences.map(referenceUseHash).sort(),
    captures: closureCaptureUseHashes
  }) : undefined;
  const closureCaptureHash = closureReferences.length ? hashSemanticValue({
    kind: 'frontier.lang.projectScopeBindingClosureCaptureHash',
    binding: binding.signatureHash,
    captures: closureCaptureUseHashes
  }) : undefined;
  const publicOwnerUseHash = binding.publicContract && ownerReferences.length ? hashSemanticValue({
    kind: 'frontier.lang.projectScopePublicOwnerUseHash',
    binding: binding.signatureHash,
    references: ownerReferences.map(referenceUseHash).sort()
  }) : undefined;
  return compactRecord({
    ...binding,
    publicOwnerUseHash,
    closureUseHash,
    closureCaptureHash,
    scopeUseDefStatus: scopeUseDefReasonCodes.length ? 'blocked' : undefined,
    scopeUseDefReasonCodes: scopeUseDefReasonCodes.length ? scopeUseDefReasonCodes : undefined,
    referenceCount: references.length,
    closureReferenceCount: closureReferences.length,
    useHash: hashSemanticValue({
      kind: 'frontier.lang.projectScopeBindingUseHash',
      binding: binding.signatureHash,
      references: referenceUseHashes,
      closureUseHash,
      closureCaptureHash,
      publicOwnerUseHash,
      aliasHash: binding.aliasHash,
      resolvedUseHash: binding.resolvedUseHash,
      scopeUseDefReasonCodes: scopeUseDefReasonCodes.length ? scopeUseDefReasonCodes : undefined
    })
  });
}

function closureCaptureUseHash(reference) {
  return reference.closureCaptureHash ? hashSemanticValue({
    kind: 'frontier.lang.projectScopeReferenceClosureCaptureUseHash',
    reference: referenceUseHash(reference),
    closureCaptureHash: reference.closureCaptureHash,
    closureDepthDelta: reference.closureDepthDelta,
    closureBindingDepth: reference.closureBindingDepth,
    closureOwnerName: reference.closureOwnerName
  }) : referenceUseHash(reference);
}

function referenceUseHash(reference) {
  return reference.resolvedUseHash ? hashSemanticValue({
    kind: 'frontier.lang.projectScopeReferenceUseHash',
    reference: reference.signatureHash,
    resolvedUseHash: reference.resolvedUseHash
  }) : reference.signatureHash;
}

function groupBy(records, field) {
  const result = new Map();
  for (const record of records) {
    const key = record?.[field];
    if (key) result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}

function groupByKey(records, keyFn) {
  const result = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (key) result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}

function localKey(sourcePath, name) { return sourcePath && name ? `${sourcePath}\0${name}` : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { directUseHashesByBinding, finalizeBindingUseHashes };
