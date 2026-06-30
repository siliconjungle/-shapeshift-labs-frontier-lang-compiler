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

export interface UniversalConversionInterlinguaCompactCounts {
  readonly byLoweringDisposition: Readonly<Record<string, number>>;
  readonly layerKinds: Readonly<Record<string, number>>;
  readonly representedLayerKinds: Readonly<Record<string, number>>;
  readonly missingLayerKinds: Readonly<Record<string, number>>;
  readonly reviewLayerKinds: Readonly<Record<string, number>>;
  readonly blockedLayerKinds: Readonly<Record<string, number>>;
  readonly missingEvidence: Readonly<Record<string, number>>;
  readonly proofEvidenceIds: Readonly<Record<string, number>>;
}

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
  readonly interlingua: UniversalConversionInterlinguaCompactCounts;
  readonly semanticOperationInterlingua: UniversalConversionSemanticOperationInterlinguaCompactCounts;
}
