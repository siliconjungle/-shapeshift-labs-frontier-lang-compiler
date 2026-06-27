import { compactRecord } from './js-ts-safe-merge-context.js';

function projectScopeUseDefDeltaConflicts(projectGraphDelta) {
  const baseGraph = projectGraphDelta?.stages?.base?.projectSymbolGraph;
  const workerGraph = projectGraphDelta?.stages?.worker?.projectSymbolGraph;
  const headGraph = projectGraphDelta?.stages?.head?.projectSymbolGraph;
  const outputGraph = projectGraphDelta?.stages?.output?.projectSymbolGraph;
  const ambiguousOutputConflicts = projectScopeUseDefAmbiguousEvidenceConflicts(outputGraph);
  if (!baseGraph || !workerGraph || !headGraph) return ambiguousOutputConflicts;
  const base = publicScopeBindings(baseGraph.scopeBindingRecords);
  const worker = publicScopeBindings(workerGraph.scopeBindingRecords);
  const head = publicScopeBindings(headGraph.scopeBindingRecords);
  const output = publicScopeBindings(outputGraph?.scopeBindingRecords);
  const referenceDeltaConflicts = projectScopeReferenceDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph);
  const deltaConflicts = uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [scopeFingerprint(baseRecord), scopeFingerprint(workerRecord), scopeFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectScopeUseDefDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
  return [...ambiguousOutputConflicts, ...referenceDeltaConflicts, ...deltaConflicts];
}

function projectScopeUseDefDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-public-scope-use-def-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed public scope/use-def binding ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-use-def-delta-conflict',
      conflictKey: `project-graph-delta#scope-use-def#${identityKey}`,
      identityKey,
      sourcePath,
      base: scopeDetails(baseRecord),
      worker: scopeDetails(workerRecord),
      head: scopeDetails(headRecord),
      output: scopeDetails(outputRecord)
    })
  };
}

function publicScopeBindings(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = scopeIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function projectScopeUseDefAmbiguousEvidenceConflicts(graph) {
  const bindingConflicts = [...publicScopeBindings(graph?.scopeBindingRecords).entries()]
    .filter(([, record]) => record?.scopeUseDefStatus === 'blocked' && record.scopeUseDefReasonCodes?.length)
    .map(([identityKey, record]) => projectScopeUseDefAmbiguousEvidenceConflict(identityKey, record));
  const referenceConflicts = [...publicScopeReferences(graph?.scopeReferenceRecords).entries()]
    .filter(([, record]) => (record.status === 'blocked' || record.status === 'unresolved') && record.reasonCodes?.length)
    .map(([identityKey, record]) => projectScopeReferenceAmbiguousEvidenceConflict(identityKey, record));
  return [...bindingConflicts, ...referenceConflicts];
}

function projectScopeUseDefAmbiguousEvidenceConflict(identityKey, record) {
  return {
    code: 'project-public-scope-use-def-ambiguous-evidence',
    gateId: 'project-graph-delta',
    message: `Output public scope/use-def binding ${JSON.stringify(identityKey)} has unsupported or ambiguous use-def evidence.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-use-def-ambiguous-evidence',
      conflictKey: `project-graph-delta#scope-use-def-ambiguous#${identityKey}`,
      identityKey,
      sourcePath: record.sourcePath,
      reasonCodes: record.scopeUseDefReasonCodes,
      output: scopeDetails(record)
    })
  };
}

function scopeIdentityKey(record) {
  return stableKey(['scope-binding', record?.sourcePath, record?.publicOwnerName, record?.name, record?.bindingKind, record?.namespaces?.join('|'), record?.ordinal]);
}

function projectScopeReferenceDeltaConflicts(baseGraph, workerGraph, headGraph, outputGraph) {
  const base = publicScopeReferences(baseGraph.scopeReferenceRecords);
  const worker = publicScopeReferences(workerGraph.scopeReferenceRecords);
  const head = publicScopeReferences(headGraph.scopeReferenceRecords);
  const output = publicScopeReferences(outputGraph?.scopeReferenceRecords);
  return uniqueStrings([...base.keys(), ...worker.keys(), ...head.keys()]).flatMap((identityKey) => {
    const baseRecord = base.get(identityKey);
    const workerRecord = worker.get(identityKey);
    const headRecord = head.get(identityKey);
    const fingerprints = [scopeReferenceFingerprint(baseRecord), scopeReferenceFingerprint(workerRecord), scopeReferenceFingerprint(headRecord)];
    if (fingerprints[0] === fingerprints[1] || fingerprints[0] === fingerprints[2] || fingerprints[1] === fingerprints[2]) return [];
    return [projectScopeReferenceDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, output.get(identityKey))];
  });
}

function projectScopeReferenceDeltaConflict(identityKey, baseRecord, workerRecord, headRecord, outputRecord) {
  const sourcePath = workerRecord?.sourcePath ?? headRecord?.sourcePath ?? baseRecord?.sourcePath;
  return {
    code: 'project-public-scope-reference-delta-conflict',
    gateId: 'project-graph-delta',
    message: `Worker and head both changed public scope/use-def reference ${JSON.stringify(identityKey)} in incompatible ways.`,
    sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-reference-delta-conflict',
      conflictKey: `project-graph-delta#scope-reference#${identityKey}`,
      identityKey,
      sourcePath,
      base: scopeReferenceDetails(baseRecord),
      worker: scopeReferenceDetails(workerRecord),
      head: scopeReferenceDetails(headRecord),
      output: scopeReferenceDetails(outputRecord)
    })
  };
}

function projectScopeReferenceAmbiguousEvidenceConflict(identityKey, record) {
  return {
    code: 'project-public-scope-reference-ambiguous-evidence',
    gateId: 'project-graph-delta',
    message: `Output public scope/use-def reference ${JSON.stringify(identityKey)} has unsupported or ambiguous evidence.`,
    sourcePath: record.sourcePath,
    details: compactRecord({
      reasonCode: 'project-public-scope-reference-ambiguous-evidence',
      conflictKey: `project-graph-delta#scope-reference-ambiguous#${identityKey}`,
      identityKey,
      sourcePath: record.sourcePath,
      reasonCodes: record.reasonCodes,
      output: scopeReferenceDetails(record)
    })
  };
}

function publicScopeReferences(records = []) {
  const result = new Map();
  for (const record of records) {
    if (!record?.publicContract) continue;
    const key = scopeReferenceIdentityKey(record);
    if (key && !result.has(key)) result.set(key, record);
  }
  return result;
}

function scopeReferenceIdentityKey(record) {
  return stableKey(['scope-reference', record?.sourcePath, record?.publicOwnerName, record?.bindingName ?? record?.name, record?.namespace, record?.ordinal ?? record?.start]);
}

function scopeFingerprint(record) {
  return record ? stableKey([
    record.signatureHash,
    record.useHash,
    record.localUseHash,
    record.resolvedUseHash,
    record.publicOwnerUseHash,
    record.closureUseHash,
    record.aliasHash,
    record.scopeUseDefStatus,
    record.scopeUseDefReasonCodes?.join('|'),
    record.referenceCount,
    record.closureReferenceCount
  ]) : undefined;
}

function scopeReferenceFingerprint(record) {
  return record ? stableKey([
    record.signatureHash,
    record.resolvedUseHash,
    record.resolvedBindingUseHash,
    record.resolvedExportUseHash,
    record.moduleSpecifier,
    record.importedName,
    record.resolvedSourcePath,
    record.resolvedExportName,
    record.closureCaptureHash,
    record.templateExpressionHash,
    record.templateLiteralKind,
    record.taggedTemplate,
    record.templateTagText,
    record.templateTagRoot,
    record.templateTagMemberName,
    record.receiverKind,
    record.memberName,
    record.memberLiteralKind,
    record.memberStaticTemplateLiteral,
    record.memberComputed,
    record.memberOptional,
    record.writeOperation,
    record.status,
    record.reasonCodes?.join('|'),
    record.aliasResolutionStatus,
    record.aliasResolutionEvidenceKind,
    record.originSourcePath,
    record.originSourceHash,
    record.originSourceSymbolId,
    record.originSourceSymbolSignatureHash,
    record.resolvedBindingName,
    record.compilerReferenceStatus,
    record.compilerReferenceReasonCodes?.join('|'),
    record.compilerReferenceSymbolId,
    record.compilerReferenceIdentityHash,
    record.compilerReferenceProofHash
  ]) : undefined;
}

function scopeDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    name: record.name,
    bindingKind: record.bindingKind,
    publicOwnerName: record.publicOwnerName,
    namespaces: record.namespaces,
    ordinal: record.ordinal,
    referenceCount: record.referenceCount,
    closureReferenceCount: record.closureReferenceCount,
    signatureHash: record.signatureHash,
    useHash: record.useHash,
    localUseHash: record.localUseHash,
    resolvedUseHash: record.resolvedUseHash,
    publicOwnerUseHash: record.publicOwnerUseHash,
    closureUseHash: record.closureUseHash,
    aliasHash: record.aliasHash,
    scopeUseDefStatus: record.scopeUseDefStatus,
    scopeUseDefReasonCodes: record.scopeUseDefReasonCodes,
    importedName: record.importedName,
    moduleSpecifier: record.moduleSpecifier,
    resolvedSourcePath: record.resolvedSourcePath,
    originSourcePath: record.originSourcePath,
    originSourceHash: record.originSourceHash,
    originSignatureHash: record.originSignatureHash,
    originSourceSymbolId: record.originSourceSymbolId,
    originSourceSymbolKind: record.originSourceSymbolKind,
    originSourceSymbolSignatureHash: record.originSourceSymbolSignatureHash,
    resolvedBindingName: record.resolvedBindingName,
    resolvedBindingUseHash: record.resolvedBindingUseHash,
    resolvedExportUseHash: record.resolvedExportUseHash,
    aliasResolutionEvidenceKind: record.aliasResolutionEvidenceKind,
    exportedNames: record.exportedNames,
    reExportedNames: record.reExportedNames,
    sourceHash: record.sourceHash
  });
}

function scopeReferenceDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    name: record.name,
    namespace: record.namespace,
    bindingName: record.bindingName,
    bindingKind: record.bindingKind,
    bindingOrdinal: record.bindingOrdinal,
    publicOwnerName: record.publicOwnerName,
    referenceKind: record.referenceKind,
    receiverKind: record.receiverKind,
    memberName: record.memberName,
    memberStart: record.memberStart,
    memberEnd: record.memberEnd,
    memberLiteralKind: record.memberLiteralKind,
    memberStaticTemplateLiteral: record.memberStaticTemplateLiteral,
    memberComputed: record.memberComputed,
    memberOptional: record.memberOptional,
    writeOperation: record.writeOperation,
    closure: record.closure,
    closureDepthDelta: record.closureDepthDelta,
    closureCaptureHash: record.closureCaptureHash,
    templateExpressionHash: record.templateExpressionHash,
    templateLiteralKind: record.templateLiteralKind,
    taggedTemplate: record.taggedTemplate,
    templateTagText: record.templateTagText,
    templateTagRoot: record.templateTagRoot,
    templateTagMemberName: record.templateTagMemberName,
    signatureHash: record.signatureHash,
    resolvedUseHash: record.resolvedUseHash,
    importAlias: record.importAlias,
    moduleSpecifier: record.moduleSpecifier,
    importedName: record.importedName,
    resolvedSourcePath: record.resolvedSourcePath,
    resolvedExportName: record.resolvedExportName,
    resolvedBindingId: record.resolvedBindingId,
    resolvedBindingUseHash: record.resolvedBindingUseHash,
    status: record.status,
    reasonCodes: record.reasonCodes,
    aliasResolutionStatus: record.aliasResolutionStatus,
    aliasResolutionEvidenceKind: record.aliasResolutionEvidenceKind,
    originSourcePath: record.originSourcePath,
    originSourceHash: record.originSourceHash,
    originSignatureHash: record.originSignatureHash,
    originSourceSymbolId: record.originSourceSymbolId,
    originSourceSymbolKind: record.originSourceSymbolKind,
    originSourceSymbolSignatureHash: record.originSourceSymbolSignatureHash,
    resolvedBindingName: record.resolvedBindingName,
    resolvedExportUseHash: record.resolvedExportUseHash,
    compilerReferenceStatus: record.compilerReferenceStatus,
    compilerReferenceReasonCodes: record.compilerReferenceReasonCodes,
    compilerReferenceSymbolId: record.compilerReferenceSymbolId,
    compilerReferenceIdentityHash: record.compilerReferenceIdentityHash,
    compilerReferenceFullyQualifiedName: record.compilerReferenceFullyQualifiedName,
    compilerReferenceLocalName: record.compilerReferenceLocalName,
    compilerReferenceTargetName: record.compilerReferenceTargetName,
    compilerReferenceAliased: record.compilerReferenceAliased,
    compilerReferenceProofHash: record.compilerReferenceProofHash,
    compilerReferenceCandidates: record.compilerReferenceCandidates,
    sourceHash: record.sourceHash
  });
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export { projectScopeUseDefDeltaConflicts };
