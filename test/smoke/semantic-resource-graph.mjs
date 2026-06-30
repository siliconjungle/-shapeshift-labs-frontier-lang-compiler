import { assert } from './helpers.mjs';
import {
  createSemanticGraphLayerSummary,
  createSemanticImportSidecar,
  createSemanticResourceGraph,
  importNativeSource,
  querySemanticResourceGraph,
  summarizeSemanticResourceGraph
} from './compiler-api.mjs';

const rustLikeGraph = createSemanticResourceGraph({
  id: 'resource_graph_rust_like_buffer',
  language: 'rust',
  sourcePath: 'src/lib.rs',
  sourceHash: 'hash:rust-buffer',
  evidence: [{ id: 'evidence_rust_analyzer_borrow_facts', kind: 'borrow-facts', status: 'passed' }],
  resources: [{
    id: 'resource_buffer',
    name: 'buffer',
    resourceKind: 'heap-buffer',
    ownerId: 'owner_parse_frame',
    ownerName: 'parse_frame'
  }],
  owners: [{
    id: 'owner_parse_frame',
    name: 'parse_frame',
    ownerKind: 'function'
  }],
  lifetimeRegions: [{
    id: 'lifetime_header',
    name: 'header borrow',
    startLine: 3,
    endLine: 6
  }],
  loans: [{
    id: 'loan_header_read',
    resourceId: 'resource_buffer',
    ownerId: 'owner_parse_frame',
    lifetimeRegionId: 'lifetime_header',
    mode: 'shared'
  }],
  aliases: [{
    id: 'alias_header_slice',
    resourceId: 'resource_buffer',
    ownerId: 'owner_parse_frame',
    lifetimeRegionId: 'lifetime_header',
    aliasKind: 'slice'
  }],
  moves: [{
    id: 'move_buffer_to_worker',
    resourceId: 'resource_buffer',
    fromOwnerId: 'owner_parse_frame',
    toOwnerId: 'owner_worker'
  }],
  drops: [{
    id: 'drop_buffer',
    resourceId: 'resource_buffer',
    ownerId: 'owner_worker',
    lifetimeRegionId: 'lifetime_worker'
  }],
  unsafeBoundaries: [{
    id: 'unsafe_ffi_buffer',
    resourceId: 'resource_buffer',
    proofStatus: 'missing'
  }]
});

assert.equal(rustLikeGraph.kind, 'frontier.lang.semanticResourceGraph');
assert.equal(rustLikeGraph.status, 'blocked');
assert.equal(rustLikeGraph.summary.resources, 1);
assert.equal(rustLikeGraph.summary.loans, 1);
assert.equal(rustLikeGraph.summary.aliases, 1);
assert.equal(rustLikeGraph.summary.moves, 1);
assert.equal(rustLikeGraph.summary.drops, 1);
assert.equal(rustLikeGraph.summary.unsafeBoundariesWithoutProof, 1);
assert.equal(rustLikeGraph.summary.conflicts, 1);
assert.equal(rustLikeGraph.claims.borrowCheckerClaim, false);
assert.equal(rustLikeGraph.claims.semanticEquivalenceClaim, false);
assert.equal(querySemanticResourceGraph(rustLikeGraph, { resourceId: 'resource_buffer' }).length >= 5, true);
assert.equal(querySemanticResourceGraph(rustLikeGraph, { unsafe: true }).length, 1);
assert.equal(summarizeSemanticResourceGraph(rustLikeGraph).proofObligations, 1);

const graphLayerSummary = createSemanticGraphLayerSummary({ resourceGraph: rustLikeGraph });
assert.equal(graphLayerSummary.layerKinds.includes('resource-alias-lifetime'), true);
assert.equal(graphLayerSummary.layers.resourceAliasLifetime.status, 'blocked');
assert.equal(graphLayerSummary.layers.resourceAliasLifetime.summary.unsafeBoundariesWithoutProof, 1);
assert.equal(graphLayerSummary.layers.resourceAliasLifetime.summary.borrowCheckerClaim, false);

const explicitResourceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/resource.ts',
  sourceText: 'export function load() {\n  using file = openFile();\n  return file.read();\n}\n'
});
const explicitResourceSidecar = createSemanticImportSidecar(explicitResourceImport, { generatedAt: 140 });

assert.equal(explicitResourceSidecar.resourceGraph.kind, 'frontier.lang.semanticResourceGraph');
assert.equal(explicitResourceSidecar.resourceGraph.summary.resources >= 1, true);
assert.equal(explicitResourceSidecar.resourceGraph.summary.drops >= 1, true);
assert.equal(explicitResourceSidecar.graphLayers.layers.resourceAliasLifetime.status !== 'missing', true);
assert.equal(explicitResourceSidecar.summary.resourceGraphResources, explicitResourceSidecar.resourceGraph.summary.resources);
assert.equal(explicitResourceSidecar.summary.graphLayers, 7);

const rustResourceImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  sourceText: [
    'pub unsafe fn from_raw(buffer: &mut Buffer, ptr: *const u8) -> usize {',
    '  unsafe { *ptr as usize }',
    '}',
    'pub struct Buffer;',
    ''
  ].join('\n')
});
const rustResourceSidecar = createSemanticImportSidecar(rustResourceImport, { generatedAt: 141 });
const rustResourceGraph = rustResourceSidecar.resourceGraph;

assert.equal(rustResourceGraph.status, 'blocked');
assert.equal(rustResourceGraph.summary.resources >= 3, true);
assert.equal(rustResourceGraph.summary.loans >= 1, true);
assert.equal(rustResourceGraph.summary.aliases >= 1, true);
assert.equal(rustResourceGraph.summary.unsafeBoundaries >= 2, true);
assert.equal(rustResourceGraph.summary.unsafeBoundariesWithoutProof >= 2, true);
assert.equal(rustResourceGraph.claims.borrowCheckerClaim, false);
assert.equal(querySemanticResourceGraph(rustResourceGraph, { kind: 'loan', resourceId: rustResourceGraph.loans[0].resourceId }).length, 1);
assert.equal(querySemanticResourceGraph(rustResourceGraph, { unsafe: true }).length >= 2, true);
assert.equal(rustResourceSidecar.graphLayers.layers.resourceAliasLifetime.status, 'blocked');

const cResourceImport = importNativeSource({
  language: 'c',
  sourcePath: 'src/native.c',
  sourceText: [
    '#include <stdlib.h>',
    'int read_buffer(char *buffer, const char *name) {',
    '  char *copy = malloc(64);',
    '  free(copy);',
    '  return buffer[0] + name[0];',
    '}',
    ''
  ].join('\n')
});
const cResourceSidecar = createSemanticImportSidecar(cResourceImport, { generatedAt: 142 });
const cResourceGraph = cResourceSidecar.resourceGraph;

assert.equal(cResourceGraph.status, 'blocked');
assert.equal(cResourceGraph.summary.resources >= 4, true);
assert.equal(cResourceGraph.summary.aliases >= 2, true);
assert.equal(cResourceGraph.summary.drops >= 1, true);
assert.equal(cResourceGraph.summary.unsafeBoundaries >= 3, true);
assert.equal(cResourceGraph.summary.unsafeBoundariesWithoutProof >= 3, true);
assert.equal(querySemanticResourceGraph(cResourceGraph, { kind: 'drop' }).length >= 1, true);
assert.equal(querySemanticResourceGraph(cResourceGraph, { unsafe: true }).length >= 3, true);
assert.equal(cResourceSidecar.graphLayers.layers.resourceAliasLifetime.status, 'blocked');
