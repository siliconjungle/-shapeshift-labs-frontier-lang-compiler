import {
  uniqueStrings
} from './native-import-utils.js';
import {
  HtmlCssNativeParserAstFormatProfileInputs
} from './native-parser-html-css-format-profiles.js';

export const NativeParserFeatureCategories = Object.freeze([
  'syntax',
  'semantic',
  'type',
  'controlFlow',
  'macroMetaprogramming',
  'sourcePreservation'
]);

export const NativeParserFeatureCoverageStatuses = Object.freeze([
  'full',
  'partial',
  'evidence-required',
  'missing',
  'blocked',
  'not-applicable'
]);


export const NativeParserAstFormatProfiles = Object.freeze([
  nativeParserAstFormatProfile('estree', {
    kind: 'abstract-ast',
    languages: ['javascript'],
    parserAdapters: ['estree'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'loc-range',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['Community JavaScript AST shape used by many JS tooling parsers.']
  }),
  nativeParserAstFormatProfile('babel', {
    kind: 'abstract-ast',
    languages: ['javascript', 'typescript'],
    parserAdapters: ['babel'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'loc-range',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: true,
    notes: ['Babel-compatible ESTree-like ASTs can report parser errors when error recovery is enabled.']
  }),
  nativeParserAstFormatProfile('typescript-compiler-api', {
    kind: 'compiler-ast',
    languages: ['typescript', 'javascript'],
    parserAdapters: ['typescript-compiler-api'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'pos-end',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: true,
    notes: ['TypeScript SourceFile trees can be parsed without a full Program; richer type/checker evidence remains host-owned.']
  }),
  ...HtmlCssNativeParserAstFormatProfileInputs.map(([id, input]) => nativeParserAstFormatProfile(id, input)),
  nativeParserAstFormatProfile('python-ast', {
    kind: 'abstract-ast',
    languages: ['python'],
    parserAdapters: ['python-ast'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'lineno-col-offset',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['Python stdlib AST exposes versioned abstract grammar and source locations, but not formatting trivia.']
  }),
  nativeParserAstFormatProfile('rust-syn', {
    aliases: ['syn'],
    kind: 'abstract-ast',
    languages: ['rust'],
    parserAdapters: ['syn', 'rust-syn'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'proc-macro2-span',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['syn parses Rust token streams into an abstract syntax tree; macro expansion, name resolution, type checking, and lossless trivia remain host-owned evidence.']
  }),
  nativeParserAstFormatProfile('rust-analyzer-rowan', {
    aliases: ['rowan', 'rust-analyzer'],
    kind: 'concrete-syntax-tree',
    languages: ['rust'],
    parserAdapters: ['rust-analyzer-rowan'],
    exactness: 'parser-tree',
    sourceRangeModel: 'text-range',
    preservesTokens: true,
    preservesTrivia: true,
    supportsIncremental: true,
    supportsErrorRecovery: true,
    notes: ['rust-analyzer uses rowan-backed concrete syntax trees with AST wrappers; semantic richness still depends on host analysis evidence.']
  }),
  nativeParserAstFormatProfile('clang-ast-json', {
    aliases: ['clang', 'libclang', 'clang-json', 'clang-ast-dump-json'],
    kind: 'compiler-ast',
    languages: ['c', 'cpp'],
    parserAdapters: ['clang', 'libclang', 'clang-ast-json'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'clang-loc-range',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['Clang JSON AST dumps expose compiler AST declarations and source ranges after preprocessing; compile commands, macros, inactive branches, type checking, and lossless formatting remain host-owned evidence.']
  }),
  nativeParserAstFormatProfile('go-ast', {
    aliases: ['go/parser', 'goast', 'golang-ast'],
    kind: 'compiler-ast',
    languages: ['go'],
    parserAdapters: ['go/ast', 'go/parser', 'go-ast'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'token-position',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: true,
    notes: ['Go go/ast trees expose parser syntax nodes and token positions; FileSet, build tags, generated-code classification, package loading, go/types, comments/trivia, and control-flow evidence remain host-owned.']
  }),
  nativeParserAstFormatProfile('java-ast', {
    aliases: ['javac', 'javac-tree', 'jdt', 'eclipse-jdt', 'javaparser', 'java-parser'],
    kind: 'compiler-ast',
    languages: ['java'],
    parserAdapters: ['javac', 'jdt', 'javaparser', 'java-ast'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'java-source-range',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: true,
    notes: ['Java compiler/parser ASTs expose package/import/type/member declarations and source ranges; classpath/module-path, bindings, annotation processors, generated sources, Lombok expansion, comments/trivia, and control-flow evidence remain host-owned.']
  }),
  nativeParserAstFormatProfile('kotlin-psi', {
    aliases: ['kotlin-compiler', 'kotlin-compiler-psi', 'intellij-psi', 'kt-psi', 'kotlin-ast'],
    kind: 'compiler-ast',
    languages: ['kotlin'],
    parserAdapters: ['kotlin-compiler', 'kotlin-psi', 'intellij-psi'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'text-range-line-column',
    preservesTokens: true,
    preservesTrivia: true,
    supportsErrorRecovery: true,
    notes: ['Kotlin PSI exposes source syntax and IntelliJ parser errors; Analysis API symbols, FIR/K2 types, expect/actual matching, compiler plugins, generated sources, scripts, and build variants remain host-owned evidence.']
  }),
  nativeParserAstFormatProfile('roslyn-csharp', {
    aliases: ['roslyn', 'csharp-roslyn', 'c#-roslyn', 'microsoft-codeanalysis-csharp', 'csharp-syntax'],
    kind: 'compiler-ast',
    languages: ['csharp'],
    parserAdapters: ['roslyn', 'microsoft.codeanalysis.csharp', 'csharp-roslyn'],
    exactness: 'exact-parser-ast',
    sourceRangeModel: 'text-span-line-position-span',
    preservesTokens: true,
    preservesTrivia: true,
    supportsIncremental: true,
    supportsErrorRecovery: true,
    notes: ['Roslyn C# syntax trees expose immutable nodes, tokens, trivia, spans, diagnostics, directives, and skipped text; SemanticModel symbols, nullable analysis, generated sources, partial type stitching, analyzer results, and project references remain host-owned evidence.']
  }),
  nativeParserAstFormatProfile('swift-syntax', {
    aliases: ['swiftsyntax', 'swiftparser', 'swift-parser', 'swift-syntax-json'],
    kind: 'concrete-syntax-tree',
    languages: ['swift'],
    parserAdapters: ['swift-syntax', 'swiftparser'],
    exactness: 'parser-tree',
    sourceRangeModel: 'absolute-position-source-location',
    preservesTokens: true,
    preservesTrivia: true,
    supportsIncremental: false,
    supportsErrorRecovery: true,
    notes: ['SwiftSyntax exposes a source-accurate syntax tree with missing/unexpected nodes and token/trivia structure; SourceKit symbols, macro expansion, conditional compilation branch resolution, type checking, generated sources, and package/module dependency resolution remain host-owned evidence.']
  }),
  nativeParserAstFormatProfile('tree-sitter', {
    kind: 'concrete-syntax-tree',
    languages: ['mixed'],
    parserAdapters: ['tree-sitter'],
    exactness: 'parser-tree',
    sourceRangeModel: 'row-column',
    preservesTokens: false,
    preservesTrivia: false,
    supportsIncremental: true,
    supportsErrorRecovery: true,
    notes: ['Tree-sitter provides cross-language concrete syntax trees; language-specific queries still decide semantic richness.']
  }),
  nativeParserAstFormatProfile('libcst', {
    kind: 'concrete-syntax-tree',
    languages: ['python'],
    parserAdapters: ['libcst'],
    exactness: 'parser-tree',
    sourceRangeModel: 'metadata-position-provider',
    preservesTokens: true,
    preservesTrivia: true,
    supportsErrorRecovery: false,
    notes: ['LibCST-style trees preserve formatting and are best treated as host-owned evidence until normalized explicitly.']
  }),
  nativeParserAstFormatProfile('scip', {
    kind: 'semantic-index',
    languages: ['mixed'],
    parserAdapters: ['scip'],
    exactness: 'loss-aware-native-ast',
    sourceRangeModel: 'range-tuples',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['SCIP is semantic index evidence rather than a full parser AST; it is useful for symbols/references and source maps.']
  }),
  nativeParserAstFormatProfile('lsif', {
    kind: 'semantic-index',
    languages: ['mixed'],
    parserAdapters: ['lsif'],
    exactness: 'loss-aware-native-ast',
    sourceRangeModel: 'lsp-ranges',
    preservesTokens: false,
    preservesTrivia: false,
    supportsErrorRecovery: false,
    notes: ['LSIF graph dumps are semantic/source-map evidence, not complete native ASTs.']
  })
]);

export const NativeParserAstFormats = Object.freeze(NativeParserAstFormatProfiles.map((profile) => profile.id));



export function nativeParserAstFormatProfile(id, input = {}) {
  return Object.freeze({
    id,
    aliases: Object.freeze(uniqueStrings(input.aliases ?? [])),
    kind: input.kind ?? 'abstract-ast',
    languages: Object.freeze(uniqueStrings(input.languages ?? [])),
    parserAdapters: Object.freeze(uniqueStrings(input.parserAdapters ?? [id])),
    exactness: input.exactness ?? 'unknown',
    sourceRangeModel: input.sourceRangeModel ?? 'unknown',
    preservesTokens: Boolean(input.preservesTokens),
    preservesTrivia: Boolean(input.preservesTrivia),
    supportsIncremental: Boolean(input.supportsIncremental),
    supportsErrorRecovery: Boolean(input.supportsErrorRecovery),
    notes: Object.freeze(uniqueStrings(input.notes ?? []))
  });
}

export function normalizeParserAstFormatId(format) {
  return String(format ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}


export function parserAstFormatIdForParser(parser) {
  const text = normalizeParserAstFormatId(parser);
  if (text.includes('typescript')) return 'typescript-compiler-api';
  if (text.includes('parse5')) return 'parse5';
  if (text.includes('htmlparser') || text.includes('domhandler')) return 'htmlparser2';
  if (text.includes('rehype') || text === 'hast' || text.includes('unified-rehype')) return 'rehype';
  if (text.includes('tree-sitter-html') || text.includes('treesitter-html')) return 'tree-sitter-html';
  if (text.includes('postcss')) return 'postcss';
  if (text.includes('csstree') || text.includes('css-tree')) return 'csstree';
  if (text.includes('lightningcss') || text.includes('lightning-css')) return 'lightningcss';
  if (text.includes('tree-sitter-css') || text.includes('treesitter-css')) return 'tree-sitter-css';
  if (text.includes('python') && text.includes('ast')) return 'python-ast';
  if (text === 'syn' || text.includes('rust-syn')) return 'rust-syn';
  if (text.includes('rust-analyzer') || text.includes('rowan')) return 'rust-analyzer-rowan';
  if (text.includes('clang') || text.includes('libclang')) return 'clang-ast-json';
  if (text === 'go' || text.includes('go-parser') || text.includes('go-ast') || text.includes('go/parser') || text.includes('go/ast')) return 'go-ast';
  if (text === 'java' || text.includes('javac') || text.includes('jdt') || text.includes('javaparser') || text.includes('java-parser') || text.includes('java-ast')) return 'java-ast';
  if (text === 'kotlin' || text === 'kt' || text.includes('kotlin-psi') || text.includes('kotlin-compiler') || text.includes('intellij-psi') || text.includes('kt-psi')) return 'kotlin-psi';
  if (text === 'csharp' || text === 'c#' || text === 'cs' || text.includes('roslyn') || text.includes('microsoft-codeanalysis-csharp') || text.includes('csharp-syntax')) return 'roslyn-csharp';
  if (text.includes('swift-syntax') || text.includes('swiftsyntax') || text.includes('swiftparser') || text.includes('swift-parser')) return 'swift-syntax';
  if (text.includes('tree-sitter') || text.includes('treesitter')) return 'tree-sitter';
  if (text.includes('babel')) return 'babel';
  if (text.includes('estree')) return 'estree';
  if (text.includes('libcst')) return 'libcst';
  if (text.includes('scip')) return 'scip';
  if (text.includes('lsif')) return 'lsif';
  return text || 'unknown';
}

export function parserAstFormatIdForImport(imported) {
  return parserAstFormatIdForParser(
    imported?.metadata?.adapter?.parser
      ?? imported?.metadata?.astFormat
      ?? imported?.nativeAst?.metadata?.astFormat
      ?? imported?.nativeAst?.parser
      ?? imported?.parser
      ?? imported?.metadata?.parser
  );
}
