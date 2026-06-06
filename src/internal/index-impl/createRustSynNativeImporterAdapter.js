import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromRustSyn}from'./createNativeImportFromRustSyn.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseRustSynSource}from'./parseRustSynSource.js';import{rustSynAstRoot}from'./rustSynAstRoot.js';
export function createRustSynNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.rust-syn-native-importer',
    language: options.language ?? 'rust',
    parser: options.parser ?? 'syn',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'exact-parser-ast',
      exactAst: true,
      tokens: false,
      trivia: false,
      diagnostics: true,
      sourceRanges: false,
      generatedRanges: false,
      semanticCoverage: declarationSemanticCoverage(),
      notes: [
        'Normalizes caller-owned syn-shaped Rust ASTs into native AST nodes and declaration-level semantic index records.',
        'syn does not expand macros, resolve names, type-check, or preserve full concrete syntax/trivia; attach rust-analyzer/rustc evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.rs'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.file
        ?? input.options?.sourceFile
        ?? options.ast
        ?? options.file
        ?? options.sourceFile
        ?? parseRustSynSource(input, options);
      const root = rustSynAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'syn',
          adapterId: options.id ?? 'frontier.rust-syn-native-importer',
          message: 'createRustSynNativeImporterAdapter requires an injected syn-shaped AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'syn'
      });
      return createNativeImportFromRustSyn(root, input, {
        parser: options.parser ?? 'syn',
        astFormat: 'rust-syn',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        rustEdition: options.rustEdition ?? input.options?.rustEdition ?? parsed?.rustEdition,
        includeAttributes: options.includeAttributes ?? input.options?.includeAttributes
      });
    }
  };
}
