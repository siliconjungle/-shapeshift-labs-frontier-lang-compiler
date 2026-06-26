import type { SourceSpan } from '@shapeshift-labs/frontier-lang-kernel';

export type NativeProjectSymbolGraphJsxPropKind = 'named' | 'spread' | string;
export type NativeProjectSymbolGraphJsxRenderRiskKind =
  | 'context-provider-boundary'
  | 'context-provider-value-boundary'
  | 'context-provider-nesting'
  | 'hook-owner-render-scope'
  | 'hook-call-order-boundary'
  | 'hook-dependency-boundary'
  | 'hook-effect-boundary'
  | 'context-consumer-boundary'
  | 'render-return-boundary'
  | 'render-return-branch-control-flow'
  | 'component-wrapper-boundary'
  | 'event-handler-prop-boundary'
  | string;
export type NativeProjectSymbolGraphJsxRenderRiskReason =
  | 'jsx-render-context-provider-boundary'
  | 'jsx-render-context-provider-value-literal-evidence'
  | 'jsx-render-context-provider-value-static-reference-evidence'
  | 'jsx-render-context-provider-value-static-data-evidence'
  | 'jsx-render-context-provider-value-unsupported'
  | 'jsx-render-context-provider-nesting-unsupported'
  | 'jsx-render-public-owner-hooks'
  | 'jsx-render-hook-call-order-unsupported'
  | 'jsx-render-hook-dependency-array-static-evidence'
  | 'jsx-render-hook-dependency-array-unsupported'
  | 'jsx-render-hook-effect-static-callback-evidence'
  | 'jsx-render-hook-effect-static-cleanup-evidence'
  | 'jsx-render-hook-effect-runtime-equivalence-unproved'
  | 'jsx-render-hook-effect-unsupported'
  | 'jsx-render-context-consumer-target-static-evidence'
  | 'jsx-render-context-consumer-provider-lookup-static-evidence'
  | 'jsx-render-context-consumer-provider-component-lookup-static-evidence'
  | 'jsx-render-context-consumer-provider-component-flow-static-evidence'
  | 'jsx-render-context-consumer-provider-project-component-lookup-static-evidence'
  | 'jsx-render-context-consumer-provider-project-component-flow-static-evidence'
  | 'jsx-render-context-consumer-provider-component-target-unsupported'
  | 'jsx-render-context-consumer-target-unsupported'
  | 'jsx-render-context-consumer-dynamic-target-unsupported'
  | 'jsx-render-return-static-evidence'
  | 'jsx-render-return-implicit-arrow-static-evidence'
  | 'jsx-render-return-conditional-branch-static-evidence'
  | 'jsx-render-return-logical-branch-static-evidence'
  | 'jsx-render-return-array-static-evidence'
  | 'jsx-render-return-branch-unsupported'
  | 'jsx-render-component-wrapper-static-evidence'
  | 'jsx-render-component-wrapper-render-equivalence-unproved'
  | 'jsx-render-component-wrapper-lazy-boundary-evidence'
  | 'jsx-render-component-wrapper-lazy-runtime-equivalence-unproved'
  | 'jsx-render-event-handler-prop-static-evidence'
  | 'jsx-render-event-handler-prop-static-inline-evidence'
  | 'jsx-render-event-handler-local-declaration-evidence'
  | 'jsx-render-event-handler-prop-unsupported'
  | string;
export type NativeProjectSymbolGraphJsxFragmentKind = 'fragment' | 'shorthand-fragment' | string;
export interface NativeProjectSymbolGraphJsxHookDependencyRecord {
  readonly hookName?: string;
  readonly ordinal?: number;
  readonly dependencyCount?: number;
  readonly dependencyTexts?: readonly string[];
  readonly dependencyRecords?: readonly { readonly ordinal?: number; readonly proofStatus?: string; readonly reasonCode?: string; readonly valueKind?: string; readonly dependencyText?: string; readonly referenceRoot?: string; readonly referencePath?: readonly string[]; readonly optionalReference?: boolean; readonly optionalReferenceSegments?: readonly string[]; readonly optionalReferenceSegmentIndexes?: readonly number[]; readonly optionalNullishBoundaryCount?: number; readonly dynamicDependencyKind?: string; readonly dynamicBlockerReasonCode?: string; readonly signatureHash?: string; }[];
  readonly proofStatus?: 'static-dependency-array-evidence' | 'dynamic-dependency-array-unsupported' | string;
  readonly dynamicDependencyTexts?: readonly string[]; readonly dynamicDependencyReasonCodes?: readonly string[];
  readonly dependencyArrayHash?: string;
  readonly dependencySignatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxEventHandlerPropRecord {
  readonly propName: string;
  readonly ordinal?: number;
  readonly propKind?: NativeProjectSymbolGraphJsxPropKind;
  readonly proofStatus?: 'static-event-handler-reference-evidence' | 'static-optional-event-handler-reference-evidence' | 'static-inline-event-handler-evidence' | 'dynamic-event-handler-unsupported' | string;
  readonly reasonCode?: string; readonly handlerReferenceText?: string; readonly handlerReferenceRoot?: string; readonly handlerReferencePath?: readonly string[]; readonly optionalReference?: boolean; readonly optionalReferenceSegments?: readonly string[]; readonly optionalReferenceSegmentIndexes?: readonly number[]; readonly optionalNullishBoundaryCount?: number;
  readonly handlerDeclarationKind?: 'function' | 'function-expression' | 'arrow-function' | string;
  readonly handlerDeclarationName?: string;
  readonly handlerDeclarationOwnerName?: string;
  readonly handlerDeclarationHash?: string;
  readonly inlineHandlerText?: string;
  readonly inlineHandlerExpressionHash?: string;
  readonly dynamicExpressionText?: string; readonly dynamicExpressionKind?: string; readonly dynamicBlockerReasonCode?: string;
  readonly expressionHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxHookEffectRecord {
  readonly hookName?: string;
  readonly ordinal?: number;
  readonly proofStatus?: 'static-effect-callback-source-evidence' | 'dynamic-effect-callback-unsupported' | string;
  readonly callbackKind?: 'arrow-function' | 'function-expression' | 'reference' | string;
  readonly callbackText?: string;
  readonly dynamicCallbackText?: string; readonly callbackReferenceRoot?: string; readonly callbackReferencePath?: readonly string[]; readonly callbackReferenceMemberPath?: readonly string[]; readonly callbackOptionalReference?: boolean; readonly callbackOptionalReferenceSegments?: readonly string[]; readonly callbackOptionalReferenceSegmentIndexes?: readonly number[]; readonly callbackOptionalNullishBoundaryCount?: number; readonly dynamicCallbackKind?: string; readonly dynamicCallbackBlockerReasonCode?: string;
  readonly callbackHash?: string;
  readonly cleanupProofStatus?: 'static-effect-cleanup-source-evidence' | 'dynamic-effect-cleanup-unsupported' | string;
  readonly cleanupReturnKind?: 'arrow-function' | 'function-expression' | 'reference' | string;
  readonly cleanupReturnText?: string;
  readonly dynamicCleanupReturnText?: string; readonly cleanupReturnReferenceRoot?: string; readonly cleanupReturnReferencePath?: readonly string[]; readonly cleanupReturnReferenceMemberPath?: readonly string[]; readonly cleanupReturnOptionalReference?: boolean; readonly cleanupReturnOptionalReferenceSegments?: readonly string[]; readonly cleanupReturnOptionalReferenceSegmentIndexes?: readonly number[]; readonly cleanupReturnOptionalNullishBoundaryCount?: number; readonly dynamicCleanupReturnKind?: string; readonly dynamicCleanupReturnBlockerReasonCode?: string;
  readonly cleanupReturnHash?: string;
  readonly cleanupReturnPresent?: boolean;
  readonly runtimeEquivalenceClaim?: false | boolean;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxContextConsumerRecord {
  readonly hookName?: 'useContext' | string;
  readonly ordinal?: number;
  readonly contextName?: string;
  readonly contextExpressionText?: string;
  readonly contextExpressionHash?: string; readonly contextTargetKind?: 'reference' | 'optional-reference' | 'dynamic-expression' | string; readonly contextTargetReasonCode?: string; readonly contextTargetReferenceRoot?: string; readonly contextTargetReferencePath?: readonly string[]; readonly contextTargetReferenceMemberPath?: readonly string[]; readonly optionalReference?: boolean; readonly optionalReferenceSegments?: readonly string[]; readonly optionalReferenceSegmentIndexes?: readonly number[]; readonly optionalNullishBoundaryCount?: number; readonly dynamicTargetKind?: string; readonly dynamicBlockerReasonCode?: string;
  readonly contextProviderLookupStatus?: 'static-provider-ancestor-evidence' | 'static-same-file-component-provider-evidence' | 'static-same-file-component-provider-flow-evidence' | 'static-project-import-component-provider-evidence' | 'static-project-import-component-provider-flow-evidence' | string;
  readonly contextProviderLookupScope?: 'lexical-provider-ancestor' | 'same-file-direct-component' | 'same-file-member-component' | 'same-file-component-children-flow' | 'same-file-member-component-children-flow' | 'project-import-direct-component' | 'project-import-reexport-component' | 'project-import-member-component' | 'project-import-reexport-member-component' | 'project-import-component-children-flow' | 'project-import-reexport-component-children-flow' | 'project-import-member-component-children-flow' | 'project-import-reexport-member-component-children-flow' | string;
  readonly contextProviderLookupName?: string; readonly contextProviderLookupTagName?: string; readonly contextProviderLookupDepth?: number; readonly contextProviderLookupHash?: string;
  readonly componentCallLookupStatus?: 'same-file-component-target-evidence' | 'same-file-member-component-target-evidence' | 'project-import-component-target-evidence' | 'project-import-reexport-component-target-evidence' | 'project-import-member-component-target-evidence' | 'project-import-reexport-member-component-target-evidence' | 'component-target-unsupported' | string;
  readonly componentCallTagName?: string; readonly componentCallTargetName?: string; readonly componentCallTargetOwnerName?: string; readonly componentCallTargetSourcePath?: string; readonly componentCallImportEdgeId?: string;
  readonly componentCallImportKind?: 'named' | 'default' | string;
  readonly componentCallImportedName?: string; readonly componentCallLocalName?: string;
  readonly componentCallMemberObjectName?: string; readonly componentCallMemberPropertyName?: string; readonly componentCallMemberLocalName?: string; readonly componentCallMemberBindingKind?: 'const' | 'let' | 'var' | string; readonly componentCallMemberBindingHash?: string;
  readonly componentCallTargetExportName?: string;
  readonly componentCallReExportEdgeId?: string;
  readonly componentCallReExportSourcePath?: string;
  readonly componentCallReExportExportedName?: string;
  readonly componentCallReExportLocalName?: string;
  readonly componentCallReExportTargetSourcePath?: string;
  readonly componentCallReExportKind?: 'named' | 'export-star' | string;
  readonly componentCallReExportIdentityId?: string;
  readonly componentCallLookupHash?: string;
  readonly componentProviderFlowStatus?: 'static-provider-children-flow-evidence' | string;
  readonly componentProviderFlowOwnerName?: string;
  readonly componentProviderFlowHash?: string;
  readonly componentCallUnsupportedReasonCodes?: readonly string[];
  readonly contextProviderPath?: readonly string[];
  readonly signatureHash?: string;
  readonly proofStatus?: 'static-context-target-evidence' | 'static-optional-context-target-evidence' | 'dynamic-context-target-unsupported' | string;
  readonly dynamicTarget?: boolean;
}

export interface NativeProjectSymbolGraphJsxContextValueRecord {
  readonly propName: 'value' | string;
  readonly propKind?: NativeProjectSymbolGraphJsxPropKind;
  readonly proofStatus?: 'literal-context-value-evidence' | 'static-reference-context-value-evidence' | 'static-data-context-value-evidence' | 'dynamic-context-value-unsupported' | string;
  readonly literalValueKind?: 'string' | 'number' | 'boolean' | 'null' | 'undefined' | string;
  readonly literalValueText?: string;
  readonly staticValueKind?: 'reference' | 'object' | 'array' | string;
  readonly staticValueText?: string; readonly staticReferenceRoot?: string; readonly staticReferencePath?: readonly string[]; readonly staticReferenceMemberPath?: readonly string[]; readonly optionalReference?: boolean; readonly optionalReferenceSegments?: readonly string[]; readonly optionalReferenceSegmentIndexes?: readonly number[]; readonly optionalNullishBoundaryCount?: number; readonly referenceBindingStatus?: string; readonly referenceBindingScope?: string; readonly referenceBindingHash?: string;
  readonly expressionHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxRenderReturnRecord {
  readonly ordinal?: number;
  readonly proofStatus?: 'static-render-return-evidence' | string;
  readonly returnKind?: 'return-statement' | 'implicit-arrow-expression' | string;
  readonly branchControlKind?: 'return-statement' | 'conditional-expression' | 'logical-expression' | string;
  readonly expressionText?: string;
  readonly expressionHash?: string;
  readonly conditionalBranchRecord?: NativeProjectSymbolGraphJsxConditionalBranchRecord;
  readonly logicalBranchRecord?: NativeProjectSymbolGraphJsxLogicalBranchRecord;
  readonly collectionRecord?: NativeProjectSymbolGraphJsxRenderCollectionRecord;
  readonly ifConditionText?: string;
  readonly ifConditionHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxRenderCollectionRecord {
  readonly proofStatus?: 'static-render-return-array-evidence' | string;
  readonly collectionKind?: 'array-literal' | string;
  readonly itemCount?: number;
  readonly itemExpressionTexts?: readonly string[];
  readonly itemRecords?: readonly NativeProjectSymbolGraphJsxRenderCollectionItemRecord[];
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxRenderCollectionItemRecord {
  readonly ordinal?: number;
  readonly expressionText?: string;
  readonly expressionHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxConditionalBranchRecord {
  readonly proofStatus?: 'static-conditional-render-branch-evidence' | string;
  readonly conditionText?: string;
  readonly consequentText?: string;
  readonly alternateText?: string;
  readonly conditionHash?: string;
  readonly consequentHash?: string;
  readonly alternateHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxLogicalBranchRecord {
  readonly proofStatus?: 'static-logical-render-branch-evidence' | string;
  readonly operator?: '&&' | '||' | string;
  readonly leftText?: string;
  readonly rightText?: string;
  readonly leftHash?: string;
  readonly rightHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxComponentWrapperRecord {
  readonly ordinal?: number;
  readonly proofStatus?: 'static-component-wrapper-evidence' | string;
  readonly reasonCode?: 'jsx-render-component-wrapper-static-evidence' | string;
  readonly wrapperName?: 'memo' | 'forwardRef' | 'observer' | 'lazy' | string;
  readonly wrapperCalleeText?: string;
  readonly wrapperExpressionText?: string;
  readonly wrapperArgumentKind?: 'function-expression' | 'class-expression' | 'wrapper-call' | 'arrow-function' | 'reference' | 'lazy-import-factory' | 'unknown' | string;
  readonly innerComponentName?: string;
  readonly ownerName?: string;
  readonly lazyImportFactory?: boolean;
  readonly lazyImportSpecifier?: string;
  readonly lazyLoadEquivalenceClaim?: false | boolean;
  readonly renderEquivalenceClaim?: false | boolean;
  readonly runtimeEquivalenceClaim?: false | boolean;
  readonly wrapperExpressionHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxElementRecord {
  readonly id: string;
  readonly tagName: string;
  readonly tagKey?: string;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly start?: number;
  readonly end?: number;
  readonly ordinal?: number;
  readonly propNames?: readonly string[];
  readonly propKinds?: readonly NativeProjectSymbolGraphJsxPropKind[];
  readonly propCount?: number;
  readonly spreadPropCount?: number;
  readonly keyedChild?: boolean;
  readonly keyPropName?: string;
  readonly keyPropValue?: string;
  readonly keyPropText?: string;
  readonly keyPropHash?: string;
  readonly fragmentKind?: NativeProjectSymbolGraphJsxFragmentKind;
  readonly component?: boolean;
  readonly publicContract?: boolean;
  readonly publicOwnerName?: string;
  readonly renderRiskKinds?: readonly NativeProjectSymbolGraphJsxRenderRiskKind[];
  readonly renderRiskReasonCodes?: readonly NativeProjectSymbolGraphJsxRenderRiskReason[];
  readonly contextBoundaryKind?: 'context-provider' | string;
  readonly contextName?: string;
  readonly contextValuePropName?: string;
  readonly contextValueExpressionHash?: string;
  readonly contextValueSignatureHash?: string;
  readonly contextValueRecord?: NativeProjectSymbolGraphJsxContextValueRecord;
  readonly contextProviderPath?: readonly string[];
  readonly contextProviderAncestorTags?: readonly string[];
  readonly contextProviderAncestorCount?: number;
  readonly contextProviderNestingSignatureHash?: string;
  readonly hookNames?: readonly string[];
  readonly hookCallOrder?: readonly string[];
  readonly hookCallCount?: number;
  readonly hookCallOrderSignatureHash?: string;
  readonly hookDependencyRecords?: readonly NativeProjectSymbolGraphJsxHookDependencyRecord[];
  readonly hookDependencyCount?: number;
  readonly hookDependencySignatureHash?: string;
  readonly hookEffectRecords?: readonly NativeProjectSymbolGraphJsxHookEffectRecord[];
  readonly hookEffectCount?: number;
  readonly hookEffectSignatureHash?: string;
  readonly contextConsumerNames?: readonly string[];
  readonly contextConsumerRecords?: readonly NativeProjectSymbolGraphJsxContextConsumerRecord[];
  readonly contextConsumerCount?: number;
  readonly contextConsumerSignatureHash?: string;
  readonly renderReturnRecords?: readonly NativeProjectSymbolGraphJsxRenderReturnRecord[];
  readonly renderReturnCount?: number;
  readonly renderReturnBranchCount?: number;
  readonly renderReturnSignatureHash?: string;
  readonly componentWrapperNames?: readonly string[];
  readonly componentWrapperCalleeTexts?: readonly string[];
  readonly componentWrapperRecords?: readonly NativeProjectSymbolGraphJsxComponentWrapperRecord[];
  readonly componentWrapperCount?: number;
  readonly componentWrapperLazyBoundaryCount?: number;
  readonly componentWrapperRenderEquivalenceClaim?: false | boolean;
  readonly componentWrapperLazyLoadEquivalenceClaim?: false | boolean;
  readonly componentWrapperSignatureHash?: string;
  readonly eventHandlerPropNames?: readonly string[];
  readonly eventHandlerPropRecords?: readonly NativeProjectSymbolGraphJsxEventHandlerPropRecord[];
  readonly eventHandlerPropCount?: number;
  readonly eventHandlerSignatureHash?: string;
  readonly renderRiskSignatureHash?: string;
  readonly childOrderSignatureHash?: string;
  readonly signatureHash?: string;
}

export interface NativeProjectSymbolGraphJsxPropRecord {
  readonly id: string;
  readonly elementId?: string;
  readonly tagName: string;
  readonly tagKey?: string;
  readonly propName: string;
  readonly propKind?: NativeProjectSymbolGraphJsxPropKind;
  readonly sourcePath?: string;
  readonly sourceHash?: string;
  readonly sourceSpan?: SourceSpan;
  readonly start?: number;
  readonly end?: number;
  readonly ordinal?: number;
  readonly spread?: boolean;
  readonly spreadOrdinal?: number;
  readonly spreadExpressionHash?: string;
  readonly publicContract?: boolean;
  readonly publicOwnerName?: string;
  readonly keyProp?: boolean;
  readonly propValueProofStatus?: string; readonly propValueReasonCode?: string; readonly propValueKind?: string; readonly propValueText?: string; readonly propValueExpressionText?: string; readonly propValueReferenceRoot?: string; readonly propValueReferencePath?: readonly string[]; readonly propValueOptionalReference?: boolean; readonly propValueOptionalReferenceSegments?: readonly string[]; readonly propValueOptionalReferenceSegmentIndexes?: readonly number[]; readonly propValueOptionalNullishBoundaryCount?: number; readonly propValueDynamicText?: string; readonly propValueDynamicBlockerReasonCode?: string; readonly propValueExpressionHash?: string; readonly propValueSignatureHash?: string;
  readonly componentPropRenderFlowStatus?: string; readonly componentPropRenderFlowReasonCode?: string; readonly componentPropRenderFlowClaim?: boolean; readonly componentPropRenderFlowClaimScope?: string; readonly componentPropRenderFlowRenderEquivalenceClaim?: false | boolean; readonly componentPropRenderFlowScope?: string; readonly componentPropRenderFlowTargetName?: string; readonly componentPropRenderFlowTargetKind?: string; readonly componentPropRenderFlowTargetOwnerName?: string; readonly componentPropRenderFlowTargetOwnerCount?: number; readonly componentPropRenderFlowTargetSourcePath?: string; readonly componentPropRenderFlowTargetLookupStatus?: string; readonly componentPropRenderFlowTargetLookupScope?: string; readonly componentPropRenderFlowImportEdgeId?: string; readonly componentPropRenderFlowImportKind?: string; readonly componentPropRenderFlowImportedName?: string; readonly componentPropRenderFlowLocalName?: string; readonly componentPropRenderFlowTargetExportName?: string; readonly componentPropRenderFlowReExportEdgeId?: string; readonly componentPropRenderFlowReExportSourcePath?: string; readonly componentPropRenderFlowReExportExportedName?: string; readonly componentPropRenderFlowReExportLocalName?: string; readonly componentPropRenderFlowReExportTargetSourcePath?: string; readonly componentPropRenderFlowReExportKind?: string; readonly componentPropRenderFlowReExportIdentityId?: string; readonly componentPropRenderFlowTargetLookupHash?: string; readonly componentPropRenderFlowMemberObjectName?: string; readonly componentPropRenderFlowMemberPropertyName?: string; readonly componentPropRenderFlowMemberLocalName?: string; readonly componentPropRenderFlowMemberBindingKind?: string; readonly componentPropRenderFlowMemberBindingHash?: string; readonly componentPropRenderFlowComponentPropName?: string; readonly componentPropRenderFlowRenderedTagName?: string; readonly componentPropRenderFlowRenderedPropName?: string; readonly componentPropRenderFlowPassthroughExpressionText?: string; readonly componentPropRenderFlowBindingKind?: string; readonly componentPropRenderFlowReturnOrdinal?: number; readonly componentPropRenderFlowDynamicBlockerReasonCode?: string; readonly componentPropRenderFlowTargetSignatureHash?: string; readonly componentPropRenderFlowSignatureHash?: string;
  readonly signatureHash?: string;
}
