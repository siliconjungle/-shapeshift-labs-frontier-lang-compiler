import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as compilerApi from '../dist/index.js';
import {
  compileFrontierSource,
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeImportResultContract,
  createProjectionTargetLossMatrix,
  createNativeSourcePreservation,
  createSemanticImportSidecar,
  createTreeSitterNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  createUniversalAstFromDocument,
  diffNativeSourceImports,
  diffNativeSources,
  emitForTarget,
  emitForTargetWithSourceMap,
  importNativeProject,
  importNativeSource,
  NativeImportLanguageProfiles,
  NativeImportLossKinds,
  NativeImportRegionTaxonomyKinds,
  NativeImportRoundtripReadinessStatuses,
  NativeImportTaxonomyKinds,
  ProjectionTargetLossClasses,
  normalizeCompileTarget,
  projectNativeImportToSource,
  projectFrontierAst,
  readUniversalAstJson,
  renderTargetAst,
  renderTargetAstWithSourceMap,
  resolveCapabilityAdapters,
  runNativeImporterAdapter,
  classifyNativeImportRoundtripReadiness,
  classifyNativeImportReadiness,
  compileNativeSource,
  summarizeNativeImportLosses,
  writeUniversalAstJson
} from '../dist/index.js';

const publicRuntimeExports = Object.keys(compilerApi).sort();
const publicDeclarationExports = publicValueExportsFromDeclaration(new URL('../dist/index.d.ts', import.meta.url));
assert.deepEqual(publicRuntimeExports, publicDeclarationExports);
for (const requiredExport of [
  'NativeImportRegionTaxonomyKinds',
  'ProjectionTargetLossClasses',
  'createNativeImportResultContract',
  'createProjectionTargetLossMatrix',
  'classifyNativeImportRoundtripReadiness',
  'compileNativeSource',
  'createSemanticImportSidecar',
  'diffNativeSourceImports',
  'diffNativeSources',
  'emitForTargetWithSourceMap',
  'importNativeSource',
  'importNativeProject',
  'renderTargetAstWithSourceMap'
]) {
  assert.equal(publicRuntimeExports.includes(requiredExport), true, `missing public export ${requiredExport}`);
}

const source = `
module TodoApp @id("mod_todo")

type TodoId @id("type_todo_id") {
  = Text
}

type TodoInput @id("type_todo_input") {
  title: Text
}

lattice TagSet @id("lat_tags") {
  carrier Set<Text>
  laws semilattice, commutative
  frontierCrdt createCrdtOrSetLattice
}

capability HttpRequest @id("cap_http") {
  capability http.request
  category network
  input Json
  returns Json
  adapter typescript symbol fetch platform node package undici kind library
  adapter rust symbol reqwest::Client::execute platform native package reqwest kind library
  unsupported c platform embedded reason "requires a host socket adapter"
}

entity Todo @id("ent_todo") {
  title @id("field_title"): Text
  tags @id("field_tags"): Set<Text> {
    merge union lattice lat_tags crdt or-set
  }
}

state TodoDb @id("state_todo") {
  todos @id("collection_todos"): Map<TodoId, Todo>
}

action addTodo @id("action_add") {
  input TodoInput
  uses http.request
  writes field_tags
  returns Patch
}
`;

assert.equal(normalizeCompileTarget('ts'), 'typescript');
const result = compileFrontierSource(source, { target: 'typescript' });
assert.equal(result.ok, true);
assert.match(result.hash, /^fnv1a32:/);
assert.equal(result.ast.kind, 'typescript.module');
assert.equal(renderTargetAst(result.ast, 'typescript'), result.output);
assert.match(result.output, /export interface Todo/);
assert.match(emitForTarget(result.document, 'javascript'), /export const TodoSchema/);
const javascriptMappedOutput = emitForTargetWithSourceMap(result.document, 'javascript', { targetPath: 'todo.js' });
assert.match(javascriptMappedOutput.code, /export const TodoSchema/);
assert.equal(javascriptMappedOutput.ast.kind, 'javascript.module');
assert.equal(javascriptMappedOutput.sourceMap.target.language, 'javascript');
assert.equal(javascriptMappedOutput.sourceMap.targetPath, 'todo.js');
assert.equal(javascriptMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
const rustMappedOutput = renderTargetAstWithSourceMap(projectFrontierAst(result.document, 'rust'), 'rust', { targetPath: 'todo.rs' });
assert.match(rustMappedOutput.code, /pub struct Todo/);
assert.equal(rustMappedOutput.sourceMap.target.language, 'rust');
assert.equal(rustMappedOutput.sourceMap.mappings.some((mapping) => mapping.semanticNodeId === 'ent_todo'), true);
assert.equal(projectFrontierAst(result.document, 'javascript').kind, 'javascript.module');
assert.equal(projectFrontierAst(result.document, 'rust').kind, 'rust.module');
assert.equal(projectFrontierAst(result.document, 'python').kind, 'python.module');
assert.equal(projectFrontierAst(result.document, 'c').kind, 'c.header');
assert.equal(resolveCapabilityAdapters(result.document, 'typescript', { platform: 'node' })[0].status, 'bound');
assert.equal(resolveCapabilityAdapters(result.document, 'rust', { platform: 'native' })[0].adapters[0].symbol, 'reqwest::Client::execute');
assert.equal(resolveCapabilityAdapters(result.document, 'c', { platform: 'embedded' })[0].status, 'unsupported');
const nativeImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/todo.js',
  rootId: 'program',
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_add'] },
    fn_add: { id: 'fn_add', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/todo.js', startLine: 1, endLine: 3 } }
  },
  semanticIndex: {
    kind: 'frontier.lang.semanticIndex',
    version: 1,
    id: 'index_todo_js',
    documents: [{ id: 'doc_todo_js', path: 'src/todo.js', language: 'javascript', nativeSourceId: 'native_source_src_todo_js' }],
    symbols: [{ id: 'symbol:addTodo', scheme: 'frontier', name: 'addTodo', kind: 'function', language: 'javascript', nativeAstNodeId: 'fn_add' }],
    occurrences: [{ id: 'occ_add_def', documentId: 'doc_todo_js', symbolId: 'symbol:addTodo', role: 'definition', nativeAstNodeId: 'fn_add' }],
    relations: [{ id: 'rel_doc_defines_add', sourceId: 'doc_todo_js', predicate: 'defines', targetId: 'symbol:addTodo' }],
    facts: []
  },
  losses: [{ id: 'loss_body', severity: 'warning', kind: 'opaqueNative', message: 'Function body retained as native AST.' }]
});
assert.equal(nativeImport.kind, 'frontier.lang.importResult');
assert.equal(nativeImport.nativeSource.kind, 'nativeSource');
assert.equal(nativeImport.semanticIndex.symbols[0].id, 'symbol:addTodo');
assert.equal(nativeImport.universalAst.semanticIndex.id, 'index_todo_js');
assert.equal(nativeImport.sourceMaps[0].kind, 'frontier.lang.sourceMap');
assert.equal(nativeImport.sourceMaps[0].mappings[0].nativeAstNodeId, 'fn_add');
assert.equal(nativeImport.universalAst.sourceMaps[0].id, nativeImport.sourceMaps[0].id);
assert.equal(nativeImport.patch.operations[0].op, 'upsertNode');
assert.equal(nativeImport.evidence[0].status, 'passed');
assert.equal(nativeImport.mergeCandidates.length, 1);
assert.equal(nativeImport.mergeCandidates[0].kind, 'frontier.lang.semanticMergeCandidate');
assert.equal(nativeImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(nativeImport.mergeCandidates[0].metadata.nativeImportLossSummary.categories.includes('opaqueBodies'), true);
for (const taxonomyKind of ['conditionalCompilation', 'reflection', 'overloadTypeInference', 'commentsTrivia', 'targetProjectionLoss']) {
  assert.equal(NativeImportTaxonomyKinds.includes(taxonomyKind), true);
}
assert.equal(NativeImportLossKinds.includes('unverifiedNativeAst'), true);
const nativeLossSummary = summarizeNativeImportLosses(nativeImport.losses, { evidence: nativeImport.evidence });
assert.equal(nativeLossSummary.highestSeverity, 'warning');
assert.equal(classifyNativeImportReadiness(nativeImport.losses).readiness, 'needs-review');
const adapterImport = await runNativeImporterAdapter({
  id: 'fixture-estree-importer',
  language: 'javascript',
  parser: 'estree',
  version: '1.0.0',
  capabilities: ['nativeAst', 'diagnostics'],
  supportedExtensions: ['js', '.mjs'],
  diagnostics: [{ severity: 'info', code: 'adapter.ready', message: 'Fixture adapter is available.' }],
  parse(input) {
    assert.equal(input.adapterId, 'fixture-estree-importer');
    assert.equal(input.language, 'javascript');
    assert.equal(input.parser, 'estree');
    assert.equal(input.parserVersion, '1.0.0');
    assert.equal(input.sourceHash.startsWith('fnv1a32:'), true);
    assert.equal(input.options.mode, 'smoke');
    return {
      rootId: 'adapter_program',
      nodes: {
        adapter_program: { id: 'adapter_program', kind: 'Program', languageKind: 'ESTree.Program', children: ['adapter_fn'] },
        adapter_fn: { id: 'adapter_fn', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }
      },
      diagnostics: [{ severity: 'warning', code: 'adapter.opaqueBody', kind: 'opaqueNative', message: 'Function body retained as native AST.', span: { path: input.sourcePath, startLine: 1, endLine: 1 } }]
    };
  }
}, {
  sourcePath: 'src/adapter.js',
  sourceText: 'export function fromAdapter() { return true; }\n',
  adapterOptions: { mode: 'smoke' },
  metadata: { requestId: 'adapter-smoke' }
});
assert.equal(adapterImport.kind, 'frontier.lang.importResult');
assert.equal(adapterImport.adapter.id, 'fixture-estree-importer');
assert.deepEqual(adapterImport.adapter.capabilities, ['nativeAst', 'diagnostics']);
assert.deepEqual(adapterImport.adapter.supportedExtensions, ['.js', '.mjs']);
assert.equal(adapterImport.adapter.coverage.exactness, 'adapter-reported-native-ast');
assert.equal(adapterImport.adapter.coverage.tokens, false);
assert.equal(adapterImport.adapter.coverage.trivia, false);
assert.equal(adapterImport.adapter.coverage.diagnostics, true);
assert.equal(adapterImport.adapter.coverage.sourceRanges, true);
assert.equal(adapterImport.adapter.coverage.generatedRanges, false);
assert.equal(adapterImport.adapter.coverage.semanticCoverage.level, 'native-ast');
assert.equal(adapterImport.adapter.coverage.observed.diagnostics, 2);
const adapterCoverageEvidence = adapterImport.adapter.coverage.capabilityEvidence;
assert.equal(adapterCoverageEvidence.declared.exactAst, false);
assert.equal(adapterCoverageEvidence.observed.exactness, 'adapter-reported-native-ast');
assert.equal(adapterCoverageEvidence.parserDiagnostics.declared, true);
assert.equal(adapterCoverageEvidence.parserDiagnostics.observed, true);
assert.equal(adapterCoverageEvidence.parserDiagnostics.count, 2);
assert.equal(adapterCoverageEvidence.sourceRanges.declared, false);
assert.equal(adapterCoverageEvidence.sourceRanges.observed, true);
assert.equal(adapterCoverageEvidence.observedOnly.includes('sourceRanges'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('tokens'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('trivia'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('references'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('types'), true);
assert.equal(adapterCoverageEvidence.gaps.includes('controlFlow'), true);
assert.equal(adapterImport.nativeAst.parser, 'estree');
assert.equal(adapterImport.nativeAst.parserVersion, '1.0.0');
assert.equal(adapterImport.nativeAst.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.nativeAst.metadata.adapterCoverage.sourceRanges, true);
assert.equal(adapterImport.sourceMaps[0].mappings.some((mapping) => mapping.nativeAstNodeId === 'adapter_fn'), true);
assert.equal(adapterImport.metadata.adapterId, 'fixture-estree-importer');
assert.equal(adapterImport.metadata.adapterCoverage.exactness, 'adapter-reported-native-ast');
assert.equal(adapterImport.metadata.requestId, 'adapter-smoke');
assert.equal(adapterImport.diagnostics.length, 2);
assert.equal(adapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.losses.some((loss) => loss.metadata?.diagnosticCode === 'adapter.opaqueBody'), true);
assert.equal(adapterImport.evidence.some((record) => record.id === 'evidence_fixture_estree_importer_native_importer_adapter' && record.status === 'passed'), true);
assert.equal(adapterImport.evidence.find((record) => record.id === 'evidence_fixture_estree_importer_native_importer_adapter').metadata.coverage.sourceRanges, true);
const failedAdapterImport = await runNativeImporterAdapter({
  id: 'throwing-typescript-importer',
  language: 'typescript',
  parser: 'typescript-compiler-api',
  parse() {
    throw new Error('fixture parser failure');
  }
}, {
  sourcePath: 'src/broken.ts',
  sourceText: 'export const = ;\n'
});
assert.equal(failedAdapterImport.kind, 'frontier.lang.importResult');
assert.equal(failedAdapterImport.nativeAst.rootId, 'adapter_error_root');
assert.equal(failedAdapterImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parse.threw'), true);
assert.equal(failedAdapterImport.losses.some((loss) => loss.severity === 'error'), true);
assert.equal(failedAdapterImport.evidence.some((record) => record.id === 'evidence_throwing_typescript_importer_native_importer_adapter' && record.status === 'failed'), true);
function publicValueExportsFromDeclaration(url) {
  const text = readFileSync(url, 'utf8');
  const names = [];
  for (const match of text.matchAll(/^export declare (?:const|function) ([A-Za-z_$][\w$]*)/gm)) {
    names.push(match[1]);
  }
  return names.sort();
}
function assertScannedSymbol(importResult, symbolName, idPart = symbolName.toLowerCase()) {
  assert.equal(importResult.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(importResult.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes(idPart)), true);
  assert.equal(importResult.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
}
function symbolByName(importResult, name) {
  return importResult.semanticIndex.symbols.find((symbol) => symbol.name === name);
}
function mappedSymbol(importResult, symbolId) {
  return importResult.sourceMaps[0].mappings.find((mapping) => mapping.semanticSymbolId === symbolId);
}
function nativeNodeForSymbol(importResult, name) {
  const symbol = symbolByName(importResult, name);
  assert.ok(symbol, `expected scanned symbol ${name}`);
  return importResult.nativeAst.nodes[symbol.nativeAstNodeId];
}
const readinessRank = {
  ready: 0,
  'ready-with-losses': 1,
  'needs-review': 2,
  blocked: 3
};
function assertExactAdapterOutranksScanner(adapterImport, scannerImport, symbolName) {
  const adapterSummary = adapterImport.metadata.nativeImportLossSummary;
  const scannerSummary = scannerImport.metadata.nativeImportLossSummary;
  assert.equal(adapterImport.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(scannerImport.semanticIndex.symbols.some((symbol) => symbol.name === symbolName), true);
  assert.equal(adapterSummary.exactAst, true);
  assert.equal(adapterSummary.semanticMergeReadiness, 'ready');
  assert.equal(adapterImport.mergeCandidates[0].readiness, 'ready');
  assert.equal(adapterImport.losses.length, 0);
  assert.equal(adapterSummary.categories.includes('exactAstImport'), true);
  assert.equal(scannerSummary.exactAst, false);
  assert.equal(scannerSummary.semanticMergeReadiness, 'needs-review');
  assert.equal(scannerImport.mergeCandidates[0].readiness, 'needs-review');
  assert.equal(scannerImport.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
  assert.equal(scannerImport.losses.some((loss) => loss.kind === 'sourcePreservation'), true);
  assert.equal(scannerSummary.categories.includes('declarationsOnly'), true);
  assert.equal(scannerSummary.categories.includes('sourcePreservation'), true);
  assert.equal(
    readinessRank[adapterSummary.semanticMergeReadiness] < readinessRank[scannerSummary.semanticMergeReadiness],
    true
  );
}
const estreeFixtureSource = 'export function fromEstree() { return true; }\n';
const estreeAdapterImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath: 'src/estree.js',
  sourceText: estreeFixtureSource,
  adapterOptions: {
    ast: {
      type: 'Program',
      sourceType: 'module',
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 45 } },
      body: [{
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'fromEstree', loc: { start: { line: 1, column: 16 }, end: { line: 1, column: 26 } } },
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 45 } },
        body: { type: 'BlockStatement', body: [], loc: { start: { line: 1, column: 29 }, end: { line: 1, column: 45 } } }
      }]
    }
  }
});
assert.equal(estreeAdapterImport.adapter.parser, 'estree');
assert.equal(estreeAdapterImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(estreeAdapterImport.adapter.coverage.exactAst, true);
assert.equal(estreeAdapterImport.adapter.coverage.tokens, false);
assert.equal(estreeAdapterImport.adapter.coverage.trivia, false);
assert.equal(estreeAdapterImport.adapter.coverage.diagnostics, true);
assert.equal(estreeAdapterImport.adapter.coverage.sourceRanges, true);
assert.equal(estreeAdapterImport.adapter.coverage.generatedRanges, false);
assert.equal(estreeAdapterImport.adapter.coverage.semanticCoverage.level, 'declaration-index');
assert.equal(estreeAdapterImport.adapter.coverage.semanticCoverage.symbols, true);
assert.equal(estreeAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromEstree'), true);
assert.equal(estreeAdapterImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('fromestree')), true);
const scannedEstreeFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/estree.js',
  sourceText: estreeFixtureSource
});
assertExactAdapterOutranksScanner(estreeAdapterImport, scannedEstreeFixtureImport, 'fromEstree');
const babelFixtureSource = 'export function fromBabel(value: string) { return value; }\n';
const babelAdapterImport = await runNativeImporterAdapter(createBabelNativeImporterAdapter({
  parserModule: {
    parse(sourceText, options) {
      assert.equal(options.sourceFilename, 'src/babel.ts');
      assert.equal(sourceText.includes('fromBabel'), true);
      return {
        type: 'File',
        program: {
          type: 'Program',
          sourceType: 'module',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } },
          body: [{
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: 'fromBabel' },
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 48 } }
          }]
        },
        errors: []
      };
    }
  }
}), {
  sourcePath: 'src/babel.ts',
  sourceText: babelFixtureSource
});
assert.equal(babelAdapterImport.adapter.parser, 'babel');
assert.equal(babelAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromBabel'), true);
const scannedBabelFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/babel.ts',
  sourceText: babelFixtureSource
});
assertExactAdapterOutranksScanner(babelAdapterImport, scannedBabelFixtureImport, 'fromBabel');
const malformedBabelImport = await runNativeImporterAdapter(createBabelNativeImporterAdapter({
  parserModule: {
    parse(sourceText, options) {
      assert.equal(options.sourceFilename, 'src/malformed-babel.ts');
      assert.equal(sourceText, 'export function broken( {\n');
      return {
        type: 'File',
        program: {
          type: 'Program',
          sourceType: 'module',
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 26 } },
          body: []
        },
        errors: [{
          reasonCode: 'UnexpectedToken',
          message: 'Unexpected token, expected ")"',
          loc: { line: 1, column: 24 }
        }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed-babel.ts',
  sourceText: 'export function broken( {\n'
});
assert.equal(malformedBabelImport.diagnostics.some((diagnostic) => diagnostic.severity === 'error' && diagnostic.code === 'UnexpectedToken'), true);
assert.equal(malformedBabelImport.losses.some((loss) => loss.severity === 'error' && loss.kind === 'unsupportedSyntax' && loss.metadata?.diagnosticCode === 'UnexpectedToken'), true);
assert.equal(malformedBabelImport.evidence.some((record) => record.status === 'failed' && record.metadata?.errors === 1), true);
assert.equal(malformedBabelImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
assert.equal(malformedBabelImport.mergeCandidates[0].readiness, 'blocked');
assert.equal(malformedBabelImport.patch.risk, 'high');
const tsMock = {
  ScriptTarget: { Latest: 99 },
  ScriptKind: { TS: 3 },
  SyntaxKind: { 0: 'SourceFile', 1: 'FunctionDeclaration', 2: 'Identifier' },
  createSourceFile(fileName, sourceText) {
    const sourceFile = {
      kind: 0,
      fileName,
      pos: 0,
      end: sourceText.length,
      getLineAndCharacterOfPosition(position) {
        return { line: 0, character: position };
      }
    };
    sourceFile.children = [{
      kind: 1,
      pos: 0,
      end: sourceText.length,
      name: { kind: 2, escapedText: 'fromTs' },
      children: []
    }];
    return sourceFile;
  },
  forEachChild(node, visit) {
    for (const child of node.children ?? []) visit(child);
  }
};
const tsFixtureSource = 'export function fromTs(): boolean { return true; }\n';
const tsAdapterImport = await runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({ typescript: tsMock }), {
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assert.equal(tsAdapterImport.adapter.parser, 'typescript-compiler-api');
assert.equal(tsAdapterImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fromTs'), true);
const scannedTsFixtureImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/ts.ts',
  sourceText: tsFixtureSource
});
assertExactAdapterOutranksScanner(tsAdapterImport, scannedTsFixtureImport, 'fromTs');
const treeName = {
  type: 'identifier',
  text: 'from_tree',
  startPosition: { row: 0, column: 9 },
  endPosition: { row: 0, column: 18 },
  namedChildren: []
};
const treeRoot = {
  type: 'source_file',
  startPosition: { row: 0, column: 0 },
  endPosition: { row: 0, column: 22 },
  namedChildren: [{
    type: 'function_declaration',
    startPosition: { row: 0, column: 0 },
    endPosition: { row: 0, column: 22 },
    namedChildren: [treeName],
    childForFieldName(field) {
      return field === 'name' ? treeName : null;
    }
  }]
};
const treeFixtureSource = 'function from_tree() {}\n';
const treeImport = await runNativeImporterAdapter(createTreeSitterNativeImporterAdapter({
  language: 'javascript',
  tree: { rootNode: treeRoot }
}), {
  sourcePath: 'src/tree.js',
  sourceText: treeFixtureSource
});
assert.equal(treeImport.adapter.parser, 'tree-sitter');
assert.equal(treeImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_tree'), true);
const scannedTreeFixtureImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/tree.js',
  sourceText: treeFixtureSource
});
assertExactAdapterOutranksScanner(treeImport, scannedTreeFixtureImport, 'from_tree');
const projectImport = await importNativeProject({
  id: 'project_smoke',
  projectRoot: 'src',
  adapters: [createEstreeNativeImporterAdapter()],
  sources: [{
    language: 'javascript',
    adapter: 'frontier.estree-native-importer',
    sourcePath: 'src/project.js',
    sourceText: 'export function projectJs() {}\n',
    adapterOptions: {
      ast: {
        type: 'Program',
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 30 } },
        body: [{
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'projectJs' },
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 30 } }
        }]
      }
    }
  }, {
    language: 'python',
    sourcePath: 'project.py',
    sourceText: 'def project_py():\n    return True\n'
  }]
});
assert.equal(projectImport.kind, 'frontier.lang.projectImportResult');
assert.equal(projectImport.imports.length, 2);
assert.equal(projectImport.nativeSources.length, 2);
assert.equal(projectImport.semanticIndex.symbols.some((symbol) => symbol.name === 'projectJs'), true);
assert.equal(projectImport.semanticIndex.symbols.some((symbol) => symbol.name === 'project_py'), true);
assert.equal(projectImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(projectImport.metadata.sourcePreservationSummary.total, 2);
assert.equal(projectImport.metadata.sourcePreservationSummary.exactSourceAvailable, 2);
assert.equal(projectImport.metadata.importResultContract.kind, 'frontier.lang.nativeImportResultContract');
assert.equal(projectImport.metadata.importResultContract.sourceCount, 2);
assert.equal(projectImport.metadata.importResultContract.sources.length, 2);
assert.equal(projectImport.metadata.importResultContract.sourcePreservation.exactSourceAvailable, 2);
assert.equal(projectImport.metadata.importResultContract.sourceMaps.total >= 2, true);
assert.equal(projectImport.universalAst.metadata.sourcePreservationSummary.total, 2);
const scannedJsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/scanned.js',
  sourceText: '// kept comment\nimport { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\nexport const TODO_LIMIT = 128;\nexport class TodoStore {\n  save(title) { return addTodo(title); }\n}\n'
});
assert.equal(scannedJsImport.nativeAst.rootId, 'native_root');
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TODO_LIMIT'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore.save'), true);
assert.equal(scannedJsImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.ownershipRegionId), true);
assert.equal(scannedJsImport.losses.some((loss) => loss.kind === 'opaqueNative'), true);
const scannedLossKinds = scannedJsImport.losses.map((loss) => loss.kind);
assert.equal(scannedLossKinds.includes('declarationOnlyCoverage'), true);
assert.equal(scannedLossKinds.includes('partialSemanticIndex'), true);
assert.equal(scannedLossKinds.includes('sourceMapApproximation'), true);
assert.equal(scannedLossKinds.includes('sourcePreservation'), true);
assert.equal(scannedJsImport.mergeCandidates[0].readiness, 'needs-review');
assert.equal(scannedJsImport.metadata.nativeImportLossSummary.categories.includes('sourcePreservation'), true);
assert.equal(scannedJsImport.metadata.sourcePreservation.kind, 'frontier.lang.nativeSourcePreservation');
assert.equal(scannedJsImport.metadata.sourcePreservation.sourceText, scannedJsImport.nativeSource.metadata.sourcePreservation.sourceText);
assert.equal(scannedJsImport.metadata.sourcePreservation.summary.comments >= 1, true);
assert.equal(scannedJsImport.metadata.sourcePreservation.summary.directives >= 1, true);
assert.equal(scannedJsImport.nativeAst.metadata.sourcePreservationSummary.exactSourceAvailable, true);
assert.equal(scannedJsImport.metadata.importResultContract.kind, 'frontier.lang.nativeImportResultContract');
assert.equal(scannedJsImport.metadata.importResultContract.sourceCount, 1);
assert.equal(scannedJsImport.metadata.importResultContract.sourcePreservation.exactSourceAvailable, 1);
assert.equal(scannedJsImport.metadata.importResultContract.regions.total >= 4, true);
assert.equal(scannedJsImport.metadata.importResultContract.regions.taxonomy.presentKinds.includes('import'), true);
assert.equal(scannedJsImport.metadata.importResultContract.sourceMaps.mappingCount >= 4, true);
assert.equal(scannedJsImport.metadata.importResultContract.readiness.semanticMergeReadiness, 'needs-review');
assert.equal(createNativeImportResultContract(scannedJsImport).ids.semanticSidecarIds.length, 1);
const standalonePreservation = createNativeSourcePreservation({
  language: 'python',
  sourcePath: 'tools/preserve.py',
  sourceText: '# kept\nfrom sys import path\nvalue = 1\n'
});
assert.equal(standalonePreservation.summary.comments, 1);
assert.equal(standalonePreservation.summary.directives, 1);
assert.equal(standalonePreservation.sourceHash.startsWith('fnv1a32:'), true);
const staleDeclaredPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/stale-declared.js',
  sourceText: 'export const staleDeclared = true;\n',
  sourceHash: 'fnv1a32:not_the_real_hash'
});
assert.notEqual(staleDeclaredPreservation.sourceHash, 'fnv1a32:not_the_real_hash');
assert.equal(staleDeclaredPreservation.metadata.declaredSourceHash, 'fnv1a32:not_the_real_hash');
assert.equal(staleDeclaredPreservation.metadata.sourceHashVerified, false);
const compactPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/compact.js',
  sourceText: '// compact\nimport x from "x";\nexport const y = x;\n',
  includeTokens: false,
  includeTrivia: false,
  maxDirectives: 1
});
assert.equal(compactPreservation.tokens.length, 0);
assert.equal(compactPreservation.trivia.length, 0);
assert.equal(compactPreservation.directives.length, 1);
assert.equal(compactPreservation.summary.truncated, true);
const scannedJsSidecar = createSemanticImportSidecar(scannedJsImport, { generatedAt: 123, targetPath: 'dist/scanned.js' });
assert.equal(scannedJsSidecar.kind, 'frontier.lang.semanticImportSidecar');
assert.equal(scannedJsSidecar.generatedAt, 123);
assert.equal(scannedJsSidecar.summary.emptySemanticIndex, false);
assert.ok(scannedJsSidecar.summary.symbols >= 4);
assert.ok(scannedJsSidecar.ownershipRegions.length >= 4);
assert.equal(NativeImportRegionTaxonomyKinds.includes('import'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('import'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('body') || scannedJsSidecar.regionTaxonomy.presentKinds.includes('type'), true);
assert.equal(scannedJsSidecar.summary.regionKinds >= 2, true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.name === 'TodoStore.save' && symbol.ownershipRegionId), true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.ownershipRegionKind), true);
assert.equal(scannedJsSidecar.imports.some((entry) => entry.regionTaxonomy?.presentKinds?.length), true);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.supportedOperations.includes('replace-import')), true);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.sourcePath === 'src/scanned.js' && hint.projection.targetPath === 'dist/scanned.js'), true);
const jsChangeSet = diffNativeSources({
  language: 'javascript',
  sourcePath: 'src/change.js',
  beforeSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\n',
  afterSourceText: 'import { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title, done: false }; }\nexport const TODO_LIMIT = 128;\n'
});
assert.equal(jsChangeSet.kind, 'frontier.lang.nativeSourceChangeSet');
assert.equal(jsChangeSet.summary.sourceChanged, true);
assert.equal(jsChangeSet.summary.modifiedSymbols >= 1, true);
assert.equal(jsChangeSet.summary.addedSymbols, 1);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'addTodo' && symbol.changeKind === 'modified'), true);
assert.equal(jsChangeSet.changedSymbols.some((symbol) => symbol.name === 'TODO_LIMIT' && symbol.changeKind === 'added'), true);
assert.equal(jsChangeSet.changedRegions.length >= 2, true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'upsertNode'), true);
assert.equal(jsChangeSet.patch.operations.some((operation) => operation.op === 'addEvidence'), true);
assert.equal(jsChangeSet.mergeCandidate.kind, 'frontier.lang.semanticMergeCandidate');
assert.equal(jsChangeSet.mergeCandidate.patchId, jsChangeSet.patch.id);
assert.equal(jsChangeSet.mergeCandidate.conflictKeys.some((key) => key.startsWith('region:source#src/change.js')), true);
assert.equal(jsChangeSet.readiness, 'needs-review');
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
assert.equal(unchangedDeclarationChangeSet.summary.symbols, 0);
assert.equal(unchangedDeclarationChangeSet.summary.regions, 1);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].granularity, 'file');
assert.equal(unchangedDeclarationChangeSet.reasons.some((reason) => reason.includes('file-level review')), true);
const preservedNativeSource = 'export function preservedNative() { return true; }\n';
const preservedNativeImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/preserved-native.js',
  sourceText: preservedNativeSource
});
const staleHashImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/stale-hash.js',
  sourceText: preservedNativeSource,
  sourceHash: 'fnv1a32:stale_declared_import_hash'
});
assert.equal(staleHashImport.nativeSource.sourceHash, preservedNativeImport.nativeSource.sourceHash);
assert.equal(staleHashImport.metadata.declaredSourceHash, 'fnv1a32:stale_declared_import_hash');
assert.equal(staleHashImport.metadata.sourceHashVerified, false);
const preservedNativeProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: preservedNativeSource
});
assert.equal(preservedNativeProjection.kind, 'frontier.lang.nativeSourceProjection');
assert.equal(preservedNativeProjection.mode, 'preserved-source');
assert.equal(preservedNativeProjection.sourceText, preservedNativeSource);
assert.equal(preservedNativeProjection.lossSummary.highestSeverity, 'none');
assert.equal(preservedNativeProjection.readiness.readiness, 'ready');
assert.equal(preservedNativeProjection.metadata.sourceHashVerified, true);
assert.equal(preservedNativeProjection.metadata.nativeImportLossSummary.highestSeverity, 'warning');
const autoPreservedScannedProjection = projectNativeImportToSource(scannedJsImport);
assert.equal(autoPreservedScannedProjection.mode, 'preserved-source');
assert.equal(autoPreservedScannedProjection.sourceText, scannedJsImport.metadata.sourcePreservation.sourceText);
assert.equal(autoPreservedScannedProjection.metadata.sourcePreservationId, scannedJsImport.metadata.sourcePreservation.id);
const stubNativeProjection = projectNativeImportToSource(scannedJsImport, { preferPreservedSource: false });
assert.equal(stubNativeProjection.mode, 'native-source-stubs');
assert.match(stubNativeProjection.sourceText, /export function addTodo/);
assert.match(stubNativeProjection.sourceText, /export class TodoStore/);
assert.equal(stubNativeProjection.lossSummary.highestSeverity, 'warning');
assert.equal(stubNativeProjection.losses.some((loss) => loss.kind === 'targetProjectionLoss'), true);
assert.equal(stubNativeProjection.lossSummary.categories.includes('targetProjectionLoss'), true);
assert.equal(stubNativeProjection.readiness.readiness, 'needs-review');
const sameLanguageNativeCompile = compileNativeSource(preservedNativeImport);
assert.equal(sameLanguageNativeCompile.kind, 'frontier.lang.nativeSourceCompileResult');
assert.equal(sameLanguageNativeCompile.target, 'javascript');
assert.equal(sameLanguageNativeCompile.language, 'javascript');
assert.equal(sameLanguageNativeCompile.ok, true);
assert.equal(sameLanguageNativeCompile.outputMode, 'preserved-source');
assert.equal(sameLanguageNativeCompile.output, preservedNativeSource);
assert.equal(sameLanguageNativeCompile.projection.mode, 'preserved-source');
assert.equal(sameLanguageNativeCompile.targetCoverage.supported, true);
assert.equal(sameLanguageNativeCompile.projectionMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= 1, true);
assert.equal(sameLanguageNativeCompile.projectionMatrix.summary.languages >= 1, true);
assert.equal(sameLanguageNativeCompile.readiness.readiness, 'needs-review');
assert.equal(sameLanguageNativeCompile.lossSummary.categories.includes('declarationsOnly'), true);
const sameLanguageNativeCompileWithLosses = compileNativeSource(preservedNativeImport, { emitOnBlocked: true });
assert.equal(sameLanguageNativeCompileWithLosses.ok, true);
const rustNativeCompileBlocked = compileNativeSource(scannedJsImport, { target: 'rust' });
assert.equal(rustNativeCompileBlocked.target, 'rust');
assert.equal(rustNativeCompileBlocked.language, 'javascript');
assert.equal(rustNativeCompileBlocked.ok, false);
assert.equal(rustNativeCompileBlocked.outputMode, 'target-stubs');
assert.equal(rustNativeCompileBlocked.projection.mode, 'native-source-stubs');
assert.match(rustNativeCompileBlocked.output, /pub fn addTodo/);
assert.match(rustNativeCompileBlocked.output, /pub struct TodoStore/);
assert.equal(rustNativeCompileBlocked.targetCoverage.lossClass, 'missingAdapter');
assert.equal(rustNativeCompileBlocked.losses.some((loss) => loss.severity === 'error' && loss.kind === 'targetProjectionLoss'), true);
assert.equal(rustNativeCompileBlocked.readiness.readiness, 'blocked');
const rustNativeCompileEmitted = compileNativeSource(scannedJsImport, { target: 'rust', emitOnBlocked: true });
assert.equal(rustNativeCompileEmitted.ok, true);
const staleNativeProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: 'export function preservedNative() { return false; }\n'
});
assert.equal(staleNativeProjection.mode, 'native-source-stubs');
assert.equal(staleNativeProjection.losses.some((loss) => loss.metadata?.reason === 'source-hash-mismatch'), true);
assert.equal(staleNativeProjection.lossSummary.categories.includes('sourcePreservation'), true);
const staleHashOverrideProjection = projectNativeImportToSource(preservedNativeImport, {
  sourceText: 'export function preservedNative() { return false; }\n',
  sourceHash: preservedNativeImport.nativeSource.sourceHash
});
assert.equal(staleHashOverrideProjection.mode, 'native-source-stubs');
assert.equal(staleHashOverrideProjection.losses.some((loss) => loss.metadata?.declaredSourceHash === preservedNativeImport.nativeSource.sourceHash), true);
const incompleteLightweightJsImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/incomplete.js',
  sourceText: 'export function incomplete(\n'
});
assert.equal(incompleteLightweightJsImport.kind, 'frontier.lang.importResult');
assert.equal(incompleteLightweightJsImport.semanticIndex.symbols.length, 0);
assert.equal(incompleteLightweightJsImport.losses.length > 0, true);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.exactAst, false);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.hasLosses, true);
assert.equal(incompleteLightweightJsImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(incompleteLightweightJsImport.evidence.some((record) => record.metadata?.nativeImportLossSummary?.semanticMergeReadiness === 'needs-review'), true);
assert.equal(incompleteLightweightJsImport.mergeCandidates[0].readiness, 'needs-review');
const unverifiedAstImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/unverified-ast.js',
  rootId: 'program',
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_unverified'] },
    fn_unverified: { id: 'fn_unverified', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/unverified-ast.js', startLine: 1, endLine: 1 } }
  }
});
assert.equal(unverifiedAstImport.metadata.nativeImportLossSummary.exactAst, false);
assert.equal(unverifiedAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(unverifiedAstImport.losses.some((loss) => loss.kind === 'unverifiedNativeAst'), true);
assert.equal(unverifiedAstImport.mergeCandidates[0].readiness, 'needs-review');
const verifiedAstImport = importNativeSource({
  language: 'javascript',
  parser: 'estree',
  sourcePath: 'src/verified-ast.js',
  rootId: 'program',
  exactAst: true,
  nodes: {
    program: { id: 'program', kind: 'Program', languageKind: 'ESTree.Program', children: ['fn_verified'] },
    fn_verified: { id: 'fn_verified', kind: 'FunctionDeclaration', languageKind: 'ESTree.FunctionDeclaration', span: { path: 'src/verified-ast.js', startLine: 1, endLine: 1 } }
  }
});
assert.equal(verifiedAstImport.metadata.nativeImportLossSummary.exactAst, true);
assert.equal(verifiedAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(verifiedAstImport.losses.length, 0);
for (const status of ['exact', 'preserved-source', 'stub-only', 'blocked', 'needs-review']) {
  assert.equal(NativeImportRoundtripReadinessStatuses.includes(status), true);
}
const exactRoundtrip = classifyNativeImportRoundtripReadiness(estreeAdapterImport);
assert.equal(exactRoundtrip.kind, 'frontier.lang.nativeImportRoundtripReadiness');
assert.equal(exactRoundtrip.status, 'exact');
assert.equal(exactRoundtrip.semanticMergeReadiness, 'ready');
assert.equal(exactRoundtrip.projectionMode, 'preserved-source');
assert.equal(exactRoundtrip.checks.nativeImport.exactAst, true);
assert.equal(exactRoundtrip.checks.universalAst.valid, true);
assert.equal(exactRoundtrip.checks.universalAst.sourceMapMappings >= 1, true);
assert.equal(exactRoundtrip.checks.projectedSource.sourceHashVerified, true);
const preservedRoundtrip = classifyNativeImportRoundtripReadiness(scannedJsImport);
assert.equal(preservedRoundtrip.status, 'preserved-source');
assert.equal(preservedRoundtrip.semanticMergeReadiness, 'needs-review');
assert.equal(preservedRoundtrip.projectionMode, 'preserved-source');
assert.equal(preservedRoundtrip.checks.projectedSource.sourceHashVerified, true);
assert.equal(preservedRoundtrip.reasons.some((reason) => reason.includes('preserved')), true);
const stubRoundtrip = classifyNativeImportRoundtripReadiness(scannedJsImport, { projection: stubNativeProjection });
assert.equal(stubRoundtrip.status, 'stub-only');
assert.equal(stubRoundtrip.projectionMode, 'native-source-stubs');
assert.equal(stubRoundtrip.checks.projectedSource.readiness, 'needs-review');
const blockedRoundtrip = classifyNativeImportRoundtripReadiness(failedAdapterImport);
assert.equal(blockedRoundtrip.status, 'blocked');
assert.equal(blockedRoundtrip.semanticMergeReadiness, 'blocked');
assert.equal(blockedRoundtrip.evidence.failedEvidenceIds.length >= 1, true);
const incompleteRoundtrip = classifyNativeImportRoundtripReadiness(incompleteLightweightJsImport);
assert.equal(incompleteRoundtrip.status, 'needs-review');
assert.equal(incompleteRoundtrip.checks.universalAst.semanticSymbols, 0);
assert.equal(incompleteRoundtrip.reasons.some((reason) => reason.includes('semantic index')), true);
assert.throws(() => importNativeSource({
  language: 'javascript',
  sourcePath: 'bad-map.js',
  sourceText: 'export function badMap() {}\n',
  mappings: [{ id: 'map_without_reference', precision: 'unknown' }]
}), /Source-map mapping 1 must reference/);
const scannedPythonImport = importNativeSource({
  language: 'python',
  sourcePath: 'todo.py',
  sourceText: 'import json\nclass TodoStore:\n    pass\ndef add_todo(title):\n    return title\n'
});
assert.equal(scannedPythonImport.semanticIndex.symbols.some((symbol) => symbol.name === 'add_todo'), true);
assert.equal(scannedPythonImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('add_todo')), true);
const scannedRustImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/lib.rs',
  sourceText: 'use std::sync::Arc;\npub struct Todo;\npub fn add_todo(title: String) {}\nmacro_rules! todo_macro { () => {} }\n'
});
assert.equal(scannedRustImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(scannedRustImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('todo')), true);
const scannedCImport = importNativeSource({
  language: 'c',
  sourcePath: 'todo.h',
  sourceText: '#include <stdint.h>\n#define TODO_MAX 32\ntypedef struct Todo { int done; } Todo;\nvoid add_todo(void);\n'
});
assert.equal(scannedCImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TODO_MAX'), true);
assert.equal(scannedCImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('todo_max')), true);
assert.equal(scannedCImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
const scannedJavaImport = importNativeSource({
  language: 'java',
  sourcePath: 'Todo.java',
  sourceText: 'package demo;\nimport java.util.List;\npublic class Todo {\n  public void addTodo(String title) {}\n}\n'
});
assert.equal(scannedJavaImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
const scannedGoImport = importNativeSource({
  language: 'go',
  sourcePath: 'todo.go',
  sourceText: 'package todo\nimport (\n  tasklog "example.com/project/log"\n)\ntype TodoId = string\ntype Todo struct {}\ntype Store struct {}\nfunc AddTodo(title string) {}\nfunc (store *Store) Save[T any](title string) error { return nil }\n'
});
assert.equal(scannedGoImport.semanticIndex.symbols.some((symbol) => symbol.name === 'AddTodo'), true);
assert.equal(scannedGoImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(symbolByName(scannedGoImport, 'TodoId').kind, 'type');
assert.equal(symbolByName(scannedGoImport, 'Store.Save').kind, 'method');
const scannedGoReceiverNode = nativeNodeForSymbol(scannedGoImport, 'Store.Save');
assert.equal(scannedGoReceiverNode.kind, 'MethodDecl');
assert.equal(scannedGoReceiverNode.fields.methodName, 'Save');
assert.deepEqual(scannedGoReceiverNode.fields.receiver, { raw: 'store *Store', name: 'store', rawType: '*Store', type: 'Store' });
assert.deepEqual(scannedGoReceiverNode.fields.typeParameters, ['T any']);
const scannedSwiftImport = importNativeSource({
  language: 'swift',
  sourcePath: 'Todo.swift',
  sourceText: 'import Foundation\nprotocol TodoRenderable {}\nextension TodoRenderable where Self: AnyObject {\n  func renderTodo() {}\n}\nstruct Todo {\n  public var title: String { get }\n}\npublic extension Todo: Sendable {\n  static var empty: Todo { Todo() }\n}\nfunc addTodo(_ title: String) {}\n'
});
assert.equal(scannedSwiftImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(symbolByName(scannedSwiftImport, 'TodoRenderable').kind, 'protocol');
const scannedSwiftProtocolExtensionNode = nativeNodeForSymbol(scannedSwiftImport, 'TodoRenderable.protocolExtension');
assert.equal(scannedSwiftProtocolExtensionNode.kind, 'ProtocolExtensionDecl');
assert.equal(scannedSwiftProtocolExtensionNode.fields.extendedType, 'TodoRenderable');
assert.equal(scannedSwiftProtocolExtensionNode.fields.constraints, 'Self: AnyObject');
const scannedSwiftExtensionNode = nativeNodeForSymbol(scannedSwiftImport, 'Todo.extension');
assert.equal(scannedSwiftExtensionNode.kind, 'ExtensionDecl');
assert.deepEqual(scannedSwiftExtensionNode.fields.conformances, ['Sendable']);
const scannedSwiftPropertyNode = nativeNodeForSymbol(scannedSwiftImport, 'title');
assert.equal(scannedSwiftPropertyNode.kind, 'PropertyDecl');
assert.equal(scannedSwiftPropertyNode.fields.valueType, 'String');
const scannedCSharpImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'Todo.cs',
  sourceText: 'using System;\nusing JsonMap = System.Collections.Generic.Dictionary<string, object>;\nnamespace Demo;\npublic delegate void TodoChanged(object sender, EventArgs args);\npublic class Todo {\n  public string Title { get; init; }\n  public event EventHandler? Changed;\n  public void AddTodo(string title) {}\n}\npublic static class TodoExtensions {\n  public static string Label(this Todo todo) => todo.Title;\n}\n'
});
assert.equal(scannedCSharpImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(symbolByName(scannedCSharpImport, 'JsonMap').kind, 'type');
assert.equal(nativeNodeForSymbol(scannedCSharpImport, 'JsonMap').fields.target, 'System.Collections.Generic.Dictionary<string, object>');
assert.equal(symbolByName(scannedCSharpImport, 'TodoChanged').kind, 'type');
assert.deepEqual(nativeNodeForSymbol(scannedCSharpImport, 'TodoChanged').fields.parameters, ['object sender', 'EventArgs args']);
const scannedCSharpPropertyNode = nativeNodeForSymbol(scannedCSharpImport, 'Title');
assert.equal(scannedCSharpPropertyNode.kind, 'PropertyDeclaration');
assert.deepEqual(scannedCSharpPropertyNode.fields.accessors, ['get', 'init']);
const scannedCSharpEventNode = nativeNodeForSymbol(scannedCSharpImport, 'Changed');
assert.equal(scannedCSharpEventNode.kind, 'EventDeclaration');
assert.equal(scannedCSharpEventNode.fields.eventType, 'EventHandler?');
const scannedCSharpExtensionMethodNode = nativeNodeForSymbol(scannedCSharpImport, 'Label');
assert.equal(scannedCSharpExtensionMethodNode.kind, 'ExtensionMethodDeclaration');
assert.deepEqual(scannedCSharpExtensionMethodNode.fields.extensionReceiver, { type: 'Todo', name: 'todo' });
const scannedPhpImport = importNativeSource({
  language: 'php',
  sourcePath: 'Todo.php',
  sourceText: '<?php\nnamespace Demo;\nuse Psr\\Log\\LoggerInterface;\nclass Todo {}\nfunction addTodo($title) {}\n'
});
assert.equal(scannedPhpImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
const scannedRubyImport = importNativeSource({
  language: 'ruby',
  sourcePath: 'todo.rb',
  sourceText: 'require "json"\nmodule Demo\nclass Todo\nend\ndef add_todo(title)\nend\nend\n'
});
assert.equal(scannedRubyImport.semanticIndex.symbols.some((symbol) => symbol.name === 'add_todo'), true);
const scannedKotlinImport = importNativeSource({
  language: 'kotlin',
  sourcePath: 'Todo.kt',
  sourceText: 'package demo\nimport kotlinx.coroutines.CoroutineScope\nclass TodoStore\nfun addTodo(title: String) = title\n'
});
assertScannedSymbol(scannedKotlinImport, 'addTodo', 'addtodo');
assert.equal(scannedKotlinImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
const scannedScalaImport = importNativeSource({
  language: 'scala',
  sourcePath: 'Todo.scala',
  sourceText: 'package demo\nimport scala.collection.mutable.ListBuffer\ncase class Todo(title: String)\ndef addTodo(title: String) = title\n'
});
assertScannedSymbol(scannedScalaImport, 'addTodo', 'addtodo');
const scannedDartImport = importNativeSource({
  language: 'dart',
  sourcePath: 'todo.dart',
  sourceText: 'import "dart:convert";\nclass TodoStore {}\nString addTodo(String title) => title;\n'
});
assertScannedSymbol(scannedDartImport, 'addTodo', 'addtodo');
const scannedLuaImport = importNativeSource({
  language: 'lua',
  sourcePath: 'todo.lua',
  sourceText: 'local json = require("json")\nfunction add_todo(title)\n  return title\nend\n'
});
assertScannedSymbol(scannedLuaImport, 'add_todo', 'add_todo');
const scannedShellImport = importNativeSource({
  language: 'shell',
  sourcePath: 'todo.sh',
  sourceText: 'source ./lib.sh\nadd_todo() {\n  echo "$1"\n}\n'
});
assertScannedSymbol(scannedShellImport, 'add_todo', 'add_todo');
const scannedSqlImport = importNativeSource({
  language: 'sql',
  sourcePath: 'todo.sql',
  sourceText: 'CREATE TABLE todos (id INTEGER PRIMARY KEY);\nCREATE VIEW todo_titles AS SELECT id FROM todos;\n'
});
assertScannedSymbol(scannedSqlImport, 'todos');
const scannedSqlQueryImport = importNativeSource({
  language: 'sql',
  sourcePath: 'query.sql',
  sourceText: 'SELECT * FROM todos;\n'
});
assert.equal(scannedSqlQueryImport.semanticIndex.symbols.length, 0);
assert.equal(scannedSqlQueryImport.losses.some((loss) => loss.kind === 'declarationOnlyCoverage'), true);
const scannedZigImport = importNativeSource({
  language: 'zig',
  sourcePath: 'src/todo.zig',
  sourceText: 'const std = @import("std");\npub const Todo = struct { title: []const u8 };\npub fn addTodo(title: []const u8) void {}\ncomptime { @compileError("generated"); }\n'
});
assert.equal(symbolByName(scannedZigImport, 'addTodo').id, 'symbol:zig:addtodo');
assert.equal(scannedZigImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedZigImport, 'symbol:zig:addtodo').sourceSpan.startLine, 3);
assert.equal(scannedZigImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const scannedElixirImport = importNativeSource({
  language: 'elixir',
  sourcePath: 'lib/todo.ex',
  sourceText: 'defmodule Demo.Todo do\n  alias Demo.Repo\n  use GenServer\n  def add_todo(title), do: title\n  defmacro generated(), do: quote(do: :ok)\nend\n'
});
assert.equal(symbolByName(scannedElixirImport, 'add_todo').id, 'symbol:elixir:add_todo');
assert.equal(scannedElixirImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedElixirImport, 'symbol:elixir:add_todo').sourceSpan.startLine, 4);
assert.equal(scannedElixirImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
const scannedErlangImport = importNativeSource({
  language: 'erlang',
  sourcePath: 'src/todo.erl',
  sourceText: '-module(todo).\n-include("todo.hrl").\n-define(TODO(Name), {todo, Name}).\n-record(todo, {title}).\nadd_todo(Title) -> ?TODO(Title).\n'
});
assert.equal(symbolByName(scannedErlangImport, 'add_todo').id, 'symbol:erlang:add_todo');
assert.equal(scannedErlangImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedErlangImport, 'symbol:erlang:add_todo').sourceSpan.startLine, 5);
assert.equal(scannedErlangImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
assert.equal(scannedErlangImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
const scannedHaskellImport = importNativeSource({
  language: 'haskell',
  sourcePath: 'src/Todo.hs',
  sourceText: "{-# LANGUAGE TemplateHaskell #-}\nmodule Todo where\nimport qualified Data.Text as T\ndata Todo = Todo Text\naddTodo :: Text -> Todo\naddTodo title = Todo title\n$(deriveJSON defaultOptions ''Todo)\n"
});
assert.equal(symbolByName(scannedHaskellImport, 'addTodo').id, 'symbol:haskell:addtodo');
assert.equal(scannedHaskellImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedHaskellImport, 'symbol:haskell:addtodo').sourceSpan.startLine, 5);
assert.equal(scannedHaskellImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
const scannedRImport = importNativeSource({
  language: 'r',
  sourcePath: 'todo.R',
  sourceText: 'library(dplyr)\nTodo <- R6Class("Todo", list())\nadd_todo <- function(title) { title }\nsetClass("TodoRecord", slots = list(title = "character"))\neval(parse(text = "generated <- TRUE"))\n'
});
assert.equal(symbolByName(scannedRImport, 'add_todo').id, 'symbol:r:add_todo');
assert.equal(scannedRImport.semanticIndex.relations.some((relation) => relation.predicate === 'imports'), true);
assert.equal(mappedSymbol(scannedRImport, 'symbol:r:add_todo').sourceSpan.startLine, 3);
assert.equal(scannedRImport.losses.some((loss) => loss.kind === 'dynamicRuntime'), true);
const coverageMatrix = createNativeImportCoverageMatrix({
  generatedAt: 123,
  imports: [
    nativeImport,
    scannedJsImport,
    scannedPythonImport,
    scannedRustImport,
    scannedCImport,
    scannedRImport
  ],
  adapters: [createEstreeNativeImporterAdapter()]
});
assert.equal(coverageMatrix.kind, 'frontier.lang.nativeImportCoverageMatrix');
assert.equal(coverageMatrix.generatedAt, 123);
assert.ok(coverageMatrix.summary.languages >= 20);
assert.equal(coverageMatrix.summary.imports, 6);
assert.ok(coverageMatrix.summary.sourceMapMappings >= 6);
assert.ok(coverageMatrix.summary.lossKinds.opaqueNative >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.total >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.gaps.tokens >= 1);
assert.ok(coverageMatrix.summary.adapterCoverage.effective.exactAst >= 1);
assert.equal(NativeImportLanguageProfiles.some((profile) => profile.language === 'python'), true);
const jsCoverage = coverageMatrix.languages.find((entry) => entry.language === 'javascript');
assert.ok(jsCoverage);
assert.equal(jsCoverage.imports.total, 2);
assert.equal(jsCoverage.supportsLightweightScan, true);
assert.equal(jsCoverage.parserAdapters.includes('estree'), true);
assert.ok(jsCoverage.imports.symbols >= 2);
assert.ok(jsCoverage.adapterCoverage.total >= 1);
const pythonCoverage = coverageMatrix.languages.find((entry) => entry.language === 'python');
assert.equal(pythonCoverage.imports.readiness, 'needs-review');
assert.equal(pythonCoverage.parserAdapters.includes('libcst'), true);
const haskellCoverage = coverageMatrix.languages.find((entry) => entry.language === 'haskell');
assert.equal(haskellCoverage.imports.total, 0);
assert.equal(haskellCoverage.imports.readiness, 'needs-review');
assert.deepEqual(coverageMatrix.metadata.projectionTargetLossClasses, [...ProjectionTargetLossClasses]);
const projectionLossMatrix = createProjectionTargetLossMatrix({
  generatedAt: 321,
  imports: [
    scannedJsImport,
    scannedPythonImport,
    scannedRustImport,
    scannedCImport,
    scannedRImport
  ],
  adapters: [createEstreeNativeImporterAdapter()]
});
assert.equal(projectionLossMatrix.kind, 'frontier.lang.projectionTargetLossMatrix');
assert.equal(projectionLossMatrix.generatedAt, 321);
assert.deepEqual(projectionLossMatrix.metadata.lossClasses, [...ProjectionTargetLossClasses]);
assert.ok(projectionLossMatrix.summary.missingAdapters > 0);
assert.ok(projectionLossMatrix.summary.unsupportedTargetFeatures > 0);
assert.ok(projectionLossMatrix.summary.sourceProjectionByLossClass.exactSourceProjection >= projectionLossMatrix.summary.languages);
assert.ok(projectionLossMatrix.summary.sourceProjectionByLossClass.nativeSourceStubs >= projectionLossMatrix.summary.languages);
const jsProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'javascript');
assert.ok(jsProjectionCoverage);
assert.equal(jsProjectionCoverage.sourceProjection.exactSource.lossClass, 'exactSourceProjection');
assert.equal(jsProjectionCoverage.sourceProjection.exactSource.evidence.importsWithExactSource, 1);
assert.equal(jsProjectionCoverage.sourceProjection.stubs.lossClass, 'nativeSourceStubs');
assert.equal(jsProjectionCoverage.targets.find((entry) => entry.target === 'typescript').lossClass, 'missingAdapter');
const cProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'c');
assert.equal(cProjectionCoverage.targets.find((entry) => entry.target === 'c').lossClass, 'unsupportedTargetFeatures');
assert.equal(cProjectionCoverage.targets.find((entry) => entry.target === 'c').lossKinds.includes('preprocessor'), true);
const rProjectionCoverage = projectionLossMatrix.languages.find((entry) => entry.language === 'r');
assert.equal(rProjectionCoverage.targets.every((entry) => entry.lossClass === 'missingAdapter'), true);
const projectSidecar = createSemanticImportSidecar(projectImport, { generatedAt: 456 });
assert.equal(projectSidecar.summary.imports, 2);
assert.equal(projectSidecar.summary.emptySemanticIndex, false);
assert.equal(projectSidecar.imports.some((entry) => entry.emptySemanticIndex === false), true);
const universalAst = createUniversalAstFromDocument(result.document, { id: 'uast_todo', evidence: nativeImport.evidence });
const universalJson = writeUniversalAstJson(universalAst);
assert.equal(readUniversalAstJson(universalJson).document.id, 'mod_todo');
assert.match(compileFrontierSource(source, { target: 'rust' }).output, /pub struct Todo/);
assert.match(compileFrontierSource(source, { target: 'python' }).output, /class Todo/);
assert.match(compileFrontierSource(source, { target: 'c' }).output, /typedef struct Todo/);

const bad = compileFrontierSource('module Bad @id("mod_bad")\nentity Bad @id("ent_bad") { missing: UnknownType }', { target: 'typescript' });
assert.equal(bad.ok, false);
assert.equal(bad.ast, undefined);
assert.equal(bad.output, '');
