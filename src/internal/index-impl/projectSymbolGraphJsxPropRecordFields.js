function jsxPropValueRecordFields(valueEvidence) {
  return {
    propValueProofStatus: valueEvidence?.proofStatus,
    propValueReasonCode: valueEvidence?.reasonCode,
    propValueKind: valueEvidence?.valueKind,
    propValueText: valueEvidence?.valueText,
    propValueExpressionText: valueEvidence?.expressionText,
    propValueReferenceRoot: valueEvidence?.referenceRoot,
    propValueReferencePath: valueEvidence?.referencePath,
    propValueDynamicText: valueEvidence?.dynamicText,
    propValueOptionalReference: valueEvidence?.optionalReference,
    propValueOptionalReferenceSegments: valueEvidence?.optionalReferenceSegments,
    propValueOptionalReferenceSegmentIndexes: valueEvidence?.optionalReferenceSegmentIndexes,
    propValueOptionalNullishBoundaryCount: valueEvidence?.optionalNullishBoundaryCount,
    propValueClaimScope: valueEvidence?.claimScope,
    propValueRenderEquivalenceClaim: valueEvidence?.renderEquivalenceClaim,
    propValueStaticSpreadSourceKind: valueEvidence?.staticSpreadSourceKind,
    propValueStaticSpreadSourceName: valueEvidence?.staticSpreadSourceName,
    propValueStaticSpreadPropEntries: valueEvidence?.staticSpreadPropEntries,
    propValueStaticSpreadPropNames: valueEvidence?.staticSpreadPropNames,
    propValueStaticSpreadPropCount: valueEvidence?.staticSpreadPropCount,
    propValueStaticSpreadEffectivePropEntries: valueEvidence?.staticSpreadEffectivePropEntries,
    propValueStaticSpreadEffectivePropNames: valueEvidence?.staticSpreadEffectivePropNames,
    propValueStaticSpreadExplicitOverridePropNames: valueEvidence?.staticSpreadExplicitOverridePropNames,
    propValueStaticSpreadOverridesExplicitPropNames: valueEvidence?.staticSpreadOverridesExplicitPropNames,
    propValueStaticSpreadDuplicatePropNames: valueEvidence?.staticSpreadDuplicatePropNames,
    propValueStaticSpreadPrecedenceStatus: valueEvidence?.staticSpreadPrecedenceStatus,
    propValueStaticStyleObjectProofStatus: valueEvidence?.styleObjectProofStatus,
    propValueStaticStyleObjectEntries: valueEvidence?.styleObjectEntries,
    propValueStaticStyleObjectPropertyNames: valueEvidence?.styleObjectPropertyNames,
    propValueStaticStyleObjectPropertyCount: valueEvidence?.styleObjectPropertyCount,
    propValueStaticStyleObjectDuplicatePropertyNames: valueEvidence?.styleObjectDuplicatePropertyNames,
    propValueStaticStyleObjectClaimScope: valueEvidence?.styleObjectClaimScope,
    propValueStaticStyleObjectRenderEquivalenceClaim: valueEvidence?.styleObjectRenderEquivalenceClaim,
    propValueDynamicBlockerReasonCode: valueEvidence?.dynamicBlockerReasonCode,
    propValueExpressionHash: valueEvidence?.expressionHash,
    propValueSignatureHash: valueEvidence?.signatureHash
  };
}

function jsxPropComponentFlowRecordFields(flow) {
  return {
    componentPropRenderFlowStatus: flow?.status,
    componentPropRenderFlowReasonCode: flow?.reasonCode,
    componentPropRenderFlowClaim: flow?.claim,
    componentPropRenderFlowClaimScope: flow?.claimScope,
    componentPropRenderFlowRenderEquivalenceClaim: flow?.renderEquivalenceClaim,
    componentPropRenderFlowScope: flow?.scope,
    componentPropRenderFlowTargetName: flow?.targetName,
    componentPropRenderFlowTargetKind: flow?.targetKind,
    componentPropRenderFlowTargetOwnerName: flow?.targetOwnerName,
    componentPropRenderFlowTargetOwnerCount: flow?.targetOwnerCount,
    componentPropRenderFlowTargetSourcePath: flow?.targetSourcePath,
    componentPropRenderFlowTargetLookupStatus: flow?.targetLookupStatus,
    componentPropRenderFlowTargetLookupScope: flow?.targetLookupScope,
    componentPropRenderFlowImportEdgeId: flow?.importEdgeId,
    componentPropRenderFlowImportKind: flow?.importKind,
    componentPropRenderFlowImportedName: flow?.importedName,
    componentPropRenderFlowLocalName: flow?.localName,
    componentPropRenderFlowTargetExportName: flow?.targetExportName,
    ...jsxPropComponentFlowReExportFields(flow),
    ...jsxPropComponentFlowMemberFields(flow),
    componentPropRenderFlowComponentPropName: flow?.componentPropName,
    componentPropRenderFlowRenderedTagName: flow?.renderedTagName,
    componentPropRenderFlowRenderedPropName: flow?.renderedPropName,
    componentPropRenderFlowPassthroughExpressionText: flow?.passthroughExpressionText,
    componentPropRenderFlowBindingKind: flow?.bindingKind,
    componentPropRenderFlowReturnOrdinal: flow?.returnOrdinal,
    componentPropRenderFlowDynamicBlockerReasonCode: flow?.dynamicBlockerReasonCode,
    componentPropRenderFlowTargetSignatureHash: flow?.targetSignatureHash,
    componentPropRenderFlowSignatureHash: flow?.signatureHash
  };
}

function jsxPropComponentFlowReExportFields(flow) {
  return {
    componentPropRenderFlowReExportEdgeId: flow?.reExportEdgeId,
    componentPropRenderFlowReExportSourcePath: flow?.reExportSourcePath,
    componentPropRenderFlowReExportExportedName: flow?.reExportExportedName,
    componentPropRenderFlowReExportLocalName: flow?.reExportLocalName,
    componentPropRenderFlowReExportTargetSourcePath: flow?.reExportTargetSourcePath,
    componentPropRenderFlowReExportKind: flow?.reExportKind,
    componentPropRenderFlowReExportIdentityId: flow?.reExportIdentityId,
    componentPropRenderFlowTargetLookupHash: flow?.targetLookupHash
  };
}

function jsxPropComponentFlowMemberFields(flow) {
  return {
    componentPropRenderFlowMemberObjectName: flow?.memberObjectName,
    componentPropRenderFlowMemberPropertyName: flow?.memberPropertyName,
    componentPropRenderFlowMemberLocalName: flow?.memberLocalName,
    componentPropRenderFlowMemberBindingKind: flow?.memberBindingKind,
    componentPropRenderFlowMemberBindingHash: flow?.memberBindingHash
  };
}

export { jsxPropComponentFlowRecordFields, jsxPropValueRecordFields };
