import { assert } from './helpers.mjs';
import { createProjectImportAdmissionRecord, importNativeProject } from './compiler-api.mjs';
import { projectImport } from './swift-kotlin-project.mjs';

const projectAdmission = projectImport.metadata.projectAdmission;
assert.equal(projectAdmission.kind, 'frontier.lang.projectImportAdmission');
assert.equal(projectImport.metadata.semanticMergeAdmission, projectAdmission);
assert.equal(projectAdmission.action, 'prioritize');
assert.equal(projectAdmission.priority, 'high');
assert.equal(projectAdmission.languages.total, 2);
assert.equal(projectAdmission.languages.byReadiness.ready >= 1, true);
assert.equal(projectAdmission.languages.byReadiness['needs-review'] >= 1, true);
assert.equal(projectAdmission.semanticEvidence.empty, false);
assert.equal(projectAdmission.ownership.changed >= 2, true);
assert.equal(projectAdmission.mergeCandidates.highestRisk, 'medium');
assert.equal(createProjectImportAdmissionRecord(projectImport).readiness, projectAdmission.readiness);
assert.equal(projectAdmission.mergeScore.schema, 'frontier.lang.semanticMergeScore.v1');
assert.equal(projectAdmission.mergeScore.higherIsBetter, true);
assert.equal(projectAdmission.mergeScore.value > 50, true);
assert.equal(projectAdmission.mergeScore.sortKey > projectAdmission.mergeScore.value, true);
assert.equal(projectAdmission.mergeScore.components.semanticEvidence.status, 'strong');
assert.equal(projectAdmission.mergeScore.components.sourceFreshness.score, 100);
assert.equal(projectAdmission.mergeScore.components.ownershipChange.signals.changed >= 2, true);
assert.equal(projectAdmission.mergeScore.components.proofReadiness.signals.readiness, projectAdmission.readiness);
assert.equal(projectAdmission.mergeScore.components.targetProjectionCoverage.signals.targetEntries, 0);

const projectedAdmission = createProjectImportAdmissionRecord({
  ...projectImport,
  metadata: {
    ...projectImport.metadata,
    targetCoverage: {
      target: 'typescript',
      supported: true,
      readiness: 'ready',
      lossClass: 'targetAdapterProjection',
      adapter: 'fixture-target-adapter'
    }
  }
});
assert.equal(projectedAdmission.mergeScore.components.targetProjectionCoverage.signals.targetEntries, 1);
assert.equal(projectedAdmission.mergeScore.components.targetProjectionCoverage.score > projectAdmission.mergeScore.components.targetProjectionCoverage.score, true);
assert.equal(projectedAdmission.mergeScore.value > projectAdmission.mergeScore.value, true);

const emptySemanticProjectImport = await importNativeProject({
  id: 'empty_semantic_project_admission',
  projectRoot: 'queries',
  sources: [{
    language: 'sql',
    sourcePath: 'queries/list_todos.sql',
    sourceText: 'SELECT * FROM todos;\n'
  }]
});
const emptySemanticAdmission = emptySemanticProjectImport.metadata.projectAdmission;
assert.equal(emptySemanticAdmission.semanticEvidence.empty, true);
assert.equal(emptySemanticAdmission.semanticEvidence.emptySourceCount, 1);
assert.equal(emptySemanticAdmission.action, 'reject');
assert.equal(emptySemanticAdmission.reasons.some((reason) => reason.includes('no semantic symbols')), true);
assert.equal(emptySemanticAdmission.mergeScore.components.semanticEvidence.score, 0);
assert.equal(emptySemanticAdmission.mergeScore.value < projectAdmission.mergeScore.value, true);

const staleProjectImport = await importNativeProject({
  id: 'stale_project_admission',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/stale-admission.js',
    sourceText: 'export const staleAdmission = true;\n',
    sourceHash: 'fnv1a32:stale_admission_hash'
  }]
});
const staleAdmission = staleProjectImport.metadata.projectAdmission;
assert.equal(staleAdmission.semanticEvidence.empty, false);
assert.equal(staleAdmission.sourcePreservation.quality, 'stale');
assert.deepEqual(staleAdmission.sourcePreservation.staleSourcePaths, ['src/stale-admission.js']);
assert.equal(staleAdmission.action, 'reject');
assert.equal(staleAdmission.mergeScore.components.sourceFreshness.score, 0);
assert.equal(staleAdmission.mergeScore.value < projectAdmission.mergeScore.value, true);
assert.equal(staleAdmission.mergeScore.penalties.some((penalty) => penalty.includes('stale source hashes')), true);
