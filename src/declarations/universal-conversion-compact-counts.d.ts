export interface UniversalConversionRepresentationCompactCounts {
  readonly total: number;
  readonly byKind: Readonly<Record<string, number>>;
}

export interface UniversalConversionPlanRepresentationCompactCounts extends UniversalConversionRepresentationCompactCounts {
  readonly represented: number;
  readonly missing: number;
  readonly review: number;
  readonly blocked: number;
  readonly byStatus: Readonly<Record<string, number>>;
}

export interface UniversalConversionArtifactRepresentationCompactCounts extends UniversalConversionRepresentationCompactCounts {
  readonly routeArtifacts: number;
}

export interface UniversalConversionMissingConstructCompactCounts {
  readonly total: number;
  readonly byKind: Readonly<Record<string, number>>;
}

export interface UniversalConversionArtifactMissingConstructCompactCounts extends UniversalConversionMissingConstructCompactCounts {
  readonly routeArtifacts: number;
}

export interface UniversalConversionTranslationAdmissionCompactCounts {
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byAction: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
  readonly proofEvidenceIds: Readonly<Record<string, number>>;
  readonly runtimeReadiness: Readonly<Record<string, number>>;
  readonly dialectReadiness: Readonly<Record<string, number>>;
}

export interface UniversalConversionEvidenceReceiptCompactCounts {
  readonly routeArtifacts: number;
  readonly boundEvidence: number;
  readonly rejectedEvidence: number;
  readonly proofEvidence: number;
  readonly runtimeProofObligations: number;
  readonly runtimeProofByStatus: Readonly<Record<string, number>>;
  readonly runtimeProofByCapability: Readonly<Record<string, number>>;
  readonly runtimeProofMissingSignals: Readonly<Record<string, number>>;
  readonly runtimeProofProvidedSignals: Readonly<Record<string, number>>;
  readonly interlinguaConstraintObligations: number;
  readonly interlinguaConstraintByFamily: Readonly<Record<string, number>>;
  readonly interlinguaConstraintByStatus: Readonly<Record<string, number>>;
  readonly interlinguaConstraintActions: Readonly<Record<string, number>>;
  readonly interlinguaConstraintSourceIds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintEvidenceIds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintRequiredKinds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintRepresentedKinds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintMissingKinds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintMissingEvidence: Readonly<Record<string, number>>;
  readonly interlinguaConstraintObligationKinds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintObligationStatuses: Readonly<Record<string, number>>;
  readonly interlinguaConstraintObligationEvidenceIds: Readonly<Record<string, number>>;
  readonly interlinguaConstraintObligationMissingEvidence: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
  readonly proofEvidenceIds: Readonly<Record<string, number>>;
  readonly rejectedByReason: Readonly<Record<string, number>>;
}

export interface UniversalConversionRuntimeProofCompactCounts {
  readonly routeArtifacts: number;
  readonly obligations: number;
  readonly byCapability: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly requiredSignals: Readonly<Record<string, number>>;
  readonly providedSignals: Readonly<Record<string, number>>;
  readonly missingSignals: Readonly<Record<string, number>>;
  readonly receiptRecords: number;
  readonly receiptByStatus: Readonly<Record<string, number>>;
  readonly receiptMissingEvidence: Readonly<Record<string, number>>;
}

export interface UniversalConversionInterlinguaCompactCounts {
  readonly byLoweringDisposition: Readonly<Record<string, number>>;
  readonly layerKinds: Readonly<Record<string, number>>;
  readonly representedLayerKinds: Readonly<Record<string, number>>;
  readonly missingLayerKinds: Readonly<Record<string, number>>;
  readonly reviewLayerKinds: Readonly<Record<string, number>>;
  readonly blockedLayerKinds: Readonly<Record<string, number>>;
  readonly constraintFamilies: Readonly<Record<string, number>>;
  readonly constraintStatuses: Readonly<Record<string, number>>;
  readonly constraintActions: Readonly<Record<string, number>>;
  readonly constraintSourceIds: Readonly<Record<string, number>>;
  readonly constraintEvidenceIds: Readonly<Record<string, number>>;
  readonly constraintRequiredKinds: Readonly<Record<string, number>>;
  readonly constraintRepresentedKinds: Readonly<Record<string, number>>;
  readonly constraintMissingKinds: Readonly<Record<string, number>>;
  readonly constraintMissingEvidence: Readonly<Record<string, number>>;
  readonly constraintObligationKinds: Readonly<Record<string, number>>;
  readonly constraintObligationStatuses: Readonly<Record<string, number>>;
  readonly constraintObligationEvidenceIds: Readonly<Record<string, number>>;
  readonly constraintObligationMissingEvidence: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
  readonly proofEvidenceIds: Readonly<Record<string, number>>;
}

export interface UniversalConversionAdmissionRecordInterlinguaCompactCounts {
  readonly records: number;
  readonly recordIds: Readonly<Record<string, number>>;
  readonly byLoweringDisposition: Readonly<Record<string, number>>;
  readonly constraintFamilies: Readonly<Record<string, number>>;
  readonly constraintStatuses: Readonly<Record<string, number>>;
  readonly constraintActions: Readonly<Record<string, number>>;
  readonly constraintSourceIds: Readonly<Record<string, number>>;
  readonly constraintEvidenceIds: Readonly<Record<string, number>>;
  readonly constraintRequiredKinds: Readonly<Record<string, number>>;
  readonly constraintRepresentedKinds: Readonly<Record<string, number>>;
  readonly constraintMissingKinds: Readonly<Record<string, number>>;
  readonly constraintMissingEvidence: Readonly<Record<string, number>>;
  readonly constraintObligationKinds: Readonly<Record<string, number>>;
  readonly constraintObligationStatuses: Readonly<Record<string, number>>;
  readonly constraintObligationEvidenceIds: Readonly<Record<string, number>>;
  readonly constraintObligationMissingEvidence: Readonly<Record<string, number>>;
}

export interface UniversalConversionResourceTransferCompactCounts {
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byAction: Readonly<Record<string, number>>;
  readonly requiredKinds: Readonly<Record<string, number>>;
  readonly representedKinds: Readonly<Record<string, number>>;
  readonly missingKinds: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
  readonly losses: Readonly<Record<string, number>>;
  readonly ownershipConstraintStatuses: Readonly<Record<string, number>>;
  readonly ownershipConstraintMissingKinds: Readonly<Record<string, number>>;
  readonly ownershipConstraintMissingEvidence: Readonly<Record<string, number>>;
}

export interface UniversalConversionEffectConstraintCompactCounts {
  readonly byStatus: Readonly<Record<string, number>>;
  readonly byAction: Readonly<Record<string, number>>;
  readonly requiredKinds: Readonly<Record<string, number>>;
  readonly representedKinds: Readonly<Record<string, number>>;
  readonly missingKinds: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
}

export interface UniversalConversionLifetimeConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionControlFlowConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionCallableBoundaryConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionAdtPatternConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionBorrowScopeConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionBorrowCheckerConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionDataLayoutConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionConcurrencyModelConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionErrorModelConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionEvaluationModelConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionHostEnvironmentConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionMemoryModelConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionMetaprogrammingConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionScopeBindingConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionModuleConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionNumericSemanticsConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionTextSemanticsConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionCollectionSemanticsConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionSerializationSemanticsConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionDependencySemanticsConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionObjectModelConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionProtocolConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}
export interface UniversalConversionTypeConstraintCompactCounts extends UniversalConversionEffectConstraintCompactCounts {}

export interface UniversalConversionSemanticOperationInterlinguaCompactCounts extends UniversalConversionInterlinguaCompactCounts {
  readonly operations: number;
  readonly operationRecords: number;
}

export interface UniversalConversionPlanCompactCounts {
  readonly representationConstructs: UniversalConversionPlanRepresentationCompactCounts;
  readonly missingConstructs: UniversalConversionMissingConstructCompactCounts;
  readonly semanticEditReadiness: { readonly routes: Readonly<Record<string, number>> };
  readonly admissionStatuses: {
    readonly byAction: Readonly<Record<string, number>>;
    readonly byRouteStatus: Readonly<Record<string, number>>;
    readonly byRisk: Readonly<Record<string, number>>;
  };
  readonly translationAdmission: UniversalConversionTranslationAdmissionCompactCounts;
  readonly interlingua: UniversalConversionInterlinguaCompactCounts;
}

export interface UniversalConversionArtifactCompactCounts {
  readonly representationConstructs: UniversalConversionArtifactRepresentationCompactCounts;
  readonly missingConstructs: UniversalConversionArtifactMissingConstructCompactCounts;
  readonly semanticEditReadiness: {
    readonly routeArtifacts: Readonly<Record<string, number>>;
    readonly semanticOperations: Readonly<Record<string, number>>;
  };
  readonly admissionStatuses: {
    readonly byStatus: Readonly<Record<string, number>>;
    readonly byBucket: Readonly<Record<string, number>>;
    readonly byAction: Readonly<Record<string, number>>;
    readonly byRisk: Readonly<Record<string, number>>;
  };
  readonly translationAdmission: UniversalConversionTranslationAdmissionCompactCounts;
  readonly runtimeProof: UniversalConversionRuntimeProofCompactCounts;
  readonly resourceTransfer: UniversalConversionResourceTransferCompactCounts;
  readonly lifetimeConstraint: UniversalConversionLifetimeConstraintCompactCounts;
  readonly controlFlowConstraint: UniversalConversionControlFlowConstraintCompactCounts;
  readonly callableBoundaryConstraint: UniversalConversionCallableBoundaryConstraintCompactCounts;
  readonly adtPatternConstraint: UniversalConversionAdtPatternConstraintCompactCounts;
  readonly borrowScopeConstraint: UniversalConversionBorrowScopeConstraintCompactCounts;
  readonly borrowCheckerConstraint: UniversalConversionBorrowCheckerConstraintCompactCounts;
  readonly dataLayoutConstraint: UniversalConversionDataLayoutConstraintCompactCounts;
  readonly effectConstraint: UniversalConversionEffectConstraintCompactCounts;
  readonly concurrencyModelConstraint: UniversalConversionConcurrencyModelConstraintCompactCounts;
  readonly errorModelConstraint: UniversalConversionErrorModelConstraintCompactCounts;
  readonly evaluationModelConstraint: UniversalConversionEvaluationModelConstraintCompactCounts;
  readonly hostEnvironmentConstraint: UniversalConversionHostEnvironmentConstraintCompactCounts;
  readonly memoryModelConstraint: UniversalConversionMemoryModelConstraintCompactCounts;
  readonly metaprogrammingConstraint: UniversalConversionMetaprogrammingConstraintCompactCounts;
  readonly scopeBindingConstraint: UniversalConversionScopeBindingConstraintCompactCounts;
    readonly moduleConstraint: UniversalConversionModuleConstraintCompactCounts;
    readonly numericSemanticsConstraint: UniversalConversionNumericSemanticsConstraintCompactCounts;
    readonly textSemanticsConstraint: UniversalConversionTextSemanticsConstraintCompactCounts;
    readonly collectionSemanticsConstraint: UniversalConversionCollectionSemanticsConstraintCompactCounts;
    readonly serializationSemanticsConstraint: UniversalConversionSerializationSemanticsConstraintCompactCounts;
    readonly dependencySemanticsConstraint: UniversalConversionDependencySemanticsConstraintCompactCounts;
    readonly objectModelConstraint: UniversalConversionObjectModelConstraintCompactCounts;
    readonly protocolConstraint: UniversalConversionProtocolConstraintCompactCounts;
    readonly typeConstraint: UniversalConversionTypeConstraintCompactCounts;
  readonly evidenceReceipts: UniversalConversionEvidenceReceiptCompactCounts;
  readonly interlingua: UniversalConversionInterlinguaCompactCounts;
  readonly admissionRecordInterlingua: UniversalConversionAdmissionRecordInterlinguaCompactCounts;
  readonly semanticOperationInterlingua: UniversalConversionSemanticOperationInterlinguaCompactCounts;
}
