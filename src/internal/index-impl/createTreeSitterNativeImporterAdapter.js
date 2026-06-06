import{idFragment,uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromTreeSitter}from'./createNativeImportFromTreeSitter.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{parseTreeSitterSource}from'./parseTreeSitterSource.js';
export function createTreeSitterNativeImporterAdapter(options = {}) {
  const parserName = treeSitterParserName(options);
  return {
    id: options.id ?? `frontier.tree-sitter-${idFragment(options.language ?? 'source')}-native-importer`,
    language: options.language ?? 'source',
    parser: parserName,
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'nativeSyntaxEvidence', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'parser-tree',
      exactAst: true,
      tokens: false,
      trivia: false,
      diagnostics: true,
      sourceRanges: true,
      generatedRanges: false,
      semanticCoverage: {
        level: 'native-ast',
        declarations: false,
        symbols: false,
        references: false,
        types: false,
        controlFlow: false
      },
      notes: [
        'Normalizes a caller-owned tree-sitter tree into native CST syntax evidence and native AST nodes.',
        'Observed declaration symbols and source-map mappings are attached when recognizable declarations exist; syntax-only CST evidence is not semantic exactness.',
        'The built-in wrapper walks concrete children when available; exact token/trivia streams and generated ranges require adapter-specific evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? [],
    diagnostics: options.diagnostics,
    parse(input) {
      const tree = input.options?.tree ?? options.tree ?? parseTreeSitterSource(input, options);
      const root = tree?.rootNode ?? tree;
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: parserName,
          adapterId: options.id ?? `frontier.tree-sitter-${idFragment(options.language ?? input.language)}-native-importer`,
          message: 'createTreeSitterNativeImporterAdapter requires an injected tree-sitter parser/tree or adapterOptions.tree.'
        });
      }
      return createNativeImportFromTreeSitter(root, input, {
        parser: parserName,
        astFormat: 'tree-sitter',
        maxNodes: options.maxNodes
      });
    }
  };
}

function treeSitterParserName(options) {
  if (options.parserName) return String(options.parserName);
  if (typeof options.parser === 'string') return options.parser;
  return 'tree-sitter';
}
