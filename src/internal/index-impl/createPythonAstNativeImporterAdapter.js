import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromPythonAst}from'./createNativeImportFromPythonAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parsePythonAstSource}from'./parsePythonAstSource.js';import{pythonAstRoot}from'./pythonAstRoot.js';
export function createPythonAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.python-ast-native-importer',
    language: options.language ?? 'python',
    parser: options.parser ?? 'python-ast',
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
        'Normalizes caller-owned Python stdlib ast trees into native AST nodes and declaration-level semantic index records.',
        'Python ast does not preserve comments, whitespace, or concrete formatting; use LibCST/parso-style host evidence for round-trip trivia.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.py', '.pyi'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? options.ast
        ?? parsePythonAstSource(input, options);
      const root = pythonAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'python-ast',
          adapterId: options.id ?? 'frontier.python-ast-native-importer',
          message: 'createPythonAstNativeImporterAdapter requires an injected Python AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'python-ast'
      });
      return createNativeImportFromPythonAst(root, input, {
        parser: options.parser ?? 'python-ast',
        astFormat: 'python-ast',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        pythonVersion: options.pythonVersion ?? input.options?.pythonVersion ?? parsed?.pythonVersion,
        includeAttributes: options.includeAttributes ?? input.options?.includeAttributes
      });
    }
  };
}
