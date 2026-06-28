import { compactRecord } from './js-ts-safe-merge-context.js';

function scopeFingerprint(record) {
  return record ? stableKey([
    record.signatureHash,
    record.useHash,
    record.localUseHash,
    record.resolvedUseHash,
    record.publicOwnerUseHash,
    record.closureUseHash,
    record.aliasHash,
    record.aliasResolutionStatus,
    record.aliasResolutionReasonCodes?.join('|'),
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
    record.aliasResolutionReasonCodes?.join('|'),
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
    aliasResolutionStatus: record.aliasResolutionStatus,
    aliasResolutionReasonCodes: record.aliasResolutionReasonCodes,
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
    aliasResolutionReasonCodes: record.aliasResolutionReasonCodes,
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

export { scopeDetails, scopeFingerprint, scopeReferenceDetails, scopeReferenceFingerprint };
