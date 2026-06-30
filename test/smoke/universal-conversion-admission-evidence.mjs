import { assert } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  queryUniversalConversionPlan
} from './compiler-api.mjs';

const unscopedProofPlan = createUniversalConversionPlan({
  generatedAt: 780,
  imports: [scannedJsImport],
  targets: ['javascript'],
  evidence: [{
    id: 'global_conversion_proof',
    kind: 'conversion-replay-proof',
    status: 'passed'
  }]
});
const unscopedProofRoute = queryUniversalConversionPlan(unscopedProofPlan, {
  sourceLanguage: 'javascript',
  target: 'javascript'
}).bestRoute;
assert.equal(unscopedProofRoute.mergeRefs.evidenceIds.includes('global_conversion_proof'), false);
assert.equal(unscopedProofRoute.missingEvidence.includes('proof-or-replay-evidence'), true);
assert.equal(unscopedProofRoute.representation.constructs.find((item) => item.kind === 'proof-evidence').status, 'review');

const scopedProofPlan = createUniversalConversionPlan({
  generatedAt: 781,
  imports: [scannedJsImport],
  targets: ['javascript'],
  evidence: [{
    id: 'scoped_conversion_proof',
    kind: 'conversion-replay-proof',
    status: 'passed',
    routeId: 'conversion_javascript_to_javascript',
    sourceLanguage: 'javascript',
    target: 'javascript'
  }]
});
const scopedProofRoute = queryUniversalConversionPlan(scopedProofPlan, {
  sourceLanguage: 'javascript',
  target: 'javascript'
}).bestRoute;
assert.equal(scopedProofRoute.mergeRefs.evidenceIds.includes('scoped_conversion_proof'), true);
assert.equal(scopedProofRoute.mergeRefs.proofIds.includes('scoped_conversion_proof'), true);
assert.equal(scopedProofRoute.missingEvidence.includes('proof-or-replay-evidence'), false);
assert.equal(scopedProofRoute.representation.constructs.find((item) => item.kind === 'proof-evidence').status, 'represented');
const scopedProofArtifact = createUniversalConversionArtifacts(scopedProofPlan, { generatedAt: 782 }).routeArtifacts.find((artifact) => artifact.routeId === scopedProofRoute.id);
assert.equal(scopedProofArtifact.admissionRecord.ids.evidenceIds.includes('scoped_conversion_proof'), true);
assert.equal(scopedProofArtifact.admissionRecord.ids.proofIds.includes('scoped_conversion_proof'), true);

const directReadyArtifact = createUniversalConversionArtifacts(manualReadyRoute('manual-ready-route'));
assert.equal(directReadyArtifact.summary.mergeReady, 0);
assert.equal(directReadyArtifact.routeArtifacts[0].admissionStatus, 'needs-review');
assert.equal(directReadyArtifact.admissionRecords[0].admissionBucket, 'needs-evidence');
assert.equal(directReadyArtifact.admissionRecords[0].evidence.missing.includes('route-bound-evidence'), true);

const directProofReadyArtifact = createUniversalConversionArtifacts(manualReadyRoute('manual-ready-proof-route', {
  evidenceIds: ['evidence_manual_ready_proof']
}), {
  metadata: {
    autoMergeClaim: true,
    semanticEquivalenceClaim: true
  }
});
const directProofArtifact = directProofReadyArtifact.routeArtifacts[0];
assert.equal(directProofReadyArtifact.summary.mergeReady, 1);
assert.equal(directProofArtifact.admissionStatus, 'queued');
assert.equal(directProofArtifact.admissionRecord.admissionBucket, 'merge-ready');
assert.equal(directProofReadyArtifact.metadata.autoMergeClaim, false);
assert.equal(directProofReadyArtifact.metadata.semanticEquivalenceClaim, false);
assert.equal(directProofArtifact.metadata.autoMergeClaim, false);
assert.equal(directProofArtifact.metadata.semanticEquivalenceClaim, false);
assert.equal(directProofArtifact.history.metadata.autoMergeClaim, false);
assert.equal(directProofArtifact.history.metadata.semanticEquivalenceClaim, false);

function manualReadyRoute(id, mergeRefs = {}) {
  return {
    id,
    sourceLanguage: 'javascript',
    target: 'javascript',
    mode: 'preserve-source',
    routeAction: 'preserve-source',
    priority: 'high',
    readiness: 'ready',
    admissionAction: 'admit',
    missingEvidence: [],
    blockers: [],
    review: [],
    mergeScore: {
      schema: 'frontier.lang.semanticMergeScore.v1',
      version: 1,
      value: 92,
      uncappedValue: 92,
      sortKey: 3292,
      higherIsBetter: true,
      readiness: 'ready',
      risk: 'low',
      action: 'admit',
      components: {},
      penalties: []
    },
    mergeRefs: {
      sources: [{ sourcePath: `src/${id}.js`, sourceHash: `hash-${id}` }],
      semanticOwnershipKeys: [`content.${id}`],
      conflictKeys: [`content.${id}`],
      ...mergeRefs
    }
  };
}
