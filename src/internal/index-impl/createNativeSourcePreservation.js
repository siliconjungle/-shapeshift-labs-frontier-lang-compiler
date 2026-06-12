import{countBy,idFragment,uniqueStrings}from'../../native-import-utils.js';import{detectNewlineStyle,scanPreservedSourceDirectives,scanPreservedSourceTokens}from'../../native-region-scanner.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
export function createNativeSourcePreservation(options) {
  if (!options || typeof options.sourceText !== 'string') {
    throw new Error('createNativeSourcePreservation requires sourceText');
  }
  const language = options.language ?? 'source';
  const sourceText = options.sourceText;
  const computedSourceHash = hashSemanticValue(sourceText);
  const declaredSourceHash = options.sourceHash;
  const sourceHash = computedSourceHash;
  const tokensAndTrivia = scanPreservedSourceTokens(sourceText, {
    language,
    sourcePath: options.sourcePath,
    sourceHash,
    includeTokens: options.includeTokens !== false,
    includeTrivia: options.includeTrivia !== false,
    maxTokens: options.maxTokens,
    maxTrivia: options.maxTrivia
  });
  const directiveScan = options.includeDirectives === false
    ? { directives: [], truncated: false }
    : scanPreservedSourceDirectives(sourceText, {
      language,
      sourcePath: options.sourcePath,
      sourceHash,
      maxDirectives: options.maxDirectives
    });
  const directives = directiveScan.directives;
  const triviaByKind = countBy(tokensAndTrivia.trivia.map((entry) => entry.kind ?? 'unknown'));
  const directivesByKind = countBy(directives.map((entry) => entry.kind ?? 'directive'));
  const directiveKinds = uniqueStrings(directives.map((entry) => entry.kind ?? 'directive'));
  const commentSpanIds = tokensAndTrivia.trivia
    .filter((entry) => entry.kind === 'comment')
    .map((entry) => entry.id)
    .filter(Boolean);
  const directiveSpanIds = directives
    .map((entry) => entry.id)
    .filter(Boolean);
  const newline = detectNewlineStyle(sourceText);
  return {
    kind: 'frontier.lang.nativeSourcePreservation',
    version: 1,
    id: options.id ?? `native_source_preservation_${idFragment(options.sourcePath ?? language)}_${idFragment(sourceHash)}`,
    language,
    sourcePath: options.sourcePath,
    sourceHash,
    sourceBytes: Buffer.byteLength(sourceText, options.encoding ?? 'utf8'),
    lineCount: sourceText.length ? sourceText.split(/\r\n|\r|\n/).length : 0,
    newline,
    encoding: options.encoding ?? 'utf8',
    ...(options.includeSourceText === false ? {} : { sourceText }),
    tokens: tokensAndTrivia.tokens,
    trivia: tokensAndTrivia.trivia,
    directives,
    summary: {
      tokens: tokensAndTrivia.tokens.length,
      trivia: tokensAndTrivia.trivia.length,
      directives: directives.length,
      comments: tokensAndTrivia.trivia.filter((entry) => entry.kind === 'comment').length,
      whitespace: tokensAndTrivia.trivia.filter((entry) => entry.kind === 'whitespace' || entry.kind === 'newline').length,
      triviaByKind,
      directivesByKind,
      directiveKinds,
      commentSpanIds,
      directiveSpanIds,
      exactSourceAvailable: options.includeSourceText !== false,
      truncated: tokensAndTrivia.truncated || directiveScan.truncated
    },
    metadata: {
      preservation: 'source-text-token-trivia-directive-evidence',
      tokenization: 'frontier-lightweight-lexical-scan',
      ...(declaredSourceHash ? {
        declaredSourceHash,
        sourceHashVerified: declaredSourceHash === computedSourceHash
      } : {}),
      ...options.metadata
    }
  };
}
