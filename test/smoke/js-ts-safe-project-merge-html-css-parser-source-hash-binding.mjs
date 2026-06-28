import assert from 'node:assert/strict';
import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { hashText } from '../../src/js-ts-safe-project-merge-core.js';
import { htmlCssProjectMergeMatrixProofStatus } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';

const htmlFixtureSourceHashes = { base: 'fixture-html-base-source-hash', worker: 'fixture-html-worker-source-hash', head: 'fixture-html-head-source-hash' };
const cssFixtureSourceHashes = { base: 'fixture-css-base-source-hash', worker: 'fixture-css-worker-source-hash', head: 'fixture-css-head-source-hash' };
const liveHtmlBase = '<main id="app"><h1>Todo</h1><button data-frontier-key="save" type="button">Save</button></main>\n';
const liveCssBase = '.button { color: red; padding: 1rem; }\n';
const liveHtmlWorker = liveHtmlBase.replace('Todo', 'Todos');
const liveHtmlHead = liveHtmlBase.replace('type="button"', 'type="button" aria-label="Save item"');
const liveCssWorker = liveCssBase.replace('red', 'blue');
const liveCssHead = liveCssBase.replace('padding: 1rem;', 'padding: 1rem; background-color: white;');

const liveHtmlResult = safeMergeHtmlSource({
  id: 'live_html_parser_source_hash_binding',
  baseSourceText: liveHtmlBase,
  workerSourceText: liveHtmlWorker,
  headSourceText: liveHtmlHead
});
const liveCssResult = safeMergeCssSource({
  id: 'live_css_parser_source_hash_binding',
  baseSourceText: liveCssBase,
  workerSourceText: liveCssWorker,
  headSourceText: liveCssHead,
  includeBlockedMergeCandidate: true
});
const liveAdapterSummary = htmlCssProjectSummary([
  { language: 'html', sourcePath: 'src/live.html', status: liveHtmlResult.status, result: liveHtmlResult, ...sourceHashesFor(liveHtmlBase, liveHtmlWorker, liveHtmlHead) },
  { language: 'css', sourcePath: 'src/live.css', status: liveCssResult.status, result: liveCssResult, ...sourceHashesFor(liveCssBase, liveCssWorker, liveCssHead) }
]);
assert.equal(liveAdapterSummary.htmlParserEvidenceFiles, 1);
assert.equal(liveAdapterSummary.cssParserEvidenceFiles, 1);
assert.equal(liveAdapterSummary.htmlCssParserEvidenceFailedFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', liveAdapterSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', liveAdapterSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', liveAdapterSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('browser-runtime-proof', liveAdapterSummary), 'missing');

const sourceHashMissingHtmlSummary = htmlCssProjectSummary([{
  language: 'html',
  sourcePath: 'src/view.html',
  status: 'merged',
  result: { parserEvidence: validHtmlParserEvidence() }
}]);
assert.equal(sourceHashMissingHtmlSummary.htmlParserEvidenceFiles, 0);
assert.equal(sourceHashMissingHtmlSummary.htmlParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', sourceHashMissingHtmlSummary), 'failed');

const staleCssSourceHashSummary = htmlCssProjectSummary([
  cssFile({
    ...validCssParserEvidence(),
    sides: {
      base: cssParserSide({ sourceHash: cssFixtureSourceHashes.base }),
      worker: cssParserSide({ sourceHash: 'stale-css-worker-source-hash' }),
      head: cssParserSide({ sourceHash: cssFixtureSourceHashes.head })
    }
  })
]);
assert.equal(staleCssSourceHashSummary.cssParserEvidenceFiles, 0);
assert.equal(staleCssSourceHashSummary.cssParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', staleCssSourceHashSummary), 'failed');

const staleBlockedCssSourceHashSummary = htmlCssProjectSummary([
  { ...cssFile(staleCssSourceHashSummaryFixture()), status: 'blocked' }
]);
assert.equal(staleBlockedCssSourceHashSummary.cssParserEvidenceFiles, 0);
assert.equal(staleBlockedCssSourceHashSummary.cssParserEvidenceFailedFiles, 1);

function validHtmlParserEvidence() {
  return {
    kind: 'frontier.lang.htmlSafeMergeParserEvidence',
    parserNames: ['parse5'],
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedAttributeSpans: true,
    parserBackedTriviaSpans: false,
    parseErrors: 0,
    recordCount: 5,
    sourceSpanRecordCount: 5,
    sourceSpanMissingRecordCount: 0,
    attributeSpanElementCount: 2,
    attributeSpanMissingElementCount: 0,
    structuralSpanRecordCount: 5,
    structuralSpanMissingRecordCount: 0,
    leadingTriviaSpanRecordCount: 0,
    sides: {
      base: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.base }),
      worker: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.worker }),
      head: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.head })
    }
  };
}

function validCssParserEvidence() {
  return {
    kind: 'frontier.lang.cssSafeMergeParserEvidence',
    parserNames: ['postcss'],
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedDeclarationSpans: true,
    parserBackedTriviaHashes: true,
    parseErrors: 0,
    sides: {
      base: cssParserSide({ sourceHash: cssFixtureSourceHashes.base }),
      worker: cssParserSide({ sourceHash: cssFixtureSourceHashes.worker }),
      head: cssParserSide({ declarationCount: 3, sourceHash: cssFixtureSourceHashes.head })
    }
  };
}

function staleCssSourceHashSummaryFixture() {
  return {
    ...validCssParserEvidence(),
    sides: {
      base: cssParserSide({ sourceHash: cssFixtureSourceHashes.base }),
      worker: cssParserSide({ sourceHash: 'stale-css-worker-source-hash' }),
      head: cssParserSide({ sourceHash: cssFixtureSourceHashes.head })
    }
  };
}

function sourceHashesFor(base, worker, head) {
  return { baseHash: hashText(base), workerHash: hashText(worker), headHash: hashText(head) };
}

function cssFile(parserEvidence) {
  return {
    language: 'css',
    sourcePath: 'src/button.css',
    status: 'merged',
    baseHash: cssFixtureSourceHashes.base,
    workerHash: cssFixtureSourceHashes.worker,
    headHash: cssFixtureSourceHashes.head,
    result: parserEvidence ? { parserEvidence } : {}
  };
}

function htmlParserSide(overrides = {}) {
  return {
    parserName: 'parse5',
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedAttributeSpans: true,
    parserBackedTriviaSpans: false,
    parseErrors: 0,
    recordCount: 5,
    sourceSpanRecordCount: 5,
    sourceSpanMissingRecordCount: 0,
    attributeSpanElementCount: 2,
    attributeSpanMissingElementCount: 0,
    structuralSpanRecordCount: 5,
    structuralSpanMissingRecordCount: 0,
    leadingTriviaSpanRecordCount: 0,
    ...overrides
  };
}

function cssParserSide(overrides = {}) {
  return {
    parserName: 'postcss',
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedDeclarationSpans: true,
    parserBackedTriviaHashes: true,
    parseErrors: 0,
    recordCount: 1,
    declarationCount: 2,
    ...overrides
  };
}
