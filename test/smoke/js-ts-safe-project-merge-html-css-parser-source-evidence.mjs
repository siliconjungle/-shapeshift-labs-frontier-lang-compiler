import assert from 'node:assert/strict';
import { htmlCssProjectMergeMatrixProofStatus } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';
import { htmlCssProjectSummary } from '../../src/js-ts-safe-project-merge-html-css-summary.js';

const htmlFixtureSourceHashes = { base: 'fixture-html-base-source-hash', worker: 'fixture-html-worker-source-hash', head: 'fixture-html-head-source-hash' };
const cssFixtureSourceHashes = { base: 'fixture-css-base-source-hash', worker: 'fixture-css-worker-source-hash', head: 'fixture-css-head-source-hash' };

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
    base: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.base }),
    worker: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.worker }),
    head: htmlParserSide({ sourceHash: htmlFixtureSourceHashes.head })
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
    base: cssParserSide({ sourceHash: cssFixtureSourceHashes.base }),
    worker: cssParserSide({ sourceHash: cssFixtureSourceHashes.worker }),
    head: cssParserSide({ declarationCount: 3, sourceHash: cssFixtureSourceHashes.head })
  }
};

const validHtmlIdentityEvidence = {
  kind: 'frontier.lang.htmlSafeMergeIdentityEvidence',
  version: 1,
  explicitIdentityAvailable: true,
  parserBackedStructuralSpans: true,
  structuralAddressability: true,
  pathOnlyIdentityElements: 0,
  duplicateExplicitIdentityElementCount: 0,
  duplicateExplicitIdentityKeys: [],
  sides: {
    base: htmlIdentitySide(),
    worker: htmlIdentitySide(),
    head: htmlIdentitySide()
  }
};

const passingSummary = htmlCssProjectSummary([
  htmlFile(validHtmlParserEvidence, { identityEvidence: validHtmlIdentityEvidence }),
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
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-identity-evidence', passingSummary), 'passed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', passingSummary), 'passed');

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
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', staleHtmlAttributeSummary), 'failed');

const metadataOnlyHtmlSummary = htmlCssProjectSummary([
  htmlFile({
    kind: 'frontier.lang.htmlSafeMergeParserEvidence',
    version: 1,
    parserNames: ['parse5'],
    sourceCodeLocationInfo: true,
    parserBackedSourceSpans: true,
    parserBackedAttributeSpans: true,
    parserBackedTriviaSpans: true,
    parseErrors: 0,
    recordCount: 5,
    sourceSpanRecordCount: 5,
    sourceSpanMissingRecordCount: 0,
    attributeSpanElementCount: 2,
    attributeSpanMissingElementCount: 0,
    structuralSpanRecordCount: 5,
    structuralSpanMissingRecordCount: 0,
    leadingTriviaSpanRecordCount: 0
  })
]);
assert.equal(metadataOnlyHtmlSummary.htmlParserEvidenceFiles, 0);
assert.equal(metadataOnlyHtmlSummary.htmlParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', metadataOnlyHtmlSummary), 'failed');

const sideSpoofedHtmlSummary = htmlCssProjectSummary([
  htmlFile({
    ...validHtmlParserEvidence,
    sides: {
      base: htmlParserSide(),
      worker: htmlParserSide()
    }
  })
]);
assert.equal(sideSpoofedHtmlSummary.htmlParserEvidenceFiles, 0);
assert.equal(sideSpoofedHtmlSummary.htmlParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-parser-source-evidence', sideSpoofedHtmlSummary), 'failed');

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

const sideSpoofedCssSummary = htmlCssProjectSummary([
  cssFile({
    ...validCssParserEvidence,
    sides: {
      base: cssParserSide(),
      worker: cssParserSide(),
      theirs: cssParserSide()
    }
  })
]);
assert.equal(sideSpoofedCssSummary.cssParserEvidenceFiles, 0);
assert.equal(sideSpoofedCssSummary.cssParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', sideSpoofedCssSummary), 'failed');

const extraSideSpoofedCssSummary = htmlCssProjectSummary([
  cssFile({
    ...validCssParserEvidence,
    sides: {
      base: cssParserSide(),
      worker: cssParserSide(),
      head: cssParserSide(),
      output: cssParserSide()
    }
  })
]);
assert.equal(extraSideSpoofedCssSummary.cssParserEvidenceFiles, 0);
assert.equal(extraSideSpoofedCssSummary.cssParserEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('css-parser-source-evidence', extraSideSpoofedCssSummary), 'failed');

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
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', missingEvidenceSummary), 'missing');

const missingIdentitySummary = htmlCssProjectSummary([
  htmlFile(validHtmlParserEvidence)
]);
assert.equal(missingIdentitySummary.htmlParserEvidenceFiles, 1);
assert.equal(missingIdentitySummary.htmlIdentityEvidenceFiles, 0);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-identity-evidence', missingIdentitySummary), 'missing');
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', missingIdentitySummary), 'missing');

const duplicateIdentitySummary = htmlCssProjectSummary([
  htmlFile(validHtmlParserEvidence, {
    identityEvidence: {
      ...validHtmlIdentityEvidence,
      sides: {
        base: htmlIdentitySide({ explicitIdentityKeys: ['element#dup', 'element#dup'] }),
        worker: htmlIdentitySide(),
        head: htmlIdentitySide()
      }
    }
  })
]);
assert.equal(duplicateIdentitySummary.htmlIdentityEvidenceFiles, 0);
assert.equal(duplicateIdentitySummary.htmlIdentityEvidenceFailedFiles, 1);
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-identity-evidence', duplicateIdentitySummary), 'failed');
assert.equal(htmlCssProjectMergeMatrixProofStatus('html-structural-merge', duplicateIdentitySummary), 'failed');

function htmlFile(parserEvidence, result = {}, sourceHashes = htmlFixtureSourceHashes) {
  return {
    language: 'html',
    sourcePath: 'src/view.html',
    status: 'merged',
    ...sourceHashesForHashes(sourceHashes),
    result: {
      ...(parserEvidence ? { parserEvidence } : {}),
      ...result
    }
  };
}

function cssFile(parserEvidence, sourceHashes = cssFixtureSourceHashes) {
  return {
    language: 'css',
    sourcePath: 'src/button.css',
    status: 'merged',
    ...sourceHashesForHashes(sourceHashes),
    result: parserEvidence ? { parserEvidence } : {}
  };
}

function sourceHashesForHashes({ base, worker, head }) {
  return { baseHash: base, workerHash: worker, headHash: head };
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

function htmlIdentitySide(overrides = {}) {
  return {
    parserBackedStructuralSpans: true,
    structuralAddressability: true,
    explicitIdentityKeys: ['element#app'],
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
