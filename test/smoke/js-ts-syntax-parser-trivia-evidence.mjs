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
assert.equal(fileRecord.triviaOwnershipStatus, 'exact');
const leadingComment = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'comment' && record.start === 0);
assert.equal(leadingComment.parserTriviaOwnershipStatus, 'exact');
const sourceMapComment = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment');
assert.equal(sourceMapComment.parserTriviaOwnershipStatus, 'exact');
assert.equal(sourceMapComment.parserEvidence, 'estree-parser-token-comment-ranges');

function assertSyntaxTriviaImport(imported, parserEvidence) {
  assert.equal(imported.adapter.coverage.tokens, true);
  assert.equal(imported.adapter.coverage.trivia, true);
  assert.equal(imported.adapter.coverage.observed.tokens, true);
  assert.equal(imported.adapter.coverage.observed.trivia, true);
  assert.equal(imported.metadata.sourcePreservation.summary.parserTriviaExactnessStatus, 'exact');
  assert.equal(imported.metadata.sourcePreservation.metadata.parserTriviaExactness.parserEvidence, parserEvidence);
  assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'comment'), true);
  assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'source-map-comment'), true);
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
