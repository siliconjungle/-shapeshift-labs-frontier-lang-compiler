import { compactRecord } from './js-ts-safe-merge-context.js';

function jsxPropIdentityKey(record) {
  return stableKey(['jsx-prop', record?.sourcePath, record?.publicOwnerName, record?.tagKey, record?.tagName, record?.propName]);
}

function jsxChildOrderIdentityKey(record) {
  return stableKey(['jsx-child-order', record?.sourcePath, record?.publicOwnerName, record?.keyPropValue]);
}

function jsxRenderRiskIdentityKey(record) {
  return stableKey(['jsx-render-risk', record?.sourcePath, record?.publicOwnerName, record?.tagKey, record?.tagName]);
}

function jsxPropFingerprint(record) { return record ? stableKey([record.signatureHash]) : undefined; }

function jsxChildOrderFingerprint(record) {
  return record ? stableKey([
    record.tagName,
    record.keyPropValue,
    record.ordinal,
    record.tagKey,
    record.fragmentKind,
    record.childOrderSignatureHash
  ]) : undefined;
}

function jsxRenderRiskFingerprint(record) {
  return record ? stableKey([
    record.renderRiskSignatureHash,
    ...(record.renderRiskKinds ?? []),
    ...(record.renderRiskReasonCodes ?? []),
    record.contextBoundaryKind,
    record.contextName,
    record.contextValuePropName,
    record.contextValueExpressionHash,
    record.contextValueSignatureHash,
    ...jsxContextValueFingerprintParts(record.contextValueRecord),
    ...(record.contextProviderPath ?? []),
    ...(record.contextProviderAncestorTags ?? []),
    record.contextProviderAncestorCount,
    record.contextProviderNestingSignatureHash,
    ...(record.hookNames ?? []),
    ...(record.hookCallOrder ?? []),
    record.hookCallCount,
    record.hookCallOrderSignatureHash,
    record.hookDependencyCount,
    record.hookDependencySignatureHash,
    ...jsxHookDependencyFingerprintParts(record.hookDependencyRecords),
    record.hookEffectCount,
    record.hookEffectSignatureHash,
    JSON.stringify(record.hookEffectRecords ?? []),
    ...(record.contextConsumerNames ?? []),
    record.contextConsumerCount,
    record.contextConsumerSignatureHash,
    JSON.stringify(record.contextConsumerRecords ?? []),
    record.renderReturnCount,
    record.renderReturnBranchCount,
    record.renderReturnSignatureHash,
    JSON.stringify(record.renderReturnRecords ?? []),
    ...(record.componentWrapperNames ?? []),
    ...(record.componentWrapperCalleeTexts ?? []),
    record.componentWrapperCount,
    record.componentWrapperRenderEquivalenceClaim,
    record.componentWrapperSignatureHash,
    JSON.stringify(record.componentWrapperRecords ?? []),
    ...(record.eventHandlerPropNames ?? []),
    record.eventHandlerPropCount,
    record.eventHandlerSignatureHash,
    ...jsxEventHandlerFingerprintParts(record.eventHandlerPropRecords)
  ]) : undefined;
}

function jsxChildOrderDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    publicOwnerName: record.publicOwnerName,
    tagName: record.tagName,
    tagKey: record.tagKey,
    keyPropValue: record.keyPropValue,
    keyPropHash: record.keyPropHash,
    ordinal: record.ordinal,
    fragmentKind: record.fragmentKind,
    childOrderSignatureHash: record.childOrderSignatureHash,
    sourceHash: record.sourceHash
  });
}

function jsxPropDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath, publicOwnerName: record.publicOwnerName,
    tagName: record.tagName, tagKey: record.tagKey, propName: record.propName, propKind: record.propKind,
    spreadOrdinal: record.spreadOrdinal, spreadExpressionHash: record.spreadExpressionHash,
    propValueProofStatus: record.propValueProofStatus, propValueReasonCode: record.propValueReasonCode,
    propValueKind: record.propValueKind, propValueText: record.propValueText, propValueExpressionText: record.propValueExpressionText,
    propValueReferenceRoot: record.propValueReferenceRoot, propValueReferencePath: record.propValueReferencePath,
    propValueOptionalReference: record.propValueOptionalReference, propValueOptionalReferenceSegments: record.propValueOptionalReferenceSegments,
    propValueOptionalReferenceSegmentIndexes: record.propValueOptionalReferenceSegmentIndexes, propValueOptionalNullishBoundaryCount: record.propValueOptionalNullishBoundaryCount,
    propValueClaimScope: record.propValueClaimScope, propValueRenderEquivalenceClaim: record.propValueRenderEquivalenceClaim,
    propValueStaticSpreadSourceKind: record.propValueStaticSpreadSourceKind, propValueStaticSpreadSourceName: record.propValueStaticSpreadSourceName,
    propValueStaticSpreadPropEntries: record.propValueStaticSpreadPropEntries, propValueStaticSpreadPropNames: record.propValueStaticSpreadPropNames,
    propValueStaticSpreadPropCount: record.propValueStaticSpreadPropCount,
    propValueStaticSpreadEffectivePropEntries: record.propValueStaticSpreadEffectivePropEntries, propValueStaticSpreadEffectivePropNames: record.propValueStaticSpreadEffectivePropNames,
    propValueStaticSpreadExplicitOverridePropNames: record.propValueStaticSpreadExplicitOverridePropNames,
    propValueStaticSpreadOverridesExplicitPropNames: record.propValueStaticSpreadOverridesExplicitPropNames,
    propValueStaticSpreadDuplicatePropNames: record.propValueStaticSpreadDuplicatePropNames,
    propValueStaticSpreadPrecedenceStatus: record.propValueStaticSpreadPrecedenceStatus,
    propValueStaticStyleObjectProofStatus: record.propValueStaticStyleObjectProofStatus,
    propValueStaticStyleObjectEntries: record.propValueStaticStyleObjectEntries,
    propValueStaticStyleObjectPropertyNames: record.propValueStaticStyleObjectPropertyNames,
    propValueStaticStyleObjectPropertyCount: record.propValueStaticStyleObjectPropertyCount,
    propValueStaticStyleObjectDuplicatePropertyNames: record.propValueStaticStyleObjectDuplicatePropertyNames,
    propValueStaticStyleObjectClaimScope: record.propValueStaticStyleObjectClaimScope,
    propValueStaticStyleObjectRenderEquivalenceClaim: record.propValueStaticStyleObjectRenderEquivalenceClaim,
    propValueDynamicText: record.propValueDynamicText, propValueDynamicBlockerReasonCode: record.propValueDynamicBlockerReasonCode,
    propValueExpressionHash: record.propValueExpressionHash, propValueSignatureHash: record.propValueSignatureHash,
    componentPropRenderFlowStatus: record.componentPropRenderFlowStatus, componentPropRenderFlowReasonCode: record.componentPropRenderFlowReasonCode,
    componentPropRenderFlowClaim: record.componentPropRenderFlowClaim, componentPropRenderFlowClaimScope: record.componentPropRenderFlowClaimScope,
    componentPropRenderFlowRenderEquivalenceClaim: record.componentPropRenderFlowRenderEquivalenceClaim,
    componentPropRenderFlowScope: record.componentPropRenderFlowScope,
    componentPropRenderFlowTargetName: record.componentPropRenderFlowTargetName,
    componentPropRenderFlowTargetKind: record.componentPropRenderFlowTargetKind,
    componentPropRenderFlowTargetOwnerName: record.componentPropRenderFlowTargetOwnerName,
    componentPropRenderFlowTargetOwnerCount: record.componentPropRenderFlowTargetOwnerCount,
    componentPropRenderFlowTargetSourcePath: record.componentPropRenderFlowTargetSourcePath,
    componentPropRenderFlowComponentPropName: record.componentPropRenderFlowComponentPropName,
    componentPropRenderFlowRenderedTagName: record.componentPropRenderFlowRenderedTagName,
    componentPropRenderFlowRenderedPropName: record.componentPropRenderFlowRenderedPropName,
    componentPropRenderFlowPassthroughExpressionText: record.componentPropRenderFlowPassthroughExpressionText,
    componentPropRenderFlowBindingKind: record.componentPropRenderFlowBindingKind,
    componentPropRenderFlowReturnOrdinal: record.componentPropRenderFlowReturnOrdinal,
    componentPropRenderFlowDynamicBlockerReasonCode: record.componentPropRenderFlowDynamicBlockerReasonCode,
    componentPropRenderFlowTargetSignatureHash: record.componentPropRenderFlowTargetSignatureHash,
    componentPropRenderFlowSignatureHash: record.componentPropRenderFlowSignatureHash,
    ordinal: record.ordinal, signatureHash: record.signatureHash, sourceHash: record.sourceHash
  });
}

function jsxRenderRiskDetails(record) {
  if (!record) return undefined;
  return compactRecord({
    sourcePath: record.sourcePath,
    publicOwnerName: record.publicOwnerName,
    tagName: record.tagName,
    tagKey: record.tagKey,
    renderRiskKinds: record.renderRiskKinds,
    renderRiskReasonCodes: record.renderRiskReasonCodes,
    contextBoundaryKind: record.contextBoundaryKind,
    contextName: record.contextName,
    contextValuePropName: record.contextValuePropName,
    contextValueExpressionHash: record.contextValueExpressionHash,
    contextValueSignatureHash: record.contextValueSignatureHash,
    contextValueRecord: record.contextValueRecord,
    contextProviderPath: record.contextProviderPath,
    contextProviderAncestorTags: record.contextProviderAncestorTags,
    contextProviderAncestorCount: record.contextProviderAncestorCount,
    contextProviderNestingSignatureHash: record.contextProviderNestingSignatureHash,
    hookNames: record.hookNames,
    hookCallOrder: record.hookCallOrder,
    hookCallCount: record.hookCallCount,
    hookCallOrderSignatureHash: record.hookCallOrderSignatureHash,
    hookDependencyRecords: record.hookDependencyRecords,
    hookDependencyCount: record.hookDependencyCount,
    hookDependencySignatureHash: record.hookDependencySignatureHash,
    hookEffectRecords: record.hookEffectRecords,
    hookEffectCount: record.hookEffectCount,
    hookEffectSignatureHash: record.hookEffectSignatureHash,
    contextConsumerNames: record.contextConsumerNames,
    contextConsumerRecords: record.contextConsumerRecords,
    contextConsumerCount: record.contextConsumerCount,
    contextConsumerSignatureHash: record.contextConsumerSignatureHash,
    renderReturnRecords: record.renderReturnRecords, renderReturnCount: record.renderReturnCount, renderReturnBranchCount: record.renderReturnBranchCount, renderReturnSignatureHash: record.renderReturnSignatureHash,
    componentWrapperNames: record.componentWrapperNames,
    componentWrapperCalleeTexts: record.componentWrapperCalleeTexts,
    componentWrapperRecords: record.componentWrapperRecords,
    componentWrapperCount: record.componentWrapperCount,
    componentWrapperRenderEquivalenceClaim: record.componentWrapperRenderEquivalenceClaim,
    componentWrapperSignatureHash: record.componentWrapperSignatureHash,
    eventHandlerPropNames: record.eventHandlerPropNames,
    eventHandlerPropRecords: record.eventHandlerPropRecords,
    eventHandlerPropCount: record.eventHandlerPropCount,
    eventHandlerSignatureHash: record.eventHandlerSignatureHash,
    renderRiskSignatureHash: record.renderRiskSignatureHash,
    sourceHash: record.sourceHash
  });
}

function stableKey(parts) {
  const values = parts.map((part) => part === undefined || part === null ? '' : String(part));
  return values.some(Boolean) ? values.join('#') : undefined;
}

function jsxRenderRiskReasonCodes(...records) {
  return uniqueStrings(records.flatMap((record) => record?.renderRiskReasonCodes ?? []));
}

function jsxPropLabel(record) { return record?.propKind === 'spread' || record?.spread ? 'spread attribute' : 'prop'; }
function hasRenderRisk(record) { return Array.isArray(record?.renderRiskKinds) && record.renderRiskKinds.length > 0; }

function jsxHookDependencyFingerprintParts(records = []) {
  return records.flatMap((record) => [
    record?.hookName,
    record?.ordinal,
    record?.dependencyCount,
    ...(record?.dependencyTexts ?? []),
    JSON.stringify(record?.dependencyRecords ?? []),
    ...(record?.dynamicDependencyReasonCodes ?? []),
    record?.dependencyArrayHash,
    record?.dependencySignatureHash
  ]);
}

function jsxContextValueFingerprintParts(record) {
  return record ? [
    record.propName, record.propKind, record.proofStatus, record.reasonCode, record.literalValueKind, record.literalValueText, record.staticValueKind, record.staticValueText, record.staticReferenceRoot,
    ...(record.staticReferencePath ?? []), ...(record.staticReferenceMemberPath ?? []), record.referenceBindingStatus,
    record.referenceBindingScope, record.referenceBindingHash, record.dynamicValueKind, record.dynamicValueText, record.dynamicBlockerReasonCode, record.expressionHash, record.signatureHash
  ] : [];
}

function jsxEventHandlerFingerprintParts(records = []) {
  return records.flatMap((record) => [
    record?.propName, record?.ordinal, record?.propKind,
    record?.proofStatus, record?.reasonCode, record?.handlerReferenceText, record?.handlerReferenceRoot,
    ...(record?.handlerReferencePath ?? []), record?.optionalReference,
    ...(record?.optionalReferenceSegments ?? []), ...(record?.optionalReferenceSegmentIndexes ?? []),
    record?.optionalNullishBoundaryCount, record?.dynamicExpressionText, record?.dynamicExpressionKind,
    record?.dynamicBlockerReasonCode,
    record?.expressionHash,
    record?.signatureHash
  ]);
}

function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }

export {
  hasRenderRisk,
  jsxChildOrderDetails,
  jsxChildOrderFingerprint,
  jsxChildOrderIdentityKey,
  jsxPropDetails,
  jsxPropFingerprint,
  jsxPropIdentityKey,
  jsxPropLabel,
  jsxRenderRiskDetails,
  jsxRenderRiskFingerprint,
  jsxRenderRiskIdentityKey,
  jsxRenderRiskReasonCodes
};
