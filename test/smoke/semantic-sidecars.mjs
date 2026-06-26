import { assert, assertSemanticImportFixture } from './helpers.mjs';
import { scannedJsImport } from './scanned-js.mjs';
import {
  createSemanticImportSidecar,
  diffNativeSourceImports,
  diffNativeSources,
  importNativeSource
} from './compiler-api.mjs';

const graphLevelSourceImport = {
  id: 'graph_level_source_symbols',
  language: 'typescript',
  sourcePath: 'src/graph-level.ts',
  sourceHash: 'graph-level-source-hash',
  symbols: [{
    id: 'symbol:GraphOwner',
    name: 'GraphOwner',
    kind: 'class',
    language: 'typescript',
    definitionSpan: { path: 'src/graph-level.ts', startLine: 1, startColumn: 1, endLine: 4, endColumn: 2 }
  }, {
    id: 'symbol:graphOwner',
    name: 'graphOwner',
    kind: 'function',
    language: 'typescript',
    definitionSpan: { path: 'src/graph-level.ts', startLine: 6, startColumn: 1, endLine: 8, endColumn: 2 }
  }],
  evidence: [{ id: 'evidence_graph_level_source_symbols', kind: 'graph-source', status: 'passed' }]
};
const graphLevelSourceSidecar = createSemanticImportSidecar(graphLevelSourceImport, { generatedAt: 131 });
const graphLevelRegions = graphLevelSourceSidecar.ownershipRegions.filter((region) => ['GraphOwner', 'graphOwner'].includes(region.symbolName));
assert.equal(graphLevelSourceSidecar.summary.symbols, 2);
assert.equal(graphLevelSourceSidecar.summary.ownershipRegions, 2);
assert.equal(graphLevelSourceSidecar.graphLayers.kind, 'frontier.lang.semanticGraphLayers');
assert.equal(graphLevelSourceSidecar.graphLayers.layerKinds.length, 6);
assert.equal(graphLevelSourceSidecar.graphLayers.layers.genericSemanticEditAdmission.id, 'generic-semantic-edit-admission');
assert.equal(graphLevelSourceSidecar.summary.graphLayers, 6);
assert.equal(graphLevelSourceSidecar.summary.graphLayersUsable >= 1, true);
assert.equal(graphLevelSourceSidecar.summary.emptySemanticIndex, false);
assert.equal(graphLevelRegions.length, 2);
assert.equal(new Set(graphLevelRegions.map((region) => region.id)).size, 2);
assert.equal(graphLevelRegions.every((region) => region.sourceHash === 'graph-level-source-hash'), true);
assert.equal(graphLevelSourceSidecar.imports[0].sourceHash, 'graph-level-source-hash');
assert.equal(graphLevelSourceSidecar.patchHints.length, 2);
const importedRegionSource = {
  id: 'imported_region_source',
  language: 'typescript',
  sourcePath: 'src/imported-region.ts',
  semanticIndex: {
    id: 'index_imported_region_source',
    symbols: [{
      id: 'symbol:ImportedRegion',
      name: 'ImportedRegion',
      kind: 'function',
      language: 'typescript',
      definitionSpan: { path: 'src/imported-region.ts', startLine: 1, startColumn: 1, endLine: 3, endColumn: 2 },
      metadata: {
        ownershipRegionId: 'region_imported_source_exact',
        ownershipRegionKey: 'source#src/imported-region.ts#body#ImportedRegion',
        ownershipRegionKind: 'body'
      }
    }],
    relations: [],
    facts: []
  },
  ownershipRegions: [{
    id: 'region_imported_source_exact',
    key: 'source#src/imported-region.ts#body#ImportedRegion',
    regionKind: 'body',
    granularity: 'symbol',
    language: 'typescript',
    sourcePath: 'src/imported-region.ts',
    sourceHash: 'imported-region-source-hash',
    symbolId: 'symbol:ImportedRegion',
    symbolName: 'ImportedRegion',
    symbolKind: 'function',
    sourceSpan: { path: 'src/imported-region.ts', startLine: 1, startColumn: 1, endLine: 3, endColumn: 2 },
    precision: 'exact',
    mergePolicy: 'implementation-single-writer-review-required'
  }],
  evidence: [{ id: 'evidence_imported_region_source', kind: 'ownership-region', status: 'passed' }]
};
const importedRegionSidecar = createSemanticImportSidecar(importedRegionSource, { generatedAt: 133 });
assert.equal(importedRegionSidecar.ownershipRegions.length, 1);
assert.equal(importedRegionSidecar.ownershipRegions[0].id, 'region_imported_source_exact');
assert.equal(importedRegionSidecar.ownershipRegions[0].precision, 'exact');
assert.equal(importedRegionSidecar.symbols[0].ownershipRegionId, 'region_imported_source_exact');
const nativeResultOwnershipImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/native-result-ownership.js',
  sourceText: 'export function nativeResultOwner(value) {\n  return value;\n}\n'
});
assert.equal(nativeResultOwnershipImport.semanticIndex.ownershipRegions.length > 0, true);
assert.equal(nativeResultOwnershipImport.semanticIndex.patchHints.length, nativeResultOwnershipImport.semanticIndex.ownershipRegions.length);
assert.equal(nativeResultOwnershipImport.ownershipRegions.length, nativeResultOwnershipImport.semanticIndex.ownershipRegions.length);
assert.equal(nativeResultOwnershipImport.patchHints.length, nativeResultOwnershipImport.semanticIndex.patchHints.length);
assert.equal(nativeResultOwnershipImport.semanticIndex.ownershipRegions.some((region) => region.symbolName === 'nativeResultOwner'), true);
const jsTsGraphLayerImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/semantic-graph-layers.ts',
  sourceText: 'import { readFile } from "node:fs/promises";\nexport interface LoadOptions { path: string; }\nexport async function load(options: LoadOptions) {\n  const text = await readFile(options.path, "utf8");\n  return { text };\n}\n'
});
const jsTsGraphLayerSidecar = createSemanticImportSidecar(jsTsGraphLayerImport, { generatedAt: 134 });
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.parserSourceSpanTrivia.status !== 'missing', true);
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.scopeUseDef.status !== 'missing', true);
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.moduleExportImport.summary.importEdges >= 1, true);
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.typePublicApi.summary.typeSymbols >= 1, true);
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.controlFlowEffect.summary.runtimeRegions >= 1, true);
assert.equal(jsTsGraphLayerSidecar.graphLayers.layers.genericSemanticEditAdmission.summary.patchHints >= 1, true);
const nativeLossSummaryOnlyImport = {
  ...scannedJsImport,
  id: 'import_scanned_js_native_loss_summary_only',
  losses: [],
  mergeCandidates: [],
  metadata: {
    ...scannedJsImport.metadata,
    semanticMergeReadiness: undefined,
    nativeImportLossSummary: {
      semanticMergeReadiness: 'blocked'
    }
  }
};
const nativeLossSummaryOnlySidecar = createSemanticImportSidecar(nativeLossSummaryOnlyImport, { generatedAt: 132 });
assert.equal(nativeLossSummaryOnlySidecar.imports[0].readiness, 'blocked');
assert.equal(nativeLossSummaryOnlySidecar.summary.readiness, 'blocked');
assert.equal(nativeLossSummaryOnlySidecar.symbols.every((symbol) => symbol.readiness === 'blocked'), true);
assert.equal(nativeLossSummaryOnlySidecar.patchHints.every((hint) => hint.readiness === 'blocked'), true);
assert.equal(nativeLossSummaryOnlySidecar.admission.action, 'reject-blocked');
const emptySemanticImport = {
  id: 'empty_import',
  language: 'javascript',
  sourcePath: 'src/empty.js',
  semanticIndex: { id: 'empty_index', symbols: [] },
  evidence: []
};
const emptySemanticSidecar = createSemanticImportSidecar(emptySemanticImport, { generatedAt: 126 });
assertSemanticImportFixture(emptySemanticImport, {
  sidecar: emptySemanticSidecar,
  minSymbols: 0,
  minOwnershipRegions: 0,
  minSourceMapMappings: 0,
  minPatchHints: 0,
  expectEligible: false,
  expectedWarningCodes: ['empty-evidence', 'empty-semantic-index', 'missing-ownership-regions', 'missing-patch-hints']
});
assert.equal(emptySemanticSidecar.quality.imported, true);
assert.equal(emptySemanticSidecar.quality.eligible, false);
assert.equal(emptySemanticSidecar.admission.action, 'reject-empty-evidence');
assert.equal(emptySemanticSidecar.quality.emptyEvidenceWarnings.some((warning) => warning.code === 'empty-semantic-index'), true);
assert.equal(emptySemanticSidecar.semanticImpact.records.length, 0); assert.equal(emptySemanticSidecar.summary.semanticImpactRecords, 0);
const jsRegionFalsePositiveImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/false-positive.ts',
  sourceText: '/*\nexport const fakeRoutes = [\n  { path: "/fake", component: Fake }\n];\n*/\nconst template = `\nexport const fakeContent = { docs: { title: "Fake" } };\n`;\nexport const realRoutes = [\n  { path: "/real", component: Real }\n];\n'
});
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeRoutes')), false);
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name.includes('fakeContent')), false);
assert.equal(jsRegionFalsePositiveImport.semanticIndex.symbols.some((symbol) => symbol.name === 'realRoutes./real'), true);
assert.equal(jsRegionFalsePositiveImport.sourceMaps[0].mappings.length, jsRegionFalsePositiveImport.semanticIndex.occurrences.length);
const jsChangeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/change.js',
  beforeSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\n',
  afterSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title, done: false }; }\nexport const TODO_LIMIT = 128;\n'
});
assert.equal(jsChangeSet.kind, 'frontier.lang.nativeSourceChangeSet');
assert.equal(jsChangeSet.summary.sourceChanged, true);
assert.equal(jsChangeSet.summary.modifiedSymbols >= 1, true);
assert.equal(jsChangeSet.summary.addedSymbols, 2);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'addTodo:controlFlow:exit#1'
  && symbol.ownershipRegionKind === 'controlFlow' && symbol.changeKind === 'modified'), true);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'TODO_LIMIT' && symbol.kind === 'variable' && symbol.changeKind === 'added'), true);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'TODO_LIMIT' && symbol.kind === 'export' && symbol.changeKind === 'added'), true);
assert.equal(jsChangeSet.changedRegions.length >= 2, true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'upsertNode'), true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'addEvidence'), true);
assert.equal(jsChangeSet.mergeCandidate.kind, 'frontier.lang.semanticMergeCandidate');
assert.equal(jsChangeSet.mergeCandidate.patchId, jsChangeSet.patch.id);
assert.equal(jsChangeSet.mergeCandidate.conflictKeys.some((key) => key.startsWith('region:source#src/change.js')), true);
assert.equal(jsChangeSet.readiness, 'needs-review');
const jsChangeProjection = jsChangeSet.changedRegions.find((region) => region.metadata?.changedRegionProjection?.sourceMapLinks?.length)?.metadata.changedRegionProjection;
assert.equal(jsChangeProjection.schema, 'frontier.lang.changedRegionProjection.v1');
assert.equal(jsChangeProjection.reviewRequired, true);
assert.equal(jsChangeProjection.autoMergeClaim, false);
assert.equal(jsChangeProjection.after.sourceHash, jsChangeSet.afterHash);
assert.equal(jsChangeProjection.admission.readiness, jsChangeSet.readiness);
assert.equal(jsChangeProjection.admission.action, 'review-port');
assert.equal(jsChangeProjection.sourceMapLinks.some((link) => link.side === 'after' && link.sourceMapMappingId), true);
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.schema, 'frontier.lang.changedRegionProjectionSummary.v1');
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.withProjection, jsChangeSet.changedRegions.length);
assert.equal(jsChangeSet.mergeCandidate.metadata.changedRegionProjectionSummary.autoMergeClaims, 0);
assert.equal(jsChangeSet.metadata.changedRegionProjectionSummary.reviewRequired, jsChangeSet.changedRegions.length);
assert.equal(jsChangeSet.mergeCandidate.nativeSpans.some((span) => span.metadata?.changedRegionProjection?.schema === 'frontier.lang.changedRegionProjection.v1'), true);
const unchangedDeclarationChangeSet = diffNativeSourceImports({
  before: importNativeSource({
    language: 'javascript',
    sourcePath: 'src/body-only.js',
    sourceText: 'export function bodyOnly(value) {\n  return value;\n}\n'
  }),
  after: importNativeSource({
    language: 'javascript',
    sourcePath: 'src/body-only.js',
    sourceText: 'export function bodyOnly(value) {\n  return String(value);\n}\n'
  })
});
assert.equal(unchangedDeclarationChangeSet.summary.sourceChanged, true);
assert.equal(unchangedDeclarationChangeSet.summary.symbols, 1);
assert.equal(unchangedDeclarationChangeSet.summary.regions, 1);
assert.equal(unchangedDeclarationChangeSet.summary.modifiedSymbols, 1);
assert.equal(unchangedDeclarationChangeSet.changedSymbols.some((symbol) => symbol.name === 'bodyOnly:controlFlow:exit#1'
  && symbol.changeKind === 'modified' && symbol.sourceSpan.endLine === 2), true);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].granularity, 'semantic-fact-line');
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].regionKind, 'controlFlow');
assert.equal(unchangedDeclarationChangeSet.reasons.some((reason) => reason.includes('1 symbol(s)')), true);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.admission.action, 'review-port');
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.autoMergeClaim, false);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.sourceMapLinks.some((link) => link.side === 'before'), true);
