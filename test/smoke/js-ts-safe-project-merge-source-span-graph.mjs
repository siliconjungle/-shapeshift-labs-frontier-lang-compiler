import { assert } from './helpers.mjs';
import { createNativeSourcePreservation, safeMergeJsTsProject } from './compiler-api.mjs';
import { scanPreservedSourceDirectives, scanPreservedSourceTokens } from '../../src/native-source-preservation-scanner.js';
import { addProjectGraphDeltaConflictSummary } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { projectSourceSpanDeltaConflicts } from '../../src/js-ts-safe-project-merge-source-span-conflicts.js';
const sourceText = [
  '// @ts-check',
  '"use strict";',
  'export function render(value) {',
  '  const text = `value:${value}`;',
  '  return text;',
  '}',
  '//# sourceMappingURL=render.js.map',
  ''
].join('\n');
const duplicateCommentSource = [
  '"use strict";',
  '// owner marker',
  'export const first = 1;',
  '// owner marker',
  'export const second = 2;',
  ''
].join('\n');
const sourceUrlBoundarySource = [
  'export const fromEvalBundle = true;',
  '//# sourceURL=webpack://frontier/generated/source-url-boundary.js',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_source_span_output_graph',
  language: 'javascript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/render.js': sourceText },
  workerFiles: { 'src/render.js': sourceText },
  headFiles: { 'src/render.js': sourceText }
});

const graph = project.outputProjectSymbolGraph;
assert.equal(project.status, 'merged');
assert.equal(graph.sourceFileRecords.length, 1);
assert.equal(graph.sourceSpanRecords.length > graph.sourceFileRecords.length, true);
assert.equal(project.outputProjectImport.projectSymbolGraph.sourceSpanRecords.length, graph.sourceSpanRecords.length);
assert.equal(graph.remainingFields.includes('sourceSpanRecords'), false);
assert.equal(graph.sourceFileRecords[0].exactSourceAvailable, true);
assert.equal(graph.sourceFileRecords[0].sourceMapCommentCount >= 1, true);
assert.equal(graph.sourceFileRecords[0].triviaOwnershipStatus, 'deterministic-lightweight');
assert.equal(graph.sourceFileRecords[0].triviaOwnershipReasonCodes.includes('lossless-cst-unavailable'), true);
assert.equal(graph.sourceFileRecords[0].triviaOwnershipReasonCodes.includes('parser-trivia-proof-approximate'), true);
assert.equal(graph.sourceFileRecords[0].triviaOwnershipBlockReasonCodes.length, 0);
assert.equal(graph.sourceFileRecords[0].losslessCst, false);
assert.equal(graph.sourceFileRecords[0].parserTriviaExactnessStatus, 'approximate');
assert.equal(graph.sourceFileRecords[0].exactParserTrivia, false);
assert.equal(graph.sourceFileRecords[0].parserTriviaExactnessReasonCodes.includes('exact-parser-trivia-evidence-missing'), true);
assert.equal(graph.sourceFileRecords[0].parserEvidence, 'frontier-lightweight-js-ts-source-ledger');
assert.equal(graph.sourceFileRecords[0].roundtripHash, graph.sourceFileRecords[0].sourceHash);
assert.equal(typeof graph.sourceFileRecords[0].shapeHash, 'string');
assert.equal(graph.sourceSpanRecords.some((record) => record.role === 'directive' && record.kind === 'runtime-directive'), true);
assert.equal(graph.sourceSpanRecords.some((record) => record.role === 'directive' && record.kind === 'module-directive'), true);
assert.equal(graph.sourceSpanRecords.some((record) => record.kind === 'source-map-comment' && record.trivia), true);
assert.equal(graph.sourceSpanRecords.some((record) => record.role === 'protected' && record.kind === 'template'), true);
const runtimeDirectiveRecord = graph.sourceSpanRecords.find((record) => record.role === 'directive' && record.kind === 'runtime-directive');
assert.equal(runtimeDirectiveRecord.identityKey, 'source-span#src/render.js#directive#runtime-directive#runtime-directive-prologue');
assert.equal(runtimeDirectiveRecord.ownershipAnchor.identityAnchor, 'runtime-directive-prologue');
assert.equal(runtimeDirectiveRecord.ownershipAnchor.losslessCst, false);
assert.equal(runtimeDirectiveRecord.parserTriviaExactnessStatus, 'approximate');
assert.equal(runtimeDirectiveRecord.exactParserTrivia, false);
assert.deepEqual([runtimeDirectiveRecord.parserTriviaOwnershipRelation, runtimeDirectiveRecord.parserTriviaOwnershipStatus], ['directive-prologue', 'blocked']);
assert.equal(runtimeDirectiveRecord.parserTriviaOwnershipBlockReasonCodes.includes('exact-parser-trivia-ownership-requires-parser-evidence'), true);
assert.deepEqual([runtimeDirectiveRecord.ownershipAnchor.parserTriviaOwnershipStatus, runtimeDirectiveRecord.ownershipAnchor.parserTriviaOwnershipRelation], ['blocked', 'directive-prologue']);
assert.deepEqual([runtimeDirectiveRecord.stableId.startsWith('source_span_'), typeof runtimeDirectiveRecord.stableHash], [true, 'string']);
const leadingCommentRecord = graph.sourceSpanRecords.find((record) => record.role === 'comment' && record.kind === 'comment' && record.start === 0);
assert.deepEqual([leadingCommentRecord.parserTriviaOwnershipRelation, leadingCommentRecord.parserTriviaOwnershipStatus], ['leading-comment', 'blocked']);
assert.equal(leadingCommentRecord.parserTriviaOwnershipBlockReasonCodes.includes('exact-parser-trivia-ownership-requires-parser-evidence'), true);
const sourceMapCommentRecord = graph.sourceSpanRecords.find((record) => record.kind === 'source-map-comment' && record.trivia);
assert.equal(sourceMapCommentRecord.ownershipAnchor.anchorKind, 'generated-source-boundary');
assert.equal(sourceMapCommentRecord.ownershipAnchorStatus, 'deterministic-lightweight');
const templateRecord = graph.sourceSpanRecords.find((record) => record.role === 'protected' && record.kind === 'template');
assert.equal(templateRecord.ownershipAnchor.anchorKind, 'protected-source-span');
assert.equal(templateRecord.losslessCst, false);
const approximateTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText
});
assert.equal(approximateTriviaPreservation.summary.parserTriviaExactnessStatus, 'approximate');
assert.equal(approximateTriviaPreservation.summary.exactParserTrivia, false);
assert.equal(approximateTriviaPreservation.summary.parserTriviaExactnessReasonCodes.includes('parser-trivia-proof-approximate'), true);
const parserBackedTokensAndTrivia = { tokens: approximateTriviaPreservation.tokens, trivia: approximateTriviaPreservation.trivia, truncated: false, parserEvidence: 'fixture-parser-token-comment-ranges' };
const exactTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText,
  tokensAndTrivia: parserBackedTokensAndTrivia,
  parserTriviaEvidence: {
    status: 'exact',
    exactParserTrivia: true,
    losslessCst: true,
    sourceHash: approximateTriviaPreservation.sourceHash,
    adapterId: 'fixture-exact-parser-trivia-adapter',
    evidenceId: 'fixture-exact-parser-trivia'
  }
});
assert.equal(exactTriviaPreservation.summary.parserTriviaExactnessStatus, 'exact');
assert.equal(exactTriviaPreservation.summary.exactParserTrivia, true);
assert.equal(exactTriviaPreservation.metadata.parserTriviaExactness.losslessCst, true);
const staleTriviaPreservation = createNativeSourcePreservation({
  language: 'javascript',
  sourcePath: 'src/parser-trivia-exactness.js',
  sourceText,
  tokensAndTrivia: parserBackedTokensAndTrivia,
  parserTriviaEvidence: {
    status: 'exact',
    exactParserTrivia: true,
    sourceHash: 'stale-source-hash',
    adapterId: 'fixture-exact-parser-trivia-adapter',
    evidenceId: 'fixture-stale-parser-trivia'
  }
});
assert.equal(staleTriviaPreservation.summary.parserTriviaExactnessStatus, 'blocked');
assert.equal(staleTriviaPreservation.summary.parserTriviaExactnessBlockReasonCodes.includes('parser-trivia-source-hash-mismatch'), true);

const duplicateCommentProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_duplicate_comment_ownership_anchors',
  language: 'javascript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/comments.js': duplicateCommentSource },
  workerFiles: { 'src/comments.js': duplicateCommentSource },
  headFiles: { 'src/comments.js': duplicateCommentSource }
});
const duplicateCommentRecords = duplicateCommentProject.outputProjectSymbolGraph.sourceSpanRecords
  .filter((record) => record.kind === 'comment' && record.role === 'comment');
assert.equal(duplicateCommentRecords.length, 2);
assert.equal(duplicateCommentRecords[0].textHash, duplicateCommentRecords[1].textHash);
assert.notEqual(duplicateCommentRecords[0].identityKey, duplicateCommentRecords[1].identityKey);
assert.notEqual(duplicateCommentRecords[0].ownershipAnchorKey, duplicateCommentRecords[1].ownershipAnchorKey);
assert.equal(duplicateCommentRecords.every((record) => record.ownershipAnchor.insertionAnchor?.reasonCodes.includes('nearest-next-source-span')), true);

const genericTriviaScan = scanPreservedSourceTokens([
  'const sourceMapMarker = "sourceMappingURL=inside-string";',
  '//# sourceMappingURL=client.js.map',
  '/*# sourceURL=generated.js */',
  ''
].join('\n'), {
  language: 'javascript',
  sourcePath: 'src/generated.js',
  sourceHash: 'source:generated'
});
assert.equal(genericTriviaScan.trivia.filter((entry) => entry.kind === 'source-map-comment').length, 2);
assert.equal(genericTriviaScan.tokens.some((entry) => entry.kind === 'string' && entry.text.includes('sourceMappingURL=inside-string')), true);

const sourceUrlBoundaryProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_source_url_generated_boundary_ledger',
  language: 'javascript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/source-url-boundary.js': sourceUrlBoundarySource },
  workerFiles: { 'src/source-url-boundary.js': sourceUrlBoundarySource },
  headFiles: { 'src/source-url-boundary.js': sourceUrlBoundarySource }
});
assert.equal(sourceUrlBoundaryProject.status, 'merged');
const sourceUrlBoundaryGraph = sourceUrlBoundaryProject.outputProjectSymbolGraph;
const sourceUrlBoundaryFileRecord = sourceUrlBoundaryGraph.sourceFileRecords[0];
assert.equal(sourceUrlBoundaryFileRecord.sourceMapCommentCount, 1);
assert.equal(sourceUrlBoundaryFileRecord.triviaOwnershipStatus, 'deterministic-lightweight');
assert.equal(sourceUrlBoundaryFileRecord.generatedSourceBoundaryEvidence, 'source-map-comment-detected');
const sourceUrlBoundaryRecord = sourceUrlBoundaryGraph.sourceSpanRecords
  .find((record) => record.kind === 'source-map-comment' && record.trivia);
assert.equal(sourceUrlBoundaryRecord.ownershipAnchor.anchorKind, 'generated-source-boundary');
assert.equal(sourceUrlBoundaryRecord.ownershipAnchorStatus, 'deterministic-lightweight');
assert.equal(sourceUrlBoundaryRecord.sourceMapGeneratedBoundaryStatus, 'blocked');
assert.equal(sourceUrlBoundaryRecord.sourceMapGeneratedBoundaryBlockReasonCodes.includes('ecma-426:missing-exact-source-generated-boundary'), true);

const genericDirectiveScan = scanPreservedSourceDirectives('"use client";\nexport const client = true;\n', {
  language: 'javascript',
  sourcePath: 'src/client.js',
  sourceHash: 'source:client'
});
assert.equal(genericDirectiveScan.directives.some((entry) => entry.kind === 'runtime-directive' && entry.text === '"use client";'), true);

const directiveMerge = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_runtime_directive_prologue',
  language: 'javascript',
  baseFiles: { 'src/directive.js': '"use strict";\nexport const stable = 1;\n' },
  workerFiles: { 'src/directive.js': '"use strict";\nexport const stable = 1;\nexport const workerOnly = 1;\n' },
  headFiles: { 'src/directive.js': '"use strict";\nexport const stable = 1;\n' }
});
assert.equal(directiveMerge.status, 'merged');
assert.equal(directiveMerge.outputFiles[0].sourceText, '"use strict";\nexport const stable = 1;\nexport const workerOnly = 1;\n');

const delta = sourceSpanDelta({
  base: sourceSpan('base', 'source:base', 1, 12),
  worker: sourceSpan('worker', 'source:worker', 1, 13),
  head: sourceSpan('head', 'source:head', 1, 14),
  output: sourceSpan('output', 'source:output', 1, 15)
});
const conflicts = projectSourceSpanDeltaConflicts(delta);
const summarized = addProjectGraphDeltaConflictSummary(delta, conflicts);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].code, 'project-source-span-delta-conflict');
assert.equal(conflicts[0].details.identityKey, 'source-span#src/render.js#directive#runtime-directive#runtime-directive-prologue');
assert.equal(conflicts[0].details.worker.signatureHash, 'source:worker');
assert.equal(conflicts[0].details.worker.generatedBoundaryPositionKey, undefined);
assert.equal(summarized.summary.sourceSpanConflicts, 1);

const unchangedHeadDelta = sourceSpanDelta({
  base: sourceSpan('base', 'source:base', 1, 12),
  worker: sourceSpan('worker', 'source:worker', 1, 13),
  head: sourceSpan('head', 'source:base', 1, 12)
});
assert.equal(projectSourceSpanDeltaConflicts(unchangedHeadDelta).length, 0);

const shiftedLineDelta = sourceSpanDelta({
  base: sourceSpan('base', 'source:base', 1, 12, { startLine: 2 }),
  worker: sourceSpan('worker', 'source:worker', 7, 18, { startLine: 3 }),
  head: sourceSpan('head', 'source:base', 7, 18, { startLine: 3 })
});
assert.equal(projectSourceSpanDeltaConflicts(shiftedLineDelta).length, 0);

const generatedBoundaryMoveDelta = sourceSpanDelta({
  base: sourceSpan('base', 'source:map', 80, 112, { role: 'trivia', kind: 'source-map-comment', trivia: true, directive: false, startLine: 8, textHash: 'source-map-comment-text', ownershipAnchor: { anchorKind: 'generated-source-boundary' } }),
  worker: sourceSpan('worker', 'source:map', 20, 52, { role: 'trivia', kind: 'source-map-comment', trivia: true, directive: false, startLine: 3, textHash: 'source-map-comment-text', ownershipAnchor: { anchorKind: 'generated-source-boundary' } }),
  head: sourceSpan('head', 'source:map', 100, 132, { role: 'trivia', kind: 'source-map-comment', trivia: true, directive: false, startLine: 10, textHash: 'source-map-comment-text', ownershipAnchor: { anchorKind: 'generated-source-boundary' } })
});
const generatedBoundaryMoveConflicts = projectSourceSpanDeltaConflicts(generatedBoundaryMoveDelta);
assert.equal(generatedBoundaryMoveConflicts.length, 1);
assert.equal(generatedBoundaryMoveConflicts[0].code, 'project-source-span-delta-conflict');
assert.equal(generatedBoundaryMoveConflicts[0].details.worker.generatedBoundaryPositionKey, 'generated-boundary-position#3#1#3#33');

const ownershipBlockedDelta = sourceSpanDelta({
  base: sourceSpan('base', 'source:base', 1, 12, { ownershipAnchorStatus: 'blocked', ownershipBlockReasonCodes: ['source-text-unavailable-for-trivia-ownership'] }),
  worker: sourceSpan('worker', 'source:base', 1, 12),
  head: sourceSpan('head', 'source:base', 1, 12)
});
const ownershipBlockedConflicts = projectSourceSpanDeltaConflicts(ownershipBlockedDelta);
assert.equal(ownershipBlockedConflicts.some((conflict) => conflict.code === 'project-source-span-ownership-blocked'), true);
assert.equal(ownershipBlockedConflicts[0].details.ownershipBlockReasonCodes.includes('source-text-unavailable-for-trivia-ownership'), true);

const parserTriviaBlockedDelta = sourceFileDelta({
  base: sourceFile('base', {
    triviaOwnershipStatus: 'blocked',
    triviaOwnershipBlockReasonCodes: ['parser-trivia-source-hash-mismatch'],
    parserTriviaExactnessStatus: 'blocked',
    parserTriviaExactnessBlockReasonCodes: ['parser-trivia-source-hash-mismatch']
  }),
  worker: sourceFile('worker'),
  head: sourceFile('head')
});
const parserTriviaBlockedConflicts = projectSourceSpanDeltaConflicts(parserTriviaBlockedDelta);
assert.equal(parserTriviaBlockedConflicts.some((conflict) => conflict.code === 'project-source-trivia-ownership-blocked'), true);
assert.equal(parserTriviaBlockedConflicts[0].details.parserTriviaExactnessBlockReasonCodes.includes('parser-trivia-source-hash-mismatch'), true);

const sourceSpanProofProject = safeMergeJsTsProject({
  id: 'js_ts_project_source_span_roundtrip_parser_trivia_approximation',
  language: 'typescript',
  baseFiles: { 'src/value.ts': 'export const value = 1;\n' },
  workerFiles: { 'src/value.ts': 'export const value = 1;\nexport const workerValue = value + 1;\n' },
  headFiles: { 'src/value.ts': 'export const value = 1;\n' }
});
const sourceSpanProof = sourceSpanProofProject.proofEvidence.records.find((record) => record.level === 'source-span-roundtrip');
assert.equal(sourceSpanProof.status, 'passed');
assert.equal(sourceSpanProof.metadata.parserTriviaExactnessStatus, 'approximate');
assert.equal(sourceSpanProof.metadata.approximateParserTriviaFiles, 1);
assert.equal(sourceSpanProof.metadata.parserTriviaExactnessReasonCodes.includes('parser-trivia-proof-approximate'), true);

function sourceSpanDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { sourceSpanRecords: record ? [record] : [] },
      summary: { sourceSpanRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function sourceFileDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { sourceFileRecords: record ? [record] : [], sourceSpanRecords: [] },
      summary: { sourceFileRecords: record ? 1 : 0, sourceSpanRecords: 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function sourceSpan(stage, signatureHash, start, end, options = {}) {
  const startLine = options.startLine ?? 2;
  const endLine = options.endLine ?? startLine;
  const startColumn = options.startColumn ?? 1;
  const role = options.role ?? 'directive';
  const kind = options.kind ?? 'runtime-directive';
  const identityAnchor = options.identityAnchor ?? (kind === 'runtime-directive' ? 'runtime-directive-prologue' : kind);
  return {
    id: `source_span_${stage}`,
    sourcePath: 'src/render.js',
    identityKey: options.identityKey ?? `source-span#src/render.js#${role}#${kind}#${identityAnchor}`,
    role,
    kind,
    ordinal: 2,
    start,
    end,
    sourceSpan: { path: 'src/render.js', start, end, startLine, startColumn, endLine, endColumn: startColumn + (end - start) },
    textHash: options.textHash ?? `${signatureHash}:text`,
    signatureHash,
    directive: options.directive ?? true,
    trivia: options.trivia,
    ownershipAnchor: options.ownershipAnchor,
    sourceHash: `source:${stage}`,
    ownershipAnchorStatus: options.ownershipAnchorStatus,
    ownershipBlockReasonCodes: options.ownershipBlockReasonCodes
  };
}

function sourceFile(stage, extra = {}) { return { id: `${stage}_file`, sourcePath: 'src/render.js', sourceHash: `${stage}_hash`, triviaOwnershipStatus: 'deterministic-lightweight', triviaOwnershipReasonCodes: [], triviaOwnershipBlockReasonCodes: [], parserEvidence: 'frontier-lightweight-js-ts-source-ledger', losslessCst: false, roundtripHash: `${stage}_hash`, ...extra }; }
