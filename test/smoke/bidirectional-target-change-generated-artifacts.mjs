import { assert } from './helpers.mjs';
import {
  createBidirectionalTargetChangeRecord,
  createUniversalConversionArtifacts,
  importNativeSource,
  queryUniversalConversionArtifacts
} from './compiler-api.mjs';

const sourceText = 'export function add(count: number): number { return count + 1; }\n';
const sourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/exact-counter.ts',
  sourceText
});
const sourceSymbol = sourceImport.semanticIndex.symbols.find((symbol) => symbol.name === 'add');
const sourceExpressionStart = sourceText.indexOf('count + 1');

const generatedTargetCases = [
  {
    target: 'rust',
    targetPath: 'generated/counter.rs',
    baseTarget: 'pub fn add(count: i32) -> i32 { count + 1 }\n',
    editedTarget: 'pub fn add(count: i32) -> i32 { count + 2 }\n'
  },
  {
    target: 'python',
    targetPath: 'generated/counter.py',
    baseTarget: 'def add(count):\n    return count + 1\n',
    editedTarget: 'def add(count):\n    return count + 2\n',
    generatedName: 'add:controlFlow:exit#1',
    generatedStartLine: 2,
    generatedEndLine: 2,
    generatedStartColumn: 5,
    generatedEndColumn: 21
  },
  {
    target: 'c',
    targetPath: 'generated/counter.c',
    baseTarget: 'int add(int count) {\n  return count + 1;\n}\n',
    editedTarget: 'int add(int count) {\n  return count + 2;\n}\n',
    generatedName: 'add:controlFlow:exit#1',
    generatedStartLine: 2,
    generatedEndLine: 2,
    generatedStartColumn: 3,
    generatedEndColumn: 20
  }
];

for (const targetCase of generatedTargetCases) {
  const generatedRecord = generatedTargetRecord(targetCase);
  const sourceMapId = `source_map_exact_counter_ts_to_${targetCase.target}`;
  const mappingId = `map_ts_add_expr_to_${targetCase.target}_add_expr`;
  const sourceMapLinkId = generatedRecord.sourcePatchBundle.index.transformSourceMapLinkIds[0];
  const routeArtifact = generatedRouteArtifact(targetCase, generatedRecord, sourceMapId, mappingId, sourceMapLinkId);

  assert.equal(generatedRecord.targetPortability.status, 'portable');
  assert.equal(generatedRecord.sourceProjectionHint.sourceBackprojectionMode, 'cross-language-explicit-source-replacement');
  assert.equal(generatedRecord.sourceEditReplay.status, 'accepted-clean');
  assert.equal(generatedRecord.sourcePatchBundle.admission.transformAdmission.status, 'ready');
  assert.equal(generatedRecord.metadata.autoMergeClaim, false);
  assert.equal(generatedRecord.metadata.semanticEquivalenceClaim, false);
  assert.equal(routeArtifact.autoMergeClaim, false);
  assert.equal(routeArtifact.semanticEquivalenceClaim, false);
  assert.equal(routeArtifact.patchBundle.sourceMapLinks[0].targetPath, targetCase.targetPath);
  assert.equal(routeArtifact.patchBundle.index.transformTargetLanguages.includes(targetCase.target), true);
  assert.equal(routeArtifact.patchBundle.index.transformTargetPaths.includes(targetCase.targetPath), true);
  assert.equal(routeArtifact.patchBundle.index.transformSourceMapIds.includes(sourceMapId), true);
  assert.equal(routeArtifact.patchBundle.index.transformSourceMapMappingIds.includes(mappingId), true);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { transformTargetLanguage: targetCase.target }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { transformTargetPath: targetCase.targetPath }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { transformSourceMapId: sourceMapId }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { transformSourceMapLinkId: sourceMapLinkId }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { transformSourceMapMappingId: mappingId }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { targetPortabilityStatus: 'portable' }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { targetPortabilityAction: 'port-with-source-map-review' }).length, 1);
  assert.equal(queryUniversalConversionArtifacts(routeArtifact, { sourceBackprojectionMode: 'cross-language-explicit-source-replacement' }).length, 1);
}

function generatedTargetRecord(targetCase) {
  const generatedStart = targetCase.baseTarget.indexOf('count + 1');
  const generatedSpan = {
    path: targetCase.targetPath,
    targetPath: targetCase.targetPath,
    start: generatedStart,
    end: generatedStart + 'count + 1'.length,
    generatedName: targetCase.generatedName ?? 'add'
  };
  if (targetCase.generatedStartLine) generatedSpan.startLine = targetCase.generatedStartLine;
  if (targetCase.generatedEndLine) generatedSpan.endLine = targetCase.generatedEndLine;
  if (targetCase.generatedStartColumn) generatedSpan.startColumn = targetCase.generatedStartColumn;
  if (targetCase.generatedEndColumn) generatedSpan.endColumn = targetCase.generatedEndColumn;
  return createBidirectionalTargetChangeRecord({
    id: `counter_ts_to_${targetCase.target}_generated_source_replacement`,
    source: sourceImport,
    targetLanguage: targetCase.target,
    targetPath: targetCase.targetPath,
    baseTarget: { language: targetCase.target, sourcePath: targetCase.targetPath, sourceText: targetCase.baseTarget },
    editedTarget: { language: targetCase.target, sourcePath: targetCase.targetPath, sourceText: targetCase.editedTarget },
    sourceMaps: [{
      kind: 'frontier.lang.sourceMap',
      version: 1,
      id: `source_map_exact_counter_ts_to_${targetCase.target}`,
      sourcePath: 'src/exact-counter.ts',
      sourceHash: sourceImport.nativeSource.sourceHash,
      target: targetCase.target,
      targetPath: targetCase.targetPath,
      mappings: [{
        id: `map_ts_add_expr_to_${targetCase.target}_add_expr`,
        semanticSymbolId: sourceSymbol.id,
        sourceSpan: { path: 'src/exact-counter.ts', start: sourceExpressionStart, end: sourceExpressionStart + 'count + 1'.length },
        generatedSpan,
        target: targetCase.target,
        generatedName: targetCase.generatedName ?? 'add',
        precision: 'exact',
        preservation: 'expression',
        sourceReplacementText: 'count + 2'
      }]
    }]
  });
}

function generatedRouteArtifact(targetCase, record, sourceMapId, mappingId, sourceMapLinkId) {
  return createUniversalConversionArtifacts({
    id: `artifact_ts_to_${targetCase.target}_generated_source_replacement`,
    sourceLanguage: 'typescript',
    target: targetCase.target,
    mode: 'target-adapter',
    routeAction: 'run-target-adapter',
    priority: 'high',
    readiness: 'ready',
    admissionAction: 'admit',
    missingEvidence: [],
    blockers: [],
    review: [],
    mergeRefs: {
      sources: [{ sourcePath: 'src/exact-counter.ts', sourceHash: sourceImport.nativeSource.sourceHash }],
      sourceMapIds: [sourceMapId],
      sourceMapMappingIds: [mappingId],
      sourceMapLinkIds: [sourceMapLinkId],
      targetPaths: [targetCase.targetPath],
      semanticOwnershipKeys: ['source#src/exact-counter.ts#body#add'],
      conflictKeys: ['source#src/exact-counter.ts#body#add']
    },
    metadata: {
      targetPortability: record.targetPortability,
      semanticEditScripts: [record.sourceEditScript].filter(Boolean),
      semanticEditProjections: [record.sourceEditProjection].filter(Boolean),
      semanticEditReplays: [record.sourceEditReplay].filter(Boolean),
      semanticEditAdmission: record.sourcePatchBundle.admission.semanticEditAdmission
    }
  }).routeArtifacts[0];
}
