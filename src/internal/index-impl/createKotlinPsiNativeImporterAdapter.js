import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromKotlinPsi}from'./createNativeImportFromKotlinPsi.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{kotlinGeneratedSourcePath}from'./kotlinGeneratedSourcePath.js';import{kotlinPsiRoot}from'./kotlinPsiRoot.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';import{parseKotlinPsiSource}from'./parseKotlinPsiSource.js';
export function createKotlinPsiNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.kotlin-psi-native-importer',
    language: options.language ?? 'kotlin',
    parser: options.parser ?? 'kotlin-psi',
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
        'Normalizes caller-owned Kotlin PSI/KtFile-shaped syntax trees into native AST nodes and declaration-level semantic index records.',
        'Kotlin PSI imports do not resolve Analysis API symbols, FIR/K2 types, overloads, nullability flow, expect/actual matching, compiler-plugin generated declarations, KSP/KAPT output, scripts, build variants, or control flow by themselves; attach host evidence for those claims.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.kt', '.kts'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.ktFile
        ?? input.options?.file
        ?? input.options?.sourceFile
        ?? input.options?.root
        ?? options.ast
        ?? options.ktFile
        ?? options.file
        ?? options.sourceFile
        ?? options.root
        ?? parseKotlinPsiSource(input, options);
      const root = kotlinPsiRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'kotlin-psi',
          adapterId: options.id ?? 'frontier.kotlin-psi-native-importer',
          message: 'createKotlinPsiNativeImporterAdapter requires an injected Kotlin PSI KtFile-shaped object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics ?? parsed?.parseDiagnostics, input, {
        parser: options.parser ?? 'kotlin-psi'
      });
      return createNativeImportFromKotlinPsi(root, input, {
        parser: options.parser ?? 'kotlin-psi',
        astFormat: 'kotlin-psi',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        kotlinVersion: options.kotlinVersion ?? input.options?.kotlinVersion ?? parsed?.kotlinVersion,
        languageVersion: options.languageVersion ?? input.options?.languageVersion ?? parsed?.languageVersion,
        apiVersion: options.apiVersion ?? input.options?.apiVersion ?? parsed?.apiVersion,
        script: input.options?.script ?? options.script ?? parsed?.script ?? /\.kts$/i.test(input.sourcePath ?? ''),
        generated: input.options?.generated ?? options.generated ?? parsed?.generated ?? kotlinGeneratedSourcePath(input.sourcePath),
        analysisApiEvidence: input.options?.analysisApiEvidence ?? options.analysisApiEvidence ?? parsed?.analysisApiEvidence,
        firEvidence: input.options?.firEvidence ?? options.firEvidence ?? parsed?.firEvidence,
        compilerPluginEvidence: input.options?.compilerPluginEvidence ?? options.compilerPluginEvidence ?? parsed?.compilerPluginEvidence,
        kspEvidence: input.options?.kspEvidence ?? options.kspEvidence ?? parsed?.kspEvidence,
        kaptEvidence: input.options?.kaptEvidence ?? options.kaptEvidence ?? parsed?.kaptEvidence,
        multiplatformEvidence: input.options?.multiplatformEvidence ?? options.multiplatformEvidence ?? parsed?.multiplatformEvidence,
        buildVariantEvidence: input.options?.buildVariantEvidence ?? options.buildVariantEvidence ?? parsed?.buildVariantEvidence,
        positionResolver: input.options?.positionResolver ?? options.positionResolver,
        lineMap: input.options?.lineMap ?? options.lineMap ?? parsed?.lineMap,
        includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations
      });
    }
  };
}
