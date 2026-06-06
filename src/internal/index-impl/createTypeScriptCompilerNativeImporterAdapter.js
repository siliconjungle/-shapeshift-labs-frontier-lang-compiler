import{uniqueStrings}from'../../native-import-utils.js';import{createTypeScriptSourceFile}from'../../native-js-ts-importers.js';
import{createNativeImportFromTypeScriptAst}from'./createNativeImportFromTypeScriptAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';
export function createTypeScriptCompilerNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.typescript-compiler-native-importer',
    language: options.language ?? 'typescript',
    parser: options.parser ?? 'typescript-compiler-api',
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
        'Normalizes a caller-owned TypeScript SourceFile into native AST nodes and declaration-level semantic index records.',
        'Type resolution, reference resolution, control flow, generated ranges, and parser token/trivia streams require host-supplied adapter evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.ts', '.tsx', '.js', '.jsx'],
    diagnostics: options.diagnostics,
    parse(input) {
      const ts = options.typescript ?? options.ts ?? input.options?.typescript ?? input.options?.ts;
      const sourceFile = input.options?.sourceFile ?? input.options?.ast ?? options.sourceFile ?? createTypeScriptSourceFile(ts, input, options);
      if (!sourceFile) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'typescript-compiler-api',
          adapterId: options.id ?? 'frontier.typescript-compiler-native-importer',
          message: 'createTypeScriptCompilerNativeImporterAdapter requires an injected TypeScript module, createSourceFile function, sourceFile, or adapterOptions.sourceFile.'
        });
      }
      return createNativeImportFromTypeScriptAst(sourceFile, input, {
        parser: options.parser ?? 'typescript-compiler-api',
        astFormat: 'typescript-compiler-api',
        ts,
        maxNodes: options.maxNodes,
        includeTokens: options.includeTokens
      });
    }
  };
}
