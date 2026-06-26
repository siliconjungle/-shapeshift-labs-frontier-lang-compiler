import * as compilerApi from '../src/index.js';

const typedJsxProjectSafeMerge = compilerApi.safeMergeJsTsProject({
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' },
  workerFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' },
  headFiles: { 'src/view.tsx': 'export function View() { return <button />; }\n' }
});

typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.tagName satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.propKinds satisfies
  readonly compilerApi.NativeProjectSymbolGraphJsxPropKind[] | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.spreadPropCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderRiskKinds satisfies
  readonly compilerApi.NativeProjectSymbolGraphJsxRenderRiskKind[] | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderRiskReasonCodes satisfies
  readonly compilerApi.NativeProjectSymbolGraphJsxRenderRiskReason[] | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.keyedChild satisfies boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.keyPropValue satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.keyPropHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.fragmentKind satisfies
  compilerApi.NativeProjectSymbolGraphJsxFragmentKind | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextProviderPath?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextProviderAncestorTags?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextProviderAncestorCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextProviderNestingSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValuePropName satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueExpressionHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord satisfies
  compilerApi.NativeProjectSymbolGraphJsxContextValueRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.proofStatus satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.literalValueKind satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.literalValueText satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.staticValueKind satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.staticValueText satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.optionalReference satisfies boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.optionalReferenceSegments?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.optionalReferenceSegmentIndexes?.[0] satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextValueRecord?.optionalNullishBoundaryCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookNames?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookCallOrder?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookCallCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookCallOrderSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxHookDependencyRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dependencyTexts?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dependencyRecords?.[0]?.valueKind satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dependencyRecords?.[0]?.optionalReferenceSegments?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dependencyRecords?.[0]?.dynamicBlockerReasonCode satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.proofStatus satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dynamicDependencyTexts?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyRecords?.[0]?.dynamicDependencyReasonCodes?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencyCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookDependencySignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxHookEffectRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.proofStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.callbackKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.callbackText satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.dynamicCallbackText satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.callbackReferencePath?.[0] satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.callbackOptionalReference satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.dynamicCallbackBlockerReasonCode satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.callbackHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.cleanupProofStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.cleanupReturnKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.cleanupReturnText satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.dynamicCleanupReturnText satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.dynamicCleanupReturnBlockerReasonCode satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectRecords?.[0]?.runtimeEquivalenceClaim satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.hookEffectSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxContextConsumerRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.proofStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextTargetKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextTargetReferencePath?.[0] satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.optionalReference satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.dynamicBlockerReasonCode satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupTagName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupDepth satisfies
  number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupHash satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.contextProviderLookupScope satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallLookupStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallTargetName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallTargetSourcePath satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallImportEdgeId satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallImportKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallImportedName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallLocalName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallMemberObjectName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallMemberBindingHash satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallTargetExportName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportEdgeId satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportSourcePath satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportExportedName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportLocalName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportTargetSourcePath satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallReExportIdentityId satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentProviderFlowStatus satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentProviderFlowOwnerName satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentProviderFlowHash satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerRecords?.[0]?.componentCallUnsupportedReasonCodes?.[0] satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerNames?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.contextConsumerSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxRenderReturnRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.returnKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.branchControlKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.conditionalBranchRecord satisfies
  compilerApi.NativeProjectSymbolGraphJsxConditionalBranchRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.conditionalBranchRecord?.conditionText satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.logicalBranchRecord satisfies
  compilerApi.NativeProjectSymbolGraphJsxLogicalBranchRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.logicalBranchRecord?.operator satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.collectionRecord satisfies
  compilerApi.NativeProjectSymbolGraphJsxRenderCollectionRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnRecords?.[0]?.collectionRecord?.itemRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxRenderCollectionItemRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnBranchCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.renderReturnSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperNames?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperCalleeTexts?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxComponentWrapperRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0]?.wrapperArgumentKind satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0]?.lazyImportFactory satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0]?.lazyImportSpecifier satisfies
  string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0]?.lazyLoadEquivalenceClaim satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRecords?.[0]?.renderEquivalenceClaim satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperLazyBoundaryCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperRenderEquivalenceClaim satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperLazyLoadEquivalenceClaim satisfies
  boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.componentWrapperSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropNames?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0] satisfies
  compilerApi.NativeProjectSymbolGraphJsxEventHandlerPropRecord | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.proofStatus satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.handlerReferenceText satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.handlerReferencePath?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.optionalReferenceSegments?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.dynamicBlockerReasonCode satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.handlerDeclarationKind satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.handlerDeclarationHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.inlineHandlerText satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.inlineHandlerExpressionHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropRecords?.[0]?.dynamicExpressionText satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerPropCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.eventHandlerSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxElementRecords[0]?.childOrderSignatureHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propName satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propKind satisfies
  compilerApi.NativeProjectSymbolGraphJsxPropKind | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.spreadExpressionHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.keyProp satisfies boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propValueOptionalReference satisfies boolean | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propValueOptionalReferenceSegments?.[0] satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propValueOptionalReferenceSegmentIndexes?.[0] satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.propValueOptionalNullishBoundaryCount satisfies number | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowStatus satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowTargetLookupScope satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowImportEdgeId satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowReExportIdentityId satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowTargetLookupHash satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowMemberObjectName satisfies string | undefined;
typedJsxProjectSafeMerge.outputProjectSymbolGraph?.jsxPropRecords[0]?.componentPropRenderFlowMemberBindingHash satisfies string | undefined;

const typedProjectJsxSpreadPropKind: compilerApi.NativeProjectSymbolGraphJsxPropKind = 'spread';
const typedProjectJsxRenderRiskKind: compilerApi.NativeProjectSymbolGraphJsxRenderRiskKind = 'hook-effect-boundary';
const typedProjectJsxRenderRiskReason: compilerApi.NativeProjectSymbolGraphJsxRenderRiskReason =
  'jsx-render-context-consumer-provider-project-component-flow-static-evidence';
const typedProjectJsxFragmentKind: compilerApi.NativeProjectSymbolGraphJsxFragmentKind = 'shorthand-fragment';

void typedProjectJsxSpreadPropKind;
void typedProjectJsxRenderRiskKind;
void typedProjectJsxRenderRiskReason;
void typedProjectJsxFragmentKind;
