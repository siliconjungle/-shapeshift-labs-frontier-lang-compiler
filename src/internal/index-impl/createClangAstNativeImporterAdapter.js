import{uniqueStrings}from'../../native-import-utils.js';
import{clangAstRoot}from'./clangAstRoot.js';import{createNativeImportFromClangAst}from'./createNativeImportFromClangAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseClangAstSource}from'./parseClangAstSource.js';
export function createClangAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.clang-ast-native-importer',
    language: options.language ?? 'c',
    parser: options.parser ?? 'clang',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'exact-parser-ast',
      exactAst: true,
      tokens: false,
      trivia: false,
      diagnostics: true,
      sourceRanges: true,
      generatedRanges: false,
      semanticCoverage: declarationSemanticCoverage(),
      notes: [
        'Normalizes caller-owned Clang -ast-dump=json shaped ASTs into native AST nodes and declaration-level semantic index records.',
        'Clang JSON ASTs reflect a preprocessed compiler view; compile commands, macros, inactive preprocessor branches, comments/trivia, and full type/reference analysis require host evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.c', '.h', '.cc', '.cpp', '.cxx', '.hpp', '.hh'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.translationUnit
        ?? input.options?.tu
        ?? options.ast
        ?? options.translationUnit
        ?? options.tu
        ?? parseClangAstSource(input, options);
      const root = clangAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'clang',
          adapterId: options.id ?? 'frontier.clang-ast-native-importer',
          message: 'createClangAstNativeImporterAdapter requires an injected Clang JSON AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'clang'
      });
      return createNativeImportFromClangAst(root, input, {
        parser: options.parser ?? 'clang',
        astFormat: 'clang-ast-json',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        cStandard: options.cStandard ?? input.options?.cStandard ?? parsed?.cStandard,
        compileFlags: options.compileFlags ?? input.options?.compileFlags ?? parsed?.compileFlags,
        includeSystemHeaders: options.includeSystemHeaders ?? input.options?.includeSystemHeaders,
        preprocessorRecords: input.options?.preprocessorRecords ?? options.preprocessorRecords ?? parsed?.preprocessorRecords,
        includeGraph: input.options?.includeGraph ?? options.includeGraph ?? parsed?.includeGraph
      });
    }
  };
}
