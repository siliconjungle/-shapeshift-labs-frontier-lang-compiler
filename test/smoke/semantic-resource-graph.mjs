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

const rustOwnershipImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/ownership.rs',
  sourceText: [
    'pub fn ownership() -> usize {',
    '  let owned = String::from("a");',
    '  let shared = &owned;',
    '  let len = shared.len();',
    '  let moved = owned;',
    '  drop(moved);',
    '  len',
    '}',
    ''
  ].join('\n')
});
const rustOwnershipGraph = createSemanticImportSidecar(rustOwnershipImport, { generatedAt: 141.5 }).resourceGraph;

assert.equal(rustOwnershipGraph.status, 'partial');
assert.equal(rustOwnershipGraph.summary.resources >= 3, true);
assert.equal(rustOwnershipGraph.summary.loans >= 1, true);
assert.equal(rustOwnershipGraph.summary.moves >= 1, true);
assert.equal(rustOwnershipGraph.summary.drops >= 3, true);
assert.equal(rustOwnershipGraph.resources.some((record) => record.resourceKind === 'rust-owned-local-binding'), true);
assert.equal(rustOwnershipGraph.loans.some((record) => record.mode === 'shared' && record.metadata?.borrowedBinding === 'owned'), true);
assert.equal(rustOwnershipGraph.moves.some((record) => record.metadata?.fromBinding === 'owned' && record.metadata?.toBinding === 'moved'), true);
assert.equal(rustOwnershipGraph.drops.some((record) => record.dropKind === 'rust-explicit-drop'), true);
assert.equal(rustOwnershipGraph.claims.borrowCheckerClaim, false);

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

const cppResourceImport = importNativeSource({
  language: 'cpp',
  sourcePath: 'src/native.cpp',
  sourceText: [
    '#include <memory>',
    '#include <mutex>',
    'void process(Buffer& input, const Buffer& readOnly) {',
    '  std::unique_ptr<Buffer> owned = std::make_unique<Buffer>();',
    '  std::shared_ptr<Buffer> shared = std::make_shared<Buffer>();',
    '  Buffer* raw = new Buffer();',
    '  std::lock_guard<std::mutex> lock(globalMutex);',
    '  delete raw;',
    '}',
    ''
  ].join('\n')
});
const cppResourceSidecar = createSemanticImportSidecar(cppResourceImport, { generatedAt: 143 });
const cppResourceGraph = cppResourceSidecar.resourceGraph;

assert.equal(cppResourceGraph.status, 'blocked');
assert.equal(cppResourceGraph.summary.resources >= 7, true);
assert.equal(cppResourceGraph.summary.loans >= 1, true);
assert.equal(cppResourceGraph.summary.aliases >= 3, true);
assert.equal(cppResourceGraph.summary.drops >= 4, true);
assert.equal(cppResourceGraph.summary.unsafeBoundaries >= 4, true);
assert.equal(cppResourceGraph.summary.unsafeBoundariesWithoutProof >= 4, true);
assert.equal(cppResourceGraph.resources.some((record) => record.resourceKind === 'cpp-unique-owner-resource'), true);
assert.equal(cppResourceGraph.resources.some((record) => record.resourceKind === 'cpp-raii-local-resource'), true);
assert.equal(cppResourceGraph.drops.some((record) => record.dropKind === 'cpp-delete'), true);
assert.equal(querySemanticResourceGraph(cppResourceGraph, { unsafe: true }).length >= 4, true);
assert.equal(cppResourceSidecar.graphLayers.layers.resourceAliasLifetime.status, 'blocked');

const javaResourceImport = importNativeSource({
  language: 'java',
  sourcePath: 'src/Reader.java',
  sourceText: [
    'class Reader {',
    '  void read(Path path) throws Exception {',
    '    try (BufferedReader reader = Files.newBufferedReader(path)) {',
    '      reader.readLine();',
    '    }',
    '  }',
    '}',
    ''
  ].join('\n')
});
const javaResourceGraph = createSemanticImportSidecar(javaResourceImport, { generatedAt: 144 }).resourceGraph;

assert.equal(javaResourceGraph.status, 'partial');
assert.equal(javaResourceGraph.summary.resources >= 1, true);
assert.equal(javaResourceGraph.summary.drops >= 1, true);
assert.equal(javaResourceGraph.drops.some((record) => record.dropKind === 'java-auto-close'), true);
assert.equal(querySemanticResourceGraph(javaResourceGraph, { kind: 'drop' }).length >= 1, true);

const managedProjectGraph = createSemanticResourceGraph({
  imports: [
    importNativeSource({ language: 'csharp', sourcePath: 'src/Reader.cs', sourceText: 'using var reader = File.OpenText(path);\nreader.ReadLine();\n' }),
    importNativeSource({ language: 'go', sourcePath: 'reader.go', sourceText: 'func read(file *os.File) {\n  defer file.Close()\n}\n' }),
    importNativeSource({ language: 'kotlin', sourcePath: 'Reader.kt', sourceText: 'fun read(path: Path) {\n  inputStream.use { stream -> stream.read() }\n}\n' })
  ]
});

assert.equal(managedProjectGraph.status, 'partial');
assert.equal(managedProjectGraph.summary.resources >= 3, true);
assert.equal(managedProjectGraph.summary.drops >= 3, true);
assert.equal(managedProjectGraph.drops.some((record) => record.dropKind === 'csharp-dispose'), true);
assert.equal(managedProjectGraph.drops.some((record) => record.dropKind === 'go-defer-close'), true);
assert.equal(managedProjectGraph.drops.some((record) => record.dropKind === 'kotlin-auto-close'), true);

const swiftResourceImport = importNativeSource({
  language: 'swift',
  sourcePath: 'Sources/Native.swift',
  sourceText: [
    'func read(file: FileHandle) {',
    '  defer { file.close() }',
    '  let pointer: UnsafePointer<Int> = buffer.baseAddress!',
    '  _ = pointer.pointee',
    '}',
    ''
  ].join('\n')
});
const swiftResourceGraph = createSemanticImportSidecar(swiftResourceImport, { generatedAt: 145 }).resourceGraph;

assert.equal(swiftResourceGraph.status, 'blocked');
assert.equal(swiftResourceGraph.summary.resources >= 2, true);
assert.equal(swiftResourceGraph.summary.drops >= 1, true);
assert.equal(swiftResourceGraph.summary.aliases >= 1, true);
assert.equal(swiftResourceGraph.summary.unsafeBoundariesWithoutProof >= 1, true);
assert.equal(swiftResourceGraph.drops.some((record) => record.dropKind === 'swift-defer-close'), true);
assert.equal(swiftResourceGraph.resources.some((record) => record.resourceKind === 'swift-unsafe-pointer-resource'), true);
