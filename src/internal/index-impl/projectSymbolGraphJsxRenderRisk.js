import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { uniqueStrings } from '../../native-import-utils.js';
import { jsxContextProviderBoundary } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { jsxContextProviderValueReasonCode, jsxContextProviderValueRecord } from './projectSymbolGraphJsxContextValues.js';
import { jsxEventHandlerReasonCodes } from './projectSymbolGraphJsxEventHandlers.js';
import { jsxRenderReturnRiskEvidence } from './projectSymbolGraphJsxRenderReturns.js';
function jsxRenderRiskEvidence(tag, owner, contextProviderAncestors = [], eventHandlerProps = [], componentContextConsumerRecords = []) {
  const contextBoundary = jsxContextProviderBoundary(tag.tagName);
  const contextValueRecord = contextBoundary ? jsxContextProviderValueRecord(tag.attributes) : undefined;
  const contextProviderPath = contextProviderAncestors.map((provider) => provider.contextName).filter(Boolean);
  const contextProviderAncestorTags = contextProviderAncestors.map((provider) => provider.tagName).filter(Boolean);
  const contextProviderNestingSignatureHash = contextProviderPath.length ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxContextProviderNesting',
    tagName: tag.tagName,
    tagKey: tag.key,
    publicOwnerName: owner?.name,
    contextProviderPath,
    contextProviderAncestorTags
  }) : undefined;
  const hookCalls = Array.isArray(owner?.hookCalls) ? owner.hookCalls : [];
  const hookCallOrder = hookCalls.map((call) => call.name).filter(Boolean);
  const hookNames = uniqueStrings(hookCallOrder.length ? hookCallOrder : owner?.hookNames ?? []);
  const hookDependencyRecords = hookCalls.filter((call) => call?.dependencyArrayHash).map(hookDependencyRecord);
  const hookEffectRecords = hookCalls.filter((call) => call?.effectCallbackHash).map(hookEffectRecord);
  const contextConsumerRecords = [...hookCalls.filter((call) => call?.contextExpressionHash).map((call) => contextConsumerRecord(call, contextProviderAncestors)), ...componentContextConsumerRecords];
  const contextConsumerNames = uniqueStrings(contextConsumerRecords.map((record) => record.contextName));
  const hookCallOrderSignatureHash = hookCallOrder.length > 1 ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxHookCallOrder',
    publicOwnerName: owner?.name,
    hookCallOrder
  }) : undefined;
  const hookDependencySignatureHash = hookDependencyRecords.length ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxHookDependencyArrays',
    publicOwnerName: owner?.name,
    hookDependencyRecords
  }) : undefined;
  const hookEffectSignatureHash = hookEffectRecords.length ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxHookEffects',
    publicOwnerName: owner?.name,
    hookEffectRecords
  }) : undefined;
  const contextConsumerSignatureHash = contextConsumerRecords.length ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxContextConsumers',
    publicOwnerName: owner?.name,
    contextConsumerRecords
  }) : undefined;
  const contextConsumerReasonCodes = jsxContextConsumerReasonCodes(contextConsumerRecords);
  const renderReturnRisk = jsxRenderReturnRiskEvidence(owner);
  const eventHandlerSignatureHash = eventHandlerProps.length ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxEventHandlerProps',
    tagName: tag.tagName,
    tagKey: tag.key,
    publicOwnerName: owner?.name,
    eventHandlerProps
  }) : undefined;
  const renderRiskKinds = uniqueStrings([
    contextBoundary ? 'context-provider-boundary' : undefined,
    contextValueRecord ? 'context-provider-value-boundary' : undefined,
    contextProviderNestingSignatureHash ? 'context-provider-nesting' : undefined,
    hookNames.length ? 'hook-owner-render-scope' : undefined,
    hookCallOrderSignatureHash ? 'hook-call-order-boundary' : undefined,
    hookDependencySignatureHash ? 'hook-dependency-boundary' : undefined,
    hookEffectSignatureHash ? 'hook-effect-boundary' : undefined,
    contextConsumerSignatureHash ? 'context-consumer-boundary' : undefined,
    ...(renderReturnRisk.renderRiskKinds ?? []),
    eventHandlerSignatureHash ? 'event-handler-prop-boundary' : undefined
  ]);
  if (!renderRiskKinds.length) return {};
  const renderRiskReasonCodes = uniqueStrings([
    contextBoundary ? 'jsx-render-context-provider-boundary' : undefined,
    contextValueRecord ? jsxContextProviderValueReasonCode(contextValueRecord) : undefined,
    contextProviderNestingSignatureHash ? 'jsx-render-context-provider-nesting-unsupported' : undefined,
    hookNames.length ? 'jsx-render-public-owner-hooks' : undefined,
    hookCallOrderSignatureHash ? 'jsx-render-hook-call-order-unsupported' : undefined,
    ...jsxHookDependencyReasonCodes(hookDependencyRecords),
    ...jsxHookEffectReasonCodes(hookEffectRecords),
    ...contextConsumerReasonCodes,
    ...(renderReturnRisk.renderRiskReasonCodes ?? []),
    ...jsxEventHandlerReasonCodes(eventHandlerProps)
  ]);
  return compactRecord({
    renderRiskKinds,
    renderRiskReasonCodes,
    contextBoundaryKind: contextBoundary?.kind,
    contextName: contextBoundary?.contextName,
    contextValuePropName: contextValueRecord?.propName,
    contextValueExpressionHash: contextValueRecord?.expressionHash,
    contextValueSignatureHash: contextValueRecord?.signatureHash,
    contextValueRecord,
    contextProviderPath: contextProviderPath.length ? contextProviderPath : undefined,
    contextProviderAncestorTags: contextProviderAncestorTags.length ? contextProviderAncestorTags : undefined,
    contextProviderAncestorCount: contextProviderPath.length || undefined,
    contextProviderNestingSignatureHash,
    hookNames: hookNames.length ? hookNames : undefined,
    hookCallOrder: hookCallOrder.length ? hookCallOrder : undefined,
    hookCallCount: hookCallOrder.length || undefined,
    hookCallOrderSignatureHash,
    hookDependencyRecords: hookDependencyRecords.length ? hookDependencyRecords : undefined,
    hookDependencyCount: hookDependencyRecords.length || undefined,
    hookDependencySignatureHash,
    hookEffectRecords: hookEffectRecords.length ? hookEffectRecords : undefined,
    hookEffectCount: hookEffectRecords.length || undefined,
    hookEffectSignatureHash,
    contextConsumerNames: contextConsumerNames.length ? contextConsumerNames : undefined,
    contextConsumerRecords: contextConsumerRecords.length ? contextConsumerRecords : undefined,
    contextConsumerCount: contextConsumerRecords.length || undefined,
    contextConsumerSignatureHash,
    ...renderReturnRisk.record,
    eventHandlerPropNames: eventHandlerProps.length ? uniqueStrings(eventHandlerProps.map((record) => record.propName)) : undefined,
    eventHandlerPropRecords: eventHandlerProps.length ? eventHandlerProps : undefined,
    eventHandlerPropCount: eventHandlerProps.length || undefined,
    eventHandlerSignatureHash,
    renderRiskSignatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxRenderRiskSignature',
      tagName: tag.tagName,
      tagKey: tag.key,
      publicOwnerName: owner?.name,
      renderRiskKinds,
      renderRiskReasonCodes,
      contextBoundaryKind: contextBoundary?.kind,
      contextName: contextBoundary?.contextName,
      contextValueRecord,
      contextProviderPath,
      contextProviderAncestorTags,
      contextProviderNestingSignatureHash,
      hookNames,
      hookCallOrder,
      hookCallOrderSignatureHash,
      hookDependencyRecords,
      hookDependencySignatureHash,
      hookEffectRecords,
      hookEffectSignatureHash,
      contextConsumerNames,
      contextConsumerRecords,
      contextConsumerSignatureHash,
      renderReturnRisk: renderReturnRisk.record,
      eventHandlerProps,
      eventHandlerSignatureHash
    })
  });
}
function hookDependencyRecord(call) {
  return compactRecord({
    hookName: call.name,
    ordinal: call.ordinal,
    dependencyCount: call.dependencyCount,
    dependencyTexts: call.dependencyTexts,
    dependencyRecords: call.dependencyRecords,
    proofStatus: call.dependencyProofStatus,
    dynamicDependencyTexts: call.dynamicDependencyTexts,
    dynamicDependencyReasonCodes: call.dynamicDependencyReasonCodes,
    dependencyArrayHash: call.dependencyArrayHash,
    dependencySignatureHash: call.dependencySignatureHash
  });
}
function jsxHookDependencyReasonCodes(records = []) {
  if (!records.length) return [];
  const hasStatic = records.some((record) => record.proofStatus === 'static-dependency-array-evidence');
  const hasDynamic = records.some((record) => record.proofStatus === 'dynamic-dependency-array-unsupported');
  return [
    hasStatic ? 'jsx-render-hook-dependency-array-static-evidence' : undefined,
    hasDynamic ? 'jsx-render-hook-dependency-array-unsupported' : undefined
  ];
}
function hookEffectRecord(call) {
  return compactRecord({
    hookName: call.name,
    ordinal: call.ordinal,
    proofStatus: call.effectProofStatus,
    callbackKind: call.effectCallbackKind,
    callbackText: call.effectCallbackText,
    dynamicCallbackText: call.effectDynamicCallbackText,
    callbackHash: call.effectCallbackHash,
    callbackReferenceRoot: call.effectCallbackReferenceRoot,
    callbackReferencePath: call.effectCallbackReferencePath,
    callbackReferenceMemberPath: call.effectCallbackReferenceMemberPath,
    callbackOptionalReference: call.effectCallbackOptionalReference,
    callbackOptionalReferenceSegments: call.effectCallbackOptionalReferenceSegments,
    callbackOptionalReferenceSegmentIndexes: call.effectCallbackOptionalReferenceSegmentIndexes,
    callbackOptionalNullishBoundaryCount: call.effectCallbackOptionalNullishBoundaryCount,
    dynamicCallbackKind: call.effectDynamicCallbackKind,
    dynamicCallbackBlockerReasonCode: call.effectDynamicCallbackBlockerReasonCode,
    cleanupProofStatus: call.effectCleanupProofStatus,
    cleanupReturnKind: call.effectCleanupReturnKind,
    cleanupReturnText: call.effectCleanupReturnText,
    dynamicCleanupReturnText: call.effectDynamicCleanupReturnText,
    cleanupReturnHash: call.effectCleanupReturnHash,
    cleanupReturnReferenceRoot: call.effectCleanupReturnReferenceRoot,
    cleanupReturnReferencePath: call.effectCleanupReturnReferencePath,
    cleanupReturnReferenceMemberPath: call.effectCleanupReturnReferenceMemberPath,
    cleanupReturnOptionalReference: call.effectCleanupReturnOptionalReference,
    cleanupReturnOptionalReferenceSegments: call.effectCleanupReturnOptionalReferenceSegments,
    cleanupReturnOptionalReferenceSegmentIndexes: call.effectCleanupReturnOptionalReferenceSegmentIndexes,
    cleanupReturnOptionalNullishBoundaryCount: call.effectCleanupReturnOptionalNullishBoundaryCount,
    dynamicCleanupReturnKind: call.effectDynamicCleanupReturnKind,
    dynamicCleanupReturnBlockerReasonCode: call.effectDynamicCleanupReturnBlockerReasonCode,
    cleanupReturnPresent: call.effectCleanupReturnPresent,
    runtimeEquivalenceClaim: call.effectRuntimeEquivalenceClaim,
    signatureHash: call.effectSignatureHash
  });
}
function jsxHookEffectReasonCodes(records = []) {
  if (!records.length) return [];
  const hasStaticCallback = records.some((record) => record.proofStatus === 'static-effect-callback-source-evidence');
  const hasStaticCleanup = records.some((record) => record.cleanupProofStatus === 'static-effect-cleanup-source-evidence');
  const hasDynamic = records.some((record) => record.proofStatus === 'dynamic-effect-callback-unsupported' || record.cleanupProofStatus === 'dynamic-effect-cleanup-unsupported');
  return [
    hasStaticCallback ? 'jsx-render-hook-effect-static-callback-evidence' : undefined,
    records.some((record) => record.callbackOptionalReference) ? 'jsx-render-hook-effect-static-optional-callback-evidence' : undefined,
    hasStaticCleanup ? 'jsx-render-hook-effect-static-cleanup-evidence' : undefined,
    records.some((record) => record.cleanupReturnOptionalReference) ? 'jsx-render-hook-effect-static-optional-cleanup-evidence' : undefined,
    records.some((record) => record.runtimeEquivalenceClaim === false) ? 'jsx-render-hook-effect-runtime-equivalence-unproved' : undefined,
    hasDynamic ? 'jsx-render-hook-effect-unsupported' : undefined,
    ...records.map((record) => record.dynamicCallbackBlockerReasonCode),
    ...records.map((record) => record.dynamicCleanupReturnBlockerReasonCode)
  ];
}
function contextConsumerRecord(call, contextProviderAncestors = []) {
  const proofStatus = call.contextConsumerProofStatus ?? (call.contextConsumerDynamicTarget
    ? 'dynamic-context-target-unsupported'
    : 'static-context-target-evidence');
  const provider = nearestContextProvider(contextProviderAncestors, call.contextName);
  const lookupHash = provider ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxContextProviderLookup',
    contextName: call.contextName,
    tagName: provider.tagName,
    depth: provider.depth
  }) : undefined;
  const signatureHash = provider ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxContextConsumerWithProviderLookup',
    baseSignatureHash: call.contextConsumerSignatureHash,
    contextName: call.contextName,
    provider
  }) : call.contextConsumerSignatureHash;
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
    contextProviderLookupStatus: provider ? 'static-provider-ancestor-evidence' : undefined,
    contextProviderLookupName: provider?.contextName,
    contextProviderLookupTagName: provider?.tagName,
    contextProviderLookupDepth: provider?.depth,
    contextProviderLookupHash: lookupHash,
    signatureHash,
    proofStatus,
    dynamicTargetKind: call.contextTargetDynamicKind,
    dynamicBlockerReasonCode: call.contextTargetDynamicBlockerReasonCode,
    dynamicTarget: call.contextConsumerDynamicTarget
  });
}
function nearestContextProvider(providers = [], contextName) {
  if (!contextName) return undefined;
  const index = providers.map((provider, depth) => ({ ...provider, depth: depth + 1 })).reverse()
    .find((provider) => provider.contextName === contextName);
  return index ? compactRecord(index) : undefined;
}
function jsxContextConsumerReasonCodes(records = []) {
  if (!records.length) return [];
  const hasStatic = records.some((record) => record.proofStatus === 'static-context-target-evidence'); const hasStaticOptional = records.some((record) => record.proofStatus === 'static-optional-context-target-evidence' || record.optionalReference); const hasDynamic = records.some((record) => record.dynamicTarget);
  const hasProviderLookup = records.some((record) => record.contextProviderLookupStatus === 'static-provider-ancestor-evidence'); const hasComponentLookup = records.some((record) => record.contextProviderLookupStatus === 'static-same-file-component-provider-evidence');
  const hasComponentFlow = records.some((record) => record.contextProviderLookupStatus === 'static-same-file-component-provider-flow-evidence');
  const hasProjectComponentLookup = records.some((record) => record.contextProviderLookupStatus === 'static-project-import-component-provider-evidence');
  const hasProjectComponentFlow = records.some((record) => record.contextProviderLookupStatus === 'static-project-import-component-provider-flow-evidence');
  const hasUnsupportedComponentTarget = records.some((record) => record.componentCallLookupStatus === 'component-target-unsupported');
  return uniqueStrings([hasStatic ? 'jsx-render-context-consumer-target-static-evidence' : undefined, hasStaticOptional ? 'jsx-render-context-consumer-target-static-optional-reference-evidence' : undefined, hasProviderLookup ? 'jsx-render-context-consumer-provider-lookup-static-evidence' : undefined, hasComponentLookup ? 'jsx-render-context-consumer-provider-component-lookup-static-evidence' : undefined, hasComponentFlow ? 'jsx-render-context-consumer-provider-component-flow-static-evidence' : undefined, hasProjectComponentLookup ? 'jsx-render-context-consumer-provider-project-component-lookup-static-evidence' : undefined, hasProjectComponentFlow ? 'jsx-render-context-consumer-provider-project-component-flow-static-evidence' : undefined, hasUnsupportedComponentTarget ? 'jsx-render-context-consumer-provider-component-target-unsupported' : undefined, hasDynamic ? 'jsx-render-context-consumer-target-unsupported' : undefined, hasDynamic ? 'jsx-render-context-consumer-dynamic-target-unsupported' : undefined, ...records.map((record) => record.dynamicBlockerReasonCode)]);
}
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
export { jsxRenderRiskEvidence };
