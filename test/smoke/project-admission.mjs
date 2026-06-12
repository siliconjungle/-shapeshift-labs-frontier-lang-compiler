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
assert.equal(staleAdmission.sourceStaleness.stale, 1);
assert.equal(staleAdmission.sourceStaleness.contentHashStale, 1);
assert.equal(staleAdmission.sourceStaleness.baseHashStale, 0);
assert.equal(staleAdmission.sourceStaleness.dirtyWorkspace, 0);
assert.deepEqual(staleAdmission.sourcePreservation.staleSourcePaths, ['src/stale-admission.js']);
assert.deepEqual(staleAdmission.sourceStaleness.contentHashStaleSourcePaths, ['src/stale-admission.js']);
assert.equal(staleAdmission.sourceStaleness.records[0].staleByContentHash, true);
assert.equal(staleAdmission.sourceStaleness.records[0].reasonCodes.includes('source-hash-mismatch'), true);
assert.equal(staleAdmission.action, 'reject');
assert.equal(staleAdmission.mergeScore.components.sourceFreshness.score, 0);
assert.equal(staleAdmission.mergeScore.components.sourceFreshness.signals.contentHashStale, 1);
assert.equal(staleAdmission.mergeScore.value < projectAdmission.mergeScore.value, true);
assert.equal(staleAdmission.mergeScore.penalties.some((penalty) => penalty.includes('stale content hashes')), true);

const dirtyWorkspaceProjectImport = await importNativeProject({
  id: 'dirty_workspace_project_admission',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/dirty-workspace-admission.js',
    sourceText: 'export const dirtyWorkspaceAdmission = true;\n',
    exactAst: true,
    nodes: {
      native_root: {
        id: 'native_root',
        kind: 'Program',
        languageKind: 'javascript.program',
        children: ['dirty_decl']
      },
      dirty_decl: {
        id: 'dirty_decl',
        kind: 'VariableDeclaration',
        languageKind: 'javascript.variableDeclaration',
        value: 'dirtyWorkspaceAdmission'
      }
    },
    semanticIndex: {
      id: 'index_dirty_workspace_admission',
      documents: [{
        id: 'doc_dirty_workspace_admission',
        path: 'src/dirty-workspace-admission.js',
        language: 'javascript'
      }],
      symbols: [{
        id: 'symbol_dirty_workspace_admission',
        scheme: 'frontier',
        name: 'dirtyWorkspaceAdmission',
        kind: 'constant'
      }],
      occurrences: [],
      relations: [],
      facts: []
    },
    metadata: {
      dirtyWorkspace: true
    }
  }]
});
const dirtyWorkspaceAdmission = dirtyWorkspaceProjectImport.metadata.projectAdmission;
assert.equal(dirtyWorkspaceAdmission.semanticEvidence.empty, false);
assert.equal(dirtyWorkspaceAdmission.sourceStaleness.stale, 0);
assert.equal(dirtyWorkspaceAdmission.sourceStaleness.contentHashStale, 0);
assert.equal(dirtyWorkspaceAdmission.sourceStaleness.baseHashStale, 0);
assert.equal(dirtyWorkspaceAdmission.sourceStaleness.dirtyWorkspace, 1);
assert.deepEqual(dirtyWorkspaceAdmission.sourceStaleness.dirtyWorkspaceSourcePaths, ['src/dirty-workspace-admission.js']);
assert.equal(dirtyWorkspaceAdmission.sourcePreservation.quality, 'exact');
assert.equal(dirtyWorkspaceAdmission.sourcePreservation.stale, 0);
assert.notEqual(dirtyWorkspaceAdmission.action, 'reject');
assert.equal(dirtyWorkspaceAdmission.mergeScore.components.sourceFreshness.score, 100);
assert.equal(dirtyWorkspaceAdmission.mergeScore.components.sourceFreshness.signals.dirtyWorkspace, 1);
assert.equal(dirtyWorkspaceAdmission.mergeScore.penalties.some((penalty) => penalty.includes('dirty')), false);
