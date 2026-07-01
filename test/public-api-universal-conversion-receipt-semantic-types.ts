import { createUniversalConversionRouteEvidenceReceipt } from '../src/index.js';
import type { UniversalConversionArtifacts, UniversalConversionRouteEvidenceReceipt } from '../src/index.js';

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
semanticReceipt.transformTargetLanguages satisfies readonly string[];
semanticReceipt.targetPortabilityStatuses satisfies readonly string[];
semanticReceipt.summary.semanticEdit.semanticEditScriptIds satisfies Readonly<Record<string, number>>;
semanticReceipt.summary.semanticEdit.semanticEditReplayOutputHashes satisfies Readonly<Record<string, number>>;
semanticReceipt.metadata.semanticEditEvidenceRequired satisfies boolean;

declare const semanticArtifacts: UniversalConversionArtifacts;
semanticArtifacts.summary.compactCounts.semanticEdit.semanticEditScriptIds satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.semanticEdit.sourceBackprojectionModes satisfies Readonly<Record<string, number>>;
semanticArtifacts.summary.compactCounts.evidenceReceipts.semanticEdit.semanticEditReplayStatuses satisfies Readonly<Record<string, number>>;
