import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as compilerApi from '../dist/index.js';
import {
  compileFrontierSource,
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createNativeImportCoverageMatrix,
  createNativeImportResultContract,
  createNativeParserAstFormatMatrix,
  createNativeParserFeatureMatrix,
  createProjectionTargetLossMatrix,
  createNativeSourcePreservation,
  createCSharpRoslynNativeImporterAdapter,
  createClangAstNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  createJavaAstNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSwiftSyntaxNativeImporterAdapter,
  createSemanticImportSidecar,
  createTreeSitterNativeImporterAdapter,
  createTypeScriptCompilerNativeImporterAdapter,
  createUniversalAstFromDocument,
  diffNativeSourceImports,
  diffNativeSources,
  emitForTarget,
  emitForTargetWithSourceMap,
  ExternalSemanticIndexFormats,
  importExternalSemanticIndex,
  importNativeProject,
  importNativeSource,
  NativeImportFeatureEvidencePolicies,
  NativeImportLanguageProfiles,
  NativeImportLossKinds,
  NativeParserAstFormats,
  NativeParserAstFormatProfiles,
  NativeParserFeatureCategories,
  NativeParserFeatureCoverageStatuses,
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
  runNativeTargetProjectionAdapter,
  classifyNativeImportRoundtripReadiness,
  classifyNativeImportReadiness,
  compileNativeSource,
  getNativeImportFeatureEvidencePolicy,
  getNativeParserAstFormatProfile,
  queryNativeParserFeatureMatrix,
  summarizeNativeImportFeatureEvidence,
  summarizeNativeImportLosses,
  writeUniversalAstJson
} from '../dist/index.js';

const publicRuntimeExports = Object.keys(compilerApi).sort();
const publicDeclarationExports = publicValueExportsFromDeclaration(new URL('../dist/index.d.ts', import.meta.url));
assert.deepEqual(publicRuntimeExports, publicDeclarationExports);
for (const requiredExport of [
  'NativeImportFeatureEvidencePolicies',
  'NativeParserAstFormats',
  'NativeParserAstFormatProfiles',
  'NativeParserFeatureCategories',
  'NativeParserFeatureCoverageStatuses',
  'NativeImportRegionTaxonomyKinds',
  'ProjectionTargetLossClasses',
  'createNativeImportResultContract',
  'createNativeParserAstFormatMatrix',
  'createNativeParserFeatureMatrix',
  'createCSharpRoslynNativeImporterAdapter',
  'createClangAstNativeImporterAdapter',
  'createGoAstNativeImporterAdapter',
  'createJavaAstNativeImporterAdapter',
  'createKotlinPsiNativeImporterAdapter',
  'createSwiftSyntaxNativeImporterAdapter',
  'createPythonAstNativeImporterAdapter',
  'createRustSynNativeImporterAdapter',
  'createProjectionTargetLossMatrix',
  'classifyNativeImportRoundtripReadiness',
  'compileNativeSource',
  'createSemanticImportSidecar',
  'diffNativeSourceImports',
  'diffNativeSources',
  'emitForTargetWithSourceMap',
  'getNativeImportFeatureEvidencePolicy',
  'getNativeParserAstFormatProfile',
  'queryNativeParserFeatureMatrix',
  'ExternalSemanticIndexFormats',
  'importExternalSemanticIndex',
  'importNativeSource',
  'importNativeProject',
  'renderTargetAstWithSourceMap',
  'runNativeTargetProjectionAdapter'
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
assert.equal(NativeImportFeatureEvidencePolicies.preprocessor.kind, 'preprocessor');
assert.equal(getNativeImportFeatureEvidencePolicy('conditionalCompilation').requiredEvidenceKeys.includes('activeBranches'), true);
assert.equal(ExternalSemanticIndexFormats.includes('scip'), true);
assert.equal(ExternalSemanticIndexFormats.includes('lsp'), true);
const scipImport = importExternalSemanticIndex({
  format: 'scip',
  language: 'typescript',
  projectRoot: '/repo',
  payload: {
    metadata: { project_root: '/repo', text_document_encoding: 1 },
    documents: [{
      relative_path: 'src/todo.ts',
      language: 'typescript',
      symbols: [{
        symbol: 'scip-typescript npm todo 1.0.0 src/todo.ts/ addTodo().',
        display_name: 'addTodo',
        kind: 17,
        signature_documentation: 'function addTodo(title: string): void',
        relationships: [{
          symbol: 'scip-typescript npm todo 1.0.0 src/todo.ts/ Todo#',
          is_definition: true
        }]
      }],
      occurrences: [{
        symbol: 'scip-typescript npm todo 1.0.0 src/todo.ts/ addTodo().',
        range: [0, 16, 23],
        symbol_roles: 1,
        syntax_kind: 15
      }, {
        symbol: 'local 1',
        range: [1, 2, 9],
        symbol_roles: 1,
        syntax_kind: 9
      }]
    }, {
      relative_path: 'src/other.ts',
      language: 'typescript',
      occurrences: [{
        symbol: 'local 1',
        range: [0, 0, 5],
        symbol_roles: 1,
        syntax_kind: 9
      }]
    }]
  }
});
assert.equal(scipImport.kind, 'frontier.lang.externalSemanticIndexImport');
assert.equal(scipImport.semanticIndex.documents[0].path, 'src/todo.ts');
assert.equal(scipImport.semanticIndex.symbols[0].name, 'addTodo');
assert.equal(scipImport.semanticIndex.symbols[0].metadata.ownershipRegionKind, 'body');
assert.equal(scipImport.semanticIndex.occurrences[0].role, 'definition');
assert.equal(scipImport.semanticIndex.occurrences[0].span.startLine, 1);
assert.equal(scipImport.semanticIndex.occurrences[0].span.startColumn, 17);
assert.equal(scipImport.summary.sourceMapMappings, 3);
assert.equal(scipImport.sourceMaps[0].mappings[0].semanticSymbolId, scipImport.semanticIndex.symbols[0].id);
assert.equal(scipImport.semanticIndex.facts.some((fact) => fact.predicate === 'semanticOwnershipRegion'), true);
assert.equal(scipImport.semanticIndex.relations.some((relation) => relation.predicate === 'definitionOf'), true);
const scopedLocalScipSymbols = scipImport.semanticIndex.symbols.filter((symbol) => symbol.metadata?.rawSymbol === 'local 1');
assert.equal(scopedLocalScipSymbols.length, 2);
assert.notEqual(scopedLocalScipSymbols[0].id, scopedLocalScipSymbols[1].id);
assert.equal(scipImport.readiness.readiness, 'ready-with-losses');
const generatedScipImport = importExternalSemanticIndex({
  format: 'scip',
  payload: {
    documents: [{
      relative_path: 'src/generated.ts',
      language: 'typescript',
      occurrences: [{
        symbol: 'local 2',
        range: [0, 0, 2],
        symbol_roles: 17
      }]
    }]
  }
});
assert.equal(generatedScipImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(generatedScipImport.readiness.readiness, 'needs-review');
const lspImport = importExternalSemanticIndex({
  format: 'lsp',
  language: 'python',
  payload: {
    uri: 'file:///repo/src/app.py',
    languageId: 'python',
    documentSymbols: [{
      name: 'make_user',
      kind: 12,
      range: { start: { line: 1, character: 0 }, end: { line: 3, character: 0 } },
      selectionRange: { start: { line: 1, character: 4 }, end: { line: 1, character: 13 } }
    }],
    diagnostics: [{
      severity: 2,
      code: 'type-review',
      message: 'Type information is partial.',
      range: { start: { line: 2, character: 2 }, end: { line: 2, character: 8 } }
    }]
  }
});
assert.equal(lspImport.semanticIndex.documents[0].path, '/repo/src/app.py');
assert.equal(lspImport.semanticIndex.symbols[0].kind, 'function');
assert.equal(lspImport.semanticIndex.occurrences[0].span.startLine, 2);
assert.equal(lspImport.summary.losses >= 2, true);
assert.equal(lspImport.readiness.readiness, 'needs-review');
const lspMissingSeverityImport = importExternalSemanticIndex({
  format: 'lsp',
  payload: {
    uri: 'file:///repo/src/strict.ts',
    diagnostics: [{ message: 'Severity omitted by upstream indexer.' }]
  }
});
assert.equal(lspMissingSeverityImport.losses.some((loss) => loss.severity === 'error'), true);
assert.equal(lspMissingSeverityImport.readiness.readiness, 'blocked');
const lsifImport = importExternalSemanticIndex({
  format: 'lsif',
  language: 'go',
  payload: {
    vertices: [
      { id: 1, type: 'vertex', label: 'document', uri: 'file:///repo/main.go', languageId: 'go' },
      { id: 2, type: 'vertex', label: 'range', start: { line: 0, character: 5 }, end: { line: 0, character: 12 } },
      { id: 3, type: 'vertex', label: 'resultSet' },
      { id: 4, type: 'vertex', label: 'moniker', scheme: 'gomod', identifier: 'example.com/repo.Main' },
      { id: 9, type: 'vertex', label: 'document', uri: 'file:///repo/other.go', languageId: 'go' },
      { id: 10, type: 'vertex', label: 'range', start: { line: 1, character: 1 }, end: { line: 1, character: 6 } },
      { id: 11, type: 'vertex', label: 'resultSet' },
      { id: 12, type: 'vertex', label: 'moniker', scheme: 'gomod', identifier: 'example.com/repo.Other' }
    ],
    edges: [
      { id: 5, type: 'edge', label: 'next', outV: 2, inV: 3 },
      { id: 6, type: 'edge', label: 'moniker', outV: 3, inV: 4 },
      { id: 7, type: 'edge', label: 'item', outV: 8, inVs: [2], property: 'definitions' },
      { id: 8, type: 'edge', label: 'contains', outV: 1, inVs: [2] },
      { id: 13, type: 'edge', label: 'next', outV: 10, inV: 11 },
      { id: 14, type: 'edge', label: 'moniker', outV: 11, inV: 12 },
      { id: 15, type: 'edge', label: 'item', outV: 16, inVs: [10], property: 'definitions' },
      { id: 16, type: 'edge', label: 'contains', outV: 9, inVs: [10] }
    ]
  }
});
assert.equal(lsifImport.semanticIndex.documents[0].path, '/repo/main.go');
assert.equal(lsifImport.semanticIndex.symbols[0].name, 'example.com/repo.Main');
assert.equal(lsifImport.semanticIndex.occurrences[0].role, 'definition');
assert.equal(lsifImport.summary.sourceMapMappings, 2);
assert.equal(lsifImport.semanticIndex.occurrences.find((occurrence) => occurrence.documentId === lsifImport.semanticIndex.documents[1].id).span.path, '/repo/other.go');
const semanticDbImport = importExternalSemanticIndex({
  format: 'semanticdb',
  payload: {
    documents: [{
      uri: 'src/App.scala',
      language: 'scala',
      md5: 'semanticdb-md5',
      symbols: [{ symbol: 'local0', display_name: 'App', kind: 'OBJECT', signature: 'object App' }],
      occurrences: [{
        symbol: 'local0',
        role: 2,
        range: { start_line: 0, start_character: 7, end_line: 0, end_character: 10 }
      }]
    }]
  }
});
assert.equal(semanticDbImport.semanticIndex.documents[0].language, 'scala');
assert.equal(semanticDbImport.semanticIndex.symbols[0].name, 'App');
assert.equal(semanticDbImport.semanticIndex.facts.some((fact) => fact.predicate === 'signature'), true);
assert.equal(semanticDbImport.semanticIndex.occurrences[0].span.endColumn, 11);
for (const policyKind of ['macroExpansion', 'macroHygiene', 'preprocessor', 'conditionalCompilation', 'generatedCode', 'dynamicDispatch', 'unsupportedSyntax']) {
  assert.equal(Boolean(getNativeImportFeatureEvidencePolicy(policyKind)), true, `missing feature evidence policy ${policyKind}`);
}
const completeFeatureEvidenceLoss = {
  id: 'loss_preprocessor_complete',
  severity: 'warning',
  kind: 'preprocessor',
  message: 'Preprocessor evidence is attached.',
  metadata: {
    preprocessedOutputHash: 'fnv1a32:preprocessed',
    definesHash: 'fnv1a32:defines',
    includeGraphHash: 'fnv1a32:includes'
  }
};
const completeFeatureEvidenceSummary = summarizeNativeImportFeatureEvidence([completeFeatureEvidenceLoss]);
assert.equal(completeFeatureEvidenceSummary.total, 1);
assert.equal(completeFeatureEvidenceSummary.missingRequiredEvidence.length, 0);
assert.equal(completeFeatureEvidenceSummary.highestRisk, 'high');
const missingFeatureEvidenceSummary = summarizeNativeImportFeatureEvidence([{
  id: 'loss_preprocessor_missing',
  severity: 'warning',
  kind: 'preprocessor',
  message: 'Preprocessor evidence is missing.'
}]);
assert.equal(missingFeatureEvidenceSummary.missingRequiredEvidence.some((entry) => entry.evidenceKey === 'preprocessedOutputHash'), true);
assert.equal(missingFeatureEvidenceSummary.reasons.some((reason) => reason.includes('preprocessedOutputHash')), true);
const featureEvidenceViaRecord = summarizeNativeImportFeatureEvidence([{
  id: 'loss_generated_code',
  severity: 'warning',
  kind: 'generatedCode',
  message: 'Generated code evidence is attached to evidence record.'
}], {
  evidence: [{
    id: 'evidence_generated_code',
    kind: 'native-import',
    status: 'passed',
    summary: 'Generated artifact evidence.',
    metadata: {
      generatedArtifactHash: 'fnv1a32:generated',
      generatedRanges: [{ startLine: 1, endLine: 2 }]
    }
  }]
});
assert.equal(featureEvidenceViaRecord.issues[0].evidenceIds.includes('evidence_generated_code'), true);
assert.equal(featureEvidenceViaRecord.missingRequiredEvidence.length, 0);
const advisoryLossSummary = summarizeNativeImportLosses([completeFeatureEvidenceLoss]);
assert.equal(advisoryLossSummary.featureEvidence.policyKinds.includes('preprocessor'), true);
assert.equal(advisoryLossSummary.semanticMergeReadiness, 'needs-review');
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
const pythonAstFixtureSource = 'import os\nasync def from_py(value):\n    return value\nclass PyThing:\n    pass\n';
const pythonAstFixture = {
  _type: 'Module',
  body: [{
    _type: 'Import',
    lineno: 1,
    col_offset: 0,
    end_lineno: 1,
    end_col_offset: 9,
    names: [{ _type: 'alias', name: 'os', asname: null }]
  }, {
    _type: 'AsyncFunctionDef',
    name: 'from_py',
    lineno: 2,
    col_offset: 0,
    end_lineno: 3,
    end_col_offset: 16,
    args: {
      _type: 'arguments',
      args: [{ _type: 'arg', arg: 'value', lineno: 2, col_offset: 18 }],
      defaults: []
    },
    body: [{
      _type: 'Return',
      lineno: 3,
      col_offset: 4,
      end_lineno: 3,
      end_col_offset: 16,
      value: { _type: 'Name', id: 'value', lineno: 3, col_offset: 11, ctx: { _type: 'Load' } }
    }],
    decorator_list: []
  }, {
    _type: 'ClassDef',
    name: 'PyThing',
    lineno: 4,
    col_offset: 0,
    end_lineno: 5,
    end_col_offset: 8,
    bases: [],
    keywords: [],
    body: [{ _type: 'Pass', lineno: 5, col_offset: 4 }],
    decorator_list: []
  }],
  type_ignores: []
};
const pythonAstImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter({ pythonVersion: '3.12' }), {
  sourcePath: 'src/python_ast.py',
  sourceText: pythonAstFixtureSource,
  adapterOptions: { ast: pythonAstFixture, includeAttributes: true }
});
assert.equal(pythonAstImport.adapter.parser, 'python-ast');
assert.equal(pythonAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(pythonAstImport.nativeAst.parser, 'python-ast');
assert.equal(pythonAstImport.metadata.astFormat, 'python-ast');
assert.equal(pythonAstImport.metadata.pythonVersion, '3.12');
assert.equal(pythonAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_py'), true);
assert.equal(pythonAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'PyThing'), true);
assert.equal(pythonAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(pythonAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_py')), true);
const scannedPythonAstFixtureImport = importNativeSource({
  language: 'python',
  sourcePath: 'src/python_ast.py',
  sourceText: pythonAstFixtureSource
});
assertExactAdapterOutranksScanner(pythonAstImport, scannedPythonAstFixtureImport, 'from_py');
const malformedPythonImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: { _type: 'Module', body: [], type_ignores: [] },
        errors: [{ code: 'SyntaxError', message: 'invalid syntax', loc: { line: 1, column: 4 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_python.py',
  sourceText: 'def broken(:\n'
});
assert.equal(malformedPythonImport.diagnostics.some((diagnostic) => diagnostic.code === 'SyntaxError'), true);
assert.equal(malformedPythonImport.losses.some((loss) => loss.severity === 'error' && loss.kind === 'unsupportedSyntax'), true);
assert.equal(malformedPythonImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
assert.equal(malformedPythonImport.mergeCandidates[0].readiness, 'blocked');
assert.equal(malformedPythonImport.patch.risk, 'high');
const missingPythonAstImport = await runNativeImporterAdapter(createPythonAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_python_ast.py',
  sourceText: 'def missing_ast():\n    return None\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingPythonAstImport.nativeAst.nodes[missingPythonAstImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingPythonAstImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
assert.equal(missingPythonAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const rustSynFixtureSource = 'use std::sync::Arc;\npub struct RustThing;\npub fn from_rust(value: usize) -> usize { value }\nimpl RustThing { pub fn save(&self) {} }\n';
const rustSynFixture = {
  kind: 'File',
  items: [{
    kind: 'ItemUse',
    span: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 19 },
    tree: {
      kind: 'UsePath',
      ident: 'std',
      tree: {
        kind: 'UsePath',
        ident: 'sync',
        tree: { kind: 'UseName', ident: 'Arc' }
      }
    }
  }, {
    kind: 'ItemStruct',
    ident: 'RustThing',
    vis: 'pub',
    span: { startLine: 2, startColumn: 0, endLine: 2, endColumn: 21 },
    fields: { kind: 'FieldsUnit' }
  }, {
    Struct: {
      ident: 'WrappedRustThing',
      vis: 'pub',
      span: { startLine: 2, startColumn: 22, endLine: 2, endColumn: 45 },
      fields: { kind: 'FieldsUnit' }
    }
  }, {
    kind: 'ItemFn',
    vis: 'pub',
    span: { startLine: 3, startColumn: 0, endLine: 3, endColumn: 50 },
    sig: {
      kind: 'Signature',
      ident: 'from_rust',
      inputs: [],
      output: { kind: 'ReturnType', path: 'usize' }
    },
    block: { kind: 'Block', stmts: [] }
  }, {
    kind: 'ItemImpl',
    span: { startLine: 4, startColumn: 0, endLine: 4, endColumn: 39 },
    self_ty: { kind: 'TypePath', path: { segments: [{ ident: 'RustThing' }] } },
    items: [{
      kind: 'ImplItemFn',
      vis: 'pub',
      sig: { kind: 'Signature', ident: 'save', inputs: [] },
      block: { kind: 'Block', stmts: [] }
    }]
  }]
};
const rustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter({ rustEdition: '2021' }), {
  sourcePath: 'src/rust_syn.rs',
  sourceText: rustSynFixtureSource,
  adapterOptions: { ast: rustSynFixture }
});
assert.equal(rustSynImport.adapter.parser, 'syn');
assert.equal(rustSynImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(rustSynImport.nativeAst.parser, 'syn');
assert.equal(rustSynImport.metadata.astFormat, 'rust-syn');
assert.equal(rustSynImport.metadata.rustEdition, '2021');
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_rust'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RustThing'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'WrappedRustThing'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'RustThing.impl'), true);
assert.equal(rustSynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'save' && symbol.kind === 'method'), true);
assert.equal(rustSynImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(rustSynImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_rust')), true);
const scannedRustSynFixtureImport = importNativeSource({
  language: 'rust',
  sourcePath: 'src/rust_syn.rs',
  sourceText: rustSynFixtureSource
});
assertExactAdapterOutranksScanner(rustSynImport, scannedRustSynFixtureImport, 'from_rust');
const rustSynMacroImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter(), {
  sourcePath: 'src/rust_macro.rs',
  sourceText: 'macro_rules! generated { () => {} }\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      items: [{ kind: 'ItemMacro', ident: 'generated', span: { startLine: 1, startColumn: 0 } }]
    }
  }
});
assert.equal(rustSynMacroImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
assert.equal(rustSynMacroImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedRustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        file: { kind: 'File', items: [] },
        errors: [{ code: 'RustSyntaxError', message: 'expected item', loc: { line: 1, column: 4 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_rust.rs',
  sourceText: 'pub fn {\n'
});
assert.equal(malformedRustSynImport.diagnostics.some((diagnostic) => diagnostic.code === 'RustSyntaxError'), true);
assert.equal(malformedRustSynImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingRustSynImport = await runNativeImporterAdapter(createRustSynNativeImporterAdapter(), {
  sourcePath: 'src/missing_rust_syn.rs',
  sourceText: 'pub fn missing() {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingRustSynImport.nativeAst.nodes[missingRustSynImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingRustSynImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const clangFixtureSource = '#include <stdint.h>\ntypedef struct CThing { int value; } CThing;\nint from_c(CThing thing) { return thing.value; }\n';
const clangFixture = {
  kind: 'TranslationUnitDecl',
  inner: [{
    kind: 'IncludeDirective',
    file: 'stdint.h',
    loc: { line: 1, col: 1 }
  }, {
    kind: 'TypedefDecl',
    name: 'CThing',
    type: { qualType: 'struct CThing' },
    range: { begin: { line: 2, col: 1 }, end: { line: 2, col: 48 } },
    inner: [{
      kind: 'RecordDecl',
      name: 'CThing',
      tagUsed: 'struct',
      completeDefinition: true,
      range: { begin: { line: 2, col: 9 }, end: { line: 2, col: 36 } },
      inner: [{
        kind: 'FieldDecl',
        name: 'value',
        type: { qualType: 'int' },
        range: { begin: { line: 2, col: 25 }, end: { line: 2, col: 33 } }
      }]
    }]
  }, {
    kind: 'FunctionDecl',
    name: 'from_c',
    type: { qualType: 'int (CThing)' },
    isThisDeclarationADefinition: true,
    range: { begin: { line: 3, col: 1 }, end: { line: 3, col: 47 } },
    inner: [{
      kind: 'ParmVarDecl',
      name: 'thing',
      type: { qualType: 'CThing' },
      range: { begin: { line: 3, col: 12 }, end: { line: 3, col: 24 } }
    }, {
      kind: 'CompoundStmt',
      range: { begin: { line: 3, col: 25 }, end: { line: 3, col: 47 } },
      inner: [{
        kind: 'ReturnStmt',
        range: { begin: { line: 3, col: 27 }, end: { line: 3, col: 45 } }
      }]
    }]
  }]
};
const clangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter({ cStandard: 'c11' }), {
  sourcePath: 'src/clang_ast.c',
  sourceText: clangFixtureSource,
  adapterOptions: { ast: clangFixture, compileFlags: ['-std=c11'] }
});
assert.equal(clangImport.adapter.parser, 'clang');
assert.equal(clangImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(clangImport.nativeAst.parser, 'clang');
assert.equal(clangImport.metadata.astFormat, 'clang-ast-json');
assert.equal(clangImport.metadata.cStandard, 'c11');
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'from_c' && symbol.kind === 'function'), true);
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'CThing'), true);
assert.equal(clangImport.semanticIndex.symbols.some((symbol) => symbol.name === 'value' && symbol.kind === 'property'), true);
assert.equal(clangImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(clangImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('from_c')), true);
const scannedClangFixtureImport = importNativeSource({
  language: 'c',
  sourcePath: 'src/clang_ast.c',
  sourceText: clangFixtureSource
});
assert.equal(clangImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(clangImport.losses.length, 0);
assert.equal(scannedClangFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedClangFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(clangImport.semanticIndex.symbols.length > scannedClangFixtureImport.semanticIndex.symbols.length);
const clangMacroImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter(), {
  sourcePath: 'src/clang_macro.c',
  sourceText: '#define GENERATED 1\nint generated(void) { return GENERATED; }\n',
  adapterOptions: {
    ast: {
      kind: 'TranslationUnitDecl',
      inner: []
    },
    preprocessorRecords: [{ kind: 'MacroDefinitionRecord', name: 'GENERATED', loc: { line: 1, col: 1 } }],
    includeGraph: { hash: 'fixture-include-graph', edges: [] }
  }
});
assert.equal(clangMacroImport.losses.some((loss) => loss.kind === 'preprocessor'), true);
assert.equal(clangMacroImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(clangMacroImport.metadata.preprocessorRecordCount, 1);
assert.equal(clangMacroImport.metadata.includeGraph.hash, 'fixture-include-graph');
const malformedClangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: { kind: 'TranslationUnitDecl', inner: [] },
        diagnostics: [{ code: 'ClangSyntaxError', message: 'expected identifier', loc: { line: 1, column: 5 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_clang.c',
  sourceText: 'int {\n'
});
assert.equal(malformedClangImport.diagnostics.some((diagnostic) => diagnostic.code === 'ClangSyntaxError'), true);
assert.equal(malformedClangImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingClangImport = await runNativeImporterAdapter(createClangAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_clang.c',
  sourceText: 'int missing(void) { return 0; }\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingClangImport.nativeAst.nodes[missingClangImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingClangImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const goFixtureSource = 'package todo\n\nimport "fmt"\n\ntype Todo struct { Title string }\nconst DefaultTitle = "todo"\nvar Count, Total int\nfunc NewTodo(title string) Todo { return Todo{Title: title} }\nfunc (t *Todo) Save() error { return nil }\n';
const goPos = (line, column) => ({ Line: line, Column: column, Filename: 'src/go_ast.go' });
const goFixture = {
  kind: 'File',
  Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) },
  Pos: goPos(1, 1),
  End: goPos(9, 1),
  Decls: [{
    kind: 'GenDecl',
    Tok: 'IMPORT',
    Pos: goPos(3, 1),
    Specs: [{
      kind: 'ImportSpec',
      Path: { kind: 'BasicLit', Value: '"fmt"', Pos: goPos(3, 8), End: goPos(3, 13) }
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'TYPE',
    Pos: goPos(5, 1),
    Specs: [{
      kind: 'TypeSpec',
      Name: { kind: 'Ident', Name: 'Todo', NamePos: goPos(5, 6) },
      Type: {
        kind: 'StructType',
        Pos: goPos(5, 11),
        Fields: {
          kind: 'FieldList',
          List: [{
            kind: 'Field',
            Names: [{ kind: 'Ident', Name: 'Title', NamePos: goPos(5, 20) }],
            Type: { kind: 'Ident', Name: 'string', NamePos: goPos(5, 26) },
            Pos: goPos(5, 20),
            End: goPos(5, 32)
          }]
        }
      }
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'CONST',
    Pos: goPos(6, 1),
    Specs: [{
      kind: 'ValueSpec',
      Names: [{ kind: 'Ident', Name: 'DefaultTitle', NamePos: goPos(6, 7) }],
      Type: { kind: 'Ident', Name: 'string', NamePos: goPos(6, 20) },
      Values: [{ kind: 'BasicLit', Value: '"todo"', Pos: goPos(6, 29) }]
    }]
  }, {
    kind: 'GenDecl',
    Tok: 'VAR',
    Pos: goPos(7, 1),
    Specs: [{
      kind: 'ValueSpec',
      Names: [{ kind: 'Ident', Name: 'Count', NamePos: goPos(7, 5) }, { kind: 'Ident', Name: 'Total', NamePos: goPos(7, 12) }],
      Type: { kind: 'Ident', Name: 'int', NamePos: goPos(7, 11) }
    }]
  }, {
    kind: 'FuncDecl',
    Name: { kind: 'Ident', Name: 'NewTodo', NamePos: goPos(8, 6) },
    Type: { kind: 'FuncType', Pos: goPos(8, 1) },
    Body: { kind: 'BlockStmt', Pos: goPos(8, 34), End: goPos(8, 63) },
    Pos: goPos(8, 1),
    End: goPos(8, 63)
  }, {
    kind: 'FuncDecl',
    Recv: {
      kind: 'FieldList',
      List: [{
        kind: 'Field',
        Names: [{ kind: 'Ident', Name: 't', NamePos: goPos(9, 7) }],
        Type: { kind: 'StarExpr', X: { kind: 'Ident', Name: 'Todo', NamePos: goPos(9, 10) } }
      }]
    },
    Name: { kind: 'Ident', Name: 'Save', NamePos: goPos(9, 16) },
    Type: { kind: 'FuncType', Pos: goPos(9, 1) },
    Body: { kind: 'BlockStmt', Pos: goPos(9, 29), End: goPos(9, 43) },
    Pos: goPos(9, 1),
    End: goPos(9, 43)
  }]
};
const goAstImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter({ goVersion: '1.22' }), {
  sourcePath: 'src/go_ast.go',
  sourceText: goFixtureSource,
  adapterOptions: {
    ast: goFixture,
    buildTags: ['frontier'],
    typeEvidence: { packagePath: 'example.com/frontier/todo', hash: 'go-types-fixture', types: ['Todo'], references: ['NewTodo'] }
  }
});
assert.equal(goAstImport.adapter.parser, 'go/parser');
assert.equal(goAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(goAstImport.nativeAst.parser, 'go/parser');
assert.equal(goAstImport.metadata.astFormat, 'go-ast');
assert.equal(goAstImport.metadata.goVersion, '1.22');
assert.equal(goAstImport.metadata.packageName, 'todo');
assert.equal(goAstImport.metadata.typeEvidence.hash, 'go-types-fixture');
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'fmt' && symbol.kind === 'module'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Title' && symbol.kind === 'property'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'DefaultTitle' && symbol.kind === 'constant'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Count' && symbol.kind === 'variable'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Total' && symbol.kind === 'variable'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'NewTodo' && symbol.kind === 'function'), true);
assert.equal(goAstImport.semanticIndex.symbols.some((symbol) => symbol.name === '*Todo.Save' && symbol.kind === 'method'), true);
assert.equal(goAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(goAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('newtodo')), true);
const scannedGoFixtureImport = importNativeSource({
  language: 'go',
  sourcePath: 'src/go_ast.go',
  sourceText: goFixtureSource
});
assert.equal(goAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(goAstImport.losses.length, 0);
assert.equal(scannedGoFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedGoFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(goAstImport.semanticIndex.symbols.length > scannedGoFixtureImport.semanticIndex.symbols.length);
const goGeneratedImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/generated_go_ast.go',
  sourceText: 'package todo\n// Code generated by fixture; DO NOT EDIT.\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      Generated: true,
      Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) }
    }
  }
});
assert.equal(goGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(goGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const goBadNodeImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/bad_go_ast.go',
  sourceText: 'package todo\nfunc broken(\n',
  adapterOptions: {
    ast: {
      kind: 'File',
      Name: { kind: 'Ident', Name: 'todo', NamePos: goPos(1, 9) },
      Decls: [{ kind: 'BadDecl', Pos: goPos(2, 1), End: goPos(2, 13) }]
    }
  }
});
assert.equal(goBadNodeImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(goBadNodeImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const malformedGoImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        file: { kind: 'File', Name: { kind: 'Ident', Name: 'todo' }, Decls: [] },
        diagnostics: [{ code: 'GoSyntaxError', message: 'expected declaration', loc: { line: 2, column: 1 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_go.go',
  sourceText: 'package todo\nfunc {\n'
});
assert.equal(malformedGoImport.diagnostics.some((diagnostic) => diagnostic.code === 'GoSyntaxError'), true);
assert.equal(malformedGoImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingGoImport = await runNativeImporterAdapter(createGoAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_go.go',
  sourceText: 'package todo\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingGoImport.nativeAst.nodes[missingGoImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingGoImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const javaFixtureSource = 'package demo;\nimport java.util.List;\npublic class Todo {\n  private String title;\n  public Todo(String title) { this.title = title; }\n  public void addTodo(String title) {}\n}\ninterface Store { void save(Todo todo); }\nenum Status { OPEN }\nrecord TodoRecord(String title) {}\n';
const javaRange = (line, startColumn, endColumn = startColumn + 1) => ({
  begin: { line, column: startColumn },
  end: { line, column: endColumn }
});
const javaFixture = {
  kind: 'CompilationUnit',
  packageDeclaration: {
    kind: 'PackageDeclaration',
    name: { qualifiedName: 'demo' },
    range: javaRange(1, 1, 14)
  },
  imports: [{
    kind: 'ImportDeclaration',
    name: { qualifiedName: 'java.util.List' },
    range: javaRange(2, 1, 23)
  }],
  types: [{
    kind: 'ClassDeclaration',
    name: { identifier: 'Todo' },
    modifiers: ['public'],
    range: javaRange(3, 1, 20),
    members: [{
      kind: 'FieldDeclaration',
      modifiers: ['private'],
      type: { name: 'String' },
      range: javaRange(4, 3, 23),
      variables: [{
        kind: 'VariableDeclarator',
        name: { identifier: 'title' },
        type: { name: 'String' },
        range: javaRange(4, 18, 23)
      }]
    }, {
      kind: 'ConstructorDeclaration',
      name: { identifier: 'Todo' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'title' },
        type: { name: 'String' }
      }],
      body: { kind: 'Block' },
      range: javaRange(5, 3, 52)
    }, {
      kind: 'MethodDeclaration',
      name: { identifier: 'addTodo' },
      returnType: { name: 'void' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'title' },
        type: { name: 'String' }
      }],
      body: { kind: 'Block' },
      range: javaRange(6, 3, 42)
    }]
  }, {
    kind: 'InterfaceDeclaration',
    name: { identifier: 'Store' },
    range: javaRange(8, 1, 43),
    members: [{
      kind: 'MethodDeclaration',
      name: { identifier: 'save' },
      parameters: [{
        kind: 'Parameter',
        name: { identifier: 'todo' },
        type: { name: 'Todo' }
      }],
      range: javaRange(8, 19, 39)
    }]
  }, {
    kind: 'EnumDeclaration',
    name: { identifier: 'Status' },
    entries: [{
      kind: 'EnumConstantDeclaration',
      name: { identifier: 'OPEN' },
      range: javaRange(9, 15, 19)
    }],
    range: javaRange(9, 1, 21)
  }, {
    kind: 'RecordDeclaration',
    name: { identifier: 'TodoRecord' },
    parameters: [{
      kind: 'Parameter',
      name: { identifier: 'title' },
      type: { name: 'String' }
    }],
    range: javaRange(10, 1, 34)
  }]
};
const javaAstImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter({
  javaVersion: '21',
  sourceLevel: '21'
}), {
  sourcePath: 'src/JavaAst.java',
  sourceText: javaFixtureSource,
  adapterOptions: {
    ast: javaFixture,
    classPath: ['target/classes'],
    modulePath: ['mods'],
    bindingEvidence: { solver: 'fixture-symbol-solver', hash: 'java-bindings-fixture', bindings: ['Todo'] }
  }
});
assert.equal(javaAstImport.adapter.parser, 'javac');
assert.equal(javaAstImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(javaAstImport.nativeAst.parser, 'javac');
assert.equal(javaAstImport.metadata.astFormat, 'java-ast');
assert.equal(javaAstImport.metadata.javaVersion, '21');
assert.equal(javaAstImport.metadata.sourceLevel, '21');
assert.equal(javaAstImport.metadata.classPathEvidence.entryCount, 1);
assert.equal(javaAstImport.metadata.modulePathEvidence.entryCount, 1);
assert.equal(javaAstImport.metadata.bindingEvidence.hash, 'java-bindings-fixture');
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'java.util.List' && symbol.kind === 'module'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'method'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'method'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'interface'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'type'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'OPEN' && symbol.kind === 'enumMember'), true);
assert.equal(javaAstImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoRecord' && symbol.kind === 'type'), true);
assert.equal(javaAstImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(javaAstImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
const scannedJavaFixtureImport = importNativeSource({
  language: 'java',
  sourcePath: 'src/JavaAst.java',
  sourceText: javaFixtureSource
});
assert.equal(javaAstImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(javaAstImport.losses.length, 0);
assert.equal(scannedJavaFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedJavaFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(javaAstImport.semanticIndex.symbols.length > scannedJavaFixtureImport.semanticIndex.symbols.length);
const javaGeneratedImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.java',
  sourceText: 'package demo;\n@Generated public class GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'CompilationUnit',
      generated: true,
      types: [{
        kind: 'ClassDeclaration',
        name: { identifier: 'GeneratedTodo' },
        annotations: [{ kind: 'Annotation', name: { qualifiedName: 'javax.annotation.Generated' } }]
      }]
    }
  }
});
assert.equal(javaGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(javaGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedJavaImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: {
          kind: 'CompilationUnit',
          types: [{ kind: 'Erroneous', problem: true, range: javaRange(2, 1, 14) }]
        },
        diagnostics: [{ code: 'JavaSyntaxError', message: 'expected class body', loc: { line: 2, column: 13 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_java.java',
  sourceText: 'class Broken\n'
});
assert.equal(malformedJavaImport.diagnostics.some((diagnostic) => diagnostic.code === 'JavaSyntaxError'), true);
assert.equal(malformedJavaImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedJavaImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingJavaImport = await runNativeImporterAdapter(createJavaAstNativeImporterAdapter(), {
  sourcePath: 'src/missing_java.java',
  sourceText: 'class Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingJavaImport.nativeAst.nodes[missingJavaImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingJavaImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const csharpFixtureSource = 'using System;\nnamespace Demo;\npublic class Todo {\n  private string title;\n  public Todo(string title) { this.title = title; }\n  public void AddTodo(string title) {}\n  public string Title { get; init; }\n  public event EventHandler? Changed;\n}\npublic interface Store { void Save(Todo todo); }\npublic enum Status { Open }\npublic record TodoRecord(string Title);\npublic delegate void TodoChanged(object sender, EventArgs args);\n';
const csharpLineSpan = (line, startColumn, endColumn = startColumn + 1) => ({
  startLinePosition: { line: line - 1, character: startColumn - 1 },
  endLinePosition: { line: line - 1, character: endColumn - 1 }
});
const csharpFixture = {
  kind: 'CompilationUnit',
  usings: [{
    kind: 'UsingDirectiveSyntax',
    name: { qualifiedName: 'System' },
    lineSpan: csharpLineSpan(1, 1, 14)
  }],
  members: [{
    kind: 'FileScopedNamespaceDeclarationSyntax',
    name: { qualifiedName: 'Demo' },
    lineSpan: csharpLineSpan(2, 1, 16),
    members: [{
      kind: 'ClassDeclarationSyntax',
      identifier: { text: 'Todo' },
      modifiers: ['public'],
      lineSpan: csharpLineSpan(3, 1, 20),
      members: [{
        kind: 'FieldDeclarationSyntax',
        modifiers: ['private'],
        declaration: {
          type: { name: 'string' },
          variables: [{
            kind: 'VariableDeclaratorSyntax',
            identifier: { text: 'title' },
            lineSpan: csharpLineSpan(4, 18, 23)
          }]
        },
        lineSpan: csharpLineSpan(4, 3, 24)
      }, {
        kind: 'ConstructorDeclarationSyntax',
        identifier: { text: 'Todo' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'title' },
            type: { name: 'string' }
          }]
        },
        body: { kind: 'BlockSyntax', statements: [] },
        lineSpan: csharpLineSpan(5, 3, 52)
      }, {
        kind: 'MethodDeclarationSyntax',
        identifier: { text: 'AddTodo' },
        returnType: { name: 'void' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'title' },
            type: { name: 'string' }
          }]
        },
        body: { kind: 'BlockSyntax', statements: [] },
        lineSpan: csharpLineSpan(6, 3, 42)
      }, {
        kind: 'PropertyDeclarationSyntax',
        identifier: { text: 'Title' },
        type: { name: 'string' },
        accessorList: { kind: 'AccessorListSyntax' },
        lineSpan: csharpLineSpan(7, 3, 37)
      }, {
        kind: 'EventFieldDeclarationSyntax',
        declaration: {
          type: { name: 'EventHandler?' },
          variables: [{
            kind: 'VariableDeclaratorSyntax',
            identifier: { text: 'Changed' },
            lineSpan: csharpLineSpan(8, 30, 37)
          }]
        },
        lineSpan: csharpLineSpan(8, 3, 38)
      }]
    }, {
      kind: 'InterfaceDeclarationSyntax',
      identifier: { text: 'Store' },
      lineSpan: csharpLineSpan(10, 1, 55),
      members: [{
        kind: 'MethodDeclarationSyntax',
        identifier: { text: 'Save' },
        returnType: { name: 'void' },
        parameterList: {
          parameters: [{
            kind: 'ParameterSyntax',
            identifier: { text: 'todo' },
            type: { name: 'Todo' }
          }]
        },
        lineSpan: csharpLineSpan(10, 26, 45)
      }]
    }, {
      kind: 'EnumDeclarationSyntax',
      identifier: { text: 'Status' },
      members: [{
        kind: 'EnumMemberDeclarationSyntax',
        identifier: { text: 'Open' },
        lineSpan: csharpLineSpan(11, 22, 26)
      }],
      lineSpan: csharpLineSpan(11, 1, 28)
    }, {
      kind: 'RecordDeclarationSyntax',
      identifier: { text: 'TodoRecord' },
      parameterList: {
        parameters: [{
          kind: 'ParameterSyntax',
          identifier: { text: 'Title' },
          type: { name: 'string' }
        }]
      },
      lineSpan: csharpLineSpan(12, 1, 39)
    }, {
      kind: 'DelegateDeclarationSyntax',
      identifier: { text: 'TodoChanged' },
      returnType: { name: 'void' },
      lineSpan: csharpLineSpan(13, 1, 64)
    }]
  }]
};
const csharpRoslynImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter({
  languageVersion: '12',
  nullableContext: 'enabled'
}), {
  sourcePath: 'src/RoslynTodo.cs',
  sourceText: csharpFixtureSource,
  adapterOptions: {
    ast: csharpFixture,
    projectReferences: { hash: 'csharp-projects-fixture', projects: ['Todo.csproj'] },
    analyzerDiagnostics: { diagnostics: [] },
    semanticModelEvidence: { solver: 'roslyn', hash: 'csharp-semantic-fixture', symbols: ['Todo'] },
    sourceGeneratorEvidence: { hash: 'csharp-generators-fixture', generators: [] }
  }
});
assert.equal(csharpRoslynImport.adapter.parser, 'roslyn');
assert.equal(csharpRoslynImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(csharpRoslynImport.adapter.coverage.tokens, true);
assert.equal(csharpRoslynImport.adapter.coverage.trivia, true);
assert.equal(csharpRoslynImport.nativeAst.parser, 'roslyn');
assert.equal(csharpRoslynImport.metadata.astFormat, 'roslyn-csharp');
assert.equal(csharpRoslynImport.metadata.languageVersion, '12');
assert.equal(csharpRoslynImport.metadata.nullableContext, 'enabled');
assert.equal(csharpRoslynImport.metadata.projectReferences.hash, 'csharp-projects-fixture');
assert.equal(csharpRoslynImport.metadata.semanticModelEvidence.hash, 'csharp-semantic-fixture');
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'System' && symbol.kind === 'module'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Demo' && symbol.kind === 'namespace'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'method'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'AddTodo' && symbol.kind === 'method'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Title' && symbol.kind === 'property'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Changed' && symbol.kind === 'event'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Store' && symbol.kind === 'interface'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'type'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Open' && symbol.kind === 'enumMember'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoRecord' && symbol.kind === 'class'), true);
assert.equal(csharpRoslynImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoChanged' && symbol.kind === 'type'), true);
assert.equal(csharpRoslynImport.semanticIndex.occurrences.some((occurrence) => occurrence.role === 'import'), true);
assert.equal(csharpRoslynImport.sourceMaps[0].mappings.some((mapping) => mapping.semanticSymbolId.includes('addtodo')), true);
const scannedCSharpFixtureImport = importNativeSource({
  language: 'csharp',
  sourcePath: 'src/RoslynTodo.cs',
  sourceText: csharpFixtureSource
});
assert.equal(csharpRoslynImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'ready');
assert.equal(csharpRoslynImport.losses.length, 0);
assert.equal(scannedCSharpFixtureImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
assert.equal(scannedCSharpFixtureImport.metadata.nativeImportLossSummary.exactAst, false);
assert.ok(csharpRoslynImport.semanticIndex.symbols.length > scannedCSharpFixtureImport.semanticIndex.symbols.length);
const csharpGeneratedImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.g.cs',
  sourceText: 'using System.CodeDom.Compiler;\n[GeneratedCode("tool", "1")] public class GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'CompilationUnit',
      members: [{
        kind: 'ClassDeclarationSyntax',
        identifier: { text: 'GeneratedTodo' },
        attributeLists: [{ kind: 'AttributeListSyntax', attributes: [{ kind: 'AttributeSyntax', name: { qualifiedName: 'GeneratedCode' } }] }]
      }]
    }
  }
});
assert.equal(csharpGeneratedImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
assert.equal(csharpGeneratedImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const malformedCSharpImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter({
  parserModule: {
    parse() {
      return {
        ast: {
          kind: 'CompilationUnit',
          members: [{ kind: 'SkippedTokensTrivia', containsDiagnostics: true, lineSpan: csharpLineSpan(2, 1, 9) }]
        },
        diagnostics: [{ code: 'CS1513', message: '} expected', loc: { line: 2, column: 8 } }]
      };
    }
  }
}), {
  sourcePath: 'src/malformed_csharp.cs',
  sourceText: 'class Broken\n'
});
assert.equal(malformedCSharpImport.diagnostics.some((diagnostic) => diagnostic.code === 'CS1513'), true);
assert.equal(malformedCSharpImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedCSharpImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingCSharpImport = await runNativeImporterAdapter(createCSharpRoslynNativeImporterAdapter(), {
  sourcePath: 'src/missing_csharp.cs',
  sourceText: 'class Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingCSharpImport.nativeAst.nodes[missingCSharpImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingCSharpImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const swiftFixtureSource = 'import Foundation\nstruct Todo { var title: String\n func addTodo(_ title: String) {}\n #if DEBUG\n #endif\n #Observable\n}\n';
const swiftFixture = {
  kind: 'SourceFileSyntax',
  statements: [{
    kind: 'ImportDeclSyntax',
    importPath: [{ name: { text: 'Foundation' } }],
    startLine: 1,
    startColumn: 1
  }, {
    kind: 'StructDeclSyntax',
    identifier: { text: 'Todo' },
    startLine: 2,
    startColumn: 1,
    members: [{
      kind: 'VariableDeclSyntax',
      bindings: [{
        kind: 'PatternBindingSyntax',
        pattern: { identifier: { text: 'title' } },
        typeAnnotation: { type: { name: 'String' } },
        startLine: 2,
        startColumn: 15
      }]
    }, {
      kind: 'FunctionDeclSyntax',
      identifier: { text: 'addTodo' },
      signature: { parameterClause: { parameters: [{ kind: 'FunctionParameterSyntax', firstName: { text: 'title' }, type: { name: 'String' } }] } },
      body: { kind: 'CodeBlockSyntax', statements: [] },
      startLine: 3,
      startColumn: 2
    }, {
      kind: 'IfConfigDeclSyntax',
      startLine: 4,
      startColumn: 2
    }, {
      kind: 'FreestandingMacroExpansionSyntax',
      name: { text: 'Observable' },
      startLine: 6,
      startColumn: 2
    }]
  }, {
    kind: 'EnumDeclSyntax',
    identifier: { text: 'Status' },
    startLine: 8,
    startColumn: 1,
    members: [{
      kind: 'EnumCaseDeclSyntax',
      elements: [{ kind: 'EnumCaseElementSyntax', identifier: { text: 'open' } }]
    }]
  }]
};
const swiftSyntaxImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter({
  swiftVersion: '6',
  languageMode: 'swift-6'
}), {
  sourcePath: 'src/Todo.swift',
  sourceText: swiftFixtureSource,
  adapterOptions: {
    ast: swiftFixture,
    sourceKitEvidence: { solver: 'sourcekit-lsp', hash: 'swift-sourcekit-fixture', symbols: ['Todo'] },
    macroExpansionEvidence: { hash: 'swift-macro-fixture', macros: ['Observable'] },
    packageResolutionEvidence: { hash: 'swift-package-fixture', packages: ['DemoPackage'] }
  }
});
assert.equal(swiftSyntaxImport.adapter.parser, 'swift-syntax');
assert.equal(swiftSyntaxImport.adapter.coverage.exactness, 'parser-tree');
assert.equal(swiftSyntaxImport.adapter.coverage.tokens, true);
assert.equal(swiftSyntaxImport.adapter.coverage.trivia, true);
assert.equal(swiftSyntaxImport.nativeAst.parser, 'swift-syntax');
assert.equal(swiftSyntaxImport.metadata.astFormat, 'swift-syntax');
assert.equal(swiftSyntaxImport.metadata.swiftVersion, '6');
assert.equal(swiftSyntaxImport.metadata.sourceKitEvidence.hash, 'swift-sourcekit-fixture');
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Foundation' && symbol.kind === 'module'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'struct'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'function'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Status' && symbol.kind === 'enum'), true);
assert.equal(swiftSyntaxImport.semanticIndex.symbols.some((symbol) => symbol.name === 'open' && symbol.kind === 'enumMember'), true);
assert.equal(swiftSyntaxImport.losses.some((loss) => loss.kind === 'conditionalCompilation'), true);
assert.equal(swiftSyntaxImport.losses.some((loss) => loss.kind === 'macroExpansion'), true);
assert.equal(swiftSyntaxImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const generatedSwiftImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter(), {
  sourcePath: 'src/GeneratedTodo.generated.swift',
  sourceText: 'struct GeneratedTodo {}\n',
  adapterOptions: {
    ast: {
      kind: 'SourceFileSyntax',
      statements: [{ kind: 'StructDeclSyntax', identifier: { text: 'GeneratedTodo' } }]
    }
  }
});
assert.equal(generatedSwiftImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const missingSwiftImport = await runNativeImporterAdapter(createSwiftSyntaxNativeImporterAdapter(), {
  sourcePath: 'src/missing_swift.swift',
  sourceText: 'struct Missing {}\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingSwiftImport.nativeAst.nodes[missingSwiftImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingSwiftImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
const kotlinFixtureSource = 'package demo\nimport kotlinx.coroutines.flow.Flow\n@Serializable data class Todo(val title: String) { suspend fun addTodo(title: String) {} }\nexpect class PlatformStore\n';
const kotlinFixture = {
  kind: 'KtFile',
  packageDirective: {
    kind: 'KtPackageDirective',
    fqName: 'demo',
    startLine: 1,
    startColumn: 1
  },
  imports: [{
    kind: 'KtImportDirective',
    importedFqName: 'kotlinx.coroutines.flow.Flow',
    startLine: 2,
    startColumn: 1
  }],
  declarations: [{
    kind: 'KtClass',
    name: 'Todo',
    classKind: 'class',
    modifiers: ['data'],
    annotationEntries: [{ kind: 'KtAnnotationEntry', shortName: 'Serializable' }],
    startLine: 3,
    startColumn: 1,
    declarations: [{
      kind: 'KtPrimaryConstructor',
      parameters: [{
        kind: 'KtParameter',
        name: 'title',
        typeReference: { text: 'String' },
        valOrVarKeyword: 'val',
        startLine: 3,
        startColumn: 35
      }]
    }, {
      kind: 'KtNamedFunction',
      name: 'addTodo',
      modifiers: ['suspend'],
      valueParameters: [{ kind: 'KtParameter', name: 'title', typeReference: { text: 'String' } }],
      bodyExpression: { kind: 'KtBlockExpression' },
      startLine: 3,
      startColumn: 56
    }]
  }, {
    kind: 'KtClass',
    name: 'PlatformStore',
    modifiers: ['expect'],
    classKind: 'class',
    startLine: 4,
    startColumn: 1
  }]
};
const kotlinPsiImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter({
  kotlinVersion: '2.1',
  languageVersion: '2.1',
  apiVersion: '2.1',
  analysisApiEvidence: { hash: 'kotlin-analysis-api-fixture', symbols: ['Todo'] },
  multiplatformEvidence: { hash: 'kotlin-mpp-fixture', targetPlatform: 'common' }
}), {
  sourcePath: 'src/Todo.kt',
  sourceText: kotlinFixtureSource,
  adapterOptions: { ast: kotlinFixture }
});
assert.equal(kotlinPsiImport.adapter.parser, 'kotlin-psi');
assert.equal(kotlinPsiImport.adapter.coverage.exactness, 'exact-parser-ast');
assert.equal(kotlinPsiImport.adapter.coverage.tokens, true);
assert.equal(kotlinPsiImport.adapter.coverage.trivia, true);
assert.equal(kotlinPsiImport.nativeAst.parser, 'kotlin-psi');
assert.equal(kotlinPsiImport.metadata.astFormat, 'kotlin-psi');
assert.equal(kotlinPsiImport.metadata.kotlinVersion, '2.1');
assert.equal(kotlinPsiImport.metadata.analysisApiEvidence.hash, 'kotlin-analysis-api-fixture');
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'demo' && symbol.kind === 'namespace'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'kotlinx.coroutines.flow.Flow' && symbol.kind === 'module'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'Todo' && symbol.kind === 'class'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'title' && symbol.kind === 'property'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo' && symbol.kind === 'method'), true);
assert.equal(kotlinPsiImport.semanticIndex.symbols.some((symbol) => symbol.name === 'PlatformStore' && symbol.kind === 'class'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'metaprogramming'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'coroutine'), true);
assert.equal(kotlinPsiImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'expect-actual'), true);
assert.equal(kotlinPsiImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'needs-review');
const generatedKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'build/generated/ksp/GeneratedTodo.kt',
  sourceText: 'class GeneratedTodo\n',
  adapterOptions: {
    ast: {
      kind: 'KtFile',
      declarations: [{ kind: 'KtClass', name: 'GeneratedTodo' }]
    }
  }
});
assert.equal(generatedKotlinImport.losses.some((loss) => loss.kind === 'generatedCode'), true);
const scriptKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'scripts/setup.main.kts',
  sourceText: 'println("setup")\n',
  adapterOptions: {
    ast: {
      kind: 'KtScript',
      statements: [{ kind: 'KtCallExpression', calleeExpression: { text: 'println' } }]
    }
  }
});
assert.equal(scriptKotlinImport.metadata.script, true);
assert.equal(scriptKotlinImport.losses.some((loss) => loss.kind === 'unsupportedSemantic' && loss.metadata?.feature === 'script'), true);
const malformedKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter({
  parse(sourceText) {
    return {
      ast: { kind: 'KtFile', declarations: [{ kind: 'PsiErrorElement', text: sourceText, startLine: 2, startColumn: 1 }] },
      diagnostics: [{ code: 'KOTLIN_PARSE', message: 'expected declaration', loc: { line: 2, column: 1 } }]
    };
  }
}), {
  sourcePath: 'src/Broken.kt',
  sourceText: 'class Broken {\n'
});
assert.equal(malformedKotlinImport.diagnostics.some((diagnostic) => diagnostic.code === 'KOTLIN_PARSE'), true);
assert.equal(malformedKotlinImport.losses.some((loss) => loss.kind === 'unsupportedSyntax' && loss.severity === 'error'), true);
assert.equal(malformedKotlinImport.metadata.nativeImportLossSummary.semanticMergeReadiness, 'blocked');
const missingKotlinImport = await runNativeImporterAdapter(createKotlinPsiNativeImporterAdapter(), {
  sourcePath: 'src/missing_kotlin.kt',
  sourceText: 'class Missing\n',
  adapterOptions: { ast: { body: [] } }
});
assert.equal(missingKotlinImport.nativeAst.nodes[missingKotlinImport.nativeAst.rootId].kind, 'MissingInjectedParser');
assert.equal(missingKotlinImport.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.parser.missing'), true);
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
  sourceText: '// kept comment\nimport { nanoid } from "nanoid";\nexport function addTodo(title) { return { id: nanoid(), title }; }\nexport const TODO_LIMIT = 128;\nexport const appRoutes = [\n  { path: "/todos", component: TodoStore },\n  { path: "/settings", component: TodoStore }\n];\nexport const siteContent = {\n  docs: { title: "Docs" },\n  legal: { title: "Terms" },\n  formatTitle: (title) => title.trim()\n};\nexport const runtimeConfig = {\n  limits: { todos: TODO_LIMIT },\n  resolve(id) { return id; }\n};\nexport const helpers = {\n  plain: 1\n};\nexport class TodoStore {\n  save(title) { return addTodo(title); }\n}\n'
});
assert.equal(scannedJsImport.nativeAst.rootId, 'native_root');
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'addTodo'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TODO_LIMIT'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'TodoStore.save'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'appRoutes./todos' && symbol.kind === 'route'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'siteContent.docs'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'runtimeConfig.resolve' && symbol.kind === 'function'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.name === 'helpers.plain' && symbol.metadata.ownershipRegionKind === 'property'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'route'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'content'), true);
assert.equal(scannedJsImport.semanticIndex.symbols.some((symbol) => symbol.metadata.ownershipRegionKind === 'config'), true);
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
assert.equal(scannedJsImport.metadata.kernelSourcePreservationSummary.total >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationSummary.exact >= 1, true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationRecords.some((record) => record.kind === 'frontier.lang.sourcePreservation'), true);
assert.equal(scannedJsImport.metadata.kernelSourcePreservationRecords.some((record) => record.level === 'declaration' || record.level === 'estimated'), true);
assert.equal(scannedJsImport.sourceMaps[0].mappings.some((mapping) => mapping.preservation === 'declaration' || mapping.preservation === 'estimated'), true);
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
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('route'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('content'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('config'), true);
assert.equal(scannedJsSidecar.regionTaxonomy.presentKinds.includes('property'), true);
assert.equal(scannedJsSidecar.summary.regionKinds >= 2, true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.name === 'TodoStore.save' && symbol.ownershipRegionId), true);
assert.equal(scannedJsSidecar.symbols.some((symbol) => symbol.ownershipRegionKind), true);
assert.equal(scannedJsSidecar.imports.some((entry) => entry.regionTaxonomy?.presentKinds?.length), true);
assert.equal(scannedJsSidecar.imports[0].sourcePreservationRecordCount >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.imports[0].sourcePreservationLevels.includes('exact'), true);
assert.equal(scannedJsImport.universalAst.layers.semanticSymbols.semanticSymbolIds.length >= scannedJsImport.semanticIndex.symbols.length, true);
assert.equal(scannedJsImport.universalAst.layers.projectionEvidence.sourceMapMappingIds.length >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.imports[0].universalAstLayerCount > 0, true);
assert.equal(scannedJsSidecar.imports[0].universalAstLayerNames.includes('semanticSymbols'), true);
assert.equal(scannedJsSidecar.universalAstLayers.names.includes('projectionEvidence'), true);
assert.equal(scannedJsSidecar.summary.universalAstLayers, scannedJsSidecar.universalAstLayers.total);
assert.equal(scannedJsSidecar.sourcePreservation.total >= scannedJsImport.sourceMaps[0].mappings.length, true);
assert.equal(scannedJsSidecar.sourcePreservation.exact >= 1, true);
assert.equal((scannedJsSidecar.sourcePreservation.byLevel.declaration ?? 0) + (scannedJsSidecar.sourcePreservation.byLevel.estimated ?? 0) >= 1, true);
assert.equal(scannedJsSidecar.summary.sourcePreservationRecords, scannedJsSidecar.sourcePreservation.total);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.supportedOperations.includes('replace-import')), true);
assert.equal(scannedJsSidecar.patchHints.some((hint) => hint.sourcePath === 'src/scanned.js' && hint.projection.targetPath === 'dist/scanned.js'), true);
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
assert.equal(unchangedDeclarationChangeSet.summary.symbols, 0);
assert.equal(unchangedDeclarationChangeSet.summary.regions, 1);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].granularity, 'file');
assert.equal(unchangedDeclarationChangeSet.reasons.some((reason) => reason.includes('file-level review')), true);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.admission.action, 'review-file');
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.autoMergeClaim, false);
assert.equal(unchangedDeclarationChangeSet.changedRegions[0].metadata.changedRegionProjection.sourceMapLinks.some((link) => link.side === 'before'), true);
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
const sameLanguageNativeCompile = compileNativeSource(preservedNativeImport, {
  sourceMapId: 'smoke-preserved-compile-map',
  targetPath: 'dist/preserved-native.js'
});
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
assert.equal(sameLanguageNativeCompile.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(sameLanguageNativeCompile.sourceMap.id, 'smoke-preserved-compile-map');
assert.equal(sameLanguageNativeCompile.sourceMap.targetPath, 'dist/preserved-native.js');
assert.equal(sameLanguageNativeCompile.sourceMap.targetHash, sameLanguageNativeCompile.outputHash);
assert.equal(sameLanguageNativeCompile.sourceMaps.length, 1);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.length >= 1, true);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.some((mapping) => mapping.precision === 'exact'), true);
assert.equal(sameLanguageNativeCompile.sourceMap.mappings.some((mapping) => mapping.generatedSpan?.targetPath === 'dist/preserved-native.js'), true);
assert.equal(sameLanguageNativeCompile.metadata.sourceMapIds.includes('smoke-preserved-compile-map'), true);
const nativeCompileWithoutSourceMap = compileNativeSource(preservedNativeImport, { emitSourceMap: false });
assert.equal(nativeCompileWithoutSourceMap.sourceMaps.length, 0);
assert.equal(nativeCompileWithoutSourceMap.sourceMap, undefined);
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
assert.equal(rustNativeCompileEmitted.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(rustNativeCompileEmitted.sourceMap.targetPath, 'src/scanned.rs');
assert.equal(rustNativeCompileEmitted.sourceMap.mappings.some((mapping) => mapping.semanticSymbolId?.includes('addtodo') && mapping.precision === 'declaration'), true);
assert.equal(rustNativeCompileEmitted.sourceMap.mappings.some((mapping) => mapping.generatedSpan?.targetPath === 'src/scanned.rs'), true);
const handledProjectionLossKinds = [
  'macroExpansion',
  'macroHygiene',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'dynamicRuntime',
  'dynamicDispatch',
  'generatedCode',
  'overloadResolution',
  'typeInference',
  'unsupportedSyntax',
  'unsupportedSemantic'
];
const jsToRustTargetAdapter = {
  id: 'fixture-js-to-rust-target-adapter',
  sourceLanguage: 'javascript',
  target: 'rust',
  version: '1.0.0',
  capabilities: ['declaration-stubs'],
  coverage: {
    readiness: 'ready',
    handledLossKinds: handledProjectionLossKinds,
    notes: ['Fixture adapter emits deterministic Rust declaration stubs for smoke tests.']
  },
  project(input) {
    assert.equal(input.sourceLanguage, 'javascript');
    assert.equal(input.target, 'rust');
    assert.equal(input.targetCoverage.lossClass, 'targetAdapterProjection');
    return {
      output: 'pub fn add_todo_from_adapter() {}\n',
      readiness: 'ready',
      evidence: [{
        id: 'evidence_fixture_js_to_rust_projected',
        kind: 'projection',
        status: 'passed',
        summary: 'Fixture JS-to-Rust target projection adapter emitted deterministic output.'
      }],
      metadata: { fixture: true }
    };
  }
};
const targetAdapterProjection = runNativeTargetProjectionAdapter(jsToRustTargetAdapter, {
  importResult: scannedJsImport,
  sourceProjection: stubNativeProjection,
  sourceLanguage: 'javascript',
  target: 'rust',
  targetCoverage: {
    target: 'rust',
    lossClass: 'targetAdapterProjection',
    supported: true,
    readiness: 'ready',
    lossKinds: [],
    categories: [],
    reason: 'fixture',
    notes: []
  },
  options: {},
  metadata: {}
});
assert.equal(targetAdapterProjection.kind, 'frontier.lang.nativeTargetProjection');
assert.equal(targetAdapterProjection.outputMode, 'target-adapter');
assert.match(targetAdapterProjection.output, /add_todo_from_adapter/);
assert.equal(targetAdapterProjection.evidence.some((entry) => entry.id === 'evidence_fixture_js_to_rust_projected'), true);
const rustNativeCompileWithAdapter = compileNativeSource(scannedJsImport, {
  target: 'rust',
  targetAdapters: [jsToRustTargetAdapter]
});
assert.equal(rustNativeCompileWithAdapter.ok, true);
assert.equal(rustNativeCompileWithAdapter.outputMode, 'target-adapter');
assert.equal(rustNativeCompileWithAdapter.output, 'pub fn add_todo_from_adapter() {}\n');
assert.equal(rustNativeCompileWithAdapter.targetProjection.adapter.id, 'fixture-js-to-rust-target-adapter');
assert.equal(rustNativeCompileWithAdapter.targetCoverage.lossClass, 'targetAdapterProjection');
assert.equal(rustNativeCompileWithAdapter.targetCoverage.adapterKind, 'targetProjection');
assert.equal(rustNativeCompileWithAdapter.projectionMatrix.summary.targetAdapterProjection >= 1, true);
assert.equal(rustNativeCompileWithAdapter.losses.some((loss) => loss.id.includes('missing_projection_adapter')), false);
assert.equal(rustNativeCompileWithAdapter.sourceMap.kind, 'frontier.lang.sourceMap');
assert.equal(rustNativeCompileWithAdapter.sourceMap.mappings.some((mapping) => mapping.metadata?.sourceMapOrigin === 'target-adapter-fallback'), true);
assert.equal(rustNativeCompileWithAdapter.sourceMap.targetHash, rustNativeCompileWithAdapter.outputHash);
const adapterProjectionMatrix = createProjectionTargetLossMatrix({
  imports: [scannedJsImport],
  targets: ['rust'],
  targetAdapters: [jsToRustTargetAdapter]
});
const jsToRustCoverage = adapterProjectionMatrix.languages.find((entry) => entry.language === 'javascript').targets.find((entry) => entry.target === 'rust');
assert.equal(jsToRustCoverage.lossClass, 'targetAdapterProjection');
assert.equal(jsToRustCoverage.supported, true);
assert.equal(jsToRustCoverage.adapter, 'fixture-js-to-rust-target-adapter');
const throwingTargetAdapter = {
  ...jsToRustTargetAdapter,
  id: 'fixture-js-to-rust-throwing-target-adapter',
  project() {
    throw new Error('fixture projection failed');
  }
};
const rustNativeCompileThrowingAdapter = compileNativeSource(scannedJsImport, {
  target: 'rust',
  targetAdapters: [throwingTargetAdapter]
});
assert.equal(rustNativeCompileThrowingAdapter.ok, false);
assert.equal(rustNativeCompileThrowingAdapter.outputMode, 'target-adapter');
assert.equal(rustNativeCompileThrowingAdapter.readiness.readiness, 'blocked');
assert.equal(rustNativeCompileThrowingAdapter.targetProjection.diagnostics.some((diagnostic) => diagnostic.code === 'targetAdapter.project.threw'), true);
assert.equal(rustNativeCompileThrowingAdapter.losses.some((loss) => loss.kind === 'targetProjectionLoss' && loss.severity === 'error'), true);
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
const parserFormatMatrix = createNativeParserAstFormatMatrix({
  generatedAt: 234,
  imports: [estreeAdapterImport, babelAdapterImport, tsAdapterImport, pythonAstImport, rustSynImport, clangImport, goAstImport, javaAstImport, kotlinPsiImport, csharpRoslynImport, swiftSyntaxImport, treeImport],
  adapters: [
    createEstreeNativeImporterAdapter(),
    createBabelNativeImporterAdapter(),
    createTypeScriptCompilerNativeImporterAdapter({ typescript: tsMock }),
    createPythonAstNativeImporterAdapter(),
    createRustSynNativeImporterAdapter(),
    createClangAstNativeImporterAdapter(),
    createGoAstNativeImporterAdapter(),
    createJavaAstNativeImporterAdapter(),
    createKotlinPsiNativeImporterAdapter(),
    createCSharpRoslynNativeImporterAdapter(),
    createSwiftSyntaxNativeImporterAdapter(),
    createTreeSitterNativeImporterAdapter({ language: 'javascript' })
  ]
});
assert.equal(parserFormatMatrix.kind, 'frontier.lang.nativeParserAstFormatMatrix');
assert.equal(parserFormatMatrix.generatedAt, 234);
assert.equal(NativeParserAstFormats.includes('python-ast'), true);
assert.equal(NativeParserAstFormats.includes('rust-syn'), true);
assert.equal(NativeParserAstFormats.includes('clang-ast-json'), true);
assert.equal(NativeParserAstFormats.includes('go-ast'), true);
assert.equal(NativeParserAstFormats.includes('java-ast'), true);
assert.equal(NativeParserAstFormats.includes('kotlin-psi'), true);
assert.equal(NativeParserAstFormats.includes('roslyn-csharp'), true);
assert.equal(NativeParserAstFormats.includes('swift-syntax'), true);
assert.equal(NativeParserAstFormatProfiles.some((profile) => profile.id === 'tree-sitter'), true);
assert.equal(getNativeParserAstFormatProfile('python_ast').id, 'python-ast');
assert.equal(getNativeParserAstFormatProfile('syn').id, 'rust-syn');
assert.equal(getNativeParserAstFormatProfile('libclang').id, 'clang-ast-json');
assert.equal(getNativeParserAstFormatProfile('go/parser').id, 'go-ast');
assert.equal(getNativeParserAstFormatProfile('javac').id, 'java-ast');
assert.equal(getNativeParserAstFormatProfile('kotlin-compiler').id, 'kotlin-psi');
assert.equal(getNativeParserAstFormatProfile('roslyn').id, 'roslyn-csharp');
assert.equal(getNativeParserAstFormatProfile('SwiftSyntax').id, 'swift-syntax');
assert.ok(parserFormatMatrix.summary.formats >= 11);
assert.equal(parserFormatMatrix.summary.imports, 12);
assert.ok(parserFormatMatrix.summary.nativeAstNodes >= 5);
assert.ok(parserFormatMatrix.summary.effectiveCapabilities.exactAst >= 9);
const pythonAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'python-ast');
assert.equal(pythonAstFormatCoverage.imports.total, 1);
assert.equal(pythonAstFormatCoverage.imports.readiness, 'ready');
assert.equal(pythonAstFormatCoverage.imports.symbols >= 2, true);
assert.equal(pythonAstFormatCoverage.adapters.total, 1);
const rustSynFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'rust-syn');
assert.equal(rustSynFormatCoverage.imports.total, 1);
assert.equal(rustSynFormatCoverage.imports.readiness, 'ready');
assert.equal(rustSynFormatCoverage.imports.symbols >= 3, true);
assert.equal(rustSynFormatCoverage.adapters.total, 1);
const clangAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'clang-ast-json');
assert.equal(clangAstFormatCoverage.imports.total, 1);
assert.equal(clangAstFormatCoverage.imports.readiness, 'ready');
assert.equal(clangAstFormatCoverage.imports.symbols >= 3, true);
assert.equal(clangAstFormatCoverage.adapters.total, 1);
const goAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'go-ast');
assert.equal(goAstFormatCoverage.imports.total, 1);
assert.equal(goAstFormatCoverage.imports.readiness, 'ready');
assert.equal(goAstFormatCoverage.imports.symbols >= 6, true);
assert.equal(goAstFormatCoverage.adapters.total, 1);
const javaAstFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'java-ast');
assert.equal(javaAstFormatCoverage.imports.total, 1);
assert.equal(javaAstFormatCoverage.imports.readiness, 'ready');
assert.equal(javaAstFormatCoverage.imports.symbols >= 8, true);
assert.equal(javaAstFormatCoverage.adapters.total, 1);
const kotlinPsiFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'kotlin-psi');
assert.equal(kotlinPsiFormatCoverage.imports.total, 1);
assert.equal(kotlinPsiFormatCoverage.imports.readiness, 'needs-review');
assert.equal(kotlinPsiFormatCoverage.imports.symbols >= 5, true);
assert.equal(kotlinPsiFormatCoverage.adapters.total, 1);
const csharpRoslynFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'roslyn-csharp');
assert.equal(csharpRoslynFormatCoverage.imports.total, 1);
assert.equal(csharpRoslynFormatCoverage.imports.readiness, 'ready');
assert.equal(csharpRoslynFormatCoverage.imports.symbols >= 10, true);
assert.equal(csharpRoslynFormatCoverage.adapters.total, 1);
const swiftSyntaxFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'swift-syntax');
assert.equal(swiftSyntaxFormatCoverage.imports.total, 1);
assert.equal(swiftSyntaxFormatCoverage.imports.readiness, 'needs-review');
assert.equal(swiftSyntaxFormatCoverage.imports.symbols >= 5, true);
assert.equal(swiftSyntaxFormatCoverage.adapters.total, 1);
const treeSitterFormatCoverage = parserFormatMatrix.formats.find((entry) => entry.id === 'tree-sitter');
assert.equal(treeSitterFormatCoverage.imports.total, 1);
assert.equal(treeSitterFormatCoverage.supportsIncremental, true);
const parserFeatureMatrix = createNativeParserFeatureMatrix({
  generatedAt: 345,
  imports: [estreeAdapterImport, scannedEstreeFixtureImport, rustSynMacroImport],
  adapters: [
    createEstreeNativeImporterAdapter(),
    createRustSynNativeImporterAdapter()
  ],
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation']
});
assert.equal(parserFeatureMatrix.kind, 'frontier.lang.nativeParserFeatureMatrix');
assert.equal(parserFeatureMatrix.generatedAt, 345);
assert.deepEqual(parserFeatureMatrix.metadata.categories, [...NativeParserFeatureCategories]);
assert.deepEqual(parserFeatureMatrix.metadata.statuses, [...NativeParserFeatureCoverageStatuses]);
assert.equal(parserFeatureMatrix.metadata.requiredFeatures.includes('syntax'), true);
assert.equal(parserFeatureMatrix.summary.parsers >= 2, true);
assert.equal(parserFeatureMatrix.summary.byFeatureStatus.syntax.full >= 1, true);
assert.equal(parserFeatureMatrix.summary.byFeatureStatus.macroMetaprogramming['evidence-required'] >= 1, true);
const estreeFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'javascript',
  parser: 'estree',
  requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
  minimumReadiness: 'ready'
});
assert.equal(estreeFeatureQuery.kind, 'frontier.lang.nativeParserFeatureQuery');
assert.equal(estreeFeatureQuery.found, true);
assert.equal(estreeFeatureQuery.row.features.syntax.status, 'full');
assert.equal(estreeFeatureQuery.row.features.semantic.status, 'full');
assert.equal(estreeFeatureQuery.row.features.sourcePreservation.status, 'full');
assert.equal(estreeFeatureQuery.row.imports.readiness, 'ready');
assert.equal(estreeFeatureQuery.merge.mergeReady, true);
assert.deepEqual(estreeFeatureQuery.merge.blockingFeatures, []);
const lightweightFeatureQuery = queryNativeParserFeatureMatrix(
  createNativeParserFeatureMatrix({
    imports: [scannedEstreeFixtureImport],
    includeEmptyParsers: false
  }),
  {
    language: 'javascript',
    parser: 'javascript.lightweight-declaration-scan',
    requiredFeatures: ['syntax', 'semantic', 'sourcePreservation'],
    minimumReadiness: 'ready'
  }
);
assert.equal(lightweightFeatureQuery.found, true);
assert.equal(lightweightFeatureQuery.row.features.syntax.status, 'partial');
assert.equal(lightweightFeatureQuery.row.imports.readiness, 'needs-review');
assert.equal(lightweightFeatureQuery.merge.mergeReady, false);
assert.equal(lightweightFeatureQuery.merge.blockingFeatures.includes('syntax'), true);
const rustMacroFeatureQuery = queryNativeParserFeatureMatrix(parserFeatureMatrix, {
  language: 'rust',
  parser: 'syn',
  requiredFeatures: ['syntax', 'semantic', 'macroMetaprogramming'],
  minimumReadiness: 'ready'
});
assert.equal(rustMacroFeatureQuery.found, true);
assert.equal(rustMacroFeatureQuery.row.features.macroMetaprogramming.status, 'evidence-required');
assert.equal(rustMacroFeatureQuery.merge.mergeReady, false);
assert.equal(rustMacroFeatureQuery.merge.blockingFeatures.includes('macroMetaprogramming'), true);
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
assert.equal(universalAst.layers.mergeEvidence.evidenceIds.length > 0, true);
const universalJson = writeUniversalAstJson(universalAst);
assert.equal(readUniversalAstJson(universalJson).document.id, 'mod_todo');
assert.match(compileFrontierSource(source, { target: 'rust' }).output, /pub struct Todo/);
assert.match(compileFrontierSource(source, { target: 'python' }).output, /class Todo/);
assert.match(compileFrontierSource(source, { target: 'c' }).output, /typedef struct Todo/);

const bad = compileFrontierSource('module Bad @id("mod_bad")\nentity Bad @id("ent_bad") { missing: UnknownType }', { target: 'typescript' });
assert.equal(bad.ok, false);
assert.equal(bad.ast, undefined);
assert.equal(bad.output, '');
