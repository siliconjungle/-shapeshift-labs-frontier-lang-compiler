import { assert } from './helpers.mjs';
import { scanPreservedSourceTokens } from '../../src/native-source-preservation-scanner.js';
import { classifySourceMapGeneratedBoundary } from '../../src/internal/index-impl/sourceMapGeneratedBoundaryGate.js';

const semanticMergeParserMatrixCells = [
  {
    id: 'parser-source-span-trivia/typescript-sourcefile-exact-parser-trivia',
    status: 'done',
    evidence: 'js-ts-typescript-parser-trivia-evidence',
    note: 'TypeScript SourceFile imports produce parser-backed exact token/trivia source-preservation evidence and project graph source-span records'
  },
  {
    id: 'parser-source-span-trivia/syntax-ast-exact-parser-trivia',
    status: 'done',
    evidence: 'js-ts-syntax-parser-trivia-evidence',
    note: 'ESTree/Babel AST imports with exact parser token/comment ranges produce source-preservation and project source-span evidence'
  },
  {
    id: 'parser-source-span-trivia/project-merge-parser-import-exactness',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-parser-trivia-evidence',
    note: 'Project graph stages accept supplied parser-backed token/comment trivia imports as exact while metadata-only or scanner/ledger fallback evidence remains blocked'
  },
  {
    id: 'parser-source-span-trivia/source-span-roundtrip-failure-blocker',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-parser-trivia-evidence',
    note: 'Failed source-span roundtrip proof blocks project admission instead of allowing trivia-loss output to remain a merged result'
  },
  {
    id: 'parser-source-span-trivia/parser-token-text-mismatch-blocker',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-parser-trivia-evidence',
    note: 'Parser-backed token/comment ranges only become exact when supplied raw/text evidence matches the current source slice'
  },
  {
    id: 'parser-source-span-trivia/jsdoc-block-comment-ownership-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-parser-trivia-evidence',
    note: 'Exact parser-backed JSDoc and block-comment spans become first-class ownership relations instead of collapsing into generic comment trivia'
  },
  {
    id: 'parser-generated-boundary/source-map-span-ownership',
    status: 'done',
    evidence: 'source-map-generated-boundary-gate',
    note: 'Exact source-map source and generated spans with source/target hashes produce deterministic generated-boundary ownership keys'
  }
];

assert.equal(semanticMergeParserMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeParserMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}

const shebangScan = scanPreservedSourceTokens('#!/usr/bin/env node\nconsole.log(1);\n', {
  language: 'javascript',
  sourcePath: 'bin/cli.js',
  sourceHash: 'source:hash'
});
assert.equal(shebangScan.trivia[0].kind, 'shebang');
assert.equal(shebangScan.trivia[0].text, '#!/usr/bin/env node');
assert.equal(shebangScan.trivia[0].span.start, 0);
assert.equal(shebangScan.trivia[0].span.end, 19);
assert.equal(shebangScan.trivia[0].span.startLine, 1);
assert.equal(shebangScan.trivia[0].span.startColumn, 1);
assert.equal(shebangScan.trivia[0].span.endLine, 1);
assert.equal(shebangScan.trivia[0].span.endColumn, 20);
assert.equal(shebangScan.trivia[0].ownershipAnchor.role, 'trivia');
assert.equal(shebangScan.trivia[0].ownershipAnchor.anchorKind, 'file-entrypoint-directive');
assert.equal(shebangScan.trivia[1].kind, 'newline');
assert.equal(shebangScan.tokens[0].text, 'console');
assert.equal(shebangScan.tokens[0].span.start, 20);

const exactGeneratedBoundaryGate = classifySourceMapGeneratedBoundary([{
  id: 'source_map_exact_generated_boundary',
  sourcePath: 'src/source.ts',
  sourceHash: 'source:hash',
  targetPath: 'dist/source.js',
  targetHash: 'target:hash',
  mappings: [{
    id: 'map_exact_boundary',
    precision: 'exact',
    sourceSpan: { path: 'src/source.ts', startLine: 1, startColumn: 1, endLine: 1, endColumn: 12, sourceHash: 'source:hash' },
    generatedSpan: { targetPath: 'dist/source.js', startLine: 3, startColumn: 5, endLine: 3, endColumn: 16, targetHash: 'target:hash' },
    metadata: { sourceMapOrigin: 'fixture-exact-source-map' }
  }]
}]);
assert.equal(exactGeneratedBoundaryGate.status, 'ready');
assert.equal(exactGeneratedBoundaryGate.autoMergeClaim, false);
assert.equal(exactGeneratedBoundaryGate.semanticEquivalenceClaim, false);
assert.equal(exactGeneratedBoundaryGate.generatedBoundaryOwnershipStatus, 'deterministic-source-map-span');
assert.equal(exactGeneratedBoundaryGate.generatedBoundaryOwnershipRecords.length, 1);
assert.equal(exactGeneratedBoundaryGate.generatedBoundaryOwnershipRecords[0].sourceMapMappingId, 'map_exact_boundary');
assert.equal(
  exactGeneratedBoundaryGate.generatedBoundaryOwnershipKeys[0],
  'generated-boundary#src/source.ts#source:hash#src/source.ts###1#1#1#12#dist/source.js#target:hash#dist/source.js###3#5#3#16'
);
assert.equal(
  exactGeneratedBoundaryGate.reasonCodes.includes('source-map-generated-boundary:deterministic-source-map-span-ownership'),
  true
);

const positionOnlyGeneratedBoundaryGate = classifySourceMapGeneratedBoundary([{
  id: 'source_map_position_only_generated_boundary',
  sourcePath: 'src/source.ts',
  sourceHash: 'source:hash',
  targetPath: 'dist/source.js',
  targetHash: 'target:hash',
  mappings: [{
    id: 'map_position_only_boundary',
    precision: 'line',
    sourceSpan: { path: 'src/source.ts', startLine: 1, startColumn: 1, sourceHash: 'source:hash' },
    generatedSpan: { targetPath: 'dist/source.js', startLine: 3, startColumn: 5, targetHash: 'target:hash' },
    metadata: { sourceMapOrigin: 'fixture-position-only-source-map' }
  }]
}]);
assert.equal(positionOnlyGeneratedBoundaryGate.status, 'blocked');
assert.equal(positionOnlyGeneratedBoundaryGate.reviewRequired, true);
assert.equal(positionOnlyGeneratedBoundaryGate.autoMergeClaim, false);
assert.equal(positionOnlyGeneratedBoundaryGate.semanticEquivalenceClaim, false);
assert.equal(positionOnlyGeneratedBoundaryGate.generatedBoundaryOwnershipStatus, 'blocked');
assert.equal(positionOnlyGeneratedBoundaryGate.generatedBoundaryOwnershipKeys.length, 0);
assert.equal(positionOnlyGeneratedBoundaryGate.generatedBoundaryOwnershipRecords.length, 0);
assert.equal(positionOnlyGeneratedBoundaryGate.summary.deterministicGeneratedBoundaryOwnerships, 0);
assert.equal(
  positionOnlyGeneratedBoundaryGate.reasonCodes.includes('ecma-426:missing-exact-source-generated-boundary'),
  true
);
