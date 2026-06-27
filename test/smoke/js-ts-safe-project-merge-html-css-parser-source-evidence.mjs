import assert from 'node:assert/strict';
import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { htmlCssProjectMergeMatrixProofStatus } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';

const validHtmlParserEvidence = {
  kind: 'frontier.lang.htmlSafeMergeParserEvidence',
  version: 1,
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
    base: htmlParserSide(),
    worker: htmlParserSide(),
    head: htmlParserSide()
  }
};

const validCssParserEvidence = {
  kind: 'frontier.lang.cssSafeMergeParserEvidence',
  version: 1,
  parserNames: ['postcss'],
  sourceCodeLocationInfo: true,
  parserBackedSourceSpans: true,
  parserBackedDeclarationSpans: true,
  parserBackedTriviaHashes: true,
  parseErrors: 0,
  sides: {
    base: cssParserSide(),
    worker: cssParserSide(),
    head: cssParserSide({ declarationCount: 3 })
  }
};

const passingSummary = htmlCssProjectSummary([
  htmlFile(validHtmlParserEvidence),
  cssFile(validCssParserEvidence)
]);
assert.equal(passingSummary.htmlParserEvidenceFiles, 1);
assert.equal(passingSummary.cssParserEvidenceFiles, 1);
assert.equal(passingSummary.htmlCssParserEvidenceFiles, 2);
assert.equal(passingSummary.htmlParserEvidenceFailedFiles, 0);
assert.equal(passingSummary.cssParserEvidenceFailedFiles, 0);
assert.equal(passingSummary.htmlCssParserEvidenceFailedFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', passingSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', passingSummary), 'passed');

const liveHtmlBase = '<main id="app"><h1>Todo</h1><button data-frontier-key="save" type="button">Save</button></main>\n';
const liveCssBase = '.button { color: red; padding: 1rem; }\n';
const liveHtmlResult = safeMergeHtmlSource({
  id: 'live_html_parser_source_evidence',
  baseSourceText: liveHtmlBase,
  workerSourceText: liveHtmlBase.replace('Todo', 'Todos'),
  headSourceText: liveHtmlBase.replace('type="button"', 'type="button" aria-label="Save item"')
});
const liveCssResult = safeMergeCssSource({
  id: 'live_css_parser_source_evidence',
  baseSourceText: liveCssBase,
  workerSourceText: liveCssBase.replace('red', 'blue'),
  headSourceText: liveCssBase.replace('padding: 1rem;', 'padding: 1rem; background-color: white;'),
  includeBlockedMergeCandidate: true
});
const liveAdapterSummary = htmlCssProjectSummary([
  { language: 'html', sourcePath: 'src/live.html', status: liveHtmlResult.status, result: liveHtmlResult },
  { language: 'css', sourcePath: 'src/live.css', status: liveCssResult.status, result: liveCssResult }
]);
assert.equal(liveAdapterSummary.htmlParserEvidenceFiles, 1);
assert.equal(liveAdapterSummary.cssParserEvidenceFiles, 1);
assert.equal(liveAdapterSummary.htmlParserEvidenceFailedFiles, 0);
assert.equal(liveAdapterSummary.cssParserEvidenceFailedFiles, 0);
assert.equal(liveAdapterSummary.htmlCssParserEvidenceFailedFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', liveAdapterSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', liveAdapterSummary), 'passed');

const staleHtmlAttributeSummary = htmlCssProjectSummary([
  htmlFile({
    ...validHtmlParserEvidence,
    parserBackedAttributeSpans: false,
    attributeSpanMissingElementCount: 1
  })
]);
assert.equal(staleHtmlAttributeSummary.htmlParserEvidenceFiles, 0);
assert.equal(staleHtmlAttributeSummary.htmlParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', staleHtmlAttributeSummary), 'failed');

const metadataOnlyCssSummary = htmlCssProjectSummary([
  cssFile({
    kind: 'frontier.lang.cssSafeMergeParserEvidence',
    version: 1,
    parserNames: ['postcss'],
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedDeclarationSpans: true,
    parserBackedTriviaHashes: true,
    parseErrors: 0
  })
]);
assert.equal(metadataOnlyCssSummary.cssParserEvidenceFiles, 0);
assert.equal(metadataOnlyCssSummary.cssParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', metadataOnlyCssSummary), 'failed');

const staleCssTriviaSummary = htmlCssProjectSummary([
  cssFile({
    ...validCssParserEvidence,
    sides: {
      base: cssParserSide(),
      worker: { ...cssParserSide(), parserBackedTriviaHashes: false },
      head: cssParserSide()
    }
  })
]);
assert.equal(staleCssTriviaSummary.cssParserEvidenceFiles, 0);
assert.equal(staleCssTriviaSummary.cssParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', staleCssTriviaSummary), 'failed');

const missingEvidenceSummary = htmlCssProjectSummary([htmlFile(undefined)]);
assert.equal(missingEvidenceSummary.htmlParserEvidenceFiles, 0);
assert.equal(missingEvidenceSummary.htmlParserEvidenceFailedFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', missingEvidenceSummary), 'missing');

function htmlFile(parserEvidence) {
  return {
    language: 'html',
    sourcePath: 'src/view.html',
    status: 'merged',
    result: parserEvidence ? { parserEvidence } : {}
  };
}

function cssFile(parserEvidence) {
  return {
    language: 'css',
    sourcePath: 'src/button.css',
    status: 'merged',
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
