import ts from 'typescript';
import { assert } from './helpers.mjs';
import {
  createNativeSourcePreservation,
  createTypeScriptCompilerNativeImporterAdapter,
  importNativeProject,
  runNativeImporterAdapter
} from './compiler-api.mjs';

const sourceText = [
  '// @ts-check',
  '"use strict";',
  'export function render(value) {',
  '  const text = `value:${value}`;',
  '  return text;',
  '}',
  'export const trailing = render; // trailing owner',
  '//# sourceMappingURL=render.js.map',
  ''
].join('\n');

const approximateTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText
});
const metadataSpoofedTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText,
  metadata: {
    parserTriviaExactness: {
      schema: 'frontier.lang.parserTriviaExactness.v1',
      version: 1,
      status: 'exact',
      exactParserTrivia: true,
      losslessCst: true,
      sourceHash: approximateTriviaPreservation.sourceHash,
      adapterId: 'metadata-only-parser-trivia-adapter',
      evidenceId: 'metadata-only-parser-trivia',
      reasonCodes: ['exact-parser-trivia-evidence'],
      blockReasonCodes: [],
      reviewRequired: false,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  }
});
assert.equal(metadataSpoofedTriviaPreservation.summary.parserTriviaExactnessStatus, 'approximate');
assert.equal(metadataSpoofedTriviaPreservation.metadata.parserTriviaExactness.status, 'approximate');
assert.equal(metadataSpoofedTriviaPreservation.metadata.parserTriviaExactness.parserEvidence, 'frontier-lightweight-js-ts-source-ledger');

const scannerSpoofedTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText,
  parserTriviaEvidence: {
    status: 'exact',
    exactParserTrivia: true,
    losslessCst: true,
    sourceHash: approximateTriviaPreservation.sourceHash,
    parserEvidence: 'frontier-lightweight-js-ts-source-ledger',
    adapterId: 'spoofed-scanner-parser-trivia-adapter',
    evidenceId: 'spoofed-scanner-parser-trivia'
  }
});
assert.equal(scannerSpoofedTriviaPreservation.summary.parserTriviaExactnessStatus, 'blocked');
assert.equal(scannerSpoofedTriviaPreservation.summary.exactParserTrivia, false);
assert.equal(scannerSpoofedTriviaPreservation.metadata.parserTriviaExactness.losslessCst, false);
assert.equal(
  scannerSpoofedTriviaPreservation.summary.parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'),
  true
);

const scannerSpoofedTriviaProject = await importNativeProject({
  id: 'js_ts_project_source_span_scanner_spoofed_parser_trivia_blocked',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/parser-trivia-exactness.js',
    sourceText,
    parserTriviaEvidence: {
      status: 'exact',
      exactParserTrivia: true,
      losslessCst: true,
      sourceHash: approximateTriviaPreservation.sourceHash,
      parserEvidence: 'frontier-lightweight-js-ts-source-ledger',
      adapterId: 'spoofed-scanner-parser-trivia-adapter',
      evidenceId: 'spoofed-scanner-parser-trivia'
    }
  }]
});
const scannerSpoofedTriviaFileRecord = scannerSpoofedTriviaProject.projectSymbolGraph.sourceFileRecords[0];
assert.equal(scannerSpoofedTriviaFileRecord.parserTriviaExactnessStatus, 'blocked');
assert.equal(scannerSpoofedTriviaFileRecord.exactParserTrivia, false);
assert.equal(scannerSpoofedTriviaFileRecord.losslessCst, false);
assert.equal(
  scannerSpoofedTriviaFileRecord.parserTriviaExactnessBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'),
  true
);
const scannerSpoofedRuntimeDirectiveRecord = scannerSpoofedTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'directive' && record.kind === 'runtime-directive');
assert.equal(scannerSpoofedRuntimeDirectiveRecord.parserTriviaOwnershipRelation, 'directive-prologue');
assert.equal(scannerSpoofedRuntimeDirectiveRecord.parserTriviaOwnershipStatus, 'blocked');
assert.equal(scannerSpoofedRuntimeDirectiveRecord.parserTriviaOwnershipBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'), true);
assert.equal(scannerSpoofedRuntimeDirectiveRecord.ownershipAnchor.parserTriviaOwnershipStatus, 'blocked');
assert.equal(scannerSpoofedRuntimeDirectiveRecord.ownershipAnchor.parserTriviaOwnershipRelation, 'directive-prologue');
const scannerSpoofedLeadingCommentRecord = scannerSpoofedTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'comment' && record.start === 0);
assert.equal(scannerSpoofedLeadingCommentRecord.parserTriviaOwnershipRelation, 'leading-comment');
assert.equal(scannerSpoofedLeadingCommentRecord.parserTriviaOwnershipStatus, 'blocked');
assert.equal(scannerSpoofedLeadingCommentRecord.parserTriviaOwnershipBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'), true);
const scannerSpoofedTrailingCommentRecord = scannerSpoofedTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'comment' && record.parserTriviaOwnershipRelation === 'trailing-comment');
assert.equal(scannerSpoofedTrailingCommentRecord.parserTriviaOwnershipStatus, 'blocked');
assert.equal(scannerSpoofedTrailingCommentRecord.parserTriviaOwnershipBlockReasonCodes.includes('exact-parser-trivia-scanner-evidence-not-parser'), true);

const exactParserTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText,
  tokensAndTrivia: {
    tokens: approximateTriviaPreservation.tokens,
    trivia: approximateTriviaPreservation.trivia,
    truncated: false,
    parserEvidence: 'fixture-parser-token-comment-ranges'
  },
  parserTriviaEvidence: {
    status: 'exact',
    exactParserTrivia: true,
    losslessCst: true,
    sourceHash: approximateTriviaPreservation.sourceHash,
    adapterId: 'fixture-exact-parser-trivia-adapter',
    evidenceId: 'fixture-exact-parser-trivia'
  }
});

const exactTriviaProject = await importNativeProject({
  id: 'js_ts_project_source_span_exact_parser_trivia_threading',
  sources: [{
    language: 'javascript',
    sourcePath: 'src/parser-trivia-exactness.js',
    sourceText,
    sourcePreservation: exactParserTriviaPreservation
  }]
});
const exactTriviaFileRecord = exactTriviaProject.projectSymbolGraph.sourceFileRecords[0];
assert.equal(exactTriviaFileRecord.parserTriviaExactnessStatus, 'exact');
assert.equal(exactTriviaFileRecord.exactParserTrivia, true);
assert.equal(exactTriviaFileRecord.losslessCst, true);
assert.equal(exactTriviaFileRecord.parserEvidence, 'fixture-parser-token-comment-ranges');
assert.equal(exactTriviaFileRecord.parserTriviaEvidenceId, 'fixture-exact-parser-trivia');
assert.equal(exactTriviaFileRecord.parserTriviaAdapterId, 'fixture-exact-parser-trivia-adapter');

const exactTriviaSpanRecord = exactTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.kind === 'comment' || record.kind === 'runtime-directive');
assert.equal(exactTriviaSpanRecord.parserTriviaExactnessStatus, 'exact');
assert.equal(exactTriviaSpanRecord.exactParserTrivia, true);
assert.equal(exactTriviaSpanRecord.parserEvidence, 'fixture-parser-token-comment-ranges');
assert.equal(exactTriviaSpanRecord.ownershipAnchor.parserTriviaExactnessStatus, 'exact');
assert.equal(exactTriviaSpanRecord.ownershipAnchor.exactParserTrivia, true);
assert.equal(exactTriviaSpanRecord.ownershipAnchor.losslessCst, true);
assert.equal(exactTriviaSpanRecord.ownershipAnchor.parserTriviaEvidenceId, 'fixture-exact-parser-trivia');
assert.equal(exactTriviaSpanRecord.ownershipAnchor.parserTriviaAdapterId, 'fixture-exact-parser-trivia-adapter');
assert.equal(exactTriviaSpanRecord.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactTriviaSpanRecord.parserTriviaOwnershipBlockReasonCodes.length, 0);
assert.equal(exactTriviaSpanRecord.ownershipAnchor.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactTriviaSpanRecord.ownershipAnchor.parserTriviaOwnershipBlockReasonCodes.length, 0);

const exactRuntimeDirectiveRecord = exactTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'directive' && record.kind === 'runtime-directive');
assert.equal(exactRuntimeDirectiveRecord.parserTriviaOwnershipRelation, 'directive-prologue');
assert.equal(exactRuntimeDirectiveRecord.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactRuntimeDirectiveRecord.parserTriviaOwnershipReasonCodes.includes('directive-prologue-ownership'), true);
assert.equal(exactRuntimeDirectiveRecord.parserEvidence, 'fixture-parser-token-comment-ranges');
const exactLeadingCommentRecord = exactTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'comment' && record.start === 0);
assert.equal(exactLeadingCommentRecord.parserTriviaOwnershipRelation, 'leading-comment');
assert.equal(exactLeadingCommentRecord.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactLeadingCommentRecord.parserTriviaOwnershipReasonCodes.includes('leading-comment-ownership'), true);
assert.equal(exactLeadingCommentRecord.parserEvidence, 'fixture-parser-token-comment-ranges');
const exactTrailingCommentRecord = exactTriviaProject.projectSymbolGraph.sourceSpanRecords
  .find((record) => record.role === 'comment' && record.kind === 'comment' && record.parserTriviaOwnershipRelation === 'trailing-comment');
assert.equal(exactTrailingCommentRecord.parserTriviaOwnershipStatus, 'exact');
assert.equal(exactTrailingCommentRecord.parserTriviaOwnershipReasonCodes.includes('trailing-comment-ownership'), true);
assert.equal(exactTrailingCommentRecord.parserEvidence, 'fixture-parser-token-comment-ranges');

const compilerSpanCoverageAdapter = createTypeScriptCompilerNativeImporterAdapter({ typescript: ts });
const exactCompilerSpanCases = [
  {
    language: 'javascript',
    sourcePath: 'src/parser-span-coverage.js',
    languageMode: 'javascript',
    sourceText: [
      '// js leading owner',
      '"use strict";',
      'export const value = 1; // js trailing owner',
      ''
    ].join('\n')
  },
  {
    language: 'typescript',
    sourcePath: 'src/parser-span-coverage.ts',
    languageMode: 'typescript',
    sourceText: [
      '// ts leading owner',
      'type Item = { value: number };',
      'export const item: Item = { value: 1 }; // ts trailing owner',
      ''
    ].join('\n')
  },
  {
    language: 'javascript',
    sourcePath: 'src/parser-span-coverage.jsx',
    languageMode: 'jsx',
    sourceText: [
      '// jsx leading owner',
      'export function View() {',
      '  return <button data-kind="ok">Run</button>;',
      '}',
      ''
    ].join('\n')
  },
  {
    language: 'typescript',
    sourcePath: 'src/parser-span-coverage.tsx',
    languageMode: 'tsx',
    sourceText: [
      '// tsx leading owner',
      'type Props = { label: string };',
      'export function View(props: Props) {',
      '  return <button>{props.label}</button>;',
      '}',
      ''
    ].join('\n')
  }
];

for (const parserCase of exactCompilerSpanCases) {
  const imported = await runNativeImporterAdapter(compilerSpanCoverageAdapter, parserCase);
  assertExactCompilerSpanCoverage(imported, parserCase);
}

const truncatedCompilerSpanImport = await runNativeImporterAdapter(
  createTypeScriptCompilerNativeImporterAdapter({ typescript: ts, maxTokens: 1 }),
  exactCompilerSpanCases[3]
);
const truncatedPreservation = truncatedCompilerSpanImport.metadata.sourcePreservation;
const truncatedProof = truncatedPreservation.metadata.parserSpanCoverageProof;
assert.equal(truncatedProof.status, 'blocked');
assert.equal(truncatedProof.exactParserSpans, false);
assert.equal(truncatedProof.blockReasonCodes.includes('parser-span-coverage-truncated'), true);
assert.equal(truncatedPreservation.summary.parserTriviaExactnessStatus, 'blocked');
assert.equal(truncatedPreservation.summary.exactParserTrivia, false);
assert.equal(truncatedPreservation.metadata.parserTriviaExactness.parserSpanCoverageStatus, 'blocked');
assert.equal(
  truncatedPreservation.metadata.parserTriviaExactness.blockReasonCodes.includes('exact-parser-trivia-span-coverage-blocked'),
  true
);
const truncatedCommentAnchor = truncatedPreservation.trivia.find((entry) => entry.kind === 'comment')?.ownershipAnchor;
assert.equal(truncatedCommentAnchor.parserTriviaExactnessStatus, 'blocked');
assert.equal(truncatedCommentAnchor.exactParserTrivia, false);

function assertExactCompilerSpanCoverage(imported, parserCase) {
  const preservation = imported.metadata.sourcePreservation;
  const proof = preservation.metadata.parserSpanCoverageProof;
  assert.equal(proof.status, 'exact');
  assert.equal(proof.exactParserSpans, true);
  assert.equal(proof.sourceLength, parserCase.sourceText.length);
  assert.equal(proof.coveredSourceLength, parserCase.sourceText.length);
  assert.equal(proof.contiguous, true);
  assert.equal(proof.textMatchesSource, true);
  assert.equal(proof.languageMode, parserCase.languageMode);
  assert.equal(proof.boundedLanguages.includes('javascript'), true);
  assert.equal(proof.boundedLanguages.includes('typescript'), true);
  assert.equal(proof.boundedLanguages.includes('jsx'), true);
  assert.equal(proof.boundedLanguages.includes('tsx'), true);
  assert.equal(preservation.summary.parserSpanCoverageStatus, 'exact');
  assert.equal(preservation.summary.parserTriviaExactnessStatus, 'exact');
  assert.equal(preservation.metadata.parserTriviaExactness.parserSpanCoverageStatus, 'exact');
  assert.equal(preservation.metadata.parserTriviaExactness.reasonCodes.includes('parser-token-comment-span-coverage-exact'), true);
  const commentAnchor = preservation.trivia.find((entry) => entry.kind === 'comment')?.ownershipAnchor;
  assert.equal(commentAnchor.parserTriviaExactnessStatus, 'exact');
  assert.equal(commentAnchor.exactParserTrivia, true);
}
