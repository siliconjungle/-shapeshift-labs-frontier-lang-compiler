import { idFragment } from '../../native-import-utils.js';
import { createParserSpanCoverageProof } from '../../native-source-preservation-ownership.js';

export function createSyntaxAstParserSpanCoverageEvidence(input) {
  const parserSpanCoverageProof = createParserSpanCoverageProof({
    sourceText: input.sourceText,
    sourcePath: input.sourcePath,
    sourceHash: input.sourceHash,
    segments: input.segments,
    tokenCount: input.tokenCount,
    triviaCount: input.triviaCount,
    commentCount: input.commentCount,
    parserEvidence: input.parserEvidence,
    adapterId: input.adapterId,
    evidenceId: `${input.adapterId}:parser-span-coverage:${idFragment(input.sourcePath ?? input.sourceHash)}`,
    languageMode: sourceLanguageMode(input),
    boundedLanguages: ['javascript', 'typescript', 'jsx', 'tsx'],
    truncated: input.truncated
  });
  return {
    parserSpanCoverageProof,
    parserTriviaEvidence: parserTriviaEvidenceForSpanCoverage(parserSpanCoverageProof, input)
  };
}

function parserTriviaEvidenceForSpanCoverage(parserSpanCoverageProof, input) {
  const exact = parserSpanCoverageProof?.status === 'exact';
  const blockReasonCodes = exact ? [] : [
    'exact-parser-trivia-span-coverage-blocked',
    ...(parserSpanCoverageProof?.blockReasonCodes ?? []),
    input.truncated ? 'source-preservation-truncated' : undefined
  ].filter(Boolean);
  return {
    status: exact ? 'exact' : 'blocked',
    exactParserTrivia: exact,
    losslessCst: exact,
    sourceHash: input.sourceHash,
    adapterId: input.adapterId,
    evidenceId: `${input.adapterId}:parser-token-comment:${idFragment(input.sourcePath ?? input.sourceHash)}`,
    parserEvidence: input.parserEvidence,
    parserSpanCoverageProof,
    ...(exact ? {} : { blockReasonCodes })
  };
}

function sourceLanguageMode(input) {
  const sourcePath = String(input.sourcePath ?? '').toLowerCase();
  if (sourcePath.endsWith('.tsx')) return 'tsx';
  if (sourcePath.endsWith('.jsx')) return 'jsx';
  if (sourcePath.endsWith('.ts') || sourcePath.endsWith('.mts') || sourcePath.endsWith('.cts')) return 'typescript';
  if (sourcePath.endsWith('.js') || sourcePath.endsWith('.mjs') || sourcePath.endsWith('.cjs')) return 'javascript';
  const language = String(input.language ?? '').toLowerCase();
  return language === 'typescript' ? 'typescript' : 'javascript';
}
