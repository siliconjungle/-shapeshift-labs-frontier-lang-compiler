import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromSwiftSyntax}from'./createNativeImportFromSwiftSyntax.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseSwiftSyntaxSource}from'./parseSwiftSyntaxSource.js';import{swiftGeneratedSourcePath}from'./swiftGeneratedSourcePath.js';import{swiftSyntaxRoot}from'./swiftSyntaxRoot.js';
export function createSwiftSyntaxNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.swift-syntax-native-importer',
    language: options.language ?? 'swift',
    parser: options.parser ?? 'swift-syntax',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'parser-tree',
      exactAst: true,
      tokens: true,
      trivia: true,
      diagnostics: true,
      sourceRanges: true,
      generatedRanges: false,
      semanticCoverage: declarationSemanticCoverage(),
      notes: [
        'Normalizes caller-owned SwiftSyntax/SwiftParser-shaped SourceFileSyntax trees into native AST nodes and declaration-level semantic index records.',
        'SwiftSyntax imports do not resolve SourceKit symbols, type checking, macro expansions, conditional compilation branches, Objective-C bridging, generated sources, package/module dependencies, or control flow by themselves; attach host evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.swift'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.sourceFile
        ?? input.options?.sourceFileSyntax
        ?? input.options?.root
        ?? options.ast
        ?? options.sourceFile
        ?? options.sourceFileSyntax
        ?? options.root
        ?? parseSwiftSyntaxSource(input, options);
      const root = swiftSyntaxRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'swift-syntax',
          adapterId: options.id ?? 'frontier.swift-syntax-native-importer',
          message: 'createSwiftSyntaxNativeImporterAdapter requires an injected SwiftSyntax SourceFileSyntax-shaped object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics ?? parsed?.parseDiagnostics, input, {
        parser: options.parser ?? 'swift-syntax'
      });
      return createNativeImportFromSwiftSyntax(root, input, {
        parser: options.parser ?? 'swift-syntax',
        astFormat: 'swift-syntax',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        swiftVersion: options.swiftVersion ?? input.options?.swiftVersion ?? parsed?.swiftVersion,
        languageMode: options.languageMode ?? input.options?.languageMode ?? parsed?.languageMode,
        generated: input.options?.generated ?? options.generated ?? parsed?.generated ?? swiftGeneratedSourcePath(input.sourcePath),
        sourceKitEvidence: input.options?.sourceKitEvidence ?? options.sourceKitEvidence ?? parsed?.sourceKitEvidence,
        macroExpansionEvidence: input.options?.macroExpansionEvidence ?? options.macroExpansionEvidence ?? parsed?.macroExpansionEvidence,
        packageResolutionEvidence: input.options?.packageResolutionEvidence ?? options.packageResolutionEvidence ?? parsed?.packageResolutionEvidence
      });
    }
  };
}
