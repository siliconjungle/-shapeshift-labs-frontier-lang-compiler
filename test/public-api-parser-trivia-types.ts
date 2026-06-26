import * as compilerApi from '../src/index.js';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type ParserTriviaExactnessStatusIsTyped = compilerApi.ParserTriviaExactnessRecord['status'];
type ParserTriviaStatusAcceptsKnownValues = Expect<Equal<Extract<ParserTriviaExactnessStatusIsTyped, 'exact' | 'approximate' | 'blocked'>, 'exact' | 'approximate' | 'blocked'>>;
type ParserTriviaOwnershipRelationAcceptsKnownValues = Expect<Equal<Extract<compilerApi.ParserTriviaOwnershipRelation, 'directive-prologue' | 'leading-comment' | 'trailing-comment' | 'jsdoc-comment' | 'block-comment'>, 'directive-prologue' | 'leading-comment' | 'trailing-comment' | 'jsdoc-comment' | 'block-comment'>>;

const typedParserTriviaEvidence: compilerApi.ParserTriviaEvidenceInput = {
  status: 'exact',
  exactParserTrivia: true,
  losslessCst: true,
  sourceHash: 'hash:source',
  adapterId: 'typed-parser-trivia-adapter',
  evidenceId: 'typed-parser-trivia-evidence'
};
const typedSourcePreservationOptions: compilerApi.CreateNativeSourcePreservationOptions = {
  language: 'typescript',
  sourcePath: 'src/typed-parser-trivia.ts',
  sourceText: 'export const typed = true;\n',
  parserTriviaEvidence: typedParserTriviaEvidence
};
const typedImportNativeSourceOptions: compilerApi.ImportNativeSourceOptions = {
  language: 'typescript',
  sourcePath: 'src/typed-parser-trivia.ts',
  sourceText: 'export const typed = true;\n',
  parserTriviaEvidence: typedParserTriviaEvidence
};
const typedSourceOwnershipAnchor: compilerApi.NativeProjectSourceOwnershipAnchor = {
  parserTriviaExactnessStatus: 'exact',
  exactParserTrivia: true,
  parserTriviaEvidenceId: 'typed-parser-trivia-evidence',
  parserTriviaAdapterId: 'typed-parser-trivia-adapter',
  parserTriviaOwnershipStatus: 'exact',
  parserTriviaOwnershipRelation: 'directive-prologue',
  parserTriviaOwnershipReasonCodes: ['exact-parser-trivia-ownership'],
  parserTriviaOwnershipBlockReasonCodes: []
};
const typedSourceSpanRecord: compilerApi.NativeProjectSymbolGraphSourceSpanRecord = {
  id: 'typed_source_span',
  parserTriviaOwnershipStatus: 'blocked',
  parserTriviaOwnershipRelation: 'jsdoc-comment',
  parserTriviaOwnershipReasonCodes: ['exact-parser-trivia-ownership-blocked'],
  parserTriviaOwnershipBlockReasonCodes: ['exact-parser-trivia-ownership-requires-parser-evidence']
};

void (null as unknown as ParserTriviaStatusAcceptsKnownValues);
void (null as unknown as ParserTriviaOwnershipRelationAcceptsKnownValues);
void typedSourcePreservationOptions;
void typedImportNativeSourceOptions;
void typedSourceOwnershipAnchor;
void typedSourceSpanRecord;
