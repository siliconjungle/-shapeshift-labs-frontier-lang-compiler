import { createUniversalConversionRouteEvidenceReceipt } from '../src/index.js';
import type { UniversalConversionArtifactQuery, UniversalConversionArtifacts, UniversalConversionRouteEvidenceReceipt } from '../src/index.js';

const semanticReceipt: UniversalConversionRouteEvidenceReceipt = createUniversalConversionRouteEvidenceReceipt({
  id: 'conversion_javascript_to_typescript_semantic_type',
  sourceLanguage: 'javascript',
  languageIds: ['javascript'],
  target: 'typescript',
  mode: 'preserve-source',
  readiness: 'ready',
  admissionAction: 'admit',
  mergeRefs: {
    planId: 'semantic_type_plan',
    routeId: 'conversion_javascript_to_typescript_semantic_type',
    historyIds: [],
    patchBundleIds: [],
    patchIds: [],
    mergeCandidateIds: [],
    replayLinks: [],
    evidenceIds: [],
    proofIds: [],
    sources: [],
    semanticOwnershipKeys: [],
    conflictKeys: [],
    sourceMapIds: [],
    sourceMapMappingIds: [],
    sourceMapLinkIds: [],
    readiness: 'ready',
    admissionStatus: 'admit',
    metadata: {}
  },
  metadata: {
    semanticSidecarQuality: {
      schema: 'frontier.lang.semanticSidecarQuality.v1',
      imported: true,
      eligible: false,
      counts: { symbols: 1, ownershipRegions: 1, patchHints: 0 },
      warnings: [{ code: 'missing-patch-hints' }]
    },
    semanticTransformIdentity: {
      id: 'semantic_transform_type',
      transformKey: 'semantic-transform:javascript->typescript:type',
      sourceLanguage: 'javascript',
      targetLanguage: 'typescript',
      sourcePath: 'src/type.js',
      targetPath: 'src/type.ts',
      transformIdentityHash: 'transform_identity_hash_type',
      projectionIdentityHash: 'projection_identity_hash_type',
      transformContentHash: 'transform_content_hash_type',
      readiness: 'ready',
      evidenceIds: ['transform_evidence_type']
    },
    semanticEditAdmission: { status: 'ready', action: 'admit', readiness: 'ready' },
    semanticEditSummary: {
      scriptIds: ['script_type'],
      replayStatuses: ['accepted-clean'],
      replayOutputHashes: ['output_hash_type'],
      sourceBackprojectionModes: ['exact-source']
    }
  }
});

semanticReceipt.semanticEditScriptIds satisfies readonly string[];
semanticReceipt.semanticEditReplayStatuses satisfies readonly string[];
semanticReceipt.semanticEditAdmissionStatuses satisfies readonly string[];
semanticReceipt.semanticEditReplayOutputHashes satisfies readonly string[];
semanticReceipt.sourceBackprojectionModes satisfies readonly string[];
semanticReceipt.semanticTransformIds satisfies readonly string[];
semanticReceipt.semanticTransformKeys satisfies readonly string[];
semanticReceipt.semanticTransformIdentityHashes satisfies readonly string[];
semanticReceipt.semanticTransformContentHashes satisfies readonly string[];
semanticReceipt.projectionIdentityHashes satisfies readonly string[];
semanticReceipt.transformTargetLanguages satisfies readonly string[];
semanticReceipt.semanticTransformEvidenceIds satisfies readonly string[];
semanticReceipt.targetPortabilityStatuses satisfies readonly string[];
semanticReceipt.semanticEditSidecarQualityRecords satisfies number;
semanticReceipt.semanticEditSidecarSymbolCount satisfies number;
semanticReceipt.semanticEditSidecarOwnershipRegionCount satisfies number;
semanticReceipt.semanticEditSidecarPatchHintCount satisfies number;
semanticReceipt.semanticEditSidecarWarningCount satisfies number;
semanticReceipt.semanticEditSidecarZeroRecordWarningCount satisfies number;
semanticReceipt.semanticEditSidecarWarningCodes satisfies readonly string[];
semanticReceipt.semanticEditSidecarZeroRecordWarningCodes satisfies readonly string[];
semanticReceipt.summary.semanticEdit.semanticEditScriptIds satisfies Readonly<Record<string, number>>;
semanticReceipt.summary.semanticEdit.semanticTransformContentHashes satisfies Readonly<Record<string, number>>;
semanticReceipt.summary.semanticEdit.semanticEditReplayOutputHashes satisfies Readonly<Record<string, number>>;
semanticReceipt.summary.semanticEdit.semanticEditSidecarWarningCodes satisfies Readonly<Record<string, number>>;
semanticReceipt.metadata.semanticEditEvidenceRequired satisfies boolean;

declare const semanticArtifacts: UniversalConversionArtifacts;
semanticArtifacts.routeArtifacts[0]?.semanticTransformIds satisfies readonly string[] | undefined;
semanticArtifacts.routeArtifacts[0]?.semanticEditSidecarQualityRecords satisfies number | undefined;
semanticArtifacts.summary.compactCounts.semanticEdit.semanticEditScriptIds satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.semanticEdit.semanticTransformIds satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.semanticEdit.projectionIdentityHashes satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.semanticEdit.sourceBackprojectionModes satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.semanticEdit.semanticEditSidecarWarningCodes satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticEditReplayStatuses satisfies Readonly<Record<string, number>>;

const semanticArtifactQuery: UniversalConversionArtifactQuery = {
  semanticTransformId: 'semantic_transform_type',
  semanticTransformIdentityHash: 'transform_identity_hash_type',
  semanticEditSidecarWarningCode: 'missing-patch-hints',
  transformIdentityHashes: ['transform_identity_hash_type']
};
semanticArtifactQuery.semanticTransformId satisfies string | readonly string[] | boolean | undefined;
semanticArtifactQuery.semanticEditSidecarWarningCode satisfies string | readonly string[] | boolean | undefined;
