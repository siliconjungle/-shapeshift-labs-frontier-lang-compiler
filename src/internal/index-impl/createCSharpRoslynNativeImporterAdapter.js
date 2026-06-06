import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromCSharpRoslyn}from'./createNativeImportFromCSharpRoslyn.js';import{csharpGeneratedSourcePath}from'./csharpGeneratedSourcePath.js';import{csharpRoslynRoot}from'./csharpRoslynRoot.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseCSharpRoslynSource}from'./parseCSharpRoslynSource.js';
export function createCSharpRoslynNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.csharp-roslyn-native-importer',
    language: options.language ?? 'csharp',
    parser: options.parser ?? 'roslyn',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
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
        'Normalizes caller-owned Roslyn C# SyntaxTree/SyntaxNode-shaped objects into native AST nodes and declaration-level semantic index records.',
        'Roslyn syntax imports do not resolve SemanticModel symbols, overloads, nullable flow, source generators, partial types, project references, or analyzer results by themselves; attach host evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.cs'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.syntaxTree
        ?? input.options?.tree
        ?? input.options?.root
        ?? input.options?.compilationUnit
        ?? options.ast
        ?? options.syntaxTree
        ?? options.tree
        ?? options.root
        ?? options.compilationUnit
        ?? parseCSharpRoslynSource(input, options);
      const root = csharpRoslynRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'roslyn',
          adapterId: options.id ?? 'frontier.csharp-roslyn-native-importer',
          message: 'createCSharpRoslynNativeImporterAdapter requires an injected Roslyn SyntaxTree/SyntaxNode object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics ?? parsed?.parseDiagnostics, input, {
        parser: options.parser ?? 'roslyn'
      });
      return createNativeImportFromCSharpRoslyn(root, input, {
        parser: options.parser ?? 'roslyn',
        astFormat: 'roslyn-csharp',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        csharpVersion: options.csharpVersion ?? input.options?.csharpVersion ?? parsed?.csharpVersion,
        languageVersion: options.languageVersion ?? input.options?.languageVersion ?? parsed?.languageVersion,
        nullableContext: input.options?.nullableContext ?? options.nullableContext ?? parsed?.nullableContext,
        generated: input.options?.generated ?? options.generated ?? parsed?.generated ?? csharpGeneratedSourcePath(input.sourcePath),
        projectReferences: input.options?.projectReferences ?? options.projectReferences ?? parsed?.projectReferences,
        analyzerDiagnostics: input.options?.analyzerDiagnostics ?? options.analyzerDiagnostics ?? parsed?.analyzerDiagnostics,
        semanticModelEvidence: input.options?.semanticModelEvidence ?? options.semanticModelEvidence ?? parsed?.semanticModelEvidence,
        sourceGeneratorEvidence: input.options?.sourceGeneratorEvidence ?? options.sourceGeneratorEvidence ?? parsed?.sourceGeneratorEvidence,
        positionResolver: input.options?.positionResolver ?? options.positionResolver,
        lineMap: input.options?.lineMap ?? options.lineMap ?? parsed?.lineMap
      });
    }
  };
}
