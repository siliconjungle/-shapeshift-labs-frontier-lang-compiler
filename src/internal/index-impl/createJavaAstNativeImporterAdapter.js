import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromJavaAst}from'./createNativeImportFromJavaAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{javaAstRoot}from'./javaAstRoot.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseJavaAstSource}from'./parseJavaAstSource.js';
export function createJavaAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.java-ast-native-importer',
    language: options.language ?? 'java',
    parser: options.parser ?? 'javac',
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
        'Normalizes caller-owned javac/JDT/JavaParser-shaped Java ASTs into native AST nodes and declaration-level semantic index records.',
        'Java AST imports do not resolve overloads, bindings, annotation processors, generated Lombok code, classpaths, modules, bytecode, comments/trivia, or control flow by themselves; attach host evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.java'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.compilationUnit
        ?? input.options?.unit
        ?? input.options?.sourceFile
        ?? options.ast
        ?? options.compilationUnit
        ?? options.unit
        ?? options.sourceFile
        ?? parseJavaAstSource(input, options);
      const root = javaAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'javac',
          adapterId: options.id ?? 'frontier.java-ast-native-importer',
          message: 'createJavaAstNativeImporterAdapter requires an injected Java AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics ?? parsed?.problems, input, {
        parser: options.parser ?? 'javac'
      });
      return createNativeImportFromJavaAst(root, input, {
        parser: options.parser ?? 'javac',
        astFormat: 'java-ast',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        javaVersion: options.javaVersion ?? input.options?.javaVersion ?? parsed?.javaVersion,
        sourceLevel: options.sourceLevel ?? input.options?.sourceLevel ?? parsed?.sourceLevel,
        classPath: input.options?.classPath ?? options.classPath ?? parsed?.classPath,
        modulePath: input.options?.modulePath ?? options.modulePath ?? parsed?.modulePath,
        generated: input.options?.generated ?? options.generated ?? parsed?.generated,
        annotationProcessing: input.options?.annotationProcessing ?? options.annotationProcessing ?? parsed?.annotationProcessing,
        bindingEvidence: input.options?.bindingEvidence ?? options.bindingEvidence ?? parsed?.bindingEvidence,
        positionResolver: input.options?.positionResolver ?? options.positionResolver,
        lineMap: input.options?.lineMap ?? options.lineMap ?? parsed?.lineMap,
        includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations
      });
    }
  };
}
