function createJavaScriptSyntaxImporterAdapter(options, deps) {
  const {
    createNativeImportFromSyntaxAst,
    declarationSemanticCoverage,
    missingInjectedParserResult,
    nativeImporterAdapterCoverage,
    normalizeParserErrors,
    uniqueStrings
  } = deps;
  return {
    id: options.id,
    language: options.language,
    parser: options.parser,
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', 'tokens', 'trivia', 'parserTriviaExactness', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'exact-parser-ast',
      exactAst: true,
      tokens: true,
      trivia: true,
      diagnostics: true,
      sourceRanges: true,
      generatedRanges: false,
      semanticCoverage: declarationSemanticCoverage(),
      notes: [
        'Normalizes a caller-owned ESTree/Babel-compatible AST into native AST nodes and declaration-level semantic index records.',
        'When parser token/comment arrays include exact ranges for the current source, they become exact source-preservation evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions,
    diagnostics: options.diagnostics,
    parse(input) {
      const ast = input.options?.ast ?? input.options?.nativeAst ?? options.ast ?? parseJavaScriptSyntax(input, options);
      if (!ast) {
        return missingInjectedParserResult(input, {
          parser: options.parser,
          adapterId: options.id,
          message: `${options.id} requires an injected parse function, parserModule.parse, ast, or adapterOptions.ast.`
        });
      }
      const parseDiagnostics = normalizeParserErrors(ast.errors, input, options);
      return createNativeImportFromSyntaxAst(ast, input, {
        parser: options.parser,
        astFormat: options.astFormat,
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        includeTokens: options.includeTokens,
        includeTrivia: options.includeTrivia,
        maxTokens: options.maxTokens,
        maxTrivia: options.maxTrivia
      });
    }
  };
}

function parseJavaScriptSyntax(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.babelParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourceFilename: input.sourcePath,
    ...(options.defaultParserOptions ?? {}),
    ...(typeof options.parserOptions === 'function'
      ? options.parserOptions(input)
      : options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function createTypeScriptSourceFile(ts, input, options) {
  if (typeof options.createSourceFile === 'function') return options.createSourceFile(input, ts);
  if (!ts || typeof ts.createSourceFile !== 'function') return undefined;
  const scriptTarget = options.scriptTarget ?? ts.ScriptTarget?.Latest ?? ts.ScriptTarget?.ESNext ?? 99;
  const scriptKind = options.scriptKind ?? inferTypeScriptScriptKind(ts, input);
  return ts.createSourceFile(input.sourcePath ?? 'frontier-input.ts', input.sourceText, scriptTarget, true, scriptKind);
}

function inferTypeScriptScriptKind(ts, input) {
  const path = String(input.sourcePath ?? '').toLowerCase();
  if (path.endsWith('.tsx')) return ts.ScriptKind?.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind?.JSX;
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return ts.ScriptKind?.JS;
  return ts.ScriptKind?.TS;
}

export {
  createJavaScriptSyntaxImporterAdapter,
  createTypeScriptSourceFile
};
