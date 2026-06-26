import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';

function jsxComponentProviderContextConsumerRecords(tag, componentCall, contextProviderAncestors = []) {
  if (!componentCall) return [];
  if (componentCall.status !== 'resolved') return [unsupportedComponentProviderLookupRecord(tag, componentCall, contextProviderAncestors)];
  const calls = (componentCall.owner?.hookCalls ?? []).filter((call) => call?.contextExpressionHash);
  return calls.map((call) => componentContextConsumerRecord(call, tag, componentCall, contextProviderAncestors));
}

function componentContextConsumerRecord(call, tag, componentCall, contextProviderAncestors) {
  const proofStatus = call.contextConsumerProofStatus ?? (call.contextConsumerDynamicTarget
    ? 'dynamic-context-target-unsupported'
    : 'static-context-target-evidence');
  const provider = nearestContextProvider(contextProviderAncestors, call.contextName);
  const flow = provider?.providerFlowStatus === 'static-provider-children-flow-evidence';
  const projectImport = String(componentCall.scope ?? '').startsWith('project-import-');
  const componentCallLookupHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxComponentProviderLookupTarget',
    tagName: tag.tagName,
    targetName: componentCall.targetName,
    ownerName: componentCall.owner?.name,
    scope: componentCall.scope,
    targetSourcePath: componentCall.owner?.componentCallTargetSourcePath,
    importEdgeId: componentCall.owner?.componentCallImportEdgeId,
    reExportEdgeId: componentCall.owner?.componentCallReExportEdgeId,
    reExportIdentityId: componentCall.owner?.componentCallReExportIdentityId,
    memberBindingHash: componentCall.owner?.componentCallMemberBindingHash
  });
  const lookupHash = provider ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxComponentContextProviderLookup',
    contextName: call.contextName,
    tagName: provider.tagName,
    depth: provider.depth,
    providerFlowHash: provider.providerFlowHash,
    componentProviderFlowLookupHash: provider.componentProviderFlowLookupHash,
    componentCallLookupHash
  }) : undefined;
  const signatureHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxComponentContextConsumerWithProviderLookup',
    baseSignatureHash: call.contextConsumerSignatureHash,
    contextName: call.contextName,
    provider,
    componentCallLookupHash
  });
  return compactRecord({
    hookName: call.name,
    ordinal: call.ordinal,
    contextName: call.contextName,
    contextExpressionText: call.contextExpressionText,
    contextExpressionHash: call.contextExpressionHash,
    contextTargetKind: call.contextTargetKind,
    contextTargetReasonCode: call.contextTargetReasonCode,
    contextTargetReferenceRoot: call.contextTargetReferenceRoot,
    contextTargetReferencePath: call.contextTargetReferencePath,
    contextTargetReferenceMemberPath: call.contextTargetReferenceMemberPath,
    optionalReference: call.contextTargetOptionalReference,
    optionalReferenceSegments: call.contextTargetOptionalReferenceSegments,
    optionalReferenceSegmentIndexes: call.contextTargetOptionalReferenceSegmentIndexes,
    optionalNullishBoundaryCount: call.contextTargetOptionalNullishBoundaryCount,
    contextProviderLookupStatus: contextProviderLookupStatus(provider, flow, projectImport),
    contextProviderLookupScope: contextProviderLookupScope(flow, projectImport, componentCall.scope, provider),
    contextProviderLookupName: provider?.contextName,
    contextProviderLookupTagName: provider?.tagName,
    contextProviderLookupDepth: provider?.depth,
    contextProviderLookupHash: lookupHash,
    componentCallLookupStatus: componentCall.lookupStatus ?? 'same-file-component-target-evidence',
    componentCallTagName: tag.tagName,
    componentCallTargetName: componentCall.targetName,
    componentCallTargetOwnerName: componentCall.owner?.name,
    componentCallTargetSourcePath: componentCall.owner?.componentCallTargetSourcePath,
    componentCallImportEdgeId: componentCall.owner?.componentCallImportEdgeId,
    componentCallImportKind: componentCall.owner?.componentCallImportKind,
    componentCallImportedName: componentCall.owner?.componentCallImportedName,
    componentCallLocalName: componentCall.owner?.componentCallLocalName,
    componentCallMemberObjectName: componentCall.owner?.componentCallMemberObjectName,
    componentCallMemberPropertyName: componentCall.owner?.componentCallMemberPropertyName,
    componentCallMemberLocalName: componentCall.owner?.componentCallMemberLocalName,
    componentCallMemberBindingKind: componentCall.owner?.componentCallMemberBindingKind,
    componentCallMemberBindingHash: componentCall.owner?.componentCallMemberBindingHash,
    componentCallTargetExportName: componentCall.owner?.componentCallTargetExportName,
    componentCallReExportEdgeId: componentCall.owner?.componentCallReExportEdgeId,
    componentCallReExportSourcePath: componentCall.owner?.componentCallReExportSourcePath,
    componentCallReExportExportedName: componentCall.owner?.componentCallReExportExportedName,
    componentCallReExportLocalName: componentCall.owner?.componentCallReExportLocalName,
    componentCallReExportTargetSourcePath: componentCall.owner?.componentCallReExportTargetSourcePath,
    componentCallReExportKind: componentCall.owner?.componentCallReExportKind,
    componentCallReExportIdentityId: componentCall.owner?.componentCallReExportIdentityId,
    componentCallLookupHash,
    componentProviderFlowStatus: provider?.providerFlowStatus,
    componentProviderFlowOwnerName: provider?.componentProviderFlowOwnerName,
    componentProviderFlowHash: provider?.providerFlowHash,
    componentProviderFlowLookupStatus: provider?.componentProviderFlowLookupStatus,
    componentProviderFlowLookupScope: provider?.componentProviderFlowLookupScope,
    componentProviderFlowLookupHash: provider?.componentProviderFlowLookupHash,
    componentProviderFlowComponentTagName: provider?.componentProviderFlowComponentTagName,
    componentProviderFlowTargetOwnerName: provider?.componentProviderFlowTargetOwnerName,
    componentProviderFlowTargetSourcePath: provider?.componentProviderFlowTargetSourcePath,
    componentProviderFlowImportEdgeId: provider?.componentProviderFlowImportEdgeId,
    componentProviderFlowImportKind: provider?.componentProviderFlowImportKind,
    componentProviderFlowImportedName: provider?.componentProviderFlowImportedName,
    componentProviderFlowLocalName: provider?.componentProviderFlowLocalName,
    componentProviderFlowTargetExportName: provider?.componentProviderFlowTargetExportName,
    componentProviderFlowReExportEdgeId: provider?.componentProviderFlowReExportEdgeId,
    componentProviderFlowReExportSourcePath: provider?.componentProviderFlowReExportSourcePath,
    componentProviderFlowReExportExportedName: provider?.componentProviderFlowReExportExportedName,
    componentProviderFlowReExportLocalName: provider?.componentProviderFlowReExportLocalName,
    componentProviderFlowReExportTargetSourcePath: provider?.componentProviderFlowReExportTargetSourcePath,
    componentProviderFlowReExportKind: provider?.componentProviderFlowReExportKind,
    componentProviderFlowReExportIdentityId: provider?.componentProviderFlowReExportIdentityId,
    signatureHash,
    proofStatus,
    dynamicTargetKind: call.contextTargetDynamicKind,
    dynamicBlockerReasonCode: call.contextTargetDynamicBlockerReasonCode,
    dynamicTarget: call.contextConsumerDynamicTarget
  });
}

function contextProviderLookupStatus(provider, flow, projectImport) {
  if (!provider) return undefined;
  if (flow && provider.componentProviderFlowLookupScope) return 'static-project-import-component-provider-flow-evidence';
  if (projectImport) return flow ? 'static-project-import-component-provider-flow-evidence' : 'static-project-import-component-provider-evidence';
  return flow ? 'static-same-file-component-provider-flow-evidence' : 'static-same-file-component-provider-evidence';
}

function contextProviderLookupScope(flow, projectImport, scope, provider) {
  if (flow && provider?.componentProviderFlowLookupScope) return projectImportProviderFlowScope(provider.componentProviderFlowLookupScope);
  if (projectImport) return flow ? projectImportProviderFlowScope(scope) : scope;
  if (scope === 'same-file-member-component') return flow ? 'same-file-member-component-children-flow' : 'same-file-member-component';
  return flow ? 'same-file-component-children-flow' : 'same-file-direct-component';
}

function projectImportProviderFlowScope(scope) {
  if (scope === 'project-import-reexport-member-component') return 'project-import-reexport-member-component-children-flow';
  if (scope === 'project-import-member-component') return 'project-import-member-component-children-flow';
  return scope === 'project-import-reexport-component' ? 'project-import-reexport-component-children-flow' : 'project-import-component-children-flow';
}

function unsupportedComponentProviderLookupRecord(tag, componentCall, contextProviderAncestors) {
  const reasonCodes = uniqueStrings([componentCall.reasonCode, 'jsx-render-context-consumer-provider-component-target-unsupported']);
  return compactRecord({
    proofStatus: 'component-provider-lookup-unsupported',
    contextProviderLookupScope: 'same-file-direct-component',
    componentCallLookupStatus: 'component-target-unsupported',
    componentCallTagName: tag.tagName,
    componentCallTargetName: componentCall.targetName,
    componentCallUnsupportedReasonCodes: reasonCodes,
    contextProviderPath: contextProviderAncestors.map((provider) => provider.contextName).filter(Boolean),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxComponentProviderLookupUnsupported',
      tagName: tag.tagName,
      targetName: componentCall.targetName,
      reasonCodes
    })
  });
}

function nearestContextProvider(providers = [], contextName) {
  if (!contextName) return undefined;
  const match = providers.map((provider, depth) => ({ ...provider, depth: depth + 1 })).reverse()
    .find((provider) => provider.contextName === contextName);
  return match ? compactRecord(match) : undefined;
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxComponentProviderContextConsumerRecords };
