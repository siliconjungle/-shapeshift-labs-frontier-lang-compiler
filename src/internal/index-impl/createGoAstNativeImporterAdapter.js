import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromGoAst}from'./createNativeImportFromGoAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{goAstRoot}from'./goAstRoot.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseGoAstSource}from'./parseGoAstSource.js';
export function createGoAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.go-ast-native-importer',
    language: options.language ?? 'go',
    parser: options.parser ?? 'go/parser',
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
        'Normalizes caller-owned Go go/ast-shaped File or Package trees into native AST nodes and declaration-level semantic index records.',
        'Go AST imports do not resolve types, imports, build tags, generated code, or control flow by themselves; attach FileSet, go/types, go/packages, and build context evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.go'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.file
        ?? input.options?.sourceFile
        ?? input.options?.package
        ?? options.ast
        ?? options.file
        ?? options.sourceFile
        ?? options.package
        ?? parseGoAstSource(input, options);
      const root = goAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'go/parser',
          adapterId: options.id ?? 'frontier.go-ast-native-importer',
          message: 'createGoAstNativeImporterAdapter requires an injected Go ast.File/Package-shaped object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'go/parser'
      });
      return createNativeImportFromGoAst(root, input, {
        parser: options.parser ?? 'go/parser',
        astFormat: 'go-ast',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        goVersion: options.goVersion ?? input.options?.goVersion ?? parsed?.goVersion,
        packageName: options.packageName ?? input.options?.packageName ?? parsed?.packageName ?? root?.Name?.Name ?? root?.Name,
        fileSet: input.options?.fileSet ?? input.options?.fset ?? options.fileSet ?? options.fset ?? parsed?.fileSet ?? parsed?.fset,
        includeComments: options.includeComments ?? input.options?.includeComments,
        buildTags: input.options?.buildTags ?? options.buildTags ?? parsed?.buildTags,
        generated: input.options?.generated ?? options.generated ?? parsed?.generated,
        typeEvidence: input.options?.typeEvidence ?? options.typeEvidence ?? parsed?.typeEvidence
      });
    }
  };
}
