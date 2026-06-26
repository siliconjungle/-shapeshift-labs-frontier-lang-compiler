import ts from 'typescript';
import { assert } from './helpers.mjs';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const sourcePath = 'src/parser-trivia-view.tsx';
const sourceText = [
  '/** Render docs. */',
  '// leading owner',
  '"use client";',
  '/* block owner */',
  'export function View() {',
  '  return <button onClick={() => 1}>Run</button>;',
  '} // trailing owner',
  '//# sourceMappingURL=view.js.map',
  ''
].join('\n');

const adapter = createTypeScriptCompilerNativeImporterAdapter({ typescript: ts });
const imported = await runNativeImporterAdapter(adapter, {
  language: 'typescript',
  sourcePath,
  sourceText
});

assert.equal(imported.adapter.coverage.tokens, true);
assert.equal(imported.adapter.coverage.trivia, true);
assert.equal(imported.adapter.coverage.observed.tokens, true);
assert.equal(imported.adapter.coverage.observed.trivia, true);
assert.equal(imported.metadata.sourcePreservation.summary.parserTriviaExactnessStatus, 'exact');
assert.equal(imported.metadata.sourcePreservation.summary.exactParserTrivia, true);
assert.equal(imported.metadata.sourcePreservation.metadata.parserTriviaExactness.parserEvidence, 'typescript-compiler-api-source-file-scanner');
assert.equal(imported.metadata.sourcePreservation.tokens.some((token) => token.kind === 'jsx'), true);
assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'source-map-comment'), true);
assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'comment' && entry.text === '// leading owner'), true);
assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'jsdoc-comment'), true);
assert.equal(imported.metadata.sourcePreservation.trivia.some((entry) => entry.kind === 'block-comment'), true);

const project = await importNativeProject({
  id: 'js_ts_typescript_parser_trivia_project_graph',
  language: 'typescript',
  adapters: [adapter],
  sources: [{ language: 'typescript', sourcePath, sourceText }]
});

const fileRecord = project.projectSymbolGraph.sourceFileRecords[0];
assert.equal(fileRecord.parserTriviaExactnessStatus, 'exact');
assert.equal(fileRecord.parserEvidence, 'typescript-compiler-api-source-file-scanner');
assert.equal(fileRecord.exactParserTrivia, true);
assert.equal(fileRecord.losslessCst, true);
assert.equal(fileRecord.triviaOwnershipStatus, 'exact');

const directiveRecord = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'directive' && record.kind === 'runtime-directive');
assert.equal(directiveRecord.parserTriviaOwnershipStatus, 'exact');
assert.equal(directiveRecord.parserEvidence, 'typescript-compiler-api-source-file-scanner');

const sourceMapRecord = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment');
assert.equal(sourceMapRecord.parserTriviaExactnessStatus, 'exact');
assert.equal(sourceMapRecord.parserEvidence, 'typescript-compiler-api-source-file-scanner');
const jsdocRecord = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'jsdoc-comment' && record.role === 'comment');
assert.equal(jsdocRecord.parserTriviaOwnershipRelation, 'jsdoc-comment');
assert.equal(jsdocRecord.parserTriviaOwnershipStatus, 'exact');
const blockRecord = project.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'block-comment' && record.role === 'comment');
assert.equal(blockRecord.parserTriviaOwnershipRelation, 'block-comment');
assert.equal(blockRecord.parserTriviaOwnershipStatus, 'exact');
