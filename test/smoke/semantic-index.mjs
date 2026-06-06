import { assert } from './helpers.mjs';
import { nativeImport } from './compile-core.mjs';
import {
  classifyNativeImportReadiness,
  createSemanticSlice,
  createSemanticSliceAdmissionRecord,
  ExternalSemanticIndexFormats,
  getNativeImportFeatureEvidencePolicy,
  importExternalSemanticIndex,
  importNativeSource,
  NativeImportFeatureEvidencePolicies,
  NativeImportLossKinds,
  NativeImportTaxonomyKinds,
  readSemanticSliceJson,
  summarizeNativeImportFeatureEvidence,
  summarizeNativeImportLosses,
  testSemanticSlice,
  writeSemanticSliceJson
} from './compiler-api.mjs';

const semanticSliceSource = `
export function parseExpression(input) {
  return parseTerm(input);
}

export function parseTerm(input) {
  return input;
}
`;
const semanticSliceImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/parser.ts',
  sourceText: semanticSliceSource
});
const semanticSlice = createSemanticSlice(semanticSliceImport, {
  entryRefs: ['symbol:parseExpression'],
  includeDependencies: true,
  focusedCommands: ['npm test -- parser-expression'],
  fixtureHints: ['operator precedence corpus']
});
assert.equal(semanticSlice.kind, 'frontier.lang.semanticSlice');
assert.equal(semanticSlice.entryRefs[0], 'symbol:parseExpression');
assert.equal(semanticSlice.unresolvedEntryRefs.length, 0);
assert.equal(semanticSlice.symbols.some((symbol) => symbol.name === 'parseExpression'), true);
assert.equal(semanticSlice.sourceMapLinks.length >= 1, true);
assert.equal(semanticSlice.sourceFiles.some((file) => file.path === 'src/parser.ts' && file.sourceHash === semanticSliceImport.nativeSource.sourceHash), true);
assert.equal(semanticSlice.mergeAdmission.autoMergeClaim, false);
assert.equal(semanticSlice.mergeAdmission.conflictKeys.some((key) => key.includes('parseexpression') || key.includes('parseExpression')), true);
assert.equal(semanticSlice.verification.focusedCommands[0], 'npm test -- parser-expression');
const semanticSliceGate = testSemanticSlice(semanticSlice, { currentSources: { 'src/parser.ts': semanticSliceSource } });
assert.equal(semanticSliceGate.kind, 'frontier.lang.semanticSliceTestResult');
assert.equal(semanticSliceGate.status, 'passed');
assert.equal(semanticSliceGate.summary.sourceHashChecks, 1);
const semanticSliceAdmission = createSemanticSliceAdmissionRecord(semanticSlice, {
  testResult: semanticSliceGate
});
assert.equal(semanticSliceAdmission.kind, 'frontier.lang.semanticSliceAdmission');
assert.equal(semanticSliceAdmission.autoMergeClaim, false);
assert.equal(semanticSliceAdmission.mergeScore.schema, 'frontier.lang.semanticMergeScore.v1');
assert.equal(semanticSliceAdmission.mergeScore.value > 50, true);
assert.equal(semanticSliceAdmission.mergeScore.sortKey > semanticSliceAdmission.mergeScore.value, true);
assert.equal(semanticSliceAdmission.mergeScore.components.semanticSelection.status, 'strong');
assert.equal(semanticSliceAdmission.mergeScore.components.sourceFreshness.score, 100);
assert.equal(semanticSliceAdmission.counts.focusedCommands, 1);
assert.equal(semanticSliceAdmission.counts.assertions, semanticSliceGate.summary.assertions);
const directSemanticSliceAdmission = createSemanticSliceAdmissionRecord(semanticSlice, {
  currentSources: { 'src/parser.ts': semanticSliceSource }
});
assert.equal(directSemanticSliceAdmission.testResult.status, 'passed');
assert.equal(directSemanticSliceAdmission.mergeScore.components.sourceFreshness.score, 100);
const staleSemanticSliceGate = testSemanticSlice(semanticSlice, { currentSources: { 'src/parser.ts': semanticSliceSource + '\n// changed\n' } });
assert.equal(staleSemanticSliceGate.status, 'failed');
assert.equal(staleSemanticSliceGate.assertions.some((entry) => entry.id === 'sourceHash:src/parser.ts' && entry.status === 'failed'), true);
const staleSemanticSliceAdmission = createSemanticSliceAdmissionRecord(semanticSlice, {
  testResult: staleSemanticSliceGate
});
assert.equal(staleSemanticSliceAdmission.action, 'reject');
assert.equal(staleSemanticSliceAdmission.priority, 'blocker');
assert.equal(staleSemanticSliceAdmission.mergeScore.components.sourceFreshness.score, 0);
assert.equal(staleSemanticSliceAdmission.mergeScore.value < semanticSliceAdmission.mergeScore.value, true);
const semanticSliceJson = writeSemanticSliceJson(semanticSlice);
assert.equal(readSemanticSliceJson(semanticSliceJson).id, semanticSlice.id);
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
const aliasedScipImport = importExternalSemanticIndex({
  format: 'code-intelligence-protocol',
  payload: {
    documents: [{
      relative_path: 'src/alias.ts',
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
assert.equal(aliasedScipImport.format, 'scip');
assert.equal(aliasedScipImport.metadata.format, 'scip');
assert.equal(aliasedScipImport.semanticIndex.documents[0].path, 'src/alias.ts');
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
