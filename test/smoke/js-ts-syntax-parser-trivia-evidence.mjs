import { assert } from './helpers.mjs';
import {
  createBabelNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const sourcePath = 'src/parser-trivia-view.jsx';
const sourceText = [
  '// leading owner',
  'export function View() { return <button>Run</button>; }',
  '//# sourceMappingURL=view.jsx.map',
  ''
].join('\n');

const estreeAst = syntaxAst('Program');
const estreeImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter(), {
  sourcePath,
  sourceText,
  adapterOptions: { ast: estreeAst }
});
assertSyntaxTriviaImport(estreeImport, 'estree-parser-token-comment-ranges');

const truncatedEstreeImport = await runNativeImporterAdapter(createEstreeNativeImporterAdapter({ maxTokens: 1 }), {
  sourcePath,
  sourceText,
  adapterOptions: { ast: estreeAst }
});
assert.equal(truncatedEstreeImport.metadata.sourcePreservation.summary.parserSpanCoverageStatus, 'blocked');
assert.equal(truncatedEstreeImport.metadata.sourcePreservation.summary.parserSpanCoverageBlockReasonCodes.includes('parser-span-coverage-truncated'), true);
assert.equal(truncatedEstreeImport.metadata.sourcePreservation.summary.parserTriviaExactnessStatus, 'blocked');
assert.equal(truncatedEstreeImport.metadata.sourcePreservation.summary.exactParserTrivia, false);
assert.equal(
  truncatedEstreeImport.metadata.sourcePreservation.metadata.parserTriviaExactness.blockReasonCodes.includes('exact-parser-trivia-span-coverage-blocked'),
  true
);

const babelAst = { type: 'File', program: syntaxAst('Program') };
const babelImport = await runNativeImporterAdapter(createBabelNativeImporterAdapter({
  parserModule: { parse: () => babelAst }
}), {
  sourcePath,
  sourceText
});
assertSyntaxTriviaImport(babelImport, 'babel-parser-token-comment-ranges');

const project = await importNativeProject({
  id: 'js_ts_syntax_parser_trivia_project_graph',
  language: 'javascript',
  adapters: [createEstreeNativeImporterAdapter()],
  sources: [{ language: 'javascript', sourcePath, sourceText, adapterOptions: { ast: estreeAst } }]
});
const fileRecord = project.projectSymbolGraph.sourceFileRecords[0];
assert.equal(fileRecord.parserTriviaExactnessStatus, 'exact');
assert.equal(fileRecord.parserEvidence, 'estree-parser-token-comment-ranges');
assert.equal(fileRecord.parserSpanCoverageStatus, 'exact');
assert.equal(fileRecord.parserSpanCoverageEvidenceId.includes('parser-span-coverage'), true);
assert.equal(fileRecord.parserSpanCoverageReasonCodes.includes('parser-token-comment-span-coverage-exact'), true);
assert.equal(fileRecord.triviaOwnershipStatus, 'exact');
const leadingComment = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'comment' && record.start === 0);
assert.equal(leadingComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(leadingComment.parserSpanCoverageStatus, 'exact');
assert.equal(leadingComment.parserSpanCoverageEvidenceId, fileRecord.parserSpanCoverageEvidenceId);
const sourceMapComment = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment');
assert.equal(sourceMapComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(sourceMapComment.parserEvidence, 'estree-parser-token-comment-ranges');
assert.equal(sourceMapComment.parserSpanCoverageStatus, 'exact');
assert.equal(sourceMapComment.ownershipAnchor.parserSpanCoverageStatus, 'exact');
assert.equal(sourceMapComment.ownershipAnchor.parserSpanCoverageEvidenceId, fileRecord.parserSpanCoverageEvidenceId);

function assertSyntaxTriviaImport(imported, parserEvidence) {
  const preservation = imported.metadata.sourcePreservation;
  assert.equal(imported.adapter.coverage.tokens, true);
  assert.equal(imported.adapter.coverage.trivia, true);
  assert.equal(imported.adapter.coverage.observed.tokens, true);
  assert.equal(imported.adapter.coverage.observed.trivia, true);
  assert.equal(preservation.summary.parserTriviaExactnessStatus, 'exact');
  assert.equal(preservation.summary.parserSpanCoverageStatus, 'exact');
  assert.equal(preservation.metadata.parserSpanCoverageProof.status, 'exact');
  assert.equal(preservation.metadata.parserSpanCoverageProof.evidenceId.includes('parser-span-coverage'), true);
  assert.equal(preservation.metadata.parserSpanCoverageProof.parserEvidence, parserEvidence);
  assert.equal(preservation.metadata.parserSpanCoverageProof.contiguous, true);
  assert.equal(preservation.metadata.parserTriviaExactness.parserEvidence, parserEvidence);
  assert.equal(preservation.metadata.parserTriviaExactness.parserSpanCoverageStatus, 'exact');
  assert.equal(preservation.trivia.some((entry) => entry.kind === 'comment'), true);
  assert.equal(preservation.trivia.some((entry) => entry.kind === 'source-map-comment'), true);
  assert.equal(preservation.trivia.every((entry) => entry.ownershipAnchor.parserSpanCoverageStatus === 'exact'), true);
}

function syntaxAst(type) {
  const functionStart = sourceText.indexOf('function View');
  const functionEnd = sourceText.indexOf('\n//#');
  return {
    type,
    sourceType: 'module',
    start: 0,
    end: sourceText.length,
    loc: loc(0, sourceText.length),
    comments: [comment('// leading owner'), comment('//# sourceMappingURL=view.jsx.map')],
    tokens: tokenStream(['export', 'function', 'View', '(', ')', '{', 'return', '<', 'button', '>', 'Run', '</', 'button', '>', ';', '}']),
    body: [{
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'View', loc: loc(sourceText.indexOf('View'), sourceText.indexOf('View') + 4) },
        loc: loc(functionStart, functionEnd),
        body: { type: 'BlockStatement', body: [], loc: loc(sourceText.indexOf('{'), functionEnd) }
      },
      specifiers: [],
      source: null,
      loc: loc(sourceText.indexOf('export'), functionEnd)
    }]
  };
}

function tokenStream(values) {
  let cursor = 0;
  return values.map((value) => {
    const start = sourceText.indexOf(value, cursor);
    const end = start + value.length;
    cursor = end;
    return { type: tokenType(value), value, start, end, range: [start, end], loc: loc(start, end) };
  });
}

function comment(text) {
  const start = sourceText.indexOf(text);
  const end = start + text.length;
  return { type: 'Line', value: text.slice(2), start, end, range: [start, end], loc: loc(start, end) };
}

function tokenType(value) {
  if (/^[A-Za-z_$]/.test(value)) return value === 'export' || value === 'function' || value === 'return' ? 'Keyword' : 'Identifier';
  return 'Punctuator';
}

function loc(start, end) {
  return {
    start: lineColumn(start),
    end: lineColumn(end)
  };
}

function lineColumn(offset) {
  const prefix = sourceText.slice(0, offset);
  const lines = prefix.split('\n');
  return { line: lines.length, column: lines.at(-1).length };
}
