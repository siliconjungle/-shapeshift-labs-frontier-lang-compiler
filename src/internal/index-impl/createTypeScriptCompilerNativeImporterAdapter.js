import{uniqueStrings}from'../../native-import-utils.js';import{createTypeScriptSourceFile}from'../../native-js-ts-importers.js';
import{createNativeImportFromTypeScriptAst}from'./createNativeImportFromTypeScriptAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';
export function createTypeScriptCompilerNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.typescript-compiler-native-importer',
    language: options.language ?? 'typescript',
    parser: options.parser ?? 'typescript-compiler-api',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', 'tokens', 'trivia', 'parserTriviaExactness', 'compilerSymbolFacts', 'compilerTypeFacts', 'compilerReferenceGraph', ...(options.capabilities ?? [])]),
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
        'Normalizes a caller-owned TypeScript SourceFile into native AST nodes and declaration-level semantic index records.',
        'When the compiler scanner is available, SourceFile token/trivia spans become exact source-preservation evidence.',
        'When a TypeScript checker is supplied, declaration records carry compiler symbol/type facts and reference relations for merge evidence.',
        'Full reference resolution, control flow, and generated ranges require additional host-supplied adapter evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.ts', '.tsx', '.js', '.jsx'],
    diagnostics: options.diagnostics,
    parse(input) {
      const ts = options.typescript ?? options.ts ?? input.options?.typescript ?? input.options?.ts;
      const program = options.program ?? input.options?.program;
      const typeChecker = options.typeChecker ?? options.checker ?? input.options?.typeChecker ?? input.options?.checker ?? program?.getTypeChecker?.();
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
        program,
        typeChecker,
        maxNodes: options.maxNodes,
        includeTokens: options.includeTokens,
        includeTrivia: options.includeTrivia,
        maxTokens: options.maxTokens,
        maxTrivia: options.maxTrivia,
        computedEnumRuntimeValueProofs: input.options?.computedEnumRuntimeValueProofs ?? options.computedEnumRuntimeValueProofs,
        computedEnumRuntimeValueProof: input.options?.computedEnumRuntimeValueProof ?? options.computedEnumRuntimeValueProof,
        computedEnumRuntimeValueProofProvider: input.options?.computedEnumRuntimeValueProofProvider ?? options.computedEnumRuntimeValueProofProvider,
        computedEnumRuntimeValueTraceProvider: input.options?.computedEnumRuntimeValueTraceProvider ?? options.computedEnumRuntimeValueTraceProvider,
        computedEnumRuntimeValueTraces: input.options?.computedEnumRuntimeValueTraces ?? options.computedEnumRuntimeValueTraces,
        adapterId: options.id ?? 'frontier.typescript-compiler-native-importer'
      });
    }
  };
}
