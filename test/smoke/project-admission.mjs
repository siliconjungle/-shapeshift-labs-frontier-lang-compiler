import { assert } from './helpers.mjs';
import { createEstreeNativeImporterAdapter, createProjectImportAdmissionRecord, importNativeProject } from './compiler-api.mjs';
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

const zeroRegionProjectImport = await importNativeProject({
  id: 'zero_region_project_admission',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/zero-region-admission.js',
    sourceText: 'export const zeroRegionAdmission = true;\n',
    exactAst: true,
    nodes: {
      native_root: {
        id: 'native_root',
        kind: 'Program',
        languageKind: 'javascript.program',
        children: ['zero_region_decl']
      },
      zero_region_decl: {
        id: 'zero_region_decl',
        kind: 'VariableDeclaration',
        languageKind: 'javascript.variableDeclaration',
        value: 'zeroRegionAdmission'
      }
    },
    semanticIndex: {
      id: 'index_zero_region_admission',
      documents: [{
        id: 'doc_zero_region_admission',
        path: 'src/zero-region-admission.js',
        language: 'javascript'
      }],
      symbols: [{
        id: 'symbol_zero_region_admission',
        scheme: 'frontier',
        name: 'zeroRegionAdmission',
        kind: 'constant'
      }],
      occurrences: [],
      relations: [],
      facts: []
    },
    metadata: {
      semanticImportExpected: true,
      changedSource: true
    }
  }]
});
const zeroRegionAdmission = zeroRegionProjectImport.metadata.projectAdmission;
assert.equal(zeroRegionAdmission.semanticEvidence.empty, false);
assert.equal(zeroRegionAdmission.semanticEvidence.warningCount, 2);
assert.equal(zeroRegionAdmission.semanticEvidence.warningReasonCodes.includes('missing-ownership-regions'), true);
assert.equal(zeroRegionAdmission.semanticEvidence.warningReasonCodes.includes('missing-patch-hints'), true);
assert.equal(zeroRegionAdmission.semanticEvidence.warningSourcePaths.includes('src/zero-region-admission.js'), true);
assert.equal(zeroRegionAdmission.semanticEvidence.warnings.some((warning) => warning.reasonCode === 'missing-ownership-regions'), true);
assert.equal(zeroRegionAdmission.reasons.some((reason) => reason.includes('missing-ownership-regions')), true);
assert.equal(zeroRegionAdmission.action, 'prioritize');

const healthyRegionProjectImport = await importNativeProject({
  id: 'healthy_region_project_admission',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/healthy-region-admission.js',
    sourceText: 'export const healthyRegionAdmission = true;\n',
    exactAst: true,
    nodes: {
      native_root: {
        id: 'native_root',
        kind: 'Program',
        languageKind: 'javascript.program',
        children: ['healthy_region_decl']
      },
      healthy_region_decl: {
        id: 'healthy_region_decl',
        kind: 'VariableDeclaration',
        languageKind: 'javascript.variableDeclaration',
        value: 'healthyRegionAdmission',
        span: { path: 'src/healthy-region-admission.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 45 }
      }
    },
    semanticIndex: {
      id: 'index_healthy_region_admission',
      documents: [{
        id: 'doc_healthy_region_admission',
        path: 'src/healthy-region-admission.js',
        language: 'javascript'
      }],
      symbols: [{
        id: 'symbol_healthy_region_admission',
        scheme: 'frontier',
        name: 'healthyRegionAdmission',
        kind: 'constant',
        metadata: {
          ownershipRegionId: 'region_healthy_region_admission',
          ownershipRegionKey: 'source#src/healthy-region-admission.js#declaration#healthyRegionAdmission',
          ownershipRegionKind: 'declaration'
        }
      }],
      occurrences: [],
      relations: [],
      facts: []
    },
    ownershipRegions: [{
      id: 'region_healthy_region_admission',
      key: 'source#src/healthy-region-admission.js#declaration#healthyRegionAdmission',
      regionKind: 'declaration',
      granularity: 'symbol',
      language: 'javascript',
      sourcePath: 'src/healthy-region-admission.js',
      symbolId: 'symbol_healthy_region_admission',
      symbolName: 'healthyRegionAdmission',
      symbolKind: 'constant',
      nativeAstNodeId: 'healthy_region_decl',
      sourceSpan: { path: 'src/healthy-region-admission.js', startLine: 1, startColumn: 1, endLine: 1, endColumn: 45 },
      precision: 'declaration'
    }],
    metadata: {
      semanticImportExpected: true,
      changedSource: true
    }
  }]
});
const healthyRegionAdmission = healthyRegionProjectImport.metadata.projectAdmission;
assert.equal(healthyRegionAdmission.semanticEvidence.empty, false);
assert.equal(healthyRegionAdmission.semanticEvidence.warningCount, 0);
assert.deepEqual(healthyRegionAdmission.semanticEvidence.warningReasonCodes, []);
assert.equal(healthyRegionAdmission.semanticEvidence.warnings.length, 0);
assert.equal(healthyRegionAdmission.reasons.some((reason) => reason.includes('missing-ownership-regions')), false);
assert.equal(healthyRegionAdmission.reasons.some((reason) => reason.includes('missing-patch-hints')), false);

const projectSymbolGraphImport = await importNativeProject({
  id: 'project_symbol_graph_admission',
  projectRoot: 'src',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/index.js',
    sourceText: "export { thing } from './thing.js';\n",
    adapter: createEstreeNativeImporterAdapter(),
    adapterOptions: {
      ast: {
        type: 'Program',
        sourceType: 'module',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 36 } },
        body: [{
          type: 'ExportNamedDeclaration',
          declaration: null,
          specifiers: [{
            type: 'ExportSpecifier',
            local: { type: 'Identifier', name: 'thing' },
            exported: { type: 'Identifier', name: 'thing' }
          }],
          source: { type: 'Literal', value: './thing.js' },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 36 } }
        }]
      }
    },
    metadata: { semanticImportExpected: true }
  }]
});
const projectSymbolGraph = projectSymbolGraphImport.projectSymbolGraph;
assert.equal(projectSymbolGraph, projectSymbolGraphImport.metadata.projectSymbolGraph);
assert.equal(projectSymbolGraph.kind, 'frontier.lang.projectSymbolGraph');
assert.equal(projectSymbolGraph.fileHashes.length, 1);
assert.equal(projectSymbolGraph.fileHashes[0].sourcePath, 'src/index.js');
assert.deepEqual(projectSymbolGraph.exportEdges.map((edge) => [edge.moduleSpecifier, edge.isReExport]), [['./thing.js', true]]);
assert.deepEqual(projectSymbolGraph.reExportIdentities.map((identity) => identity.moduleSpecifier), ['./thing.js']);
assert.deepEqual(projectSymbolGraph.publicContractRegions.map((region) => region.regionKind), ['export']);
assert.equal(projectSymbolGraph.remainingFields.includes('moduleEdges[].targetDocumentId'), true);
assert.equal(projectSymbolGraphImport.semanticIndex.metadata.projectSymbolGraph, projectSymbolGraph);
