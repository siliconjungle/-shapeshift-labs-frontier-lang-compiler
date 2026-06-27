import { assert } from './helpers.mjs';
import {
  createEstreeNativeImporterAdapter,
  createNativeSourcePreservation,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';

const sourcePath = 'src/parser-trivia-project.js';
const sourceText = [
  '/** Documents value. */',
  '// leading owner',
  '"use strict";',
  '/* block owner */',
  'export const value = 1; // trailing owner',
  ''
].join('\n');
const exactImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath,
  sourceText,
  adapterOptions: { ast: syntaxAst() }
});
const mismatchedParserTextImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath,
  sourceText,
  adapterOptions: { ast: syntaxAst({ mismatchedRawToken: true }) }
});
assert.equal(mismatchedParserTextImport.metadata.sourcePreservation.summary.parserTriviaExactnessStatus, 'approximate');
assert.equal(mismatchedParserTextImport.metadata.sourcePreservation.summary.exactParserTrivia, false);
assert.equal(mismatchedParserTextImport.metadata.parserTriviaExactness, undefined);
const exactEvidence = parserTriviaEvidence('fixture-exact-parser-trivia');

const exactProject = safeMergeJsTsProject({
  id: 'js_ts_project_parser_trivia_evidence_output_graph',
  language: 'javascript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [exactImport],
  files: [{ sourcePath, baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText }]
});
assert.equal(exactProject.status, 'merged');
const exactFile = exactProject.outputProjectSymbolGraph.sourceFileRecords[0];
assert.equal(exactFile.parserTriviaExactnessStatus, 'exact');
assert.equal(exactFile.exactParserTrivia, true);
assert.equal(exactFile.losslessCst, true);
assert.equal(exactFile.parserEvidence, 'estree-parser-token-comment-ranges');
assert.equal(exactFile.parserSpanCoverageStatus, 'exact');
assert.equal(exactFile.parserSpanCoverageEvidenceId.includes('parser-span-coverage'), true);
assert.equal(exactFile.parserSpanCoverageReasonCodes.includes('parser-token-comment-span-coverage-exact'), true);
const exactDirective = exactProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'directive' && record.kind === 'runtime-directive');
const exactLeadingComment = exactProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'comment');
const exactJsdocComment = exactProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'jsdoc-comment');
const exactBlockComment = exactProject.outputProjectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'block-comment');
assert.equal(exactDirective.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactDirective.parserSpanCoverageStatus, 'exact');
assert.equal(exactDirective.parserSpanCoverageEvidenceId, exactFile.parserSpanCoverageEvidenceId);
assert.equal(exactDirective.parserTriviaOwnershipBlockReasonCodes.length, 0);
assert.equal(exactLeadingComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactLeadingComment.parserSpanCoverageStatus, 'exact');
assert.equal(exactLeadingComment.parserSpanCoverageEvidenceId, exactFile.parserSpanCoverageEvidenceId);
assert.equal(exactLeadingComment.parserTriviaOwnershipBlockReasonCodes.length, 0);
assert.equal(exactJsdocComment.parserTriviaOwnershipRelation, 'jsdoc-comment');
assert.equal(exactJsdocComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactJsdocComment.ownershipAnchor.parserSpanCoverageStatus, 'exact');
assert.equal(exactJsdocComment.ownershipAnchor.parserSpanCoverageEvidenceId, exactFile.parserSpanCoverageEvidenceId);
assert.equal(exactJsdocComment.parserTriviaOwnershipReasonCodes.includes('jsdoc-comment-ownership'), true);
assert.equal(exactBlockComment.parserTriviaOwnershipRelation, 'block-comment');
assert.equal(exactBlockComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactBlockComment.parserTriviaOwnershipReasonCodes.includes('block-comment-ownership'), true);

const stageProject = safeMergeJsTsProject({
  id: 'js_ts_project_parser_trivia_evidence_delta',
  language: 'javascript',
  includeProjectGraphDelta: true,
  projectGraphImports: exactProjectGraphImports(exactImport),
  files: [{ sourcePath, baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText }]
});
assert.equal(stageProject.status, 'merged');
for (const stage of ['base', 'worker', 'head', 'output']) {
  assert.equal(stageProject.projectGraphDelta.stages[stage].projectSymbolGraph.sourceFileRecords[0].parserTriviaExactnessStatus, 'exact');
  assert.equal(stageProject.projectGraphDelta.stages[stage].projectSymbolGraph.sourceFileRecords[0].parserSpanCoverageStatus, 'exact');
}

const metadataOnlyProject = safeMergeJsTsProject({
  id: 'js_ts_project_parser_trivia_evidence_metadata_only_spoof',
  language: 'javascript',
  includeProjectGraphDelta: true,
  files: [{ sourcePath, baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText, parserTriviaEvidence: exactEvidence }]
});
assert.equal(metadataOnlyProject.status, 'blocked');
const metadataOnlyFile = metadataOnlyProject.projectGraphDelta.stages.output.projectSymbolGraph.sourceFileRecords[0];
assert.equal(metadataOnlyFile.parserTriviaExactnessStatus, 'blocked');
assert.equal(metadataOnlyFile.parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-token-comment-evidence-missing'), true);
assert.equal(metadataOnlyFile.parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'), true);

const staleProject = safeMergeJsTsProject({
  id: 'js_ts_project_parser_trivia_evidence_stale_output',
  language: 'javascript',
  includeProjectGraphDelta: true,
  files: [{ sourcePath, baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText, outputParserTriviaEvidence: { ...exactEvidence, sourceHash: 'stale-source-hash' } }]
});
assert.equal(staleProject.status, 'blocked');
assert.equal(staleProject.projectGraphDelta.stages.output.projectSymbolGraph.sourceFileRecords[0].parserTriviaExactnessStatus, 'blocked');
assert.equal(staleProject.projectGraphDelta.stages.output.projectSymbolGraph.sourceFileRecords[0].parserTriviaExactnessBlockReasonCodes.includes('parser-trivia-source-hash-mismatch'), true);

const scannerProject = safeMergeJsTsProject({
  id: 'js_ts_project_parser_trivia_evidence_scanner_spoof',
  language: 'javascript',
  includeProjectGraphDelta: true,
  files: [{ sourcePath, baseSourceText: sourceText, workerSourceText: sourceText, headSourceText: sourceText, outputParserTriviaEvidence: { ...exactEvidence, parserEvidence: 'frontier-lightweight-js-ts-source-ledger', adapterId: undefined } }]
});
assert.equal(scannerProject.status, 'blocked');
assert.equal(scannerProject.projectGraphDelta.stages.output.projectSymbolGraph.sourceFileRecords[0].parserTriviaExactnessStatus, 'blocked');
assert.equal(scannerProject.projectGraphDelta.stages.output.projectSymbolGraph.sourceFileRecords[0].parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'), true);

const triviaLossProject = safeMergeJsTsProject({
  id: 'js_ts_project_source_span_roundtrip_failed_blocks_comment_loss',
  language: 'typescript',
  baseFiles: { 'src/value.ts': '// base owner\nexport const value = 1;\n' },
  workerFiles: { 'src/value.ts': '// worker owner\nexport const value = 1;\n' },
  headFiles: { 'src/value.ts': '// base owner\nexport const value = 1;\nexport const headOnly = 2;\n' },
  includeOutputProjectSymbolGraph: true
});
assert.equal(triviaLossProject.status, 'blocked');
assert.equal(triviaLossProject.outputFiles[0].sourceText.includes('// worker owner'), false);
const failedRoundtripProof = triviaLossProject.proofEvidence.records.find((record) => record.level === 'source-span-roundtrip');
assert.equal(failedRoundtripProof.status, 'failed');
assert.equal(failedRoundtripProof.metadata.failedSourceResults, 1);
assert.equal(failedRoundtripProof.metadata.admissionBlockingFailedSourceResults, 1);
assert.deepEqual(failedRoundtripProof.metadata.sourceSpanRoundtripAdmissionBlockerSourcePaths, ['src/value.ts']);
const roundtripConflict = triviaLossProject.conflicts.find((conflict) => conflict.code === 'project-source-span-roundtrip-proof-failed');
assert.ok(roundtripConflict, 'failed source-span roundtrip proof should block project admission');
assert.equal(roundtripConflict.gateId, 'project-proof-evidence');
assert.equal(roundtripConflict.severity, 'error');
assert.equal(roundtripConflict.details.proofLevel, 'source-span-roundtrip');
assert.equal(roundtripConflict.details.admissionBlockingFailedSourceResults, 1);
assert.equal(roundtripConflict.details.autoMergeClaim, false);
assert.equal(roundtripConflict.details.semanticEquivalenceClaim, false);
assert.equal(triviaLossProject.admission.status, 'blocked');
assert.equal(triviaLossProject.admission.autoApplyCandidate, false);
assert.equal(triviaLossProject.admission.reasonCodes.includes('project-source-span-roundtrip-proof-failed'), true);
assert.equal(triviaLossProject.admission.routes.some((route) => route.reasonCodes?.includes('project-source-span-roundtrip-proof-failed')), true);

function parserTriviaEvidence(evidenceId) {
  const preservation = createNativeSourcePreservation({ language: 'javascript', sourcePath, sourceText });
  return {
    status: 'exact',
    exactParserTrivia: true,
    losslessCst: true,
    sourceHash: preservation.sourceHash,
    adapterId: 'fixture-exact-parser-trivia-adapter',
    evidenceId
  };
}

function exactProjectGraphImports(imported) {
  return { base: [imported], worker: [imported], head: [imported], output: [imported] };
}

function syntaxAst(options = {}) {
  return {
    type: 'Program',
    sourceType: 'module',
    start: 0,
    end: sourceText.length,
    comments: [comment('/** Documents value. */'), comment('// leading owner'), comment('/* block owner */'), comment('// trailing owner')],
    tokens: tokenStream(['"use strict"', ';', 'export', 'const', 'value', '=', '1', ';'], options),
    body: []
  };
}

function tokenStream(values, options = {}) {
  let cursor = 0;
  return values.map((value) => {
    const start = sourceText.indexOf(value, cursor);
    const end = start + value.length;
    cursor = end;
    return { type: tokenType(value), value, raw: options.mismatchedRawToken && value === '1' ? '2' : value, start, end, range: [start, end] };
  });
}

function comment(text) {
  const start = sourceText.indexOf(text);
  const end = start + text.length;
  const isLine = text.startsWith('//');
  return { type: isLine ? 'Line' : 'Block', value: isLine ? text.slice(2) : text.slice(2, -2), raw: text, start, end, range: [start, end] };
}

function tokenType(value) {
  if (value === '"use strict"') return 'String';
  if (/^[A-Za-z_$]/.test(value)) return value === 'export' || value === 'const' ? 'Keyword' : 'Identifier';
  if (/^[0-9]/.test(value)) return 'Numeric';
  return 'Punctuator';
}
