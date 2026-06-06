import {
  createDocument,
  createImportResult,
  createNativeAstRecord,
  createPatch,
  createSemanticIndexRecord,
  createSemanticMergeCandidateRecord,
  createSourceMapRecord,
  createSourcePreservationRecord,
  createUniversalAstEnvelope,
  explainSourcePreservation,
  hashDocumentBase,
  hashSemanticValue,
  nativeSourceNode,
  stableUniversalAstJson,
  validateSourceMapRecord,
  validateUniversalAstEnvelope
} from '@shapeshift-labs/frontier-lang-kernel';
import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { checkDocument } from '@shapeshift-labs/frontier-lang-checker';
import { renderTypeScriptAst, renderTypeScriptAstWithSourceMap, toTypeScriptAst } from '@shapeshift-labs/frontier-lang-typescript';
import { renderJavaScriptAst, renderJavaScriptAstWithSourceMap, toJavaScriptAst } from '@shapeshift-labs/frontier-lang-javascript';
import { renderRustAst, renderRustAstWithSourceMap, toRustAst } from '@shapeshift-labs/frontier-lang-rust';
import { renderPythonAst, renderPythonAstWithSourceMap, toPythonAst } from '@shapeshift-labs/frontier-lang-python';
import { renderCAst, renderCAstWithSourceMap, toCAst } from '@shapeshift-labs/frontier-lang-c';

export const FrontierCompileTargets = Object.freeze([
  'typescript',
  'javascript',
  'rust',
  'python',
  'c'
]);

const projectors = Object.freeze({
  typescript: toTypeScriptAst,
  javascript: toJavaScriptAst,
  rust: toRustAst,
  python: toPythonAst,
  c: toCAst
});

const renderers = Object.freeze({
  typescript: renderTypeScriptAst,
  javascript: renderJavaScriptAst,
  rust: renderRustAst,
  python: renderPythonAst,
  c: renderCAst
});

const sourceMapRenderers = Object.freeze({
  typescript: renderTypeScriptAstWithSourceMap,
  javascript: renderJavaScriptAstWithSourceMap,
  rust: renderRustAstWithSourceMap,
  python: renderPythonAstWithSourceMap,
  c: renderCAstWithSourceMap
});

const canonicalTargets = Object.freeze({
  ts: 'typescript',
  js: 'javascript',
  rs: 'rust',
  py: 'python',
  h: 'c'
});

const lossSeverityRank = Object.freeze({
  none: 0,
  info: 1,
  warning: 2,
  error: 3
});

const semanticMergeReadinessRank = Object.freeze({
  ready: 0,
  'ready-with-losses': 1,
  'needs-review': 2,
  blocked: 3
});

const nativeFeatureEvidenceRiskRank = Object.freeze({
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
});

export const NativeImportRoundtripReadinessStatuses = Object.freeze([
  'exact',
  'preserved-source',
  'stub-only',
  'blocked',
  'needs-review'
]);

export const NativeImportTaxonomyKinds = Object.freeze([
  'exactAstImport',
  'declarationsOnly',
  'opaqueBodies',
  'macroExpansion',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'generatedCode',
  'overloadTypeInference',
  'sourcePreservation',
  'commentsTrivia',
  'parserDiagnostics',
  'unsupportedSyntax',
  'partialSemanticIndex',
  'sourceMapApproximation',
  'targetProjectionLoss'
]);

export const NativeImportLossKinds = Object.freeze([
  'declarationOnlyCoverage',
  'opaqueNative',
  'macroExpansion',
  'macroHygiene',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'dynamicRuntime',
  'dynamicDispatch',
  'generatedCode',
  'overloadResolution',
  'typeInference',
  'sourcePreservation',
  'commentsTrivia',
  'parserDiagnostic',
  'unsupportedSyntax',
  'unsupportedSemantic',
  'unverifiedNativeAst',
  'partialSemanticIndex',
  'sourceMapApproximation',
  'targetProjectionLoss'
]);

export const NativeImportReadinessBySeverity = Object.freeze({
  none: 'ready',
  info: 'ready-with-losses',
  warning: 'needs-review',
  error: 'blocked'
});

export const NativeImportFeatureEvidencePolicies = Object.freeze({
  macroExpansion: nativeImportFeatureEvidencePolicy('macroExpansion', {
    category: 'macroExpansion',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['macroDefinitionsHash', 'expandedSourceHash'],
    recommendedEvidenceKeys: ['expansionMapId', 'sourceMapId', 'macroCallSites'],
    notes: ['Macro-expanded code must retain a link from generated output back to macro call sites before semantic merges can be trusted.']
  }),
  macroHygiene: nativeImportFeatureEvidencePolicy('macroHygiene', {
    category: 'macroExpansion',
    risk: 'critical',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['hygieneContextHash', 'bindingMapId'],
    recommendedEvidenceKeys: ['expansionMapId', 'captureSetHash'],
    notes: ['Hygiene-sensitive macros can change binding identity even when emitted text looks equivalent.']
  }),
  preprocessor: nativeImportFeatureEvidencePolicy('preprocessor', {
    category: 'preprocessor',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['preprocessedOutputHash', 'definesHash'],
    recommendedEvidenceKeys: ['includeGraphHash', 'conditionalBranches', 'sourceMapId'],
    notes: ['Preprocessor imports need the active defines/includes and preprocessed output hash to make replayable claims.']
  }),
  conditionalCompilation: nativeImportFeatureEvidencePolicy('conditionalCompilation', {
    category: 'conditionalCompilation',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['activeBranches', 'inactiveBranchesHash'],
    recommendedEvidenceKeys: ['compileTarget', 'featureFlags', 'preprocessedOutputHash'],
    notes: ['Conditional branches that were not active still affect portability and conflict review.']
  }),
  metaprogramming: nativeImportFeatureEvidencePolicy('metaprogramming', {
    category: 'metaprogramming',
    risk: 'critical',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['generatedArtifactHash', 'generatorIdentity'],
    recommendedEvidenceKeys: ['generatorInputsHash', 'generatedRanges', 'replayCommand'],
    notes: ['Generated or metaprogrammed declarations need replayable generator identity and input evidence.']
  }),
  reflection: nativeImportFeatureEvidencePolicy('reflection', {
    category: 'reflection',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['reflectionSurface', 'runtimeContract'],
    recommendedEvidenceKeys: ['observedMembers', 'fixtureIds', 'runtimeVersion'],
    notes: ['Reflection-heavy code needs a declared runtime contract because static AST evidence is incomplete.']
  }),
  dynamicRuntime: nativeImportFeatureEvidencePolicy('dynamicRuntime', {
    category: 'reflection',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['runtimeContract'],
    recommendedEvidenceKeys: ['fixtureIds', 'observedEffects', 'runtimeVersion'],
    notes: ['Dynamic runtime behavior should stay review-required until fixtures or traces describe the observed contract.']
  }),
  dynamicDispatch: nativeImportFeatureEvidencePolicy('dynamicDispatch', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['dispatchTargets'],
    recommendedEvidenceKeys: ['callGraphId', 'typeEvidenceId', 'fixtureIds'],
    notes: ['Dynamic dispatch needs candidate target evidence before call graph or porting claims are merge-ready.']
  }),
  generatedCode: nativeImportFeatureEvidencePolicy('generatedCode', {
    category: 'generatedCode',
    risk: 'high',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['generatedArtifactHash', 'generatedRanges'],
    recommendedEvidenceKeys: ['generatorIdentity', 'generatorInputsHash', 'sourceMapId'],
    notes: ['Generated code must preserve generated ranges and artifact hashes so workers can avoid editing derived output blindly.']
  }),
  overloadResolution: nativeImportFeatureEvidencePolicy('overloadResolution', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['resolvedOverloads'],
    recommendedEvidenceKeys: ['typeEvidenceId', 'compilerVersion', 'callSiteSpans'],
    notes: ['Overload-sensitive imports should record compiler/type evidence for each call site.']
  }),
  typeInference: nativeImportFeatureEvidencePolicy('typeInference', {
    category: 'overloadTypeInference',
    risk: 'medium',
    minimumReadiness: 'needs-review',
    requiredEvidenceKeys: ['inferredTypesHash'],
    recommendedEvidenceKeys: ['typeEvidenceId', 'compilerVersion', 'symbolTableHash'],
    notes: ['Inferred types need a stable type-evidence hash before cross-language projection can claim fidelity.']
  }),
  unsupportedSyntax: nativeImportFeatureEvidencePolicy('unsupportedSyntax', {
    category: 'unsupportedSyntax',
    risk: 'high',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['unsupportedSyntaxKind', 'sourceSpan'],
    recommendedEvidenceKeys: ['parserDiagnosticId', 'nativeAstNodeId', 'sourceSnippetHash'],
    notes: ['Unsupported syntax must remain anchored to source spans and parser diagnostics for later adapter work.']
  }),
  unsupportedSemantic: nativeImportFeatureEvidencePolicy('unsupportedSemantic', {
    category: 'unsupportedSyntax',
    risk: 'high',
    minimumReadiness: 'needs-review',
    missingEvidenceReadiness: 'blocked',
    requiredEvidenceKeys: ['unsupportedSemanticKind', 'semanticSymbolId'],
    recommendedEvidenceKeys: ['semanticIndexId', 'sourceMapId', 'reason'],
    notes: ['Unsupported semantics should name the affected symbol so merge tools can isolate the unsafe region.']
  })
});

export const NativeImportRegionTaxonomyKinds = Object.freeze([
  'symbol',
  'declaration',
  'import',
  'body',
  'call',
  'type',
  'effect',
  'property',
  'config',
  'content',
  'route',
  'generatedOutput'
]);

export const ProjectionTargetLossClasses = Object.freeze([
  'exactSourceProjection',
  'nativeSourceStubs',
  'unsupportedTargetFeatures',
  'targetAdapterProjection',
  'missingAdapter'
]);

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

export const NativeImportLanguageProfiles = Object.freeze([
  nativeImportLanguageProfile('javascript', {
    aliases: ['js', 'mjs', 'cjs', 'jsx'],
    extensions: ['.js', '.mjs', '.cjs', '.jsx'],
    parserAdapters: ['estree', 'babel', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'dynamicRuntime']
  }),
  nativeImportLanguageProfile('typescript', {
    aliases: ['ts', 'tsx'],
    extensions: ['.ts', '.tsx'],
    parserAdapters: ['typescript-compiler-api', 'babel', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'unsupportedSyntax']
  }),
  nativeImportLanguageProfile('python', {
    aliases: ['py'],
    extensions: ['.py', '.pyi'],
    parserAdapters: ['python-ast', 'libcst', 'parso', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'dynamicRuntime']
  }),
  nativeImportLanguageProfile('rust', {
    aliases: ['rs'],
    extensions: ['.rs'],
    parserAdapters: ['syn', 'rust-analyzer-rowan', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'macroExpansion', 'sourceMapApproximation', 'sourcePreservation']
  }),
  nativeImportLanguageProfile('c', {
    aliases: ['h'],
    extensions: ['.c', '.h'],
    parserAdapters: ['clang', 'libclang', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'preprocessor', 'sourceMapApproximation', 'sourcePreservation']
  }),
  nativeImportLanguageProfile('cpp', {
    aliases: ['c++', 'cc', 'cxx', 'hpp'],
    extensions: ['.cc', '.cpp', '.cxx', '.hpp', '.hh'],
    parserAdapters: ['clang', 'libclang', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'preprocessor', 'metaprogramming', 'sourceMapApproximation', 'sourcePreservation']
  }),
  nativeImportLanguageProfile('java', { extensions: ['.java'], parserAdapters: ['javac', 'jdt', 'javaparser', 'tree-sitter'] }),
  nativeImportLanguageProfile('go', { extensions: ['.go'], parserAdapters: ['go/parser', 'tree-sitter'] }),
  nativeImportLanguageProfile('swift', { extensions: ['.swift'], parserAdapters: ['swift-syntax', 'tree-sitter'] }),
  nativeImportLanguageProfile('csharp', { aliases: ['c#', 'cs'], extensions: ['.cs'], parserAdapters: ['roslyn', 'tree-sitter'] }),
  nativeImportLanguageProfile('php', { extensions: ['.php'], parserAdapters: ['php-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'metaprogramming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('ruby', { aliases: ['rb'], extensions: ['.rb', '.rake'], parserAdapters: ['prism', 'ripper', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'metaprogramming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('kotlin', { aliases: ['kt', 'kts'], extensions: ['.kt', '.kts'], parserAdapters: ['kotlin-compiler', 'intellij-psi', 'tree-sitter'] }),
  nativeImportLanguageProfile('scala', { aliases: ['sc'], extensions: ['.scala', '.sc'], parserAdapters: ['scala-compiler', 'scalameta', 'tree-sitter'] }),
  nativeImportLanguageProfile('dart', { extensions: ['.dart'], parserAdapters: ['dart-analyzer', 'tree-sitter'] }),
  nativeImportLanguageProfile('lua', { extensions: ['.lua'], parserAdapters: ['luaparse', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dynamicRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('shell', { aliases: ['sh', 'bash', 'zsh'], extensions: ['.sh', '.bash', '.zsh'], parserAdapters: ['bash-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dynamicRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('sql', { aliases: ['postgresql', 'postgres', 'mysql', 'sqlite'], extensions: ['.sql'], parserAdapters: ['sqlparser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'unsupportedSyntax', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('zig', { extensions: ['.zig'], parserAdapters: ['zig-ast', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'generatedCode', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('elixir', { aliases: ['ex', 'exs'], extensions: ['.ex', '.exs'], parserAdapters: ['elixir-quoted', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'macroExpansion', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('erlang', { aliases: ['erl', 'hrl'], extensions: ['.erl', '.hrl'], parserAdapters: ['erl_parse', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'preprocessor', 'macroExpansion', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('haskell', { aliases: ['hs'], extensions: ['.hs', '.lhs'], parserAdapters: ['ghc-api', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'macroExpansion', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('r', { aliases: ['R'], extensions: ['.r', '.R'], parserAdapters: ['r-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dynamicRuntime', 'sourceMapApproximation', 'sourcePreservation'] })
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

export const ExternalSemanticIndexFormats = Object.freeze([
  'frontier-semantic-index',
  'scip',
  'lsif',
  'lsp',
  'semanticdb'
]);

export function normalizeCompileTarget(target) {
  const normalized = String(target ?? 'typescript').toLowerCase();
  const canonical = canonicalTargets[normalized] ?? normalized;
  if (!FrontierCompileTargets.includes(canonical)) {
    throw new Error(`Unknown Frontier compile target: ${target}`);
  }
  return canonical;
}

export function compileFrontierSource(source, options = {}) {
  const document = options.fileName
    ? parseFrontierFile(options.fileName, source)
    : parseFrontierSource(source, options.parse);
  return compileFrontierDocument(document, options);
}

export function compileFrontierDocument(document, options = {}) {
  const target = normalizeCompileTarget(options.target);
  const check = checkDocument(document, options.check ?? {});
  const hash = hashDocumentBase(document);
  if (!check.ok && options.emitOnError !== true) {
    return {
      ok: false,
      target,
      hash,
      document,
      diagnostics: check.diagnostics,
      ast: undefined,
      output: ''
    };
  }
  const ast = projectFrontierAst(document, target, options.emit ?? {});
  return {
    ok: check.ok,
    target,
    hash,
    document,
    diagnostics: check.diagnostics,
    ast,
    output: renderTargetAst(ast, target)
  };
}

export function compileNativeSource(input, options = {}) {
  const importResult = isNativeSourceImportResult(input) ? input : importNativeSource(input);
  const sourceLanguage = nativeCompileSourceLanguage(importResult, input);
  const target = nativeCompileTarget(input, importResult, options);
  const sourceTarget = nativeLanguageCompileTarget(sourceLanguage);
  const sameSourceTarget = sourceTarget === target;
  const idPart = idFragment(options.id ?? importResult.id ?? importResult.sourcePath ?? sourceLanguage ?? target);
  const id = options.id ?? `native_source_compile_${idPart}_${idFragment(target)}`;
  const projection = projectNativeImportToSource(importResult, {
    ...options,
    id: options.projectionId ?? `${id}_projection`,
    language: sameSourceTarget ? sourceLanguage : target,
    preferPreservedSource: sameSourceTarget ? options.preferPreservedSource : false,
    evidenceId: options.projectionEvidenceId ?? options.evidenceId,
    metadata: {
      sourceLanguage,
      target,
      nativeCompileResultId: id,
      ...options.metadata
    }
  });
  const projectionMatrix = createProjectionTargetLossMatrix({
    imports: [importResult],
    adapters: options.adapters,
    targetAdapters: options.targetAdapters,
    languages: options.languages,
    targets: [target],
    generatedAt: options.generatedAt
  });
  const targetCoverage = nativeSourceCompileTargetCoverage(projectionMatrix, sourceLanguage, target);
  const targetAdapter = resolveNativeTargetProjectionAdapter({
    importResult,
    sourceProjection: projection,
    sourceLanguage,
    target,
    sourcePath: importResult.sourcePath ?? importResult.nativeSource?.sourcePath,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser
  }, options);
  const targetProjection = targetAdapter
    ? runNativeTargetProjectionAdapter(targetAdapter, {
      importResult,
      sourceProjection: projection,
      sourceLanguage,
      target,
      targetPath: options.targetPath,
      targetCoverage,
      options: options.targetAdapterOptions ?? {},
      metadata: {
        nativeCompileResultId: id,
        sourceLanguage,
        target,
        projectionId: projection.id,
        ...options.targetAdapterMetadata
      }
    })
    : undefined;
  const targetLosses = nativeSourceCompileTargetLosses({
    importResult,
    projection,
    targetCoverage,
    sourceLanguage,
    target,
    idPart
  });
  const output = targetProjection?.output ?? projection.sourceText;
  const outputHash = targetProjection?.outputHash ?? projection.outputHash;
  const outputMode = targetProjection ? targetProjection.outputMode : sameSourceTarget ? projection.mode : 'target-stubs';
  const compileEvidence = nativeSourceCompileEvidence({
    id: options.compileEvidenceId ?? `evidence_${idPart}_${idFragment(target)}_native_source_compile`,
    importResult,
    projection,
    targetProjection,
    targetCoverage,
    targetLosses,
    sourceLanguage,
    target,
    outputHash,
    outputMode
  });
  const evidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...(projection.evidence ?? []),
    ...(targetProjection?.evidence ?? []),
    compileEvidence,
    ...(options.evidence ?? [])
  ]);
  const losses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...(projection.losses ?? []),
    ...(targetProjection?.losses ?? []),
    ...targetLosses,
    ...(options.losses ?? [])
  ]);
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser,
    scanKind: 'native-source-compile',
    semanticStatus: importResult.metadata?.semanticStatus ?? options.semanticStatus
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: importResult.nativeAst?.parser ?? importResult.nativeSource?.parser ?? options.parser,
    scanKind: 'native-source-compile',
    semanticStatus: importResult.metadata?.semanticStatus ?? options.semanticStatus
  });
  const sourceMaps = options.emitSourceMap === false
    ? []
    : nativeSourceCompileSourceMaps({
      id: options.sourceMapId ?? `source_map_${idFragment(id)}_${idFragment(target)}`,
      importResult,
      projection,
      targetProjection,
      sourceLanguage,
      target,
      targetPath: options.targetPath ?? targetProjection?.targetPath,
      targetHash: options.targetHash ?? outputHash,
      output,
      outputHash,
      outputMode,
      evidence,
      losses,
      compileResultId: id
    });
  const sourceMap = sourceMaps[0];
  return {
    kind: 'frontier.lang.nativeSourceCompileResult',
    version: 1,
    id,
    ok: readiness.readiness !== 'blocked' || options.emitOnBlocked === true,
    target,
    language: sourceLanguage,
    sourcePath: importResult.sourcePath ?? importResult.nativeSource?.sourcePath,
    output,
    outputHash,
    outputMode,
    sourceMap,
    sourceMaps,
    importResult,
    projection,
    targetProjection,
    targetCoverage,
    projectionMatrix,
    losses,
    lossSummary,
    readiness,
    evidence,
    metadata: {
      nativeImportId: importResult.id,
      nativeSourceId: importResult.nativeSource?.id,
      nativeAstId: importResult.nativeAst?.id ?? importResult.nativeSource?.ast?.id,
      semanticIndexId: importResult.semanticIndex?.id ?? importResult.universalAst?.semanticIndex?.id,
      universalAstId: importResult.universalAst?.id,
      projectionId: projection.id,
      targetProjectionId: targetProjection?.id,
      targetProjectionAdapterId: targetProjection?.adapter?.id,
      sourceMapId: sourceMap?.id,
      sourceMapIds: sourceMaps.map((record) => record.id).filter(Boolean),
      sourceMapMappings: sourceMaps.reduce((sum, record) => sum + (record.mappings?.length ?? 0), 0),
      projectionMode: projection.mode,
      outputMode,
      targetPath: sourceMap?.targetPath ?? options.targetPath ?? targetProjection?.targetPath,
      targetHash: sourceMap?.targetHash ?? options.targetHash ?? outputHash,
      sourceTarget,
      sameSourceTarget,
      targetLossClass: targetCoverage.lossClass,
      targetReadiness: targetCoverage.readiness,
      targetSupported: targetCoverage.supported,
      ...options.metadata
    }
  };
}

export function importExternalSemanticIndex(input) {
  const payload = input?.payload ?? input?.semanticIndex ?? input;
  if (!payload || typeof payload !== 'object') {
    throw new Error('importExternalSemanticIndex requires a payload object');
  }
  const format = normalizeExternalSemanticIndexFormat(input?.format ?? inferExternalSemanticIndexFormat(payload));
  const idPart = idFragment(input?.id ?? input?.sourcePath ?? input?.projectRoot ?? format);
  const context = {
    format,
    idPart,
    language: normalizeExternalSemanticLanguage(input?.language ?? payload.language ?? payload.languageId),
    sourcePath: input?.sourcePath ?? payload.sourcePath ?? payload.uri ?? payload.path,
    sourceHash: input?.sourceHash ?? payload.sourceHash ?? payload.md5,
    projectRoot: input?.projectRoot ?? payload.projectRoot ?? payload.project_root ?? payload.metadata?.projectRoot ?? payload.metadata?.project_root,
    parser: input?.parser ?? `${format}.external-semantic-index`,
    metadata: input?.metadata ?? {}
  };
  const normalized = normalizeExternalSemanticIndexPayload(payload, context);
  const evidence = attachNativeImportLossSummary(
    uniqueByEvidenceId([...(normalized.evidence ?? []), ...(input?.evidence ?? [])]),
    summarizeNativeImportLosses(normalized.losses ?? [], {
      evidence: [...(normalized.evidence ?? []), ...(input?.evidence ?? [])],
      parser: context.parser,
      scanKind: 'external-semantic-index',
      semanticStatus: normalized.semanticStatus
    })
  );
  const losses = normalizeNativeLossRecords(normalized.losses ?? []);
  const semanticIndex = createSemanticIndexRecord({
    id: input?.semanticIndexId ?? normalized.semanticIndexId ?? `index_${idPart}_${idFragment(format)}`,
    repository: normalized.repository,
    documents: normalized.documents,
    symbols: normalized.symbols,
    occurrences: normalized.occurrences,
    relations: normalized.relations,
    facts: normalized.facts,
    evidence,
    metadata: {
      format,
      parser: context.parser,
      source: 'external-semantic-index',
      projectRoot: context.projectRoot,
      semanticStatus: normalized.semanticStatus,
      ...normalized.metadata,
      ...context.metadata
    }
  });
  const sourceMapMappings = externalSemanticSourceMapMappings(semanticIndex, {
    evidence,
    losses,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash
  });
  const sourceMaps = sourceMapMappings.length
    ? [createSourceMapRecord({
      id: input?.sourceMapId ?? `source_map_${idPart}_${idFragment(format)}`,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      semanticIndexId: semanticIndex.id,
      mappings: sourceMapMappings,
      evidence,
      metadata: {
        format,
        source: 'external-semantic-index',
        projectRoot: context.projectRoot
      }
    })]
    : [];
  const document = createDocument({
    id: input?.documentId ?? `document_${idPart}_${idFragment(format)}`,
    name: input?.documentName ?? context.sourcePath ?? `${format} semantic index`,
    nodes: [],
    rootIds: [],
    metadata: {
      sourceLanguage: context.language,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      semanticStatus: normalized.semanticStatus,
      externalSemanticIndexFormat: format
    }
  });
  const universalAst = createUniversalAstEnvelope({
    id: input?.universalAstId ?? `universal_ast_${idPart}_${idFragment(format)}`,
    document,
    nativeSources: [],
    semanticIndex,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      sourceLanguage: context.language,
      sourcePath: context.sourcePath,
      sourceHash: context.sourceHash,
      projectRoot: context.projectRoot,
      externalSemanticIndexFormat: format,
      semanticStatus: normalized.semanticStatus,
      ...input?.universalAstMetadata
    }
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'external-semantic-index',
    semanticStatus: normalized.semanticStatus
  });
  return {
    kind: 'frontier.lang.externalSemanticIndexImport',
    version: 1,
    id: input?.id ?? `external_semantic_index_${idPart}_${idFragment(format)}`,
    format,
    language: context.language,
    sourcePath: context.sourcePath,
    projectRoot: context.projectRoot,
    semanticIndex,
    universalAst,
    sourceMaps,
    losses,
    evidence,
    readiness,
    summary: {
      documents: semanticIndex.documents.length,
      symbols: semanticIndex.symbols.length,
      occurrences: semanticIndex.occurrences.length,
      relations: semanticIndex.relations.length,
      facts: semanticIndex.facts.length,
      sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap.mappings?.length ?? 0), 0),
      losses: losses.length,
      readiness: readiness.readiness
    },
    metadata: {
      format,
      parser: context.parser,
      semanticStatus: normalized.semanticStatus,
      payloadHash: hashSemanticValue(payload),
      ...normalized.metadata,
      ...context.metadata
    }
  };
}

function normalizeExternalSemanticIndexFormat(format) {
  const normalized = String(format ?? 'frontier-semantic-index').trim().toLowerCase();
  const aliases = {
    frontier: 'frontier-semantic-index',
    'frontier.semantic-index': 'frontier-semantic-index',
    'frontier.lang.semanticindex': 'frontier-semantic-index',
    scipindex: 'scip',
    'sourcegraph-scip': 'scip',
    lsp: 'lsp',
    'language-server-protocol': 'lsp',
    semanticdb: 'semanticdb',
    'scala-semanticdb': 'semanticdb'
  };
  return aliases[normalized] ?? normalized;
}

function inferExternalSemanticIndexFormat(payload) {
  if (payload.kind === 'frontier.lang.semanticIndex') return 'frontier-semantic-index';
  if (Array.isArray(payload) && payload.some((entry) => entry?.type === 'vertex' || entry?.type === 'edge')) return 'lsif';
  if (Array.isArray(payload.vertices) || Array.isArray(payload.edges)) return 'lsif';
  if (Array.isArray(payload.documents) && payload.documents.some((document) => document?.relative_path ?? document?.relativePath)) return 'scip';
  if (payload.metadata?.project_root || payload.metadata?.projectRoot || payload.external_symbols || payload.externalSymbols) return 'scip';
  if (Array.isArray(payload.documents) && payload.documents.some((document) => document?.symbols && document?.occurrences && (document?.uri || document?.md5 || document?.schema))) return 'semanticdb';
  if (Array.isArray(payload.documentSymbols) || Array.isArray(payload.symbols) || payload.semanticTokens || payload.location || payload.range) return 'lsp';
  return 'frontier-semantic-index';
}

function normalizeExternalSemanticIndexPayload(payload, context) {
  if (context.format === 'frontier-semantic-index') return normalizeFrontierSemanticIndexPayload(payload, context);
  if (context.format === 'scip') return normalizeScipPayload(payload, context);
  if (context.format === 'lsif') return normalizeLsifPayload(payload, context);
  if (context.format === 'lsp') return normalizeLspPayload(payload, context);
  if (context.format === 'semanticdb') return normalizeSemanticDbPayload(payload, context);
  return normalizeGenericExternalSemanticIndexPayload(payload, context);
}

function externalSemanticBase(context, metadata = {}) {
  return {
    repository: context.projectRoot ? { root: context.projectRoot } : undefined,
    documents: [],
    symbols: [],
    occurrences: [],
    relations: [],
    facts: [],
    evidence: [externalSemanticEvidence(context, 'passed', `Imported ${context.format} semantic index payload.`)],
    losses: [externalSemanticCoverageLoss(context)],
    semanticStatus: 'external-semantic-index',
    metadata
  };
}

function normalizeFrontierSemanticIndexPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: payload.kind ?? 'frontier.lang.semanticIndex' });
  result.repository = payload.repository ?? result.repository;
  result.documents = normalizeArray(payload.documents).map((document, index) => externalDocument(document, context, index));
  result.symbols = normalizeArray(payload.symbols).map((symbol, index) => externalSymbol(symbol, context, index));
  result.occurrences = normalizeArray(payload.occurrences).map((occurrence, index) => externalOccurrence(occurrence, context, index));
  result.relations = normalizeArray(payload.relations).map((relation, index) => externalRelation(relation, context, index));
  result.facts = normalizeArray(payload.facts).map((fact, index) => externalFact(fact, context, index));
  result.evidence = uniqueByEvidenceId([...(payload.evidence ?? []), ...result.evidence]);
  if (payload.metadata) result.metadata = { ...result.metadata, ...payload.metadata };
  return withExternalEmptyLoss(result, context);
}

function normalizeScipPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'scip' });
  const metadata = payload.metadata ?? {};
  const projectRoot = context.projectRoot ?? metadata.project_root ?? metadata.projectRoot;
  result.repository = projectRoot ? { root: projectRoot } : undefined;
  const documents = normalizeArray(payload.documents);
  for (const [documentIndex, document] of documents.entries()) {
    const path = document.relative_path ?? document.relativePath ?? document.path ?? context.sourcePath ?? `scip-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.language ?? context.language);
    const documentId = document.id ?? `doc_${idFragment(path)}`;
    result.documents.push({
      id: documentId,
      path,
      language,
      sourceHash: document.sourceHash ?? document.md5 ?? context.sourceHash,
      metadata: {
        format: 'scip',
        projectRoot,
        textDocumentEncoding: metadata.text_document_encoding ?? metadata.textDocumentEncoding,
        documentIndex
      }
    });
    const documentSymbols = new Map();
    for (const symbolInfo of [...normalizeArray(document.symbols), ...normalizeArray(payload.external_symbols ?? payload.externalSymbols)]) {
      const symbolId = scipSymbolId(symbolInfo.symbol, context, normalizeArray(document.symbols).includes(symbolInfo) ? documentId : undefined);
      if (!symbolId || documentSymbols.has(symbolId)) continue;
      documentSymbols.set(symbolId, true);
      result.symbols.push({
        id: symbolId,
        scheme: 'scip',
        name: symbolInfo.display_name ?? symbolInfo.displayName ?? nameFromExternalSymbol(symbolInfo.symbol),
        kind: normalizeExternalSymbolKind(symbolInfo.kind),
        language,
        signatureHash: hashSemanticValue([symbolInfo.symbol, symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation]),
        metadata: {
          format: 'scip',
          rawSymbol: symbolInfo.symbol,
          documentation: symbolInfo.documentation,
          enclosingSymbol: symbolInfo.enclosing_symbol ?? symbolInfo.enclosingSymbol,
          external: !normalizeArray(document.symbols).includes(symbolInfo)
        }
      });
      result.facts.push(...scipSymbolFacts(symbolInfo, symbolId));
      result.relations.push(...scipRelationshipRelations(symbolInfo, symbolId, context));
    }
    for (const [occurrenceIndex, occurrence] of normalizeArray(document.occurrences).entries()) {
      const symbolId = scipSymbolId(occurrence.symbol, context, documentId);
      if (!symbolId) continue;
      const role = scipOccurrenceRole(occurrence.symbol_roles ?? occurrence.symbolRoles);
      if (!documentSymbols.has(symbolId)) {
        documentSymbols.set(symbolId, true);
        result.symbols.push({
          id: symbolId,
          scheme: 'scip',
          name: nameFromExternalSymbol(occurrence.symbol),
          kind: scipSyntaxKind(occurrence.syntax_kind ?? occurrence.syntaxKind),
          language,
          metadata: { format: 'scip', rawSymbol: occurrence.symbol, inferredFromOccurrence: true }
        });
      }
      result.occurrences.push({
        id: occurrence.id ?? `occ_${idFragment(documentId)}_${occurrenceIndex + 1}`,
        documentId,
        symbolId,
        role,
        span: spanFromScipOccurrence(occurrence, path, context.sourceHash),
        metadata: {
          format: 'scip',
          symbolRoles: occurrence.symbol_roles ?? occurrence.symbolRoles,
          roleSet: scipOccurrenceRoleSet(occurrence.symbol_roles ?? occurrence.symbolRoles),
          syntaxKind: occurrence.syntax_kind ?? occurrence.syntaxKind,
          overrideDocumentation: occurrence.override_documentation ?? occurrence.overrideDocumentation
        }
      });
      for (const diagnostic of normalizeArray(occurrence.diagnostics)) {
        const scopedDiagnostic = { ...diagnostic, range: diagnostic.range ?? occurrence.range };
        result.facts.push(externalDiagnosticFact(scopedDiagnostic, context, documentId, path, result.facts.length));
        result.losses.push(externalDiagnosticLoss(scopedDiagnostic, context, path));
      }
      if (scipOccurrenceRoleSet(occurrence.symbol_roles ?? occurrence.symbolRoles).includes('generated')) {
        result.losses.push({
          id: `loss_${idFragment(documentId)}_${occurrenceIndex + 1}_generated_scip_occurrence`,
          severity: 'warning',
          phase: 'index',
          sourceFormat: 'scip',
          kind: 'generatedCode',
          message: 'SCIP occurrence is marked generated; merge admission should review generated/source ownership before applying patches.',
          span: spanFromScipOccurrence(occurrence, path, context.sourceHash),
          semanticSymbolId: symbolId,
          metadata: { format: 'scip', symbolRoles: occurrence.symbol_roles ?? occurrence.symbolRoles }
        });
      }
    }
  }
  return withExternalEmptyLoss(result, context);
}

function normalizeLsifPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'lsif' });
  const records = Array.isArray(payload) ? payload : [...normalizeArray(payload.vertices), ...normalizeArray(payload.edges)];
  const vertices = new Map(records.filter((record) => record?.type === 'vertex').map((record) => [record.id, record]));
  const edges = records.filter((record) => record?.type === 'edge');
  const documentByVertex = new Map();
  const documentIdByRange = new Map();
  const resultSetByRange = new Map();
  const monikerByOut = new Map();
  const definitionRangeIds = new Set();
  for (const vertex of vertices.values()) {
    if (vertex.label === 'document') {
      const path = uriToPath(vertex.uri) ?? vertex.uri ?? context.sourcePath ?? `lsif-document-${result.documents.length + 1}`;
      const documentId = `doc_${idFragment(vertex.id ?? path)}`;
      documentByVertex.set(vertex.id, { id: documentId, path, language: normalizeExternalSemanticLanguage(vertex.languageId ?? context.language) });
      result.documents.push({
        id: documentId,
        path,
        language: normalizeExternalSemanticLanguage(vertex.languageId ?? context.language),
        metadata: { format: 'lsif', vertexId: vertex.id, uri: vertex.uri }
      });
    }
    if (vertex.label === 'moniker') monikerByOut.set(vertex.id, vertex);
  }
  for (const edge of edges) {
    if (edge.label === 'next') resultSetByRange.set(edge.outV, edge.inV);
    if (edge.label === 'moniker') monikerByOut.set(edge.outV, vertices.get(edge.inV) ?? edge);
    if (edge.label === 'contains') {
      const document = documentByVertex.get(edge.outV);
      if (document) {
        for (const rangeId of normalizeArray(edge.inVs ?? edge.inV)) {
          documentIdByRange.set(rangeId, document.id);
        }
      }
    }
    if (edge.label === 'item' && (edge.property === 'definitions' || edge.property === 'declarations')) {
      for (const rangeId of normalizeArray(edge.inVs ?? edge.inV)) definitionRangeIds.add(rangeId);
    }
  }
  const documentIds = result.documents.map((document) => document.id);
  const defaultDocument = result.documents[0] ?? {
    id: `doc_${idFragment(context.sourcePath ?? 'lsif')}`,
    path: context.sourcePath ?? 'lsif:memory',
    language: context.language
  };
  if (!result.documents.length) result.documents.push(defaultDocument);
  for (const [vertexId, vertex] of vertices.entries()) {
    if (vertex.label !== 'range') continue;
    const resultSetId = resultSetByRange.get(vertexId);
    const moniker = monikerByOut.get(resultSetId) ?? monikerByOut.get(vertexId);
    const symbolId = moniker?.identifier
      ? `symbol:lsif:${idFragment(moniker.scheme ?? moniker.kind ?? 'moniker')}:${idFragment(moniker.identifier)}`
      : `symbol:lsif:${idFragment(resultSetId ?? vertexId)}`;
    const documentId = documentIdByRange.get(vertexId) ?? documentIds[0] ?? defaultDocument.id;
    const owningDocument = result.documents.find((document) => document.id === documentId) ?? defaultDocument;
    const span = spanFromLspRange(vertex, owningDocument.path, context.sourceHash, 0);
    if (!result.symbols.some((symbol) => symbol.id === symbolId)) {
      result.symbols.push({
        id: symbolId,
        scheme: 'lsif',
        name: moniker?.identifier ?? `range:${vertexId}`,
        kind: moniker?.kind ?? 'symbol',
        language: owningDocument.language,
        definitionSpan: definitionRangeIds.has(vertexId) ? span : undefined,
        metadata: { format: 'lsif', resultSetId, moniker }
      });
    }
    result.occurrences.push({
      id: `occ_${idFragment(vertexId)}`,
      documentId,
      symbolId,
      role: definitionRangeIds.has(vertexId) ? 'definition' : 'reference',
      span,
      metadata: { format: 'lsif', vertexId, resultSetId }
    });
  }
  for (const edge of edges) {
    if (edge.label === 'textDocument/definition' || edge.label === 'textDocument/references' || edge.label === 'textDocument/declaration') {
      result.relations.push({
        id: `rel_${idFragment(edge.id ?? `${edge.outV}_${edge.inV}_${edge.label}`)}`,
        sourceId: `lsif:${edge.outV}`,
        predicate: edge.label,
        targetId: `lsif:${edge.inV}`,
        metadata: { format: 'lsif', edge }
      });
    }
  }
  return withExternalEmptyLoss(result, context);
}

function normalizeLspPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'lsp' });
  const documents = normalizeLspDocuments(payload, context);
  for (const [documentIndex, document] of documents.entries()) {
    const sourcePath = uriToPath(document.uri) ?? document.sourcePath ?? document.path ?? context.sourcePath ?? `lsp-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.languageId ?? document.language ?? context.language);
    const documentId = document.id ?? `doc_${idFragment(sourcePath)}`;
    result.documents.push({
      id: documentId,
      path: sourcePath,
      language,
      sourceHash: document.sourceHash ?? context.sourceHash,
      metadata: { format: 'lsp', uri: document.uri, documentIndex }
    });
    const symbols = normalizeArray(document.documentSymbols ?? document.symbols ?? payload.documentSymbols ?? payload.symbols);
    for (const symbol of symbols) addLspSymbol(result, symbol, {
      context,
      documentId,
      sourcePath,
      language,
      parentName: symbol.containerName
    });
    const semanticTokens = document.semanticTokens ?? payload.semanticTokens;
    if (semanticTokens) addLspSemanticTokens(result, semanticTokens, { context, documentId, sourcePath, language });
    for (const diagnostic of normalizeArray(document.diagnostics ?? payload.diagnostics)) {
      result.facts.push(externalDiagnosticFact(diagnostic, context, documentId, sourcePath, result.facts.length));
      result.losses.push(externalDiagnosticLoss(diagnostic, context, sourcePath));
    }
  }
  return withExternalEmptyLoss(result, context);
}

function normalizeSemanticDbPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'semanticdb' });
  const documents = normalizeArray(payload.documents ?? payload.textDocuments ?? payload);
  for (const [documentIndex, document] of documents.entries()) {
    const sourcePath = uriToPath(document.uri) ?? document.uri ?? document.path ?? context.sourcePath ?? `semanticdb-document-${documentIndex + 1}`;
    const language = normalizeExternalSemanticLanguage(document.language ?? context.language ?? 'scala');
    const documentId = document.id ?? `doc_${idFragment(sourcePath)}`;
    result.documents.push({
      id: documentId,
      path: sourcePath,
      language,
      sourceHash: document.md5 ?? document.sourceHash ?? context.sourceHash,
      metadata: { format: 'semanticdb', schema: document.schema, documentIndex }
    });
    for (const [symbolIndex, symbolInfo] of normalizeArray(document.symbols).entries()) {
      const symbolId = semanticDbSymbolId(symbolInfo.symbol, context, documentId);
      result.symbols.push({
        id: symbolId,
        scheme: 'semanticdb',
        name: symbolInfo.display_name ?? symbolInfo.displayName ?? nameFromExternalSymbol(symbolInfo.symbol),
        kind: normalizeExternalSymbolKind(symbolInfo.kind),
        language,
        signatureHash: hashSemanticValue(symbolInfo.signature ?? symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation ?? symbolInfo),
        metadata: { format: 'semanticdb', symbolIndex, rawSymbol: symbolInfo.symbol, properties: symbolInfo.properties }
      });
      result.facts.push(...semanticDbSymbolFacts(symbolInfo, symbolId));
    }
    for (const [occurrenceIndex, occurrence] of normalizeArray(document.occurrences).entries()) {
      const symbolId = semanticDbSymbolId(occurrence.symbol, context, documentId);
      if (!result.symbols.some((symbol) => symbol.id === symbolId)) {
        result.symbols.push({
          id: symbolId,
          scheme: 'semanticdb',
          name: nameFromExternalSymbol(occurrence.symbol),
          kind: 'symbol',
          language,
          metadata: { format: 'semanticdb', inferredFromOccurrence: true, rawSymbol: occurrence.symbol }
        });
      }
      result.occurrences.push({
        id: occurrence.id ?? `occ_${idFragment(documentId)}_${occurrenceIndex + 1}`,
        documentId,
        symbolId,
        role: semanticDbOccurrenceRole(occurrence.role),
        span: spanFromSemanticDbRange(occurrence.range, sourcePath, document.md5 ?? context.sourceHash),
        metadata: { format: 'semanticdb', role: occurrence.role }
      });
    }
    for (const diagnostic of normalizeArray(document.diagnostics)) {
      result.facts.push(externalDiagnosticFact(diagnostic, context, documentId, sourcePath, result.facts.length));
      result.losses.push(externalDiagnosticLoss(diagnostic, context, sourcePath));
    }
  }
  return withExternalEmptyLoss(result, context);
}

function normalizeGenericExternalSemanticIndexPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: context.format, genericPayload: true });
  result.losses.push({
    id: `loss_${context.idPart}_${idFragment(context.format)}_unsupported_payload`,
    severity: 'warning',
    phase: 'index',
    sourceFormat: context.format,
    kind: 'unsupportedSemantic',
    message: `External semantic index format ${context.format} is not recognized; payload hash is preserved as evidence only.`,
    metadata: { format: context.format, payloadHash: hashSemanticValue(payload) }
  });
  return result;
}

function normalizeArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeExternalSemanticLanguage(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = typeof value === 'number' ? externalLanguageNameByNumber[value] : String(value);
  return normalizeNativeLanguageId(raw);
}

function externalDocument(document, context, index) {
  const path = document.path ?? document.uri ?? document.relative_path ?? document.relativePath ?? context.sourcePath ?? `external-document-${index + 1}`;
  return {
    id: document.id ?? `doc_${idFragment(path)}`,
    path: uriToPath(path) ?? path,
    language: normalizeExternalSemanticLanguage(document.language ?? document.languageId ?? context.language),
    sourceHash: document.sourceHash ?? document.md5 ?? context.sourceHash,
    metadata: { format: context.format, ...document.metadata }
  };
}

function externalSymbol(symbol, context, index) {
  const id = symbol.id ?? symbol.symbolId ?? symbol.symbol ?? `symbol:${context.format}:${index + 1}`;
  return {
    ...symbol,
    id: String(id),
    scheme: symbol.scheme ?? context.format,
    name: symbol.name ?? symbol.display_name ?? symbol.displayName ?? nameFromExternalSymbol(id),
    kind: normalizeExternalSymbolKind(symbol.kind),
    language: normalizeExternalSemanticLanguage(symbol.language ?? context.language),
    definitionSpan: normalizeExternalSpan(symbol.definitionSpan ?? symbol.span, context.sourcePath, context.sourceHash),
    metadata: { format: context.format, rawSymbol: symbol.symbol, ...symbol.metadata }
  };
}

function externalOccurrence(occurrence, context, index) {
  return {
    ...occurrence,
    id: occurrence.id ?? `occ_${context.idPart}_${index + 1}`,
    documentId: occurrence.documentId ?? occurrence.document_id ?? `doc_${idFragment(occurrence.path ?? context.sourcePath ?? context.format)}`,
    symbolId: occurrence.symbolId ?? occurrence.symbol_id ?? occurrence.symbol ?? `symbol:${context.format}:unknown`,
    role: normalizeExternalOccurrenceRole(occurrence.role),
    span: normalizeExternalSpan(occurrence.span ?? occurrence.range, occurrence.path ?? context.sourcePath, context.sourceHash),
    metadata: { format: context.format, ...occurrence.metadata }
  };
}

function externalRelation(relation, context, index) {
  return {
    ...relation,
    id: relation.id ?? `rel_${context.idPart}_${index + 1}`,
    sourceId: relation.sourceId ?? relation.source_id ?? relation.subjectId ?? relation.subject_id ?? `external:${context.format}`,
    predicate: relation.predicate ?? relation.label ?? relation.kind ?? 'related',
    targetId: relation.targetId ?? relation.target_id ?? relation.objectId ?? relation.object_id ?? relation.symbol ?? `external:${context.format}`,
    metadata: { format: context.format, ...relation.metadata }
  };
}

function externalFact(fact, context, index) {
  return {
    ...fact,
    id: fact.id ?? `fact_${context.idPart}_${index + 1}`,
    predicate: fact.predicate ?? fact.kind ?? 'externalFact',
    subjectId: fact.subjectId ?? fact.subject_id ?? fact.symbolId ?? fact.symbol_id ?? `external:${context.format}`,
    value: fact.value ?? fact.data ?? fact,
    metadata: { format: context.format, ...fact.metadata }
  };
}

function externalSemanticEvidence(context, status, summary, metadata = {}) {
  return {
    id: `evidence_${context.idPart}_${idFragment(context.format)}_external_semantic_index`,
    kind: 'import',
    status,
    path: context.sourcePath,
    summary,
    metadata: {
      format: context.format,
      parser: context.parser,
      projectRoot: context.projectRoot,
      ...metadata
    }
  };
}

function externalSemanticCoverageLoss(context) {
  return {
    id: `loss_${context.idPart}_${idFragment(context.format)}_partial_semantic_index`,
    severity: 'info',
    phase: 'index',
    sourceFormat: context.format,
    kind: 'partialSemanticIndex',
    message: `${context.format} payload imported symbols, occurrences, and facts as external semantic evidence; full parser AST, comments, trivia, and executable semantics still require a native parser adapter.`,
    semanticIndexId: context.semanticIndexId,
    metadata: {
      format: context.format,
      parser: context.parser,
      source: 'external-semantic-index'
    }
  };
}

function withExternalEmptyLoss(result, context) {
  if (!result.documents.length) {
    result.documents.push({
      id: `doc_${context.idPart}_${idFragment(context.format)}`,
      path: context.sourcePath ?? `${context.format}:memory`,
      language: context.language,
      sourceHash: context.sourceHash,
      metadata: { format: context.format, inferred: true }
    });
  }
  if (!result.symbols.length && !result.occurrences.length) {
    result.losses.push({
      id: `loss_${context.idPart}_${idFragment(context.format)}_empty_semantic_index`,
      severity: 'warning',
      phase: 'index',
      sourceFormat: context.format,
      kind: 'partialSemanticIndex',
      message: `${context.format} payload did not contain symbols or occurrences that Frontier can map.`,
      metadata: { format: context.format }
    });
  }
  attachExternalOwnership(result, context);
  result.symbols = uniqueRecordsById(result.symbols);
  result.occurrences = uniqueRecordsById(result.occurrences);
  result.relations = uniqueRecordsById(result.relations);
  result.facts = uniqueRecordsById(result.facts);
  result.losses = uniqueByLossId(result.losses);
  result.evidence = uniqueByEvidenceId(result.evidence);
  return result;
}

function attachExternalOwnership(result, context) {
  const occurrencesBySymbol = new Map();
  for (const occurrence of result.occurrences) {
    if (!occurrencesBySymbol.has(occurrence.symbolId)) occurrencesBySymbol.set(occurrence.symbolId, []);
    occurrencesBySymbol.get(occurrence.symbolId).push(occurrence);
    result.relations.push({
      id: `rel_${idFragment(occurrence.documentId)}_${idFragment(occurrence.id)}_${idFragment(occurrence.role)}`,
      sourceId: occurrence.documentId,
      predicate: externalRelationPredicateForOccurrence(occurrence),
      targetId: occurrence.symbolId,
      metadata: {
        format: context.format,
        source: 'external-semantic-index',
        occurrenceId: occurrence.id,
        role: occurrence.role
      }
    });
  }
  result.symbols = result.symbols.map((symbol) => {
    const occurrences = occurrencesBySymbol.get(symbol.id) ?? [];
    const definition = occurrences.find((occurrence) => occurrence.role === 'definition') ?? occurrences[0];
    const sourceSpan = symbol.definitionSpan ?? definition?.span;
    const regionKind = semanticRegionKindForSymbol(symbol, undefined, undefined);
    const key = [
      'external',
      symbol.language ?? context.language ?? 'unknown',
      sourceSpan?.path ?? context.sourcePath ?? 'memory',
      regionKind,
      symbol.name ?? symbol.id
    ].join('#');
    const region = {
      id: `region_${idFragment(key)}`,
      key,
      regionKind,
      granularity: 'symbol',
      language: symbol.language ?? context.language,
      documentId: definition?.documentId,
      sourcePath: sourceSpan?.path ?? context.sourcePath,
      sourceHash: context.sourceHash,
      symbolId: symbol.id,
      symbolName: symbol.name,
      symbolKind: symbol.kind,
      sourceSpan,
      precision: sourceSpan ? 'declaration' : 'unknown',
      mergePolicy: semanticRegionMergePolicy(regionKind),
      metadata: {
        format: context.format,
        source: 'external-semantic-index'
      }
    };
    result.facts.push({
      id: `fact_${idFragment(symbol.id)}_ownership_region`,
      predicate: 'semanticOwnershipRegion',
      subjectId: symbol.id,
      value: region
    }, {
      id: `fact_${idFragment(symbol.id)}_ownership_region_taxonomy`,
      predicate: 'semanticOwnershipRegionTaxonomy',
      subjectId: symbol.id,
      value: {
        regionKind: region.regionKind,
        granularity: region.granularity,
        key: region.key
      }
    });
    return {
      ...symbol,
      definitionSpan: symbol.definitionSpan ?? definition?.span,
      metadata: {
        ...symbol.metadata,
        ownershipRegionId: symbol.metadata?.ownershipRegionId ?? region.id,
        ownershipRegionKey: symbol.metadata?.ownershipRegionKey ?? region.key,
        ownershipRegionKind: symbol.metadata?.ownershipRegionKind ?? region.regionKind
      }
    };
  });
}

function externalRelationPredicateForOccurrence(occurrence) {
  const role = String(occurrence.role ?? '').toLowerCase();
  if (role === 'definition' || role === 'declaration') return 'defines';
  if (role === 'import') return 'imports';
  if (role === 'write') return 'writes';
  if (role === 'read') return 'reads';
  return 'references';
}

function externalSemanticSourceMapMappings(semanticIndex, context) {
  const symbolsById = new Map((semanticIndex.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const evidenceIds = (context.evidence ?? []).map((record) => record.id).filter(Boolean);
  const lossIds = (context.losses ?? []).map((loss) => loss.id).filter(Boolean);
  return (semanticIndex.occurrences ?? [])
    .filter((occurrence) => occurrence.span)
    .map((occurrence, index) => {
      const symbol = symbolsById.get(occurrence.symbolId);
      return {
        id: `map_${idFragment(occurrence.id ?? `${occurrence.symbolId}_${index + 1}`)}`,
        semanticSymbolId: occurrence.symbolId,
        semanticOccurrenceId: occurrence.id,
        sourceSpan: occurrence.span,
        evidenceIds,
        lossIds,
        ownershipRegionId: symbol?.metadata?.ownershipRegionId,
        ownershipRegionKey: symbol?.metadata?.ownershipRegionKey,
        ownershipRegionKind: symbol?.metadata?.ownershipRegionKind,
        precision: occurrence.span ? 'declaration' : 'unknown',
        metadata: {
          source: 'external-semantic-index'
        }
      };
    });
}

function scipSymbolId(symbol, context, documentId) {
  if (!symbol) return undefined;
  const raw = String(symbol);
  if (raw.startsWith('symbol:')) return raw;
  const scope = /^local\b/i.test(raw) ? `${documentId ?? context.idPart}:` : '';
  return `symbol:scip:${idFragment(scope + raw)}`;
}

function semanticDbSymbolId(symbol, context, documentId) {
  if (!symbol) return `symbol:semanticdb:${context.idPart}:unknown`;
  if (String(symbol).startsWith('symbol:')) return String(symbol);
  const scope = /^local\d+$/i.test(String(symbol)) ? `${documentId}:` : '';
  return `symbol:semanticdb:${idFragment(scope + symbol)}`;
}

function nameFromExternalSymbol(symbol) {
  const value = String(symbol ?? 'symbol');
  const cleaned = value
    .replace(/^symbol:[^:]+:/, '')
    .replace(/[`'"]/g, '')
    .split(/[\/#.:() +]+/)
    .filter(Boolean)
    .at(-1);
  return cleaned || value;
}

const externalSymbolKindByNumber = Object.freeze({
  1: 'array',
  2: 'assertion',
  3: 'associatedType',
  4: 'attribute',
  7: 'class',
  8: 'constant',
  9: 'constructor',
  11: 'enum',
  12: 'enumMember',
  13: 'event',
  15: 'field',
  16: 'file',
  17: 'function',
  21: 'interface',
  25: 'macro',
  26: 'method',
  28: 'message',
  29: 'module',
  30: 'namespace',
  35: 'package',
  37: 'parameter',
  41: 'property',
  42: 'protocol',
  49: 'struct',
  53: 'trait',
  54: 'type',
  55: 'typeAlias',
  58: 'typeParameter',
  61: 'variable',
  66: 'abstractMethod'
});

const lspSymbolKindByNumber = Object.freeze({
  1: 'file',
  2: 'module',
  3: 'namespace',
  4: 'package',
  5: 'class',
  6: 'method',
  7: 'property',
  8: 'field',
  9: 'constructor',
  10: 'enum',
  11: 'interface',
  12: 'function',
  13: 'variable',
  14: 'constant',
  22: 'enumMember',
  23: 'struct',
  26: 'typeParameter'
});

const externalLanguageNameByNumber = Object.freeze({
  1: 'csharp',
  2: 'swift',
  3: 'dart',
  4: 'kotlin',
  5: 'scala',
  6: 'java',
  15: 'python',
  16: 'ruby',
  17: 'elixir',
  18: 'erlang',
  19: 'php',
  22: 'javascript',
  23: 'typescript',
  33: 'go',
  34: 'c',
  35: 'cpp',
  38: 'zig',
  40: 'rust',
  44: 'haskell',
  54: 'r',
  69: 'sql'
});

function normalizeExternalSymbolKind(kind) {
  if (kind === undefined || kind === null || kind === '') return 'symbol';
  if (typeof kind === 'number') return externalSymbolKindByNumber[kind] ?? lspSymbolKindByNumber[kind] ?? `kind${kind}`;
  return String(kind).replace(/^[A-Z_]+_/, '').replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}

function normalizeLspSymbolKind(kind) {
  if (typeof kind === 'number') return lspSymbolKindByNumber[kind] ?? `kind${kind}`;
  return normalizeExternalSymbolKind(kind);
}

function scipSyntaxKind(kind) {
  const normalized = typeof kind === 'number' ? kind : Number(kind);
  if (normalized === 15 || normalized === 16) return 'function';
  if (normalized === 19 || normalized === 20) return 'type';
  if (normalized === 25 || normalized === 26) return 'module';
  if (normalized === 9 || normalized === 10 || normalized === 12) return 'variable';
  return 'symbol';
}

function normalizeExternalOccurrenceRole(role) {
  const value = String(role ?? 'reference').toLowerCase();
  if (value.includes('def')) return 'definition';
  if (value.includes('decl')) return 'declaration';
  if (value.includes('import')) return 'import';
  if (value.includes('write')) return 'write';
  if (value.includes('read')) return 'read';
  return value === '2' ? 'definition' : value === '1' ? 'reference' : 'reference';
}

function scipOccurrenceRole(value) {
  const role = Number(value ?? 0);
  if ((role & 0x1) > 0) return 'definition';
  if ((role & 0x2) > 0) return 'import';
  if ((role & 0x4) > 0) return 'write';
  if ((role & 0x8) > 0) return 'read';
  return 'reference';
}

function scipOccurrenceRoleSet(value) {
  const role = Number(value ?? 0);
  const roles = [];
  if ((role & 0x1) > 0) roles.push('definition');
  if ((role & 0x2) > 0) roles.push('import');
  if ((role & 0x4) > 0) roles.push('write');
  if ((role & 0x8) > 0) roles.push('read');
  if ((role & 0x10) > 0) roles.push('generated');
  if ((role & 0x20) > 0) roles.push('test');
  if ((role & 0x40) > 0) roles.push('forwardDefinition');
  return roles.length ? roles : ['reference'];
}

function semanticDbOccurrenceRole(value) {
  const role = String(value ?? 'reference').toLowerCase();
  if (role === '2' || role.includes('definition')) return 'definition';
  return 'reference';
}

function scipRelationshipRelations(symbolInfo, symbolId, context) {
  return normalizeArray(symbolInfo.relationships).flatMap((relationship, index) => {
    const targetId = scipSymbolId(relationship.symbol, context);
    if (!targetId) return [];
    const predicates = [];
    if (relationship.is_reference ?? relationship.isReference) predicates.push('references');
    if (relationship.is_implementation ?? relationship.isImplementation) predicates.push('implements');
    if (relationship.is_type_definition ?? relationship.isTypeDefinition) predicates.push('typeDefinition');
    if (relationship.is_definition ?? relationship.isDefinition) predicates.push('definitionOf');
    return (predicates.length ? predicates : ['related']).map((predicate) => ({
      id: `rel_${idFragment(symbolId)}_${idFragment(targetId)}_${idFragment(predicate)}_${index + 1}`,
      sourceId: symbolId,
      predicate,
      targetId,
      metadata: { format: 'scip', relationship }
    }));
  });
}

function scipSymbolFacts(symbolInfo, symbolId) {
  const facts = [];
  if (symbolInfo.documentation) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_documentation`,
      predicate: 'documentation',
      subjectId: symbolId,
      value: normalizeArray(symbolInfo.documentation)
    });
  }
  const signature = symbolInfo.signature_documentation ?? symbolInfo.signatureDocumentation;
  if (signature) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_signature`,
      predicate: 'signature',
      subjectId: symbolId,
      value: signature
    });
  }
  for (const [index, relationship] of normalizeArray(symbolInfo.relationships).entries()) {
    facts.push({
      id: `fact_${idFragment(symbolId)}_relationship_${index + 1}`,
      predicate: 'relationship',
      subjectId: symbolId,
      value: relationship
    });
  }
  return facts;
}

function semanticDbSymbolFacts(symbolInfo, symbolId) {
  const facts = [];
  for (const key of ['signature', 'properties', 'annotations', 'access', 'language']) {
    if (symbolInfo[key] !== undefined) {
      facts.push({
        id: `fact_${idFragment(symbolId)}_${idFragment(key)}`,
        predicate: key,
        subjectId: symbolId,
        value: symbolInfo[key]
      });
    }
  }
  return facts;
}

function normalizeLspDocuments(payload, context) {
  if (Array.isArray(payload.documents)) return payload.documents;
  if (payload.textDocument || payload.uri || payload.documentSymbols || payload.symbols || payload.semanticTokens || payload.diagnostics) {
    return [{
      ...payload,
      uri: payload.uri ?? payload.textDocument?.uri,
      languageId: payload.languageId ?? payload.language ?? context.language,
      documentSymbols: payload.documentSymbols,
      symbols: payload.symbols,
      semanticTokens: payload.semanticTokens,
      diagnostics: payload.diagnostics
    }];
  }
  return [{ uri: context.sourcePath, languageId: context.language }];
}

function addLspSymbol(result, symbol, input) {
  const location = symbol.location ?? {};
  const range = symbol.range ?? location.range ?? symbol.selectionRange;
  const sourcePath = uriToPath(location.uri ?? symbol.uri) ?? input.sourcePath;
  const symbolName = symbol.name ?? symbol.containerName ?? `symbol_${result.symbols.length + 1}`;
  const symbolId = symbol.id ?? `symbol:lsp:${idFragment(input.language ?? 'unknown')}:${idFragment([input.parentName, symbolName].filter(Boolean).join('.'))}`;
  const ownershipSpan = spanFromLspRange(range, sourcePath, input.context.sourceHash, 0);
  const selectionSpan = spanFromLspRange(symbol.selectionRange ?? range, sourcePath, input.context.sourceHash, 0);
  if (!result.symbols.some((entry) => entry.id === symbolId)) {
    result.symbols.push({
      id: symbolId,
      scheme: 'lsp',
      name: symbolName,
      kind: normalizeLspSymbolKind(symbol.kind),
      language: input.language,
      definitionSpan: ownershipSpan,
      signatureHash: hashSemanticValue([symbolName, symbol.kind, symbol.detail]),
      metadata: {
        format: 'lsp',
        detail: symbol.detail,
        tags: symbol.tags,
        deprecated: symbol.deprecated,
        containerName: symbol.containerName,
        parentName: input.parentName
      }
    });
  }
  result.occurrences.push({
    id: `occ_${idFragment(symbolId)}_${result.occurrences.length + 1}`,
    documentId: input.documentId,
    symbolId,
    role: 'definition',
    span: selectionSpan,
    metadata: { format: 'lsp', range, selectionRange: symbol.selectionRange }
  });
  for (const child of normalizeArray(symbol.children)) {
    addLspSymbol(result, child, {
      ...input,
      parentName: [input.parentName, symbolName].filter(Boolean).join('.')
    });
  }
}

function addLspSemanticTokens(result, semanticTokens, input) {
  const data = normalizeArray(semanticTokens.data);
  const legend = semanticTokens.legend ?? {};
  let line = 0;
  let character = 0;
  for (let index = 0; index + 4 < data.length; index += 5) {
    line += Number(data[index] ?? 0);
    character = Number(data[index] ?? 0) === 0 ? character + Number(data[index + 1] ?? 0) : Number(data[index + 1] ?? 0);
    const length = Number(data[index + 2] ?? 0);
    const tokenType = legend.tokenTypes?.[Number(data[index + 3] ?? 0)] ?? `tokenType${data[index + 3] ?? 0}`;
    const span = {
      path: input.sourcePath,
      startLine: line + 1,
      startColumn: character + 1,
      endLine: line + 1,
      endColumn: character + length + 1
    };
    result.facts.push({
      id: `fact_${idFragment(input.documentId)}_semantic_token_${index / 5 + 1}`,
      predicate: 'semanticToken',
      subjectId: input.documentId,
      value: {
        tokenType,
        tokenModifiers: semanticTokenModifiers(Number(data[index + 4] ?? 0), legend.tokenModifiers),
        span
      },
      metadata: { format: 'lsp' }
    });
  }
}

function semanticTokenModifiers(bitset, modifiers = []) {
  const result = [];
  for (let index = 0; index < modifiers.length; index += 1) {
    if ((bitset & (1 << index)) > 0) result.push(modifiers[index]);
  }
  return result;
}

function externalDiagnosticFact(diagnostic, context, documentId, sourcePath, index) {
  return {
    id: diagnostic.id ? `fact_${idFragment(diagnostic.id)}_diagnostic` : `fact_${context.idPart}_${idFragment(sourcePath)}_diagnostic_${index + 1}`,
    predicate: `${context.format}.diagnostic`,
    subjectId: documentId,
    value: {
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      source: diagnostic.source,
      tags: diagnostic.tags,
      range: diagnostic.range,
      span: normalizeExternalSpan(diagnostic.range ?? diagnostic.span, sourcePath, context.sourceHash)
    },
    metadata: {
      format: context.format,
      source: 'external-semantic-index'
    }
  };
}

function externalDiagnosticLoss(diagnostic, context, sourcePath) {
  const severity = externalDiagnosticSeverity(diagnostic.severity);
  return {
    id: diagnostic.id ?? `loss_${context.idPart}_${idFragment(diagnostic.code ?? diagnostic.message ?? severity)}_${idFragment(sourcePath)}`,
    severity,
    phase: 'index',
    sourceFormat: context.format,
    kind: severity === 'error' ? 'unsupportedSemantic' : 'partialSemanticIndex',
    message: String(diagnostic.message ?? `${context.format} diagnostic reported ${severity}.`),
    span: normalizeExternalSpan(diagnostic.range ?? diagnostic.span, sourcePath, context.sourceHash),
    metadata: {
      format: context.format,
      code: diagnostic.code,
      source: diagnostic.source,
      tags: diagnostic.tags
    }
  };
}

function externalDiagnosticSeverity(value) {
  if (value === undefined || value === null || value === '') return 'error';
  const raw = String(value).toLowerCase();
  if (raw === '1' || raw.includes('error')) return 'error';
  if (raw === '3' || raw.includes('info') || raw.includes('hint')) return 'info';
  return 'warning';
}

function spanFromScipOccurrence(occurrence, sourcePath, sourceHash) {
  if (occurrence.single_line_range || occurrence.singleLineRange) {
    const range = occurrence.single_line_range ?? occurrence.singleLineRange;
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: Number(range.line ?? 0) + 1,
      startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
      endLine: Number(range.line ?? 0) + 1,
      endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
    };
  }
  if (occurrence.multi_line_range || occurrence.multiLineRange) {
    const range = occurrence.multi_line_range ?? occurrence.multiLineRange;
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: Number(range.start_line ?? range.startLine ?? 0) + 1,
      startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
      endLine: Number(range.end_line ?? range.endLine ?? 0) + 1,
      endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
    };
  }
  const range = occurrence.range;
  if (Array.isArray(range) && range.length >= 3) {
    const startLine = Number(range[0] ?? 0);
    const startColumn = Number(range[1] ?? 0);
    const endLine = range.length >= 4 ? Number(range[2] ?? startLine) : startLine;
    const endColumn = range.length >= 4 ? Number(range[3] ?? startColumn) : Number(range[2] ?? startColumn);
    return {
      sourceId: sourceHash,
      path: sourcePath,
      startLine: startLine + 1,
      startColumn: startColumn + 1,
      endLine: endLine + 1,
      endColumn: endColumn + 1
    };
  }
  return undefined;
}

function spanFromSemanticDbRange(range, sourcePath, sourceHash) {
  if (!range) return undefined;
  return {
    sourceId: sourceHash,
    path: sourcePath,
    startLine: Number(range.start_line ?? range.startLine ?? 0) + 1,
    startColumn: Number(range.start_character ?? range.startCharacter ?? 0) + 1,
    endLine: Number(range.end_line ?? range.endLine ?? 0) + 1,
    endColumn: Number(range.end_character ?? range.endCharacter ?? 0) + 1
  };
}

function spanFromLspRange(range, sourcePath, sourceHash, base = 0) {
  if (!range) return undefined;
  const source = range.start && range.end ? range : { start: range, end: range.end ?? range };
  return {
    sourceId: sourceHash,
    path: sourcePath,
    startLine: Number(source.start?.line ?? source.startLine ?? 0) + (base === 0 ? 1 : 0),
    startColumn: Number(source.start?.character ?? source.startColumn ?? 0) + (base === 0 ? 1 : 0),
    endLine: Number(source.end?.line ?? source.endLine ?? source.start?.line ?? 0) + (base === 0 ? 1 : 0),
    endColumn: Number(source.end?.character ?? source.endColumn ?? source.start?.character ?? 0) + (base === 0 ? 1 : 0)
  };
}

function normalizeExternalSpan(value, sourcePath, sourceHash) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return spanFromScipOccurrence({ range: value }, sourcePath, sourceHash);
  }
  if (value.start || value.end || value.line !== undefined) return spanFromLspRange(value, sourcePath, sourceHash, 0);
  if (value.startLine !== undefined || value.start_line !== undefined) {
    return {
      sourceId: value.sourceId ?? sourceHash,
      path: value.path ?? sourcePath,
      start: value.start,
      end: value.end,
      startLine: Number(value.startLine ?? value.start_line),
      startColumn: value.startColumn ?? value.start_character,
      endLine: value.endLine ?? value.end_line,
      endColumn: value.endColumn ?? value.end_character
    };
  }
  return undefined;
}

function uriToPath(uri) {
  if (typeof uri !== 'string') return undefined;
  if (uri.startsWith('file://')) {
    try {
      return decodeURIComponent(new URL(uri).pathname);
    } catch {
      return uri.replace(/^file:\/\//, '');
    }
  }
  return uri;
}

export function projectFrontierAst(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const projector = projectors[normalized];
  return projector(document, options);
}

export function renderTargetAst(ast, target = 'typescript') {
  const normalized = normalizeCompileTarget(target);
  const renderer = renderers[normalized];
  return renderer(ast);
}

export function renderTargetAstWithSourceMap(ast, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const renderer = sourceMapRenderers[normalized];
  return renderer(ast, options);
}

export function resolveCapabilityAdapters(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const platform = options.platform;
  return Object.values(document.nodes)
    .filter((node) => node.kind === 'capability')
    .map((node) => {
      const adapters = (node.adapters ?? []).filter((adapter) => {
        if (adapter.target?.language !== normalized) return false;
        if (platform && adapter.target?.platform && adapter.target.platform !== platform) return false;
        return true;
      });
      const unsupported = (node.unsupportedTargets ?? []).find((item) => {
        if (item.target?.language !== normalized) return false;
        if (platform && item.target?.platform && item.target.platform !== platform) return false;
        return true;
      });
      return {
        nodeId: node.id,
        name: node.name,
        capability: node.capability,
        target: { language: normalized, platform },
        status: adapters.length ? 'bound' : unsupported ? 'unsupported' : 'unbound',
        adapters,
        unsupported,
        reason: unsupported?.reason
      };
    });
}

export function getNativeImportFeatureEvidencePolicy(kind) {
  const normalized = normalizeNativeLossKind({ kind }, 'warning');
  return NativeImportFeatureEvidencePolicies[normalized] ?? NativeImportFeatureEvidencePolicies[String(kind ?? '')];
}

export function summarizeNativeImportFeatureEvidence(losses = [], options = {}) {
  const normalizedLosses = normalizeNativeLossRecords(losses);
  const evidence = options.evidence ?? [];
  const issues = [];
  const byKind = {};
  const byRisk = {};
  const policyKinds = [];
  let highestRisk = 'low';
  let semanticMergeReadiness = 'ready';

  for (const loss of normalizedLosses) {
    const policy = getNativeImportFeatureEvidencePolicy(loss.kind);
    if (!policy) continue;
    byKind[policy.kind] = (byKind[policy.kind] ?? 0) + 1;
    byRisk[policy.risk] = (byRisk[policy.risk] ?? 0) + 1;
    if ((nativeFeatureEvidenceRiskRank[policy.risk] ?? 0) > (nativeFeatureEvidenceRiskRank[highestRisk] ?? 0)) {
      highestRisk = policy.risk;
    }
    policyKinds.push(policy.kind);
    semanticMergeReadiness = maxSemanticMergeReadiness(semanticMergeReadiness, policy.minimumReadiness);
    const missingRequiredEvidence = policy.requiredEvidenceKeys.filter((key) => !nativeImportFeatureEvidenceHasKey(loss, evidence, key));
    const presentRequiredEvidence = policy.requiredEvidenceKeys.filter((key) => !missingRequiredEvidence.includes(key));
    const presentRecommendedEvidence = policy.recommendedEvidenceKeys.filter((key) => nativeImportFeatureEvidenceHasKey(loss, evidence, key));
    if (missingRequiredEvidence.length) {
      semanticMergeReadiness = maxSemanticMergeReadiness(semanticMergeReadiness, policy.missingEvidenceReadiness);
    }
    issues.push({
      lossId: loss.id,
      kind: loss.kind,
      policyKind: policy.kind,
      risk: policy.risk,
      category: policy.category,
      readiness: missingRequiredEvidence.length ? policy.missingEvidenceReadiness : policy.minimumReadiness,
      missingRequiredEvidence,
      presentRequiredEvidence,
      presentRecommendedEvidence,
      evidenceIds: nativeImportFeatureEvidenceIds(loss, evidence, policy)
    });
  }

  const missingRequiredEvidence = issues.flatMap((issue) => issue.missingRequiredEvidence.map((key) => ({
    lossId: issue.lossId,
    kind: issue.kind,
    policyKind: issue.policyKind,
    evidenceKey: key
  })));
  return {
    total: issues.length,
    policyKinds: uniqueStrings(policyKinds),
    byKind,
    byRisk,
    highestRisk: issues.length ? highestRisk : 'low',
    semanticMergeReadiness,
    missingRequiredEvidence,
    issues,
    reasons: nativeImportFeatureEvidenceReasons(issues)
  };
}

export function summarizeNativeImportLosses(losses = [], options = {}) {
  const normalizedLosses = normalizeNativeLossRecords(losses);
  const bySeverity = { info: 0, warning: 0, error: 0 };
  const byKind = {};
  const blockingLossIds = [];
  const reviewLossIds = [];
  const informationalLossIds = [];
  let highestSeverity = 'none';

  for (const loss of normalizedLosses) {
    bySeverity[loss.severity] += 1;
    byKind[loss.kind] = (byKind[loss.kind] ?? 0) + 1;
    if (lossSeverityRank[loss.severity] > lossSeverityRank[highestSeverity]) {
      highestSeverity = loss.severity;
    }
    if (loss.severity === 'error') blockingLossIds.push(loss.id);
    else if (loss.severity === 'warning') reviewLossIds.push(loss.id);
    else informationalLossIds.push(loss.id);
  }

  const failedEvidenceIds = (options.evidence ?? [])
    .filter((record) => record?.status === 'failed')
    .map((record) => record.id)
    .filter(Boolean);
  const exactAst = Boolean(options.exactAst) && normalizedLosses.length === 0;
  const categories = uniqueStrings([
    ...(exactAst ? ['exactAstImport'] : []),
    ...normalizedLosses.map((loss) => nativeImportCategoryForLossKind(loss.kind))
  ]);
  const semanticMergeReadiness = failedEvidenceIds.length
    ? 'blocked'
    : NativeImportReadinessBySeverity[highestSeverity];
  const readinessReasons = nativeImportReadinessReasons({
    exactAst,
    failedEvidenceIds,
    blockingLossIds,
    reviewLossIds,
    informationalLossIds
  });
  const featureEvidence = summarizeNativeImportFeatureEvidence(normalizedLosses, {
    evidence: options.evidence
  });

  return {
    total: normalizedLosses.length,
    hasLosses: normalizedLosses.length > 0,
    exactAst,
    highestSeverity,
    semanticMergeReadiness,
    readinessReasons,
    categories,
    bySeverity,
    byKind,
    blockingLossIds,
    reviewLossIds,
    informationalLossIds,
    failedEvidenceIds,
    featureEvidence,
    parser: options.parser,
    scanKind: options.scanKind,
    semanticStatus: options.semanticStatus
  };
}

export function classifyNativeImportReadiness(losses = [], options = {}) {
  const summary = summarizeNativeImportLosses(losses, options);
  return {
    readiness: summary.semanticMergeReadiness,
    reasons: summary.readinessReasons,
    summary
  };
}

export function classifyNativeImportRoundtripReadiness(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('classifyNativeImportRoundtripReadiness requires a native import result');
  }
  const imports = nativeImportEntries(importResult);
  const importLosses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...imports.flatMap((imported) => imported?.losses ?? [])
  ]);
  const importEvidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...imports.flatMap((imported) => imported?.evidence ?? [])
  ]);
  const exactAst = imports.length > 0 && imports.every((imported) => nativeImportHasExactAstCoverage(imported));
  const importReadiness = classifyNativeImportReadiness(importLosses, {
    exactAst,
    evidence: importEvidence,
    parser: nativeImportRoundtripParser(importResult, imports),
    scanKind: importResult.metadata?.nativeImportLossSummary?.scanKind,
    semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus
  });
  const projection = options.projection ?? projectNativeImportToSource(importResult, options);
  const projectionReadiness = projection.readiness ?? classifyNativeImportReadiness(projection.losses ?? [], {
    evidence: projection.evidence,
    parser: projection.metadata?.nativeImportLossSummary?.parser,
    scanKind: 'native-source-projection'
  });
  const universalAst = importResult.universalAst;
  const universalAstIssues = universalAst
    ? validateUniversalAstEnvelope(universalAst)
    : ['missing-universal-ast'];
  const universalAstNativeSources = universalAst?.nativeSources?.length ?? importResult.nativeSources?.length ?? (importResult.nativeSource ? 1 : 0);
  const semanticIndex = importResult.semanticIndex ?? universalAst?.semanticIndex;
  const semanticSymbols = semanticIndex?.symbols?.length ?? 0;
  const sourceMaps = importResult.sourceMaps ?? universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0);
  const projectionMatchesSourceHash = Boolean(projection.sourceHash && projection.outputHash === projection.sourceHash);
  const preservedSource = projection.mode === 'preserved-source';
  const failedEvidenceIds = uniqueStrings([
    ...importEvidence.filter((record) => record?.status === 'failed').map((record) => record.id),
    ...(projection.evidence ?? []).filter((record) => record?.status === 'failed').map((record) => record.id)
  ]);
  const blockingReasons = [
    ...(importReadiness.readiness === 'blocked' ? importReadiness.reasons : []),
    ...(projectionReadiness.readiness === 'blocked' ? projectionReadiness.reasons : []),
    ...(failedEvidenceIds.length ? [`Failed evidence prevents native roundtrip readiness: ${failedEvidenceIds.join(', ')}`] : []),
    ...(universalAstIssues.length ? [`Universal AST validation failed: ${universalAstIssues.join('; ')}`] : [])
  ];
  const reviewReasons = [
    ...(semanticSymbols === 0 ? ['Universal AST semantic index has no symbols for source projection review.'] : []),
    ...(sourceMapMappings === 0 ? ['Universal AST has no native source-map mappings for roundtrip review.'] : []),
    ...(preservedSource && !projectionMatchesSourceHash ? ['Projected source was preserved without a verified import source hash match.'] : []),
    ...importReadiness.reasons.filter((reason) => importReadiness.readiness !== 'ready' || !exactAst),
    ...projectionReadiness.reasons.filter((reason) => projectionReadiness.readiness !== 'ready')
  ];
  let status;
  if (blockingReasons.length) {
    status = 'blocked';
  } else if (projection.mode === 'native-source-stubs') {
    status = 'stub-only';
  } else if (reviewReasons.some((reason) => reason.startsWith('Universal AST')) || (preservedSource && !projectionMatchesSourceHash)) {
    status = 'needs-review';
  } else if (exactAst && preservedSource && projectionMatchesSourceHash && projectionReadiness.readiness === 'ready') {
    status = 'exact';
  } else if (preservedSource && projectionMatchesSourceHash) {
    status = 'preserved-source';
  } else {
    status = 'needs-review';
  }
  const reasons = nativeImportRoundtripReasons(status, {
    blockingReasons,
    reviewReasons,
    projection,
    importReadiness,
    projectionReadiness
  });
  return {
    kind: 'frontier.lang.nativeImportRoundtripReadiness',
    version: 1,
    status,
    semanticMergeReadiness: maxSemanticMergeReadiness(importReadiness.readiness, projectionReadiness.readiness),
    reasons,
    importReadiness,
    projectionReadiness,
    projectionMode: projection.mode,
    checks: {
      nativeImport: {
        imports: imports.length,
        exactAst,
        losses: importReadiness.summary.total,
        readiness: importReadiness.readiness
      },
      universalAst: {
        present: Boolean(universalAst),
        valid: universalAstIssues.length === 0,
        issues: universalAstIssues,
        nativeSources: universalAstNativeSources,
        semanticSymbols,
        sourceMaps: sourceMaps.length,
        sourceMapMappings
      },
      projectedSource: {
        mode: projection.mode,
        outputHash: projection.outputHash,
        expectedSourceHash: projection.sourceHash,
        sourceHashVerified: projectionMatchesSourceHash,
        declarations: projection.declarations?.length ?? 0,
        losses: projection.lossSummary?.total ?? projection.losses?.length ?? 0,
        readiness: projectionReadiness.readiness
      }
    },
    evidence: {
      importEvidenceIds: importEvidence.map((record) => record.id).filter(Boolean),
      projectionEvidenceIds: (projection.evidence ?? []).map((record) => record.id).filter(Boolean),
      failedEvidenceIds
    },
    metadata: {
      nativeImportId: importResult.id,
      universalAstId: universalAst?.id,
      projectionId: projection.id,
      sourcePath: projection.sourcePath ?? importResult.sourcePath,
      language: projection.language ?? importResult.language,
      sourcePreservationId: projection.metadata?.sourcePreservationId,
      ...options.metadata
    }
  };
}

export function createNativeImportCoverageMatrix(input = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters);
  const languages = profiles.map((profile) => nativeImportCoverageForProfile(profile, imports, adapters));
  const summary = languages.reduce((totals, entry) => {
    totals.languages += 1;
    if (entry.supportsLightweightScan) totals.lightweightScanners += 1;
    if (entry.parserAdapters.length) totals.parserAdapterSlots += entry.parserAdapters.length;
    totals.imports += entry.imports.total;
    totals.symbols += entry.imports.symbols;
    totals.sourceMaps += entry.imports.sourceMaps;
    totals.sourceMapMappings += entry.imports.sourceMapMappings;
    totals.losses += entry.imports.losses;
    totals.byReadiness[entry.imports.readiness] = (totals.byReadiness[entry.imports.readiness] ?? 0) + 1;
    for (const [kind, count] of Object.entries(entry.imports.lossKinds)) {
      totals.lossKinds[kind] = (totals.lossKinds[kind] ?? 0) + count;
    }
    totals.adapterCoverage = mergeNativeImporterAdapterCoverageAggregates(totals.adapterCoverage, entry.adapterCoverage);
    return totals;
  }, {
    languages: 0,
    lightweightScanners: 0,
    parserAdapterSlots: 0,
    imports: 0,
    symbols: 0,
    sourceMaps: 0,
    sourceMapMappings: 0,
    losses: 0,
    byReadiness: {},
    lossKinds: {},
    adapterCoverage: emptyNativeImporterAdapterCoverageAggregate()
  });
  return {
    kind: 'frontier.lang.nativeImportCoverageMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    languages,
    summary,
    metadata: {
      compileTargets: [...FrontierCompileTargets],
      projectionTargetLossClasses: [...ProjectionTargetLossClasses],
      note: 'Coverage is evidence and capability metadata, not a claim that every language feature is losslessly portable.'
    }
  };
}

export function getNativeParserAstFormatProfile(format) {
  const normalized = normalizeParserAstFormatId(format);
  return NativeParserAstFormatProfiles.find((profile) => profile.id === normalized || profile.aliases.includes(normalized));
}

export function createNativeParserAstFormatMatrix(input = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeParserAstFormatProfiles(input.formats ?? NativeParserAstFormatProfiles, imports, adapters);
  const formats = profiles.map((profile) => nativeParserAstFormatCoverageForProfile(profile, imports, adapters));
  const summary = formats.reduce((totals, entry) => {
    totals.formats += 1;
    totals.adapterSlots += entry.parserAdapters.length;
    totals.adapters += entry.adapters.total;
    totals.imports += entry.imports.total;
    totals.nativeAstNodes += entry.imports.nativeAstNodes;
    totals.symbols += entry.imports.symbols;
    totals.sourceMapMappings += entry.imports.sourceMapMappings;
    totals.losses += entry.imports.losses;
    totals.byKind[entry.kind] = (totals.byKind[entry.kind] ?? 0) + 1;
    totals.byReadiness[entry.imports.readiness] = (totals.byReadiness[entry.imports.readiness] ?? 0) + 1;
    for (const [capability, count] of Object.entries(entry.adapters.effectiveCapabilities)) {
      totals.effectiveCapabilities[capability] = (totals.effectiveCapabilities[capability] ?? 0) + count;
    }
    return totals;
  }, {
    formats: 0,
    adapterSlots: 0,
    adapters: 0,
    imports: 0,
    nativeAstNodes: 0,
    symbols: 0,
    sourceMapMappings: 0,
    losses: 0,
    byKind: {},
    byReadiness: {},
    effectiveCapabilities: {}
  });
  return {
    kind: 'frontier.lang.nativeParserAstFormatMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    formats,
    summary,
    metadata: {
      note: 'Parser AST format coverage describes normalization evidence and host-parser obligations; it is not a lossless portability claim.',
      profileIds: profiles.map((profile) => profile.id)
    }
  };
}

export function createNativeParserFeatureMatrix(input = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters);
  const parsers = nativeParserFeatureRowsForProfiles(profiles, {
    imports,
    adapters,
    requiredFeatures: input.requiredFeatures,
    minimumReadiness: input.minimumReadiness,
    includeEmptyParsers: input.includeEmptyParsers
  });
  const summary = nativeParserFeatureMatrixSummary(parsers);
  return {
    kind: 'frontier.lang.nativeParserFeatureMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    parsers,
    languages: summarizeNativeParserFeatureLanguages(profiles, parsers),
    summary,
    metadata: {
      categories: [...NativeParserFeatureCategories],
      statuses: [...NativeParserFeatureCoverageStatuses],
      requiredFeatures: normalizeNativeParserRequiredFeatures(input.requiredFeatures),
      minimumReadiness: normalizeSemanticMergeReadiness(input.minimumReadiness ?? 'ready'),
      note: 'Native parser feature coverage is admission evidence per language/parser. It does not promote lightweight scans or host adapters beyond their declared and observed capabilities.'
    }
  };
}

export function queryNativeParserFeatureMatrix(matrixOrInput = {}, query = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.nativeParserFeatureMatrix'
    ? matrixOrInput
    : createNativeParserFeatureMatrix(matrixOrInput);
  const language = normalizeNativeLanguageId(query.language);
  const parser = query.parser === undefined ? undefined : parserAstFormatIdForParser(query.parser);
  const requiredFeatures = normalizeNativeParserRequiredFeatures(query.requiredFeatures ?? matrix.metadata?.requiredFeatures);
  const minimumReadiness = normalizeSemanticMergeReadiness(query.minimumReadiness ?? matrix.metadata?.minimumReadiness ?? 'ready');
  const row = matrix.parsers.find((entry) => {
    if (language && normalizeNativeLanguageId(entry.language) !== language && !(entry.aliases ?? []).map(normalizeNativeLanguageId).includes(language)) {
      return false;
    }
    if (!parser) return true;
    const parserIds = [
      entry.parser,
      entry.parserFormat,
      ...(entry.parserAliases ?? []),
      ...(entry.parserAdapters ?? [])
    ].map(parserAstFormatIdForParser);
    return parserIds.includes(parser);
  });
  const merge = row
    ? nativeParserFeatureMergeAssessment(row, { requiredFeatures, minimumReadiness })
    : {
      mergeReady: false,
      readiness: 'blocked',
      requiredFeatures,
      minimumReadiness,
      blockingFeatures: requiredFeatures,
      reviewFeatures: [],
      reasons: [`No native parser feature coverage row matched language=${query.language ?? '*'} parser=${query.parser ?? '*'}.`]
    };
  return {
    kind: 'frontier.lang.nativeParserFeatureQuery',
    version: 1,
    found: Boolean(row),
    language: row?.language ?? language,
    parser: row?.parser ?? parser,
    row,
    merge
  };
}

export function createProjectionTargetLossMatrix(input = {}) {
  const imports = input.imports ?? [];
  const adapters = input.adapters ?? [];
  const targetAdapters = input.targetAdapters ?? [];
  const profiles = mergeNativeImportProfiles(input.languages ?? NativeImportLanguageProfiles, imports, adapters, targetAdapters);
  const targets = normalizeProjectionMatrixTargets(input.targets ?? FrontierCompileTargets);
  const languages = profiles.map((profile) => projectionTargetCoverageForProfile(profile, {
    imports,
    adapters,
    targetAdapters,
    targets
  }));
  const summary = projectionTargetLossMatrixSummary(languages);
  return {
    kind: 'frontier.lang.projectionTargetLossMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    languages,
    summary,
    metadata: {
      compileTargets: targets,
      lossClasses: [...ProjectionTargetLossClasses],
      note: 'Projection target coverage separates exact source preservation, declaration stubs, host-owned target adapters, known unsupported target features, and missing native-to-target adapters.'
    }
  };
}

export function createNativeSourcePreservation(options) {
  if (!options || typeof options.sourceText !== 'string') {
    throw new Error('createNativeSourcePreservation requires sourceText');
  }
  const language = options.language ?? 'source';
  const sourceText = options.sourceText;
  const computedSourceHash = hashSemanticValue(sourceText);
  const declaredSourceHash = options.sourceHash;
  const sourceHash = computedSourceHash;
  const tokensAndTrivia = scanPreservedSourceTokens(sourceText, {
    language,
    sourcePath: options.sourcePath,
    sourceHash,
    includeTokens: options.includeTokens !== false,
    includeTrivia: options.includeTrivia !== false,
    maxTokens: options.maxTokens,
    maxTrivia: options.maxTrivia
  });
  const directiveScan = options.includeDirectives === false
    ? { directives: [], truncated: false }
    : scanPreservedSourceDirectives(sourceText, {
      language,
      sourcePath: options.sourcePath,
      sourceHash,
      maxDirectives: options.maxDirectives
    });
  const directives = directiveScan.directives;
  const newline = detectNewlineStyle(sourceText);
  return {
    kind: 'frontier.lang.nativeSourcePreservation',
    version: 1,
    id: options.id ?? `native_source_preservation_${idFragment(options.sourcePath ?? language)}_${idFragment(sourceHash)}`,
    language,
    sourcePath: options.sourcePath,
    sourceHash,
    sourceBytes: Buffer.byteLength(sourceText, options.encoding ?? 'utf8'),
    lineCount: sourceText.length ? sourceText.split(/\r\n|\r|\n/).length : 0,
    newline,
    encoding: options.encoding ?? 'utf8',
    ...(options.includeSourceText === false ? {} : { sourceText }),
    tokens: tokensAndTrivia.tokens,
    trivia: tokensAndTrivia.trivia,
    directives,
    summary: {
      tokens: tokensAndTrivia.tokens.length,
      trivia: tokensAndTrivia.trivia.length,
      directives: directives.length,
      comments: tokensAndTrivia.trivia.filter((entry) => entry.kind === 'comment').length,
      whitespace: tokensAndTrivia.trivia.filter((entry) => entry.kind === 'whitespace' || entry.kind === 'newline').length,
      exactSourceAvailable: options.includeSourceText !== false,
      truncated: tokensAndTrivia.truncated || directiveScan.truncated
    },
    metadata: {
      preservation: 'source-text-token-trivia-directive-evidence',
      tokenization: 'frontier-lightweight-lexical-scan',
      ...(declaredSourceHash ? {
        declaredSourceHash,
        sourceHashVerified: declaredSourceHash === computedSourceHash
      } : {}),
      ...options.metadata
    }
  };
}

export function createSemanticImportSidecar(importResult, options = {}) {
  const imports = Array.isArray(importResult?.imports) ? importResult.imports : [importResult].filter(Boolean);
  const importEntries = imports.map((imported, index) => semanticImportSidecarEntry(imported, index, options));
  const symbols = importEntries.flatMap((entry) => entry.symbols);
  const ownershipRegions = uniqueRecordsById(importEntries.flatMap((entry) => entry.ownershipRegions));
  const sourceMaps = imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  const losses = imports.flatMap((imported) => imported?.losses ?? []);
  const evidence = uniqueRecordsById(imports.flatMap((imported) => imported?.evidence ?? []));
  const mergeCandidates = imports.flatMap((imported) => imported?.mergeCandidates ?? []);
  const lossSummary = summarizeNativeImportLosses(losses, { evidence });
  const regionTaxonomy = summarizeSemanticImportRegionTaxonomy(ownershipRegions);
  const sourcePreservation = summarizeKernelSourcePreservation(importResult, imports);
  const universalAstLayers = summarizeSemanticImportSidecarUniversalAstLayers(importEntries);
  const proofSpec = summarizeSemanticImportSidecarProofSpec(importEntries);
  const readiness = mergeCandidates.reduce(
    (current, candidate) => maxSemanticMergeReadiness(current, candidate.readiness),
    lossSummary.semanticMergeReadiness
  );
  const patchHints = ownershipRegions.map((region) => semanticPatchHintForRegion(region, readiness, options));
  return {
    kind: 'frontier.lang.semanticImportSidecar',
    version: 1,
    id: options.id ?? `semantic_import_${idFragment(importResult?.id ?? importResult?.projectRoot ?? imports[0]?.sourcePath ?? imports[0]?.language ?? 'source')}`,
    generatedAt: options.generatedAt ?? Date.now(),
    language: importResult?.language ?? (imports.length === 1 ? imports[0]?.language : 'mixed'),
    projectRoot: importResult?.projectRoot,
    imports: importEntries.map(({ ownershipRegions: _regions, symbols: _symbols, ...entry }) => entry),
    symbols,
    ownershipRegions,
    sourceMaps: {
      total: sourceMaps.length,
      mappings: sourceMapMappings.length,
      ids: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean)
    },
    sourcePreservation,
    universalAstLayers,
    proofSpec,
    patchHints,
    mergeCandidates: mergeCandidates.map((candidate) => ({
      id: candidate.id,
      readiness: candidate.readiness,
      reasons: candidate.reasons ?? [],
      risk: candidate.risk,
      operationCount: candidate.operations?.length ?? candidate.patch?.operations?.length ?? 0
    })),
    losses: {
      total: losses.length,
      byKind: lossSummary.byKind,
      bySeverity: lossSummary.bySeverity,
      categories: lossSummary.categories,
      blockingLossIds: lossSummary.blockingLossIds,
      reviewLossIds: lossSummary.reviewLossIds
    },
    regionTaxonomy,
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record.status === 'failed').map((record) => record.id),
      ids: evidence.map((record) => record.id)
    },
    summary: {
      imports: imports.length,
      symbols: symbols.length,
      ownershipRegions: ownershipRegions.length,
      regionKinds: regionTaxonomy.presentKinds.length,
      sourceMapMappings: sourceMapMappings.length,
      sourcePreservationRecords: sourcePreservation.total,
      universalAstLayers: universalAstLayers.total,
      universalAstLayerNames: universalAstLayers.names,
      proofSpecRecords: proofSpec.total,
      proofSpecObligations: proofSpec.obligations,
      proofSpecFailedObligations: proofSpec.failed,
      readiness,
      emptySemanticIndex: symbols.length === 0
    },
    metadata: {
      note: 'Sidecar is source-addressable semantic evidence for merge admission; lightweight scanner regions remain review-required unless exact parser evidence upgrades readiness.',
      ...options.metadata
    }
  };
}

export function createNativeImportResultContract(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('createNativeImportResultContract requires a native import result');
  }
  const imports = nativeImportEntries(importResult);
  const evidence = uniqueByEvidenceId([
    ...(importResult.evidence ?? []),
    ...imports.flatMap((imported) => imported?.evidence ?? [])
  ]);
  const losses = uniqueByLossId([
    ...(importResult.losses ?? []),
    ...imports.flatMap((imported) => imported?.losses ?? imported?.nativeAst?.losses ?? [])
  ]);
  const sourceMaps = collectImportSourceMaps(importResult, imports);
  const regionSummary = summarizeImportRegions(importResult, imports, options);
  const sourceMapSummary = summarizeImportSourceMaps(sourceMaps);
  const sourcePreservation = summarizeImportSourcePreservation(importResult, imports);
  const adapterCoverage = summarizeImportAdapterCoverage(importResult, imports);
  const primary = imports[0] ?? importResult;
  const nativeSource = importResult.nativeSource ?? importResult.nativeSources?.[0] ?? primary?.nativeSource;
  const nativeAst = importResult.nativeAst ?? nativeSource?.ast ?? primary?.nativeAst ?? primary?.nativeSource?.ast;
  const semanticIndex = importResult.semanticIndex ?? importResult.universalAst?.semanticIndex ?? primary?.semanticIndex ?? primary?.universalAst?.semanticIndex;
  const lossSummary = options.lossSummary ?? importResult.metadata?.nativeImportLossSummary ?? summarizeNativeImportLosses(losses, {
    evidence,
    parser: nativeAst?.parser,
    scanKind: importResult.metadata?.scanKind,
    semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus
  });
  const mergeCandidates = [
    ...(importResult.mergeCandidates ?? []),
    ...imports.flatMap((imported) => imported?.mergeCandidates ?? [])
  ];
  const readiness = summarizeImportContractReadiness(importResult, mergeCandidates, lossSummary);
  const defaultSidecarId = defaultSemanticImportSidecarId(importResult, imports);
  return {
    kind: 'frontier.lang.nativeImportResultContract',
    version: 1,
    importResultId: importResult.id,
    language: importResult.language ?? (imports.length === 1 ? imports[0]?.language : 'mixed'),
    sourcePath: importResult.sourcePath ?? primary?.sourcePath ?? nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: nativeSource?.sourceHash ?? nativeAst?.sourceHash,
    sourceCount: imports.length,
    sources: imports.map((imported, index) => compactImportContractSource(imported, index)),
    ids: {
      nativeSourceId: nativeSource?.id,
      nativeAstId: nativeAst?.id,
      semanticIndexId: semanticIndex?.id,
      universalAstId: importResult.universalAst?.id ?? primary?.universalAst?.id,
      patchId: importResult.patch?.id,
      sourceMapIds: sourceMapSummary.ids,
      semanticSidecarIds: uniqueStrings([
        ...normalizeStringList(options.semanticSidecarIds ?? options.sidecarIds ?? options.sidecarId),
        defaultSidecarId
      ])
    },
    sourcePreservation,
    adapterCoverage,
    lossSummary,
    regions: regionSummary,
    sourceMaps: sourceMapSummary,
    readiness,
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record?.status === 'failed').map((record) => record.id).filter(Boolean),
      ids: evidence.map((record) => record.id).filter(Boolean)
    },
    metadata: {
      parser: nativeAst?.parser,
      semanticStatus: importResult.metadata?.semanticStatus ?? importResult.universalAst?.metadata?.semanticStatus,
      projectRoot: importResult.projectRoot,
      defaultSemanticSidecarId: defaultSidecarId,
      note: 'Contract summarizes import-result evidence for merge admission; it does not upgrade lightweight scans into exact semantic imports.',
      ...options.metadata
    }
  };
}

export function createEstreeNativeImporterAdapter(options = {}) {
  return createJavaScriptSyntaxImporterAdapter({
    id: 'frontier.estree-native-importer',
    language: 'javascript',
    parser: 'estree',
    supportedExtensions: ['.js', '.mjs', '.cjs', '.jsx'],
    astFormat: 'estree',
    ...options
  });
}

export function createBabelNativeImporterAdapter(options = {}) {
  return createJavaScriptSyntaxImporterAdapter({
    id: 'frontier.babel-native-importer',
    language: 'javascript',
    parser: 'babel',
    supportedExtensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'],
    astFormat: 'babel',
    defaultParserOptions: {
      errorRecovery: true,
      ranges: true,
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx']
    },
    ...options
  });
}

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

export function createPythonAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.python-ast-native-importer',
    language: options.language ?? 'python',
    parser: options.parser ?? 'python-ast',
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
        'Normalizes caller-owned Python stdlib ast trees into native AST nodes and declaration-level semantic index records.',
        'Python ast does not preserve comments, whitespace, or concrete formatting; use LibCST/parso-style host evidence for round-trip trivia.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.py', '.pyi'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? options.ast
        ?? parsePythonAstSource(input, options);
      const root = pythonAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'python-ast',
          adapterId: options.id ?? 'frontier.python-ast-native-importer',
          message: 'createPythonAstNativeImporterAdapter requires an injected Python AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'python-ast'
      });
      return createNativeImportFromPythonAst(root, input, {
        parser: options.parser ?? 'python-ast',
        astFormat: 'python-ast',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        pythonVersion: options.pythonVersion ?? input.options?.pythonVersion ?? parsed?.pythonVersion,
        includeAttributes: options.includeAttributes ?? input.options?.includeAttributes
      });
    }
  };
}

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

export function createClangAstNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? 'frontier.clang-ast-native-importer',
    language: options.language ?? 'c',
    parser: options.parser ?? 'clang',
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
        'Normalizes caller-owned Clang -ast-dump=json shaped ASTs into native AST nodes and declaration-level semantic index records.',
        'Clang JSON ASTs reflect a preprocessed compiler view; compile commands, macros, inactive preprocessor branches, comments/trivia, and full type/reference analysis require host evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? ['.c', '.h', '.cc', '.cpp', '.cxx', '.hpp', '.hh'],
    diagnostics: options.diagnostics,
    parse(input) {
      const parsed = input.options?.ast
        ?? input.options?.nativeAst
        ?? input.options?.translationUnit
        ?? input.options?.tu
        ?? options.ast
        ?? options.translationUnit
        ?? options.tu
        ?? parseClangAstSource(input, options);
      const root = clangAstRoot(parsed);
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parser ?? 'clang',
          adapterId: options.id ?? 'frontier.clang-ast-native-importer',
          message: 'createClangAstNativeImporterAdapter requires an injected Clang JSON AST object, parserModule.parse function, parse function, or adapterOptions.ast.'
        });
      }
      const parseDiagnostics = normalizeParserErrors(parsed?.errors ?? parsed?.diagnostics, input, {
        parser: options.parser ?? 'clang'
      });
      return createNativeImportFromClangAst(root, input, {
        parser: options.parser ?? 'clang',
        astFormat: 'clang-ast-json',
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics,
        cStandard: options.cStandard ?? input.options?.cStandard ?? parsed?.cStandard,
        compileFlags: options.compileFlags ?? input.options?.compileFlags ?? parsed?.compileFlags,
        includeSystemHeaders: options.includeSystemHeaders ?? input.options?.includeSystemHeaders,
        preprocessorRecords: input.options?.preprocessorRecords ?? options.preprocessorRecords ?? parsed?.preprocessorRecords,
        includeGraph: input.options?.includeGraph ?? options.includeGraph ?? parsed?.includeGraph
      });
    }
  };
}

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

export function createTreeSitterNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? `frontier.tree-sitter-${idFragment(options.language ?? 'source')}-native-importer`,
    language: options.language ?? 'source',
    parser: options.parserName ?? options.parser ?? 'tree-sitter',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
    coverage: nativeImporterAdapterCoverage({
      exactness: 'parser-tree',
      exactAst: true,
      tokens: false,
      trivia: false,
      diagnostics: true,
      sourceRanges: true,
      generatedRanges: false,
      semanticCoverage: declarationSemanticCoverage(),
      notes: [
        'Normalizes a caller-owned tree-sitter tree into native AST nodes and declaration-level semantic index records.',
        'The built-in wrapper walks named syntax nodes; exact token/trivia streams and generated ranges require adapter-specific evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions ?? [],
    diagnostics: options.diagnostics,
    parse(input) {
      const tree = input.options?.tree ?? options.tree ?? parseTreeSitterSource(input, options);
      const root = tree?.rootNode ?? tree;
      if (!root) {
        return missingInjectedParserResult(input, {
          parser: options.parserName ?? options.parser ?? 'tree-sitter',
          adapterId: options.id ?? `frontier.tree-sitter-${idFragment(options.language ?? input.language)}-native-importer`,
          message: 'createTreeSitterNativeImporterAdapter requires an injected tree-sitter parser/tree or adapterOptions.tree.'
        });
      }
      return createNativeImportFromTreeSitter(root, input, {
        parser: options.parserName ?? options.parser ?? 'tree-sitter',
        astFormat: 'tree-sitter',
        maxNodes: options.maxNodes
      });
    }
  };
}

export async function importNativeProject(input = {}) {
  const sources = input.sources ?? [];
  const adapters = input.adapters ?? [];
  const imports = [];
  for (const [index, source] of sources.entries()) {
    const adapter = source.adapter && typeof source.adapter === 'object'
      ? source.adapter
      : resolveNativeProjectAdapter(source, adapters, input);
    if (adapter) {
      imports.push(await runNativeImporterAdapter(adapter, {
        ...source,
        adapterOptions: source.adapterOptions ?? input.adapterOptions,
        adapterMetadata: {
          projectImportId: input.id,
          sourceIndex: index,
          ...input.adapterMetadata,
          ...source.adapterMetadata
        }
      }));
    } else {
      imports.push(importNativeSource(source));
    }
  }
  return createNativeProjectImportResult(input, imports);
}

export async function runNativeImporterAdapter(adapter, input = {}) {
  const summary = normalizeNativeImporterAdapter(adapter);
  const language = input.language ?? summary.language;
  const parser = input.parser ?? summary.parser;
  const parserVersion = input.parserVersion ?? summary.version;
  const sourceText = input.sourceText ?? '';
  const sourceHash = input.sourceHash ?? hashSemanticValue(sourceText);
  const parseInput = {
    sourceText,
    sourcePath: input.sourcePath,
    sourceHash,
    language,
    parser,
    parserVersion,
    adapterId: summary.id,
    adapterVersion: summary.version,
    options: input.adapterOptions ?? {},
    metadata: input.adapterMetadata ?? {}
  };
  let parsed;
  let thrownDiagnostic;
  try {
    parsed = await adapter.parse(parseInput);
  } catch (error) {
    thrownDiagnostic = {
      severity: 'error',
      code: 'adapter.parse.threw',
      phase: 'parse',
      kind: 'unsupportedSyntax',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        errorName: error instanceof Error ? error.name : undefined
      }
    };
    parsed = {
      rootId: 'adapter_error_root',
      nodes: {
        adapter_error_root: {
          id: 'adapter_error_root',
          kind: 'AdapterParseError',
          languageKind: `${language}.adapterParseError`,
          value: thrownDiagnostic.message,
          metadata: { adapterId: summary.id, parser }
        }
      }
    };
  }
  const parseResult = parsed ?? {};
  const diagnostics = [
    ...normalizeAdapterDiagnostics(summary.diagnostics, summary, parseInput, 'adapter'),
    ...(thrownDiagnostic ? normalizeAdapterDiagnostics([thrownDiagnostic], summary, parseInput, 'throw') : []),
    ...normalizeAdapterDiagnostics(parseResult.diagnostics, summary, parseInput, 'parse')
  ];
  const losses = mergeNativeLosses(
    parseResult.losses,
    diagnostics.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, summary, parseInput))
  );
  const adapterSummary = {
    ...summary,
    coverage: observeNativeImporterAdapterCoverage(summary.coverage, parseResult, {
      diagnostics,
      losses
    })
  };
  const sourceEvidence = adapterDiagnosticsEvidence(adapterSummary, diagnostics, {
    language,
    parser,
    parserVersion,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash
  });
  const evidence = [...(parseResult.evidence ?? []), sourceEvidence];
  const importInput = {
    ...input,
    ...parseResult,
    language,
    parser,
    parserVersion,
    sourceText,
    sourcePath: parseResult.sourcePath ?? input.sourcePath,
    sourceHash: parseResult.sourceHash ?? sourceHash,
    losses,
    evidence,
    metadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      adapterCapabilities: adapterSummary.capabilities,
      adapterCoverage: adapterSummary.coverage,
      supportedExtensions: adapterSummary.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      ...input.metadata,
      ...parseResult.metadata
    },
    nativeAstMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      adapterCoverage: adapterSummary.coverage,
      ...input.nativeAstMetadata,
      ...parseResult.nativeAstMetadata
    },
    nativeSourceMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      adapterCoverage: adapterSummary.coverage,
      ...input.nativeSourceMetadata,
      ...parseResult.nativeSourceMetadata
    },
    documentMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.documentMetadata,
      ...parseResult.documentMetadata
    },
    universalAstMetadata: {
      nativeImporterAdapterId: summary.id,
      nativeImporterAdapterVersion: summary.version,
      ...input.universalAstMetadata,
      ...parseResult.universalAstMetadata
    }
  };
  return {
    ...importNativeSource(importInput),
    adapter: adapterSummary,
    diagnostics
  };
}

export function runNativeTargetProjectionAdapter(adapter, input = {}) {
  const summary = normalizeNativeTargetProjectionAdapter(adapter);
  const sourceLanguage = normalizeNativeLanguageId(input.sourceLanguage ?? summary.sourceLanguage);
  const target = normalizeProjectionMatrixTargets([input.target ?? summary.target])[0] ?? summary.target;
  const diagnosticContext = {
    sourcePath: input.importResult?.sourcePath ?? input.importResult?.nativeSource?.sourcePath,
    sourceHash: input.importResult?.sourceHash ?? input.importResult?.nativeSource?.sourceHash,
    language: sourceLanguage,
    parser: `target:${target}`,
    parserVersion: summary.version
  };
  const projectInput = {
    importResult: input.importResult,
    sourceProjection: input.sourceProjection,
    sourceLanguage,
    target,
    targetPath: input.targetPath,
    targetCoverage: input.targetCoverage,
    options: input.options ?? {},
    metadata: input.metadata ?? {}
  };
  let projected;
  let thrownDiagnostic;
  try {
    projected = adapter.project(projectInput) ?? {};
  } catch (error) {
    thrownDiagnostic = {
      severity: 'error',
      code: 'targetAdapter.project.threw',
      phase: 'emit',
      kind: 'targetProjectionLoss',
      message: error instanceof Error ? error.message : String(error),
      metadata: {
        errorName: error instanceof Error ? error.name : undefined
      }
    };
    projected = {};
  }
  const diagnostics = [
    ...normalizeAdapterDiagnostics(summary.diagnostics, summary, diagnosticContext, 'target-adapter'),
    ...(thrownDiagnostic ? normalizeAdapterDiagnostics([thrownDiagnostic], summary, diagnosticContext, 'throw') : []),
    ...normalizeAdapterDiagnostics(projected.diagnostics, summary, diagnosticContext, 'project')
  ];
  const output = typeof projected.output === 'string' ? projected.output : input.sourceProjection?.sourceText ?? '';
  const outputHash = projected.outputHash ?? hashSemanticValue(output);
  const adapterEvidence = nativeTargetProjectionAdapterEvidence(summary, diagnostics, {
    ...diagnosticContext,
    sourceLanguage,
    target,
    outputHash,
    targetPath: input.targetPath
  });
  const evidence = uniqueByEvidenceId([
    ...(projected.evidence ?? []),
    adapterEvidence
  ]);
  const losses = uniqueByLossId([
    ...(projected.losses ?? []),
    ...diagnostics.map((diagnostic, index) => nativeTargetProjectionDiagnosticToLoss(diagnostic, index, summary, {
      ...diagnosticContext,
      sourceLanguage,
      target
    }))
  ]);
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: diagnosticContext.parser,
    scanKind: 'native-target-projection',
    semanticStatus: input.importResult?.metadata?.semanticStatus
  });
  const classifiedReadiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: diagnosticContext.parser,
    scanKind: 'native-target-projection',
    semanticStatus: input.importResult?.metadata?.semanticStatus
  });
  const declaredReadiness = normalizeSemanticMergeReadiness(projected.readiness ?? summary.coverage.readiness);
  const readiness = declaredReadiness
    ? {
      ...classifiedReadiness,
      readiness: maxSemanticMergeReadiness(classifiedReadiness.readiness, declaredReadiness),
      reasons: uniqueStrings([
        ...classifiedReadiness.reasons,
        ...(declaredReadiness === classifiedReadiness.readiness ? [] : [`Target adapter declared readiness ${declaredReadiness}.`])
      ])
    }
    : classifiedReadiness;
  return {
    kind: 'frontier.lang.nativeTargetProjection',
    version: 1,
    id: projected.id ?? `native_target_projection_${idFragment(summary.id)}_${idFragment(sourceLanguage)}_${idFragment(target)}`,
    sourceLanguage,
    target,
    targetPath: input.targetPath,
    adapter: summary,
    output,
    outputHash,
    outputMode: 'target-adapter',
    sourceMaps: projected.sourceMaps ?? [],
    losses,
    lossSummary,
    readiness,
    evidence,
    diagnostics: diagnostics.map(serializableDiagnostic),
    metadata: {
      importId: input.importResult?.id,
      projectionId: input.sourceProjection?.id,
      targetCoverageLossClass: input.targetCoverage?.lossClass,
      targetCoverageReadiness: input.targetCoverage?.readiness,
      ...projected.metadata
    }
  };
}

export function projectNativeImportToSource(importResult, options = {}) {
  if (!importResult || typeof importResult !== 'object') {
    throw new Error('projectNativeImportToSource requires a native import result');
  }
  const context = nativeImportProjectionContext(importResult, options);
  const candidateSource = nativeProjectionSourceCandidate(context, options);
  const declarations = nativeProjectionDeclarations(importResult, context);
  const preserveSource = options.preferPreservedSource !== false && candidateSource?.exact === true;
  const mode = preserveSource ? 'preserved-source' : 'native-source-stubs';
  const sourceText = preserveSource
    ? candidateSource.sourceText
    : renderNativeProjectionStubs(context, declarations, options);
  const losses = preserveSource ? [] : nativeProjectionStubLosses(context, candidateSource, declarations, options);
  const evidence = [{
    id: options.evidenceId ?? `evidence_${context.idPart}_native_source_projection`,
    kind: 'projection',
    status: losses.some((loss) => loss.severity === 'error') ? 'failed' : 'passed',
    path: context.sourcePath,
    summary: preserveSource
      ? `Preserved exact ${context.language} source for native projection.`
      : `Projected ${context.language} native import to ${declarations.length} declaration stub(s).`,
    metadata: {
      mode,
      language: context.language,
      sourcePath: context.sourcePath,
      expectedSourceHash: context.sourceHash,
      providedSourceHash: candidateSource?.sourceHash,
      sourcePreservationId: candidateSource?.sourcePreservationId,
      sourceHashVerified: candidateSource?.hashVerified ?? false,
      declarationCount: declarations.length
    }
  }];
  const lossSummary = summarizeNativeImportLosses(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'native-source-projection',
    semanticStatus: context.semanticStatus
  });
  const readiness = classifyNativeImportReadiness(losses, {
    evidence,
    parser: context.parser,
    scanKind: 'native-source-projection',
    semanticStatus: context.semanticStatus
  });
  const nativeImportLossSummary = importResult.metadata?.nativeImportLossSummary ?? summarizeNativeImportLosses(importResult.losses ?? context.nativeAst?.losses ?? [], {
    evidence: importResult.evidence,
    parser: context.parser,
    semanticStatus: context.semanticStatus
  });
  return {
    kind: 'frontier.lang.nativeSourceProjection',
    version: 1,
    id: options.id ?? `native_source_projection_${context.idPart}`,
    language: context.language,
    sourcePath: context.sourcePath,
    sourceHash: context.sourceHash,
    mode,
    sourceText,
    outputHash: hashSemanticValue(sourceText),
    declarations,
    losses,
    lossSummary,
    readiness,
    evidence,
    metadata: {
      nativeImportId: importResult.id,
      nativeSourceId: context.nativeSource?.id,
      nativeAstId: context.nativeAst?.id,
      semanticIndexId: context.semanticIndex?.id,
      universalAstId: importResult.universalAst?.id,
      exactSourceAvailable: candidateSource?.exact === true,
      sourceTextAvailable: typeof candidateSource?.sourceText === 'string',
      sourcePreservationId: candidateSource?.sourcePreservationId,
      sourceHashVerified: candidateSource?.hashVerified ?? false,
      nativeImportLossSummary,
      ...options.metadata
    }
  };
}

export function importNativeSource(input) {
  const language = input.language ?? input.nativeAst?.language;
  if (!language) throw new Error('importNativeSource requires a language or nativeAst.language');
  const sourcePath = input.sourcePath ?? input.nativeAst?.sourcePath;
  const declaredSourceHash = input.sourceHash ?? input.nativeAst?.sourceHash;
  const sourceHash = typeof input.sourceText === 'string'
    ? hashSemanticValue(input.sourceText)
    : declaredSourceHash ?? hashSemanticValue(input.nativeAst?.nodes ?? input.nativeAst ?? {});
  const targetPath = input.targetPath ?? input.target?.emitPath;
  const targetHash = input.targetHash;
  const importIdPart = idFragment(input.id ?? input.nativeSourceId ?? sourcePath ?? language);
  const sourcePreservation = input.sourcePreservation ?? (typeof input.sourceText === 'string'
    ? createNativeSourcePreservation({
      language,
      sourcePath,
      sourceHash: declaredSourceHash,
      sourceText: input.sourceText,
      metadata: { importIdPart }
    })
    : undefined);
  const lightweight = !input.nativeAst && !input.nodes && input.sourceText
    ? createLightweightNativeImport({
      language,
      sourceText: input.sourceText,
      sourcePath,
      sourceHash,
      parser: input.parser,
      sourcePreservation
    })
    : undefined;
  const nativeAst = input.nativeAst ?? createNativeAstRecord({
    id: input.nativeAstId ?? `native_ast_${importIdPart}`,
    language,
    parser: input.parser ?? lightweight?.parser,
    parserVersion: input.parserVersion,
    sourcePath,
    sourceHash,
    rootId: input.rootId ?? lightweight?.rootId ?? 'native_root',
    nodes: input.nodes ?? lightweight?.nodes ?? {
      native_root: {
        id: 'native_root',
        kind: 'Unknown',
        languageKind: `${language}.unknown`,
        value: null,
        metadata: { reason: 'no-native-ast-nodes-provided' }
      }
    },
    losses: input.losses ?? lightweight?.losses,
    metadata: {
      ...(input.sourceText ? { sourceBytes: input.sourceText.length } : {}),
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary,
        sourcePreservation
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...lightweight?.metadata,
      ...input.nativeAstMetadata
    }
  });
  const frontierNodeIds = input.frontierNodeIds ?? input.semanticNodes?.map((node) => node.id) ?? [];
  const semanticNodes = input.semanticNodes ?? [];
  const semanticStatus = input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only');
  const nativeAstExact = hasNativeExactAstEvidence(input, nativeAst, lightweight);
  const baseLosses = normalizeNativeLossRecords(input.losses ?? nativeAst.losses ?? lightweight?.losses ?? []);
  const losses = normalizeNativeLossRecords([
    ...baseLosses,
    ...unverifiedNativeAstLosses(input, nativeAst, {
      importIdPart,
      exactAst: nativeAstExact,
      hasLosses: baseLosses.length > 0,
      lightweight
    })
  ]);
  const nativeSource = nativeSourceNode({
    id: input.nativeSourceId ?? `native_source_${importIdPart}`,
    name: input.name ?? sourcePath?.split(/[\\/]/).filter(Boolean).at(-1) ?? `${language}NativeSource`,
    language,
    parser: input.parser ?? nativeAst.parser,
    parserVersion: input.parserVersion ?? nativeAst.parserVersion,
    sourcePath,
    sourceHash,
    symbol: input.symbol,
    ast: nativeAst,
    frontierNodeIds,
    losses,
    target: input.target,
    metadata: {
      semanticStatus,
      mappings: input.mappings ?? [],
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...input.nativeSourceMetadata
    }
  });
  const document = createDocument({
    id: input.documentId ?? `document_${importIdPart}`,
    name: input.documentName ?? nativeSource.name,
    nodes: [...semanticNodes, nativeSource],
    rootIds: input.rootIds,
    metadata: {
      sourceLanguage: language,
      semanticStatus,
      ...input.documentMetadata
    }
  });
  const baseEvidence = input.evidence ?? [{
    id: input.evidenceId ?? `evidence_${importIdPart}_import`,
    kind: 'import',
    status: losses.some((loss) => loss.severity === 'error') ? 'failed' : 'passed',
    path: sourcePath,
    summary: `Imported ${language} native source with ${Object.keys(nativeAst.nodes).length} native AST node(s), ${semanticNodes.length} semantic node(s), and ${losses.length} loss record(s).`,
    metadata: {
      parser: nativeAst.parser,
      sourcePath,
      semanticStatus,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : {})
      ,
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {})
    }
  }];
  const lossSummary = summarizeNativeImportLosses(losses, {
    exactAst: nativeAstExact,
    evidence: baseEvidence,
    parser: nativeAst.parser,
    scanKind: lightweight?.metadata?.scanKind,
    semanticStatus
  });
  const evidence = attachNativeImportLossSummary(baseEvidence, lossSummary);
  const semanticIndex = input.semanticIndex ?? lightweight?.semanticIndex;
  const sourceMapMappings = normalizeSourceMapMappings(
    input.mappings ?? lightweight?.mappings ?? inferSourceMapMappings({
      semanticIndex,
      nativeAst,
      nativeSource,
      evidence
    }),
    {
      semanticIndex,
      nativeAst,
      nativeSource,
      evidence,
      losses,
      sourcePreservation,
      target: input.target,
      targetPath,
      targetHash
    }
  );
  const inferredTargetPath = targetPath ?? commonGeneratedTargetPath(sourceMapMappings);
  const inferredSourceMaps = sourceMapMappings.length
    ? [createSourceMapRecord({
      id: input.sourceMapId ?? `source_map_${importIdPart}`,
      sourcePath,
      sourceHash,
      target: input.target,
      targetPath: inferredTargetPath,
      targetHash,
      semanticIndexId: semanticIndex?.id,
      nativeAstId: nativeAst.id,
      nativeSourceId: nativeSource.id,
      mappings: sourceMapMappings,
      evidence,
      metadata: {
        sourceLanguage: language,
        parser: nativeAst.parser,
        semanticStatus
      }
    })]
    : [];
  const sourceMaps = normalizeSourceMaps(input.sourceMaps ?? inferredSourceMaps, {
    document,
    nativeSources: [nativeSource],
    nativeAst,
    nativeSource,
    semanticIndex,
    evidence,
    losses,
    sourcePreservation,
    target: input.target,
    targetPath: inferredTargetPath,
    targetHash,
    sourcePath,
    sourceHash,
    defaultSourceMapId: `source_map_${importIdPart}`
  });
  const sourcePreservationRecords = createKernelSourcePreservationRecords({
    idPart: importIdPart,
    language,
    sourcePath,
    sourceHash,
    sourcePreservation,
    sourceMaps,
    losses,
    evidence,
    nativeSource,
    nativeAst,
    semanticIndex
  });
  const kernelSourcePreservationSummary = summarizeKernelSourcePreservationRecords(sourcePreservationRecords);
  const resultSourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap.mappings ?? []);
  const universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${importIdPart}`,
    document,
    nativeSources: [nativeSource],
    semanticIndex,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      semanticStatus,
      nativeImportLossSummary: lossSummary,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(sourcePreservationRecords.length ? {
        sourcePreservationRecords,
        kernelSourcePreservationRecords: sourcePreservationRecords,
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      ...input.universalAstMetadata
    }
  });
  const patch = input.patch ?? createPatch({
    id: input.patchId ?? `patch_${importIdPart}_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeSource',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.length ? 'medium' : 'low',
    operations: [...semanticNodes, nativeSource].map((node) => ({
      op: 'upsertNode',
      node,
      touches: [{ id: node.id, access: node.kind === 'nativeSource' ? 'evidence' : 'schema' }]
    })),
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : {}),
      ...(sourcePreservationRecords.length ? {
        kernelSourcePreservationRecordIds: sourcePreservationRecords.map((record) => record.id),
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      nativeImportLossSummary: lossSummary
    }
  });
  const importResult = createImportResult({
    id: input.id ?? `import_${importIdPart}`,
    language,
    sourcePath,
    document,
    patch,
    nativeAst,
    semanticIndex,
    universalAst,
    sourceMaps,
    losses,
    evidence,
    metadata: {
      nativeSourceId: nativeSource.id,
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      semanticStatus,
      mappings: resultSourceMapMappings,
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
      } : {}),
      ...(sourcePreservationRecords.length ? {
        sourcePreservationRecords,
        kernelSourcePreservationRecords: sourcePreservationRecords,
        kernelSourcePreservationSummary
      } : {}),
      ...(declaredSourceHash && declaredSourceHash !== sourceHash ? {
        declaredSourceHash,
        sourceHashVerified: false
      } : {}),
      nativeImportLossSummary: lossSummary,
      ...input.metadata
    }
  });
  return {
    ...withNativeImportReadiness(importResult, lossSummary),
    nativeSource
  };
}

export function diffNativeSources(input) {
  const language = input.language ?? input.before?.language ?? input.after?.language;
  if (!language) throw new Error('diffNativeSources requires a language');
  const sourcePath = input.sourcePath ?? input.before?.sourcePath ?? input.after?.sourcePath;
  return diffNativeSourceImports({
    ...input,
    before: input.before ?? (input.beforeSourceText === undefined ? undefined : {
      language,
      sourcePath,
      sourceText: input.beforeSourceText,
      sourceHash: input.beforeSourceHash,
      parser: input.parser,
      metadata: input.beforeMetadata
    }),
    after: input.after ?? (input.afterSourceText === undefined ? undefined : {
      language,
      sourcePath,
      sourceText: input.afterSourceText,
      sourceHash: input.afterSourceHash,
      parser: input.parser,
      metadata: input.afterMetadata
    })
  });
}

export function diffNativeSourceImports(input) {
  const before = normalizeNativeDiffImport(input.before, input, 'before');
  const after = normalizeNativeDiffImport(input.after, input, 'after');
  if (!before && !after) throw new Error('diffNativeSourceImports requires before or after native source input');
  const language = input.language ?? after?.language ?? before?.language;
  const sourcePath = input.sourcePath ?? after?.sourcePath ?? before?.sourcePath;
  const beforeHash = before?.nativeSource?.sourceHash ?? before?.nativeAst?.sourceHash ?? before?.sourceHash;
  const afterHash = after?.nativeSource?.sourceHash ?? after?.nativeAst?.sourceHash ?? after?.sourceHash;
  const idPart = idFragment(input.id ?? sourcePath ?? language ?? 'native_source_change');
  const beforeSidecar = before ? createSemanticImportSidecar(before, { id: `sidecar_before_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const afterSidecar = after ? createSemanticImportSidecar(after, { id: `sidecar_after_${idPart}`, generatedAt: input.generatedAt, regionPrefix: input.regionPrefix }) : undefined;
  const beforeSymbols = mapDiffSymbols(before, beforeSidecar);
  const afterSymbols = mapDiffSymbols(after, afterSidecar);
  const changedSymbols = diffNativeSymbols(beforeSymbols, afterSymbols);
  let changedRegions = diffNativeOwnershipRegions(beforeSidecar, afterSidecar, changedSymbols);
  const sourceChanged = Boolean(beforeHash && afterHash && beforeHash !== afterHash);
  if (sourceChanged && changedSymbols.length === 0 && changedRegions.length === 0) {
    changedRegions = [fileLevelNativeChangeRegion({ language, sourcePath, beforeHash, afterHash, before, after })];
  }
  const readiness = maxSemanticMergeReadiness(
    maxSemanticMergeReadiness(nativeImportReadiness(before), nativeImportReadiness(after)),
    sourceChanged && changedSymbols.length === 0 ? 'needs-review' : 'ready'
  );
  const reasons = nativeSourceChangeReasons({ before, after, beforeHash, afterHash, changedSymbols, changedRegions, readiness });
  changedRegions = attachNativeChangeRegionProjectionMetadata(changedRegions, {
    before,
    after,
    beforeSidecar,
    afterSidecar,
    changedSymbols,
    language,
    sourcePath,
    beforeHash,
    afterHash,
    readiness,
    reasons
  });
  const changedRegionProjectionSummary = summarizeNativeChangedRegionProjections(changedRegions);
  const evidence = [{
    id: input.evidenceId ?? `evidence_${idPart}_native_source_diff`,
    kind: 'import',
    status: input.evidenceStatus ?? 'passed',
    path: sourcePath,
    summary: `Compared ${language ?? 'native'} source imports: ${changedSymbols.length} changed symbol(s), ${changedRegions.length} changed region(s).`,
    metadata: {
      beforeImportId: before?.id,
      afterImportId: after?.id,
      beforeHash,
      afterHash,
      sourceChanged,
      addedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'added').length,
      removedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'removed').length,
      modifiedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'modified').length,
      changedRegionProjectionSummary
    }
  }];
  const conflictKeys = uniqueStrings([
    ...changedSymbols.map((symbol) => symbol.conflictKey),
    ...changedRegions.map((region) => region.conflictKey ?? region.key ?? region.id),
    ...(sourcePath ? [`source:${sourcePath}`] : [])
  ]);
  const touches = changedRegions.map((region) => ({ id: region.id, access: 'write' }));
  const operations = [
    ...(after?.nativeSource ? [{ op: 'upsertNode', node: after.nativeSource, touches: touches.length ? touches : [{ id: after.nativeSource.id, access: 'evidence' }] }] : []),
    ...(!after && before?.nativeSource ? [{ op: 'removeNode', id: before.nativeSource.id, touches: touches.length ? touches : [{ id: before.nativeSource.id, access: 'evidence' }] }] : []),
    { op: 'addEvidence', evidence: evidence[0], touches }
  ];
  const patch = createPatch({
    id: input.patchId ?? `patch_${idPart}_native_source_diff`,
    baseHash: beforeHash,
    targetHash: afterHash,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/diffNativeSourceImports',
    risk: readiness === 'blocked' ? 'high' : readiness === 'needs-review' ? 'medium' : 'low',
    operations,
    evidence,
    metadata: {
      sourceLanguage: language,
      sourcePath,
      beforeImportId: before?.id,
      afterImportId: after?.id,
      beforeHash,
      afterHash,
      changedSymbols: changedSymbols.length,
      changedRegions: changedRegions.length
    }
  });
  const mergeCandidate = createSemanticMergeCandidateRecord({
    id: input.mergeCandidateId ?? `merge_candidate_${idPart}_native_source_diff`,
    importResultId: after?.id ?? before?.id,
    patchId: patch.id,
    language,
    sourcePath,
    baseHash: beforeHash,
    targetHash: afterHash,
    touchedSymbols: changedSymbols.map(nativeChangeTouchedSymbol),
    touchedSemanticNodes: [],
    nativeSpans: nativeChangeSpans(changedSymbols, changedRegions, { language, sourcePath }),
    conflictKeys,
    readiness,
    reasons,
    evidence,
    metadata: {
      kind: 'native-source-change-set',
      beforeImportId: before?.id,
      afterImportId: after?.id,
      sourceChanged,
      changeSummary: nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged),
      changedRegionProjectionSummary
    }
  });
  return {
    kind: 'frontier.lang.nativeSourceChangeSet',
    version: 1,
    id: input.id ?? `native_source_change_${idPart}`,
    language,
    sourcePath,
    before,
    after,
    beforeHash,
    afterHash,
    changedSymbols,
    changedRegions,
    patch,
    mergeCandidate,
    evidence,
    readiness,
    reasons,
    sourceMaps: uniqueRecordsById([...(before?.sourceMaps ?? []), ...(after?.sourceMaps ?? [])]),
    semanticIndex: after?.semanticIndex ?? before?.semanticIndex,
    losses: uniqueByLossId([...(before?.losses ?? []), ...(after?.losses ?? [])]),
    summary: nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged),
    metadata: {
      beforeSidecarId: beforeSidecar?.id,
      afterSidecarId: afterSidecar?.id,
      beforeImportContract: before?.metadata?.importResultContract,
      afterImportContract: after?.metadata?.importResultContract,
      changedRegionProjectionSummary,
      ...input.metadata
    }
  };
}

function normalizeNativeDiffImport(value, input, side) {
  if (!value) return undefined;
  if (value.kind === 'frontier.lang.importResult' && value.nativeSource) return value;
  return importNativeSource({
    ...value,
    language: value.language ?? input.language,
    sourcePath: value.sourcePath ?? input.sourcePath,
    parser: value.parser ?? input.parser,
    metadata: {
      ...(value.metadata ?? {}),
      nativeSourceDiffSide: side
    }
  });
}

function mapDiffSymbols(imported, sidecar) {
  const symbolsById = new Map((imported?.semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const mappingsBySymbolId = new Map((imported?.sourceMaps ?? [])
    .flatMap((sourceMap) => sourceMap.mappings ?? [])
    .filter((mapping) => mapping.semanticSymbolId)
    .map((mapping) => [mapping.semanticSymbolId, mapping]));
  const sourceText = nativeImportSourceText(imported);
  const entries = sidecar?.symbols?.length
    ? sidecar.symbols
    : (imported?.semanticIndex?.symbols ?? []).map((symbol) => ({ id: symbol.id, name: symbol.name, kind: symbol.kind, sourceSpan: symbol.definitionSpan }));
  const result = new Map();
  for (const entry of entries) {
    const symbol = symbolsById.get(entry.id) ?? {};
    const mapping = mappingsBySymbolId.get(entry.id);
    const sourceSpan = entry.sourceSpan ?? mapping?.sourceSpan ?? symbol.definitionSpan;
    const key = nativeDiffSymbolKey(entry, imported);
    result.set(key, {
      key,
      id: entry.id,
      name: entry.name ?? symbol.name,
      kind: entry.kind ?? symbol.kind,
      language: entry.language ?? symbol.language ?? imported?.language,
      nativeAstNodeId: entry.nativeAstNodeId ?? symbol.nativeAstNodeId ?? mapping?.nativeAstNodeId,
      semanticOccurrenceId: entry.semanticOccurrenceId ?? mapping?.semanticOccurrenceId,
      sourceMapMappingId: entry.sourceMapMappingId ?? mapping?.id,
      sourceSpan,
      signatureHash: entry.signatureHash ?? symbol.signatureHash,
      ownershipRegionId: entry.ownershipRegionId ?? symbol.metadata?.ownershipRegionId ?? mapping?.ownershipRegionId,
      ownershipKey: entry.ownershipKey ?? symbol.metadata?.ownershipRegionKey ?? mapping?.ownershipRegionKey,
      ownershipRegionKind: entry.ownershipRegionKind ?? symbol.metadata?.ownershipRegionKind ?? mapping?.ownershipRegionKind,
      spanHash: hashNativeSpanText(sourceText, sourceSpan),
      sourcePath: sourceSpan?.path ?? imported?.sourcePath,
      sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash,
      readiness: entry.readiness ?? imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review'
    });
  }
  return result;
}

function diffNativeSymbols(beforeSymbols, afterSymbols) {
  const keys = uniqueStrings([...beforeSymbols.keys(), ...afterSymbols.keys()]).sort();
  const changed = [];
  for (const key of keys) {
    const before = beforeSymbols.get(key);
    const after = afterSymbols.get(key);
    const changeKind = !before ? 'added' : !after ? 'removed' : nativeDiffSymbolChanged(before, after) ? 'modified' : 'unchanged';
    if (changeKind === 'unchanged') continue;
    const current = after ?? before;
    changed.push({
      changeKind,
      key,
      id: current.id,
      name: current.name,
      kind: current.kind,
      language: current.language,
      nativeAstNodeId: current.nativeAstNodeId,
      semanticOccurrenceId: current.semanticOccurrenceId,
      sourceMapMappingId: current.sourceMapMappingId,
      sourceSpan: current.sourceSpan,
      beforeSignatureHash: before?.signatureHash,
      afterSignatureHash: after?.signatureHash,
      beforeSpanHash: before?.spanHash,
      afterSpanHash: after?.spanHash,
      beforeOwnershipKey: before?.ownershipKey,
      afterOwnershipKey: after?.ownershipKey,
      ownershipRegionId: current.ownershipRegionId,
      ownershipKey: current.ownershipKey,
      ownershipRegionKind: current.ownershipRegionKind,
      conflictKey: current.ownershipKey ? `region:${current.ownershipKey}` : `symbol:${current.id ?? key}`,
      readiness: maxSemanticMergeReadiness(before?.readiness ?? 'ready', after?.readiness ?? 'ready')
    });
  }
  return changed;
}

function nativeDiffSymbolChanged(before, after) {
  if ((before.signatureHash ?? '') !== (after.signatureHash ?? '')) return true;
  if ((before.spanHash ?? '') !== (after.spanHash ?? '')) return true;
  if ((before.ownershipKey ?? '') !== (after.ownershipKey ?? '')) return true;
  if ((before.nativeAstNodeId ?? '') !== (after.nativeAstNodeId ?? '')) return true;
  return false;
}

function diffNativeOwnershipRegions(beforeSidecar, afterSidecar, changedSymbols) {
  const changedRegionIds = new Set(changedSymbols.map((symbol) => symbol.ownershipRegionId).filter(Boolean));
  const changedRegionKeys = new Set([
    ...changedSymbols.map((symbol) => symbol.beforeOwnershipKey).filter(Boolean),
    ...changedSymbols.map((symbol) => symbol.afterOwnershipKey).filter(Boolean)
  ]);
  const regions = uniqueRecordsById([...(beforeSidecar?.ownershipRegions ?? []), ...(afterSidecar?.ownershipRegions ?? [])])
    .filter((region) => changedRegionIds.has(region.id) || changedRegionKeys.has(region.key));
  return regions.map((region) => ({
    ...region,
    changeKind: changedSymbols.some((symbol) => symbol.changeKind === 'added' && symbol.afterOwnershipKey === region.key)
      ? 'added'
      : changedSymbols.some((symbol) => symbol.changeKind === 'removed' && symbol.beforeOwnershipKey === region.key)
        ? 'removed'
        : 'modified',
    conflictKey: region.key ? `region:${region.key}` : `region:${region.id}`
  }));
}

function fileLevelNativeChangeRegion(input) {
  const sourcePath = input.sourcePath ?? input.after?.sourcePath ?? input.before?.sourcePath;
  const key = ['source', sourcePath ?? `${input.language}:memory`, 'file'].join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    changeKind: 'modified',
    regionKind: 'body',
    granularity: 'file',
    language: input.language,
    sourcePath,
    sourceHash: input.afterHash ?? input.beforeHash,
    precision: 'unknown',
    mergePolicy: 'file-level-review-required',
    conflictKey: `region:${key}`,
    metadata: {
      reason: 'source-hash-changed-without-symbol-diff',
      beforeHash: input.beforeHash,
      afterHash: input.afterHash
    }
  };
}

function attachNativeChangeRegionProjectionMetadata(regions, context) {
  return (regions ?? []).map((region) => {
    const projection = nativeChangedRegionProjectionMetadata(region, context);
    return {
      ...region,
      metadata: {
        ...(region.metadata ?? {}),
        changedRegionProjection: projection
      }
    };
  });
}

function nativeChangedRegionProjectionMetadata(region, context) {
  const beforeRegion = findSemanticImportRegion(context.beforeSidecar, region);
  const afterRegion = findSemanticImportRegion(context.afterSidecar, region);
  const regionSymbols = (context.changedSymbols ?? []).filter((symbol) => nativeChangeSymbolTouchesRegion(symbol, region));
  const sourceMapLinks = uniqueRecordsById([
    ...nativeChangeProjectionSourceMapLinks(context.before, 'before', beforeRegion ?? region, regionSymbols),
    ...nativeChangeProjectionSourceMapLinks(context.after, 'after', afterRegion ?? region, regionSymbols)
  ]).slice(0, 24);
  const action = nativeChangedRegionProjectionAction(region, context.readiness);
  const conflictKeys = uniqueStrings([
    region.conflictKey,
    region.key ? `region:${region.key}` : undefined,
    region.id ? `region:${region.id}` : undefined,
    ...regionSymbols.map((symbol) => symbol.conflictKey)
  ].filter(Boolean));
  return {
    schema: 'frontier.lang.changedRegionProjection.v1',
    id: `changed_region_projection_${idFragment(region.conflictKey ?? region.key ?? region.id)}`,
    reviewRequired: true,
    autoMergeClaim: false,
    changeKind: region.changeKind,
    language: region.language ?? context.language,
    sourcePath: region.sourcePath ?? context.sourcePath,
    conflictKey: region.conflictKey,
    region: {
      id: region.id,
      key: region.key,
      kind: region.regionKind,
      granularity: region.granularity,
      precision: region.precision,
      sourceSpan: region.sourceSpan,
      nativeAstNodeId: region.nativeAstNodeId,
      symbolId: region.symbolId,
      symbolName: region.symbolName,
      symbolKind: region.symbolKind
    },
    before: nativeChangeProjectionEndpoint(context.before, context.beforeSidecar, beforeRegion ?? (region.changeKind === 'added' ? undefined : region), 'before'),
    after: nativeChangeProjectionEndpoint(context.after, context.afterSidecar, afterRegion ?? (region.changeKind === 'removed' ? undefined : region), 'after'),
    sourceMapLinks,
    admission: {
      readiness: context.readiness,
      action,
      reasons: context.reasons ?? [],
      conflictKeys
    }
  };
}

function findSemanticImportRegion(sidecar, region) {
  return (sidecar?.ownershipRegions ?? []).find((candidate) => (
    (region.id && candidate.id === region.id) ||
    (region.key && candidate.key === region.key)
  ));
}

function nativeChangeProjectionEndpoint(imported, sidecar, region, side) {
  if (!imported && !region) return undefined;
  const preservation = nativeImportSourcePreservationRecord(imported);
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const regionMappings = sourceMaps
    .flatMap((sourceMap) => (sourceMap?.mappings ?? []).map((mapping) => ({ sourceMap, mapping })))
    .filter(({ mapping }) => nativeChangeMappingTouchesRegion(mapping, region, []));
  return {
    side,
    importId: imported?.id,
    sidecarId: sidecar?.id,
    nativeSourceId: imported?.nativeSource?.id,
    nativeAstId: imported?.nativeAst?.id,
    semanticIndexId: imported?.semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    sourcePath: imported?.sourcePath ?? region?.sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? region?.sourceHash,
    sourcePreservationId: preservation?.id,
    exactSourceAvailable: preservation?.summary?.exactSourceAvailable === true,
    ownershipRegionId: region?.id,
    ownershipKey: region?.key,
    ownershipRegionKind: region?.regionKind,
    sourceSpan: region?.sourceSpan,
    sourceMapIds: sourceMaps.map((sourceMap) => sourceMap?.id).filter(Boolean),
    sourceMapMappingIds: regionMappings.map(({ mapping }) => mapping?.id).filter(Boolean)
  };
}

function nativeChangeProjectionSourceMapLinks(imported, side, region, symbols) {
  if (!imported) return [];
  const sourceMaps = imported.sourceMaps ?? imported.universalAst?.sourceMaps ?? [];
  const links = [];
  for (const sourceMap of sourceMaps) {
    for (const mapping of sourceMap?.mappings ?? []) {
      if (!nativeChangeMappingTouchesRegion(mapping, region, symbols)) continue;
      links.push({
        id: `${side}:${sourceMap.id}:${mapping.id}`,
        side,
        sourceMapId: sourceMap.id,
        sourceMapMappingId: mapping.id,
        sourcePath: mapping.sourceSpan?.path ?? sourceMap.sourcePath ?? imported.sourcePath,
        sourceHash: sourceMap.sourceHash ?? imported.nativeSource?.sourceHash ?? imported.nativeAst?.sourceHash,
        targetPath: mapping.generatedSpan?.targetPath ?? sourceMap.targetPath,
        targetHash: mapping.generatedSpan?.targetHash ?? sourceMap.targetHash,
        semanticSymbolId: mapping.semanticSymbolId,
        semanticOccurrenceId: mapping.semanticOccurrenceId,
        semanticNodeId: mapping.semanticNodeId,
        nativeSourceId: mapping.nativeSourceId,
        nativeAstNodeId: mapping.nativeAstNodeId,
        precision: mapping.precision,
        sourceSpan: mapping.sourceSpan,
        generatedSpan: mapping.generatedSpan,
        ownershipRegionId: mapping.ownershipRegionId,
        ownershipRegionKey: mapping.ownershipRegionKey,
        ownershipRegionKind: mapping.ownershipRegionKind
      });
    }
  }
  return links;
}

function nativeChangeMappingTouchesRegion(mapping, region, symbols) {
  if (!mapping || !region) return false;
  const symbolIds = new Set((symbols ?? []).map((symbol) => symbol.id).filter(Boolean));
  const occurrenceIds = new Set((symbols ?? []).map((symbol) => symbol.semanticOccurrenceId).filter(Boolean));
  const mappingIds = new Set((symbols ?? []).map((symbol) => symbol.sourceMapMappingId).filter(Boolean));
  if (mappingIds.has(mapping.id)) return true;
  if (region.id && mapping.ownershipRegionId === region.id) return true;
  if (region.key && mapping.ownershipRegionKey === region.key) return true;
  if (region.nativeAstNodeId && mapping.nativeAstNodeId === region.nativeAstNodeId) return true;
  if (symbolIds.has(mapping.semanticSymbolId)) return true;
  if (occurrenceIds.has(mapping.semanticOccurrenceId)) return true;
  if (region.granularity === 'file') {
    return !region.sourcePath || sourceSpanPathMatches(mapping.sourceSpan, region.sourcePath);
  }
  return false;
}

function sourceSpanPathMatches(span, sourcePath) {
  if (!span || !sourcePath) return false;
  return span.path === sourcePath || span.sourceId === sourcePath;
}

function nativeChangeSymbolTouchesRegion(symbol, region) {
  return Boolean(symbol && region && (
    (region.id && symbol.ownershipRegionId === region.id) ||
    (region.key && (
      symbol.ownershipKey === region.key ||
      symbol.beforeOwnershipKey === region.key ||
      symbol.afterOwnershipKey === region.key
    ))
  ));
}

function nativeChangedRegionProjectionAction(region, readiness) {
  if (readiness === 'blocked') return 'rerun-or-human-port';
  if (region.changeKind === 'added') return 'review-addition';
  if (region.changeKind === 'removed') return 'review-removal';
  if (region.granularity === 'file') return 'review-file';
  return 'review-port';
}

function nativeImportSourcePreservationRecord(imported) {
  return imported?.metadata?.sourcePreservation
    ?? imported?.nativeSource?.metadata?.sourcePreservation
    ?? imported?.nativeAst?.metadata?.sourcePreservation
    ?? imported?.universalAst?.metadata?.sourcePreservation;
}

function summarizeNativeChangedRegionProjections(regions) {
  const projections = (regions ?? [])
    .map((region) => region?.metadata?.changedRegionProjection)
    .filter(Boolean);
  return {
    schema: 'frontier.lang.changedRegionProjectionSummary.v1',
    total: regions?.length ?? 0,
    withProjection: projections.length,
    reviewRequired: projections.filter((projection) => projection.reviewRequired === true).length,
    autoMergeClaims: projections.filter((projection) => projection.autoMergeClaim === true).length,
    sourceMapLinks: projections.reduce((sum, projection) => sum + (projection.sourceMapLinks?.length ?? 0), 0),
    byAction: countBy(projections.map((projection) => projection.admission?.action ?? 'unknown')),
    byRegionKind: countBy(projections.map((projection) => projection.region?.kind ?? 'unknown'))
  };
}

function nativeImportReadiness(imported) {
  return imported?.metadata?.semanticMergeReadiness
    ?? imported?.metadata?.nativeImportLossSummary?.semanticMergeReadiness
    ?? imported?.mergeCandidates?.[0]?.readiness
    ?? 'ready';
}

function nativeSourceChangeReasons(input) {
  if (!input.before) return ['Native source was added.'];
  if (!input.after) return ['Native source was removed.'];
  if (input.changedSymbols.length) {
    return [`Native source changed ${input.changedSymbols.length} symbol(s) across ${input.changedRegions.length} ownership region(s).`];
  }
  if (input.beforeHash && input.afterHash && input.beforeHash !== input.afterHash) {
    return ['Native source hash changed without declaration-level symbol changes; file-level review is required.'];
  }
  return ['Native source imports are semantically unchanged at available scanner precision.'];
}

function nativeChangeTouchedSymbol(symbol) {
  return {
    id: symbol.id ?? symbol.key,
    name: symbol.name,
    kind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId,
    span: symbol.sourceSpan,
    conflictKey: symbol.conflictKey,
    metadata: {
      changeKind: symbol.changeKind,
      beforeSignatureHash: symbol.beforeSignatureHash,
      afterSignatureHash: symbol.afterSignatureHash,
      beforeSpanHash: symbol.beforeSpanHash,
      afterSpanHash: symbol.afterSpanHash,
      ownershipRegionId: symbol.ownershipRegionId,
      ownershipRegionKind: symbol.ownershipRegionKind
    }
  };
}

function nativeChangeSpans(changedSymbols, changedRegions, input) {
  const symbolSpans = changedSymbols
    .filter((symbol) => symbol.sourceSpan)
    .map((symbol) => ({
      id: `native_span_${idFragment(symbol.id ?? symbol.key)}`,
      sourceId: symbol.sourceSpan?.sourceId,
      path: symbol.sourceSpan?.path ?? input.sourcePath,
      language: symbol.language ?? input.language,
      nativeAstNodeId: symbol.nativeAstNodeId,
      symbolId: symbol.id,
      span: symbol.sourceSpan,
      conflictKey: symbol.conflictKey,
      metadata: { changeKind: symbol.changeKind }
    }));
  const regionSpans = changedRegions
    .filter((region) => region.sourceSpan || region.sourcePath)
    .map((region) => ({
      id: `native_span_${idFragment(region.id)}`,
      path: region.sourceSpan?.path ?? region.sourcePath ?? input.sourcePath,
      language: region.language ?? input.language,
      nativeAstNodeId: region.nativeAstNodeId,
      symbolId: region.symbolId,
      span: region.sourceSpan,
      conflictKey: region.conflictKey ?? `region:${region.key ?? region.id}`,
      metadata: {
        changeKind: region.changeKind,
        regionKind: region.regionKind,
        granularity: region.granularity,
        ...(region.metadata?.changedRegionProjection ? {
          changedRegionProjection: nativeChangedRegionProjectionSpanMetadata(region.metadata.changedRegionProjection)
        } : {})
      }
    }));
  return uniqueRecordsById([...symbolSpans, ...regionSpans]);
}

function nativeChangedRegionProjectionSpanMetadata(projection) {
  return {
    schema: projection.schema,
    id: projection.id,
    reviewRequired: projection.reviewRequired,
    autoMergeClaim: projection.autoMergeClaim,
    beforeSourceHash: projection.before?.sourceHash,
    afterSourceHash: projection.after?.sourceHash,
    sourceMapLinks: projection.sourceMapLinks?.length ?? 0,
    admission: projection.admission
  };
}

function nativeSourceChangeSummary(changedSymbols, changedRegions, sourceChanged) {
  return {
    sourceChanged,
    symbols: changedSymbols.length,
    regions: changedRegions.length,
    addedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'added').length,
    removedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'removed').length,
    modifiedSymbols: changedSymbols.filter((symbol) => symbol.changeKind === 'modified').length,
    byRegionKind: countBy(changedRegions.map((region) => region.regionKind ?? 'unknown')),
    byChangeKind: countBy([...changedSymbols.map((symbol) => symbol.changeKind), ...changedRegions.map((region) => region.changeKind)])
  };
}

function nativeDiffSymbolKey(symbol, imported) {
  return [
    symbol.language ?? imported?.language,
    symbol.kind ?? 'symbol',
    symbol.name ?? symbol.id
  ].map((part) => String(part ?? '').trim()).join(':');
}

function nativeImportSourceText(imported) {
  return imported?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText
    ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText
    ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText;
}

function hashNativeSpanText(sourceText, span) {
  const text = sourceTextForSpan(sourceText, span);
  return text === undefined ? undefined : hashSemanticValue(text);
}

function sourceTextForSpan(sourceText, span) {
  if (typeof sourceText !== 'string' || !span) return undefined;
  if (typeof span.start === 'number' && typeof span.end === 'number' && span.end >= span.start) {
    return sourceText.slice(span.start, span.end);
  }
  if (typeof span.startLine === 'number') {
    const lines = sourceText.split(/\r?\n/);
    const endLine = typeof span.endLine === 'number' && span.endLine >= span.startLine ? span.endLine : span.startLine;
    return lines.slice(span.startLine - 1, endLine).join('\n');
  }
  return undefined;
}

function createLightweightNativeImport(input) {
  const parser = input.parser ?? `${input.language}.lightweight-declaration-scan`;
  const rootId = 'native_root';
  const nodes = {
    [rootId]: {
      id: rootId,
      kind: 'Program',
      languageKind: `${input.language}.program`,
      children: [],
      metadata: { parser, sourceHash: input.sourceHash }
    }
  };
  const declarations = scanNativeDeclarations(input);
  const losses = [];
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = [];
  const mappings = [];
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_lightweight_scan`;

  for (const declaration of declarations) {
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, declaration, documentId);
    nodes[rootId].children.push(declaration.nodeId);
    nodes[declaration.nodeId] = {
      id: declaration.nodeId,
      kind: declaration.kind,
      languageKind: declaration.languageKind,
      span: declaration.span,
      value: declaration.name ?? declaration.importPath ?? null,
      fields: declaration.fields,
      metadata: {
        ...declaration.metadata,
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind
      }
    };
    if (declaration.symbolId) {
      const occurrenceId = `occ_${idFragment(declaration.nodeId)}_def`;
      symbols.push({
        id: declaration.symbolId,
        scheme: 'frontier',
        name: declaration.name,
        kind: declaration.symbolKind,
        language: input.language,
        nativeAstNodeId: declaration.nodeId,
        signatureHash: hashSemanticValue([input.language, declaration.kind, declaration.name, declaration.fields ?? {}]),
        definitionSpan: declaration.span,
        metadata: {
          ownershipRegionId: ownershipRegion.id,
          ownershipRegionKey: ownershipRegion.key,
          ownershipRegionKind: ownershipRegion.regionKind
        }
      });
      occurrences.push({
        id: occurrenceId,
        documentId,
        symbolId: declaration.symbolId,
        role: declaration.role ?? 'definition',
        span: declaration.span,
        nativeAstNodeId: declaration.nodeId
      });
      relations.push({
        id: `rel_${idFragment(documentId)}_${idFragment(declaration.nodeId)}`,
        sourceId: documentId,
        predicate: declaration.role === 'import' ? 'imports' : 'defines',
        targetId: declaration.symbolId
      });
      facts.push({
        id: `fact_${idFragment(declaration.nodeId)}_kind`,
        predicate: 'nativeKind',
        subjectId: declaration.symbolId,
        value: declaration.languageKind
      }, {
        id: `fact_${idFragment(declaration.nodeId)}_ownership_region`,
        predicate: 'semanticOwnershipRegion',
        subjectId: declaration.symbolId,
        value: ownershipRegion
      }, {
        id: `fact_${idFragment(declaration.nodeId)}_ownership_region_taxonomy`,
        predicate: 'semanticOwnershipRegionTaxonomy',
        subjectId: declaration.symbolId,
        value: {
          regionKind: ownershipRegion.regionKind,
          granularity: ownershipRegion.granularity,
          key: ownershipRegion.key
        }
      });
      mappings.push({
        id: `map_${idFragment(declaration.nodeId)}`,
        nativeAstNodeId: declaration.nodeId,
        semanticSymbolId: declaration.symbolId,
        semanticOccurrenceId: occurrenceId,
        sourceSpan: declaration.span,
        evidenceIds: [evidenceId],
        lossIds: declaration.loss ? [declaration.loss.id] : [],
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind,
        precision: 'declaration'
      });
    }
    if (declaration.loss) losses.push(declaration.loss);
  }
  losses.push(...lightweightCoverageLosses(input, declarations, input.sourcePreservation));

  const semanticIndex = createSemanticIndexRecord({
    id: `index_${idFragment(input.sourcePath ?? input.language)}`,
    documents: [{
      id: documentId,
      path: input.sourcePath ?? `${input.language}:memory`,
      language: input.language,
      sourceHash: input.sourceHash
    }],
    symbols,
    occurrences,
    relations,
    facts,
    evidence: [{
      id: evidenceId,
      kind: 'import',
      status: 'passed',
      path: input.sourcePath,
      summary: `Lightweight declaration scan found ${symbols.length} symbol(s).`,
      metadata: { parser }
    }],
    metadata: {
      parser,
      coverage: 'declarations-only',
      unsupported: ['full expression AST', 'type checking', 'control flow', 'comments and formatting preservation']
    }
  });

  return {
    parser,
    rootId,
    nodes,
    losses,
    semanticIndex,
    mappings,
    metadata: {
      parser,
      scanKind: 'lightweight-declaration-scan',
      declarationCount: declarations.length,
      ...(input.sourcePreservation ? {
        sourcePreservationId: input.sourcePreservation.id,
        sourcePreservationSummary: input.sourcePreservation.summary
      } : {})
    }
  };
}

function nativeImportProjectionContext(importResult, options) {
  const nativeSource = options.nativeSource
    ?? importResult.nativeSource
    ?? importResult.nativeSources?.[0]
    ?? importResult.universalAst?.nativeSources?.[0];
  const nativeAst = options.nativeAst
    ?? importResult.nativeAst
    ?? nativeSource?.ast
    ?? importResult.universalAst?.nativeSources?.[0]?.ast;
  const semanticIndex = options.semanticIndex
    ?? importResult.semanticIndex
    ?? importResult.universalAst?.semanticIndex;
  const language = options.language
    ?? importResult.language
    ?? nativeSource?.language
    ?? nativeAst?.language
    ?? importResult.universalAst?.metadata?.sourceLanguage
    ?? 'source';
  const sourcePath = options.sourcePath
    ?? importResult.sourcePath
    ?? nativeSource?.sourcePath
    ?? nativeAst?.sourcePath
    ?? importResult.universalAst?.metadata?.sourcePath;
  const sourceHash = options.expectedSourceHash
    ?? importResult.sourceHash
    ?? nativeSource?.sourceHash
    ?? nativeAst?.sourceHash;
  return {
    nativeSource,
    nativeAst,
    semanticIndex,
    language,
    sourcePath,
    sourceHash,
    parser: options.parser ?? nativeAst?.parser ?? nativeSource?.parser,
    semanticStatus: options.semanticStatus ?? importResult.metadata?.semanticStatus ?? nativeSource?.metadata?.semanticStatus,
    idPart: idFragment(options.id ?? importResult.id ?? nativeSource?.id ?? sourcePath ?? language)
  };
}

function nativeProjectionSourceCandidate(context, options) {
  const preservation = sourcePreservationFromProjectionContext(context);
  const explicitSourceText = options.sourceText ?? options.preservedSourceText ?? options.exactSourceText;
  const sourceText = explicitSourceText ?? preservation?.sourceText;
  if (typeof sourceText !== 'string') return undefined;
  const computedSourceHash = hashSemanticValue(sourceText);
  const declaredSourceHash = options.sourceHash ?? (explicitSourceText === undefined ? preservation?.sourceHash : undefined);
  const sourceHash = computedSourceHash;
  const hashVerified = Boolean(context.sourceHash);
  const exact = !context.sourceHash || sourceHash === context.sourceHash || options.verifySourceHash === false;
  return {
    sourceText,
    sourceHash,
    declaredSourceHash,
    hashVerified,
    exact,
    mismatch: hashVerified && sourceHash !== context.sourceHash && options.verifySourceHash !== false,
    sourcePreservationId: preservation?.id
  };
}

function sourcePreservationFromProjectionContext(context) {
  return context.nativeSource?.metadata?.sourcePreservation
    ?? context.nativeAst?.metadata?.sourcePreservation
    ?? context.nativeSource?.ast?.metadata?.sourcePreservation;
}

function nativeProjectionDeclarations(importResult, context) {
  const semanticIndex = context.semanticIndex;
  const occurrencesBySymbol = new Map();
  for (const occurrence of semanticIndex?.occurrences ?? []) {
    const list = occurrencesBySymbol.get(occurrence.symbolId) ?? [];
    list.push(occurrence);
    occurrencesBySymbol.set(occurrence.symbolId, list);
  }
  const declarations = (semanticIndex?.symbols ?? [])
    .filter((symbol) => !nativeProjectionImportOnlySymbol(symbol, occurrencesBySymbol.get(symbol.id)))
    .map((symbol) => {
      const occurrence = occurrencesBySymbol.get(symbol.id)?.find((item) => item.role !== 'import');
      const mapping = (importResult.sourceMaps ?? importResult.universalAst?.sourceMaps ?? [])
        .flatMap((sourceMap) => sourceMap.mappings ?? [])
        .find((item) => item.semanticSymbolId === symbol.id);
      return {
        name: symbol.name,
        kind: nativeProjectionDeclarationKind(symbol.kind),
        symbolId: symbol.id,
        nativeAstNodeId: symbol.nativeAstNodeId ?? occurrence?.nativeAstNodeId,
        sourceSpan: symbol.definitionSpan ?? occurrence?.span ?? mapping?.sourceSpan,
        ownershipRegionId: mapping?.ownershipRegionId ?? symbol.metadata?.ownershipRegionId,
        metadata: {
          semanticKind: symbol.kind,
          language: symbol.language,
          signatureHash: symbol.signatureHash
        }
      };
    })
    .filter((declaration) => declaration.name);
  if (declarations.length) return uniqueNativeProjectionDeclarations(declarations);
  return uniqueNativeProjectionDeclarations(Object.values(context.nativeAst?.nodes ?? {})
    .map((node) => {
      const name = typeof node.value === 'string' && node.value.trim() ? node.value.trim() : node.fields?.name;
      const kind = nativeProjectionKindForNode(node);
      if (!name || !kind) return undefined;
      return {
        name,
        kind,
        nativeAstNodeId: node.id,
        sourceSpan: node.span,
        ownershipRegionId: node.metadata?.ownershipRegionId,
        metadata: { nativeKind: node.kind, language: context.language }
      };
    })
    .filter(Boolean));
}

function nativeProjectionImportOnlySymbol(symbol, occurrences = []) {
  if (String(symbol.id ?? '').includes(':import:')) return true;
  if (occurrences.length && occurrences.every((occurrence) => occurrence.role === 'import')) return true;
  return symbol.kind === 'module' && occurrences.some((occurrence) => occurrence.role === 'import');
}

function nativeProjectionDeclarationKind(kind) {
  const normalized = String(kind ?? 'value').toLowerCase();
  if (normalized === 'function' || normalized === 'method' || normalized === 'procedure') return 'function';
  if (normalized === 'class') return 'class';
  if (normalized === 'interface' || normalized === 'protocol') return 'interface';
  if (normalized === 'trait') return 'trait';
  if (normalized === 'type' || normalized === 'struct' || normalized === 'enum' || normalized === 'record') return 'type';
  if (normalized === 'constant' || normalized === 'const') return 'constant';
  if (normalized === 'variable' || normalized === 'property' || normalized === 'field') return 'variable';
  if (normalized === 'module' || normalized === 'namespace' || normalized === 'package') return 'module';
  return normalized;
}

function nativeProjectionKindForNode(node) {
  const kind = String(node?.kind ?? node?.languageKind ?? '').toLowerCase();
  if (/function|method|procedure|funcdecl|itemfn|fndeclaration|\bdef\b/.test(kind)) return 'function';
  if (/class/.test(kind)) return 'class';
  if (/interface|protocol/.test(kind)) return 'interface';
  if (/trait/.test(kind)) return 'trait';
  if (/struct|enum|record|typedef|typealias|type/.test(kind)) return 'type';
  if (/const|constant|macro|define/.test(kind)) return 'constant';
  if (/var|property|field/.test(kind)) return 'variable';
  if (/module|namespace|package/.test(kind)) return 'module';
  return undefined;
}

function uniqueNativeProjectionDeclarations(declarations) {
  const seen = new Set();
  return declarations.filter((declaration) => {
    const key = `${declaration.kind}:${declaration.name}:${declaration.symbolId ?? declaration.nativeAstNodeId ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nativeProjectionStubLosses(context, candidateSource, declarations, options) {
  const reason = candidateSource?.mismatch
    ? 'source-hash-mismatch'
    : options.preferPreservedSource === false && candidateSource?.sourceText
      ? 'preserved-source-disabled'
      : 'exact-source-unavailable';
  const message = candidateSource?.mismatch
    ? 'Provided native source text hash did not match the import result source hash; emitted declaration stubs instead of preserving stale source.'
    : options.preferPreservedSource === false && candidateSource?.sourceText
      ? 'Native source projection was asked to emit declaration stubs instead of preserving available source text.'
      : 'Exact native source text was not provided; emitted declaration stubs reconstructed from import metadata.';
  const losses = [nativeProjectionLoss(context, {
    id: `loss_${context.idPart}_native_source_stub`,
    kind: candidateSource?.mismatch ? 'sourcePreservation' : 'targetProjectionLoss',
    severity: 'warning',
    message,
    metadata: {
      reason,
      projectionMode: 'native-source-stubs',
      expectedSourceHash: context.sourceHash,
      providedSourceHash: candidateSource?.sourceHash,
      declaredSourceHash: candidateSource?.declaredSourceHash
    }
  })];
  if (!declarations.length) {
    losses.push(nativeProjectionLoss(context, {
      id: `loss_${context.idPart}_native_source_stub_empty`,
      kind: 'declarationOnlyCoverage',
      severity: 'warning',
      message: 'Native import result did not expose semantic declarations for source stub generation.',
      metadata: { reason: 'no-stub-declarations', projectionMode: 'native-source-stubs' }
    }));
  }
  return losses;
}

function nativeProjectionLoss(context, input) {
  const rootSpan = context.nativeAst?.nodes?.[context.nativeAst.rootId]?.span;
  return {
    id: input.id,
    severity: input.severity,
    phase: 'emit',
    sourceFormat: context.language,
    kind: input.kind,
    message: input.message,
    span: rootSpan ?? {
      sourceId: context.sourceHash,
      path: context.sourcePath,
      startLine: 1,
      startColumn: 1
    },
    metadata: {
      nativeSourceId: context.nativeSource?.id,
      nativeAstId: context.nativeAst?.id,
      parser: context.parser,
      ...input.metadata
    }
  };
}

function renderNativeProjectionStubs(context, declarations, options) {
  const language = String(context.language ?? 'source').toLowerCase();
  const header = nativeProjectionStubHeader(language, context, options);
  let body;
  if (language === 'typescript' || language === 'ts') body = renderTypeScriptProjectionStubs(declarations);
  else if (language === 'javascript' || language === 'js') body = renderJavaScriptProjectionStubs(declarations);
  else if (language === 'python' || language === 'py') body = renderPythonProjectionStubs(declarations);
  else if (language === 'rust' || language === 'rs') body = renderRustProjectionStubs(declarations);
  else if (language === 'c' || language === 'cpp' || language === 'c++' || language === 'h') body = renderCProjectionStubs(declarations);
  else body = renderGenericProjectionStubs(declarations, language);
  return ensureTrailingNewline([header, body].filter(Boolean).join('\n'));
}

function nativeProjectionStubHeader(language, context, options) {
  if (options.stubBanner === false) return '';
  if (typeof options.stubBanner === 'string') return ensureTrailingNewline(options.stubBanner).trimEnd();
  const comment = nativeProjectionLineComment(language);
  const suffix = context.sourcePath ? ` for ${oneLine(context.sourcePath)}` : '';
  return [
    `${comment} Frontier native source stubs${suffix}`,
    `${comment} Exact source text was unavailable; declarations are reconstructed from native import metadata.`
  ].join('\n');
}

function nativeProjectionLineComment(language) {
  if (language === 'python' || language === 'py' || language === 'ruby' || language === 'rb' || language === 'shell' || language === 'sh') return '#';
  if (language === 'sql') return '--';
  return '//';
}

function renderJavaScriptProjectionStubs(declarations) {
  const used = new Set();
  if (!declarations.length) return 'export {};';
  return declarations.map((declaration) => {
    const name = reserveUniqueId(safeProjectionIdentifier(declaration.name), used);
    if (declaration.kind === 'function') return `export function ${name}(...args) {\n  throw new Error('Frontier native source stub: implementation unavailable.');\n}`;
    if (declaration.kind === 'class') return `export class ${name} {}`;
    return `export const ${name} = undefined;`;
  }).join('\n\n');
}

function renderTypeScriptProjectionStubs(declarations) {
  const used = new Set();
  if (!declarations.length) return 'export {};';
  return declarations.map((declaration) => {
    const name = reserveUniqueId(safeProjectionIdentifier(declaration.name), used);
    if (declaration.kind === 'function') return `export function ${name}(...args: unknown[]): never {\n  throw new Error('Frontier native source stub: implementation unavailable.');\n}`;
    if (declaration.kind === 'class') return `export class ${name} {}`;
    if (declaration.kind === 'interface') return `export interface ${name} {}`;
    if (declaration.kind === 'type' || declaration.kind === 'trait') return `export type ${name} = unknown;`;
    return `export const ${name}: unknown = undefined;`;
  }).join('\n\n');
}

function renderPythonProjectionStubs(declarations) {
  if (!declarations.length) return 'pass';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `def ${name}(*args, **kwargs):\n    raise NotImplementedError("Frontier native source stub")`;
    if (declaration.kind === 'class') return `class ${name}:\n    pass`;
    return `${name} = None`;
  }).join('\n\n');
}

function renderRustProjectionStubs(declarations) {
  if (!declarations.length) return '';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `pub fn ${name}() {\n    unimplemented!(\"Frontier native source stub\");\n}`;
    if (declaration.kind === 'type' || declaration.kind === 'class') return `pub struct ${upperFirst(name)};`;
    return `pub const ${name.toUpperCase()}: () = ();`;
  }).join('\n\n');
}

function renderCProjectionStubs(declarations) {
  if (!declarations.length) return '';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `void ${name}(void);`;
    if (declaration.kind === 'type' || declaration.kind === 'class') return `typedef struct ${upperFirst(name)} ${upperFirst(name)};`;
    return `extern const int ${name};`;
  }).join('\n');
}

function renderGenericProjectionStubs(declarations, language) {
  if (!declarations.length) return `${nativeProjectionLineComment(language)} no declarations available`;
  return declarations.map((declaration) => `${declaration.kind} ${declaration.name}`).join('\n');
}

function safeProjectionIdentifier(name) {
  const text = String(name ?? 'value').split('.').at(-1).replace(/[^A-Za-z0-9_$]/g, '_');
  const identifier = text || 'value';
  return /^[A-Za-z_$]/.test(identifier) ? identifier : `_${identifier}`;
}

function ensureTrailingNewline(value) {
  const text = String(value ?? '');
  return text.endsWith('\n') ? text : `${text}\n`;
}

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function scanNativeDeclarations(input) {
  const language = String(input.language).toLowerCase();
  if (language === 'javascript' || language === 'typescript') return scanJavaScriptLike(input);
  if (language === 'python') return scanPython(input);
  if (language === 'rust') return scanRust(input);
  if (language === 'c' || language === 'cpp' || language === 'c++') return scanCLike(input);
  if (language === 'java') return scanJava(input);
  if (language === 'go') return scanGo(input);
  if (language === 'swift') return scanSwift(input);
  if (language === 'csharp' || language === 'c#') return scanCSharp(input);
  if (language === 'php') return scanPhp(input);
  if (language === 'ruby' || language === 'rb') return scanRuby(input);
  if (language === 'kotlin' || language === 'kt') return scanKotlin(input);
  if (language === 'scala' || language === 'sc') return scanScala(input);
  if (language === 'dart') return scanDart(input);
  if (language === 'lua') return scanLua(input);
  if (language === 'shell' || language === 'sh' || language === 'bash' || language === 'zsh') return scanShell(input);
  if (language === 'sql' || language === 'postgresql' || language === 'postgres' || language === 'mysql' || language === 'sqlite') return scanSql(input);
  if (language === 'zig') return scanZig(input);
  if (language === 'elixir' || language === 'ex' || language === 'exs') return scanElixir(input);
  if (language === 'erlang' || language === 'erl' || language === 'hrl') return scanErlang(input);
  if (language === 'haskell' || language === 'hs') return scanHaskell(input);
  if (language === 'r') return scanR(input);
  return scanGenericDeclarations(input);
}

function scanJavaScriptLike(input) {
  const declarations = [];
  let currentClass;
  let classDepth = 0;
  let currentObject;
  const lexicalState = { inBlockComment: false, inTemplateString: false };
  for (const { line, number } of sourceLines(input.sourceText)) {
    const scanLine = jsDeclarationScanLine(line, lexicalState);
    const trimmed = scanLine.trim();
    if (!trimmed || jsCommentOnlyLine(trimmed)) continue;
    const declarationLine = trimmed.replace(/^(?:export\s+)?(?:declare\s+)?/, '');
    let match;
    if (currentObject) {
      const routeRecord = jsRouteRecordDeclaration(input, number, trimmed, currentObject);
      if (routeRecord) {
        declarations.push(routeRecord);
      } else {
        const property = jsObjectPropertyDeclaration(input, number, trimmed, currentObject);
        if (property) declarations.push(property);
      }
    }
    if ((match = trimmed.match(/^import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^import\s*\(\s*['"]([^'"]+)['"]\s*\)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'DynamicImportExpression', 'module'));
    } else if ((match = trimmed.match(/^export\s+(?:\*\s+from|\{[^}]*\}\s+from)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ExportFromDeclaration', 'module'));
    } else if ((match = declarationLine.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, declarationLine.includes('{')));
    } else if ((match = trimmed.match(/^export\s+default\s+(?:async\s+)?function\*?\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'ExportDefaultFunctionDeclaration', 'function', match[1] ?? 'default', { parameters: splitParameters(match[2]), exportDefault: true }, trimmed.includes('{')));
    } else if ((match = declarationLine.match(/^(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDeclaration', 'class', match[1], {}, declarationLine.includes('{')));
      if (declarationLine.includes('{') && !declarationLine.includes('}')) {
        currentClass = match[1];
        classDepth = 0;
      }
    } else if ((match = declarationLine.match(/^interface\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'InterfaceDeclaration', 'interface', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'EnumDeclaration', 'type', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^type\s+([A-Za-z_$][\w$]*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?([^=;]*)\)?\s*=>/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableFunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = declarationLine.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/))) {
      const initializerKind = jsInitializerKind(declarationLine);
      const regionKind = jsRegionKindForDeclarationName(match[1], declarationLine);
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', jsVariableSymbolKind(regionKind, initializerKind), match[1], {
        initializerKind
      }, jsVariableHasBody(initializerKind, declarationLine), {
        regionKind,
        metadata: { initializerKind }
      }));
      currentObject = jsObjectRegionContext(match[1], declarationLine, number, regionKind);
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\*?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/))) {
      const regionKind = jsRegionKindForDeclarationName(match[1], trimmed);
      declarations.push(nativeDeclaration(input, number, 'CommonJsExport', 'variable', match[1], { export: 'commonjs' }, false, { regionKind }));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?::\s*[^={]+)?(?:\{|=>|$)/)) && !jsControlKeyword(match[1])) {
      declarations.push(nativeDeclaration(input, number, 'MethodDefinition', 'method', `${currentClass}.${match[1]}`, {
        methodName: match[1],
        owner: currentClass,
        parameters: splitParameters(match[2])
      }, declarationLine.includes('{') || declarationLine.includes('=>')));
    } else if (currentClass && (match = declarationLine.match(/^(?:(?:public|private|protected|static|readonly|declare|accessor)\s+)*([A-Za-z_$][\w$]*)\s*(?::\s*([^=;{]+))?(?:[=;]|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDefinition', 'property', `${currentClass}.${match[1]}`, {
        propertyName: match[1],
        owner: currentClass,
        valueType: match[2]?.trim()
      }, false));
    }
    if (currentClass) {
      classDepth += braceDelta(trimmed);
      if (classDepth <= 0) {
        currentClass = undefined;
        classDepth = 0;
      }
    }
    if (currentObject) {
      if (number !== currentObject.startLine) currentObject.depth += jsContainerDelta(trimmed);
      if (currentObject.depth <= 0) currentObject = undefined;
    }
  }
  return declarations;
}

function jsCommentOnlyLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

function jsDeclarationScanLine(line, state) {
  let text = String(line ?? '');
  if (state.inTemplateString) {
    const close = findUnescapedBacktick(text, 0);
    if (close < 0) return '';
    text = text.slice(close + 1);
    state.inTemplateString = false;
  }
  if (state.inBlockComment) {
    const close = text.indexOf('*/');
    if (close < 0) return '';
    text = text.slice(close + 2);
    state.inBlockComment = false;
  }
  let output = '';
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quote) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '/' && next === '/') break;
    if (char === '/' && next === '*') {
      const close = text.indexOf('*/', index + 2);
      if (close < 0) {
        state.inBlockComment = true;
        break;
      }
      index = close + 1;
      continue;
    }
    if (char === '\'' || char === '"') {
      quote = char;
      output += char;
      continue;
    }
    if (char === '`') {
      const close = findUnescapedBacktick(text, index + 1);
      if (close < 0) {
        state.inTemplateString = true;
        output += '``';
        break;
      }
      output += text.slice(index, close + 1);
      index = close;
      continue;
    }
    output += char;
  }
  return output;
}

function findUnescapedBacktick(text, startIndex) {
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '`') {
      return index;
    }
  }
  return -1;
}

function jsObjectRegionContext(name, declarationLine, lineNumber, regionKind) {
  const initializerKind = jsInitializerKind(declarationLine);
  if (initializerKind !== 'object' && initializerKind !== 'array') return undefined;
  const depth = jsContainerDelta(declarationLine);
  if (depth <= 0) return undefined;
  return {
    name,
    regionKind: regionKind ?? jsRegionKindForDeclarationName(name, declarationLine),
    initializerKind,
    depth,
    startLine: lineNumber
  };
}

function jsInitializerKind(line) {
  const initializer = String(line ?? '').split('=').slice(1).join('=').trim();
  if (!initializer) return 'unknown';
  if (/^(?:async\s+)?function\b/.test(initializer) || /=>/.test(initializer)) return 'function';
  if (initializer.startsWith('{')) return 'object';
  if (initializer.startsWith('[')) return 'array';
  if (/^new\s+/.test(initializer)) return 'instance';
  if (/^['"`]/.test(initializer)) return 'string';
  if (/^(?:true|false)\b/.test(initializer)) return 'boolean';
  if (/^[0-9]/.test(initializer)) return 'number';
  return 'expression';
}

function jsVariableHasBody(initializerKind, declarationLine) {
  return initializerKind === 'function'
    || initializerKind === 'object'
    || initializerKind === 'array'
    || /\{/.test(String(declarationLine ?? ''));
}

function jsVariableSymbolKind(regionKind, initializerKind) {
  if (regionKind === 'route') return 'route';
  if (initializerKind === 'function') return 'function';
  return 'variable';
}

function jsRegionKindForDeclarationName(name, source = '') {
  const raw = `${name ?? ''} ${source ?? ''}`;
  const text = raw.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  const compact = raw.toLowerCase();
  if (/\b(routes?|router|screens?|pages?|navigation|navitems?|menuitems?)\b/.test(text) || /(route|router|screen|page|navigation|navitem|menuitem)/.test(compact)) return 'route';
  if (/\b(config|settings|options|flags?|schema|manifest|registry|catalog)\b/.test(text) || /(config|settings|options|flags|schema|manifest|registry|catalog)/.test(compact)) return 'config';
  if (/\b(content|copy|docs?|legal|messages?|strings?|i18n|locale|translations?)\b/.test(text) || /(content|copy|docs|legal|messages|strings|i18n|locale|translations)/.test(compact)) return 'content';
  return undefined;
}

function jsObjectPropertyDeclaration(input, lineNumber, trimmed, context) {
  if (/^[}\])]/.test(trimmed) || trimmed.startsWith('...')) return undefined;
  const methodMatch = trimmed.match(/^(?:(?:async|get|set)\s+)?(['"]?)([A-Za-z_$][\w$-]*)\1\s*\(([^)]*)\)\s*(?:[:\w\s<>\[\]]*)?(?:\{|=>|,|$)/);
  if (methodMatch && !jsControlKeyword(methodMatch[2])) {
    const name = `${context.name}.${methodMatch[2]}`;
    return nativeDeclaration(input, lineNumber, 'ObjectMethod', 'function', name, {
      owner: context.name,
      propertyName: methodMatch[2],
      parameters: splitParameters(methodMatch[3])
    }, true, {
      regionKind: jsPropertyRegionKind(context, methodMatch[2], 'function'),
      metadata: { owner: context.name, propertyName: methodMatch[2], initializerKind: 'function' }
    });
  }
  const propertyMatch = trimmed.match(/^(?:(['"])([^'"]+)\1|([A-Za-z_$][\w$-]*))\s*:\s*(.+?)(?:,)?$/);
  if (!propertyMatch) return undefined;
  const propertyName = propertyMatch[2] ?? propertyMatch[3];
  if (!propertyName || jsControlKeyword(propertyName)) return undefined;
  const value = propertyMatch[4].trim();
  const initializerKind = jsPropertyInitializerKind(value);
  const functionLike = initializerKind === 'function';
  const name = `${context.name}.${propertyName}`;
  return nativeDeclaration(input, lineNumber, functionLike ? 'ObjectFunctionProperty' : 'ObjectProperty', functionLike ? 'function' : 'property', name, {
    owner: context.name,
    propertyName,
    initializerKind
  }, functionLike || initializerKind === 'object' || initializerKind === 'array', {
    regionKind: jsPropertyRegionKind(context, propertyName, value),
    metadata: {
      owner: context.name,
      propertyName,
      initializerKind
    }
  });
}

function jsRouteRecordDeclaration(input, lineNumber, trimmed, context) {
  if (context.regionKind !== 'route') return undefined;
  const match = trimmed.match(/\b(?:path|route|href|url)\s*:\s*(['"`])([^'"`]+)\1/);
  if (!match) return undefined;
  const routePath = match[2];
  return nativeDeclaration(input, lineNumber, 'RouteRecord', 'route', `${context.name}.${routePath}`, {
    owner: context.name,
    routePath
  }, true, {
    regionKind: 'route',
    metadata: { owner: context.name, routePath, initializerKind: 'object' }
  });
}

function jsPropertyInitializerKind(value) {
  const text = String(value ?? '').trim();
  if (/^(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(text)) return 'function';
  if (text.startsWith('{')) return 'object';
  if (text.startsWith('[')) return 'array';
  if (/^['"`]/.test(text)) return 'string';
  if (/^(?:true|false)\b/.test(text)) return 'boolean';
  if (/^[0-9]/.test(text)) return 'number';
  return 'expression';
}

function jsPropertyRegionKind(context, propertyName, value) {
  const named = jsRegionKindForDeclarationName(propertyName, value);
  if (named) return named;
  if (context.regionKind === 'route') return 'route';
  if (context.regionKind === 'content') return 'content';
  if (context.regionKind === 'config') return 'config';
  return 'property';
}

function jsContainerDelta(source) {
  let delta = 0;
  for (const char of String(source ?? '')) {
    if (char === '{' || char === '[') delta += 1;
    if (char === '}' || char === ']') delta -= 1;
  }
  return delta;
}

function scanPython(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDef', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^class\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDef', 'class', match[1], {}, true));
    } else if ((match = trimmed.match(/^(?:from\s+([A-Za-z_][\w.]*)\s+import\s+.+|import\s+([A-Za-z_][\w.]*))/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1] ?? match[2], 'Import', 'module'));
    }
  }
  return declarations;
}

function scanRust(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemFn', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?struct\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemStruct', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?enum\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemEnum', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?trait\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemTrait', 'trait', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^impl(?:\s*<[^>]+>)?\s+(.+?)\s*\{/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemImpl', 'implementation', idFragment(match[1]), { target: match[1].trim() }, true));
    } else if ((match = trimmed.match(/^(?:pub(?:\([^)]*\))?\s+)?mod\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'ItemMod', 'module', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^use\s+(.+?);/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ItemUse', 'module'));
    } else if (/^[A-Za-z_]\w*!\s*[({[]/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion'));
    }
  }
  return declarations;
}

function scanCLike(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^#\s*include\s+[<"]([^>"]+)[>"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'IncludeDirective', 'header'));
    } else if ((match = trimmed.match(/^#\s*define\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', match[1]));
    } else if ((match = trimmed.match(/^typedef\s+struct(?:\s+([A-Za-z_]\w*))?/))) {
      declarations.push(nativeDeclaration(input, number, 'TypedefStructDeclaration', 'type', match[1] ?? `anonymous_struct_${number}`, {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:struct|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'TagDeclaration', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:[A-Za-z_][\w\s*:&<>]+)\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:;|\{)?$/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.endsWith('{')));
    }
  }
  return declarations;
}

function scanJava(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_][\w.]*);/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageDeclaration', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(?:static\s+)?([A-Za-z_][\w.*]*);/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|abstract|final|static|sealed|non-sealed)\s+)*(class|interface|enum|record|@interface)\s+([A-Za-z_$][\w$]*)/))) {
      const kind = match[1] === '@interface' ? 'AnnotationDeclaration' : `${upperFirst(match[1])}Declaration`;
      declarations.push(nativeDeclaration(input, number, kind, javaSymbolKind(match[1]), match[2], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|abstract|final|static|synchronized|native)\s+)*(?:<[^>]+>\s+)?[A-Za-z_$][\w$<>\[\].?,\s]*\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?(?:\{|;)?$/))) {
      declarations.push(nativeDeclaration(input, number, 'MethodDeclaration', 'method', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    }
  }
  return declarations;
}

function scanGo(input) {
  const declarations = [];
  let inImportBlock = false;
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if (inImportBlock) {
      if (trimmed === ')') {
        inImportBlock = false;
      } else if ((match = trimmed.match(/^(?:(?:[A-Za-z_]\w*|[_.])\s+)?["']([^"']+)["']/))) {
        declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportSpec', 'package'));
      }
      continue;
    }
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageClause', 'package', match[1], {}, false));
    } else if (/^import\s*\(/.test(trimmed)) {
      inImportBlock = true;
    } else if ((match = trimmed.match(/^import\s+(?:(?:[A-Za-z_]\w*|[_.])\s+)?["']([^"']+)["']/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportSpec', 'package'));
    } else if ((match = trimmed.match(/^type\s+([A-Za-z_]\w*)\s*=\s*(.+)$/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAlias', 'type', match[1], { target: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^type\s+([A-Za-z_]\w*)\s+(struct|interface)\b/))) {
      declarations.push(nativeDeclaration(input, number, match[2] === 'struct' ? 'TypeSpecStruct' : 'TypeSpecInterface', 'type', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^func\s+\(([^)]*)\)\s*([A-Za-z_]\w*)(?:\s*\[([^\]]+)\])?\s*\(([^)]*)\)/))) {
      const receiver = parseGoReceiver(match[1]);
      declarations.push(nativeDeclaration(input, number, 'MethodDecl', 'method', goReceiverMethodName(receiver, match[2]), {
        methodName: match[2],
        receiver,
        typeParameters: splitTypeParameters(match[3]),
        parameters: splitParameters(match[4])
      }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^func\s+([A-Za-z_]\w*)(?:\s*\[([^\]]+)\])?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FuncDecl', 'function', match[1], {
        typeParameters: splitTypeParameters(match[2]),
        parameters: splitParameters(match[3])
      }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^var\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VarDecl', 'variable', match[1], {}, false));
    } else if ((match = trimmed.match(/^const\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstDecl', 'constant', match[1], {}, false));
    }
  }
  return declarations;
}

function scanSwift(input) {
  const declarations = [];
  const protocols = new Set();
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    const declarationLine = trimmed.replace(/^(?:@[A-Za-z_][\w.]+(?:\([^)]*\))?\s+)*/, '');
    let match;
    if ((match = declarationLine.match(/^import\s+(?:(?:struct|class|enum|protocol|func|var)\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDecl', 'module'));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|final|indirect)\s+)*(struct|class|enum|protocol|actor)\s+([A-Za-z_]\w*)/))) {
      if (match[1] === 'protocol') protocols.add(match[2]);
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Decl`, swiftSymbolKind(match[1]), match[2], {}, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*extension\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(.*)$/))) {
      const extensionFields = parseSwiftExtensionTail(match[2]);
      const isProtocolExtension = protocols.has(match[1]) || /Protocol$/.test(match[1]);
      declarations.push(nativeDeclaration(input, number, isProtocolExtension ? 'ProtocolExtensionDecl' : 'ExtensionDecl', 'implementation', `${match[1]}.${isProtocolExtension ? 'protocolExtension' : 'extension'}`, {
        extendedType: match[1],
        ...extensionFields
      }, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|mutating|nonmutating|override|required|convenience|isolated|nonisolated)\s+)*func\s+([A-Za-z_]\w*|`[^`]+`)(?:\s*<([^>]+)>)?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDecl', 'function', unquoteSwiftIdentifier(match[1]), {
        typeParameters: splitTypeParameters(match[2]),
        parameters: splitParameters(match[3])
      }, declarationLine.includes('{')));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|final|lazy|weak|unowned|override|required|nonisolated)\s+)*(let|var)\s+([A-Za-z_]\w*)\b(?::\s*([^={]+))?/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDecl', 'property', match[2], {
        binding: match[1],
        valueType: match[3]?.trim()
      }, declarationLine.includes('{') || declarationLine.includes('=>')));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*typealias\s+([A-Za-z_]\w*)\b(?:\s*=\s*(.+))?/))) {
      declarations.push(nativeDeclaration(input, number, 'TypealiasDecl', 'type', match[1], { target: match[2]?.trim() }, false));
    }
  }
  return declarations;
}

function scanCSharp(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^using\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'UsingAliasDirective', 'type', match[1], { target: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^using\s+(?:static\s+)?([A-Za-z_][\w.]*)\s*;/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UsingDirective', 'namespace'));
    } else if ((match = trimmed.match(/^namespace\s+([A-Za-z_][\w.]*)/))) {
      declarations.push(nativeDeclaration(input, number, 'NamespaceDeclaration', 'namespace', match[1], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|internal|static|unsafe|new)\s+)*delegate\s+(.+?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'DelegateDeclaration', 'type', match[2], {
        returnType: match[1].trim(),
        parameters: splitParameters(match[3])
      }, false));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|internal|abstract|sealed|static|partial|readonly|ref|unsafe)\s+)*(class|interface|struct|enum|record(?:\s+(?:class|struct))?)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, csharpDeclarationKind(match[1]), csharpSymbolKind(match[1]), match[2], { csharpKind: match[1].replace(/\s+/g, ' ') }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|internal|static|virtual|override|async|partial|sealed|abstract|extern|new|unsafe|readonly)\s+)*(?:[A-Za-z_][\w<>\[\].?,\s]*\??|void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:=>.*|\{|;)?$/))) {
      const parameters = splitParameters(match[2]);
      const extensionReceiver = csharpExtensionReceiver(parameters);
      declarations.push(nativeDeclaration(input, number, extensionReceiver ? 'ExtensionMethodDeclaration' : 'MethodDeclaration', 'method', match[1], {
        parameters,
        ...(extensionReceiver ? { extensionReceiver } : {})
      }, trimmed.includes('{') || trimmed.includes('=>')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|internal|static|virtual|override|abstract|sealed|new|unsafe)\s+)*event\s+(.+?)\s+([A-Za-z_]\w*)\s*(?:[;{=]|=>)/))) {
      declarations.push(nativeDeclaration(input, number, 'EventDeclaration', 'event', match[2], {
        eventType: match[1].trim(),
        accessors: csharpAccessors(trimmed)
      }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|internal|static|virtual|override|abstract|sealed|new|required|readonly|unsafe)\s+)*([A-Za-z_][\w<>\[\].?,\s]*\??)\s+([A-Za-z_]\w*)\s*(?:\{|=>)/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDeclaration', 'property', match[2], {
        propertyType: match[1].trim(),
        accessors: csharpAccessors(trimmed)
      }, trimmed.includes('{') || trimmed.includes('=>')));
    }
  }
  return declarations;
}

function scanPhp(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim().replace(/^<\?php\s*/, '');
    let match;
    if ((match = trimmed.match(/^namespace\s+([A-Za-z_][\w\\]*)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'NamespaceDefinition', 'namespace', match[1], {}, false));
    } else if ((match = trimmed.match(/^use\s+([A-Za-z_][\w\\]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UseDeclaration', 'namespace'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|final|readonly)\s+)*(class|interface|trait|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, phpSymbolKind(match[1]), match[2], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|protected|private|static|final|abstract)\s+)*function\s+&?\s*([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    }
  }
  return declarations;
}

function scanRuby(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:require|load)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'Require', 'module'));
    } else if ((match = trimmed.match(/^module\s+([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'Module', 'module', match[1], {}, true));
    } else if ((match = trimmed.match(/^class\s+([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'Class', 'class', match[1], {}, true));
    } else if ((match = trimmed.match(/^def\s+(?:self\.)?([A-Za-z_]\w*[!?=]?)\s*(?:\(([^)]*)\)|([^#=]*))?/))) {
      declarations.push(nativeDeclaration(input, number, 'Def', 'method', match[1], { parameters: splitParameters(match[2] ?? match[3]) }, true));
    }
  }
  return declarations;
}

function scanKotlin(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageHeader', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?:\.\*)?)(?:\s+as\s+[A-Za-z_]\w*)?$/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDirective', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|sealed|data|value)\s+)*(?:(enum|annotation)\s+)?(class|interface|object)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, kotlinDeclarationKind(match[2], match[1]), kotlinSymbolKind(match[2], match[1]), match[3], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|inline|tailrec|operator|infix|external|suspend|override)\s+)*fun\s+(?:<[^>]+>\s*)?(?:[A-Za-z_][\w.<>?]*\.)?([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{') || trimmed.includes('=')));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual)\s+)*typealias\s+([A-Za-z_]\w*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|override|const|lateinit)\s+)*(?:val|var)\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDeclaration', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanScala(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageClause', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(.+?);?$/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1].trim(), 'Import', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|sealed|abstract|case|implicit|lazy|override|inline|transparent|open)\s+)*(class|trait|object|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Def`, scalaSymbolKind(match[1]), match[2], {}, trimmed.includes('{') || trimmed.includes(':')));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|override|inline)\s+)*def\s+([A-Za-z_]\w*)\s*(?:\[[^\]]+\])?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'DefDef', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{') || trimmed.includes('=')));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|opaque)\s+)*type\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeDef', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|lazy|override|inline)\s+)*(?:val|var)\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ValDef', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanDart(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:import|export)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UriBasedDirective', 'library'));
    } else if ((match = trimmed.match(/^part\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'PartDirective', 'library'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|base|final|interface|sealed)\s+)*(class|mixin|enum)\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, dartSymbolKind(match[1]), match[2], {}, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^extension\s+([A-Za-z_]\w*)\s+on\s+.+\{/))) {
      declarations.push(nativeDeclaration(input, number, 'ExtensionDeclaration', 'implementation', match[1], {}, true));
    } else if ((match = trimmed.match(/^typedef\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAlias', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:external|static)\s+)*(?:[A-Za-z_]\w*(?:<[^>]+>)?\??|void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:async\s*)?(?:\{|=>|;)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{') || trimmed.includes('=>')));
    } else if ((match = trimmed.match(/^(?:(?:static|external|late)\s+)*(?:const|final|var)\s+(?:[A-Za-z_]\w*(?:<[^>]+>)?\??\s+)?([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanLua(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:local\s+[A-Za-z_]\w*\s*=\s*)?require\s*\(?\s*['"]([^'"]+)['"]\s*\)?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'RequireCall', 'module'));
    } else if ((match = trimmed.match(/^(?:local\s+)?function\s+([A-Za-z_]\w*(?:[.:][A-Za-z_]\w*)*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:local\s+)?([A-Za-z_]\w*(?:[.:][A-Za-z_]\w*)*)\s*=\s*function\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionAssignment', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^local\s+([A-Za-z_]\w*)\s*=\s*(?:\{|\w+)/))) {
      declarations.push(nativeDeclaration(input, number, 'LocalDeclaration', 'variable', match[1], {}, false));
    }
  }
  return declarations;
}

function scanShell(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:source|\.)\s+(?:"([^"]+)"|'([^']+)'|([./A-Za-z0-9_-][\w./-]*))(?:\s|$)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1] ?? match[2] ?? match[3], 'SourceCommand', 'file'));
    } else if ((match = trimmed.match(/^function\s+([A-Za-z_][\w-]*)\s*(?:\(\s*\))?\s*(?:\{|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], {}, true));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w-]*)\s*\(\s*\)\s*(?:\{|$)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], {}, true));
    } else if ((match = trimmed.match(/^(?:export\s+)?(?:readonly\s+)?([A-Za-z_]\w*)=/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableAssignment', 'variable', match[1], {}, false));
    } else if ((match = trimmed.match(/^alias\s+([A-Za-z_][\w-]*)=/))) {
      declarations.push(nativeDeclaration(input, number, 'AliasDeclaration', 'function', match[1], {}, false));
    }
  }
  return declarations;
}

function scanSql(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$-]*))/i))) {
      declarations.push(nativeImportDeclaration(input, number, normalizeSqlIdentifier(match[1]), 'CreateExtensionStatement', 'extension'));
    } else if ((match = trimmed.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?((?:UNIQUE\s+)?INDEX|MATERIALIZED\s+VIEW|TABLE|VIEW|FUNCTION|PROCEDURE|TRIGGER|SCHEMA|TYPE)\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z_][\w$]*))?)/i))) {
      const objectKind = match[1].toUpperCase().replace(/\s+/g, ' ');
      declarations.push(nativeDeclaration(input, number, sqlLanguageKind(objectKind), sqlSymbolKind(objectKind), normalizeSqlIdentifier(match[2]), { objectKind }, trimmed.includes('(')));
    }
  }
  return declarations;
}

function scanZig(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?(?:const|var)\s+([A-Za-z_]\w*)\s*=\s*@import\(\s*["']([^"']+)["']\s*\)\s*;?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[2], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?usingnamespace\s+@import\(\s*["']([^"']+)["']\s*\)\s*;?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UsingNamespaceImport', 'module'));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?const\s+([A-Za-z_]\w*)\s*=\s*(?:extern\s+)?(struct|enum|union|opaque|error)\b/))) {
      declarations.push(nativeDeclaration(input, number, `Const${upperFirst(match[2])}Declaration`, 'type', match[1], { zigKind: match[2] }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:pub|export|extern|inline)\s+)*(?:fn)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FnDeclaration', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?const\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstDeclaration', 'constant', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:pub|export)\s+)?var\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VarDeclaration', 'variable', match[1], {}, false));
    }
    if (/^\s*comptime\b|@(?:cImport|compileError|field|hasDecl|hasField|setEvalBranchQuota|This|Type|typeInfo)\b/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'generatedCode', zigMetaName(trimmed)));
    }
  }
  return declarations;
}

function scanElixir(input) {
  const declarations = [];
  let currentModule;
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    let recordedMeta = false;
    if ((match = trimmed.match(/^defmodule\s+([A-Z]\w*(?:\.[A-Z]\w*)*)\s+do\b/))) {
      currentModule = match[1];
      declarations.push(nativeDeclaration(input, number, 'ModuleDefinition', 'module', match[1], {}, true));
    } else if ((match = trimmed.match(/^(?:alias|import|require)\s+([A-Z]\w*(?:\.[A-Z]\w*)*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDirective', 'module'));
    } else if ((match = trimmed.match(/^use\s+([A-Z]\w*(?:\.[A-Z]\w*)*)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', match[1]));
      recordedMeta = true;
    } else if ((match = trimmed.match(/^(defmacro|defmacrop|defguard|defguardp|defdelegate)\s+([A-Za-z_]\w*[!?]?)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', match[2]));
      recordedMeta = true;
    } else if ((match = trimmed.match(/^defp?\s+([A-Za-z_]\w*[!?]?)\s*(?:\(([^)]*)\)|([^,]*))?/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionDefinition', 'function', match[1], { parameters: splitParameters(match[2] ?? match[3]) }, /\bdo\b/.test(trimmed)));
    } else if (trimmed.startsWith('defstruct')) {
      declarations.push(nativeDeclaration(input, number, 'StructDefinition', 'type', currentModule ?? `struct_${number}`, {}, true));
    } else if ((match = trimmed.match(/^@(type|typep|opaque|callback)\s+([A-Za-z_]\w*[!?]?)/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Attribute`, match[1] === 'callback' ? 'function' : 'type', match[2], {}, false));
    }
    if (!recordedMeta && /(?:\bquote\s+do\b|\bunquote(?:_splicing)?\b|@(?:before_compile|after_compile|on_definition|derive)\b)/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', elixirMetaName(trimmed)));
    }
  }
  return declarations;
}

function scanErlang(input) {
  const declarations = [];
  const seenFunctions = new Set();
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    let recordedMacro = false;
    if ((match = trimmed.match(/^-module\(([a-z][A-Za-z0-9_@]*)\)\./))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleAttribute', 'module', match[1], {}, false));
    } else if ((match = trimmed.match(/^-include(?:_lib)?\(["']([^"']+)["']\)\./))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'IncludeAttribute', 'module'));
    } else if ((match = trimmed.match(/^-import\(([a-z][A-Za-z0-9_@]*)\s*,/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportAttribute', 'module'));
    } else if ((match = trimmed.match(/^-behaviou?r\(([a-z][A-Za-z0-9_@]*)\)\./))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'BehaviourAttribute', 'module'));
    } else if ((match = trimmed.match(/^-record\(([a-z][A-Za-z0-9_@]*)\s*,/))) {
      declarations.push(nativeDeclaration(input, number, 'RecordAttribute', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^-(type|opaque)\s+([a-z][A-Za-z0-9_@]*)\s*\(/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Attribute`, 'type', match[2], {}, false));
    } else if ((match = trimmed.match(/^-callback\s+([a-z][A-Za-z0-9_@]*)\s*\(/))) {
      declarations.push(nativeDeclaration(input, number, 'CallbackAttribute', 'function', match[1], {}, false));
    } else if ((match = trimmed.match(/^-define\(([^,\s)]+)/))) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', match[1]));
      recordedMacro = true;
    } else if (/^-compile\([^)]*parse_transform/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'generatedCode', 'parse_transform'));
      recordedMacro = true;
    } else if ((match = trimmed.match(/^([a-z][A-Za-z0-9_@]*|'[^']+')\s*\(([^)]*)\)\s*(?:when\s+.*?)?->/))) {
      const name = erlangAtomName(match[1]);
      if (!seenFunctions.has(name)) {
        seenFunctions.add(name);
        declarations.push(nativeDeclaration(input, number, 'FunctionClause', 'function', name, { parameters: splitParameters(match[2]) }, true));
      }
    }
    if (!recordedMacro && /(^|[^A-Za-z0-9_])\?[A-Za-z_]\w*/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', erlangMacroName(trimmed)));
    }
  }
  return declarations;
}

function scanHaskell(input) {
  const declarations = [];
  const seenFunctions = new Set();
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if (/^#\s*(?:if|ifdef|ifndef|else|elif|endif|define|include)\b/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'preprocessor', haskellMetaName(trimmed)));
    } else if ((match = trimmed.match(/^\{-#\s+LANGUAGE\s+(.+?)#-\}/))) {
      const extensions = match[1].split(',').map((part) => part.trim());
      if (extensions.some((extension) => /^(TemplateHaskell|QuasiQuotes|CPP)$/.test(extension))) {
        declarations.push(nativeMacroLoss(input, number, trimmed, extensions.includes('CPP') ? 'preprocessor' : 'macroExpansion', extensions.join('_')));
      }
    } else if (/^\$\(|\[[a-zA-Z]*\||\b\$\([^)]+\)/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'macroExpansion', haskellMetaName(trimmed)));
    } else if ((match = trimmed.match(/^module\s+([A-Z][A-Za-z0-9_.']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ModuleDeclaration', 'module', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(?:safe\s+)?(?:qualified\s+)?([A-Z][A-Za-z0-9_.']*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'module'));
    } else if ((match = trimmed.match(/^foreign\s+import\s+([A-Za-z_]\w*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ForeignImportDeclaration', 'foreign'));
    } else if ((match = trimmed.match(/^(data|newtype|type)\s+([A-Z][A-Za-z0-9_']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, 'type', match[2], {}, /(?:where|=)/.test(trimmed)));
    } else if ((match = trimmed.match(/^class\s+(?:\([^)]*\)\s*=>\s*)?([A-Z][A-Za-z0-9_']*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ClassDeclaration', 'type', match[1], {}, /\bwhere\b/.test(trimmed)));
    } else if ((match = trimmed.match(/^([a-z_][A-Za-z0-9_']*)\s*::\s*(.+)$/))) {
      seenFunctions.add(match[1]);
      declarations.push(nativeDeclaration(input, number, 'FunctionSignature', 'function', match[1], { signature: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^([a-z_][A-Za-z0-9_']*)\b[^=]*=/))) {
      if (!seenFunctions.has(match[1])) {
        seenFunctions.add(match[1]);
        declarations.push(nativeDeclaration(input, number, 'FunctionBinding', 'function', match[1], {}, true));
      }
    }
  }
  return declarations;
}

function scanR(input) {
  const declarations = [];
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    let match;
    if ((match = trimmed.match(/^(?:library|require)\s*\(\s*["']?([A-Za-z_][\w.-]*)["']?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'LibraryCall', 'package'));
    } else if ((match = trimmed.match(/^importFrom\s*\(\s*["']?([A-Za-z_][\w.-]*)["']?/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportFromCall', 'package'));
    } else if ((match = trimmed.match(/^source\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'SourceCall', 'module'));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w.]*)\s*(?:<-|=)\s*function\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'FunctionAssignment', 'function', match[1], { parameters: splitParameters(match[2]) }, trimmed.includes('{')));
    } else if ((match = trimmed.match(/^([A-Za-z_][\w.]*)\s*<-\s*R6Class\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'R6ClassDeclaration', 'class', match[2] || match[1], { binding: match[1] }, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[2] || match[1]));
    } else if ((match = trimmed.match(/^setClass\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4ClassDeclaration', 'class', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[1]));
    } else if ((match = trimmed.match(/^setGeneric\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4GenericDeclaration', 'function', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', match[1]));
    } else if ((match = trimmed.match(/^setMethod\s*\(\s*["']([^"']+)["']/))) {
      declarations.push(nativeDeclaration(input, number, 'S4MethodDeclaration', 'method', match[1], {}, true));
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicDispatch', match[1]));
    } else if ((match = trimmed.match(/^([A-Z][A-Za-z0-9_.]*)\s*(?:<-|=)\s*/))) {
      declarations.push(nativeDeclaration(input, number, 'ConstantAssignment', 'constant', match[1], {}, false));
    }
    if (/(?:eval|parse|substitute|quote|bquote|assign)\s*\(|<<-|\{\{|!!!|!!/.test(trimmed)) {
      declarations.push(nativeMacroLoss(input, number, trimmed, 'dynamicRuntime', rMetaName(trimmed)));
    }
  }
  return declarations;
}

function scanGenericDeclarations(input) {
  return sourceLines(input.sourceText)
    .filter(({ line }) => /\b(function|class|struct|enum|trait|interface|def)\b/.test(line))
    .map(({ line, number }) => nativeDeclaration(input, number, 'NativeDeclaration', 'variable', idFragment(line.trim()).slice(0, 40), { source: line.trim() }, true));
}

function upperFirst(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function parseGoReceiver(raw) {
  const value = String(raw ?? '').trim();
  const match = value.match(/^(?:(\w+)\s+)?(.+)$/);
  const rawType = String(match?.[2] ?? value).trim();
  return {
    raw: value,
    ...(match?.[1] ? { name: match[1] } : {}),
    rawType,
    type: normalizeGoReceiverType(rawType)
  };
}

function normalizeGoReceiverType(rawType) {
  return String(rawType ?? '')
    .trim()
    .replace(/^[*&\s]+/, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ');
}

function goReceiverMethodName(receiver, methodName) {
  return receiver?.type ? `${receiver.type}.${methodName}` : methodName;
}

function parseSwiftExtensionTail(rawTail) {
  let tail = String(rawTail ?? '').split('{')[0].trim();
  const fields = {};
  const whereMatch = tail.match(/\bwhere\b(.+)$/);
  if (whereMatch) {
    fields.constraints = whereMatch[1].trim();
    tail = tail.slice(0, whereMatch.index).trim();
  }
  if (tail.startsWith(':')) {
    fields.conformances = tail.slice(1).split(',').map((part) => part.trim()).filter(Boolean);
  }
  return fields;
}

function unquoteSwiftIdentifier(identifier) {
  return String(identifier).replace(/^`|`$/g, '');
}

function javaSymbolKind(kind) {
  if (kind === 'interface' || kind === '@interface') return 'interface';
  if (kind === 'enum' || kind === 'record') return 'type';
  return 'class';
}

function swiftSymbolKind(kind) {
  if (kind === 'protocol') return 'protocol';
  if (kind === 'extension') return 'implementation';
  if (kind === 'struct' || kind === 'enum' || kind === 'actor') return 'type';
  return 'class';
}

function csharpSymbolKind(kind) {
  const normalized = String(kind).replace(/\s+/g, ' ');
  if (normalized === 'interface') return 'interface';
  if (normalized === 'struct' || normalized === 'enum' || normalized.startsWith('record')) return 'type';
  return 'class';
}

function csharpDeclarationKind(kind) {
  const normalized = String(kind).replace(/\s+/g, ' ');
  if (normalized === 'record struct') return 'RecordStructDeclaration';
  if (normalized === 'record class') return 'RecordClassDeclaration';
  if (normalized === 'record') return 'RecordDeclaration';
  return `${upperFirst(normalized)}Declaration`;
}

function csharpExtensionReceiver(parameters) {
  const match = String(parameters?.[0] ?? '').match(/^this\s+(.+?)\s+([A-Za-z_]\w*)$/);
  return match ? { type: match[1].trim(), name: match[2] } : undefined;
}

function csharpAccessors(source) {
  return uniqueStrings([...String(source ?? '').matchAll(/\b(get|set|init|add|remove)\b/g)].map((match) => match[1]));
}

function phpSymbolKind(kind) {
  if (kind === 'interface') return 'interface';
  if (kind === 'trait') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

function kotlinDeclarationKind(kind, prefix) {
  if (prefix === 'enum') return 'EnumClassDeclaration';
  if (prefix === 'annotation') return 'AnnotationClassDeclaration';
  return `${upperFirst(kind)}Declaration`;
}

function kotlinSymbolKind(kind, prefix) {
  if (kind === 'interface') return 'interface';
  if (kind === 'object') return 'module';
  if (prefix === 'enum' || prefix === 'annotation') return 'type';
  return 'class';
}

function scalaSymbolKind(kind) {
  if (kind === 'trait') return 'trait';
  if (kind === 'object') return 'module';
  if (kind === 'enum') return 'type';
  return 'class';
}

function dartSymbolKind(kind) {
  if (kind === 'mixin') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

function sqlSymbolKind(kind) {
  if (kind === 'FUNCTION' || kind === 'PROCEDURE' || kind === 'TRIGGER') return 'function';
  if (kind.includes('INDEX')) return 'index';
  if (kind === 'SCHEMA') return 'namespace';
  return 'type';
}

function sqlLanguageKind(kind) {
  return `Create${kind.toLowerCase().split(/\s+/).map(upperFirst).join('')}Statement`;
}

function normalizeSqlIdentifier(value) {
  return String(value)
    .split(/\s*\.\s*/)
    .map((part) => part.replace(/^"|"$/g, '').replace(/^`|`$/g, '').replace(/^\[|\]$/g, ''))
    .join('.');
}

function zigMetaName(source) {
  const match = source.match(/@([A-Za-z_]\w*)|^\s*(comptime)\b/);
  return match?.[1] ?? match?.[2] ?? 'comptime';
}

function elixirMetaName(source) {
  const match = source.match(/@([A-Za-z_]\w*)|\b(unquote(?:_splicing)?|quote)\b/);
  return match?.[1] ?? match?.[2] ?? 'macro';
}

function erlangAtomName(value) {
  return String(value).startsWith("'") ? String(value).slice(1, -1) : String(value);
}

function erlangMacroName(source) {
  const match = source.match(/\?([A-Za-z_]\w*)/);
  return match?.[1] ?? 'macro';
}

function haskellMetaName(source) {
  return idFragment(source).slice(0, 40);
}

function rMetaName(source) {
  const match = source.match(/([A-Za-z_][\w.]*)\s*\(/);
  return match?.[1] ?? 'dynamic';
}

function nativeDeclaration(input, lineNumber, languageKind, symbolKind, name, fields = {}, hasBody = false, options = {}) {
  const nodeId = `native_${idFragment(languageKind)}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: languageKind,
    languageKind: `${input.language}.${languageKind}`,
    name,
    symbolKind,
    symbolId: `symbol:${input.language}:${idFragment(name)}`,
    span: spanForLine(input, lineNumber),
    fields,
    metadata: { scan: 'lightweight-declaration', hasBody, ...options.metadata },
    ...(options.regionKind ? { regionKind: options.regionKind } : {}),
    ...(options.role ? { role: options.role } : {}),
    ...(hasBody ? { loss: opaqueBodyLoss(input, lineNumber, nodeId, name) } : {})
  };
}

function nativeImportDeclaration(input, lineNumber, importPath, languageKind, symbolKind) {
  const name = String(importPath);
  const nodeId = `native_${idFragment(languageKind)}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: languageKind,
    languageKind: `${input.language}.${languageKind}`,
    name,
    symbolKind,
    symbolId: `symbol:${input.language}:import:${idFragment(name)}`,
    role: 'import',
    importPath: name,
    span: spanForLine(input, lineNumber),
    fields: { importPath: name },
    metadata: { scan: 'lightweight-import' }
  };
}

function nativeMacroLoss(input, lineNumber, source, kind, name = idFragment(source).slice(0, 40)) {
  const nodeId = `native_${kind}_${lineNumber}_${idFragment(name)}`;
  return {
    nodeId,
    kind: kind === 'preprocessor' ? 'PreprocessorDirective' : 'MacroInvocation',
    languageKind: `${input.language}.${kind}`,
    name,
    symbolKind: 'constant',
    symbolId: `symbol:${input.language}:${kind}:${idFragment(name)}`,
    span: spanForLine(input, lineNumber),
    fields: { source },
    metadata: { scan: 'lightweight-macro' },
    loss: {
      id: `loss_${idFragment(nodeId)}`,
      severity: 'warning',
      phase: 'read',
      sourceFormat: input.language,
      kind,
      message: `${input.language} ${kind} retained as native source; expansion is not evaluated by the lightweight importer.`,
      span: spanForLine(input, lineNumber),
      nodeId
    }
  };
}

function opaqueBodyLoss(input, lineNumber, nodeId, name) {
  return {
    id: `loss_${idFragment(nodeId)}_body`,
    severity: 'info',
    phase: 'read',
    sourceFormat: input.language,
    kind: 'opaqueNative',
    message: `Body for ${name} is retained as native source by the lightweight declaration importer.`,
    span: spanForLine(input, lineNumber),
    nodeId
  };
}

function lightweightCoverageLosses(input, declarations, sourcePreservation) {
  const id = idFragment(input.sourcePath ?? input.language);
  const span = declarations[0]?.span ?? {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: 1,
    startColumn: 1
  };
  return [
    {
      id: `loss_${id}_declaration_only_coverage`,
      severity: 'info',
      phase: 'read',
      sourceFormat: input.language,
      kind: 'declarationOnlyCoverage',
      message: 'Lightweight importer scanned declarations and imports only; expressions, control flow, and full type checking were not evaluated.',
      span
    },
    {
      id: `loss_${id}_partial_semantic_index`,
      severity: 'info',
      phase: 'index',
      sourceFormat: input.language,
      kind: 'partialSemanticIndex',
      message: 'Semantic index contains lightweight declaration/import facts only; references, calls, resolved types, and cross-file links may be missing.',
      span
    },
    {
      id: `loss_${id}_source_map_approximation`,
      severity: 'info',
      phase: 'map',
      sourceFormat: input.language,
      kind: 'sourceMapApproximation',
      message: 'Source-map spans are declaration or line estimates; exact token ranges require a parser adapter.',
      span
    },
    {
      id: `loss_${id}_source_preservation`,
      severity: 'warning',
      phase: 'read',
      sourceFormat: input.language,
      kind: 'sourcePreservation',
      message: sourcePreservation
        ? 'Comments, whitespace, token order, directives, and formatting are preserved as opaque native source evidence; exact structural edits still require a parser adapter.'
        : 'Comments, whitespace, token order, directives, and formatting are not preserved by the lightweight importer.',
      span,
      metadata: sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservationSummary: sourcePreservation.summary
      } : undefined
    }
  ];
}

function scanPreservedSourceTokens(sourceText, input) {
  const tokens = [];
  const trivia = [];
  const includeTokens = input.includeTokens !== false;
  const includeTrivia = input.includeTrivia !== false;
  const maxTokens = Number.isFinite(input.maxTokens) ? Math.max(0, input.maxTokens) : 20000;
  const maxTrivia = Number.isFinite(input.maxTrivia) ? Math.max(0, input.maxTrivia) : 20000;
  let offset = 0;
  let line = 1;
  let column = 1;
  let truncated = false;
  const push = (target, kind, text, start) => {
    if ((target === tokens && !includeTokens) || (target === trivia && !includeTrivia)) return;
    const max = target === tokens ? maxTokens : maxTrivia;
    if (target.length >= max) {
      truncated = true;
      return;
    }
    target.push(preservedSourceSegment({
      index: target.length,
      kind,
      text,
      start,
      end: { offset, line, column },
      sourceHash: input.sourceHash,
      sourcePath: input.sourcePath
    }));
  };
  while (offset < sourceText.length) {
    const start = { offset, line, column };
    const char = sourceText[offset];
    const next = sourceText[offset + 1];
    if (char === '\r' || char === '\n') {
      const text = char === '\r' && next === '\n' ? '\r\n' : char;
      offset += text.length;
      line += 1;
      column = 1;
      push(trivia, 'newline', text, start);
      continue;
    }
    if (char === ' ' || char === '\t' || char === '\v' || char === '\f') {
      let text = '';
      while (offset < sourceText.length && /[ \t\v\f]/.test(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, 'whitespace', text, start);
      continue;
    }
    if (char === '/' && next === '/') {
      let text = '';
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, 'comment', text, start);
      continue;
    }
    if (char === '/' && next === '*') {
      let text = '';
      while (offset < sourceText.length) {
        const current = sourceText[offset];
        text += current;
        offset += 1;
        if (current === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 1;
        }
        if (current === '*' && sourceText[offset] === '/') {
          text += '/';
          offset += 1;
          column += 1;
          break;
        }
      }
      push(trivia, 'comment', text, start);
      continue;
    }
    if (char === '#' && isHashCommentLanguage(input.language)) {
      let text = '';
      while (offset < sourceText.length && sourceText[offset] !== '\n' && sourceText[offset] !== '\r') {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(trivia, preservedHashLineKind(text), text, start);
      continue;
    }
    if (char === '"' || char === '\'' || char === '`') {
      const quote = char;
      let text = char;
      offset += 1;
      column += 1;
      let escaped = false;
      while (offset < sourceText.length) {
        const current = sourceText[offset];
        text += current;
        offset += 1;
        if (current === '\n') {
          line += 1;
          column = 1;
        } else {
          column += 1;
        }
        if (escaped) {
          escaped = false;
        } else if (current === '\\') {
          escaped = true;
        } else if (current === quote) {
          break;
        }
      }
      push(tokens, 'string', text, start);
      continue;
    }
    if (/[0-9]/.test(char)) {
      let text = '';
      while (offset < sourceText.length && /[0-9a-fA-F_xXoObBeE.+-]/.test(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(tokens, 'number', text, start);
      continue;
    }
    if (isIdentifierStart(char)) {
      let text = '';
      while (offset < sourceText.length && isIdentifierPart(sourceText[offset])) {
        text += sourceText[offset];
        offset += 1;
        column += 1;
      }
      push(tokens, preservedKeywordSet.has(text) ? 'keyword' : 'identifier', text, start);
      continue;
    }
    let text = char;
    if (/[=+\-*/%&|^!<>?:.]/.test(char)) {
      while (offset + text.length < sourceText.length && /[=+\-*/%&|^!<>?:.]/.test(sourceText[offset + text.length])) text += sourceText[offset + text.length];
      offset += text.length;
      column += text.length;
      push(tokens, 'operator', text, start);
    } else {
      offset += 1;
      column += 1;
      push(tokens, /[()[\]{};,]/.test(char) ? 'punctuation' : 'unknown', text, start);
    }
  }
  return { tokens, trivia, truncated };
}

function scanPreservedSourceDirectives(sourceText, input) {
  const directives = [];
  const maxDirectives = Number.isFinite(input.maxDirectives) ? Math.max(0, input.maxDirectives) : 20000;
  let truncated = false;
  let offset = 0;
  for (const { line, number } of sourceLines(sourceText)) {
    const trimmed = line.trim();
    const directiveKind = preservedDirectiveKind(trimmed, input.language);
    if (directiveKind) {
      if (directives.length >= maxDirectives) {
        truncated = true;
        offset += line.length + 1;
        continue;
      }
      const startColumn = Math.max(1, line.indexOf(trimmed) + 1);
      directives.push({
        id: `directive_${idFragment(input.sourcePath ?? input.language)}_${directives.length + 1}`,
        kind: directiveKind,
        text: trimmed,
        textHash: hashSemanticValue(trimmed),
        span: {
          sourceId: input.sourceHash,
          path: input.sourcePath,
          start: offset + startColumn - 1,
          end: offset + startColumn - 1 + trimmed.length,
          startLine: number,
          startColumn,
          endLine: number,
          endColumn: startColumn + trimmed.length
        },
        metadata: { language: input.language }
      });
    }
    offset += line.length + 1;
  }
  return { directives, truncated };
}

function preservedSourceSegment(input) {
  const id = `${input.kind}_${input.index + 1}_${idFragment(input.start.offset)}`;
  return {
    id,
    kind: input.kind,
    text: input.text,
    textHash: hashSemanticValue(input.text),
    span: {
      sourceId: input.sourceHash,
      path: input.sourcePath,
      start: input.start.offset,
      end: input.end.offset,
      startLine: input.start.line,
      startColumn: input.start.column,
      endLine: input.end.line,
      endColumn: input.end.column
    }
  };
}

function preservedDirectiveKind(trimmed, language) {
  if (!trimmed) return undefined;
  if (/^#\s*(include|define|if|ifdef|ifndef|elif|else|endif|pragma)\b/.test(trimmed)) return 'preprocessor';
  if (/^#!\s*/.test(trimmed)) return 'shebang';
  if (/^['"]use strict['"];?$/.test(trimmed)) return 'runtime-directive';
  if (/^(import|export|package|module|namespace|use|using|from|require)\b/.test(trimmed)) return 'module-directive';
  if (normalizeNativeLanguageId(language) === 'python' && /^from\s+\S+\s+import\b/.test(trimmed)) return 'module-directive';
  return undefined;
}

function preservedHashLineKind(text) {
  return preservedDirectiveKind(String(text).trim(), 'c') ? 'directive' : 'comment';
}

function isHashCommentLanguage(language) {
  return ['python', 'ruby', 'shell', 'bash', 'zsh', 'r', 'perl', 'yaml', 'toml'].includes(normalizeNativeLanguageId(language));
}

function detectNewlineStyle(sourceText) {
  const crlf = (sourceText.match(/\r\n/g) ?? []).length;
  const normalized = sourceText.replace(/\r\n/g, '');
  const lf = (normalized.match(/\n/g) ?? []).length;
  const cr = (normalized.match(/\r/g) ?? []).length;
  const kinds = [crlf ? 'crlf' : undefined, lf ? 'lf' : undefined, cr ? 'cr' : undefined].filter(Boolean);
  if (!kinds.length) return 'none';
  if (kinds.length > 1 || cr) return 'mixed';
  return kinds[0];
}

const preservedKeywordSet = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def', 'defer',
  'do', 'else', 'enum', 'export', 'extends', 'extern', 'false', 'final', 'fn', 'for', 'from', 'func', 'function',
  'if', 'impl', 'import', 'in', 'interface', 'let', 'match', 'mod', 'module', 'mut', 'namespace', 'new', 'nil',
  'none', 'null', 'package', 'private', 'protected', 'pub', 'public', 'return', 'self', 'static', 'struct',
  'switch', 'this', 'throw', 'trait', 'true', 'try', 'type', 'use', 'using', 'var', 'while', 'yield'
]);

function isIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char ?? '');
}

function isIdentifierPart(char) {
  return /[A-Za-z0-9_$]/.test(char ?? '');
}

function sourceLines(sourceText) {
  return String(sourceText ?? '').split(/\r?\n/).map((line, index) => ({ line, number: index + 1 }));
}

function spanForLine(input, lineNumber) {
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: lineNumber,
    endLine: lineNumber,
    startColumn: 1
  };
}

function splitParameters(raw) {
  return String(raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitTypeParameters(raw) {
  return splitParameters(raw);
}

function braceDelta(source) {
  let delta = 0;
  for (const char of String(source ?? '')) {
    if (char === '{') delta += 1;
    if (char === '}') delta -= 1;
  }
  return delta;
}

function jsControlKeyword(value) {
  return ['if', 'for', 'while', 'switch', 'catch', 'with'].includes(String(value));
}

function inferSourceMapMappings(input) {
  const semanticIndex = input.semanticIndex;
  const nativeAst = input.nativeAst;
  const nativeSource = input.nativeSource;
  const evidenceIds = [
    ...(semanticIndex?.evidence ?? []).map((record) => record.id),
    ...(input.evidence ?? []).map((record) => record.id)
  ];
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));

  if (semanticIndex?.occurrences?.length) {
    return semanticIndex.occurrences
      .filter((occurrence) => occurrence.nativeAstNodeId || occurrence.span)
      .map((occurrence) => {
        const symbol = symbolsById.get(occurrence.symbolId);
        const nativeNode = occurrence.nativeAstNodeId ? nativeAst?.nodes?.[occurrence.nativeAstNodeId] : undefined;
        return {
          id: `map_${idFragment(occurrence.id)}`,
          nativeSourceId: nativeSource?.id,
          nativeAstNodeId: occurrence.nativeAstNodeId,
          semanticSymbolId: occurrence.symbolId,
          semanticOccurrenceId: occurrence.id,
          semanticNodeId: occurrence.semanticNodeId ?? symbol?.semanticNodeId,
          sourceSpan: occurrence.span ?? nativeNode?.span,
          evidenceIds,
          lossIds: lossIdsForNativeNode(input.losses ?? nativeAst?.losses ?? [], occurrence.nativeAstNodeId),
          ownershipRegionId: symbol?.metadata?.ownershipRegionId,
          ownershipRegionKey: symbol?.metadata?.ownershipRegionKey,
          ownershipRegionKind: symbol?.metadata?.ownershipRegionKind,
          precision: occurrence.span || nativeNode?.span ? 'declaration' : 'unknown'
        };
      });
  }

  return Object.values(nativeAst?.nodes ?? {})
    .filter((node) => node.span)
    .map((node) => ({
      id: `map_${idFragment(node.id)}`,
      nativeSourceId: nativeSource?.id,
      nativeAstNodeId: node.id,
      sourceSpan: node.span,
      evidenceIds,
      lossIds: lossIdsForNativeNode(input.losses ?? nativeAst?.losses ?? [], node.id),
      precision: 'line'
    }));
}

function normalizeSourceMapMappings(mappings, context) {
  if (mappings === undefined || mappings === null) return [];
  if (!Array.isArray(mappings)) {
    throw new Error('Source-map mappings must be an array');
  }
  const semanticIndex = context.semanticIndex;
  const nativeAst = context.nativeAst;
  const nativeSource = context.nativeSource;
  const symbolsById = new Map((semanticIndex?.symbols ?? []).map((symbol) => [symbol.id, symbol]));
  const occurrencesById = new Map((semanticIndex?.occurrences ?? []).map((occurrence) => [occurrence.id, occurrence]));
  const evidenceIds = uniqueStrings([
    ...(semanticIndex?.evidence ?? []).map((record) => record.id),
    ...(context.evidence ?? []).map((record) => record.id),
    ...(context.sourceMapEvidence ?? []).map((record) => record.id)
  ]);
  const usedMappingIds = new Set();
  return mappings
    .map((mapping, index) => {
      if (!mapping || typeof mapping !== 'object') {
        throw new Error(`Source-map mapping ${index + 1} must be an object`);
      }
      const occurrence = mapping.semanticOccurrenceId ? occurrencesById.get(mapping.semanticOccurrenceId) : undefined;
      const symbol = mapping.semanticSymbolId ? symbolsById.get(mapping.semanticSymbolId) : occurrence ? symbolsById.get(occurrence.symbolId) : undefined;
      const nativeAstNodeId = mapping.nativeAstNodeId ?? occurrence?.nativeAstNodeId;
      const nativeNode = nativeAstNodeId ? nativeAst?.nodes?.[nativeAstNodeId] : undefined;
      const sourceSpan = mapping.sourceSpan ?? occurrence?.span ?? nativeNode?.span;
      const target = mapping.target ?? mapping.generatedSpan?.target ?? context.target;
      const generatedSpan = normalizeGeneratedSpan(mapping.generatedSpan, target, context.targetPath, context.targetHash);
      const mappingLossIds = normalizeReferenceIds(mapping.lossIds, lossIdsForNativeNode(context.losses ?? nativeAst?.losses ?? [], nativeAstNodeId));
      const precision = normalizeSourceMapPrecision(mapping.precision, sourceSpan, generatedSpan);
      if (
        !nativeAstNodeId &&
        !mapping.semanticNodeId &&
        !mapping.semanticSymbolId &&
        !mapping.semanticOccurrenceId &&
        !sourceSpan &&
        !generatedSpan &&
        !mapping.generatedName
      ) {
        throw new Error(`Source-map mapping ${index + 1} must reference a native AST node, semantic node, symbol, occurrence, source span, or generated span`);
      }
      const normalizedMapping = {
        ...mapping,
        nativeSourceId: mapping.nativeSourceId ?? nativeSource?.id,
        nativeAstNodeId,
        semanticSymbolId: mapping.semanticSymbolId ?? occurrence?.symbolId,
        semanticOccurrenceId: mapping.semanticOccurrenceId ?? occurrence?.id,
        semanticNodeId: mapping.semanticNodeId ?? occurrence?.semanticNodeId ?? symbol?.semanticNodeId,
        sourceSpan,
        generatedSpan,
        target,
        evidenceIds: normalizeReferenceIds(mapping.evidenceIds, evidenceIds),
        lossIds: mappingLossIds,
        ownershipRegionId: mapping.ownershipRegionId ?? symbol?.metadata?.ownershipRegionId,
        ownershipRegionKey: mapping.ownershipRegionKey ?? symbol?.metadata?.ownershipRegionKey,
        ownershipRegionKind: mapping.ownershipRegionKind ?? symbol?.metadata?.ownershipRegionKind,
        precision,
        preservation: normalizeSourcePreservationLevel(mapping.preservation, {
          precision,
          lossIds: mappingLossIds,
          losses: context.losses ?? nativeAst?.losses ?? [],
          sourcePreservation: context.sourcePreservation
        })
      };
      return {
        ...normalizedMapping,
        id: reserveUniqueId(sourceMapMappingBaseId(normalizedMapping, index), usedMappingIds)
      };
    });
}

function lossIdsForNativeNode(losses, nativeAstNodeId) {
  if (!nativeAstNodeId) return [];
  return (losses ?? [])
    .filter((loss) => loss.nodeId === nativeAstNodeId)
    .map((loss) => loss.id);
}

function normalizeSourceMaps(sourceMaps, context) {
  if (sourceMaps === undefined || sourceMaps === null) return [];
  if (!Array.isArray(sourceMaps)) {
    throw new Error('Native import sourceMaps must be an array');
  }
  const usedSourceMapIds = new Set();
  return sourceMaps.map((sourceMap, index) => {
    if (!sourceMap || typeof sourceMap !== 'object') {
      throw new Error(`Native import source map ${index + 1} must be an object`);
    }
    const id = reserveUniqueId(String(sourceMap.id ?? `${context.defaultSourceMapId}_${index + 1}`), usedSourceMapIds);
    const evidence = uniqueRecordsById([...(sourceMap.evidence ?? []), ...(context.evidence ?? [])]);
    const target = sourceMap.target ?? context.target;
    const targetPath = sourceMap.targetPath ?? context.targetPath;
    const targetHash = sourceMap.targetHash ?? context.targetHash;
    const mappings = normalizeSourceMapMappings(sourceMap.mappings ?? [], {
      ...context,
      target,
      targetPath,
      targetHash,
      sourceMapEvidence: evidence
    });
    const normalized = createSourceMapRecord({
      ...sourceMap,
      id,
      sourcePath: sourceMap.sourcePath ?? context.sourcePath,
      sourceHash: sourceMap.sourceHash ?? context.sourceHash,
      target,
      targetPath: targetPath ?? commonGeneratedTargetPath(mappings),
      targetHash,
      semanticIndexId: sourceMap.semanticIndexId ?? context.semanticIndex?.id,
      nativeAstId: sourceMap.nativeAstId ?? context.nativeAst?.id,
      nativeSourceId: sourceMap.nativeSourceId ?? context.nativeSource?.id,
      mappings,
      evidence
    });
    const issues = validateSourceMapRecord(normalized, {
      document: context.document,
      nativeSources: context.nativeSources,
      nativeAst: context.nativeAst,
      semanticIndex: context.semanticIndex,
      losses: context.losses,
      evidence: context.evidence
    });
    if (issues.length) {
      throw new Error(`Invalid Frontier native source map ${normalized.id}: ${issues.join('; ')}`);
    }
    return normalized;
  });
}

function normalizeGeneratedSpan(generatedSpan, target, targetPath, targetHash) {
  if (!generatedSpan) return generatedSpan;
  return {
    ...generatedSpan,
    target: generatedSpan.target ?? target,
    targetPath: generatedSpan.targetPath ?? target?.emitPath ?? targetPath,
    targetHash: generatedSpan.targetHash ?? targetHash
  };
}

function normalizeSourceMapPrecision(value, sourceSpan, generatedSpan) {
  const explicit = value === undefined || value === null ? '' : String(value).trim();
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized === 'exact') {
      return hasExactSpan(sourceSpan) && hasExactSpan(generatedSpan)
        ? 'exact'
        : inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan);
    }
    if (normalized === 'declaration' || normalized === 'line' || normalized === 'estimated' || normalized === 'unknown') return normalized;
    if (normalized === 'estimate' || normalized === 'approx' || normalized === 'approximate' || normalized === 'approximated') return 'estimated';
    return explicit;
  }
  return inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan);
}

function inferSourceMapPrecisionFromSpans(sourceSpan, generatedSpan) {
  if (hasExactSpan(sourceSpan) && hasExactSpan(generatedSpan)) return 'exact';
  if (sourceSpan?.startLine && generatedSpan?.startLine) return 'line';
  if (sourceSpan?.startLine) return 'declaration';
  if (generatedSpan?.startLine) return 'line';
  return 'unknown';
}

function normalizeSourcePreservationLevel(value, context = {}) {
  const explicit = value === undefined || value === null ? '' : String(value).trim();
  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized === 'exact' || normalized === 'declaration' || normalized === 'estimated' || normalized === 'blocked') return normalized;
    if (normalized === 'estimate' || normalized === 'approx' || normalized === 'approximate' || normalized === 'approximated' || normalized === 'line') return 'estimated';
    return explicit;
  }

  const lossIds = new Set(context.lossIds ?? []);
  const linkedLosses = (context.losses ?? []).filter((loss) => lossIds.has(loss.id));
  if (linkedLosses.some((loss) => loss.severity === 'error')) return 'blocked';
  if (context.precision === 'exact') return 'exact';
  if (context.precision === 'declaration') return 'declaration';
  if (context.precision === 'line' || context.precision === 'estimated' || context.precision === 'unknown') return 'estimated';
  if (context.sourcePreservation?.summary?.exactSourceAvailable === true) return 'estimated';
  return 'estimated';
}

function hasExactSpan(span) {
  return Boolean(span && (
    (typeof span.start === 'number' && typeof span.end === 'number') ||
    (
      typeof span.startLine === 'number' &&
      typeof span.startColumn === 'number' &&
      typeof span.endLine === 'number' &&
      typeof span.endColumn === 'number'
    )
  ));
}

function normalizeReferenceIds(value, fallback = []) {
  if (value === undefined || value === null) return uniqueStrings(fallback);
  return uniqueStrings(Array.isArray(value) ? value : [value]);
}

function sourceMapMappingBaseId(mapping, index) {
  const explicit = mapping.id === undefined || mapping.id === null ? '' : String(mapping.id).trim();
  if (explicit) return explicit;
  const span = mapping.sourceSpan ?? mapping.generatedSpan;
  const spanPart = span
    ? `${span.path ?? span.targetPath ?? span.sourceId ?? 'span'}_${span.start ?? span.startLine ?? ''}_${span.end ?? span.endLine ?? ''}`
    : undefined;
  return `map_${idFragment([
    mapping.nativeAstNodeId,
    mapping.semanticOccurrenceId,
    mapping.semanticSymbolId,
    mapping.semanticNodeId,
    spanPart,
    index + 1
  ].filter(Boolean).join('_'))}`;
}

function reserveUniqueId(baseId, usedIds) {
  const safeBase = String(baseId || 'id');
  if (!usedIds.has(safeBase)) {
    usedIds.add(safeBase);
    return safeBase;
  }
  let index = 2;
  while (usedIds.has(`${safeBase}_${index}`)) index += 1;
  const id = `${safeBase}_${index}`;
  usedIds.add(id);
  return id;
}

function commonGeneratedTargetPath(mappings) {
  const paths = uniqueStrings((mappings ?? [])
    .map((mapping) => mapping.generatedSpan?.targetPath ?? mapping.target?.emitPath)
    .filter(Boolean));
  return paths.length === 1 ? paths[0] : undefined;
}

function uniqueRecordsById(records) {
  const seen = new Set();
  const result = [];
  for (const record of records ?? []) {
    if (!record?.id || seen.has(record.id)) continue;
    seen.add(record.id);
    result.push(record);
  }
  return result;
}

function normalizeNativeLossRecords(losses) {
  return (Array.isArray(losses) ? losses : [losses])
    .filter((loss) => loss !== undefined && loss !== null)
    .map((loss, index) => normalizeNativeLossRecord(loss, `loss_${index + 1}`));
}

function normalizeNativeLossRecord(loss, fallbackId) {
  const record = typeof loss === 'string' ? { message: loss } : loss ?? {};
  const severity = normalizeLossSeverity(record.severity);
  const kind = normalizeNativeLossKind(record, severity);
  const category = nativeImportCategoryForLossKind(kind);
  return {
    ...record,
    id: String(record.id ?? fallbackId),
    severity,
    kind,
    message: String(record.message ?? `${kind} loss during native import.`),
    metadata: {
      lossCategory: category,
      semanticMergeAdmission: semanticMergeAdmissionForSeverity(severity),
      dashboardSeverity: severity,
      ...record.metadata
    }
  };
}

function normalizeLossSeverity(value) {
  const severity = String(value ?? 'warning').toLowerCase();
  if (severity === 'error') return 'error';
  if (severity === 'info') return 'info';
  return 'warning';
}

function normalizeNativeLossKind(loss, severity) {
  const kind = String(loss.kind ?? '').trim();
  if (kind) return kind;
  if (loss.metadata?.diagnosticId || loss.metadata?.diagnosticCode) {
    return severity === 'error' ? 'unsupportedSyntax' : 'parserDiagnostic';
  }
  return severity === 'error' ? 'unsupportedSyntax' : 'opaqueNative';
}

function nativeImportCategoryForLossKind(kind) {
  if (kind === 'declarationOnlyCoverage') return 'declarationsOnly';
  if (kind === 'opaqueNative') return 'opaqueBodies';
  if (kind === 'macroExpansion') return 'macroExpansion';
  if (kind === 'preprocessor' || kind === 'conditionalCompilation' || kind === 'macroHygiene') return 'preprocessor';
  if (kind === 'metaprogramming' || kind === 'reflection' || kind === 'dynamicDispatch' || kind === 'dynamicRuntime') return 'metaprogramming';
  if (kind === 'generatedCode') return 'generatedCode';
  if (kind === 'overloadResolution' || kind === 'typeInference') return 'overloadTypeInference';
  if (kind === 'sourcePreservation' || kind === 'commentsTrivia' || kind === 'nonRoundTrippable') return 'sourcePreservation';
  if (kind === 'parserDiagnostic') return 'parserDiagnostics';
  if (kind === 'unsupportedSyntax' || kind === 'unsupportedSemantic') return 'unsupportedSyntax';
  if (kind === 'partialSemanticIndex' || kind === 'unverifiedNativeAst') return 'partialSemanticIndex';
  if (kind === 'sourceMapApproximation') return 'sourceMapApproximation';
  if (kind === 'targetProjectionLoss') return 'targetProjectionLoss';
  return String(kind ?? 'opaqueNative');
}

function nativeImportFeatureEvidencePolicy(kind, input = {}) {
  return Object.freeze({
    kind,
    category: input.category ?? nativeImportCategoryForLossKind(kind),
    risk: input.risk ?? 'medium',
    minimumReadiness: normalizeSemanticMergeReadiness(input.minimumReadiness) ?? 'needs-review',
    missingEvidenceReadiness: normalizeSemanticMergeReadiness(input.missingEvidenceReadiness) ?? 'needs-review',
    requiredEvidenceKeys: Object.freeze(uniqueStrings(input.requiredEvidenceKeys ?? [])),
    recommendedEvidenceKeys: Object.freeze(uniqueStrings(input.recommendedEvidenceKeys ?? [])),
    notes: Object.freeze(uniqueStrings(input.notes ?? []))
  });
}

function nativeImportFeatureEvidenceHasKey(loss, evidence, key) {
  return nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(loss, key))
    || (evidence ?? []).some((record) => nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(record, key)));
}

function nativeImportFeatureEvidenceValue(record, key) {
  if (!record || !key) return undefined;
  const candidates = [record, record.metadata].filter(Boolean);
  for (const candidate of candidates) {
    const direct = candidate[key];
    if (direct !== undefined) return direct;
    const dotted = String(key).split('.').reduce((current, part) => current?.[part], candidate);
    if (dotted !== undefined) return dotted;
  }
  return undefined;
}

function nativeImportFeatureEvidenceValuePresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function nativeImportFeatureEvidenceIds(loss, evidence, policy) {
  const keys = [...policy.requiredEvidenceKeys, ...policy.recommendedEvidenceKeys];
  return uniqueStrings((evidence ?? [])
    .filter((record) => keys.some((key) => nativeImportFeatureEvidenceValuePresent(nativeImportFeatureEvidenceValue(record, key))))
    .map((record) => record.id)
    .filter(Boolean)
    .concat(loss.evidenceIds ?? []));
}

function nativeImportFeatureEvidenceReasons(issues) {
  return uniqueStrings((issues ?? []).flatMap((issue) => {
    const missing = issue.missingRequiredEvidence ?? [];
    if (!missing.length) return [];
    return [`${issue.kind} loss ${issue.lossId} is missing required evidence: ${missing.join(', ')}.`];
  }));
}

function normalizeProjectionMatrixTargets(targets) {
  return uniqueStrings((Array.isArray(targets) ? targets : [targets])
    .map((target) => {
      if (target === undefined || target === null) return undefined;
      try {
        return normalizeCompileTarget(target);
      } catch {
        return String(target).trim().toLowerCase();
      }
    })
    .filter(Boolean));
}

function projectionTargetCoverageForProfile(profile, context) {
  const aliases = new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
  const matchingImports = (context.imports ?? []).filter((imported) => aliases.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language)));
  const matchingAdapters = (context.adapters ?? []).filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.language)));
  const matchingTargetAdapters = (context.targetAdapters ?? []).filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.sourceLanguage ?? adapter?.language)));
  const importedLossKinds = uniqueStrings(matchingImports.flatMap((imported) => (imported?.losses ?? []).map((loss) => loss.kind).filter(Boolean)));
  const knownLossKinds = uniqueStrings([...(profile.knownLossKinds ?? []), ...importedLossKinds]);
  const parserAdapters = uniqueStrings([
    ...(profile.parserAdapters ?? []),
    ...matchingAdapters.map((adapter) => adapter.parser ?? adapter.id).filter(Boolean)
  ]);
  const sourceProjection = sourceProjectionCoverageForProfile(profile, matchingImports, knownLossKinds);
  const targets = (context.targets ?? FrontierCompileTargets).map((target) => projectionTargetCoverageEntry(profile, target, {
    matchingImports,
    matchingAdapters,
    matchingTargetAdapters,
    knownLossKinds
  }));
  return {
    language: profile.language,
    aliases: profile.aliases,
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    parserAdapters,
    projectionTargets: profile.projectionTargets,
    knownLossKinds,
    defaultReadiness: profile.defaultReadiness,
    notes: profile.notes,
    sourceProjection,
    targets,
    summary: {
      imports: matchingImports.length,
      parserAdapters: parserAdapters.length,
      targetEntries: targets.length,
      byLossClass: countProjectionLossClasses(targets),
      exactSourceImports: sourceProjection.exactSource.evidence.importsWithExactSource,
      stubDeclarationImports: sourceProjection.stubs.evidence.importsWithDeclarations
    }
  };
}

function sourceProjectionCoverageForProfile(profile, imports, knownLossKinds) {
  const exactSourceImports = imports.filter(hasExactSourceProjectionEvidence).length;
  const declarationImports = imports.filter(hasNativeProjectionDeclarations).length;
  return {
    exactSource: {
      lossClass: 'exactSourceProjection',
      mode: 'preserved-source',
      supported: true,
      readiness: 'ready',
      lossKinds: [],
      categories: [],
      reason: exactSourceImports
        ? 'At least one import carries matching source-preservation evidence, so projectNativeImportToSource can emit the original source exactly.'
        : 'Exact source projection is available when the import carries sourceText or source-preservation evidence whose hash matches the native source hash.',
      evidence: {
        imports: imports.length,
        importsWithExactSource: exactSourceImports
      },
      notes: ['Preserved source is the only currently lossless native-source projection mode in this facade.']
    },
    stubs: {
      lossClass: 'nativeSourceStubs',
      mode: 'native-source-stubs',
      supported: profile.supportsLightweightScan || declarationImports > 0,
      readiness: 'needs-review',
      lossKinds: uniqueStrings([
        'targetProjectionLoss',
        ...(declarationImports || profile.supportsLightweightScan ? [] : ['declarationOnlyCoverage'])
      ]),
      categories: uniqueStrings([
        'targetProjectionLoss',
        ...(declarationImports || profile.supportsLightweightScan ? [] : ['declarationsOnly'])
      ]),
      reason: 'Declaration stubs are emitted when exact source is unavailable or disabled; executable bodies and full type semantics remain unavailable.',
      evidence: {
        imports: imports.length,
        importsWithDeclarations: declarationImports
      },
      notes: uniqueStrings([
        'Stub projection is review-required and should not be treated as a round-trip proof.',
        ...(projectionUnsupportedFeatureLossKinds(knownLossKinds).length
          ? ['Known source-language feature losses may still be present behind preserved source or stubs.']
          : [])
      ])
    }
  };
}

function projectionTargetCoverageEntry(profile, target, context) {
  const normalizedTarget = normalizeProjectionMatrixTargets([target])[0] ?? String(target);
  const declaredTargets = new Set(normalizeProjectionMatrixTargets(profile.projectionTargets ?? []));
  const adapterTargets = new Set((context.matchingAdapters ?? []).flatMap(adapterProjectionTargets));
  const targetAdapter = matchingNativeTargetProjectionAdapter({
    sourceLanguage: profile.language,
    target: normalizedTarget,
    sourcePath: context.matchingImports?.[0]?.sourcePath ?? context.matchingImports?.[0]?.nativeSource?.sourcePath
  }, context.matchingTargetAdapters ?? []);
  const targetAdapterSummary = targetAdapter ? normalizeNativeTargetProjectionAdapter(targetAdapter) : undefined;
  const sameSourceTarget = nativeLanguageCompileTarget(profile.language, profile.aliases) === normalizedTarget;
  const hasProjectionAdapter = Boolean(targetAdapterSummary) || declaredTargets.has(normalizedTarget) || adapterTargets.has(normalizedTarget);
  if (!hasProjectionAdapter) {
    return {
      target: normalizedTarget,
      lossClass: 'missingAdapter',
      supported: false,
      readiness: 'blocked',
      lossKinds: ['targetProjectionLoss'],
      categories: ['targetProjectionLoss'],
      reason: `No native-to-${normalizedTarget} projection adapter is declared for ${profile.language}.`,
      adapter: undefined,
      notes: ['The source can still be preserved or stubbed in its original language when import evidence supports that mode.']
    };
  }

  const featureLossKinds = projectionUnsupportedFeatureLossKinds(context.knownLossKinds);
  if (targetAdapterSummary) {
    const handledLossKinds = new Set(targetAdapterSummary.coverage.handledLossKinds ?? []);
    const unhandledFeatureLossKinds = featureLossKinds.filter((kind) => !handledLossKinds.has(kind));
    if (unhandledFeatureLossKinds.length) {
      return {
        target: normalizedTarget,
        lossClass: 'unsupportedTargetFeatures',
        supported: true,
        readiness: 'needs-review',
        lossKinds: unhandledFeatureLossKinds,
        categories: uniqueStrings(unhandledFeatureLossKinds.map(nativeImportCategoryForLossKind)),
        reason: `${profile.language} has target adapter ${targetAdapterSummary.id}, but source feature losses remain unhandled for ${normalizedTarget}: ${unhandledFeatureLossKinds.join(', ')}.`,
        adapter: targetAdapterSummary.id,
        adapterKind: 'targetProjection',
        adapterVersion: targetAdapterSummary.version,
        adapterCoverage: targetAdapterSummary.coverage,
        notes: uniqueStrings([
          ...(targetAdapterSummary.coverage.notes ?? []),
          'Adapter output is available, but merge readiness still requires review for unhandled source-language feature losses.'
        ])
      };
    }
    const adapterLossKinds = uniqueStrings(targetAdapterSummary.coverage.lossKinds ?? []);
    return {
      target: normalizedTarget,
      lossClass: 'targetAdapterProjection',
      supported: true,
      readiness: targetAdapterSummary.coverage.readiness ?? 'needs-review',
      lossKinds: adapterLossKinds,
      categories: uniqueStrings(adapterLossKinds.map(nativeImportCategoryForLossKind)),
      reason: `${profile.language} can project to ${normalizedTarget} through host target adapter ${targetAdapterSummary.id}.`,
      adapter: targetAdapterSummary.id,
      adapterKind: 'targetProjection',
      adapterVersion: targetAdapterSummary.version,
      adapterCoverage: targetAdapterSummary.coverage,
      notes: uniqueStrings([
        ...(targetAdapterSummary.coverage.notes ?? []),
        'The host adapter owns native-to-target translation semantics and must provide evidence for merge admission.'
      ])
    };
  }

  if (featureLossKinds.length) {
    return {
      target: normalizedTarget,
      lossClass: 'unsupportedTargetFeatures',
      supported: true,
      readiness: 'needs-review',
      lossKinds: featureLossKinds,
      categories: uniqueStrings(featureLossKinds.map(nativeImportCategoryForLossKind)),
      reason: `${profile.language} coverage declares source features that this facade cannot prove lossless for ${normalizedTarget}: ${featureLossKinds.join(', ')}.`,
      adapter: projectionTargetAdapterName(profile, normalizedTarget, context.matchingAdapters),
      notes: ['Use exact parser or semantic adapter evidence before treating this target projection as merge-ready.']
    };
  }

  if (sameSourceTarget) {
    return {
      target: normalizedTarget,
      lossClass: 'exactSourceProjection',
      supported: true,
      readiness: 'ready',
      lossKinds: [],
      categories: [],
      reason: `${profile.language} can project to its source language exactly when source preservation evidence is available.`,
      adapter: projectionTargetAdapterName(profile, normalizedTarget, context.matchingAdapters),
      notes: ['Without exact source text, the source projection falls back to declaration stubs.']
    };
  }

  return {
    target: normalizedTarget,
    lossClass: 'nativeSourceStubs',
    supported: true,
    readiness: 'needs-review',
    lossKinds: ['targetProjectionLoss'],
    categories: ['targetProjectionLoss'],
    reason: `${profile.language} declares a ${normalizedTarget} target slot, but this facade only exposes declaration-level native import projection evidence.`,
    adapter: projectionTargetAdapterName(profile, normalizedTarget, context.matchingAdapters),
    notes: ['Host-owned semantic adapters can upgrade this cell with stronger evidence.']
  };
}

function projectionTargetLossMatrixSummary(languages) {
  const byLossClass = {};
  const sourceProjectionByLossClass = {};
  let targetEntries = 0;
  for (const language of languages) {
    for (const projection of [language.sourceProjection?.exactSource, language.sourceProjection?.stubs].filter(Boolean)) {
      sourceProjectionByLossClass[projection.lossClass] = (sourceProjectionByLossClass[projection.lossClass] ?? 0) + 1;
    }
    for (const target of language.targets ?? []) {
      targetEntries += 1;
      byLossClass[target.lossClass] = (byLossClass[target.lossClass] ?? 0) + 1;
    }
  }
  return {
    languages: languages.length,
    targetEntries,
    byLossClass,
    sourceProjectionByLossClass,
    exactSourceProjection: (sourceProjectionByLossClass.exactSourceProjection ?? 0) + (byLossClass.exactSourceProjection ?? 0),
    nativeSourceStubs: (sourceProjectionByLossClass.nativeSourceStubs ?? 0) + (byLossClass.nativeSourceStubs ?? 0),
    targetAdapterProjection: byLossClass.targetAdapterProjection ?? 0,
    unsupportedTargetFeatures: byLossClass.unsupportedTargetFeatures ?? 0,
    missingAdapters: byLossClass.missingAdapter ?? 0
  };
}

function countProjectionLossClasses(entries) {
  const counts = {};
  for (const entry of entries ?? []) {
    counts[entry.lossClass] = (counts[entry.lossClass] ?? 0) + 1;
  }
  return counts;
}

function hasExactSourceProjectionEvidence(imported) {
  const preservation = imported?.metadata?.sourcePreservation
    ?? imported?.nativeSource?.metadata?.sourcePreservation
    ?? imported?.nativeAst?.metadata?.sourcePreservation;
  const expectedHash = imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash;
  return Boolean(preservation?.summary?.exactSourceAvailable && (!expectedHash || preservation.sourceHash === expectedHash));
}

function hasNativeProjectionDeclarations(imported) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  return (semanticIndex?.symbols?.length ?? 0) > 0;
}

function projectionUnsupportedFeatureLossKinds(lossKinds) {
  const unsupported = new Set([
    'macroExpansion',
    'macroHygiene',
    'preprocessor',
    'conditionalCompilation',
    'metaprogramming',
    'reflection',
    'dynamicRuntime',
    'dynamicDispatch',
    'generatedCode',
    'overloadResolution',
    'typeInference',
    'unsupportedSyntax',
    'unsupportedSemantic'
  ]);
  return uniqueStrings((lossKinds ?? []).filter((kind) => unsupported.has(kind)));
}

function adapterProjectionTargets(adapter) {
  return normalizeProjectionMatrixTargets(
    adapter?.projectionTargets
      ?? adapter?.coverage?.projectionTargets
      ?? adapter?.metadata?.projectionTargets
      ?? []
  );
}

function projectionTargetAdapterName(profile, target, adapters = []) {
  const adapter = adapters.find((candidate) => adapterProjectionTargets(candidate).includes(target));
  if (adapter) return adapter.id ?? adapter.parser;
  return profile.projectionTargets?.includes(target) ? `frontier-native-source-${target}` : undefined;
}

function nativeLanguageCompileTarget(language, aliases = []) {
  const ids = [language, ...aliases].map(normalizeNativeLanguageId);
  if (ids.includes('typescript')) return 'typescript';
  if (ids.includes('javascript')) return 'javascript';
  if (ids.includes('rust')) return 'rust';
  if (ids.includes('python')) return 'python';
  if (ids.includes('c')) return 'c';
  return undefined;
}

function isNativeSourceImportResult(input) {
  return Boolean(input && typeof input === 'object' && input.kind === 'frontier.lang.importResult' && input.nativeSource && input.universalAst);
}

function nativeCompileSourceLanguage(importResult, input) {
  return normalizeNativeLanguageId(
    importResult.language
      ?? importResult.nativeSource?.language
      ?? importResult.nativeAst?.language
      ?? importResult.nativeSource?.ast?.language
      ?? input?.language
  ) || String(importResult.language ?? input?.language ?? 'source');
}

function nativeCompileTarget(input, importResult, options) {
  const targetInput = options.target
    ?? compileTargetLanguage(input?.target)
    ?? compileTargetLanguage(importResult.nativeSource?.target)
    ?? nativeLanguageCompileTarget(nativeCompileSourceLanguage(importResult, input))
    ?? 'typescript';
  return normalizeProjectionMatrixTargets([targetInput])[0] ?? String(targetInput ?? 'typescript').toLowerCase();
}

function compileTargetLanguage(target) {
  if (!target) return undefined;
  if (typeof target === 'string') return target;
  return target.language ?? target.emitLanguage ?? target.target ?? target.name;
}

function nativeSourceCompileTargetCoverage(matrix, language, target) {
  const sourceLanguage = normalizeNativeLanguageId(language);
  const entry = (matrix.languages ?? []).find((candidate) => {
    const ids = [candidate.language, ...(candidate.aliases ?? [])].map(normalizeNativeLanguageId);
    return ids.includes(sourceLanguage);
  });
  const coverage = entry?.targets?.find((candidate) => candidate.target === target);
  if (coverage) return coverage;
  return {
    target,
    lossClass: 'missingAdapter',
    supported: false,
    readiness: 'blocked',
    lossKinds: ['targetProjectionLoss'],
    categories: ['targetProjectionLoss'],
    reason: `No native-to-${target} projection coverage is available for ${language}.`,
    adapter: undefined,
    notes: ['Inject a source-language parser and target projection adapter before treating this cross-language output as merge-ready.']
  };
}

function nativeSourceCompileTargetLosses(input) {
  const { importResult, projection, targetCoverage, sourceLanguage, target, idPart } = input;
  if (!targetCoverage || targetCoverage.lossClass === 'exactSourceProjection') return [];
  if (targetCoverage.lossClass === 'missingAdapter') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_missing_projection_adapter`,
      severity: 'error',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  if (targetCoverage.lossClass === 'unsupportedTargetFeatures') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_unsupported_target_features`,
      severity: 'warning',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  if (targetCoverage.lossClass === 'nativeSourceStubs') {
    return [nativeSourceCompileTargetLoss({
      id: `loss_${idPart}_${idFragment(target)}_target_stubs`,
      severity: 'warning',
      message: targetCoverage.reason,
      importResult,
      projection,
      targetCoverage,
      sourceLanguage,
      target
    })];
  }
  return [];
}

function nativeSourceCompileTargetLoss(input) {
  const rootSpan = input.importResult.nativeAst?.nodes?.[input.importResult.nativeAst?.rootId]?.span
    ?? input.importResult.nativeSource?.ast?.nodes?.[input.importResult.nativeSource?.ast?.rootId]?.span;
  return {
    id: input.id,
    severity: input.severity,
    phase: 'emit',
    sourceFormat: input.sourceLanguage,
    kind: 'targetProjectionLoss',
    message: input.message,
    span: rootSpan ?? {
      sourceId: input.importResult.nativeSource?.sourceHash ?? input.importResult.sourceHash,
      path: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
      startLine: 1,
      startColumn: 1
    },
    metadata: {
      target: input.target,
      sourceLanguage: input.sourceLanguage,
      projectionId: input.projection.id,
      projectionMode: input.projection.mode,
      targetLossClass: input.targetCoverage.lossClass,
      targetReadiness: input.targetCoverage.readiness,
      targetSupported: input.targetCoverage.supported,
      targetAdapter: input.targetCoverage.adapter,
      targetLossKinds: input.targetCoverage.lossKinds,
      lossCategory: 'targetProjectionLoss',
      semanticMergeAdmission: semanticMergeAdmissionForSeverity(input.severity)
    }
  };
}

function nativeSourceCompileEvidence(input) {
  const failed = input.targetLosses.some((loss) => loss.severity === 'error')
    || input.projection.evidence?.some((record) => record.status === 'failed')
    || input.targetCoverage.readiness === 'blocked';
  return {
    id: input.id,
    kind: 'projection',
    status: failed ? 'failed' : 'passed',
    path: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
    summary: failed
      ? `Compiled ${input.sourceLanguage} native source to ${input.target} with blocked projection evidence.`
      : `Compiled ${input.sourceLanguage} native source to ${input.target} as ${input.outputMode}.`,
    metadata: {
      importId: input.importResult.id,
      projectionId: input.projection.id,
      targetProjectionId: input.targetProjection?.id,
      targetProjectionAdapterId: input.targetProjection?.adapter?.id,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      outputHash: input.outputHash ?? input.projection.outputHash,
      outputMode: input.outputMode,
      projectionMode: input.projection.mode,
      targetLossClass: input.targetCoverage.lossClass,
      targetReadiness: input.targetCoverage.readiness,
      targetSupported: input.targetCoverage.supported,
      targetReason: input.targetCoverage.reason,
      targetLossIds: input.targetLosses.map((loss) => loss.id)
    }
  };
}

function nativeSourceCompileSourceMaps(input) {
  const adapterSourceMaps = input.targetProjection?.sourceMaps ?? [];
  if (adapterSourceMaps.length) return adapterSourceMaps;
  const targetPath = nativeSourceCompileTargetPath(input);
  const targetHash = input.targetHash ?? input.outputHash;
  const target = nativeSourceCompileMapTarget(input, targetPath);
  const mappings = input.projection.mode === 'preserved-source'
    ? nativeSourceCompilePreservedMappings({ ...input, targetPath, targetHash, target })
    : nativeSourceCompileDeclarationMappings({ ...input, targetPath, targetHash, target });
  const resolvedMappings = mappings.length
    ? mappings
    : [nativeSourceCompileFileMapping({ ...input, targetPath, targetHash, target })];
  return [createSourceMapRecord({
    id: input.id,
    sourcePath: input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath,
    sourceHash: input.importResult.nativeSource?.sourceHash ?? input.importResult.nativeAst?.sourceHash ?? input.importResult.sourceHash,
    target,
    targetPath: targetPath ?? commonGeneratedTargetPath(resolvedMappings),
    targetHash,
    semanticIndexId: input.importResult.semanticIndex?.id ?? input.importResult.universalAst?.semanticIndex?.id,
    universalAstId: input.importResult.universalAst?.id,
    nativeAstId: input.importResult.nativeAst?.id ?? input.importResult.nativeSource?.ast?.id,
    nativeSourceId: input.importResult.nativeSource?.id,
    mappings: resolvedMappings,
    evidence: input.evidence ?? [],
    metadata: {
      compileResultId: input.compileResultId,
      importId: input.importResult.id,
      projectionId: input.projection.id,
      targetProjectionId: input.targetProjection?.id,
      targetProjectionAdapterId: input.targetProjection?.adapter?.id,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      outputMode: input.outputMode,
      outputHash: input.outputHash,
      generatedBy: 'compileNativeSource'
    }
  })];
}

function nativeSourceCompilePreservedMappings(input) {
  const sourceMaps = input.importResult.sourceMaps ?? input.importResult.universalAst?.sourceMaps ?? [];
  const sourceHash = input.importResult.nativeSource?.sourceHash ?? input.importResult.nativeAst?.sourceHash ?? input.importResult.sourceHash;
  const exact = input.projection.mode === 'preserved-source' && (!input.projection.sourceHash || input.outputHash === input.projection.sourceHash);
  const usedIds = new Set();
  return sourceMaps
    .flatMap((sourceMap) => sourceMap?.mappings ?? [])
    .filter((mapping) => mapping?.sourceSpan)
    .map((mapping, index) => ({
      id: reserveUniqueId(`compile_map_${idFragment(mapping.id ?? mapping.semanticSymbolId ?? mapping.nativeAstNodeId ?? index + 1)}`, usedIds),
      nativeSourceId: mapping.nativeSourceId ?? input.importResult.nativeSource?.id,
      nativeAstNodeId: mapping.nativeAstNodeId,
      semanticSymbolId: mapping.semanticSymbolId,
      semanticOccurrenceId: mapping.semanticOccurrenceId,
      semanticNodeId: mapping.semanticNodeId,
      mergeCandidateId: mapping.mergeCandidateId,
      sourceSpan: {
        ...mapping.sourceSpan,
        sourceId: mapping.sourceSpan.sourceId ?? sourceHash,
        path: mapping.sourceSpan.path ?? input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath
      },
      generatedSpan: nativeSourceCompileGeneratedSpanFromSource(mapping.sourceSpan, input, mapping.generatedName),
      target: input.target,
      generatedName: mapping.generatedName,
      evidenceIds: uniqueStrings([
        ...(mapping.evidenceIds ?? []),
        ...(input.evidence ?? []).map((record) => record.id).filter(Boolean)
      ]),
      lossIds: uniqueStrings([
        ...(mapping.lossIds ?? []),
        ...lossIdsForNativeNode(input.losses ?? [], mapping.nativeAstNodeId)
      ]),
      ownershipRegionId: mapping.ownershipRegionId,
      ownershipRegionKey: mapping.ownershipRegionKey,
      ownershipRegionKind: mapping.ownershipRegionKind,
      precision: exact ? 'exact' : mapping.precision === 'exact' ? 'line' : mapping.precision ?? 'line',
      preservation: exact ? 'exact' : normalizeSourcePreservationLevel(mapping.preservation, {
        precision: mapping.precision === 'exact' ? 'line' : mapping.precision ?? 'line',
        lossIds: mapping.lossIds,
        losses: input.losses ?? [],
        sourcePreservation: input.importResult.metadata?.sourcePreservation
      }),
      metadata: {
        ...mapping.metadata,
        compileResultId: input.compileResultId,
        sourceMapOrigin: 'preserved-source'
      }
    }));
}

function nativeSourceCompileDeclarationMappings(input) {
  const usedIds = new Set();
  return (input.projection.declarations ?? []).map((declaration, index) => {
    const generated = nativeSourceCompileDeclarationGeneratedSpan(input, declaration);
    return {
      id: reserveUniqueId(`compile_map_${idFragment(declaration.symbolId ?? declaration.nativeAstNodeId ?? declaration.name ?? index + 1)}`, usedIds),
      nativeSourceId: input.importResult.nativeSource?.id,
      nativeAstNodeId: declaration.nativeAstNodeId,
      semanticSymbolId: declaration.symbolId,
      sourceSpan: declaration.sourceSpan,
      generatedSpan: generated.span,
      target: input.target,
      generatedName: generated.name,
      evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
      lossIds: lossIdsForNativeNode(input.losses ?? [], declaration.nativeAstNodeId),
      ownershipRegionId: declaration.ownershipRegionId,
      ownershipRegionKey: declaration.metadata?.ownershipRegionKey,
      ownershipRegionKind: declaration.metadata?.ownershipRegionKind,
      precision: generated.exactName ? 'declaration' : 'estimated',
      preservation: generated.exactName ? 'declaration' : 'estimated',
      metadata: {
        ...declaration.metadata,
        compileResultId: input.compileResultId,
        declarationKind: declaration.kind,
        sourceMapOrigin: input.outputMode === 'target-adapter' ? 'target-adapter-fallback' : 'declaration-stub'
      }
    };
  });
}

function nativeSourceCompileFileMapping(input) {
  const rootSpan = input.importResult.nativeAst?.nodes?.[input.importResult.nativeAst?.rootId]?.span
    ?? input.importResult.nativeSource?.ast?.nodes?.[input.importResult.nativeSource?.ast?.rootId]?.span
    ?? input.projection.declarations?.find((declaration) => declaration.sourceSpan)?.sourceSpan;
  return {
    id: `compile_map_${idFragment(input.compileResultId ?? input.id)}_file`,
    nativeSourceId: input.importResult.nativeSource?.id,
    sourceSpan: rootSpan,
    generatedSpan: nativeSourceCompileFullGeneratedSpan(input),
    target: input.target,
    evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
    precision: input.projection.mode === 'preserved-source' && input.outputHash === input.projection.sourceHash ? 'line' : 'estimated',
    preservation: input.losses?.some((loss) => loss.severity === 'error') ? 'blocked' : 'estimated',
    metadata: {
      compileResultId: input.compileResultId,
      sourceMapOrigin: 'file-fallback'
    }
  };
}

function nativeSourceCompileGeneratedSpanFromSource(sourceSpan, input, generatedName) {
  if (!sourceSpan) return nativeSourceCompileFullGeneratedSpan(input, generatedName);
  return {
    ...sourceSpan,
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}

function nativeSourceCompileDeclarationGeneratedSpan(input, declaration) {
  const identifiers = uniqueStrings([
    declaration.name,
    safeProjectionIdentifier(declaration.name),
    upperFirst(safeProjectionIdentifier(declaration.name)),
    safeProjectionIdentifier(declaration.name).toUpperCase()
  ]).filter(Boolean);
  for (const identifier of identifiers) {
    const offset = input.output.indexOf(identifier);
    if (offset >= 0) {
      return {
        name: identifier,
        exactName: true,
        span: nativeSourceCompileGeneratedSpanForOffset(input, offset, identifier.length, identifier)
      };
    }
  }
  return {
    name: safeProjectionIdentifier(declaration.name),
    exactName: false,
    span: nativeSourceCompileFullGeneratedSpan(input, safeProjectionIdentifier(declaration.name))
  };
}

function nativeSourceCompileGeneratedSpanForOffset(input, offset, length, generatedName) {
  const start = lineColumnForOffset(input.output, offset);
  const end = lineColumnForOffset(input.output, offset + Math.max(1, length));
  return {
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end.line,
    endColumn: end.column,
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}

function nativeSourceCompileFullGeneratedSpan(input, generatedName) {
  const lines = String(input.output ?? '').split(/\r?\n/);
  const lastLine = lines.at(-1) ?? '';
  return {
    sourceId: input.targetHash ?? input.outputHash,
    path: input.targetPath,
    startLine: 1,
    startColumn: 1,
    endLine: Math.max(1, lines.length),
    endColumn: Math.max(1, lastLine.length + 1),
    target: input.target,
    targetPath: input.targetPath,
    targetHash: input.targetHash ?? input.outputHash,
    generatedName
  };
}

function nativeSourceCompileTargetPath(input) {
  if (input.targetPath) return input.targetPath;
  const sourcePath = input.importResult.sourcePath ?? input.importResult.nativeSource?.sourcePath;
  if (!sourcePath) return undefined;
  const targetExt = nativeSourceCompileTargetExtension(input.target);
  if (!targetExt) return sourcePath;
  return sourcePath.replace(/(\.[^./\\]+)?$/, targetExt);
}

function nativeSourceCompileTargetExtension(target) {
  const normalized = normalizeNativeLanguageId(target);
  if (normalized === 'typescript') return '.ts';
  if (normalized === 'javascript') return '.js';
  if (normalized === 'rust') return '.rs';
  if (normalized === 'python') return '.py';
  if (normalized === 'c') return '.h';
  return undefined;
}

function nativeSourceCompileMapTarget(input, targetPath) {
  return {
    language: input.target,
    emitPath: targetPath
  };
}

function lineColumnForOffset(source, offset) {
  const text = String(source ?? '');
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < safeOffset; index += 1) {
    if (text[index] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function nativeProjectionTargetsForLanguage(language, aliases = []) {
  const target = nativeLanguageCompileTarget(language, aliases);
  return target ? [target] : [];
}

function nativeImportLanguageProfile(language, input = {}) {
  const lossKinds = input.lossKinds ?? ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation'];
  const aliases = uniqueStrings(input.aliases ?? []);
  return Object.freeze({
    language,
    aliases: Object.freeze(aliases),
    extensions: Object.freeze(uniqueStrings(input.extensions ?? [])),
    supportsLightweightScan: input.supportsLightweightScan !== false,
    parserAdapters: Object.freeze(uniqueStrings(input.parserAdapters ?? ['tree-sitter'])),
    projectionTargets: Object.freeze(uniqueStrings(input.projectionTargets ?? nativeProjectionTargetsForLanguage(language, aliases))),
    knownLossKinds: Object.freeze(uniqueStrings(lossKinds)),
    defaultReadiness: input.defaultReadiness ?? 'needs-review',
    notes: Object.freeze(uniqueStrings(input.notes ?? ['lightweight scanner records declarations only; exact parser adapters must be injected by the host']))
  });
}

function nativeParserAstFormatProfile(id, input = {}) {
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

function normalizeParserAstFormatId(format) {
  return String(format ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

const nativeParserMacroMetaprogrammingLossKinds = new Set([
  'macroExpansion',
  'macroHygiene',
  'preprocessor',
  'conditionalCompilation',
  'metaprogramming',
  'reflection',
  'generatedCode'
]);

const nativeParserTypeCoverageLossKinds = new Set([
  'typeInference',
  'overloadResolution',
  'overloadTypeInference',
  'unsupportedSemantic'
]);

function nativeParserFeatureRowsForProfiles(profiles, context) {
  const rows = [];
  for (const profile of profiles) {
    const matchingImports = nativeParserFeatureImportsForProfile(profile, context.imports);
    const matchingAdapters = nativeParserFeatureAdapterSummariesForProfile(profile, context.adapters);
    for (const parser of nativeParserFeatureParserSlots(profile, matchingImports, matchingAdapters)) {
      const row = nativeParserFeatureRowForParser(profile, parser, {
        ...context,
        imports: matchingImports.filter((imported) => nativeParserFeatureParserMatches(nativeParserParserForImport(imported), parser)),
        adapters: matchingAdapters.filter((adapter) => nativeParserFeatureParserMatches(adapter.parser, parser))
      });
      if (context.includeEmptyParsers === false && row.imports.total === 0 && row.adapters.total === 0) continue;
      rows.push(row);
    }
  }
  return rows.sort((left, right) => {
    const languageOrder = left.language.localeCompare(right.language);
    return languageOrder || left.parser.localeCompare(right.parser);
  });
}

function nativeParserFeatureRowForParser(profile, parser, context) {
  const imports = context.imports ?? [];
  const adapters = context.adapters ?? [];
  const parserFormat = parserAstFormatIdForParser(parser);
  const parserProfile = getNativeParserAstFormatProfile(parserFormat);
  const adapterCoverage = summarizeNativeImporterAdapterCoverageEntries([
    ...imports.map((imported) => nativeImporterAdapterCoverageEntryFromImport(imported)).filter(Boolean),
    ...adapters.map((adapter) => ({
      adapterId: adapter.id,
      language: adapter.language,
      parser: adapter.parser,
      coverage: adapter.coverage
    }))
  ]);
  const losses = imports.flatMap((imported) => imported?.losses ?? imported?.nativeAst?.losses ?? []);
  const evidence = imports.flatMap((imported) => imported?.evidence ?? []);
  const lossSummary = summarizeNativeImportLosses(losses, { evidence, parser });
  const semanticEvidence = nativeParserFeatureSemanticEvidence(imports);
  const sourceMaps = imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const sourceMapMappings = sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0);
  const sourcePreservation = summarizeImportSourcePreservation(undefined, imports);
  const nativeAstNodes = imports.reduce((sum, imported) => sum + Object.keys(imported?.nativeAst?.nodes ?? imported?.nativeSource?.ast?.nodes ?? {}).length, 0);
  const featureContext = {
    profile,
    parser,
    parserFormat,
    parserProfile,
    imports,
    adapters,
    adapterCoverage,
    losses,
    evidence,
    lossSummary,
    semanticEvidence,
    sourceMaps,
    sourceMapMappings,
    sourcePreservation,
    nativeAstNodes
  };
  const features = {
    syntax: nativeParserSyntaxFeature(featureContext),
    semantic: nativeParserSemanticFeature(featureContext),
    type: nativeParserTypeFeature(featureContext),
    controlFlow: nativeParserControlFlowFeature(featureContext),
    macroMetaprogramming: nativeParserMacroMetaprogrammingFeature(featureContext),
    sourcePreservation: nativeParserSourcePreservationFeature(featureContext)
  };
  const importReadiness = imports.length
    ? lossSummary.semanticMergeReadiness
    : adapters.length ? 'needs-review' : normalizeSemanticMergeReadiness(profile.defaultReadiness) ?? 'needs-review';
  const row = {
    language: profile.language,
    aliases: profile.aliases,
    parser,
    parserFormat,
    parserAliases: uniqueStrings([...(parserProfile?.aliases ?? []), ...(parserProfile?.parserAdapters ?? [])]),
    parserAdapters: uniqueStrings([parser, ...(parserProfile?.parserAdapters ?? [])]),
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    projectionTargets: profile.projectionTargets,
    knownLossKinds: uniqueStrings([...(profile.knownLossKinds ?? []), ...Object.keys(lossSummary.byKind)]),
    defaultReadiness: profile.defaultReadiness,
    notes: uniqueStrings([...(profile.notes ?? []), ...(parserProfile?.notes ?? [])]),
    adapters: {
      total: adapters.length,
      ids: adapters.map((adapter) => adapter.id),
      versions: uniqueStrings(adapters.map((adapter) => adapter.version).filter(Boolean)),
      exactness: uniqueStrings(adapters.map((adapter) => adapter.coverage?.exactness).filter(Boolean)),
      coverage: adapterCoverage
    },
    imports: {
      total: imports.length,
      sourcePaths: uniqueStrings(imports.map((imported) => imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath).filter(Boolean)),
      readiness: importReadiness,
      readinessReasons: imports.length ? lossSummary.readinessReasons : nativeImportCoverageReasons(profile),
      nativeAstNodes,
      symbols: semanticEvidence.symbols,
      references: semanticEvidence.references,
      types: semanticEvidence.types,
      controlFlow: semanticEvidence.controlFlow,
      sourceMaps: sourceMaps.length,
      sourceMapMappings,
      losses: lossSummary.total,
      lossKinds: lossSummary.byKind,
      lossCategories: lossSummary.categories,
      sourcePreservation
    },
    features
  };
  return {
    ...row,
    merge: nativeParserFeatureMergeAssessment(row, {
      requiredFeatures: context.requiredFeatures,
      minimumReadiness: context.minimumReadiness
    })
  };
}

function nativeParserSyntaxFeature(context) {
  const blockingSyntaxLosses = context.losses.filter((loss) => loss.severity === 'error' && (loss.kind === 'unsupportedSyntax' || loss.kind === 'parserDiagnostic'));
  const exactAst = context.adapterCoverage.effective.exactAst ?? 0;
  const sourceRanges = context.adapterCoverage.effective.sourceRanges ?? 0;
  const parserDiagnostics = context.adapterCoverage.effective.parserDiagnostics ?? 0;
  let status = 'missing';
  const reasons = [];
  if (blockingSyntaxLosses.length) {
    status = 'blocked';
    reasons.push('Parser diagnostics or unsupported syntax errors block syntax coverage.');
  } else if (exactAst > 0 && (sourceRanges > 0 || context.sourceMapMappings > 0)) {
    status = 'full';
    reasons.push('Exact parser AST and source-range evidence are available.');
  } else if (exactAst > 0 || sourceRanges > 0 || context.nativeAstNodes > 1 || context.sourceMapMappings > 0) {
    status = 'partial';
    reasons.push('Syntax evidence exists, but exact AST/source-range coverage is incomplete.');
  } else if (context.adapters.length || context.parserProfile) {
    status = 'evidence-required';
    reasons.push('Parser slot is declared, but no observed syntax import evidence is attached.');
  } else {
    reasons.push('No syntax parser coverage is declared or observed.');
  }
  return nativeParserFeatureCoverage('syntax', status, {
    capabilities: {
      exactAst,
      sourceRanges,
      parserDiagnostics,
      nativeAstNodes: context.nativeAstNodes,
      sourceMapMappings: context.sourceMapMappings
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['exactAst', 'sourceRanges', 'parserDiagnostics']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['unsupportedSyntax', 'parserDiagnostic']),
    reasons,
    notes: ['Syntax coverage covers parser AST/CST structure, diagnostics, source ranges, and source-map anchors.']
  });
}

function nativeParserSemanticFeature(context) {
  const declarations = (context.adapterCoverage.effective.semanticDeclarations ?? 0) + context.semanticEvidence.declarations;
  const symbols = (context.adapterCoverage.effective.semanticSymbols ?? 0) + context.semanticEvidence.symbols;
  let status = 'missing';
  const reasons = [];
  if (symbols > 0 && declarations > 0) {
    status = 'full';
    reasons.push('Declaration and symbol evidence are available.');
  } else if (symbols > 0 || declarations > 0 || context.nativeAstNodes > 1) {
    status = 'partial';
    reasons.push('Semantic evidence is present, but declaration/symbol coverage is incomplete.');
  } else if (context.adapters.length || context.imports.length) {
    status = 'evidence-required';
    reasons.push('Import evidence exists, but no semantic declarations or symbols were observed.');
  } else {
    reasons.push('No semantic index evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('semantic', status, {
    capabilities: {
      declarations,
      symbols,
      semanticIndexLevel: nativeParserFeatureSemanticLevel(context.adapterCoverage, context.semanticEvidence)
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['semanticDeclarations', 'semanticSymbols']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['partialSemanticIndex', 'unsupportedSemantic']),
    reasons,
    notes: ['Semantic coverage covers declaration and symbol evidence. References, types, and control flow are reported separately.']
  });
}

function nativeParserTypeFeature(context) {
  const types = (context.adapterCoverage.effective.types ?? 0) + context.semanticEvidence.types;
  const typeLossKinds = nativeParserFeaturePresentLossKinds(context, nativeParserTypeCoverageLossKinds);
  let status = 'missing';
  const reasons = [];
  if (types > 0) {
    status = 'full';
    reasons.push('Resolved or declared type evidence is available.');
  } else if (typeLossKinds.length > 0 || context.semanticEvidence.symbols > 0) {
    status = 'evidence-required';
    reasons.push('Type-sensitive coverage needs compiler or language-server evidence.');
  } else {
    reasons.push('No type evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('type', status, {
    capabilities: { types },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['types']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, [...nativeParserTypeCoverageLossKinds]),
    reasons,
    notes: ['Type coverage covers declared/inferred type facts and overload or inference evidence.']
  });
}

function nativeParserControlFlowFeature(context) {
  const controlFlow = (context.adapterCoverage.effective.controlFlow ?? 0) + context.semanticEvidence.controlFlow;
  let status = 'missing';
  const reasons = [];
  if (controlFlow > 0) {
    status = 'full';
    reasons.push('Control-flow or CFG evidence is available.');
  } else if (context.imports.length || context.adapters.length) {
    status = 'evidence-required';
    reasons.push('Control-flow evidence was not observed for this parser row.');
  } else {
    reasons.push('No control-flow evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('controlFlow', status, {
    capabilities: { controlFlow },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['controlFlow']),
    lossKinds: {},
    reasons,
    notes: ['Control-flow coverage covers call/branch/CFG facts supplied by host parsers or semantic indexers.']
  });
}

function nativeParserMacroMetaprogrammingFeature(context) {
  const macroLossKinds = nativeParserFeaturePresentLossKinds(context, nativeParserMacroMetaprogrammingLossKinds);
  const macroLosses = context.losses.filter((loss) => nativeParserMacroMetaprogrammingLossKinds.has(loss.kind));
  const featureEvidence = summarizeNativeImportFeatureEvidence(macroLosses, { evidence: context.evidence });
  const generatedRanges = context.adapterCoverage.effective.generatedRanges ?? 0;
  let status = 'not-applicable';
  const reasons = [];
  if (!macroLossKinds.length) {
    reasons.push('No macro, preprocessor, generator, or metaprogramming coverage risk is declared for this parser row.');
  } else if (macroLosses.some((loss) => loss.severity === 'error')) {
    status = 'blocked';
    reasons.push('Macro or metaprogramming evidence includes blocking loss records.');
  } else if (featureEvidence.missingRequiredEvidence.length > 0 || generatedRanges === 0) {
    status = 'evidence-required';
    reasons.push('Macro/metaprogramming coverage requires generated-range and policy evidence before merge admission.');
  } else {
    status = 'partial';
    reasons.push('Macro/metaprogramming risk has attached evidence, but this facade still treats generated behavior as review-required.');
  }
  return nativeParserFeatureCoverage('macroMetaprogramming', status, {
    capabilities: {
      generatedRanges,
      policyKinds: featureEvidence.policyKinds,
      highestRisk: featureEvidence.highestRisk
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['generatedRanges']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, [...nativeParserMacroMetaprogrammingLossKinds]),
    reasons: uniqueStrings([...reasons, ...featureEvidence.reasons]),
    notes: ['Macro/metaprogramming coverage covers macros, preprocessors, generated code, reflection, and conditional compilation evidence.']
  });
}

function nativeParserSourcePreservationFeature(context) {
  const exactSource = context.sourcePreservation.exactSourceAvailable;
  const tokens = context.sourcePreservation.tokens + (context.adapterCoverage.effective.tokens ?? 0);
  const trivia = context.sourcePreservation.trivia + (context.adapterCoverage.effective.trivia ?? 0);
  const sourceRanges = context.adapterCoverage.effective.sourceRanges ?? 0;
  let status = 'missing';
  const reasons = [];
  if (exactSource > 0 && (tokens > 0 || trivia > 0 || sourceRanges > 0)) {
    status = 'full';
    reasons.push('Exact source text and token/trivia or source-range evidence are available.');
  } else if (exactSource > 0 || tokens > 0 || trivia > 0 || sourceRanges > 0) {
    status = 'partial';
    reasons.push('Source-preservation evidence exists, but exact source, tokens, trivia, or ranges are incomplete.');
  } else if (context.imports.length || context.adapters.length) {
    status = 'evidence-required';
    reasons.push('Import or adapter evidence exists, but no exact source-preservation record was observed.');
  } else {
    reasons.push('No source-preservation evidence is declared or observed.');
  }
  return nativeParserFeatureCoverage('sourcePreservation', status, {
    capabilities: {
      exactSourceAvailable: exactSource,
      tokens,
      trivia,
      comments: context.sourcePreservation.comments,
      whitespace: context.sourcePreservation.whitespace,
      directives: context.sourcePreservation.directives,
      sourceRanges
    },
    gaps: nativeParserFeatureCapabilityGaps(context.adapterCoverage, ['tokens', 'trivia', 'sourceRanges']),
    lossKinds: nativeParserFeatureLossKindCounts(context.losses, ['sourcePreservation', 'commentsTrivia', 'sourceMapApproximation']),
    reasons,
    notes: ['Source-preservation coverage covers exact source text, token/trivia retention, comments, whitespace, directives, and source ranges.']
  });
}

function nativeParserFeatureCoverage(category, status, input = {}) {
  const normalizedStatus = NativeParserFeatureCoverageStatuses.includes(status) ? status : 'missing';
  return Object.freeze({
    category,
    status: normalizedStatus,
    readiness: nativeParserFeatureReadinessForStatus(normalizedStatus),
    mergeReady: nativeParserFeatureStatusMergeReady(normalizedStatus),
    supported: normalizedStatus === 'full' || normalizedStatus === 'partial' || normalizedStatus === 'not-applicable',
    capabilities: Object.freeze(input.capabilities ?? {}),
    gaps: Object.freeze(uniqueStrings(input.gaps ?? [])),
    lossKinds: Object.freeze(input.lossKinds ?? {}),
    reasons: Object.freeze(uniqueStrings(input.reasons ?? [])),
    notes: Object.freeze(uniqueStrings(input.notes ?? []))
  });
}

function nativeParserFeatureReadinessForStatus(status) {
  if (status === 'full' || status === 'not-applicable') return 'ready';
  if (status === 'partial') return 'ready-with-losses';
  if (status === 'blocked') return 'blocked';
  return 'needs-review';
}

function nativeParserFeatureStatusMergeReady(status) {
  return status === 'full' || status === 'not-applicable';
}

function nativeParserFeatureMergeAssessment(row, input = {}) {
  const requiredFeatures = normalizeNativeParserRequiredFeatures(input.requiredFeatures);
  const minimumReadiness = normalizeSemanticMergeReadiness(input.minimumReadiness ?? 'ready') ?? 'ready';
  const featureReadiness = requiredFeatures.reduce(
    (current, category) => maxSemanticMergeReadiness(current, row.features?.[category]?.readiness ?? 'blocked'),
    'ready'
  );
  const readiness = maxSemanticMergeReadiness(row.imports?.readiness ?? 'needs-review', featureReadiness);
  const blockingFeatures = requiredFeatures.filter((category) => !nativeParserFeatureStatusMergeReady(row.features?.[category]?.status));
  const reviewFeatures = requiredFeatures.filter((category) => {
    const featureReadiness = row.features?.[category]?.readiness ?? 'blocked';
    return semanticMergeReadinessRank[featureReadiness] > semanticMergeReadinessRank.ready
      && semanticMergeReadinessRank[featureReadiness] <= semanticMergeReadinessRank['needs-review'];
  });
  const reasons = [];
  if ((row.imports?.total ?? 0) === 0) reasons.push('No native import evidence matched this language/parser row.');
  for (const category of blockingFeatures) {
    const feature = row.features?.[category];
    reasons.push(`${category} coverage is ${feature?.status ?? 'missing'}: ${(feature?.reasons ?? []).join(' ')}`);
  }
  if (semanticMergeReadinessRank[readiness] > semanticMergeReadinessRank[minimumReadiness]) {
    reasons.push(`Readiness ${readiness} is weaker than required threshold ${minimumReadiness}.`);
  }
  const mergeReady = (row.imports?.total ?? 0) > 0
    && blockingFeatures.length === 0
    && semanticMergeReadinessRank[readiness] <= semanticMergeReadinessRank[minimumReadiness];
  if (mergeReady) reasons.push(`Native import is merge-ready for required features: ${requiredFeatures.join(', ')}.`);
  return Object.freeze({
    mergeReady,
    readiness,
    requiredFeatures,
    minimumReadiness,
    blockingFeatures,
    reviewFeatures,
    reasons: uniqueStrings(reasons)
  });
}

function normalizeNativeParserRequiredFeatures(value) {
  const requested = normalizeStringList(value);
  const features = requested.length ? requested : ['syntax', 'semantic', 'sourcePreservation'];
  return uniqueStrings(features.map(normalizeNativeParserFeatureCategory).filter((feature) => NativeParserFeatureCategories.includes(feature)));
}

function normalizeNativeParserFeatureCategory(value) {
  const normalized = String(value ?? '').trim().replace(/[-_\s]+([a-zA-Z])/g, (_, letter) => letter.toUpperCase());
  if (normalized.toLowerCase() === 'macrometaprogramming' || normalized.toLowerCase() === 'macro') return 'macroMetaprogramming';
  if (normalized.toLowerCase() === 'controlflow' || normalized.toLowerCase() === 'cfg') return 'controlFlow';
  if (normalized.toLowerCase() === 'sourcepreservation' || normalized.toLowerCase() === 'source') return 'sourcePreservation';
  if (normalized.toLowerCase() === 'types') return 'type';
  return normalized;
}

function nativeParserFeatureMatrixSummary(rows) {
  const summary = {
    languages: new Set(),
    parsers: rows.length,
    imports: 0,
    adapters: 0,
    mergeReady: 0,
    byReadiness: {},
    byFeatureStatus: {},
    byFeatureReadiness: {}
  };
  for (const row of rows) {
    summary.languages.add(row.language);
    summary.imports += row.imports.total;
    summary.adapters += row.adapters.total;
    if (row.merge.mergeReady) summary.mergeReady += 1;
    summary.byReadiness[row.merge.readiness] = (summary.byReadiness[row.merge.readiness] ?? 0) + 1;
    for (const [category, feature] of Object.entries(row.features)) {
      summary.byFeatureStatus[category] ??= {};
      summary.byFeatureReadiness[category] ??= {};
      summary.byFeatureStatus[category][feature.status] = (summary.byFeatureStatus[category][feature.status] ?? 0) + 1;
      summary.byFeatureReadiness[category][feature.readiness] = (summary.byFeatureReadiness[category][feature.readiness] ?? 0) + 1;
    }
  }
  return {
    ...summary,
    languages: summary.languages.size
  };
}

function summarizeNativeParserFeatureLanguages(profiles, rows) {
  return profiles.map((profile) => {
    const languageRows = rows.filter((row) => row.language === profile.language);
    return {
      language: profile.language,
      aliases: profile.aliases,
      parserRows: languageRows.length,
      parsers: languageRows.map((row) => row.parser),
      imports: languageRows.reduce((sum, row) => sum + row.imports.total, 0),
      adapters: languageRows.reduce((sum, row) => sum + row.adapters.total, 0),
      mergeReadyParsers: languageRows.filter((row) => row.merge.mergeReady).map((row) => row.parser),
      readiness: languageRows.reduce((current, row) => maxSemanticMergeReadiness(current, row.merge.readiness), 'ready')
    };
  });
}

function nativeParserFeatureParserSlots(profile, imports, adapters) {
  const slots = [
    ...(profile.parserAdapters ?? []),
    ...adapters.map((adapter) => adapter.parser),
    ...imports.map(nativeParserParserForImport)
  ].filter(Boolean);
  if (!slots.length && profile.supportsLightweightScan) slots.push(`${profile.language}.lightweight-declaration-scan`);
  const seen = new Set();
  const result = [];
  for (const slot of slots) {
    const key = `${normalizeParserAstFormatId(slot)}#${parserAstFormatIdForParser(slot)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(String(slot));
  }
  return result;
}

function nativeParserFeatureImportsForProfile(profile, imports = []) {
  const languages = nativeParserFeatureLanguageSet(profile);
  return imports.filter((imported) => languages.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language ?? imported?.nativeSource?.language)));
}

function nativeParserFeatureAdapterSummariesForProfile(profile, adapters = []) {
  const languages = nativeParserFeatureLanguageSet(profile);
  return adapters
    .map((adapter) => safeNativeImporterAdapterSummary(adapter))
    .filter(Boolean)
    .filter((adapter) => languages.has(normalizeNativeLanguageId(adapter.language)));
}

function nativeParserFeatureLanguageSet(profile) {
  return new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
}

function nativeParserParserForImport(imported) {
  return imported?.adapter?.parser
    ?? imported?.metadata?.adapterCoverage?.parser
    ?? imported?.nativeAst?.parser
    ?? imported?.nativeSource?.parser
    ?? imported?.parser
    ?? imported?.metadata?.parser;
}

function nativeParserFeatureParserMatches(candidateParser, rowParser) {
  if (!candidateParser || !rowParser) return false;
  const candidate = normalizeParserAstFormatId(candidateParser);
  const row = normalizeParserAstFormatId(rowParser);
  return candidate === row || parserAstFormatIdForParser(candidateParser) === parserAstFormatIdForParser(rowParser);
}

function nativeParserFeatureSemanticEvidence(imports) {
  const totals = {
    declarations: 0,
    symbols: 0,
    references: 0,
    types: 0,
    controlFlow: 0
  };
  for (const imported of imports) {
    const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
    const evidence = observeNativeImporterSemanticEvidence(semanticIndex);
    totals.declarations += evidence.declarations;
    totals.symbols += semanticIndex?.symbols?.length ?? 0;
    totals.references += evidence.references;
    totals.types += evidence.types;
    totals.controlFlow += evidence.controlFlow;
  }
  return totals;
}

function nativeParserFeatureSemanticLevel(adapterCoverage, semanticEvidence) {
  if ((adapterCoverage.effective.types ?? 0) > 0 || (adapterCoverage.effective.controlFlow ?? 0) > 0 || semanticEvidence.types > 0 || semanticEvidence.controlFlow > 0 || semanticEvidence.references > 0) {
    return 'semantic-index';
  }
  if ((adapterCoverage.effective.semanticDeclarations ?? 0) > 0 || (adapterCoverage.effective.semanticSymbols ?? 0) > 0 || semanticEvidence.declarations > 0 || semanticEvidence.symbols > 0) {
    return 'declaration-index';
  }
  return 'native-ast';
}

function nativeParserFeatureCapabilityGaps(adapterCoverage, capabilities) {
  const gaps = new Set();
  for (const capability of capabilities) {
    if ((adapterCoverage.effective?.[capability] ?? 0) === 0) gaps.add(capability);
  }
  for (const capability of Object.keys(adapterCoverage.gaps ?? {})) {
    if (capabilities.includes(capability)) gaps.add(capability);
  }
  return [...gaps];
}

function nativeParserFeatureLossKindCounts(losses, kinds) {
  const wanted = new Set(kinds);
  const counts = {};
  for (const loss of losses) {
    if (!wanted.has(loss?.kind)) continue;
    counts[loss.kind] = (counts[loss.kind] ?? 0) + 1;
  }
  return counts;
}

function nativeParserFeaturePresentLossKinds(context, kindSet) {
  return uniqueStrings([
    ...(context.profile.knownLossKinds ?? []),
    ...Object.keys(context.lossSummary.byKind ?? {})
  ].filter((kind) => kindSet.has(kind)));
}

function mergeNativeParserAstFormatProfiles(profiles, imports, adapters) {
  const byId = new Map((profiles ?? []).map((profile) => [normalizeParserAstFormatId(profile.id ?? profile), nativeParserAstFormatProfile(normalizeParserAstFormatId(profile.id ?? profile), profile)]));
  for (const adapter of adapters ?? []) {
    const summary = safeNativeImporterAdapterSummary(adapter);
    if (!summary) continue;
    const formatId = parserAstFormatIdForParser(summary.parser);
    if (!byId.has(formatId)) {
      byId.set(formatId, nativeParserAstFormatProfile(formatId, {
        languages: [summary.language],
        parserAdapters: [summary.parser],
        exactness: summary.coverage.exactness,
        sourceRangeModel: summary.coverage.sourceRanges ? 'adapter-reported' : 'unknown'
      }));
    }
  }
  for (const imported of imports ?? []) {
    const formatId = parserAstFormatIdForImport(imported);
    if (formatId && !byId.has(formatId)) {
      byId.set(formatId, nativeParserAstFormatProfile(formatId, {
        languages: [imported.language].filter(Boolean),
        parserAdapters: [imported.parser ?? imported.nativeAst?.parser ?? formatId],
        exactness: 'unknown',
        sourceRangeModel: (imported.sourceMaps ?? []).some((sourceMap) => sourceMap.mappings?.some((mapping) => mapping.sourceSpan)) ? 'adapter-reported' : 'unknown'
      }));
    }
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function nativeParserAstFormatCoverageForProfile(profile, imports, adapters) {
  const formatIds = new Set([profile.id, ...profile.aliases].map(normalizeParserAstFormatId));
  const adapterParsers = new Set(profile.parserAdapters.map(parserAstFormatIdForParser));
  const matchingAdapters = (adapters ?? [])
    .map((adapter) => safeNativeImporterAdapterSummary(adapter))
    .filter(Boolean)
    .filter((adapter) => formatIds.has(parserAstFormatIdForParser(adapter.parser)) || adapterParsers.has(parserAstFormatIdForParser(adapter.parser)));
  const matchingImports = (imports ?? [])
    .filter((imported) => {
      const formatId = parserAstFormatIdForImport(imported);
      return formatId && (formatIds.has(formatId) || adapterParsers.has(formatId));
    });
  const effectiveCapabilities = {};
  for (const adapter of matchingAdapters) {
    for (const row of adapter.coverage.capabilityEvidence?.capabilities ?? []) {
      if (row.effective) effectiveCapabilities[row.capability] = (effectiveCapabilities[row.capability] ?? 0) + 1;
    }
  }
  const readiness = matchingImports.reduce(
    (current, imported) => maxSemanticMergeReadiness(current, nativeImportReadiness(imported)),
    matchingImports.length ? 'ready' : 'needs-review'
  );
  return {
    id: profile.id,
    kind: profile.kind,
    languages: profile.languages,
    parserAdapters: profile.parserAdapters,
    exactness: profile.exactness,
    sourceRangeModel: profile.sourceRangeModel,
    preservesTokens: profile.preservesTokens,
    preservesTrivia: profile.preservesTrivia,
    supportsIncremental: profile.supportsIncremental,
    supportsErrorRecovery: profile.supportsErrorRecovery,
    notes: profile.notes,
    adapters: {
      total: matchingAdapters.length,
      ids: matchingAdapters.map((adapter) => adapter.id),
      parsers: uniqueStrings(matchingAdapters.map((adapter) => adapter.parser)),
      effectiveCapabilities
    },
    imports: {
      total: matchingImports.length,
      sourcePaths: matchingImports.map((imported) => imported.sourcePath).filter(Boolean),
      readiness,
      nativeAstNodes: matchingImports.reduce((sum, imported) => sum + Object.keys(imported.nativeAst?.nodes ?? {}).length, 0),
      symbols: matchingImports.reduce((sum, imported) => sum + (imported.semanticIndex?.symbols?.length ?? 0), 0),
      sourceMapMappings: matchingImports.reduce((sum, imported) => sum + (imported.sourceMaps ?? []).reduce((mapSum, sourceMap) => mapSum + (sourceMap.mappings?.length ?? 0), 0), 0),
      losses: matchingImports.reduce((sum, imported) => sum + (imported.losses?.length ?? 0), 0)
    }
  };
}

function parserAstFormatIdForParser(parser) {
  const text = normalizeParserAstFormatId(parser);
  if (text.includes('typescript')) return 'typescript-compiler-api';
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

function parserAstFormatIdForImport(imported) {
  return parserAstFormatIdForParser(
    imported?.metadata?.adapter?.parser
      ?? imported?.metadata?.astFormat
      ?? imported?.nativeAst?.metadata?.astFormat
      ?? imported?.nativeAst?.parser
      ?? imported?.parser
      ?? imported?.metadata?.parser
  );
}

function mergeNativeImportProfiles(languages, imports, adapters, targetAdapters = []) {
  const profilesByLanguage = new Map();
  for (const profile of languages) {
    const normalized = normalizeNativeLanguageId(profile.language ?? profile);
    profilesByLanguage.set(normalized, normalizeNativeImportLanguageProfile(profile, normalized));
  }
  for (const imported of imports) {
    const normalized = normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language);
    if (!normalized || profilesByLanguage.has(normalized)) continue;
    profilesByLanguage.set(normalized, nativeImportLanguageProfile(normalized, {
      supportsLightweightScan: false,
      parserAdapters: [],
      defaultReadiness: 'blocked',
      lossKinds: ['unsupportedSyntax'],
      notes: ['language appeared in import evidence but has no declared Frontier coverage profile']
    }));
  }
  for (const adapter of adapters) {
    const normalized = normalizeNativeLanguageId(adapter?.language);
    if (!normalized) continue;
    const existing = profilesByLanguage.get(normalized) ?? nativeImportLanguageProfile(normalized, { supportsLightweightScan: false, parserAdapters: [] });
    profilesByLanguage.set(normalized, {
      ...existing,
      parserAdapters: uniqueStrings([...(existing.parserAdapters ?? []), adapter.parser ?? adapter.id].filter(Boolean))
    });
  }
  for (const adapter of targetAdapters) {
    const summary = safeNativeTargetProjectionAdapterSummary(adapter);
    const normalized = normalizeNativeLanguageId(summary?.sourceLanguage);
    if (!normalized) continue;
    const existing = profilesByLanguage.get(normalized) ?? nativeImportLanguageProfile(normalized, { supportsLightweightScan: false, parserAdapters: [] });
    profilesByLanguage.set(normalized, {
      ...existing,
      projectionTargets: uniqueStrings([...(existing.projectionTargets ?? []), summary.target].filter(Boolean))
    });
  }
  return [...profilesByLanguage.values()].sort((left, right) => left.language.localeCompare(right.language));
}

function normalizeNativeImportLanguageProfile(profile, fallbackLanguage) {
  const language = normalizeNativeLanguageId(profile.language ?? fallbackLanguage);
  return {
    language,
    aliases: uniqueStrings(profile.aliases ?? []),
    extensions: uniqueStrings(profile.extensions ?? []),
    supportsLightweightScan: profile.supportsLightweightScan !== false,
    parserAdapters: uniqueStrings(profile.parserAdapters ?? []),
    projectionTargets: uniqueStrings(profile.projectionTargets ?? nativeProjectionTargetsForLanguage(language, profile.aliases ?? [])),
    knownLossKinds: uniqueStrings(profile.knownLossKinds ?? profile.lossKinds ?? []),
    defaultReadiness: profile.defaultReadiness ?? 'needs-review',
    notes: uniqueStrings(profile.notes ?? [])
  };
}

function nativeImportCoverageForProfile(profile, imports, adapters) {
  const aliases = new Set([profile.language, ...(profile.aliases ?? [])].map(normalizeNativeLanguageId).filter(Boolean));
  const matchingImports = imports.filter((imported) => aliases.has(normalizeNativeLanguageId(imported?.language ?? imported?.nativeAst?.language)));
  const matchingAdapters = adapters.filter((adapter) => aliases.has(normalizeNativeLanguageId(adapter?.language)));
  const lossSummary = summarizeNativeImportLosses(matchingImports.flatMap((imported) => imported?.losses ?? []), {
    evidence: matchingImports.flatMap((imported) => imported?.evidence ?? [])
  });
  const readiness = matchingImports.length
    ? lossSummary.semanticMergeReadiness
    : profile.supportsLightweightScan ? profile.defaultReadiness : 'blocked';
  const importedParsers = uniqueStrings(matchingImports.map((imported) => imported?.nativeAst?.parser ?? imported?.parser ?? imported?.metadata?.parser).filter(Boolean));
  const sourceMaps = matchingImports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? []);
  const adapterCoverage = summarizeNativeImporterAdapterCoverageEntries([
    ...matchingImports.map((imported) => nativeImporterAdapterCoverageEntryFromImport(imported)).filter(Boolean),
    ...matchingAdapters.map((adapter) => nativeImporterAdapterCoverageEntryFromAdapter(adapter)).filter(Boolean)
  ]);
  return {
    language: profile.language,
    aliases: profile.aliases,
    extensions: profile.extensions,
    supportsLightweightScan: profile.supportsLightweightScan,
    parserAdapters: uniqueStrings([...(profile.parserAdapters ?? []), ...matchingAdapters.map((adapter) => adapter.parser ?? adapter.id).filter(Boolean)]),
    projectionTargets: profile.projectionTargets,
    knownLossKinds: uniqueStrings([...(profile.knownLossKinds ?? []), ...Object.keys(lossSummary.byKind)]),
    defaultReadiness: profile.defaultReadiness,
    notes: profile.notes,
    adapterCoverage,
    imports: {
      total: matchingImports.length,
      parsers: importedParsers,
      readiness,
      readinessReasons: matchingImports.length ? lossSummary.readinessReasons : nativeImportCoverageReasons(profile),
      symbols: matchingImports.reduce((sum, imported) => sum + (imported?.semanticIndex?.symbols?.length ?? imported?.universalAst?.semanticIndex?.symbols?.length ?? 0), 0),
      sourceMaps: sourceMaps.length,
      sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap?.mappings?.length ?? 0), 0),
      losses: lossSummary.total,
      lossKinds: lossSummary.byKind,
      lossCategories: lossSummary.categories
    }
  };
}

function nativeImporterAdapterCoverageEntryFromImport(imported) {
  const coverage = imported?.adapter?.coverage
    ?? imported?.metadata?.adapterCoverage
    ?? imported?.nativeAst?.metadata?.adapterCoverage
    ?? imported?.nativeSource?.metadata?.adapterCoverage;
  if (!coverage) return undefined;
  return {
    adapterId: imported?.adapter?.id ?? imported?.metadata?.adapterId ?? imported?.nativeAst?.metadata?.adapterId,
    language: imported?.adapter?.language ?? imported?.language ?? imported?.nativeAst?.language,
    parser: imported?.adapter?.parser ?? imported?.nativeAst?.parser ?? imported?.nativeSource?.parser,
    coverage
  };
}

function nativeImporterAdapterCoverageEntryFromAdapter(adapter) {
  if (!adapter) return undefined;
  const summary = normalizeNativeImporterAdapter(adapter);
  return {
    adapterId: summary.id,
    language: summary.language,
    parser: summary.parser,
    coverage: summary.coverage
  };
}

function summarizeNativeImporterAdapterCoverageEntries(entries = []) {
  const aggregate = emptyNativeImporterAdapterCoverageAggregate();
  for (const entry of entries) {
    const coverage = normalizeNativeImporterAdapterCoverageForEvidence(entry.coverage);
    const capabilityEvidence = coverage.capabilityEvidence;
    const summary = {
      adapterId: entry.adapterId,
      language: entry.language,
      parser: entry.parser,
      exactness: coverage.exactness,
      declared: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'declared'),
      observed: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'observed'),
      effective: capabilityNamesByBoolean(capabilityEvidence.capabilities, 'effective'),
      gaps: capabilityEvidence.gaps,
      declaredOnly: capabilityEvidence.declaredOnly,
      observedOnly: capabilityEvidence.observedOnly
    };
    aggregate.total += 1;
    aggregate.summaries.push(summary);
    incrementCoverageCapabilityCounts(aggregate.declared, summary.declared);
    incrementCoverageCapabilityCounts(aggregate.observed, summary.observed);
    incrementCoverageCapabilityCounts(aggregate.effective, summary.effective);
    incrementCoverageCapabilityCounts(aggregate.gaps, summary.gaps);
    incrementCoverageCapabilityCounts(aggregate.declaredOnly, summary.declaredOnly);
    incrementCoverageCapabilityCounts(aggregate.observedOnly, summary.observedOnly);
  }
  return {
    ...aggregate,
    summaries: Object.freeze(aggregate.summaries)
  };
}

function normalizeNativeImporterAdapterCoverageForEvidence(coverage = {}) {
  if (coverage.capabilityEvidence) return coverage;
  const declared = coverage.declared ?? adapterCoverageSnapshotFromSummary(coverage);
  const observed = normalizeNativeImporterAdapterObservedCoverage(coverage.observed, declared);
  const effective = effectiveNativeImporterAdapterCoverage(declared, observed);
  return {
    ...coverage,
    ...effective,
    declared,
    observed,
    capabilityEvidence: nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  };
}

function emptyNativeImporterAdapterCoverageAggregate() {
  return {
    total: 0,
    declared: {},
    observed: {},
    effective: {},
    gaps: {},
    declaredOnly: {},
    observedOnly: {},
    summaries: []
  };
}

function mergeNativeImporterAdapterCoverageAggregates(left, right) {
  const merged = emptyNativeImporterAdapterCoverageAggregate();
  for (const aggregate of [left, right]) {
    if (!aggregate) continue;
    merged.total += aggregate.total ?? 0;
    incrementCoverageCapabilityCounts(merged.declared, aggregate.declared ?? {});
    incrementCoverageCapabilityCounts(merged.observed, aggregate.observed ?? {});
    incrementCoverageCapabilityCounts(merged.effective, aggregate.effective ?? {});
    incrementCoverageCapabilityCounts(merged.gaps, aggregate.gaps ?? {});
    incrementCoverageCapabilityCounts(merged.declaredOnly, aggregate.declaredOnly ?? {});
    incrementCoverageCapabilityCounts(merged.observedOnly, aggregate.observedOnly ?? {});
    merged.summaries.push(...(aggregate.summaries ?? []));
  }
  return {
    ...merged,
    summaries: Object.freeze(merged.summaries)
  };
}

function capabilityNamesByBoolean(rows, property) {
  return rows.filter((row) => row[property]).map((row) => row.capability);
}

function incrementCoverageCapabilityCounts(target, capabilities) {
  if (Array.isArray(capabilities)) {
    for (const capability of capabilities) {
      target[capability] = (target[capability] ?? 0) + 1;
    }
    return;
  }
  for (const [capability, count] of Object.entries(capabilities ?? {})) {
    target[capability] = (target[capability] ?? 0) + count;
  }
}

function semanticImportSidecarEntry(imported, index, options) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  const sourcePreservationRecords = collectKernelSourcePreservationFromImport(imported);
  const universalAstLayers = summarizeUniversalAstLayers(imported?.universalAst);
  const proofSpec = summarizeProofSpecLayer(imported?.universalAst?.proof ?? imported?.proof);
  const mappingsBySymbolId = new Map();
  for (const mapping of sourceMapMappings) {
    if (mapping.semanticSymbolId && !mappingsBySymbolId.has(mapping.semanticSymbolId)) {
      mappingsBySymbolId.set(mapping.semanticSymbolId, mapping);
    }
  }
  const symbols = [];
  const regions = [];
  for (const symbol of semanticIndex?.symbols ?? []) {
    const mapping = mappingsBySymbolId.get(symbol.id);
    const nativeNode = symbol.nativeAstNodeId ? nativeAst?.nodes?.[symbol.nativeAstNodeId] : undefined;
    const region = semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options);
    regions.push(region);
    symbols.push({
      id: symbol.id,
      name: symbol.name,
      kind: symbol.kind,
      language: symbol.language ?? imported?.language,
      nativeAstNodeId: symbol.nativeAstNodeId,
      semanticOccurrenceId: mapping?.semanticOccurrenceId,
      sourceMapMappingId: mapping?.id,
      sourceSpan: mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span,
      signatureHash: symbol.signatureHash,
      ownershipRegionId: region.id,
      ownershipKey: region.key,
      ownershipRegionKind: region.regionKind,
      readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review'
    });
  }
  const ownershipRegions = uniqueRecordsById(regions);
  const regionTaxonomy = summarizeSemanticImportRegionTaxonomy(ownershipRegions);
  return {
    id: imported?.id ?? `import_${index + 1}`,
    language: imported?.language,
    sourcePath: imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? nativeAst?.sourceHash,
    parser: imported?.nativeAst?.parser ?? nativeAst?.parser,
    nativeSourceId: imported?.nativeSource?.id,
    nativeAstId: nativeAst?.id,
    semanticIndexId: semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    symbolCount: symbols.length,
    sourceMapCount: sourceMaps.length,
    sourceMapMappingCount: sourceMapMappings.length,
    sourcePreservationRecordCount: sourcePreservationRecords.length,
    sourcePreservationLevels: uniqueStrings(sourcePreservationRecords.map((record) => record.level).filter(Boolean)),
    universalAstLayerCount: universalAstLayers.total,
    universalAstLayerNames: universalAstLayers.names,
    universalAstLayerIds: universalAstLayers.ids,
    proofSpec,
    readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review',
    emptySemanticIndex: symbols.length === 0,
    regionTaxonomy,
    symbols,
    ownershipRegions
  };
}

function summarizeSemanticImportSidecarProofSpec(importEntries) {
  const byStatus = {};
  const byContractKind = {};
  const byArtifactKind = {};
  const ids = [];
  const contractKinds = [];
  const artifactKinds = [];
  const totals = {
    total: 0,
    contracts: 0,
    refinements: 0,
    invariants: 0,
    termination: 0,
    temporal: 0,
    obligations: 0,
    artifacts: 0,
    assumptions: 0,
    evidence: 0,
    discharged: 0,
    failed: 0,
    open: 0,
    unknown: 0,
    stale: 0,
    assumed: 0
  };
  for (const entry of importEntries) {
    const proof = entry.proofSpec ?? summarizeProofSpecLayer();
    ids.push(...(proof.ids ?? []));
    contractKinds.push(...(proof.contractKinds ?? []));
    artifactKinds.push(...(proof.artifactKinds ?? []));
    for (const key of Object.keys(totals)) {
      totals[key] += proof[key] ?? 0;
    }
    for (const [status, count] of Object.entries(proof.byStatus ?? {})) {
      byStatus[status] = (byStatus[status] ?? 0) + count;
    }
    for (const [kind, count] of Object.entries(proof.byContractKind ?? {})) {
      byContractKind[kind] = (byContractKind[kind] ?? 0) + count;
    }
    for (const [kind, count] of Object.entries(proof.byArtifactKind ?? {})) {
      byArtifactKind[kind] = (byArtifactKind[kind] ?? 0) + count;
    }
  }
  return {
    ...totals,
    ids: uniqueStrings(ids),
    contractKinds: uniqueStrings(contractKinds),
    artifactKinds: uniqueStrings(artifactKinds),
    byStatus,
    byContractKind,
    byArtifactKind,
    empty: totals.total === 0
  };
}

function summarizeProofSpecLayer(proof = {}) {
  const contracts = proof?.contracts ?? [];
  const refinements = proof?.refinements ?? [];
  const invariants = proof?.invariants ?? [];
  const termination = proof?.termination ?? [];
  const temporal = proof?.temporal ?? [];
  const obligations = proof?.obligations ?? [];
  const artifacts = proof?.artifacts ?? [];
  const assumptions = proof?.assumptions ?? [];
  const evidence = proof?.evidence ?? [];
  const allContracts = [...contracts, ...refinements, ...invariants, ...termination, ...temporal];
  const byStatus = {};
  for (const obligation of obligations) {
    const status = obligation?.status ?? 'unknown';
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }
  const byContractKind = {};
  for (const contract of allContracts) {
    const kind = contract?.kind ?? 'unknown';
    byContractKind[kind] = (byContractKind[kind] ?? 0) + 1;
  }
  const byArtifactKind = {};
  for (const artifact of artifacts) {
    const kind = artifact?.kind ?? 'unknown';
    byArtifactKind[kind] = (byArtifactKind[kind] ?? 0) + 1;
  }
  const recordGroups = [allContracts, obligations, artifacts, assumptions];
  const ids = uniqueStrings([
    proof?.id,
    ...recordGroups.flatMap((records) => records.map((record) => record?.id)),
    ...evidence.map((record) => record?.id)
  ].filter(Boolean));
  const total = allContracts.length + obligations.length + artifacts.length + assumptions.length;
  return {
    total,
    ids,
    contracts: contracts.length,
    refinements: refinements.length,
    invariants: invariants.length,
    termination: termination.length,
    temporal: temporal.length,
    obligations: obligations.length,
    artifacts: artifacts.length,
    assumptions: assumptions.length,
    evidence: evidence.length,
    discharged: byStatus.discharged ?? 0,
    failed: byStatus.failed ?? 0,
    open: byStatus.open ?? 0,
    unknown: byStatus.unknown ?? 0,
    stale: byStatus.stale ?? 0,
    assumed: byStatus.assumed ?? 0,
    contractKinds: uniqueStrings(allContracts.map((record) => record?.kind).filter(Boolean)),
    artifactKinds: uniqueStrings(artifacts.map((record) => record?.kind).filter(Boolean)),
    byStatus,
    byContractKind,
    byArtifactKind,
    empty: total === 0
  };
}

function summarizeSemanticImportSidecarUniversalAstLayers(importEntries) {
  const names = [];
  const ids = [];
  const byName = {};
  for (const entry of importEntries) {
    names.push(...(entry.universalAstLayerNames ?? []));
    ids.push(...(entry.universalAstLayerIds ?? []));
    for (const name of entry.universalAstLayerNames ?? []) {
      byName[name] = (byName[name] ?? 0) + 1;
    }
  }
  const uniqueNames = uniqueStrings(names);
  return {
    total: ids.length,
    names: uniqueNames,
    ids: uniqueStrings(ids),
    byName,
    empty: ids.length === 0
  };
}

function summarizeUniversalAstLayers(universalAst) {
  const layers = collectUniversalAstLayerRecords(universalAst?.layers);
  const names = uniqueStrings(layers.map((layer) => layer.layer).filter(Boolean));
  const ids = uniqueStrings(layers.map((layer) => layer.id).filter(Boolean));
  const byName = {};
  for (const layer of layers) {
    if (!layer?.layer) continue;
    byName[layer.layer] = (byName[layer.layer] ?? 0) + 1;
  }
  return {
    total: layers.length,
    names,
    ids,
    byName,
    empty: layers.length === 0
  };
}

function collectUniversalAstLayerRecords(layers) {
  if (!layers) return [];
  if (Array.isArray(layers)) return layers.filter(Boolean);
  if (typeof layers !== 'object') return [];
  return Object.values(layers).flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean);
}

function semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options = {}) {
  const sourcePath = mapping?.sourceSpan?.path ?? symbol.definitionSpan?.path ?? nativeNode?.span?.path ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath;
  const language = symbol.language ?? imported?.language ?? imported?.nativeAst?.language ?? imported?.nativeSource?.language;
  const sourceSpan = mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span;
  const regionKind = semanticRegionKindForSymbol(symbol, mapping, nativeNode);
  const key = [
    options.regionPrefix ?? 'source',
    sourcePath ?? `${language}:memory`,
    regionKind,
    symbol.name ?? symbol.id
  ].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    regionKind,
    granularity: 'symbol',
    language,
    sourcePath,
    sourceHash: imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash,
    symbolId: symbol.id,
    symbolName: symbol.name,
    symbolKind: symbol.kind,
    nativeAstNodeId: symbol.nativeAstNodeId ?? nativeNode?.id,
    sourceSpan,
    precision: mapping?.precision ?? (sourceSpan ? 'declaration' : 'unknown'),
    mergePolicy: semanticRegionMergePolicy(regionKind),
    metadata: {
      semanticRegionTaxonomy: true
    }
  };
}

function semanticOwnershipRegionForDeclaration(input, declaration, documentId) {
  const name = declaration.name ?? declaration.importPath ?? declaration.nodeId ?? declaration.nativeNode?.id;
  const kind = declaration.symbolKind ?? declaration.kind ?? declaration.nativeNode?.kind ?? 'symbol';
  const sourcePath = declaration.span?.path ?? declaration.nativeNode?.span?.path ?? input.sourcePath ?? `${input.language}:memory`;
  const regionKind = semanticRegionKindForDeclaration(declaration);
  const key = ['source', sourcePath, regionKind, name].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
    regionKind,
    granularity: 'symbol',
    language: input.language,
    documentId,
    sourcePath,
    sourceHash: input.sourceHash,
    symbolId: declaration.symbolId,
    symbolName: name,
    symbolKind: kind,
    nativeAstNodeId: declaration.nodeId ?? declaration.nativeNode?.id,
    sourceSpan: declaration.span ?? declaration.nativeNode?.span,
    precision: declaration.span || declaration.nativeNode?.span ? 'declaration' : 'unknown',
    mergePolicy: semanticRegionMergePolicy(regionKind),
    metadata: {
      semanticRegionTaxonomy: true
    }
  };
}

function semanticPatchHintForRegion(region, readiness, options = {}) {
  return {
    id: `hint_${idFragment(region.id)}`,
    kind: 'source-region-patch',
    ownershipRegionId: region.id,
    ownershipKey: region.key,
    sourcePath: region.sourcePath,
    sourceHash: region.sourceHash,
    sourceSpan: region.sourceSpan,
    readiness,
    precision: region.precision,
    supportedOperations: semanticRegionSupportedOperations(region),
    projection: {
      sourceLanguage: region.language,
      targetPath: options.targetPath ?? region.sourcePath,
      requiresSourceMap: true
    }
  };
}

function semanticRegionKindForDeclaration(declaration) {
  if (declaration.role === 'import' || declaration.importPath) return 'import';
  if (declaration.regionKind) return normalizeNativeImportRegionKind(declaration.regionKind);
  if (declaration.metadata?.ownershipRegionKind) return normalizeNativeImportRegionKind(declaration.metadata.ownershipRegionKind);
  const kind = declaration.symbolKind ?? declaration.kind ?? declaration.nativeNode?.kind;
  if (semanticKindIsType(kind)) return 'type';
  if (semanticKindCanOwnBody(kind, declaration.span ?? declaration.nativeNode?.span)) return 'body';
  return 'declaration';
}

function semanticRegionKindForSymbol(symbol, mapping, nativeNode) {
  if (mapping?.generatedSpan || mapping?.generatedName || mapping?.target?.emitPath) return 'generatedOutput';
  if (symbol?.metadata?.ownershipRegionKind) return normalizeNativeImportRegionKind(symbol.metadata.ownershipRegionKind);
  if (String(symbol?.id ?? '').includes(':import:') || symbol?.metadata?.role === 'import') return 'import';
  if (semanticKindIsType(symbol?.kind ?? nativeNode?.kind)) return 'type';
  if (semanticKindCanOwnBody(symbol?.kind ?? nativeNode?.kind, nativeNode?.span ?? symbol?.definitionSpan)) return 'body';
  return 'declaration';
}

function semanticKindIsType(kind) {
  return ['type', 'class', 'interface', 'trait', 'protocol', 'struct', 'enum', 'record'].includes(String(kind ?? '').toLowerCase());
}

function semanticKindCanOwnBody(kind, span) {
  const text = String(kind ?? '').toLowerCase();
  if (/function|method|class|implementation|module|namespace|package|action|effect|capability/.test(text)) return true;
  return typeof span?.startLine === 'number' && typeof span?.endLine === 'number' && span.endLine > span.startLine;
}

function semanticRegionMergePolicy(regionKind) {
  if (regionKind === 'import') return 'module-edge-review-required';
  if (regionKind === 'body') return 'implementation-single-writer-review-required';
  if (regionKind === 'call') return 'callsite-overlap-review-required';
  if (regionKind === 'type') return 'type-surface-review-required';
  if (regionKind === 'effect') return 'effect-boundary-review-required';
  if (regionKind === 'generatedOutput') return 'generated-output-source-map-review-required';
  return 'single-writer-review-required';
}

function semanticRegionSupportedOperations(region) {
  if (region.regionKind === 'import') return ['replace-import', 'insert-import-before', 'insert-import-after', 'replace-region'];
  if (region.regionKind === 'body') return ['replace-body', 'insert-before-body', 'insert-after-body'];
  if (region.regionKind === 'call') return ['replace-callsite', 'review-callsite'];
  if (region.regionKind === 'type') return ['replace-type-declaration', 'merge-type-members', 'replace-region'];
  if (region.regionKind === 'effect') return ['route-effect', 'replace-effect-boundary', 'review-effect-policy'];
  if (region.regionKind === 'generatedOutput') return ['replace-generated-output', 'attach-generated-source-map', 'review-generator-input'];
  return ['replace-region', 'insert-before-region', 'insert-after-region'];
}

function normalizeNativeImportRegionKind(value) {
  const text = String(value ?? 'symbol').trim();
  if (text === 'generated' || text === 'generated-output' || text === 'generated_output') return 'generatedOutput';
  if (NativeImportRegionTaxonomyKinds.includes(text)) return text;
  return text || 'symbol';
}

function summarizeSemanticImportRegionTaxonomy(regions) {
  const byKind = {};
  const keysByKind = {};
  const keys = [];
  for (const region of regions ?? []) {
    const kind = normalizeNativeImportRegionKind(region.regionKind ?? region.granularity);
    byKind[kind] = (byKind[kind] ?? 0) + 1;
    keysByKind[kind] = [...(keysByKind[kind] ?? []), region.key].filter(Boolean);
    if (region.key) keys.push(region.key);
  }
  return {
    kinds: [...NativeImportRegionTaxonomyKinds],
    presentKinds: uniqueStrings(Object.keys(byKind)),
    byKind,
    keys,
    keysByKind
  };
}

function nativeImportCoverageReasons(profile) {
  if (!profile.supportsLightweightScan) return ['No built-in scanner coverage profile; host must provide an exact adapter or mark unsupported.'];
  return ['Built-in coverage is declaration-level only; use injected parser adapters for exact AST/CST, tokens, trivia, type resolution, and round-trip evidence.'];
}

function normalizeNativeLanguageId(value) {
  if (!value) return '';
  const text = String(value).trim().toLowerCase();
  if (text === 'js' || text === 'mjs' || text === 'cjs' || text === 'jsx') return 'javascript';
  if (text === 'ts' || text === 'tsx') return 'typescript';
  if (text === 'py' || text === 'pyi') return 'python';
  if (text === 'rs') return 'rust';
  if (text === 'h') return 'c';
  if (text === 'c++' || text === 'cc' || text === 'cxx' || text === 'hpp' || text === 'hh') return 'cpp';
  if (text === 'c#' || text === 'cs') return 'csharp';
  if (text === 'rb' || text === 'rake') return 'ruby';
  if (text === 'kt' || text === 'kts') return 'kotlin';
  if (text === 'sc') return 'scala';
  if (text === 'sh' || text === 'bash' || text === 'zsh') return 'shell';
  if (text === 'postgresql' || text === 'postgres' || text === 'mysql' || text === 'sqlite') return 'sql';
  if (text === 'ex' || text === 'exs') return 'elixir';
  if (text === 'erl' || text === 'hrl') return 'erlang';
  if (text === 'hs' || text === 'lhs') return 'haskell';
  return text;
}

function semanticMergeAdmissionForSeverity(severity) {
  if (severity === 'error') return 'blocked';
  if (severity === 'warning') return 'review';
  return 'disclose';
}

function nativeImportReadinessReasons(input) {
  if (input.failedEvidenceIds.length) {
    return [`Failed native import evidence prevents merge: ${input.failedEvidenceIds.join(', ')}`];
  }
  if (input.blockingLossIds.length) {
    return [`Native import error loss(es) block semantic merge: ${input.blockingLossIds.join(', ')}`];
  }
  if (input.reviewLossIds.length) {
    return [`Native import warning loss(es) require review: ${input.reviewLossIds.join(', ')}`];
  }
  if (input.informationalLossIds.length) {
    return [`Native import recorded informational loss(es): ${input.informationalLossIds.join(', ')}`];
  }
  if (input.exactAst) return ['Native import supplied exact AST coverage with no recorded loss.'];
  return ['Native import has no recorded loss.'];
}

function attachNativeImportLossSummary(evidence, lossSummary) {
  return (evidence ?? []).map((record) => ({
    ...record,
    metadata: {
      ...record.metadata,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness: lossSummary.semanticMergeReadiness,
      lossCategories: lossSummary.categories
    }
  }));
}

function hasNativeExactAstEvidence(input, nativeAst, lightweight) {
  if (lightweight) return false;
  if (!(input?.nativeAst || input?.nodes)) return false;
  if (input.exactAst === true || input.metadata?.exactAst === true || input.nativeAstMetadata?.exactAst === true) return true;
  const coverage = input.metadata?.adapterCoverage
    ?? input.nativeAstMetadata?.adapterCoverage
    ?? input.nativeSourceMetadata?.adapterCoverage
    ?? nativeAst?.metadata?.adapterCoverage;
  if (coverage?.exactAst !== true) return false;
  const observedNodes = coverage.observed?.nativeAstNodes;
  return observedNodes === undefined || observedNodes > 0;
}

function unverifiedNativeAstLosses(input, nativeAst, context) {
  if (context.lightweight || context.exactAst || context.hasLosses) return [];
  if (!(input?.nativeAst || input?.nodes)) return [];
  return [{
    id: `loss_${context.importIdPart}_unverified_native_ast`,
    severity: 'warning',
    kind: 'unverifiedNativeAst',
    nodeId: nativeAst?.rootId,
    message: 'Caller supplied native AST nodes without explicit exactAst or adapter coverage evidence.',
    metadata: {
      reason: 'missing-exact-ast-evidence',
      nativeAstId: nativeAst?.id,
      parser: nativeAst?.parser
    }
  }];
}

function withNativeImportReadiness(importResult, lossSummary) {
  const mergeCandidates = (importResult.mergeCandidates ?? []).map((candidate) => {
    const readiness = maxSemanticMergeReadiness(candidate.readiness, lossSummary.semanticMergeReadiness);
    return {
      ...candidate,
      readiness,
      reasons: uniqueStrings([
        ...(candidate.reasons ?? []),
        ...lossSummary.readinessReasons
      ]),
      metadata: {
        ...candidate.metadata,
        nativeImportLossSummary: lossSummary,
        severityReadiness: lossSummary.semanticMergeReadiness,
        finalReadiness: readiness,
        lossCategories: lossSummary.categories,
        lossSeverityCounts: lossSummary.bySeverity,
        lossKindCounts: lossSummary.byKind
      }
    };
  });
  const semanticMergeReadiness = mergeCandidates[0]?.readiness ?? lossSummary.semanticMergeReadiness;
  const contractInput = {
    ...importResult,
    mergeCandidates,
    metadata: {
      ...importResult.metadata,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness
    }
  };
  const importResultContract = createNativeImportResultContract(contractInput, { lossSummary });
  return {
    ...importResult,
    mergeCandidates,
    metadata: {
      ...importResult.metadata,
      importResultContract,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness,
      readinessReasons: importResultContract.readiness.reasons,
      sourcePreservationSummary: importResultContract.sourcePreservation,
      adapterCoverageSummary: importResultContract.adapterCoverage,
      regionSummary: importResultContract.regions,
      sourceMapSummary: importResultContract.sourceMaps,
      lossCategories: lossSummary.categories,
      lossSeverityCounts: lossSummary.bySeverity,
      lossKindCounts: lossSummary.byKind
    }
  };
}

function nativeImportEntries(importResult) {
  if (Array.isArray(importResult?.imports)) return importResult.imports.filter(Boolean);
  return [importResult].filter(Boolean);
}

function nativeImportHasExactAstCoverage(imported) {
  if (imported?.metadata?.nativeImportLossSummary?.exactAst === true) return true;
  if (imported?.adapter?.coverage?.exactAst === true && !(imported?.losses?.length)) return true;
  return false;
}

function nativeImportRoundtripParser(importResult, imports) {
  const parsers = uniqueStrings([
    importResult.nativeAst?.parser,
    importResult.nativeSource?.parser,
    importResult.metadata?.parser,
    ...imports.map((imported) => imported?.nativeAst?.parser ?? imported?.nativeSource?.parser ?? imported?.metadata?.parser)
  ].filter(Boolean));
  return parsers.length === 1 ? parsers[0] : parsers.length ? parsers.join(',') : undefined;
}

function nativeImportRoundtripReasons(status, input) {
  if (status === 'blocked') return uniqueStrings(input.blockingReasons);
  if (status === 'stub-only') {
    return uniqueStrings([
      `Native source projection emitted declaration stubs in ${input.projection.mode} mode.`,
      ...input.projectionReadiness.reasons,
      ...input.importReadiness.reasons.filter((reason) => input.importReadiness.readiness !== 'ready')
    ]);
  }
  if (status === 'needs-review') return uniqueStrings(input.reviewReasons);
  if (status === 'exact') {
    return ['Exact native AST import and verified preserved source projection are available.'];
  }
  if (status === 'preserved-source') {
    return uniqueStrings([
      'Verified native source text is preserved for projection; semantic import evidence may still require review.',
      ...input.importReadiness.reasons.filter((reason) => input.importReadiness.readiness !== 'ready')
    ]);
  }
  return ['Native import roundtrip readiness requires review.'];
}

function collectImportSourceMaps(importResult, imports) {
  return uniqueRecordsById([
    ...(importResult?.sourceMaps ?? importResult?.universalAst?.sourceMaps ?? []),
    ...imports.flatMap((imported) => imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [])
  ]);
}

function summarizeImportSourceMaps(sourceMaps) {
  const mappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
  return {
    total: sourceMaps.length,
    ids: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean),
    mappingCount: mappings.length,
    sourcePaths: uniqueStrings([
      ...sourceMaps.map((sourceMap) => sourceMap.sourcePath),
      ...mappings.map((mapping) => mapping.sourceSpan?.path)
    ].filter(Boolean)),
    targetPaths: uniqueStrings([
      ...sourceMaps.map((sourceMap) => sourceMap.targetPath ?? sourceMap.target?.emitPath),
      ...mappings.map((mapping) => mapping.generatedSpan?.targetPath ?? mapping.target?.emitPath)
    ].filter(Boolean)),
    byPrecision: countBy(mappings.map((mapping) => mapping.precision ?? 'unknown')),
    sourceRangeMappings: mappings.filter((mapping) => mapping.sourceSpan).length,
    generatedRangeMappings: mappings.filter((mapping) => mapping.generatedSpan).length
  };
}

function summarizeImportRegions(importResult, imports, options = {}) {
  const entries = imports.map((imported, index) => semanticImportSidecarEntry(imported, index, options));
  const regions = uniqueRecordsById(entries.flatMap((entry) => entry.ownershipRegions ?? []));
  const taxonomy = summarizeSemanticImportRegionTaxonomy(regions);
  return {
    total: regions.length,
    ids: regions.map((region) => region.id),
    keys: regions.map((region) => region.key),
    sourcePaths: uniqueStrings(regions.map((region) => region.sourcePath).filter(Boolean)),
    byKind: taxonomy.byKind,
    byGranularity: countBy(regions.map((region) => region.granularity ?? 'unknown')),
    byPrecision: countBy(regions.map((region) => region.precision ?? 'unknown')),
    byLanguage: countBy(regions.map((region) => region.language ?? importResult?.language ?? 'unknown')),
    symbolIds: uniqueStrings(regions.map((region) => region.symbolId).filter(Boolean)),
    taxonomy
  };
}

function createKernelSourcePreservationRecords(input) {
  const records = [];
  if (input.sourcePreservation) {
    const exactSource = input.sourcePreservation.summary?.exactSourceAvailable === true &&
      (!input.sourceHash || input.sourcePreservation.sourceHash === input.sourceHash);
    const hashMismatch = input.sourceHash &&
      input.sourcePreservation.sourceHash &&
      input.sourcePreservation.sourceHash !== input.sourceHash;
    records.push(createSourcePreservationRecord({
      id: `source_preservation_${idFragment(input.idPart ?? input.sourcePath ?? input.language)}_file`,
      level: hashMismatch ? 'blocked' : exactSource ? 'exact' : 'estimated',
      precision: exactSource ? 'exact' : 'estimated',
      nativeSourceId: input.nativeSource?.id,
      nativeAstNodeId: input.nativeAst?.rootId,
      sourceSpan: {
        sourceId: input.sourceHash,
        path: input.sourcePath,
        startLine: 1,
        startColumn: 1
      },
      lossIds: (input.losses ?? []).filter((loss) => loss.kind === 'sourcePreservation' || loss.sourceMapId).map((loss) => loss.id),
      evidenceIds: (input.evidence ?? []).map((record) => record.id).filter(Boolean),
      losses: input.losses ?? [],
      evidence: input.evidence ?? [],
      reasons: hashMismatch
        ? [`Preserved source hash ${input.sourcePreservation.sourceHash} does not match import hash ${input.sourceHash}.`]
        : exactSource
          ? ['Exact native source text is preserved for source-level replay and semantic merge review.']
          : ['Native source preservation metadata exists, but exact source text is unavailable or unverified.'],
      metadata: {
        compilerRecord: 'nativeSourcePreservation',
        nativeSourcePreservationId: input.sourcePreservation.id,
        sourceBytes: input.sourcePreservation.sourceBytes,
        lineCount: input.sourcePreservation.lineCount,
        tokens: input.sourcePreservation.summary?.tokens ?? 0,
        trivia: input.sourcePreservation.summary?.trivia ?? 0,
        directives: input.sourcePreservation.summary?.directives ?? 0,
        comments: input.sourcePreservation.summary?.comments ?? 0,
        whitespace: input.sourcePreservation.summary?.whitespace ?? 0,
        truncated: input.sourcePreservation.summary?.truncated === true
      }
    }));
  }

  for (const sourceMap of input.sourceMaps ?? []) {
    for (const mapping of sourceMap.mappings ?? []) {
      records.push(explainSourcePreservation({
        id: `source_preservation_${idFragment(sourceMap.id)}_${idFragment(mapping.id)}`,
        sourceMap,
        mapping,
        level: mapping.preservation,
        losses: input.losses ?? [],
        evidence: uniqueRecordsById([...(input.evidence ?? []), ...(sourceMap.evidence ?? [])]),
        metadata: {
          compilerRecord: 'sourceMapMapping',
          language: input.language,
          semanticIndexId: input.semanticIndex?.id,
          sourceMapId: sourceMap.id,
          sourceMapMappingId: mapping.id
        }
      }));
    }
  }

  return uniqueRecordsById(records);
}

function summarizeKernelSourcePreservationRecords(records) {
  const compactRecords = records.map(compactKernelSourcePreservationRecord);
  const byLevel = countBy(compactRecords.map((record) => record.level ?? 'unknown'));
  return {
    total: compactRecords.length,
    ids: compactRecords.map((record) => record.id).filter(Boolean),
    byLevel,
    exact: byLevel.exact ?? 0,
    declaration: byLevel.declaration ?? 0,
    estimated: byLevel.estimated ?? 0,
    blocked: byLevel.blocked ?? 0,
    sourcePaths: uniqueStrings(compactRecords.map((record) => record.sourcePath).filter(Boolean)),
    sourceMapIds: uniqueStrings(compactRecords.map((record) => record.sourceMapId).filter(Boolean)),
    sourceMapMappingIds: uniqueStrings(compactRecords.map((record) => record.sourceMapMappingId).filter(Boolean)),
    records: compactRecords
  };
}

function collectKernelSourcePreservationFromImport(imported) {
  return uniqueRecordsById([
    ...(imported?.metadata?.kernelSourcePreservationRecords ?? []),
    ...(imported?.metadata?.sourcePreservationRecords ?? []),
    ...(imported?.universalAst?.metadata?.kernelSourcePreservationRecords ?? []),
    ...(imported?.universalAst?.metadata?.sourcePreservationRecords ?? [])
  ].filter((record) => record?.kind === 'frontier.lang.sourcePreservation'));
}

function summarizeKernelSourcePreservation(importResult, imports) {
  return summarizeKernelSourcePreservationRecords(uniqueRecordsById([
    ...collectKernelSourcePreservationFromImport(importResult),
    ...imports.flatMap((imported) => collectKernelSourcePreservationFromImport(imported))
  ]));
}

function compactKernelSourcePreservationRecord(record) {
  return {
    id: record.id,
    level: record.level,
    precision: record.precision,
    sourceMapId: record.sourceMapId,
    sourceMapMappingId: record.sourceMapMappingId,
    semanticNodeId: record.semanticNodeId,
    nativeSourceId: record.nativeSourceId,
    nativeAstNodeId: record.nativeAstNodeId,
    semanticSymbolId: record.semanticSymbolId,
    semanticOccurrenceId: record.semanticOccurrenceId,
    sourcePath: record.sourceSpan?.path,
    generatedPath: record.generatedSpan?.path ?? record.generatedSpan?.targetPath,
    lossIds: record.lossIds ?? [],
    evidenceIds: record.evidenceIds ?? [],
    reasons: record.reasons ?? []
  };
}

function summarizeImportSourcePreservation(importResult, imports) {
  const records = uniqueSourcePreservationRecords([
    ...collectSourcePreservationFromImport(importResult),
    ...imports.flatMap((imported) => collectSourcePreservationFromImport(imported))
  ]);
  const compactRecords = records.map(compactSourcePreservationRecord);
  return {
    total: compactRecords.length,
    ids: compactRecords.map((record) => record.id).filter(Boolean),
    sourcePaths: uniqueStrings(compactRecords.map((record) => record.sourcePath).filter(Boolean)),
    sourceHashes: uniqueStrings(compactRecords.map((record) => record.sourceHash).filter(Boolean)),
    exactSourceAvailable: compactRecords.filter((record) => record.exactSourceAvailable).length,
    sourceBytes: compactRecords.reduce((sum, record) => sum + (record.sourceBytes ?? 0), 0),
    lineCount: compactRecords.reduce((sum, record) => sum + (record.lineCount ?? 0), 0),
    tokens: compactRecords.reduce((sum, record) => sum + (record.tokens ?? 0), 0),
    trivia: compactRecords.reduce((sum, record) => sum + (record.trivia ?? 0), 0),
    directives: compactRecords.reduce((sum, record) => sum + (record.directives ?? 0), 0),
    comments: compactRecords.reduce((sum, record) => sum + (record.comments ?? 0), 0),
    whitespace: compactRecords.reduce((sum, record) => sum + (record.whitespace ?? 0), 0),
    truncated: compactRecords.some((record) => record.truncated),
    records: compactRecords
  };
}

function collectSourcePreservationFromImport(imported) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  return [
    imported?.metadata?.sourcePreservation,
    imported?.nativeSource?.metadata?.sourcePreservation,
    nativeAst?.metadata?.sourcePreservation,
    imported?.universalAst?.metadata?.sourcePreservation,
    ...(imported?.nativeSources ?? []).map((nativeSource) => nativeSource?.metadata?.sourcePreservation ?? nativeSource?.ast?.metadata?.sourcePreservation)
  ].filter(Boolean);
}

function uniqueSourcePreservationRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = record.id ?? `${record.sourcePath ?? 'source'}#${record.sourceHash ?? result.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function compactSourcePreservationRecord(record) {
  return {
    id: record.id,
    language: record.language,
    sourcePath: record.sourcePath,
    sourceHash: record.sourceHash,
    sourceBytes: record.sourceBytes,
    lineCount: record.lineCount,
    newline: record.newline,
    encoding: record.encoding,
    exactSourceAvailable: record.summary?.exactSourceAvailable === true,
    tokens: record.summary?.tokens ?? record.tokens?.length ?? 0,
    trivia: record.summary?.trivia ?? record.trivia?.length ?? 0,
    directives: record.summary?.directives ?? record.directives?.length ?? 0,
    comments: record.summary?.comments ?? 0,
    whitespace: record.summary?.whitespace ?? 0,
    truncated: record.summary?.truncated === true
  };
}

function summarizeImportAdapterCoverage(importResult, imports) {
  const records = uniqueAdapterCoverageRecords([
    compactAdapterCoverageRecord(importResult),
    ...imports.map((imported) => compactAdapterCoverageRecord(imported))
  ].filter(Boolean));
  const observed = records.reduce((totals, record) => {
    for (const key of ['diagnostics', 'losses', 'nativeAstNodes', 'semanticSymbols', 'sourceMapMappings']) {
      totals[key] += record.observed?.[key] ?? 0;
    }
    totals.sourceRanges = totals.sourceRanges || record.observed?.sourceRanges === true;
    totals.generatedRanges = totals.generatedRanges || record.observed?.generatedRanges === true;
    return totals;
  }, {
    diagnostics: 0,
    losses: 0,
    nativeAstNodes: 0,
    semanticSymbols: 0,
    sourceMapMappings: 0,
    sourceRanges: false,
    generatedRanges: false
  });
  return {
    total: records.length,
    adapterIds: uniqueStrings(records.map((record) => record.adapterId).filter(Boolean)),
    parsers: uniqueStrings(records.map((record) => record.parser).filter(Boolean)),
    exactness: uniqueStrings(records.map((record) => record.exactness).filter(Boolean)),
    exactAst: records.filter((record) => record.exactAst).length,
    tokens: records.filter((record) => record.tokens).length,
    trivia: records.filter((record) => record.trivia).length,
    diagnostics: records.filter((record) => record.diagnostics).length,
    sourceRanges: records.filter((record) => record.sourceRanges).length,
    generatedRanges: records.filter((record) => record.generatedRanges).length,
    semanticCoverageLevels: uniqueStrings(records.map((record) => record.semanticCoverage?.level).filter(Boolean)),
    observed,
    records
  };
}

function compactAdapterCoverageRecord(imported) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const nativeSource = imported?.nativeSource;
  const coverage = imported?.adapter?.coverage
    ?? imported?.metadata?.adapterCoverage
    ?? nativeAst?.metadata?.adapterCoverage
    ?? nativeSource?.metadata?.adapterCoverage;
  if (!coverage) return undefined;
  return {
    adapterId: imported?.adapter?.id ?? imported?.metadata?.adapterId ?? nativeAst?.metadata?.adapterId ?? nativeSource?.metadata?.adapterId,
    adapterVersion: imported?.adapter?.version ?? imported?.metadata?.adapterVersion ?? nativeAst?.metadata?.adapterVersion ?? nativeSource?.metadata?.adapterVersion,
    parser: imported?.adapter?.parser ?? nativeAst?.parser ?? nativeSource?.parser ?? imported?.metadata?.parser,
    capabilities: uniqueStrings(imported?.adapter?.capabilities ?? imported?.metadata?.adapterCapabilities ?? []),
    supportedExtensions: uniqueStrings(imported?.adapter?.supportedExtensions ?? imported?.metadata?.supportedExtensions ?? []),
    exactness: coverage.exactness,
    exactAst: Boolean(coverage.exactAst),
    tokens: Boolean(coverage.tokens),
    trivia: Boolean(coverage.trivia),
    diagnostics: Boolean(coverage.diagnostics),
    sourceRanges: Boolean(coverage.sourceRanges),
    generatedRanges: Boolean(coverage.generatedRanges),
    semanticCoverage: coverage.semanticCoverage,
    observed: coverage.observed,
    notes: uniqueStrings(coverage.notes ?? [])
  };
}

function uniqueAdapterCoverageRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = [record.adapterId, record.adapterVersion, record.parser, record.exactness].join('#');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function compactImportContractSource(imported, index) {
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const nativeSource = imported?.nativeSource;
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const sourceMaps = collectImportSourceMaps(imported, [imported].filter(Boolean));
  return {
    id: imported?.id ?? `import_${index + 1}`,
    language: imported?.language ?? nativeSource?.language ?? nativeAst?.language,
    sourcePath: imported?.sourcePath ?? nativeSource?.sourcePath ?? nativeAst?.sourcePath,
    sourceHash: nativeSource?.sourceHash ?? nativeAst?.sourceHash,
    parser: nativeAst?.parser ?? nativeSource?.parser,
    nativeSourceId: nativeSource?.id,
    nativeAstId: nativeAst?.id,
    semanticIndexId: semanticIndex?.id,
    universalAstId: imported?.universalAst?.id,
    patchId: imported?.patch?.id,
    sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id).filter(Boolean),
    sourceMapMappings: sourceMaps.reduce((sum, sourceMap) => sum + (sourceMap.mappings?.length ?? 0), 0),
    symbolCount: semanticIndex?.symbols?.length ?? 0,
    lossCount: imported?.losses?.length ?? nativeAst?.losses?.length ?? 0,
    evidenceCount: imported?.evidence?.length ?? 0,
    readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness
  };
}

function summarizeImportContractReadiness(importResult, mergeCandidates, lossSummary) {
  const candidateReadiness = mergeCandidates.reduce(
    (current, candidate) => maxSemanticMergeReadiness(current, candidate.readiness),
    lossSummary.semanticMergeReadiness
  );
  const semanticMergeReadiness = maxSemanticMergeReadiness(
    importResult?.metadata?.semanticMergeReadiness ?? lossSummary.semanticMergeReadiness,
    candidateReadiness
  );
  return {
    semanticMergeReadiness,
    severityReadiness: lossSummary.semanticMergeReadiness,
    reasons: uniqueStrings([
      ...(lossSummary.readinessReasons ?? []),
      ...mergeCandidates.flatMap((candidate) => candidate?.reasons ?? []),
      ...normalizeStringList(importResult?.metadata?.readinessReasons)
    ]),
    failedEvidenceIds: lossSummary.failedEvidenceIds,
    blockingLossIds: lossSummary.blockingLossIds,
    reviewLossIds: lossSummary.reviewLossIds,
    informationalLossIds: lossSummary.informationalLossIds
  };
}

function defaultSemanticImportSidecarId(importResult, imports = []) {
  return `semantic_import_${idFragment(importResult?.id ?? importResult?.projectRoot ?? imports[0]?.sourcePath ?? imports[0]?.language ?? 'source')}`;
}

function countBy(values) {
  const counts = {};
  for (const value of values ?? []) {
    const key = String(value ?? 'unknown');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function maxSemanticMergeReadiness(left, right) {
  const leftRank = semanticMergeReadinessRank[left] ?? semanticMergeReadinessRank['needs-review'];
  const rightRank = semanticMergeReadinessRank[right] ?? semanticMergeReadinessRank['needs-review'];
  return leftRank >= rightRank ? left : right;
}

function normalizeSemanticMergeReadiness(value) {
  const readiness = String(value ?? '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(semanticMergeReadinessRank, readiness) ? readiness : undefined;
}

export function createUniversalAstFromDocument(document, input = {}) {
  return createUniversalAstEnvelope({
    id: input.id ?? `universal_ast_${idFragment(document.id)}`,
    document,
    nativeSources: input.nativeSources,
    semanticIndex: input.semanticIndex,
    sourceMaps: input.sourceMaps ?? [],
    losses: input.losses,
    evidence: input.evidence ?? [],
    mergeCandidates: input.mergeCandidates,
    layers: input.layers,
    metadata: input.metadata
  });
}

export function readUniversalAstJson(source) {
  const envelope = JSON.parse(source);
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST JSON: ${issues.join('; ')}`);
  }
  return envelope;
}

export function writeUniversalAstJson(envelope) {
  const issues = validateUniversalAstEnvelope(envelope);
  if (issues.length > 0) {
    throw new Error(`Invalid Frontier universal AST envelope: ${issues.join('; ')}`);
  }
  return stableUniversalAstJson(envelope);
}

export function emitForTarget(document, target = 'typescript', options = {}) {
  return renderTargetAst(projectFrontierAst(document, target, options), target);
}

export function emitForTargetWithSourceMap(document, target = 'typescript', options = {}) {
  const normalized = normalizeCompileTarget(target);
  const ast = projectFrontierAst(document, normalized, options);
  const result = renderTargetAstWithSourceMap(ast, normalized, {
    sourceMapId: options.sourceMapId ?? `sourcemap_${idFragment(document.id)}_${normalized}`,
    ...options
  });
  return { ...result, ast };
}

function createJavaScriptSyntaxImporterAdapter(options) {
  return {
    id: options.id,
    language: options.language,
    parser: options.parser,
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
        'Normalizes a caller-owned ESTree/Babel-compatible AST into native AST nodes and declaration-level semantic index records.',
        'The wrapper ignores parser token/trivia/comment arrays unless a host adapter explicitly maps them into preservation evidence.'
      ]
    }, options.coverage),
    supportedExtensions: options.supportedExtensions,
    diagnostics: options.diagnostics,
    parse(input) {
      const ast = input.options?.ast ?? input.options?.nativeAst ?? options.ast ?? parseJavaScriptSyntax(input, options);
      if (!ast) {
        return missingInjectedParserResult(input, {
          parser: options.parser,
          adapterId: options.id,
          message: `${options.id} requires an injected parse function, parserModule.parse, ast, or adapterOptions.ast.`
        });
      }
      const parseDiagnostics = normalizeParserErrors(ast.errors, input, options);
      return createNativeImportFromSyntaxAst(ast, input, {
        parser: options.parser,
        astFormat: options.astFormat,
        maxNodes: options.maxNodes,
        diagnostics: parseDiagnostics
      });
    }
  };
}

function parseJavaScriptSyntax(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.babelParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourceFilename: input.sourcePath,
    ...(options.defaultParserOptions ?? {}),
    ...(typeof options.parserOptions === 'function'
      ? options.parserOptions(input)
      : options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function createTypeScriptSourceFile(ts, input, options) {
  if (typeof options.createSourceFile === 'function') return options.createSourceFile(input, ts);
  if (!ts || typeof ts.createSourceFile !== 'function') return undefined;
  const scriptTarget = options.scriptTarget ?? ts.ScriptTarget?.Latest ?? ts.ScriptTarget?.ESNext ?? 99;
  const scriptKind = options.scriptKind ?? inferTypeScriptScriptKind(ts, input);
  return ts.createSourceFile(input.sourcePath ?? 'frontier-input.ts', input.sourceText, scriptTarget, true, scriptKind);
}

function inferTypeScriptScriptKind(ts, input) {
  const path = String(input.sourcePath ?? '').toLowerCase();
  if (path.endsWith('.tsx')) return ts.ScriptKind?.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind?.JSX;
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return ts.ScriptKind?.JS;
  return ts.ScriptKind?.TS;
}

function parseTreeSitterSource(input, options) {
  const parser = options.parserInstance ?? options.treeSitterParser ?? options.parser;
  if (parser && typeof parser.parse === 'function') return parser.parse(input.sourceText);
  if (typeof options.parse === 'function') return options.parse(input);
  return undefined;
}

function parsePythonAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.pythonAst?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    mode: options.mode ?? input.options?.mode ?? 'exec',
    typeComments: options.typeComments ?? input.options?.typeComments,
    featureVersion: options.featureVersion ?? input.options?.featureVersion,
    optimize: options.optimize ?? input.options?.optimize,
    includeAttributes: options.includeAttributes ?? input.options?.includeAttributes,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseRustSynSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.rustSyn?.parse ?? options.syn?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    edition: options.rustEdition ?? input.options?.rustEdition ?? '2021',
    includeAttributes: options.includeAttributes ?? input.options?.includeAttributes,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseClangAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.clang?.parse ?? options.libclang?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    language: options.language ?? input.language,
    standard: options.cStandard ?? input.options?.cStandard,
    compileFlags: options.compileFlags ?? input.options?.compileFlags,
    includeSystemHeaders: options.includeSystemHeaders ?? input.options?.includeSystemHeaders,
    astDumpFormat: 'json',
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseGoAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.goAst?.parse ?? options.goParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    mode: options.mode ?? input.options?.mode ?? 'ParseComments',
    goVersion: options.goVersion ?? input.options?.goVersion,
    packageName: options.packageName ?? input.options?.packageName,
    includeComments: options.includeComments ?? input.options?.includeComments,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseJavaAstSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.javac?.parse ?? options.jdt?.parse ?? options.javaParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    javaVersion: options.javaVersion ?? input.options?.javaVersion,
    sourceLevel: options.sourceLevel ?? input.options?.sourceLevel,
    classPath: options.classPath ?? input.options?.classPath,
    modulePath: options.modulePath ?? input.options?.modulePath,
    includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseKotlinPsiSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.kotlinPsi?.parse ?? options.kotlinCompiler?.parse ?? options.intellijPsi?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    kotlinVersion: options.kotlinVersion ?? input.options?.kotlinVersion,
    languageVersion: options.languageVersion ?? input.options?.languageVersion,
    apiVersion: options.apiVersion ?? input.options?.apiVersion,
    script: options.script ?? input.options?.script ?? /\.kts$/i.test(input.sourcePath ?? ''),
    includeAnnotations: options.includeAnnotations ?? input.options?.includeAnnotations,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseCSharpRoslynSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.roslyn?.parse ?? options.csharpRoslyn?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    languageVersion: options.languageVersion ?? input.options?.languageVersion,
    csharpVersion: options.csharpVersion ?? input.options?.csharpVersion,
    nullableContext: options.nullableContext ?? input.options?.nullableContext,
    kind: options.sourceCodeKind ?? input.options?.sourceCodeKind,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function parseSwiftSyntaxSource(input, options) {
  const parse = options.parse ?? options.parserModule?.parse ?? options.swiftSyntax?.parse ?? options.swiftParser?.parse;
  if (typeof parse !== 'function') return undefined;
  const parserOptions = {
    sourcePath: input.sourcePath,
    filename: input.sourcePath,
    swiftVersion: options.swiftVersion ?? input.options?.swiftVersion,
    languageMode: options.languageMode ?? input.options?.languageMode,
    enableBareSlashRegex: options.enableBareSlashRegex ?? input.options?.enableBareSlashRegex,
    parseTransition: options.parseTransition ?? input.options?.parseTransition,
    ...(options.parserOptions ?? {}),
    ...(input.options?.parserOptions ?? {})
  };
  return parse(input.sourceText, parserOptions);
}

function createNativeImportFromSyntaxAst(ast, input, options) {
  const root = normalizeSyntaxAstRoot(ast, options.astFormat);
  if (!root) {
    return missingInjectedParserResult(input, {
      parser: options.parser,
      adapterId: input.adapterId,
      message: 'Injected AST did not contain an object root node.'
    });
  }
  const context = createAstNormalizationContext(input, options);
  visitSyntaxAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromTypeScriptAst(sourceFile, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitTypeScriptAstNode(sourceFile, sourceFile, context, 'root', options.ts);
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: context.losses,
    evidence: semantic.evidence,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromPythonAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitPythonAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      pythonVersion: options.pythonVersion,
      includeAttributes: Boolean(options.includeAttributes),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromRustSyn(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitRustSynNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      rustEdition: options.rustEdition,
      includeAttributes: Boolean(options.includeAttributes),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromClangAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitClangAstNode(root, context, 'root');
  for (const [index, record] of clangPreprocessorRecords(options.preprocessorRecords).entries()) {
    visitClangAstNode(record, context, `preprocessorRecords[${index}]`);
  }
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      cStandard: options.cStandard,
      compileFlags: Array.isArray(options.compileFlags) ? options.compileFlags.slice() : options.compileFlags,
      includeSystemHeaders: Boolean(options.includeSystemHeaders),
      preprocessorRecordCount: clangPreprocessorRecords(options.preprocessorRecords).length,
      includeGraph: serializableIncludeGraphSummary(options.includeGraph),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromGoAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitGoAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      goVersion: options.goVersion,
      packageName: options.packageName,
      includeComments: Boolean(options.includeComments),
      buildTags: Array.isArray(options.buildTags) ? options.buildTags.slice() : options.buildTags,
      generated: options.generated,
      fileSetEvidence: Boolean(options.fileSet),
      typeEvidence: goTypeEvidenceSummary(options.typeEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromJavaAst(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitJavaAstNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(javaGeneratedCodeLoss(input, context.rootId, undefined, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      javaVersion: options.javaVersion,
      sourceLevel: options.sourceLevel,
      classPathEvidence: javaPathEvidenceSummary(options.classPath),
      modulePathEvidence: javaPathEvidenceSummary(options.modulePath),
      annotationProcessing: javaAnnotationProcessingSummary(options.annotationProcessing),
      bindingEvidence: javaBindingEvidenceSummary(options.bindingEvidence),
      generated: options.generated,
      includeAnnotations: Boolean(options.includeAnnotations),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromKotlinPsi(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitKotlinPsiNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(kotlinGeneratedCodeLoss(input, context.rootId, undefined, options));
  }
  if (options.script && !context.losses.some((loss) => loss.metadata?.script === true)) {
    context.losses.push(kotlinScriptLoss(input, context.rootId, undefined, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      kotlinVersion: options.kotlinVersion,
      languageVersion: options.languageVersion,
      apiVersion: options.apiVersion,
      script: Boolean(options.script),
      generated: options.generated,
      analysisApiEvidence: kotlinEvidenceSummary(options.analysisApiEvidence),
      firEvidence: kotlinEvidenceSummary(options.firEvidence),
      compilerPluginEvidence: kotlinEvidenceSummary(options.compilerPluginEvidence),
      kspEvidence: kotlinEvidenceSummary(options.kspEvidence),
      kaptEvidence: kotlinEvidenceSummary(options.kaptEvidence),
      multiplatformEvidence: kotlinEvidenceSummary(options.multiplatformEvidence),
      buildVariantEvidence: kotlinEvidenceSummary(options.buildVariantEvidence),
      includeAnnotations: Boolean(options.includeAnnotations),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromCSharpRoslyn(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitCSharpRoslynNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(csharpGeneratedCodeLoss(input, context.rootId, undefined, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      csharpVersion: options.csharpVersion,
      languageVersion: options.languageVersion,
      nullableContext: options.nullableContext,
      generated: options.generated,
      projectReferences: csharpEvidenceSummary(options.projectReferences),
      analyzerDiagnostics: csharpEvidenceSummary(options.analyzerDiagnostics),
      semanticModelEvidence: csharpEvidenceSummary(options.semanticModelEvidence),
      sourceGeneratorEvidence: csharpEvidenceSummary(options.sourceGeneratorEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromSwiftSyntax(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitSwiftSyntaxNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  if (options.generated && !context.losses.some((loss) => loss.kind === 'generatedCode')) {
    context.losses.push(swiftGeneratedCodeLoss(input, context.rootId, undefined, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: mergeNativeLosses(context.losses, options.diagnostics?.map((diagnostic, index) => adapterDiagnosticToLoss(diagnostic, index, {
      id: input.adapterId,
      version: input.adapterVersion
    }, input)) ?? []),
    evidence: semantic.evidence,
    diagnostics: options.diagnostics,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      swiftVersion: options.swiftVersion,
      languageMode: options.languageMode,
      generated: options.generated,
      sourceKitEvidence: swiftEvidenceSummary(options.sourceKitEvidence),
      macroExpansionEvidence: swiftEvidenceSummary(options.macroExpansionEvidence),
      packageResolutionEvidence: swiftEvidenceSummary(options.packageResolutionEvidence),
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createNativeImportFromTreeSitter(root, input, options) {
  const context = createAstNormalizationContext(input, options);
  visitTreeSitterNode(root, context, 'root');
  if (context.truncated) {
    context.losses.push(truncatedAstLoss(input, context, options));
  }
  const semantic = semanticIndexFromNativeDeclarations(context.declarations, input, options);
  return {
    rootId: context.rootId,
    nodes: context.nodes,
    semanticIndex: semantic.semanticIndex,
    mappings: semantic.mappings,
    losses: context.losses,
    evidence: semantic.evidence,
    metadata: {
      astFormat: options.astFormat,
      parser: options.parser,
      normalizedNodeCount: Object.keys(context.nodes).length,
      declarationCount: context.declarations.length,
      truncated: context.truncated
    }
  };
}

function createAstNormalizationContext(input, options) {
  return {
    input,
    options,
    maxNodes: Number.isFinite(options.maxNodes) ? Math.max(1, options.maxNodes) : 5000,
    counter: 0,
    objectIds: new WeakMap(),
    nodes: {},
    declarations: [],
    losses: [],
    rootId: undefined,
    truncated: false
  };
}

function normalizeSyntaxAstRoot(ast, astFormat) {
  if (!ast || typeof ast !== 'object') return undefined;
  if (astFormat === 'babel' && ast.program && typeof ast.program === 'object') return ast.program;
  return ast;
}

function visitSyntaxAstNode(node, context, propertyPath) {
  if (!isSyntaxAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const id = nativeNodeId(context, node.type ?? node.kind ?? 'Node', node.loc, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const fields = primitiveSyntaxFields(node);
  for (const [key, value] of Object.entries(node)) {
    if (ignoredSyntaxField(key)) continue;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitSyntaxAstNode(entry, context, `${propertyPath}.${key}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitSyntaxAstNode(value, context, `${propertyPath}.${key}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = syntaxDeclaration(node, id, context.input, context.options);
  const nativeNode = {
    id,
    kind: String(node.type ?? node.kind ?? 'Node'),
    languageKind: `${context.input.language}.${node.type ?? node.kind ?? 'Node'}`,
    span: spanFromLoc(node.loc, context.input),
    value: declaration?.name ?? literalSyntaxValue(node),
    fields,
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      start: numberOrUndefined(node.start),
      end: numberOrUndefined(node.end),
      range: Array.isArray(node.range) ? node.range.slice(0, 2) : undefined
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  return id;
}

function visitTypeScriptAstNode(node, sourceFile, context, propertyPath, ts) {
  if (!node || typeof node !== 'object' || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = typeScriptKindName(node, ts);
  const span = spanFromTypeScriptNode(node, sourceFile);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const visitChild = (child) => {
    const childId = visitTypeScriptAstNode(child, sourceFile, context, `${propertyPath}.${children.length}`, ts);
    if (childId) children.push(childId);
  };
  if (ts && typeof ts.forEachChild === 'function') {
    ts.forEachChild(node, visitChild);
  } else if (typeof node.forEachChild === 'function') {
    node.forEachChild(visitChild);
  } else if (Array.isArray(node.children)) {
    node.children.forEach(visitChild);
  }
  const declaration = typeScriptDeclaration(node, kind, id, context.input, context.options);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? typeScriptNodeValue(node),
    fields: primitiveTypeScriptFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      pos: numberOrUndefined(node.pos),
      end: numberOrUndefined(node.end)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  return id;
}

function visitPythonAstNode(node, context, propertyPath) {
  if (!isPythonAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = pythonAstKind(node);
  const span = spanFromPythonAstNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of pythonAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitPythonAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitPythonAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = pythonAstDeclaration(node, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? pythonAstNodeValue(node),
    fields: primitivePythonAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      lineno: numberOrUndefined(node.lineno ?? node.line),
      colOffset: numberOrUndefined(node.col_offset ?? node.colOffset),
      endLineno: numberOrUndefined(node.end_lineno ?? node.endLine),
      endColOffset: numberOrUndefined(node.end_col_offset ?? node.endColOffset)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  return id;
}

function visitRustSynNode(node, context, propertyPath) {
  if (!isRustSynAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = rustSynKind(node);
  const payload = rustSynPayload(node);
  const span = spanFromRustSynNode(payload, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of rustSynChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitRustSynNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitRustSynNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = rustSynDeclaration(payload, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? rustSynNodeValue(payload),
    fields: primitiveRustSynFields(payload, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      spanKind: rustSynSpanKind(payload)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (rustSynMacroKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_rust_macro_expansion`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'macroExpansion',
      message: 'Rust macro syntax was parsed but macro expansion and generated items require host compiler evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat
      }
    });
  }
  return id;
}

function visitClangAstNode(node, context, propertyPath) {
  if (!isClangAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = clangAstKind(node);
  const span = spanFromClangAstNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of clangAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitClangAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitClangAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declaration = clangAstDeclaration(node, kind, id, context.input);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? clangAstNodeValue(node),
    fields: primitiveClangAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      clangId: typeof node.id === 'string' || typeof node.id === 'number' ? String(node.id) : undefined,
      locationKind: clangLocationKind(node)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (clangPreprocessorKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_clang_preprocessor`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'preprocessor',
      message: 'Clang AST preprocessor records were imported, but macro expansion, inactive branches, and compile-command provenance require host evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat
      }
    });
  }
  return id;
}

function visitGoAstNode(node, context, propertyPath) {
  if (!isGoAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = goAstKind(node);
  const span = spanFromGoAstNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of goAstChildEntries(node)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitGoAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitGoAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = goAstDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? goAstNodeValue(node),
    fields: primitiveGoAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: goAstPositionKind(node),
      packageName: context.options.packageName
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (goBadAstKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_bad_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Go parser recovered a BadDecl/BadExpr/BadStmt node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (kind === 'FuncDecl' && goReceiverFieldCount(node) > 1) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_multiple_receivers`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Go parser accepted multiple receiver fields; valid method ownership requires a single receiver.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        receiverFieldCount: goReceiverFieldCount(node)
      }
    });
  }
  if (goGeneratedCodeMarker(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_go_generated_code`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'generatedCode',
      message: 'Go generated-code marker was imported; regeneration provenance and source ownership require host evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat
      }
    });
  }
  return id;
}

function visitJavaAstNode(node, context, propertyPath) {
  if (!isJavaAstNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = javaAstKind(node);
  const span = spanFromJavaAstNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of javaAstChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitJavaAstNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitJavaAstNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = javaAstDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? javaAstNodeValue(node),
    fields: primitiveJavaAstFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: javaAstPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (javaRecoveredAstKind(kind) || javaProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_java_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Java parser reported a recovered, erroneous, malformed, or problem node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (javaGeneratedCodeMarker(node, kind) || javaLombokAnnotationMarker(node, kind)) {
    context.losses.push(javaGeneratedCodeLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      generatedMarker: javaGeneratedCodeMarker(node, kind),
      lombokMarker: javaLombokAnnotationMarker(node, kind)
    }));
  }
  return id;
}

function visitCSharpRoslynNode(node, context, propertyPath) {
  if (!isCSharpRoslynNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = csharpRoslynKind(node);
  const span = spanFromCSharpRoslynNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of csharpRoslynChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitCSharpRoslynNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitCSharpRoslynNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = csharpRoslynDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? csharpRoslynNodeValue(node),
    fields: primitiveCSharpRoslynFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      rawKind: numberOrUndefined(node.rawKind ?? node.RawKind),
      positionKind: csharpRoslynPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (csharpRoslynRecoveredKind(kind) || csharpRoslynProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_csharp_roslyn_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Roslyn reported skipped text, missing syntax, or syntax diagnostics; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (csharpRoslynDirectiveKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_csharp_preprocessor`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'preprocessor',
      message: 'C# preprocessor directive was imported as syntax; conditional compilation state and inactive branches require host evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (csharpGeneratedCodeMarker(node, kind)) {
    context.losses.push(csharpGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}

function visitSwiftSyntaxNode(node, context, propertyPath) {
  if (!isSwiftSyntaxNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = swiftSyntaxKind(node);
  const span = spanFromSwiftSyntaxNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of swiftSyntaxChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitSwiftSyntaxNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitSwiftSyntaxNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = swiftSyntaxDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? swiftSyntaxNodeValue(node),
    fields: primitiveSwiftSyntaxFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: swiftSyntaxPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (swiftSyntaxRecoveredKind(kind) || swiftSyntaxProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_syntax_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'SwiftSyntax reported missing, unexpected, skipped, or error syntax; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftSyntaxConditionalCompilationKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_conditional_compilation`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'conditionalCompilation',
      message: 'Swift conditional compilation syntax was imported; active branch selection and inactive branch source ownership require host build-setting evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftSyntaxMacroKind(kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_swift_macro_expansion`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'macroExpansion',
      message: 'Swift macro syntax was imported, but expansion, generated declarations, and binding effects require host macro-expansion evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (swiftGeneratedCodeMarker(node, kind)) {
    context.losses.push(swiftGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}

function visitTreeSitterNode(node, context, propertyPath) {
  if (!node || typeof node !== 'object' || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = String(node.type ?? node.kind ?? 'node');
  const span = spanFromTreeSitterNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const rawChildren = Array.isArray(node.namedChildren)
    ? node.namedChildren
    : Array.isArray(node.children)
      ? node.children
      : [];
  rawChildren.forEach((child, index) => {
    const childId = visitTreeSitterNode(child, context, `${propertyPath}.children[${index}]`);
    if (childId) children.push(childId);
  });
  const declaration = treeSitterDeclaration(node, kind, id, context.input, context.options);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? shortNodeText(node),
    fields: {
      named: Boolean(node.isNamed ?? node.named),
      missing: Boolean(node.isMissing),
      error: Boolean(node.hasError || kind === 'ERROR')
    },
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      startIndex: numberOrUndefined(node.startIndex),
      endIndex: numberOrUndefined(node.endIndex)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (node.hasError || kind === 'ERROR') {
    context.losses.push({
      id: `loss_${idFragment(id)}_tree_sitter_error`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Tree-sitter reported a parse error node.',
      span,
      nodeId: id
    });
  }
  return id;
}

function semanticIndexFromNativeDeclarations(declarations, input, options) {
  const documentId = `doc_${idFragment(input.sourcePath ?? input.language)}_${idFragment(input.sourceHash)}`;
  const evidenceId = `evidence_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_import`;
  const symbols = [];
  const occurrences = [];
  const relations = [];
  const facts = [];
  const mappings = [];
  for (const declaration of declarations) {
    const symbolId = declaration.symbolId ?? `symbol:${input.language}:${declaration.role === 'import' ? 'import:' : ''}${idFragment(declaration.name)}`;
    const occurrenceId = `occ_${idFragment(declaration.nativeNode.id)}_${declaration.role ?? 'definition'}`;
    const ownershipRegion = semanticOwnershipRegionForDeclaration(input, {
      ...declaration,
      nodeId: declaration.nativeNode.id,
      kind: declaration.nativeNode.kind,
      languageKind: declaration.nativeNode.languageKind,
      span: declaration.nativeNode.span,
      symbolId
    }, documentId);
    declaration.nativeNode.metadata = {
      ...declaration.nativeNode.metadata,
      ownershipRegionId: ownershipRegion.id,
      ownershipRegionKey: ownershipRegion.key,
      ownershipRegionKind: ownershipRegion.regionKind
    };
    symbols.push({
      id: symbolId,
      scheme: 'frontier',
      name: declaration.name,
      kind: declaration.symbolKind,
      language: input.language,
      nativeAstNodeId: declaration.nativeNode.id,
      signatureHash: hashSemanticValue([input.language, declaration.nativeNode.kind, declaration.name, declaration.nativeNode.fields ?? {}]),
      definitionSpan: declaration.nativeNode.span,
      metadata: {
        ownershipRegionId: ownershipRegion.id,
        ownershipRegionKey: ownershipRegion.key,
        ownershipRegionKind: ownershipRegion.regionKind
      }
    });
    occurrences.push({
      id: occurrenceId,
      documentId,
      symbolId,
      role: declaration.role ?? 'definition',
      span: declaration.nativeNode.span,
      nativeAstNodeId: declaration.nativeNode.id
    });
    relations.push({
      id: `rel_${idFragment(documentId)}_${idFragment(declaration.nativeNode.id)}`,
      sourceId: documentId,
      predicate: relationPredicateForDeclaration(declaration),
      targetId: symbolId
    });
    facts.push({
      id: `fact_${idFragment(declaration.nativeNode.id)}_kind`,
      predicate: 'nativeKind',
      subjectId: symbolId,
      value: declaration.nativeNode.languageKind
    }, {
      id: `fact_${idFragment(declaration.nativeNode.id)}_ownership_region`,
      predicate: 'semanticOwnershipRegion',
      subjectId: symbolId,
      value: ownershipRegion
    }, {
      id: `fact_${idFragment(declaration.nativeNode.id)}_ownership_region_taxonomy`,
      predicate: 'semanticOwnershipRegionTaxonomy',
      subjectId: symbolId,
      value: {
        regionKind: ownershipRegion.regionKind,
        granularity: ownershipRegion.granularity,
        key: ownershipRegion.key
      }
    });
    mappings.push({
      id: `map_${idFragment(declaration.nativeNode.id)}`,
      nativeAstNodeId: declaration.nativeNode.id,
      semanticSymbolId: symbolId,
      semanticOccurrenceId: occurrenceId,
      sourceSpan: declaration.nativeNode.span,
      evidenceIds: [evidenceId],
      lossIds: [],
      ownershipRegionId: ownershipRegion.id,
      ownershipRegionKey: ownershipRegion.key,
      ownershipRegionKind: ownershipRegion.regionKind,
      precision: declaration.nativeNode.span ? 'declaration' : 'unknown'
    });
  }
  const evidence = [{
    id: evidenceId,
    kind: 'import',
    status: 'passed',
    path: input.sourcePath,
    summary: `Normalized ${options.astFormat ?? options.parser} native AST with ${declarations.length} declaration(s).`,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      language: input.language,
      sourceHash: input.sourceHash
    }
  }];
  return {
    semanticIndex: createSemanticIndexRecord({
      id: `index_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}`,
      documents: [{
        id: documentId,
        path: input.sourcePath ?? `${input.language}:memory`,
        language: input.language,
        sourceHash: input.sourceHash
      }],
      symbols,
      occurrences,
      relations,
      facts,
      evidence,
      metadata: {
        parser: options.parser,
        astFormat: options.astFormat,
        coverage: 'native-ast-declarations'
      }
    }),
    mappings,
    evidence
  };
}

function createNativeProjectImportResult(input, imports) {
  const idPart = idFragment(input.id ?? input.projectRoot ?? 'native_project');
  const nodes = {};
  const rootIds = [];
  const semanticIndex = mergeSemanticIndexes(imports, input, idPart);
  const nativeSources = [];
  const sourceMaps = [];
  const losses = [];
  const evidence = [];
  const mergeCandidates = [];
  const operations = [];
  for (const result of imports) {
    for (const node of Object.values(result.document?.nodes ?? {})) {
      nodes[node.id] = node;
    }
    rootIds.push(...(result.document?.rootIds ?? []));
    if (result.nativeSource) nativeSources.push(result.nativeSource);
    sourceMaps.push(...(result.sourceMaps ?? []));
    losses.push(...(result.losses ?? []));
    evidence.push(...(result.evidence ?? []));
    mergeCandidates.push(...(result.mergeCandidates ?? []));
    operations.push(...(result.patch?.operations ?? []));
  }
  const uniqueLosses = uniqueByLossId(losses);
  const uniqueEvidence = uniqueByEvidenceId(evidence);
  const nativeImportLossSummary = summarizeNativeImportLosses(uniqueLosses, {
    evidence: uniqueEvidence,
    scanKind: 'native-project-import',
    semanticStatus: uniqueLosses.some((loss) => loss.severity === 'error') ? 'partial' : 'mapped'
  });
  const sourcePreservationSummary = summarizeProjectSourcePreservation(imports);
  const document = createDocument({
    id: input.documentId ?? `document_${idPart}`,
    name: input.documentName ?? input.name ?? 'NativeProject',
    nodes: Object.values(nodes),
    rootIds: uniqueStrings(rootIds),
    metadata: {
      sourceLanguage: input.language ?? 'mixed',
      semanticStatus: losses.some((loss) => loss.severity === 'error') ? 'partial' : 'mapped',
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary,
      ...input.documentMetadata
    }
  });
  const universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${idPart}`,
    document,
    nativeSources,
    semanticIndex,
    sourceMaps,
    losses: uniqueLosses,
    evidence: uniqueEvidence,
    metadata: {
      sourceLanguage: input.language ?? 'mixed',
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary,
      ...input.universalAstMetadata
    }
  });
  const patch = createPatch({
    id: input.patchId ?? `patch_${idPart}_project_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeProject',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.some((loss) => loss.severity === 'warning') ? 'medium' : 'low',
    operations,
    evidence: uniqueEvidence,
    metadata: {
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      sourceCount: imports.length,
      nativeImportLossSummary,
      sourcePreservationSummary
    }
  });
  const projectResult = {
    kind: 'frontier.lang.projectImportResult',
    version: 1,
    id: input.id ?? `project_import_${idPart}`,
    language: input.language ?? 'mixed',
    projectRoot: input.projectRoot,
    imports,
    document,
    patch,
    nativeSources,
    semanticIndex,
    universalAst,
    sourceMaps,
    losses: uniqueLosses,
    evidence: uniqueEvidence,
    mergeCandidates,
    metadata: {
      sourceCount: imports.length,
      sourcePaths: imports.map((result) => result.sourcePath).filter(Boolean),
      nativeImportLossSummary,
      sourcePreservationSummary,
      ...input.metadata
    }
  };
  const importResultContract = createNativeImportResultContract(projectResult, {
    lossSummary: nativeImportLossSummary
  });
  return {
    ...projectResult,
    metadata: {
      ...projectResult.metadata,
      importResultContract,
      semanticMergeReadiness: importResultContract.readiness.semanticMergeReadiness,
      readinessReasons: importResultContract.readiness.reasons,
      regionSummary: importResultContract.regions,
      sourceMapSummary: importResultContract.sourceMaps,
      adapterCoverageSummary: importResultContract.adapterCoverage
    }
  };
}

function summarizeProjectSourcePreservation(imports) {
  const records = imports
    .map((result) => result.metadata?.sourcePreservation ?? result.nativeSource?.metadata?.sourcePreservation ?? result.nativeAst?.metadata?.sourcePreservation)
    .filter(Boolean);
  return {
    total: records.length,
    exactSourceAvailable: records.filter((record) => record.summary?.exactSourceAvailable).length,
    sourceBytes: records.reduce((sum, record) => sum + (record.sourceBytes ?? 0), 0),
    tokens: records.reduce((sum, record) => sum + (record.summary?.tokens ?? record.tokens?.length ?? 0), 0),
    trivia: records.reduce((sum, record) => sum + (record.summary?.trivia ?? record.trivia?.length ?? 0), 0),
    directives: records.reduce((sum, record) => sum + (record.summary?.directives ?? record.directives?.length ?? 0), 0),
    truncated: records.some((record) => record.summary?.truncated === true),
    ids: records.map((record) => record.id).filter(Boolean)
  };
}

function mergeSemanticIndexes(imports, input, idPart) {
  const indexes = imports.map((result) => result.semanticIndex ?? result.universalAst?.semanticIndex).filter(Boolean);
  if (!indexes.length) return undefined;
  return createSemanticIndexRecord({
    id: input.semanticIndexId ?? `index_${idPart}_project`,
    documents: indexes.flatMap((index) => index.documents ?? []),
    symbols: indexes.flatMap((index) => index.symbols ?? []),
    occurrences: indexes.flatMap((index) => index.occurrences ?? []),
    relations: indexes.flatMap((index) => index.relations ?? []),
    facts: indexes.flatMap((index) => index.facts ?? []),
    evidence: indexes.flatMap((index) => index.evidence ?? []),
    metadata: {
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      mergedIndexCount: indexes.length
    }
  });
}

function resolveNativeProjectAdapter(source, adapters, input) {
  if (typeof input.adapterResolver === 'function') return input.adapterResolver(source, adapters);
  const language = source.language;
  const sourcePath = source.sourcePath ?? '';
  return adapters.find((adapter) => {
    if (source.adapter && adapter.id === source.adapter) return true;
    if (language && adapter.language !== language) return false;
    const extensions = adapter.supportedExtensions ?? [];
    return !extensions.length || extensions.some((extension) => sourcePath.toLowerCase().endsWith(extension.toLowerCase()));
  });
}

function resolveNativeTargetProjectionAdapter(input, options = {}) {
  const adapters = options.targetAdapters ?? [];
  if (options.targetAdapter && typeof options.targetAdapter === 'object') return options.targetAdapter;
  if (typeof options.targetAdapter === 'string') {
    const explicit = adapters.find((adapter) => adapter?.id === options.targetAdapter);
    if (explicit) return explicit;
  }
  if (typeof options.targetAdapterResolver === 'function') {
    const resolved = options.targetAdapterResolver(input, adapters);
    if (resolved) return resolved;
  }
  return matchingNativeTargetProjectionAdapter(input, adapters);
}

function matchingNativeTargetProjectionAdapter(input, adapters = []) {
  return adapters.find((adapter) => nativeTargetProjectionAdapterMatches(adapter, input));
}

function nativeTargetProjectionAdapterMatches(adapter, input = {}) {
  const summary = safeNativeTargetProjectionAdapterSummary(adapter);
  if (!summary) return false;
  if (input.sourceLanguage && normalizeNativeLanguageId(input.sourceLanguage) !== summary.sourceLanguage) return false;
  const target = normalizeProjectionMatrixTargets([input.target])[0] ?? String(input.target ?? '').toLowerCase();
  if (target && target !== summary.target) return false;
  const parser = input.parser ? String(input.parser).toLowerCase() : undefined;
  if (parser && summary.supportedParsers.length && !summary.supportedParsers.map((item) => item.toLowerCase()).includes(parser)) return false;
  const sourcePath = String(input.sourcePath ?? '').toLowerCase();
  if (sourcePath && summary.supportedExtensions.length) {
    return summary.supportedExtensions.some((extension) => sourcePath.endsWith(extension));
  }
  return true;
}

function safeNativeTargetProjectionAdapterSummary(adapter) {
  try {
    return normalizeNativeTargetProjectionAdapter(adapter);
  } catch {
    return undefined;
  }
}

function normalizeNativeTargetProjectionAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Native target projection adapter must be an object');
  }
  if (!adapter.id) throw new Error('Native target projection adapter requires an id');
  const sourceLanguage = normalizeNativeLanguageId(adapter.sourceLanguage ?? adapter.language);
  if (!sourceLanguage) throw new Error(`Native target projection adapter ${adapter.id} requires a sourceLanguage`);
  const target = normalizeProjectionMatrixTargets([adapter.target ?? adapter.targetLanguage])[0];
  if (!target) throw new Error(`Native target projection adapter ${adapter.id} requires a target`);
  if (typeof adapter.project !== 'function') throw new Error(`Native target projection adapter ${adapter.id} requires a project function`);
  const capabilities = normalizeStringList(adapter.capabilities);
  const summaryInput = {
    id: String(adapter.id),
    sourceLanguage,
    language: sourceLanguage,
    target,
    parser: `target:${target}`,
    version: adapter.version === undefined ? undefined : String(adapter.version)
  };
  return Object.freeze({
    id: summaryInput.id,
    sourceLanguage,
    target,
    version: summaryInput.version,
    capabilities,
    supportedParsers: normalizeStringList(adapter.supportedParsers),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    coverage: normalizeNativeTargetProjectionAdapterCoverage(adapter.coverage, { capabilities }),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: sourceLanguage,
      parser: summaryInput.parser,
      parserVersion: summaryInput.version
    }, 'target-adapter')
  });
}

function normalizeNativeTargetProjectionAdapterCoverage(value = {}, context = {}) {
  const capabilities = new Set(normalizeStringList(context.capabilities).map((capability) => capability.toLowerCase()));
  const lossKinds = uniqueStrings(value.lossKinds ?? []);
  const handledLossKinds = uniqueStrings([
    ...(value.handledLossKinds ?? []),
    ...(capabilities.has('macros') || capabilities.has('macroexpansion') ? ['macroExpansion', 'macroHygiene'] : []),
    ...(capabilities.has('preprocessor') ? ['preprocessor', 'conditionalCompilation'] : []),
    ...(capabilities.has('dynamicruntime') ? ['dynamicRuntime', 'dynamicDispatch'] : []),
    ...(capabilities.has('typeinference') ? ['typeInference', 'overloadResolution'] : [])
  ]);
  return Object.freeze({
    readiness: normalizeSemanticMergeReadiness(value.readiness) ?? 'needs-review',
    lossKinds,
    handledLossKinds,
    sourceMapPrecision: value.sourceMapPrecision,
    semanticCoverage: value.semanticCoverage ?? {},
    notes: uniqueStrings(value.notes ?? ['Target projection adapter output is host-owned evidence and should be reviewed unless declared ready.'])
  });
}

function nativeTargetProjectionAdapterEvidence(adapter, diagnostics, input) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return {
    id: `evidence_${idFragment(adapter.id)}_native_target_projection_adapter`,
    kind: 'projection',
    status: errors ? 'failed' : 'passed',
    path: input.sourcePath,
    summary: `Ran ${adapter.id} native target projection adapter from ${input.sourceLanguage} to ${input.target} with ${diagnostics.length} diagnostic(s).`,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      targetPath: input.targetPath,
      outputHash: input.outputHash,
      capabilities: adapter.capabilities,
      coverage: adapter.coverage,
      diagnostics: diagnostics.map(serializableDiagnostic),
      errors,
      warnings
    }
  };
}

function nativeTargetProjectionDiagnosticToLoss(diagnostic, index, adapter, input) {
  return {
    id: `loss_${idFragment(diagnostic.id ?? `${adapter.id}_${index}_${diagnostic.code ?? diagnostic.severity}`)}`,
    severity: diagnostic.severity,
    phase: diagnostic.phase ?? 'emit',
    sourceFormat: input.sourceLanguage,
    kind: diagnostic.kind ?? 'targetProjectionLoss',
    message: diagnostic.message,
    span: diagnostic.span,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      diagnosticId: diagnostic.id,
      diagnosticCode: diagnostic.code,
      sourceLanguage: input.sourceLanguage,
      target: input.target,
      path: diagnostic.path,
      ...diagnostic.metadata
    }
  };
}

function safeNativeImporterAdapterSummary(adapter) {
  try {
    return normalizeNativeImporterAdapter(adapter);
  } catch {
    return undefined;
  }
}

function normalizeNativeImporterAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('Native importer adapter must be an object');
  }
  if (!adapter.id) throw new Error('Native importer adapter requires an id');
  if (!adapter.language) throw new Error(`Native importer adapter ${adapter.id} requires a language`);
  if (!adapter.parser) throw new Error(`Native importer adapter ${adapter.id} requires a parser`);
  if (typeof adapter.parse !== 'function') throw new Error(`Native importer adapter ${adapter.id} requires a parse function`);
  const summaryInput = {
    id: String(adapter.id),
    language: adapter.language,
    parser: String(adapter.parser),
    version: adapter.version === undefined ? undefined : String(adapter.version)
  };
  const capabilities = normalizeStringList(adapter.capabilities);
  return Object.freeze({
    ...summaryInput,
    capabilities,
    coverage: normalizeNativeImporterAdapterCoverage(adapter.coverage, {
      capabilities,
      language: adapter.language,
      parser: String(adapter.parser)
    }),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: adapter.language,
      parser: String(adapter.parser),
      parserVersion: adapter.version === undefined ? undefined : String(adapter.version)
    }, 'adapter')
  });
}

function nativeImporterAdapterCoverage(defaults = {}, overrides = {}) {
  return {
    ...defaults,
    ...overrides,
    semanticCoverage: {
      ...(defaults.semanticCoverage ?? {}),
      ...(overrides.semanticCoverage ?? {})
    },
    notes: uniqueStrings([...(defaults.notes ?? []), ...(overrides.notes ?? [])])
  };
}

function normalizeNativeImporterAdapterCoverage(value = {}, context = {}) {
  const capabilities = new Set(normalizeStringList(context.capabilities).map((capability) => capability.toLowerCase()));
  const hasCapability = (...names) => names.some((name) => capabilities.has(String(name).toLowerCase()));
  const exactAst = Boolean(value.exactAst ?? hasCapability('exactAst', 'exactAstImport'));
  const sourceRanges = Boolean(value.sourceRanges ?? hasCapability('sourceRanges', 'sourceRange', 'ranges', 'sourceMaps'));
  const generatedRanges = Boolean(value.generatedRanges ?? hasCapability('generatedRanges', 'generatedRange', 'generatedSourceMaps'));
  const diagnostics = Boolean(value.diagnostics ?? hasCapability('diagnostics', 'parserDiagnostics'));
  const declared = freezeNativeImporterAdapterCoverageSnapshot({
    exactness: String(value.exactness ?? inferredAdapterExactness(exactAst, capabilities)),
    exactAst,
    tokens: Boolean(value.tokens ?? hasCapability('tokens', 'tokenStream')),
    trivia: Boolean(value.trivia ?? hasCapability('trivia', 'comments', 'formatting')),
    diagnostics,
    sourceRanges,
    generatedRanges,
    semanticCoverage: normalizeNativeImporterSemanticCoverage(value.semanticCoverage, {
      capabilities,
      sourceRanges,
      generatedRanges
    })
  });
  const observed = normalizeNativeImporterAdapterObservedCoverage(value.observed, declared);
  const effective = effectiveNativeImporterAdapterCoverage(declared, observed);
  return Object.freeze({
    ...effective,
    declared,
    observed,
    notes: uniqueStrings(value.notes ?? inferredAdapterCoverageNotes(context, {
      exactAst,
      sourceRanges,
      generatedRanges,
      diagnostics
    })),
    capabilityEvidence: nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  });
}

function observeNativeImporterAdapterCoverage(coverage, parseResult = {}, context = {}) {
  const nodes = parseResult.nativeAst?.nodes ?? parseResult.nodes ?? {};
  const nodeList = Object.values(nodes);
  const sourceMapMappings = parseResult.sourceMaps?.flatMap((sourceMap) => sourceMap.mappings ?? []) ?? parseResult.mappings ?? [];
  const semanticIndex = parseResult.semanticIndex;
  const semanticSymbols = semanticIndex?.symbols?.length ?? 0;
  const declared = coverage.declared ?? adapterCoverageSnapshotFromSummary(coverage);
  const observed = observeNativeImporterAdapterCoverageDetails(parseResult, context, {
    declared,
    nodeList,
    sourceMapMappings,
    semanticIndex,
    semanticSymbols
  });
  const effective = effectiveNativeImporterAdapterCoverage(declared, observed);
  return Object.freeze({
    ...coverage,
    ...effective,
    declared,
    observed,
    capabilityEvidence: nativeImporterAdapterCapabilityEvidence(declared, observed, effective)
  });
}

function adapterCoverageSnapshotFromSummary(coverage = {}) {
  return freezeNativeImporterAdapterCoverageSnapshot({
    exactness: coverage.exactness ?? 'unknown',
    exactAst: coverage.exactAst,
    tokens: coverage.tokens,
    trivia: coverage.trivia,
    diagnostics: coverage.diagnostics,
    sourceRanges: coverage.sourceRanges,
    generatedRanges: coverage.generatedRanges,
    semanticCoverage: coverage.semanticCoverage
  });
}

function freezeNativeImporterAdapterCoverageSnapshot(value = {}) {
  return Object.freeze({
    exactness: String(value.exactness ?? 'unknown'),
    exactAst: Boolean(value.exactAst),
    tokens: Boolean(value.tokens),
    trivia: Boolean(value.trivia),
    diagnostics: Boolean(value.diagnostics),
    sourceRanges: Boolean(value.sourceRanges),
    generatedRanges: Boolean(value.generatedRanges),
    semanticCoverage: normalizeNativeImporterSemanticCoverage(value.semanticCoverage, {})
  });
}

function normalizeNativeImporterAdapterObservedCoverage(value = {}, declared = {}) {
  const diagnostics = Number(value.diagnostics ?? value.parserDiagnostics ?? 0) || 0;
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    ...(value.semanticCoverage ?? {}),
    declarations: value.semanticCoverage?.declarations ?? value.declarations,
    symbols: value.semanticCoverage?.symbols ?? value.symbols,
    references: value.semanticCoverage?.references ?? value.references,
    types: value.semanticCoverage?.types ?? value.types,
    controlFlow: value.semanticCoverage?.controlFlow ?? value.controlFlow
  }, {});
  const nativeAstNodes = Number(value.nativeAstNodes ?? 0) || 0;
  const exactness = String(value.exactness ?? observedAdapterExactness(declared, nativeAstNodes));
  return Object.freeze({
    exactness,
    exactAst: Boolean(value.exactAst ?? (declared.exactAst && nativeAstNodes > 0)),
    tokens: Boolean(value.tokens),
    tokenCount: Number(value.tokenCount ?? 0) || 0,
    trivia: Boolean(value.trivia),
    triviaCount: Number(value.triviaCount ?? 0) || 0,
    diagnostics,
    parserDiagnostics: diagnostics,
    diagnosticErrors: Number(value.diagnosticErrors ?? 0) || 0,
    diagnosticWarnings: Number(value.diagnosticWarnings ?? 0) || 0,
    diagnosticInfos: Number(value.diagnosticInfos ?? 0) || 0,
    losses: Number(value.losses ?? 0) || 0,
    nativeAstNodes,
    semanticSymbols: Number(value.semanticSymbols ?? 0) || 0,
    semanticReferences: Number(value.semanticReferences ?? 0) || 0,
    semanticTypes: Number(value.semanticTypes ?? 0) || 0,
    semanticControlFlow: Number(value.semanticControlFlow ?? 0) || 0,
    references: Boolean(value.references ?? semanticCoverage.references),
    types: Boolean(value.types ?? semanticCoverage.types),
    controlFlow: Boolean(value.controlFlow ?? semanticCoverage.controlFlow),
    sourceMapMappings: Number(value.sourceMapMappings ?? 0) || 0,
    sourceRanges: Boolean(value.sourceRanges),
    sourceRangeNodes: Number(value.sourceRangeNodes ?? 0) || 0,
    sourceRangeMappings: Number(value.sourceRangeMappings ?? 0) || 0,
    generatedRanges: Boolean(value.generatedRanges),
    generatedRangeMappings: Number(value.generatedRangeMappings ?? 0) || 0,
    semanticCoverage
  });
}

function observeNativeImporterAdapterCoverageDetails(parseResult = {}, context = {}, observedContext = {}) {
  const declared = observedContext.declared ?? {};
  const nodeList = observedContext.nodeList ?? Object.values(parseResult.nativeAst?.nodes ?? parseResult.nodes ?? {});
  const sourceMapMappings = observedContext.sourceMapMappings
    ?? parseResult.sourceMaps?.flatMap((sourceMap) => sourceMap.mappings ?? [])
    ?? parseResult.mappings
    ?? [];
  const semanticIndex = observedContext.semanticIndex ?? parseResult.semanticIndex;
  const semanticSymbols = observedContext.semanticSymbols ?? semanticIndex?.symbols?.length ?? 0;
  const diagnostics = context.diagnostics ?? [];
  const diagnosticErrors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const diagnosticWarnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  const diagnosticInfos = diagnostics.filter((diagnostic) => diagnostic.severity === 'info').length;
  const sourceRangeNodes = nodeList.filter((node) => Boolean(node?.span)).length;
  const sourceRangeMappings = sourceMapMappings.filter((mapping) => Boolean(mapping?.sourceSpan)).length;
  const generatedRangeMappings = sourceMapMappings.filter((mapping) => Boolean(mapping?.generatedSpan)).length;
  const preservation = adapterCoverageSourcePreservation(parseResult);
  const tokenCount = preservation?.summary?.tokens ?? preservation?.tokens?.length ?? 0;
  const triviaCount = preservation?.summary?.trivia ?? preservation?.trivia?.length ?? 0;
  const semanticEvidence = observeNativeImporterSemanticEvidence(semanticIndex);
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    level: maxSemanticCoverageLevel(
      semanticSymbols || semanticEvidence.declarations
        ? 'declaration-index'
        : 'native-ast',
      semanticEvidence.references || semanticEvidence.types || semanticEvidence.controlFlow
        ? 'semantic-index'
        : semanticSymbols ? 'declaration-index' : 'native-ast'
    ),
    declarations: semanticSymbols > 0 || semanticEvidence.declarations > 0,
    symbols: semanticSymbols > 0,
    references: semanticEvidence.references > 0,
    types: semanticEvidence.types > 0,
    controlFlow: semanticEvidence.controlFlow > 0
  }, {});
  return normalizeNativeImporterAdapterObservedCoverage({
    exactness: observedAdapterExactness(declared, nodeList.length),
    exactAst: Boolean(declared.exactAst && nodeList.length > 0),
    tokens: tokenCount > 0,
    tokenCount,
    trivia: triviaCount > 0,
    triviaCount,
    diagnostics: diagnostics.length,
    parserDiagnostics: diagnostics.length,
    diagnosticErrors,
    diagnosticWarnings,
    diagnosticInfos,
    losses: context.losses?.length ?? 0,
    nativeAstNodes: nodeList.length,
    semanticSymbols,
    semanticReferences: semanticEvidence.references,
    semanticTypes: semanticEvidence.types,
    semanticControlFlow: semanticEvidence.controlFlow,
    references: semanticEvidence.references > 0,
    types: semanticEvidence.types > 0,
    controlFlow: semanticEvidence.controlFlow > 0,
    sourceMapMappings: sourceMapMappings.length,
    sourceRanges: sourceRangeNodes > 0 || sourceRangeMappings > 0,
    sourceRangeNodes,
    sourceRangeMappings,
    generatedRanges: generatedRangeMappings > 0,
    generatedRangeMappings,
    semanticCoverage
  }, declared);
}

function adapterCoverageSourcePreservation(parseResult = {}) {
  return parseResult.sourcePreservation
    ?? parseResult.nativeAst?.metadata?.sourcePreservation
    ?? parseResult.nativeAstMetadata?.sourcePreservation
    ?? parseResult.metadata?.sourcePreservation;
}

function observeNativeImporterSemanticEvidence(semanticIndex = {}) {
  const occurrences = semanticIndex?.occurrences ?? [];
  const relations = semanticIndex?.relations ?? [];
  const facts = semanticIndex?.facts ?? [];
  const symbols = semanticIndex?.symbols ?? [];
  const referenceRelations = relations.filter((relation) => semanticPredicateMatches(relation?.predicate, ['reference', 'call', 'read', 'write', 'use']));
  const typeFacts = facts.filter((fact) => semanticPredicateMatches(fact?.predicate, ['type', 'declaredtype', 'inferredtype', 'typeof']));
  const typedSymbols = symbols.filter((symbol) => Boolean(symbol?.declaredType ?? symbol?.inferredType ?? symbol?.typeId ?? symbol?.valueType));
  const controlFlowRecords = [
    ...relations.filter((relation) => semanticPredicateMatches(relation?.predicate, ['controlflow', 'cfg', 'flow'])),
    ...facts.filter((fact) => semanticPredicateMatches(fact?.predicate, ['controlflow', 'cfg', 'flow']))
  ];
  return {
    declarations: occurrences.filter((occurrence) => occurrence?.role === 'definition' || occurrence?.role === 'declaration').length,
    references: occurrences.filter((occurrence) => {
      const role = String(occurrence?.role ?? '').toLowerCase();
      return role && role !== 'definition' && role !== 'declaration';
    }).length + referenceRelations.length,
    types: typeFacts.length + typedSymbols.length,
    controlFlow: controlFlowRecords.length
  };
}

function semanticPredicateMatches(value, fragments) {
  const predicate = String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return fragments.some((fragment) => predicate.includes(fragment));
}

function observedAdapterExactness(declared = {}, nativeAstNodes = 0) {
  if (!nativeAstNodes) return 'unknown';
  if (declared.exactAst) return declared.exactness ?? 'exact-parser-ast';
  return 'adapter-reported-native-ast';
}

function effectiveNativeImporterAdapterCoverage(declared, observed) {
  const semanticCoverage = normalizeNativeImporterSemanticCoverage({
    level: maxSemanticCoverageLevel(declared.semanticCoverage?.level, observed.semanticCoverage?.level),
    declarations: declared.semanticCoverage?.declarations || observed.semanticCoverage?.declarations,
    symbols: declared.semanticCoverage?.symbols || observed.semanticCoverage?.symbols,
    references: declared.semanticCoverage?.references || observed.semanticCoverage?.references,
    types: declared.semanticCoverage?.types || observed.semanticCoverage?.types,
    controlFlow: declared.semanticCoverage?.controlFlow || observed.semanticCoverage?.controlFlow
  }, {});
  return freezeNativeImporterAdapterCoverageSnapshot({
    exactness: effectiveAdapterExactness(declared, observed),
    exactAst: declared.exactAst || observed.exactAst,
    tokens: declared.tokens || observed.tokens,
    trivia: declared.trivia || observed.trivia,
    diagnostics: declared.diagnostics || observed.parserDiagnostics > 0,
    sourceRanges: declared.sourceRanges || observed.sourceRanges,
    generatedRanges: declared.generatedRanges || observed.generatedRanges,
    semanticCoverage
  });
}

function effectiveAdapterExactness(declared, observed) {
  if (declared.exactAst || observed.exactAst) return declared.exactness ?? 'exact-parser-ast';
  if (observed.nativeAstNodes > 0) return observed.exactness ?? 'adapter-reported-native-ast';
  return declared.exactness ?? 'unknown';
}

function nativeImporterAdapterCapabilityEvidence(declared, observed, effective) {
  const capabilityRows = [
    adapterCoverageCapabilityRow('exactAst', declared.exactAst, observed.exactAst, effective.exactAst, observed.nativeAstNodes),
    adapterCoverageCapabilityRow('tokens', declared.tokens, observed.tokens, effective.tokens, observed.tokenCount),
    adapterCoverageCapabilityRow('trivia', declared.trivia, observed.trivia, effective.trivia, observed.triviaCount),
    adapterCoverageCapabilityRow('parserDiagnostics', declared.diagnostics, observed.parserDiagnostics > 0, effective.diagnostics, observed.parserDiagnostics),
    adapterCoverageCapabilityRow('sourceRanges', declared.sourceRanges, observed.sourceRanges, effective.sourceRanges, observed.sourceRangeNodes + observed.sourceRangeMappings),
    adapterCoverageCapabilityRow('generatedRanges', declared.generatedRanges, observed.generatedRanges, effective.generatedRanges, observed.generatedRangeMappings),
    adapterCoverageCapabilityRow('semanticDeclarations', declared.semanticCoverage.declarations, observed.semanticCoverage.declarations, effective.semanticCoverage.declarations, observed.semanticSymbols),
    adapterCoverageCapabilityRow('semanticSymbols', declared.semanticCoverage.symbols, observed.semanticCoverage.symbols, effective.semanticCoverage.symbols, observed.semanticSymbols),
    adapterCoverageCapabilityRow('references', declared.semanticCoverage.references, observed.semanticCoverage.references, effective.semanticCoverage.references, observed.semanticReferences),
    adapterCoverageCapabilityRow('types', declared.semanticCoverage.types, observed.semanticCoverage.types, effective.semanticCoverage.types, observed.semanticTypes),
    adapterCoverageCapabilityRow('controlFlow', declared.semanticCoverage.controlFlow, observed.semanticCoverage.controlFlow, effective.semanticCoverage.controlFlow, observed.semanticControlFlow)
  ];
  const reviewCapabilities = new Set(['exactAst', 'tokens', 'trivia', 'parserDiagnostics', 'sourceRanges', 'generatedRanges', 'references', 'types', 'controlFlow']);
  return Object.freeze({
    declared,
    observed,
    effective,
    capabilities: Object.freeze(capabilityRows),
    gaps: Object.freeze(capabilityRows.filter((row) => reviewCapabilities.has(row.capability) && !row.effective).map((row) => row.capability)),
    declaredOnly: Object.freeze(capabilityRows.filter((row) => row.declared && !row.observed).map((row) => row.capability)),
    observedOnly: Object.freeze(capabilityRows.filter((row) => !row.declared && row.observed).map((row) => row.capability)),
    parserDiagnostics: Object.freeze({
      declared: declared.diagnostics,
      observed: observed.parserDiagnostics > 0,
      count: observed.parserDiagnostics,
      errors: observed.diagnosticErrors,
      warnings: observed.diagnosticWarnings,
      infos: observed.diagnosticInfos
    }),
    sourceRanges: Object.freeze({
      declared: declared.sourceRanges,
      observed: observed.sourceRanges,
      nativeAstNodes: observed.nativeAstNodes,
      sourceRangeNodes: observed.sourceRangeNodes,
      sourceMapMappings: observed.sourceMapMappings,
      sourceRangeMappings: observed.sourceRangeMappings,
      generatedRangeMappings: observed.generatedRangeMappings
    }),
    tokensTrivia: Object.freeze({
      tokens: Object.freeze({ declared: declared.tokens, observed: observed.tokens, count: observed.tokenCount }),
      trivia: Object.freeze({ declared: declared.trivia, observed: observed.trivia, count: observed.triviaCount })
    }),
    semantic: Object.freeze({
      level: Object.freeze({
        declared: declared.semanticCoverage.level,
        observed: observed.semanticCoverage.level,
        effective: effective.semanticCoverage.level
      }),
      declarations: adapterCoverageCapabilityRow('semanticDeclarations', declared.semanticCoverage.declarations, observed.semanticCoverage.declarations, effective.semanticCoverage.declarations, observed.semanticSymbols),
      symbols: adapterCoverageCapabilityRow('semanticSymbols', declared.semanticCoverage.symbols, observed.semanticCoverage.symbols, effective.semanticCoverage.symbols, observed.semanticSymbols),
      references: adapterCoverageCapabilityRow('references', declared.semanticCoverage.references, observed.semanticCoverage.references, effective.semanticCoverage.references, observed.semanticReferences),
      types: adapterCoverageCapabilityRow('types', declared.semanticCoverage.types, observed.semanticCoverage.types, effective.semanticCoverage.types, observed.semanticTypes),
      controlFlow: adapterCoverageCapabilityRow('controlFlow', declared.semanticCoverage.controlFlow, observed.semanticCoverage.controlFlow, effective.semanticCoverage.controlFlow, observed.semanticControlFlow)
    })
  });
}

function adapterCoverageCapabilityRow(capability, declared, observed, effective, count = 0) {
  const status = declared && observed
    ? 'declared-and-observed'
    : declared ? 'declared-unobserved' : observed ? 'observed-undeclared' : 'absent';
  return Object.freeze({
    capability,
    declared: Boolean(declared),
    observed: Boolean(observed),
    effective: Boolean(effective),
    count: Number(count ?? 0) || 0,
    status
  });
}

function declarationSemanticCoverage() {
  return {
    level: 'declaration-index',
    declarations: true,
    symbols: true,
    references: false,
    types: false,
    controlFlow: false
  };
}

function normalizeNativeImporterSemanticCoverage(value = {}, context = {}) {
  const capabilities = context.capabilities ?? new Set();
  const hasCapability = (...names) => names.some((name) => capabilities.has(String(name).toLowerCase()));
  const declarations = Boolean(value.declarations ?? hasCapability('semanticIndex', 'declarations'));
  const symbols = Boolean(value.symbols ?? declarations);
  const references = Boolean(value.references ?? hasCapability('references', 'referenceIndex'));
  const types = Boolean(value.types ?? hasCapability('types', 'typeResolution', 'typeChecking'));
  const controlFlow = Boolean(value.controlFlow ?? hasCapability('controlFlow', 'cfg'));
  return Object.freeze({
    level: String(value.level ?? inferredSemanticCoverageLevel({ declarations, symbols, references, types, controlFlow })),
    declarations,
    symbols,
    references,
    types,
    controlFlow
  });
}

function inferredAdapterExactness(exactAst, capabilities) {
  if (exactAst) return 'exact-parser-ast';
  if (capabilities.has('nativeast')) return 'adapter-reported-native-ast';
  return 'loss-aware-native-ast';
}

function inferredSemanticCoverageLevel(input) {
  if (input.references || input.types || input.controlFlow) return 'semantic-index';
  if (input.declarations || input.symbols) return 'declaration-index';
  return 'native-ast';
}

function maxSemanticCoverageLevel(left, right) {
  const ranks = { 'native-ast': 0, 'declaration-index': 1, 'semantic-index': 2 };
  const leftRank = ranks[left] ?? 0;
  const rightRank = ranks[right] ?? 0;
  return rightRank > leftRank ? right : left;
}

function inferredAdapterCoverageNotes(context, coverage) {
  const notes = [];
  if (!coverage.exactAst) notes.push('Adapter did not declare exact parser AST/CST coverage; import readiness depends on losses and evidence.');
  if (!coverage.generatedRanges) notes.push('Adapter does not declare generated-range coverage unless parse output includes generated spans.');
  if (!coverage.diagnostics) notes.push('Adapter did not declare parser diagnostics support.');
  if (context.language && context.parser) notes.push(`Coverage summary applies to ${context.language} via ${context.parser}.`);
  return notes;
}

function normalizeStringList(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function normalizeAdapterDiagnostics(value, adapter, input, scope = 'diagnostic') {
  if (value === undefined || value === null) return [];
  const diagnostics = Array.isArray(value) ? value : [value];
  return diagnostics.map((diagnostic, index) => {
    const normalized = typeof diagnostic === 'string' ? { message: diagnostic } : diagnostic ?? {};
    const severity = normalizeDiagnosticSeverity(normalized.severity);
    return Object.freeze({
      id: normalized.id ?? `diagnostic_${idFragment(adapter.id)}_${idFragment(scope)}_${index + 1}`,
      severity,
      code: normalized.code,
      phase: normalized.phase ?? 'parse',
      kind: normalized.kind,
      message: String(normalized.message ?? `${adapter.id} reported a ${severity} diagnostic.`),
      path: normalized.path ?? input.sourcePath,
      span: normalized.span,
      metadata: {
        adapterId: adapter.id,
        adapterVersion: adapter.version,
        language: input.language ?? adapter.language,
        parser: input.parser ?? adapter.parser,
        parserVersion: input.parserVersion,
        ...normalized.metadata
      }
    });
  });
}

function normalizeDiagnosticSeverity(value) {
  const severity = String(value ?? 'warning').toLowerCase();
  if (severity === 'error') return 'error';
  if (severity === 'info') return 'info';
  return 'warning';
}

function adapterDiagnosticToLoss(diagnostic, index, adapter, input) {
  const code = diagnostic.code ?? diagnostic.kind ?? diagnostic.severity;
  return {
    id: `loss_${idFragment(diagnostic.id ?? `${adapter.id}_${index}_${code}`)}`,
    severity: diagnostic.severity,
    phase: diagnostic.phase,
    sourceFormat: input.language,
    kind: diagnostic.kind ?? (diagnostic.severity === 'error' ? 'unsupportedSyntax' : 'opaqueNative'),
    message: diagnostic.message,
    span: diagnostic.span,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      diagnosticId: diagnostic.id,
      diagnosticCode: diagnostic.code,
      parser: input.parser,
      parserVersion: input.parserVersion,
      path: diagnostic.path,
      ...diagnostic.metadata
    }
  };
}

function mergeNativeLosses(primary = [], secondary = []) {
  const seen = new Set();
  const losses = [];
  for (const loss of [...primary, ...secondary]) {
    if (!loss) continue;
    const id = loss.id ?? `loss_${losses.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    losses.push(loss.id ? loss : { ...loss, id });
  }
  return losses;
}

function adapterDiagnosticsEvidence(adapter, diagnostics, input) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return {
    id: `evidence_${idFragment(adapter.id)}_native_importer_adapter`,
    kind: 'import',
    status: errors ? 'failed' : 'passed',
    path: input.sourcePath,
    summary: `Ran ${adapter.id} native importer for ${input.language} with ${diagnostics.length} diagnostic(s).`,
    metadata: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      language: input.language,
      parser: input.parser,
      parserVersion: input.parserVersion,
      sourceHash: input.sourceHash,
      capabilities: adapter.capabilities,
      coverage: adapter.coverage,
      supportedExtensions: adapter.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      errors,
      warnings
    }
  };
}

function serializableDiagnostic(diagnostic) {
  return {
    id: diagnostic.id,
    severity: diagnostic.severity,
    code: diagnostic.code,
    phase: diagnostic.phase,
    kind: diagnostic.kind,
    message: diagnostic.message,
    path: diagnostic.path,
    span: diagnostic.span,
    metadata: diagnostic.metadata
  };
}

function missingInjectedParserResult(input, details) {
  const rootId = `native_${idFragment(details.adapterId ?? details.parser)}_missing_parser`;
  const diagnostic = {
    severity: 'error',
    code: 'adapter.parser.missing',
    phase: 'parse',
    kind: 'unsupportedSyntax',
    message: details.message,
    path: input.sourcePath,
    metadata: {
      adapterId: details.adapterId,
      parser: details.parser
    }
  };
  return {
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        kind: 'MissingInjectedParser',
        languageKind: `${input.language}.missingInjectedParser`,
        value: details.parser,
        metadata: {
          adapterId: details.adapterId,
          parser: details.parser,
          reason: 'missing-injected-parser'
        }
      }
    },
    diagnostics: [diagnostic],
    losses: [{
      id: `loss_${idFragment(rootId)}`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: input.language,
      kind: 'unsupportedSyntax',
      message: details.message,
      nodeId: rootId,
      metadata: {
        adapterId: details.adapterId,
        parser: details.parser
      }
    }],
    metadata: {
      parser: details.parser,
      adapterId: details.adapterId,
      missingInjectedParser: true
    }
  };
}

function normalizeParserErrors(errors, input, options) {
  return (errors ?? []).map((error, index) => ({
    id: `diagnostic_${idFragment(options.parser)}_parser_error_${index + 1}`,
    severity: 'error',
    code: error.code ?? error.reasonCode,
    phase: 'parse',
    kind: 'unsupportedSyntax',
    message: String(error.message ?? 'Parser reported a syntax error.'),
    path: input.sourcePath,
    span: spanFromLoc(error.loc ? { start: error.loc, end: error.loc } : undefined, input),
    metadata: {
      parser: options.parser,
      reasonCode: error.reasonCode
    }
  }));
}

function nativeNodeId(context, kind, loc, propertyPath) {
  context.counter += 1;
  const start = loc?.start;
  const line = start?.line ?? 'x';
  const column = start?.column ?? 'x';
  return `native_${idFragment(kind)}_${idFragment(line)}_${idFragment(column)}_${context.counter}_${idFragment(propertyPath)}`;
}

function isSyntaxAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof (value.type ?? value.kind) === 'string');
}

function pythonAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isPythonAstNode(value)) return value;
  if (isPythonAstNode(value.ast)) return value.ast;
  if (isPythonAstNode(value.root)) return value.root;
  if (isPythonAstNode(value.module)) return value.module;
  return undefined;
}

function isPythonAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof pythonAstKind(value) === 'string');
}

function pythonAstKind(node) {
  return node?._type ?? node?.type ?? node?.kind ?? node?.nodeType;
}

function rustSynAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isRustSynAstNode(value)) return value;
  if (isRustSynAstNode(value.ast)) return value.ast;
  if (isRustSynAstNode(value.file)) return value.file;
  if (isRustSynAstNode(value.root)) return value.root;
  if (isRustSynAstNode(value.module)) return value.module;
  if (isRustSynAstNode(value.sourceFile)) return value.sourceFile;
  return undefined;
}

function isRustSynAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof rustSynKind(value) === 'string');
}

function rustSynKind(node) {
  const declared = node?._type ?? node?.type ?? node?.kind ?? node?.nodeType ?? node?.synKind;
  if (typeof declared === 'string') return normalizeRustSynKind(declared);
  const wrapper = rustSynWrapperKind(node);
  if (wrapper) return normalizeRustSynKind(wrapper);
  if (Array.isArray(node?.items)) return 'File';
  if (node?.sig && node?.block) return 'ItemFn';
  if (node?.ident && node?.fields && Array.isArray(node?.variants)) return 'ItemEnum';
  if (node?.ident && node?.fields) return 'ItemStruct';
  if (node?.ident && Array.isArray(node?.items)) return 'ItemMod';
  if (node?.trait_ || node?.self_ty || node?.selfType) return 'ItemImpl';
  if (node?.path && (node?.tree || node?.trees)) return 'ItemUse';
  return undefined;
}

function rustSynPayload(node) {
  if (!node || typeof node !== 'object') return node;
  const wrapper = rustSynWrapperKind(node);
  return wrapper ? node[wrapper] : node;
}

function rustSynWrapperKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const keys = Object.keys(node).filter((key) => !ignoredRustSynField(key));
  if (keys.length !== 1) return undefined;
  const key = keys[0];
  const value = node[key];
  if (!value || typeof value !== 'object') return undefined;
  if (/^(?:Fn|Struct|Enum|Trait|Impl|Use|Mod|Type|Const|Static|Union|Macro)$/.test(key)) return key;
  if (/^(?:Item|ImplItem|TraitItem|ForeignItem)/.test(key)) return key;
  return undefined;
}

function normalizeRustSynKind(kind) {
  const text = String(kind);
  const compact = text.replace(/^(?:syn::)?/, '').replace(/^Item::/, 'Item').replace(/^ImplItem::/, 'ImplItem').replace(/^TraitItem::/, 'TraitItem');
  if (/^fn$/i.test(compact)) return 'ItemFn';
  if (/^struct$/i.test(compact)) return 'ItemStruct';
  if (/^enum$/i.test(compact)) return 'ItemEnum';
  if (/^trait$/i.test(compact)) return 'ItemTrait';
  if (/^impl$/i.test(compact)) return 'ItemImpl';
  if (/^use$/i.test(compact)) return 'ItemUse';
  if (/^mod$/i.test(compact)) return 'ItemMod';
  if (/^type$/i.test(compact)) return 'ItemType';
  if (/^const$/i.test(compact)) return 'ItemConst';
  if (/^static$/i.test(compact)) return 'ItemStatic';
  if (/^union$/i.test(compact)) return 'ItemUnion';
  if (/^item_fn$/i.test(compact)) return 'ItemFn';
  if (/^item_struct$/i.test(compact)) return 'ItemStruct';
  if (/^item_enum$/i.test(compact)) return 'ItemEnum';
  if (/^item_trait$/i.test(compact)) return 'ItemTrait';
  if (/^item_impl$/i.test(compact)) return 'ItemImpl';
  if (/^item_use$/i.test(compact)) return 'ItemUse';
  if (/^item_mod$/i.test(compact)) return 'ItemMod';
  if (/^item_type$/i.test(compact)) return 'ItemType';
  if (/^item_const$/i.test(compact)) return 'ItemConst';
  if (/^item_static$/i.test(compact)) return 'ItemStatic';
  if (/^item_union$/i.test(compact)) return 'ItemUnion';
  if (/^item_macro$/i.test(compact)) return 'ItemMacro';
  if (/^macro$/i.test(compact)) return 'Macro';
  if (/^impl_item_fn$/i.test(compact)) return 'ImplItemFn';
  if (/^trait_item_fn$/i.test(compact)) return 'TraitItemFn';
  if (/^foreign_item_fn$/i.test(compact)) return 'ForeignItemFn';
  return compact;
}

function ignoredSyntaxField(key) {
  return key === 'type'
    || key === 'kind'
    || key === 'loc'
    || key === 'start'
    || key === 'end'
    || key === 'range'
    || key === 'comments'
    || key === 'leadingComments'
    || key === 'trailingComments'
    || key === 'innerComments'
    || key === 'tokens'
    || key === 'extra'
    || key === 'parent';
}

function ignoredPythonAstField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === '_fields'
    || key === 'lineno'
    || key === 'col_offset'
    || key === 'end_lineno'
    || key === 'end_col_offset'
    || key === 'line'
    || key === 'colOffset'
    || key === 'endLine'
    || key === 'endColOffset'
    || key === 'ctx'
    || key === 'parent';
}

function ignoredRustSynField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'synKind'
    || key === 'span'
    || key === 'tokens'
    || key === 'tokenStream'
    || key === 'parent';
}

function primitiveSyntaxFields(node) {
  const fields = {};
  for (const key of ['name', 'operator', 'sourceType', 'async', 'generator', 'computed', 'static', 'exportKind', 'importKind', 'optional']) {
    if (typeof node[key] === 'string' || typeof node[key] === 'number' || typeof node[key] === 'boolean' || node[key] === null) {
      fields[key] = node[key];
    }
  }
  const literal = literalSyntaxValue(node);
  if (literal !== undefined) fields.literal = literal;
  if (node.source && typeof node.source === 'object' && typeof node.source.value === 'string') fields.source = node.source.value;
  return fields;
}

function primitivePythonAstFields(node, kind) {
  const fields = { kind };
  for (const key of ['name', 'id', 'arg', 'module', 'level', 'attr', 'asname', 'type_comment']) {
    if (typeof node[key] === 'string' || typeof node[key] === 'number' || typeof node[key] === 'boolean' || node[key] === null) {
      fields[key] = node[key];
    }
  }
  if (Array.isArray(node.names)) {
    fields.names = node.names
      .map((entry) => pythonAliasName(entry))
      .filter(Boolean)
      .join(',');
  }
  const literal = pythonAstLiteralValue(node);
  if (literal !== undefined) fields.literal = literal;
  return fields;
}

function primitiveRustSynFields(node, kind) {
  const fields = { kind };
  const ident = rustSynIdentName(node.ident ?? node.name ?? node.sig?.ident);
  if (ident) fields.ident = ident;
  const path = rustSynPathName(node.path ?? node.trait_ ?? node.self_ty ?? node.selfType ?? node.ty);
  if (path) fields.path = path;
  const visibility = rustSynVisibility(node.vis ?? node.visibility);
  if (visibility) fields.visibility = visibility;
  for (const key of ['mutability', 'defaultness', 'constness', 'asyncness', 'unsafety', 'abi']) {
    const value = node[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key] = value;
  }
  if (Array.isArray(node.attrs) && node.attrs.length) fields.attributeCount = node.attrs.length;
  return fields;
}

function literalSyntaxValue(node) {
  if (node.value === null || typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') return node.value;
  return undefined;
}

function pythonAstLiteralValue(node) {
  if (node.value === null || typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') return node.value;
  if (typeof node.s === 'string' || typeof node.s === 'number') return node.s;
  if (typeof node.n === 'number') return node.n;
  return undefined;
}

function spanFromLoc(loc, input) {
  if (!loc?.start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath ?? loc.filename,
    startLine: loc.start.line,
    startColumn: typeof loc.start.column === 'number' ? loc.start.column + 1 : undefined,
    endLine: loc.end?.line,
    endColumn: typeof loc.end?.column === 'number' ? loc.end.column + 1 : undefined
  };
}

function spanFromPythonAstNode(node, input) {
  const line = node.lineno ?? node.line;
  if (typeof line !== 'number') return undefined;
  const col = node.col_offset ?? node.colOffset;
  const endLine = node.end_lineno ?? node.endLine;
  const endCol = node.end_col_offset ?? node.endColOffset;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: line,
    startColumn: typeof col === 'number' ? col + 1 : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endCol === 'number' ? endCol + 1 : undefined
  };
}

function spanFromRustSynNode(node, input) {
  const span = node.span ?? node.ident?.span ?? node.sig?.ident?.span ?? node.name?.span;
  if (!span || typeof span !== 'object') return undefined;
  const start = span.start ?? span.lo ?? span.begin;
  const end = span.end ?? span.hi;
  const startLine = span.startLine ?? span.line ?? start?.line;
  const startColumn = span.startColumn ?? span.column ?? start?.column;
  const endLine = span.endLine ?? end?.line;
  const endColumn = span.endColumn ?? end?.column;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine,
    startColumn: typeof startColumn === 'number' ? rustSynColumnToOneBased(startColumn, span) : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endColumn === 'number' ? rustSynColumnToOneBased(endColumn, span) : undefined
  };
}

function rustSynColumnToOneBased(column, span) {
  return span.columnBase === 1 || span.columnsOneBased ? column : column + 1;
}

function rustSynSpanKind(node) {
  const span = node.span ?? node.ident?.span ?? node.sig?.ident?.span ?? node.name?.span;
  if (!span || typeof span !== 'object') return undefined;
  return span.kind ?? span.source ?? 'host-span';
}

function syntaxDeclaration(node, nativeNodeId, input) {
  const kind = String(node.type ?? node.kind ?? '');
  if (kind === 'ImportDeclaration') {
    const name = node.source?.value;
    if (typeof name === 'string') return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ExportNamedDeclaration' || kind === 'ExportAllDeclaration') {
    const name = node.source?.value;
    if (typeof name === 'string') return declarationRecord(input, nativeNodeId, name, 'module', 'export');
  }
  if (kind === 'FunctionDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'function');
  if (kind === 'ClassDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'class');
  if (kind === 'TSInterfaceDeclaration' || kind === 'InterfaceDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'interface');
  if (kind === 'TSTypeAliasDeclaration' || kind === 'TypeAliasDeclaration') return namedDeclaration(input, nativeNodeId, node.id, 'type');
  if (kind === 'VariableDeclarator') return namedDeclaration(input, nativeNodeId, node.id, 'variable');
  return undefined;
}

function pythonAstDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'Import') {
    const name = (node.names ?? []).map((entry) => pythonAliasName(entry)).find(Boolean);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ImportFrom') {
    const name = node.module ?? (node.names ?? []).map((entry) => pythonAliasName(entry)).find(Boolean);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'FunctionDef' || kind === 'AsyncFunctionDef') return declarationRecord(input, nativeNodeId, node.name, 'function', 'definition');
  if (kind === 'ClassDef') return declarationRecord(input, nativeNodeId, node.name, 'class', 'definition');
  if (kind === 'AnnAssign' || kind === 'Assign') {
    const name = pythonAssignmentName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  return undefined;
}

function rustSynDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'ItemUse' || kind === 'UseTree' || kind === 'UsePath' || kind === 'UseName') {
    const name = rustSynUseName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'ItemFn' || kind === 'ForeignItemFn') {
    const name = rustSynIdentName(node.sig?.ident ?? node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'function', 'definition');
  }
  if (kind === 'ImplItemFn' || kind === 'TraitItemFn') {
    const name = rustSynIdentName(node.sig?.ident ?? node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'method', 'definition');
  }
  if (kind === 'ItemStruct' || kind === 'ItemUnion') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'class', 'definition');
  }
  if (kind === 'ItemEnum' || kind === 'ItemTrait' || kind === 'ItemType') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (kind === 'ItemMod') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'definition');
  }
  if (kind === 'ItemConst' || kind === 'ItemStatic') {
    const name = rustSynIdentName(node.ident ?? node.name);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', 'definition');
  }
  if (kind === 'ItemImpl') {
    const name = rustSynImplName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (rustSynMacroKind(kind)) {
    const name = rustSynIdentName(node.ident ?? node.mac?.path ?? node.path);
    if (name) return declarationRecord(input, nativeNodeId, name, 'macro', 'definition');
  }
  return undefined;
}

function typeScriptDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'ImportDeclaration' || kind === 'ImportEqualsDeclaration') {
    const name = stringFromTsExpression(node.moduleSpecifier) ?? stringFromTsExpression(node.externalModuleReference?.expression);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (kind === 'FunctionDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'function');
  if (kind === 'ClassDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'class');
  if (kind === 'InterfaceDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'interface');
  if (kind === 'TypeAliasDeclaration' || kind === 'EnumDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'type');
  if (kind === 'VariableDeclaration') return namedDeclaration(input, nativeNodeId, node.name, 'variable');
  if (kind === 'MethodDeclaration' || kind === 'MethodSignature') return namedDeclaration(input, nativeNodeId, node.name, 'method');
  return undefined;
}

function treeSitterDeclaration(node, kind, nativeNodeId, input) {
  if (/import|include|use/.test(kind)) {
    const name = treeSitterFieldText(node, 'path') ?? treeSitterFieldText(node, 'source') ?? shortNodeText(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (/function|method|fn_item|function_declaration/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'function', 'definition');
  }
  if (/class/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'class', 'definition');
  }
  if (/interface/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'interface', 'definition');
  }
  if (/struct|enum|type/.test(kind)) {
    const name = treeSitterFieldText(node, 'name');
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  return undefined;
}

function namedDeclaration(input, nativeNodeId, nameNode, symbolKind) {
  const name = identifierName(nameNode);
  return name ? declarationRecord(input, nativeNodeId, name, symbolKind, 'definition') : undefined;
}

function pythonAstChildEntries(node) {
  const fieldNames = Array.isArray(node._fields)
    ? node._fields
    : Object.keys(node).filter((key) => !ignoredPythonAstField(key));
  return fieldNames
    .map((field) => [field, node[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isPythonAstNode)
      : isPythonAstNode(value));
}

function rustSynChildEntries(node) {
  const payload = rustSynPayload(node);
  const fieldNames = Object.keys(payload).filter((key) => !ignoredRustSynField(key));
  return fieldNames
    .map((field) => [field, payload[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isRustSynAstNode)
      : isRustSynAstNode(value));
}

function pythonAstNodeValue(node) {
  return node.name ?? node.id ?? node.arg ?? node.module ?? pythonAstLiteralValue(node);
}

function rustSynNodeValue(node) {
  return rustSynIdentName(node.ident ?? node.name ?? node.sig?.ident)
    ?? rustSynPathName(node.path ?? node.trait_ ?? node.self_ty ?? node.selfType ?? node.ty)
    ?? rustSynLiteralValue(node);
}

function pythonAliasName(alias) {
  if (!alias) return undefined;
  if (typeof alias === 'string') return alias;
  return alias.name ?? alias.asname ?? alias.id;
}

function pythonAssignmentName(node) {
  if (node.target) return pythonTargetName(node.target);
  for (const target of node.targets ?? []) {
    const name = pythonTargetName(target);
    if (name) return name;
  }
  return undefined;
}

function pythonTargetName(target) {
  if (!target) return undefined;
  if (typeof target === 'string') return target;
  if (typeof target.id === 'string') return target.id;
  if (typeof target.name === 'string') return target.name;
  if (typeof target.arg === 'string') return target.arg;
  if (target.attr && target.value) {
    const base = pythonTargetName(target.value);
    return base ? `${base}.${target.attr}` : target.attr;
  }
  return undefined;
}

function rustSynIdentName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.ident === 'string') return value.ident;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.sym === 'string') return value.sym;
  if (typeof value.value === 'string') return value.value;
  if (typeof value.path === 'string') return value.path;
  return rustSynPathName(value.path ?? value);
}

function rustSynPathName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.ident === 'string') return value.ident;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.path === 'string') return value.path;
  if (value.path && typeof value.path === 'object') return rustSynPathName(value.path);
  if (Array.isArray(value.segments)) {
    const names = value.segments
      .map((segment) => rustSynIdentName(segment.ident ?? segment))
      .filter(Boolean);
    return names.length ? names.join('::') : undefined;
  }
  if (Array.isArray(value.qself)) return value.qself.map(rustSynPathName).filter(Boolean).join('::');
  if (value.leading_colon && value.segments) {
    const name = rustSynPathName({ segments: value.segments });
    return name ? `::${name}` : undefined;
  }
  return undefined;
}

function rustSynUseName(node) {
  if (!node) return undefined;
  if (node.prefix && node.tree) {
    const prefix = rustSynPathName(node.prefix);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (node.ident && node.tree) {
    const prefix = rustSynIdentName(node.ident);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (node.path && node.tree) {
    const prefix = rustSynPathName(node.path);
    const child = rustSynUseName(node.tree);
    return [prefix, child].filter(Boolean).join('::') || undefined;
  }
  if (Array.isArray(node.trees)) return node.trees.map(rustSynUseName).find(Boolean);
  if (node.tree) return rustSynUseName(node.tree);
  if (node.path) return rustSynPathName(node.path);
  if (node.name) return rustSynIdentName(node.name);
  if (node.ident) return rustSynIdentName(node.ident);
  if (node.rename) return rustSynIdentName(node.rename);
  return undefined;
}

function rustSynImplName(node) {
  const selfType = rustSynPathName(node.self_ty ?? node.selfType ?? node.ty);
  const traitPath = Array.isArray(node.trait_)
    ? rustSynPathName(node.trait_[1] ?? node.trait_[0])
    : rustSynPathName(node.trait_);
  if (selfType && traitPath) return `${selfType}.${traitPath}.impl`;
  if (selfType) return `${selfType}.impl`;
  if (traitPath) return `${traitPath}.impl`;
  return undefined;
}

function rustSynVisibility(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.kind === 'string') return value.kind;
  if (typeof value.type === 'string') return value.type;
  if (value.pub || value.Public) return 'pub';
  if (value.restricted || value.Restricted) return 'restricted';
  return undefined;
}

function rustSynLiteralValue(node) {
  const value = node.value ?? node.lit?.value ?? node.lit;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function rustSynMacroKind(kind) {
  return /Macro|MacroRules|MacroCall/.test(String(kind));
}

function clangAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) return { kind: 'TranslationUnitDecl', inner: value };
  if (isClangAstNode(value)) return value;
  if (Array.isArray(value.ast)) return { kind: 'TranslationUnitDecl', inner: value.ast };
  if (isClangAstNode(value.ast)) return value.ast;
  if (isClangAstNode(value.root)) return value.root;
  if (isClangAstNode(value.translationUnit)) return value.translationUnit;
  if (isClangAstNode(value.tu)) return value.tu;
  if (isClangAstNode(value.file)) return value.file;
  if (isClangAstNode(value.sourceFile)) return value.sourceFile;
  return undefined;
}

function isClangAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof clangAstKind(value) === 'string');
}

function clangAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.declKind ?? node.stmtKind;
  if (typeof declared === 'string') return declared;
  if (Array.isArray(node.inner) || Array.isArray(node.children) || Array.isArray(node.decls)) return 'TranslationUnitDecl';
  return undefined;
}

function ignoredClangAstField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'declKind'
    || key === 'stmtKind'
    || key === 'id'
    || key === 'loc'
    || key === 'range'
    || key === 'name'
    || key === 'displayName'
    || key === 'qualifiedName'
    || key === 'mangledName'
    || key === 'parent'
    || key === 'parentDeclContextId'
    || key === 'previousDecl'
    || key === 'referencedDecl';
}

function primitiveClangAstFields(node, kind) {
  const fields = { kind };
  const name = clangDeclarationName(node);
  if (name) fields.name = name;
  const type = clangTypeName(node.type ?? node.qualType);
  if (type) fields.type = type;
  for (const key of [
    'mangledName',
    'storageClass',
    'tagUsed',
    'completeDefinition',
    'isThisDeclarationADefinition',
    'inline',
    'isUsed',
    'isReferenced',
    'valueCategory',
    'opcode',
    'castKind'
  ]) {
    const value = node[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key] = value;
  }
  const includePath = clangIncludePath(node);
  if (includePath) fields.includePath = includePath;
  const literal = clangLiteralValue(node);
  if (literal !== undefined) fields.literal = literal;
  const referenced = clangDeclarationName(node.referencedDecl);
  if (referenced) fields.referenced = referenced;
  return fields;
}

function spanFromClangAstNode(node, input) {
  const range = node.range ?? {};
  const begin = range.begin ?? node.loc ?? node.spellingLoc ?? node.expansionLoc;
  const end = range.end ?? node.end;
  const start = clangLocPosition(begin);
  if (!start) return undefined;
  const finish = clangLocPosition(end);
  return {
    sourceId: input.sourceHash,
    path: start.path ?? finish?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: finish?.line,
    endColumn: finish?.column
  };
}

function clangLocPosition(loc) {
  if (!loc || typeof loc !== 'object') return undefined;
  const expanded = loc.expansionLoc ?? loc.spellingLoc ?? loc;
  const line = expanded.line ?? expanded.startLine ?? expanded.begin?.line;
  const column = expanded.col ?? expanded.column ?? expanded.startColumn ?? expanded.begin?.col ?? expanded.begin?.column;
  if (typeof line !== 'number') return undefined;
  return {
    path: expanded.file ?? expanded.filename ?? expanded.path,
    line,
    column: typeof column === 'number' ? column : undefined
  };
}

function clangLocationKind(node) {
  const loc = node.loc ?? node.range?.begin;
  if (!loc || typeof loc !== 'object') return undefined;
  if (loc.expansionLoc) return 'expansionLoc';
  if (loc.spellingLoc) return 'spellingLoc';
  if (loc.includedFrom) return 'includedFrom';
  return 'clang-loc';
}

function clangAstDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'FunctionDecl' || kind === 'CXXMethodDecl' || kind === 'FunctionTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, kind === 'CXXMethodDecl' ? 'method' : 'function', clangDeclarationAction(node));
  }
  if (kind === 'ParmVarDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'parameter', 'definition');
  }
  if (kind === 'RecordDecl' || kind === 'CXXRecordDecl' || kind === 'ClassTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, kind === 'CXXRecordDecl' ? 'class' : 'type', clangDeclarationAction(node));
  }
  if (kind === 'FieldDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'property', 'definition');
  }
  if (kind === 'TypedefDecl' || kind === 'TypeAliasDecl' || kind === 'TypeAliasTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (kind === 'EnumDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', clangDeclarationAction(node));
  }
  if (kind === 'EnumConstantDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition');
  }
  if (kind === 'VarDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', clangDeclarationAction(node));
  }
  if (/IncludeDirective|InclusionDirective/.test(kind)) {
    const name = clangIncludePath(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (/MacroDefinition|MacroExpansion|MacroInstantiation/.test(kind)) {
    const name = clangDeclarationName(node) ?? clangIncludePath(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'macro', 'definition');
  }
  return undefined;
}

function clangDeclarationAction(node) {
  if (node.isThisDeclarationADefinition === false) return 'declaration';
  if (node.isThisDeclarationADefinition === true) return 'definition';
  if (Array.isArray(node.inner) && node.inner.some((entry) => ['CompoundStmt', 'FieldDecl', 'EnumConstantDecl'].includes(clangAstKind(entry)))) return 'definition';
  return 'declaration';
}

function clangAstChildEntries(node) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredClangAstField(key));
  return fieldNames
    .map((field) => [field, node[field]])
    .filter(([, value]) => Array.isArray(value)
      ? value.some(isClangAstNode)
      : isClangAstNode(value));
}

function clangAstNodeValue(node) {
  return clangDeclarationName(node)
    ?? clangIncludePath(node)
    ?? clangTypeName(node.type ?? node.qualType)
    ?? clangLiteralValue(node);
}

function clangDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['qualifiedName', 'displayName', 'name', 'mangledName']) {
    if (typeof node[key] === 'string' && node[key]) return node[key];
  }
  if (node.name && typeof node.name === 'object') return clangDeclarationName(node.name);
  if (node.referencedDecl && typeof node.referencedDecl === 'object') return clangDeclarationName(node.referencedDecl);
  if (node.decl && typeof node.decl === 'object') return clangDeclarationName(node.decl);
  return undefined;
}

function clangIncludePath(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['file', 'filename', 'path', 'spelling', 'source']) {
    if (typeof node[key] === 'string' && node[key]) return node[key];
  }
  if (node.include && typeof node.include === 'object') return clangIncludePath(node.include);
  return undefined;
}

function clangTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.qualType === 'string') return value.qualType;
  if (typeof value.desugaredQualType === 'string') return value.desugaredQualType;
  if (typeof value.name === 'string') return value.name;
  if (value.type && typeof value.type === 'object') return clangTypeName(value.type);
  return undefined;
}

function clangLiteralValue(node) {
  const value = node.value ?? node.val ?? node.literal;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof node.valueAsString === 'string') return node.valueAsString;
  return undefined;
}

function clangPreprocessorKind(kind) {
  return /Macro|Preprocess|Preprocessor|IfDirective|IfdefDirective|IfndefDirective|ElifDirective|ElseDirective|EndifDirective/.test(String(kind));
}

function clangPreprocessorRecords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isClangAstNode);
  if (typeof value === 'object' && Array.isArray(value.records)) return value.records.filter(isClangAstNode);
  if (isClangAstNode(value)) return [value];
  return [];
}

function serializableIncludeGraphSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) return { edgeCount: value.length };
  const summary = {};
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (typeof value.root === 'string') summary.root = value.root;
  if (Array.isArray(value.edges)) summary.edgeCount = value.edges.length;
  if (Array.isArray(value.includes)) summary.includeCount = value.includes.length;
  return Object.keys(summary).length ? summary : { present: true };
}

function goAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isGoAstNode(value)) return value;
  if (isGoAstNode(value.ast)) return value.ast;
  if (isGoAstNode(value.file)) return value.file;
  if (isGoAstNode(value.sourceFile)) return value.sourceFile;
  if (isGoAstNode(value.root)) return value.root;
  if (isGoAstNode(value.package)) return value.package;
  if (value.files && typeof value.files === 'object') return { kind: 'Package', Name: value.name ?? value.packageName, Files: value.files };
  return undefined;
}

function isGoAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof goAstKind(value) === 'string');
}

function goAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.astKind;
  if (typeof declared === 'string') return normalizeGoAstKind(declared);
  if (Array.isArray(node.Decls) || Array.isArray(node.decls)) return 'File';
  if (node.Files || node.files) return 'Package';
  if (node.Name && node.Type && (node.Body || node.Recv !== undefined || node.recv !== undefined)) return 'FuncDecl';
  if (node.Tok && (node.Specs || node.specs)) return 'GenDecl';
  if (node.Path && (node.Name !== undefined || node.EndPos !== undefined)) return 'ImportSpec';
  if (node.Names && node.Type !== undefined) return 'ValueSpec';
  if (node.Name && node.Type !== undefined) return 'TypeSpec';
  if (node.List && (node.Opening !== undefined || node.Closing !== undefined)) return 'FieldList';
  return undefined;
}

function normalizeGoAstKind(kind) {
  const text = String(kind).replace(/^(?:ast\.)?\*/, '').replace(/^(?:go\/ast\.)/, '');
  if (/^file$/i.test(text)) return 'File';
  if (/^package$/i.test(text)) return 'Package';
  if (/^funcdecl$/i.test(text) || /^func_decl$/i.test(text)) return 'FuncDecl';
  if (/^gendecl$/i.test(text) || /^gen_decl$/i.test(text)) return 'GenDecl';
  if (/^importspec$/i.test(text) || /^import_spec$/i.test(text)) return 'ImportSpec';
  if (/^typespec$/i.test(text) || /^type_spec$/i.test(text)) return 'TypeSpec';
  if (/^valuespec$/i.test(text) || /^value_spec$/i.test(text)) return 'ValueSpec';
  if (/^structtype$/i.test(text) || /^struct_type$/i.test(text)) return 'StructType';
  if (/^interfacetype$/i.test(text) || /^interface_type$/i.test(text)) return 'InterfaceType';
  if (/^fieldlist$/i.test(text) || /^field_list$/i.test(text)) return 'FieldList';
  return text;
}

function ignoredGoAstField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'astKind'
    || key === 'parent'
    || key === 'Obj'
    || key === 'object'
    || key === 'Scope'
    || key === 'scope'
    || key === 'Unresolved'
    || key === 'unresolved'
    || key === 'FileStart'
    || key === 'FileEnd'
    || key === 'Package'
    || key === 'Name'
    || key === 'Path'
    || key === 'Pos'
    || key === 'End'
    || key === 'pos'
    || key === 'end';
}

function primitiveGoAstFields(node, kind) {
  const fields = { kind };
  const name = goAstDeclarationName(node);
  if (name) fields.name = name;
  const type = goAstTypeName(node.Type ?? node.type);
  if (type) fields.type = type;
  const tok = goAstTokenName(node.Tok ?? node.tok);
  if (tok) fields.token = tok;
  const importPath = goAstImportPath(node);
  if (importPath) fields.importPath = importPath;
  const receiver = goAstReceiverName(node);
  if (receiver) fields.receiver = receiver;
  for (const key of ['Incomplete', 'Doc', 'Comment']) {
    const value = node[key] ?? node[key[0].toLowerCase() + key.slice(1)];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) fields[key[0].toLowerCase() + key.slice(1)] = value;
  }
  if (Array.isArray(node.Names ?? node.names)) {
    fields.names = (node.Names ?? node.names).map(goAstIdentName).filter(Boolean).join(',');
  }
  return fields;
}

function spanFromGoAstNode(node, input, options = {}) {
  const start = goAstPosition(node.Pos ?? node.pos ?? node.Name?.NamePos ?? node.name?.namePos ?? node.Package, options);
  const end = goAstPosition(node.End ?? node.end ?? node.EndPos ?? node.endPos, options);
  if (!start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: start.path ?? end?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end?.line,
    endColumn: end?.column
  };
}

function goAstPosition(value, options = {}) {
  if (!value) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value.pos ?? value.Pos ?? value;
    const line = position.Line ?? position.line;
    const column = position.Column ?? position.column ?? position.Col ?? position.col;
    if (typeof line === 'number') {
      return {
        path: position.Filename ?? position.filename ?? position.file ?? position.path,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const fileSet = options.fileSet ?? options.fset;
  const positionFor = typeof fileSet?.PositionFor === 'function'
    ? fileSet.PositionFor.bind(fileSet)
    : typeof fileSet?.positionFor === 'function'
      ? fileSet.positionFor.bind(fileSet)
      : typeof fileSet?.Position === 'function'
        ? fileSet.Position.bind(fileSet)
        : typeof fileSet?.position === 'function'
          ? fileSet.position.bind(fileSet)
          : undefined;
  if (positionFor) {
    const resolved = positionFor(value, true);
    return goAstPosition(resolved, options);
  }
  return undefined;
}

function goAstPositionKind(node) {
  const pos = node.Pos ?? node.pos ?? node.Name?.NamePos ?? node.name?.namePos;
  if (!pos) return undefined;
  if (typeof pos === 'object') return 'token.Position';
  return 'token.Pos';
}

function goAstDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'ImportSpec') {
    const name = goAstImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kind === 'FuncDecl') {
    const name = goAstDeclarationName(node);
    if (!name) return [];
    const receiver = goAstReceiverName(node);
    return [declarationRecord(input, nativeNodeId, receiver ? `${receiver}.${name}` : name, receiver ? 'method' : 'function', node.Body || node.body ? 'definition' : 'declaration')];
  }
  if (kind === 'TypeSpec') {
    const name = goAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, goAstTypeSpecSymbolKind(node), 'definition')] : [];
  }
  if (kind === 'ValueSpec') {
    const names = goAstValueSpecNames(node);
    const token = goAstTokenName(node.parentTok ?? node.Tok ?? node.tok);
    return names.map((name) => declarationRecord(input, nativeNodeId, name, token === 'CONST' || token === 'const' ? 'constant' : 'variable', 'definition'));
  }
  if (kind === 'Field') {
    return goAstValueSpecNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'Package' || kind === 'File') {
    const name = goAstPackageName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'definition')] : [];
  }
  return [];
}

function goAstChildEntries(node) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredGoAstField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (field === 'Files' || field === 'files') {
      if (value && typeof value === 'object') entries.push([field, Array.isArray(value) ? value : Object.values(value)]);
      continue;
    }
    if (field === 'Specs' || field === 'specs') {
      const token = goAstTokenName(node.Tok ?? node.tok);
      entries.push([field, Array.isArray(value)
        ? value.map((entry) => entry && typeof entry === 'object' ? { parentTok: token, ...entry } : entry)
        : value]);
      continue;
    }
    entries.push([field, value]);
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isGoAstNode)
    : isGoAstNode(value));
}

function goAstNodeValue(node) {
  return goAstDeclarationName(node)
    ?? goAstImportPath(node)
    ?? goAstTypeName(node.Type ?? node.type)
    ?? goAstLiteralValue(node);
}

function goAstDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return goAstIdentName(node.Name ?? node.name)
    ?? goAstIdentName(node.Ident ?? node.ident)
    ?? goAstIdentName(node.Sel ?? node.sel)
    ?? (typeof node.Name === 'string' ? node.Name : undefined)
    ?? (typeof node.name === 'string' ? node.name : undefined);
}

function goAstPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return goAstIdentName(node.Name ?? node.name) ?? node.PackageName ?? node.packageName;
}

function goAstIdentName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.Name ?? value.name ?? value.Value ?? value.value;
}

function goAstImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.Path ?? node.path;
  const raw = typeof path === 'string' ? path : path?.Value ?? path?.value ?? path?.Kind;
  if (typeof raw !== 'string') return undefined;
  return raw.replace(/^"|"$/g, '').replace(/^`|`$/g, '');
}

function goAstReceiverName(node) {
  const recv = node?.Recv ?? node?.recv;
  const list = recv?.List ?? recv?.list;
  if (!Array.isArray(list) || !list.length) return undefined;
  const first = list[0];
  return goAstTypeName(first?.Type ?? first?.type);
}

function goAstValueSpecName(node) {
  return goAstValueSpecNames(node)[0];
}

function goAstValueSpecNames(node) {
  const names = node.Names ?? node.names;
  if (Array.isArray(names)) return names.map(goAstIdentName).filter(Boolean);
  const name = goAstDeclarationName(node);
  return name ? [name] : [];
}

function goAstTypeSpecSymbolKind(node) {
  const type = node.Type ?? node.type;
  const kind = goAstKind(type);
  if (kind === 'InterfaceType') return 'interface';
  if (kind === 'StructType') return 'class';
  return 'type';
}

function goAstTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const kind = goAstKind(value);
  if (kind === 'Ident') return goAstIdentName(value);
  if (kind === 'StarExpr') {
    const inner = goAstTypeName(value.X ?? value.x);
    return inner ? `*${inner}` : '*';
  }
  if (kind === 'SelectorExpr') {
    const left = goAstTypeName(value.X ?? value.x);
    const right = goAstIdentName(value.Sel ?? value.sel);
    return [left, right].filter(Boolean).join('.');
  }
  if (kind === 'ArrayType') {
    const inner = goAstTypeName(value.Elt ?? value.elt);
    return `[]${inner ?? 'unknown'}`;
  }
  if (kind === 'MapType') {
    return `map[${goAstTypeName(value.Key ?? value.key) ?? 'unknown'}]${goAstTypeName(value.Value ?? value.value) ?? 'unknown'}`;
  }
  if (kind === 'StructType') return 'struct';
  if (kind === 'InterfaceType') return 'interface';
  if (kind === 'FuncType') return 'func';
  return goAstDeclarationName(value);
}

function goAstTokenName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return value.String ?? value.string ?? value.Name ?? value.name;
}

function goAstLiteralValue(node) {
  const value = node.Value ?? node.value;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function goGeneratedCodeMarker(node, kind) {
  if (kind !== 'File') return false;
  if (node.Generated || node.generated) return true;
  const comments = node.Comments ?? node.comments;
  if (!Array.isArray(comments)) return false;
  return comments.some((group) => JSON.stringify(group).includes('Code generated') && JSON.stringify(group).includes('DO NOT EDIT'));
}

function goBadAstKind(kind) {
  return kind === 'BadDecl' || kind === 'BadExpr' || kind === 'BadStmt';
}

function goReceiverFieldCount(node) {
  const list = (node?.Recv ?? node?.recv)?.List ?? (node?.Recv ?? node?.recv)?.list;
  return Array.isArray(list) ? list.length : 0;
}

function goTypeEvidenceSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  const summary = {};
  if (typeof value.packagePath === 'string') summary.packagePath = value.packagePath;
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (Array.isArray(value.types)) summary.typeCount = value.types.length;
  if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
  return Object.keys(summary).length ? summary : { present: true };
}

function javaAstRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isJavaAstNode(value)) return value;
  if (isJavaAstNode(value.ast)) return value.ast;
  if (isJavaAstNode(value.root)) return value.root;
  if (isJavaAstNode(value.compilationUnit)) return value.compilationUnit;
  if (isJavaAstNode(value.unit)) return value.unit;
  if (isJavaAstNode(value.sourceFile)) return value.sourceFile;
  if (Array.isArray(value.types) || Array.isArray(value.imports) || value.packageDeclaration || value.package) {
    return { kind: 'CompilationUnit', ...value };
  }
  return undefined;
}

function isJavaAstNode(value) {
  return Boolean(value && typeof value === 'object' && typeof javaAstKind(value) === 'string');
}

function javaAstKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node._type ?? node.type ?? node.nodeType ?? node.astKind ?? node.treeKind ?? node.nodeKind;
  if (typeof declared === 'string') return normalizeJavaAstKind(declared);
  if (Array.isArray(node.imports) || Array.isArray(node.types) || node.packageDeclaration || node.package) return 'CompilationUnit';
  if (node.name && (node.members || node.bodyDeclarations || node.extends || node.implements || node.permittedTypes)) return 'ClassDeclaration';
  if (node.name && (node.returnType || node.parameters || node.body) && (node.modifiers || node.thrownExceptions || node.throws)) return 'MethodDeclaration';
  if (node.variables || node.fragments) return 'FieldDeclaration';
  if (node.name && node.type && (node.initializer !== undefined || node.extraDimensions !== undefined)) return 'VariableDeclarator';
  return undefined;
}

function normalizeJavaAstKind(kind) {
  const text = String(kind).replace(/^(?:com\.sun\.source\.tree\.|org\.eclipse\.jdt\.core\.dom\.|com\.github\.javaparser\.ast\.)/, '');
  const compact = text.replace(/[_\s.-]+/g, '').replace(/Tree$/, '').toLowerCase();
  if (compact === 'compilationunit' || compact === 'compilationunitnode') return 'CompilationUnit';
  if (compact === 'package' || compact === 'packagedeclaration' || compact === 'packageclause') return 'PackageDeclaration';
  if (compact === 'import' || compact === 'importdeclaration') return 'ImportDeclaration';
  if (compact === 'class' || compact === 'classdeclaration' || compact === 'normalclassdeclaration' || compact === 'classorinterfacedeclaration') return 'ClassDeclaration';
  if (compact === 'interface' || compact === 'interfacedeclaration' || compact === 'normalinterfacedeclaration') return 'InterfaceDeclaration';
  if (compact === 'enum' || compact === 'enumdeclaration') return 'EnumDeclaration';
  if (compact === 'record' || compact === 'recorddeclaration') return 'RecordDeclaration';
  if (compact === 'annotation' || compact === 'annotationdeclaration' || compact === 'annotationtypedeclaration' || compact === 'annotationinterface') return 'AnnotationDeclaration';
  if (compact === 'method' || compact === 'methoddeclaration') return 'MethodDeclaration';
  if (compact === 'constructor' || compact === 'constructordeclaration') return 'ConstructorDeclaration';
  if (compact === 'variable' || compact === 'variabledeclaration' || compact === 'variabledeclarator' || compact === 'variabletree') return 'VariableDeclarator';
  if (compact === 'field' || compact === 'fielddeclaration') return 'FieldDeclaration';
  if (compact === 'enumconstant' || compact === 'enumconstantdeclaration') return 'EnumConstantDeclaration';
  if (compact === 'parameter' || compact === 'formalparameter' || compact === 'receiverparameter') return 'Parameter';
  if (compact === 'modifiers' || compact === 'modifier') return 'Modifiers';
  if (compact === 'markerannotationexpr' || compact === 'singlememberannotationexpr' || compact === 'normalannotationexpr' || compact === 'annotationexpr') return 'Annotation';
  if (compact === 'erroneous' || compact === 'erroneoustree' || compact === 'malformed' || compact === 'error' || compact === 'errornode' || compact === 'problem' || compact === 'problemtree' || compact === 'recovered') return 'Erroneous';
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}

function ignoredJavaAstField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'astKind'
    || key === 'treeKind'
    || key === 'nodeKind'
    || key === 'parent'
    || key === 'parentKind'
    || key === 'parentField'
    || key === 'binding'
    || key === 'resolvedBinding'
    || key === 'symbol'
    || key === 'scope'
    || key === 'range'
    || key === 'loc'
    || key === 'location'
    || key === 'pos'
    || key === 'end'
    || key === 'start'
    || key === 'endPosition'
    || key === 'startPosition'
    || key === 'length'
    || key === 'name'
    || key === 'identifier'
    || key === 'simpleName'
    || key === 'qualifiedName';
}

function primitiveJavaAstFields(node, kind) {
  const fields = { kind };
  const name = javaAstDeclarationName(node);
  if (name) fields.name = name;
  const importPath = javaAstImportPath(node);
  if (importPath) fields.importPath = importPath;
  const type = javaAstTypeName(node.type ?? node.typeName ?? node.returnType ?? node.elementType);
  if (type) fields.type = type;
  const packageName = javaAstPackageName(node);
  if (packageName) fields.packageName = packageName;
  const modifiers = javaAstModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  if (node.static === true || node.isStatic === true) fields.static = true;
  if (node.default === true || node.isDefault === true) fields.default = true;
  if (node.generated === true || node.Generated === true) fields.generated = true;
  if (typeof node.binaryName === 'string') fields.binaryName = node.binaryName;
  if (typeof node.qualifiedName === 'string') fields.qualifiedName = node.qualifiedName;
  if (Array.isArray(node.parameters)) fields.parameterCount = node.parameters.length;
  if (Array.isArray(node.throws ?? node.thrownExceptions)) fields.throwsCount = (node.throws ?? node.thrownExceptions).length;
  return fields;
}

function spanFromJavaAstNode(node, input, options = {}) {
  const direct = spanFromJavaRange(node.range ?? node.loc ?? node.location, input)
    ?? spanFromJavaLineFields(node, input);
  if (direct) return direct;
  const start = javaAstPosition(
    node.begin ?? node.start ?? node.pos ?? node.position ?? node.startPosition ?? node.name?.range?.begin ?? node.name?.loc?.start,
    options
  );
  const end = javaAstPosition(
    node.end ?? node.endPosition ?? node.stopPosition ?? node.finishPosition ?? node.name?.range?.end ?? node.name?.loc?.end,
    options
  );
  const sourceRange = node.sourceRange ?? node.rangeInfo;
  const sourceStart = javaAstPosition(
    sourceRange?.start ?? sourceRange?.offset ?? sourceRange?.startPosition,
    options
  );
  const sourceEnd = javaAstPosition(
    typeof sourceRange?.offset === 'number' && typeof sourceRange?.length === 'number'
      ? sourceRange.offset + sourceRange.length
      : sourceRange?.end ?? sourceRange?.endPosition,
    options
  );
  const resolvedStart = start ?? sourceStart;
  const resolvedEnd = end ?? sourceEnd;
  if (!resolvedStart) return undefined;
  return {
    sourceId: input.sourceHash,
    path: resolvedStart.path ?? resolvedEnd?.path ?? input.sourcePath,
    startLine: resolvedStart.line,
    startColumn: resolvedStart.column,
    endLine: resolvedEnd?.line,
    endColumn: resolvedEnd?.column
  };
}

function spanFromJavaRange(range, input) {
  if (!range || typeof range !== 'object') return undefined;
  const start = range.begin ?? range.start;
  const end = range.end ?? range.stop;
  if (start && typeof start === 'object') {
    const startLine = start.line ?? start.Line;
    const startColumn = start.column ?? start.col ?? start.Column ?? start.character;
    const endLine = end?.line ?? end?.Line;
    const endColumn = end?.column ?? end?.col ?? end?.Column ?? end?.character;
    if (typeof startLine === 'number') {
      return {
        sourceId: input.sourceHash,
        path: start.path ?? start.file ?? end?.path ?? end?.file ?? input.sourcePath,
        startLine,
        startColumn,
        endLine,
        endColumn
      };
    }
  }
  return undefined;
}

function spanFromJavaLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine ?? node.lineno;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.file ?? node.filename ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn ?? node.col,
    endLine: node.endLine ?? node.end_lineno,
    endColumn: node.endColumn ?? node.end_col_offset
  };
}

function javaAstPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value.pos ?? value.start ?? value;
    const line = position.line ?? position.Line ?? position.lineno;
    const column = position.column ?? position.Column ?? position.col ?? position.character;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.file ?? position.filename ?? position.Filename,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getPosition === 'function'
        ? options.lineMap.getPosition.bind(options.lineMap)
        : typeof options.lineMap?.getLineNumber === 'function'
          ? (offset) => ({
            line: options.lineMap.getLineNumber(offset),
            column: typeof options.lineMap.getColumnNumber === 'function' ? options.lineMap.getColumnNumber(offset) : undefined
          })
          : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return javaAstPosition(resolved, options);
  }
  return undefined;
}

function javaAstPositionKind(node) {
  if (node.range?.begin || node.loc?.start) return 'line-column-range';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  if (node.pos !== undefined || node.startPosition !== undefined) return 'offset-position';
  if (node.sourceRange) return 'source-range';
  return undefined;
}

function javaAstDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'PackageDeclaration') {
    const name = javaAstPackageName(node) ?? javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'definition')] : [];
  }
  if (kind === 'ImportDeclaration') {
    const name = javaAstImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (javaTypeDeclarationKind(kind)) {
    const name = javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, javaTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'MethodDeclaration' || kind === 'ConstructorDeclaration') {
    const name = javaAstDeclarationName(node);
    if (!name) return [];
    return [declarationRecord(input, nativeNodeId, name, 'method', javaAstHasBody(node) ? 'definition' : 'declaration')];
  }
  if (kind === 'FieldDeclaration') {
    return javaAstFieldNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'VariableDeclarator') {
    if (node.parentField === 'parameters' || node.parentKind === 'MethodDeclaration' || node.parentKind === 'ConstructorDeclaration') return [];
    const name = javaAstDeclarationName(node);
    if (!name) return [];
    const symbolKind = node.parentKind === 'FieldDeclaration' || javaTypeDeclarationKind(node.parentKind) ? 'property' : 'variable';
    return [declarationRecord(input, nativeNodeId, name, symbolKind, 'definition')];
  }
  if (kind === 'EnumConstantDeclaration') {
    const name = javaAstDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}

function javaAstChildEntries(node, kind = javaAstKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredJavaAstField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => javaAstChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, javaAstChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isJavaAstNode)
    : isJavaAstNode(value));
}

function javaAstChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isJavaAstNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}

function javaAstNodeValue(node) {
  return javaAstDeclarationName(node)
    ?? javaAstImportPath(node)
    ?? javaAstPackageName(node)
    ?? javaAstTypeName(node.type ?? node.returnType ?? node.elementType)
    ?? javaAstLiteralValue(node);
}

function javaAstDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['name', 'identifier', 'simpleName', 'qualifiedName', 'id']) {
    const value = node[key];
    const name = javaAstName(value);
    if (name) return name;
  }
  if (node.declaration && typeof node.declaration === 'object') return javaAstDeclarationName(node.declaration);
  return undefined;
}

function javaAstName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.simpleName === 'string') return value.simpleName;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (typeof value.fullyQualifiedName === 'string') return value.fullyQualifiedName;
  if (typeof value.id === 'string') return value.id;
  if (typeof value.value === 'string') return value.value;
  if (value.name && value.name !== value) return javaAstName(value.name);
  if (value.identifier && value.identifier !== value) return javaAstName(value.identifier);
  return undefined;
}

function javaAstPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  return javaAstName(node.packageName ?? node.packageDeclaration ?? node.package ?? node.name);
}

function javaAstImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const candidate = node.qualifiedIdentifier ?? node.qualifiedName ?? node.path ?? node.name ?? node.identifier;
  const path = javaAstName(candidate);
  if (!path) return undefined;
  return node.asterisk || node.wildcard || node.onDemand || node.isAsterisk ? `${path.replace(/\.\*$/, '')}.*` : path;
}

function javaAstFieldNames(node) {
  const fragments = node.variables ?? node.fragments ?? node.declarators ?? node.variableDeclarators;
  if (Array.isArray(fragments)) return fragments.map(javaAstDeclarationName).filter(Boolean);
  const name = javaAstDeclarationName(node);
  return name ? [name] : [];
}

function javaAstTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.typeName === 'string') return value.typeName;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (value.elementType) {
    const inner = javaAstTypeName(value.elementType);
    return inner ? `${inner}[]` : '[]';
  }
  if (value.componentType) {
    const inner = javaAstTypeName(value.componentType);
    return inner ? `${inner}[]` : '[]';
  }
  if (Array.isArray(value.typeArguments)) {
    const base = javaAstName(value.name) ?? javaAstName(value);
    const args = value.typeArguments.map(javaAstTypeName).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return javaAstName(value);
}

function javaAstModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers ?? node.flags;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : javaAstName(entry) ?? entry.keyword ?? entry.kind).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}

function javaTypeDeclarationKind(kind) {
  return kind === 'ClassDeclaration'
    || kind === 'InterfaceDeclaration'
    || kind === 'EnumDeclaration'
    || kind === 'RecordDeclaration'
    || kind === 'AnnotationDeclaration';
}

function javaTypeDeclarationSymbolKind(kind) {
  if (kind === 'InterfaceDeclaration' || kind === 'AnnotationDeclaration') return 'interface';
  if (kind === 'ClassDeclaration') return 'class';
  return 'type';
}

function javaAstHasBody(node) {
  return Boolean(node.body || node.block || node.statements || node.defaultValue || Array.isArray(node.bodyDeclarations));
}

function javaAstLiteralValue(node) {
  const value = node.value ?? node.literal ?? node.token;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function javaRecoveredAstKind(kind) {
  return kind === 'Erroneous'
    || /Error|Erroneous|Malformed|Recovered|Problem|Missing/.test(String(kind));
}

function javaProblemNode(node, kind) {
  return Boolean(node.problem || node.error || node.malformed || node.recovered || node.hasError || node.hasErrors || kind === 'Erroneous');
}

function javaGeneratedCodeMarker(node, kind) {
  if (node.generated || node.Generated || node.isGenerated) return true;
  if (kind === 'Annotation') {
    const name = javaAstDeclarationName(node);
    if (name && /(^|\.)(Generated|GeneratedValue)$/.test(name)) return true;
  }
  const annotations = node.annotations ?? node.modifiers?.annotations ?? node.modifiers;
  if (Array.isArray(annotations)) {
    return annotations.some((annotation) => {
      const name = javaAstDeclarationName(annotation) ?? javaAstName(annotation);
      return Boolean(name && /(^|\.)(Generated|GeneratedValue)$/.test(name));
    });
  }
  return false;
}

function javaLombokAnnotationMarker(node, kind) {
  if (kind !== 'Annotation') return false;
  const name = javaAstDeclarationName(node);
  return Boolean(name && /^(lombok\.|Data$|Value$|Builder$|Getter$|Setter$|AllArgsConstructor$|NoArgsConstructor$|RequiredArgsConstructor$)/.test(name));
}

function javaGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'java')}_java_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Java generated-source, annotation-generated, or Lombok-derived code marker was imported; regenerated members and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      annotationProcessing: javaAnnotationProcessingSummary(options.annotationProcessing),
      ...metadata
    }
  };
}

function javaPathEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { entryCount: value.split(/[:;]/).filter(Boolean).length };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.roots)) summary.rootCount = value.roots.length;
    if (typeof value.source === 'string') summary.source = value.source;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}

function javaAnnotationProcessingSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { processorCount: value.length };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.enabled === 'boolean') summary.enabled = value.enabled;
    if (Array.isArray(value.processors)) summary.processorCount = value.processors.length;
    if (Array.isArray(value.generatedSources)) summary.generatedSourceCount = value.generatedSources.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: Boolean(value) };
}

function javaBindingEvidenceSummary(value) {
  if (!value || typeof value !== 'object') return undefined;
  const summary = {};
  if (typeof value.hash === 'string') summary.hash = value.hash;
  if (Array.isArray(value.bindings)) summary.bindingCount = value.bindings.length;
  if (Array.isArray(value.types)) summary.typeCount = value.types.length;
  if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
  if (typeof value.solver === 'string') summary.solver = value.solver;
  return Object.keys(summary).length ? summary : { present: true };
}

function kotlinPsiRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isKotlinPsiNode(value)) return value;
  if (isKotlinPsiNode(value.ast)) return value.ast;
  if (isKotlinPsiNode(value.root)) return value.root;
  if (isKotlinPsiNode(value.rootNode)) return value.rootNode;
  if (isKotlinPsiNode(value.ktFile)) return value.ktFile;
  if (isKotlinPsiNode(value.file)) return value.file;
  if (isKotlinPsiNode(value.sourceFile)) return value.sourceFile;
  if (Array.isArray(value.declarations) || Array.isArray(value.imports) || value.packageDirective) {
    return { kind: 'KtFile', ...value };
  }
  return undefined;
}

function isKotlinPsiNode(value) {
  return Boolean(value && typeof value === 'object' && typeof kotlinPsiKind(value) === 'string');
}

function kotlinPsiKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.nodeType ?? node.elementType ?? node.psiKind ?? node._type ?? node.type;
  if (typeof declared === 'string') return normalizeKotlinPsiKind(declared);
  if (Array.isArray(node.declarations) || Array.isArray(node.imports) || node.packageDirective) return 'KtFile';
  if (node.fqName || node.packageFqName) return 'KtPackageDirective';
  if (node.importedFqName || node.importedReference) return 'KtImportDirective';
  if (node.classKind || node.primaryConstructor || node.superTypeListEntries) return 'KtClass';
  if (node.funKeyword || node.valueParameters || node.bodyExpression) return 'KtNamedFunction';
  if (node.valOrVarKeyword || node.delegateExpression || node.initializer) return 'KtProperty';
  return undefined;
}

function normalizeKotlinPsiKind(kind) {
  const text = String(kind)
    .replace(/^org\.jetbrains\.kotlin\.psi\./, '')
    .replace(/^KtNodeTypes\./, '')
    .replace(/ElementType$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  const known = {
    kotlinfile: 'KtFile',
    ktfile: 'KtFile',
    file: 'KtFile',
    script: 'KtScript',
    ktscript: 'KtScript',
    packagedirective: 'KtPackageDirective',
    ktpackagedirective: 'KtPackageDirective',
    importdirective: 'KtImportDirective',
    ktimportdirective: 'KtImportDirective',
    class: 'KtClass',
    ktclass: 'KtClass',
    classorobject: 'KtClassOrObject',
    ktclassorobject: 'KtClassOrObject',
    objectdeclaration: 'KtObjectDeclaration',
    ktobjectdeclaration: 'KtObjectDeclaration',
    enumentry: 'KtEnumEntry',
    ktenumentry: 'KtEnumEntry',
    namedfunction: 'KtNamedFunction',
    ktnamedfunction: 'KtNamedFunction',
    function: 'KtNamedFunction',
    property: 'KtProperty',
    ktproperty: 'KtProperty',
    typealias: 'KtTypeAlias',
    kttypealias: 'KtTypeAlias',
    parameter: 'KtParameter',
    ktparameter: 'KtParameter',
    primaryconstructor: 'KtPrimaryConstructor',
    ktprimaryconstructor: 'KtPrimaryConstructor',
    secondaryconstructor: 'KtSecondaryConstructor',
    ktsecondaryconstructor: 'KtSecondaryConstructor',
    classinitializer: 'KtClassInitializer',
    ktclassinitializer: 'KtClassInitializer',
    annotationentry: 'KtAnnotationEntry',
    ktannotationentry: 'KtAnnotationEntry',
    contracteffect: 'KtContractEffect',
    ktcontracteffect: 'KtContractEffect',
    contractdescription: 'KtContractDescription',
    ktcontractdescription: 'KtContractDescription',
    error: 'PsiErrorElement',
    psierror: 'PsiErrorElement',
    psierrorelement: 'PsiErrorElement'
  };
  if (known[compact]) return known[compact];
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}

function ignoredKotlinPsiField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'nodeType'
    || key === 'elementType'
    || key === 'psiKind'
    || key === 'parent'
    || key === 'parentKind'
    || key === 'parentField'
    || key === 'textRange'
    || key === 'range'
    || key === 'span'
    || key === 'location'
    || key === 'name'
    || key === 'nameIdentifier'
    || key === 'identifier'
    || key === 'fqName'
    || key === 'packageFqName'
    || key === 'analysisSymbol'
    || key === 'symbol'
    || key === 'typeInfo'
    || key === 'bindingContext'
    || key === 'fir'
    || key === 'ir';
}

function visitKotlinPsiNode(node, context, propertyPath) {
  if (!isKotlinPsiNode(node) || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  const kind = kotlinPsiKind(node);
  const span = spanFromKotlinPsiNode(node, context.input, context.options);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  for (const [field, value] of kotlinPsiChildEntries(node, kind)) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        const childId = visitKotlinPsiNode(entry, context, `${propertyPath}.${field}[${index}]`);
        if (childId) children.push(childId);
      });
    } else {
      const childId = visitKotlinPsiNode(value, context, `${propertyPath}.${field}`);
      if (childId) children.push(childId);
    }
  }
  const declarations = kotlinPsiDeclarations(node, kind, id, context.input);
  const declaration = declarations[0];
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? kotlinPsiNodeValue(node),
    fields: primitiveKotlinPsiFields(node, kind),
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      positionKind: kotlinPsiPositionKind(node),
      parser: context.options.parser
    }
  };
  context.nodes[id] = nativeNode;
  for (const entry of declarations) {
    context.declarations.push({ ...entry, nativeNode });
  }
  if (kotlinPsiRecoveredKind(kind) || kotlinPsiProblemNode(node, kind)) {
    context.losses.push({
      id: `loss_${idFragment(id)}_kotlin_psi_recovered_node`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: 'Kotlin PSI reported an error or recovered syntax node; semantic import is partial until syntax errors are resolved.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind
      }
    });
  }
  if (kotlinExpectActualNode(node, kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'expect-actual',
      message: 'Kotlin expect/actual syntax was imported; matching platform declarations requires multiplatform build evidence.'
    }));
  }
  if (kotlinCoroutineNode(node, kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'coroutine',
      message: 'Kotlin coroutine syntax was imported; suspend lowering, scheduling, and effect semantics require host compiler/runtime evidence.'
    }));
  }
  if (kotlinContractNode(kind)) {
    context.losses.push(kotlinUnsupportedSemanticLoss(context.input, id, span, context.options, {
      nodeKind: kind,
      feature: 'contract',
      message: 'Kotlin contract syntax was imported; data-flow effects require Analysis API or compiler evidence.'
    }));
  }
  if (kotlinCompilerPluginAnnotationNode(node, kind) && !context.options.compilerPluginEvidence) {
    context.losses.push({
      id: `loss_${idFragment(id)}_kotlin_compiler_plugin_semantics`,
      severity: 'warning',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'metaprogramming',
      message: 'Kotlin compiler-plugin-style annotation was imported; generated declarations and transformed semantics require compiler plugin evidence.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        nodeKind: kind,
        annotations: kotlinPsiAnnotationNames(node)
      }
    });
  }
  if (kotlinGeneratedCodeMarker(node, kind)) {
    context.losses.push(kotlinGeneratedCodeLoss(context.input, id, span, context.options, { nodeKind: kind }));
  }
  return id;
}

function primitiveKotlinPsiFields(node, kind) {
  const fields = { kind };
  const name = kotlinPsiDeclarationName(node, kind);
  if (name) fields.name = name;
  const importPath = kotlinPsiImportPath(node);
  if (importPath) fields.importPath = importPath;
  const packageName = kotlinPsiPackageName(node);
  if (packageName) fields.packageName = packageName;
  const type = kotlinPsiTypeName(node.typeReference ?? node.returnTypeRef ?? node.returnType ?? node.type);
  if (type) fields.type = type;
  const receiver = kotlinPsiTypeName(node.receiverTypeReference ?? node.receiverTypeRef);
  if (receiver) fields.receiverType = receiver;
  const modifiers = kotlinPsiModifiers(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const annotations = kotlinPsiAnnotationNames(node);
  if (annotations.length) fields.annotations = annotations.join(',');
  if (node.generated === true || node.isGenerated === true) fields.generated = true;
  if (node.isScript === true || kind === 'KtScript') fields.script = true;
  if (Array.isArray(node.typeParameters ?? node.typeParameterList?.parameters)) fields.typeParameterCount = (node.typeParameters ?? node.typeParameterList?.parameters).length;
  if (Array.isArray(node.valueParameters ?? node.valueParameterList?.parameters ?? node.parameters)) fields.parameterCount = (node.valueParameters ?? node.valueParameterList?.parameters ?? node.parameters).length;
  if (Array.isArray(node.superTypeListEntries ?? node.superTypes)) fields.superTypeCount = (node.superTypeListEntries ?? node.superTypes).length;
  return fields;
}

function spanFromKotlinPsiNode(node, input, options = {}) {
  const direct = spanFromKotlinLineFields(node, input);
  if (direct) return direct;
  const range = node.sourceRange ?? node.range ?? node.span ?? node.textRange;
  const fromRange = spanFromKotlinRange(range, input);
  if (fromRange) return fromRange;
  const start = kotlinPsiPosition(node.start ?? node.startOffset ?? range?.startOffset ?? range?.start, options);
  const end = kotlinPsiPosition(node.end ?? node.endOffset ?? range?.endOffset ?? range?.end, options);
  if (!start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: start.path ?? end?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end?.line,
    endColumn: end?.column
  };
}

function spanFromKotlinLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.filePath ?? node.file ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn,
    endLine: node.endLine,
    endColumn: node.endColumn
  };
}

function spanFromKotlinRange(range, input) {
  if (!range || typeof range !== 'object') return undefined;
  const start = range.start ?? range.startPosition ?? range.lowerBound ?? range.begin;
  const end = range.end ?? range.endPosition ?? range.upperBound;
  const line = start?.line ?? start?.Line;
  if (typeof line !== 'number') return undefined;
  const column = start.column ?? start.character ?? start.offset ?? start.Column;
  const endLine = end?.line ?? end?.Line;
  const endColumn = end?.column ?? end?.character ?? end?.offset ?? end?.Column;
  return {
    sourceId: input.sourceHash,
    path: range.path ?? range.filePath ?? range.file ?? input.sourcePath,
    startLine: line,
    startColumn: typeof column === 'number' ? column : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endColumn === 'number' ? endColumn : undefined
  };
}

function kotlinPsiPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.location ?? value;
    const line = position.line ?? position.Line;
    const column = position.column ?? position.character ?? position.Column;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.filePath ?? position.file,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getLineAndColumn === 'function'
        ? options.lineMap.getLineAndColumn.bind(options.lineMap)
        : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return kotlinPsiPosition(resolved, options);
  }
  return undefined;
}

function kotlinPsiPositionKind(node) {
  if (node.textRange || node.range) return 'text-range';
  if (typeof node.startOffset === 'number') return 'offset';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}

function kotlinPsiDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'KtPackageDirective') {
    const name = kotlinPsiPackageName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'namespace', 'definition')] : [];
  }
  if (kind === 'KtImportDirective') {
    const name = kotlinPsiImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kotlinPsiTypeDeclarationKind(kind)) {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, kotlinPsiTypeDeclarationSymbolKind(node, kind), 'definition')] : [];
  }
  if (kind === 'KtTypeAlias') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (kind === 'KtNamedFunction') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, node.parentKind && kotlinPsiTypeDeclarationKind(node.parentKind) ? 'method' : 'function', kotlinPsiHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'KtProperty') {
    return kotlinPsiVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'KtParameter' && node.parentKind === 'KtPrimaryConstructor') {
    return kotlinPsiVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'KtPrimaryConstructor' || kind === 'KtSecondaryConstructor') {
    return [declarationRecord(input, nativeNodeId, kotlinPsiDeclarationName(node, kind) ?? 'constructor', 'method', 'definition')];
  }
  if (kind === 'KtEnumEntry') {
    const name = kotlinPsiDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}

function kotlinPsiChildEntries(node, kind = kotlinPsiKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredKotlinPsiField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => kotlinPsiChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, kotlinPsiChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isKotlinPsiNode)
    : isKotlinPsiNode(value));
}

function kotlinPsiChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isKotlinPsiNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}

function kotlinPsiNodeValue(node) {
  return kotlinPsiDeclarationName(node, kotlinPsiKind(node))
    ?? kotlinPsiImportPath(node)
    ?? kotlinPsiPackageName(node)
    ?? kotlinPsiTypeName(node.typeReference ?? node.returnTypeRef ?? node.type);
}

function kotlinPsiDeclarationName(node, kind = kotlinPsiKind(node)) {
  if (!node || typeof node !== 'object') return undefined;
  if (kind === 'KtPrimaryConstructor' || kind === 'KtSecondaryConstructor') return 'constructor';
  if (kind === 'KtClassInitializer') return 'init';
  if (kind === 'KtObjectDeclaration' && node.isCompanion === true && !node.name && !node.nameIdentifier) return 'companion object';
  for (const key of ['nameIdentifier', 'identifier', 'name', 'simpleName', 'classId', 'fqName', 'id']) {
    const name = kotlinPsiName(node[key]);
    if (name) return name;
  }
  const variable = kotlinPsiVariableNames(node)[0];
  if (variable) return variable;
  return undefined;
}

function kotlinPsiName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.asString === 'string') return value.asString;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.value === 'string') return value.value;
  if (typeof value.fqName === 'string') return value.fqName;
  if (value.shortName && value.shortName !== value) return kotlinPsiName(value.shortName);
  if (value.name && value.name !== value) return kotlinPsiName(value.name);
  if (value.identifier && value.identifier !== value) return kotlinPsiName(value.identifier);
  return undefined;
}

function kotlinPsiImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.importedFqName ?? node.importedReference ?? node.importPath ?? node.path ?? node.name;
  if (typeof path === 'string') return path;
  if (path && typeof path === 'object') return kotlinPsiName(path.fqName ?? path.name ?? path);
  return undefined;
}

function kotlinPsiPackageName(node) {
  if (!node || typeof node !== 'object') return undefined;
  const value = node.packageFqName ?? node.fqName ?? node.qualifiedName ?? node.packageName;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return kotlinPsiName(value);
  return undefined;
}

function kotlinPsiVariableNames(node) {
  const variables = node.variables ?? node.entries ?? node.declarations;
  if (Array.isArray(variables)) return variables.map(kotlinPsiDeclarationName).filter(Boolean);
  const name = kotlinPsiName(node.nameIdentifier ?? node.identifier ?? node.name);
  return name ? [name] : [];
}

function kotlinPsiTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text.trim();
  if (typeof value.name === 'string') return value.name;
  if (typeof value.fqName === 'string') return value.fqName;
  if (value.typeElement) return kotlinPsiTypeName(value.typeElement);
  if (value.typeReference) return kotlinPsiTypeName(value.typeReference);
  if (value.referencedName) return kotlinPsiName(value.referencedName);
  if (value.constructorReferenceExpression) return kotlinPsiTypeName(value.constructorReferenceExpression);
  if (Array.isArray(value.typeArguments) || Array.isArray(value.arguments)) {
    const base = kotlinPsiName(value.name ?? value.referencedName ?? value.constructorReferenceExpression);
    const args = (value.typeArguments ?? value.arguments).map((entry) => kotlinPsiTypeName(entry.typeReference ?? entry)).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return kotlinPsiName(value);
}

function kotlinPsiModifiers(node) {
  const raw = node.modifiers ?? node.modifierList?.modifiers ?? node.modifierList?.children;
  const names = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const name = typeof entry === 'string' ? entry : kotlinPsiName(entry) ?? entry?.keyword ?? entry?.tokenType ?? entry?.text;
      if (name) names.push(String(name).toLowerCase());
    }
  } else if (typeof raw === 'string') {
    names.push(...raw.split(/\s+/).filter(Boolean).map((entry) => entry.toLowerCase()));
  } else if (raw && typeof raw === 'object') {
    for (const [key, enabled] of Object.entries(raw)) {
      if (enabled === true) names.push(key.toLowerCase());
    }
  }
  for (const key of ['suspend', 'expect', 'actual', 'inline', 'operator', 'infix', 'tailrec', 'external', 'override', 'data', 'sealed', 'value']) {
    if (node[key] === true || node[`is${upperFirst(key)}`] === true) names.push(key);
  }
  return uniqueStrings(names.map((entry) => entry.replace(/keyword$/i, '').replace(/_keyword$/i, '').replace(/[_\s-]+/g, '').toLowerCase()).filter(Boolean));
}

function kotlinPsiAnnotationNames(node) {
  const entries = node.annotationEntries ?? node.annotations ?? node.modifierList?.annotationEntries;
  if (!entries) return [];
  if (Array.isArray(entries)) {
    return uniqueStrings(entries.map((entry) => typeof entry === 'string' ? entry : kotlinPsiName(entry.shortName ?? entry.calleeExpression ?? entry.typeReference ?? entry.name ?? entry)).filter(Boolean));
  }
  return [];
}

function kotlinPsiTypeDeclarationKind(kind) {
  return kind === 'KtClass'
    || kind === 'KtClassOrObject'
    || kind === 'KtObjectDeclaration';
}

function kotlinPsiTypeDeclarationSymbolKind(node, kind) {
  const classKind = String(node.classKind ?? node.kindKeyword ?? '').toLowerCase();
  if (kind === 'KtObjectDeclaration') return 'class';
  if (classKind.includes('interface')) return 'interface';
  if (classKind.includes('enum')) return 'enum';
  if (classKind.includes('annotation')) return 'type';
  return 'class';
}

function kotlinPsiHasBody(node) {
  return Boolean(node.bodyExpression || node.bodyBlockExpression || node.body || Array.isArray(node.statements));
}

function kotlinPsiRecoveredKind(kind) {
  return kind === 'PsiErrorElement'
    || kind === 'KtErrorElement'
    || /Error|Recovery|Incomplete|Missing|Skipped/.test(String(kind));
}

function kotlinPsiProblemNode(node, kind) {
  return Boolean(
    node.hasError
    || node.containsDiagnostics
    || node.containsSkippedText
    || node.isMissing
    || kind === 'PsiErrorElement'
    || kind === 'KtErrorElement'
  );
}

function kotlinExpectActualNode(node) {
  const modifiers = kotlinPsiModifiers(node);
  return modifiers.includes('expect') || modifiers.includes('actual');
}

function kotlinCoroutineNode(node, kind) {
  const modifiers = kotlinPsiModifiers(node);
  return modifiers.includes('suspend')
    || /Coroutine|Suspend/i.test(String(kind))
    || node.isSuspend === true
    || node.suspend === true;
}

function kotlinContractNode(kind) {
  return /Contract/i.test(String(kind));
}

function kotlinCompilerPluginAnnotationNode(node) {
  const names = kotlinPsiAnnotationNames(node);
  return names.some((name) => /^(Composable|Serializable|Parcelize|Entity|Immutable|Stable|AutoService|AssistedInject|Hilt|Inject|Room|KSerializable)$/i.test(name.replace(/^.*\./, '')));
}

function kotlinGeneratedCodeMarker(node) {
  if (node.generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  return kotlinGeneratedSourcePath(path);
}

function kotlinGeneratedSourcePath(path) {
  return typeof path === 'string' && (/(\.g|\.generated)\.kts?$/i.test(path) || /[\/\\](build|generated|ksp|kapt)[\/\\]/i.test(path));
}

function kotlinGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Kotlin generated-source marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      kspEvidence: kotlinEvidenceSummary(options.kspEvidence),
      kaptEvidence: kotlinEvidenceSummary(options.kaptEvidence),
      compilerPluginEvidence: kotlinEvidenceSummary(options.compilerPluginEvidence),
      ...metadata
    }
  };
}

function kotlinScriptLoss(input, nodeId, span, options = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_script_semantics`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'unsupportedSemantic',
    message: 'Kotlin script source was imported; script templates, implicit receivers, dependencies, and host execution environment require build/runtime evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      feature: 'script',
      unsupportedSemanticKind: 'kotlin.scriptContext',
      script: true,
      buildVariantEvidence: kotlinEvidenceSummary(options.buildVariantEvidence)
    }
  };
}

function kotlinUnsupportedSemanticLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'kotlin')}_kotlin_${idFragment(metadata.feature ?? 'semantic')}`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'unsupportedSemantic',
    message: metadata.message ?? 'Kotlin semantic feature requires host compiler evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      unsupportedSemanticKind: metadata.unsupportedSemanticKind ?? `kotlin.${idFragment(metadata.feature ?? 'semantic')}`,
      analysisApiEvidence: kotlinEvidenceSummary(options.analysisApiEvidence),
      firEvidence: kotlinEvidenceSummary(options.firEvidence),
      multiplatformEvidence: kotlinEvidenceSummary(options.multiplatformEvidence),
      ...metadata
    }
  };
}

function kotlinEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { value };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.solver === 'string') summary.solver = value.solver;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.symbols)) summary.symbolCount = value.symbols.length;
    if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
    if (Array.isArray(value.types)) summary.typeCount = value.types.length;
    if (Array.isArray(value.diagnostics)) summary.diagnosticCount = value.diagnostics.length;
    if (Array.isArray(value.plugins)) summary.pluginCount = value.plugins.length;
    if (Array.isArray(value.generatedSources)) summary.generatedSourceCount = value.generatedSources.length;
    if (Array.isArray(value.platforms)) summary.platformCount = value.platforms.length;
    if (Array.isArray(value.variants)) summary.variantCount = value.variants.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}

function csharpRoslynRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isCSharpRoslynNode(value)) return value;
  if (isCSharpRoslynNode(value.ast)) return value.ast;
  if (isCSharpRoslynNode(value.root)) return value.root;
  if (isCSharpRoslynNode(value.rootNode)) return value.rootNode;
  if (isCSharpRoslynNode(value.compilationUnit)) return value.compilationUnit;
  if (isCSharpRoslynNode(value.syntaxTree)) return csharpRoslynRoot(value.syntaxTree);
  if (isCSharpRoslynNode(value.tree)) return csharpRoslynRoot(value.tree);
  if (Array.isArray(value.members) || Array.isArray(value.usings) || Array.isArray(value.externs)) {
    return { kind: 'CompilationUnit', ...value };
  }
  return undefined;
}

function isCSharpRoslynNode(value) {
  return Boolean(value && typeof value === 'object' && typeof csharpRoslynKind(value) === 'string');
}

function csharpRoslynKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.Kind ?? node._type ?? node.type ?? node.nodeType ?? node.syntaxKind ?? node.SyntaxKind;
  if (typeof declared === 'string') return normalizeCSharpRoslynKind(declared);
  if (Array.isArray(node.members) || Array.isArray(node.usings) || Array.isArray(node.externs)) return 'CompilationUnit';
  if (node.identifier && (node.members || node.baseList || node.parameterList || node.modifiers)) return 'ClassDeclaration';
  if (node.declaration && (node.eventKeyword || node.eventField)) return 'EventFieldDeclaration';
  if (node.declaration && Array.isArray(node.declaration.variables)) return 'FieldDeclaration';
  return undefined;
}

function normalizeCSharpRoslynKind(kind) {
  const text = String(kind)
    .replace(/^(?:Microsoft\.CodeAnalysis\.CSharp\.Syntax\.|Microsoft\.CodeAnalysis\.CSharp\.)/, '')
    .replace(/Syntax$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  if (compact === 'compilationunit') return 'CompilationUnit';
  if (compact === 'usingdirective') return 'UsingDirective';
  if (compact === 'namespacedeclaration') return 'NamespaceDeclaration';
  if (compact === 'filescopednamespacedeclaration') return 'FileScopedNamespaceDeclaration';
  if (compact === 'classdeclaration') return 'ClassDeclaration';
  if (compact === 'interfacedeclaration') return 'InterfaceDeclaration';
  if (compact === 'structdeclaration') return 'StructDeclaration';
  if (compact === 'recorddeclaration') return 'RecordDeclaration';
  if (compact === 'recordstructdeclaration') return 'RecordStructDeclaration';
  if (compact === 'enumdeclaration') return 'EnumDeclaration';
  if (compact === 'methoddeclaration') return 'MethodDeclaration';
  if (compact === 'constructordeclaration') return 'ConstructorDeclaration';
  if (compact === 'destructordeclaration') return 'DestructorDeclaration';
  if (compact === 'operatordeclaration') return 'OperatorDeclaration';
  if (compact === 'conversionoperatordeclaration') return 'ConversionOperatorDeclaration';
  if (compact === 'propertydeclaration') return 'PropertyDeclaration';
  if (compact === 'indexerdeclaration') return 'IndexerDeclaration';
  if (compact === 'fielddeclaration') return 'FieldDeclaration';
  if (compact === 'variabledeclarator') return 'VariableDeclarator';
  if (compact === 'eventdeclaration') return 'EventDeclaration';
  if (compact === 'eventfielddeclaration') return 'EventFieldDeclaration';
  if (compact === 'delegatedeclaration') return 'DelegateDeclaration';
  if (compact === 'enummemberdeclaration') return 'EnumMemberDeclaration';
  if (compact === 'attributelist') return 'AttributeList';
  if (compact === 'attribute') return 'Attribute';
  if (compact === 'parameter') return 'Parameter';
  if (compact === 'incompletemember') return 'IncompleteMember';
  if (compact === 'skippedtokenstrivia' || compact === 'skippedtokens') return 'SkippedTokensTrivia';
  if (compact.endsWith('directivetrivia')) return `${upperFirst(compact.slice(0, -'directivetrivia'.length))}DirectiveTrivia`;
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}

function ignoredCSharpRoslynField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'Kind'
    || key === 'nodeType'
    || key === 'syntaxKind'
    || key === 'SyntaxKind'
    || key === 'rawKind'
    || key === 'RawKind'
    || key === 'parent'
    || key === 'parentKind'
    || key === 'parentField'
    || key === 'span'
    || key === 'Span'
    || key === 'fullSpan'
    || key === 'FullSpan'
    || key === 'lineSpan'
    || key === 'location'
    || key === 'locations'
    || key === 'identifier'
    || key === 'name'
    || key === 'simpleName'
    || key === 'qualifiedName'
    || key === 'semanticModel'
    || key === 'symbol'
    || key === 'declaredSymbol'
    || key === 'typeInfo'
    || key === 'conversion'
    || key === 'constantValue';
}

function primitiveCSharpRoslynFields(node, kind) {
  const fields = { kind };
  const name = csharpRoslynDeclarationName(node);
  if (name) fields.name = name;
  const importPath = csharpRoslynUsingPath(node);
  if (importPath) fields.importPath = importPath;
  const type = csharpRoslynTypeName(node.type ?? node.Type ?? node.returnType ?? node.ReturnType);
  if (type) fields.type = type;
  const modifiers = csharpRoslynModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const alias = csharpRoslynName(node.alias ?? node.Alias);
  if (alias) fields.alias = alias;
  if (node.static === true || node.isStatic === true) fields.static = true;
  if (node.global === true || node.isGlobal === true) fields.global = true;
  if (node.generated === true || node.Generated === true) fields.generated = true;
  if (node.containsDiagnostics === true || node.ContainsDiagnostics === true) fields.containsDiagnostics = true;
  if (node.containsSkippedText === true || node.ContainsSkippedText === true) fields.containsSkippedText = true;
  if (node.isMissing === true || node.IsMissing === true) fields.isMissing = true;
  if (Array.isArray(node.parameterList?.parameters ?? node.parameters)) fields.parameterCount = (node.parameterList?.parameters ?? node.parameters).length;
  if (Array.isArray(node.attributeLists)) fields.attributeListCount = node.attributeLists.length;
  return fields;
}

function spanFromCSharpRoslynNode(node, input, options = {}) {
  const lineSpan = node.lineSpan ?? node.location?.lineSpan ?? node.location?.LineSpan ?? node.FileLinePositionSpan;
  const fromLineSpan = spanFromCSharpLineSpan(lineSpan, input);
  if (fromLineSpan) return fromLineSpan;
  const direct = spanFromCSharpLineFields(node, input);
  if (direct) return direct;
  const start = csharpRoslynPosition(node.start ?? node.Start ?? node.span?.start ?? node.Span?.Start ?? node.position, options);
  const end = csharpRoslynPosition(node.end ?? node.End ?? node.span?.end ?? node.Span?.End, options);
  if (!start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: start.path ?? end?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end?.line,
    endColumn: end?.column
  };
}

function spanFromCSharpLineSpan(lineSpan, input) {
  if (!lineSpan || typeof lineSpan !== 'object') return undefined;
  const start = lineSpan.startLinePosition ?? lineSpan.StartLinePosition ?? lineSpan.start ?? lineSpan.Start;
  const end = lineSpan.endLinePosition ?? lineSpan.EndLinePosition ?? lineSpan.end ?? lineSpan.End;
  const line = start?.line ?? start?.Line;
  if (typeof line !== 'number') return undefined;
  const character = start.character ?? start.Character ?? start.column ?? start.Column;
  const endLine = end?.line ?? end?.Line;
  const endCharacter = end?.character ?? end?.Character ?? end?.column ?? end?.Column;
  return {
    sourceId: input.sourceHash,
    path: lineSpan.path ?? lineSpan.filePath ?? lineSpan.FilePath ?? input.sourcePath,
    startLine: line + 1,
    startColumn: typeof character === 'number' ? character + 1 : undefined,
    endLine: typeof endLine === 'number' ? endLine + 1 : undefined,
    endColumn: typeof endCharacter === 'number' ? endCharacter + 1 : undefined
  };
}

function spanFromCSharpLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.filePath ?? node.file ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn,
    endLine: node.endLine,
    endColumn: node.endColumn
  };
}

function csharpRoslynPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.Position ?? value;
    const line = position.line ?? position.Line;
    const column = position.column ?? position.Column ?? position.character ?? position.Character;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.filePath ?? position.FilePath ?? position.file,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.lineMap?.getLinePosition === 'function'
        ? options.lineMap.getLinePosition.bind(options.lineMap)
        : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return csharpRoslynPosition(resolved, options);
  }
  return undefined;
}

function csharpRoslynPositionKind(node) {
  if (node.lineSpan || node.location?.lineSpan) return 'line-position-span';
  if (node.span || node.Span) return 'text-span';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}

function csharpRoslynDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'UsingDirective') {
    const name = csharpRoslynUsingPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (kind === 'NamespaceDeclaration' || kind === 'FileScopedNamespaceDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'namespace', 'definition')] : [];
  }
  if (csharpRoslynTypeDeclarationKind(kind)) {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, csharpRoslynTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'DelegateDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (csharpRoslynMethodLikeKind(kind)) {
    const name = csharpRoslynDeclarationName(node) ?? csharpRoslynOperatorName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'method', csharpRoslynHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'PropertyDeclaration' || kind === 'IndexerDeclaration') {
    const name = csharpRoslynDeclarationName(node) ?? (kind === 'IndexerDeclaration' ? 'this[]' : undefined);
    return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
  }
  if (kind === 'FieldDeclaration') {
    return csharpRoslynVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'EventDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'event', 'definition')] : [];
  }
  if (kind === 'EventFieldDeclaration') {
    return csharpRoslynVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'event', 'definition'));
  }
  if (kind === 'VariableDeclarator') {
    if (node.parentKind === 'FieldDeclaration') {
      const name = csharpRoslynDeclarationName(node);
      return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
    }
    if (node.parentKind === 'EventFieldDeclaration') {
      const name = csharpRoslynDeclarationName(node);
      return name ? [declarationRecord(input, nativeNodeId, name, 'event', 'definition')] : [];
    }
    return [];
  }
  if (kind === 'EnumMemberDeclaration') {
    const name = csharpRoslynDeclarationName(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}

function csharpRoslynChildEntries(node, kind = csharpRoslynKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredCSharpRoslynField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => csharpRoslynChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, csharpRoslynChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isCSharpRoslynNode)
    : isCSharpRoslynNode(value));
}

function csharpRoslynChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isCSharpRoslynNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}

function csharpRoslynNodeValue(node) {
  return csharpRoslynDeclarationName(node)
    ?? csharpRoslynUsingPath(node)
    ?? csharpRoslynTypeName(node.type ?? node.returnType)
    ?? csharpRoslynLiteralValue(node);
}

function csharpRoslynDeclarationName(node) {
  if (!node || typeof node !== 'object') return undefined;
  for (const key of ['identifier', 'name', 'simpleName', 'qualifiedName', 'id']) {
    const value = node[key];
    const name = csharpRoslynName(value);
    if (name) return name;
  }
  if (node.declaration && typeof node.declaration === 'object') return csharpRoslynDeclarationName(node.declaration);
  return undefined;
}

function csharpRoslynName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.valueText === 'string') return value.valueText;
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (typeof value.value === 'string') return value.value;
  if (value.identifier && value.identifier !== value) return csharpRoslynName(value.identifier);
  if (value.name && value.name !== value) return csharpRoslynName(value.name);
  return undefined;
}

function csharpRoslynUsingPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  return csharpRoslynName(node.name ?? node.Name ?? node.qualifiedName ?? node.path);
}

function csharpRoslynVariableNames(node) {
  const variables = node.variables
    ?? node.declaration?.variables
    ?? node.Declaration?.Variables
    ?? node.variableDeclarators;
  if (Array.isArray(variables)) return variables.map(csharpRoslynDeclarationName).filter(Boolean);
  const name = csharpRoslynDeclarationName(node);
  return name ? [name] : [];
}

function csharpRoslynTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.valueText === 'string') return value.valueText;
  if (typeof value.qualifiedName === 'string') return value.qualifiedName;
  if (value.elementType) {
    const inner = csharpRoslynTypeName(value.elementType);
    return inner ? `${inner}[]` : '[]';
  }
  if (Array.isArray(value.typeArgumentList?.arguments ?? value.typeArguments)) {
    const base = csharpRoslynName(value.name) ?? csharpRoslynName(value);
    const args = (value.typeArgumentList?.arguments ?? value.typeArguments).map(csharpRoslynTypeName).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return csharpRoslynName(value);
}

function csharpRoslynModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : csharpRoslynName(entry) ?? entry.kind).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}

function csharpRoslynTypeDeclarationKind(kind) {
  return kind === 'ClassDeclaration'
    || kind === 'InterfaceDeclaration'
    || kind === 'StructDeclaration'
    || kind === 'RecordDeclaration'
    || kind === 'RecordStructDeclaration'
    || kind === 'EnumDeclaration';
}

function csharpRoslynTypeDeclarationSymbolKind(kind) {
  if (kind === 'ClassDeclaration' || kind === 'RecordDeclaration') return 'class';
  if (kind === 'InterfaceDeclaration') return 'interface';
  return 'type';
}

function csharpRoslynMethodLikeKind(kind) {
  return kind === 'MethodDeclaration'
    || kind === 'ConstructorDeclaration'
    || kind === 'DestructorDeclaration'
    || kind === 'OperatorDeclaration'
    || kind === 'ConversionOperatorDeclaration';
}

function csharpRoslynHasBody(node) {
  return Boolean(node.body || node.expressionBody || node.accessorList || Array.isArray(node.statements));
}

function csharpRoslynOperatorName(node, kind) {
  if (kind === 'ConstructorDeclaration') return csharpRoslynDeclarationName(node);
  if (kind === 'DestructorDeclaration') return `~${csharpRoslynDeclarationName(node) ?? 'destructor'}`;
  if (kind === 'OperatorDeclaration') return `operator ${csharpRoslynName(node.operatorToken) ?? csharpRoslynName(node.operatorKeyword) ?? 'operator'}`;
  if (kind === 'ConversionOperatorDeclaration') return `operator ${csharpRoslynTypeName(node.type) ?? 'conversion'}`;
  return undefined;
}

function csharpRoslynLiteralValue(node) {
  const value = node.value ?? node.literal;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function csharpRoslynRecoveredKind(kind) {
  return kind === 'IncompleteMember'
    || kind === 'SkippedTokensTrivia'
    || /Skipped|Missing|Bad|Incomplete/.test(String(kind));
}

function csharpRoslynProblemNode(node, kind) {
  return Boolean(
    node.containsDiagnostics
    || node.ContainsDiagnostics
    || node.containsSkippedText
    || node.ContainsSkippedText
    || node.isMissing
    || node.IsMissing
    || node.hasDiagnostics
    || node.HasDiagnostics
    || kind === 'IncompleteMember'
    || kind === 'SkippedTokensTrivia'
  );
}

function csharpRoslynDirectiveKind(kind) {
  return /DirectiveTrivia$/.test(String(kind)) || /^(IfDirective|ElifDirective|ElseDirective|EndIfDirective|DefineDirective|UndefDirective|NullableDirective|RegionDirective|EndRegionDirective|PragmaWarningDirective|LineDirective|ErrorDirective|WarningDirective|LoadDirective|ReferenceDirective)/.test(String(kind));
}

function csharpGeneratedCodeMarker(node, kind) {
  if (node.generated || node.Generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  if (csharpGeneratedSourcePath(path)) return true;
  if (kind === 'Attribute') {
    const name = csharpRoslynDeclarationName(node);
    if (name && /(^|\.)(GeneratedCode|CompilerGenerated|DebuggerNonUserCode)Attribute?$/.test(name)) return true;
  }
  const attributes = node.attributeLists ?? node.attributes;
  if (Array.isArray(attributes)) {
    return JSON.stringify(attributes).includes('GeneratedCode')
      || JSON.stringify(attributes).includes('CompilerGenerated');
  }
  return false;
}

function csharpGeneratedSourcePath(path) {
  return typeof path === 'string' && /\.(g|generated|designer)\.cs$/i.test(path);
}

function csharpGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'csharp')}_csharp_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'C# generated-source or source-generator marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      sourceGeneratorEvidence: csharpEvidenceSummary(options.sourceGeneratorEvidence),
      ...metadata
    }
  };
}

function csharpEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { value };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.solver === 'string') summary.solver = value.solver;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
    if (Array.isArray(value.symbols)) summary.symbolCount = value.symbols.length;
    if (Array.isArray(value.diagnostics)) summary.diagnosticCount = value.diagnostics.length;
    if (Array.isArray(value.generators)) summary.generatorCount = value.generators.length;
    if (Array.isArray(value.projects)) summary.projectCount = value.projects.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}

function swiftSyntaxRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isSwiftSyntaxNode(value)) return value;
  if (isSwiftSyntaxNode(value.ast)) return value.ast;
  if (isSwiftSyntaxNode(value.root)) return value.root;
  if (isSwiftSyntaxNode(value.rootNode)) return value.rootNode;
  if (isSwiftSyntaxNode(value.sourceFile)) return value.sourceFile;
  if (isSwiftSyntaxNode(value.sourceFileSyntax)) return value.sourceFileSyntax;
  if (isSwiftSyntaxNode(value.tree)) return swiftSyntaxRoot(value.tree);
  if (Array.isArray(value.statements) || Array.isArray(value.members) || Array.isArray(value.declarations)) {
    return { kind: 'SourceFile', ...value };
  }
  return undefined;
}

function isSwiftSyntaxNode(value) {
  return Boolean(value && typeof value === 'object' && typeof swiftSyntaxKind(value) === 'string');
}

function swiftSyntaxKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.syntaxKind ?? node.SyntaxKind ?? node._syntaxKind ?? node._type ?? node.type ?? node.nodeType;
  if (typeof declared === 'string') return normalizeSwiftSyntaxKind(declared);
  if (Array.isArray(node.statements) || Array.isArray(node.members) || Array.isArray(node.declarations)) return 'SourceFile';
  if (node.identifier && (node.memberBlock || node.members || node.genericParameterClause || node.inheritanceClause)) return 'ClassDecl';
  if (node.signature && node.body) return 'FunctionDecl';
  if (node.importPath || node.path) return 'ImportDecl';
  return undefined;
}

function normalizeSwiftSyntaxKind(kind) {
  const text = String(kind)
    .replace(/^SwiftSyntax\./, '')
    .replace(/Syntax$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  const known = {
    sourcefile: 'SourceFile',
    importdecl: 'ImportDecl',
    classdecl: 'ClassDecl',
    structdecl: 'StructDecl',
    enumdecl: 'EnumDecl',
    protocoldecl: 'ProtocolDecl',
    actordecl: 'ActorDecl',
    extensiondecl: 'ExtensionDecl',
    typealiasdecl: 'TypeAliasDecl',
    associatedtypedecl: 'AssociatedTypeDecl',
    functiondecl: 'FunctionDecl',
    initializerdecl: 'InitializerDecl',
    initdecl: 'InitializerDecl',
    deinitializerdecl: 'DeinitializerDecl',
    deinitdecl: 'DeinitializerDecl',
    subscriptdecl: 'SubscriptDecl',
    operatordecl: 'OperatorDecl',
    precedencegroupdecl: 'PrecedenceGroupDecl',
    variabledecl: 'VariableDecl',
    patternbinding: 'PatternBinding',
    enumcasedecl: 'EnumCaseDecl',
    enumcaseelement: 'EnumCaseElement',
    macrodecl: 'MacroDecl',
    macroexpansiondecl: 'MacroExpansionDecl',
    freestandingmacroexpansion: 'FreestandingMacroExpansion',
    freestandingmacroexpansionsyntax: 'FreestandingMacroExpansion',
    attributemacroexpansion: 'AttributeMacroExpansion',
    ifconfigdecl: 'IfConfigDecl',
    ifconfigexpr: 'IfConfigExpr',
    unexpectednodes: 'UnexpectedNodes',
    missingtoken: 'MissingToken',
    skippedtoken: 'SkippedToken',
    error: 'Error'
  };
  if (known[compact]) return known[compact];
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}

function ignoredSwiftSyntaxField(key) {
  return key === '_type'
    || key === 'type'
    || key === 'kind'
    || key === 'syntaxKind'
    || key === 'SyntaxKind'
    || key === '_syntaxKind'
    || key === 'nodeType'
    || key === 'parent'
    || key === 'parentKind'
    || key === 'parentField'
    || key === 'position'
    || key === 'absolutePosition'
    || key === 'endPosition'
    || key === 'location'
    || key === 'sourceRange'
    || key === 'range'
    || key === 'span'
    || key === 'identifier'
    || key === 'name'
    || key === 'simpleName'
    || key === 'typeName'
    || key === 'sourceKitSymbol'
    || key === 'semanticModel'
    || key === 'resolvedSymbol'
    || key === 'typeInfo';
}

function primitiveSwiftSyntaxFields(node, kind) {
  const fields = { kind };
  const name = swiftSyntaxDeclarationName(node, kind);
  if (name) fields.name = name;
  const importPath = swiftSyntaxImportPath(node);
  if (importPath) fields.importPath = importPath;
  const type = swiftSyntaxTypeName(node.type ?? node.typeAnnotation?.type ?? node.returnClause?.type ?? node.extendedType);
  if (type) fields.type = type;
  const modifiers = swiftSyntaxModifierNames(node);
  if (modifiers.length) fields.modifiers = modifiers.join(',');
  const attributes = swiftSyntaxAttributeNames(node);
  if (attributes.length) fields.attributes = attributes.join(',');
  if (node.generated === true || node.isGenerated === true) fields.generated = true;
  if (node.isMissing === true || node.presence === 'missing') fields.isMissing = true;
  if (node.hasError === true || node.containsDiagnostics === true) fields.hasError = true;
  if (Array.isArray(node.genericParameterClause?.parameters ?? node.genericParameters)) fields.genericParameterCount = (node.genericParameterClause?.parameters ?? node.genericParameters).length;
  if (Array.isArray(node.inheritanceClause?.inheritedTypes ?? node.inheritedTypes)) fields.inheritedTypeCount = (node.inheritanceClause?.inheritedTypes ?? node.inheritedTypes).length;
  if (Array.isArray(node.signature?.parameterClause?.parameters ?? node.parameters)) fields.parameterCount = (node.signature?.parameterClause?.parameters ?? node.parameters).length;
  return fields;
}

function spanFromSwiftSyntaxNode(node, input, options = {}) {
  const direct = spanFromSwiftLineFields(node, input);
  if (direct) return direct;
  const range = node.sourceRange ?? node.range ?? node.span;
  const fromRange = spanFromSwiftRange(range, input);
  if (fromRange) return fromRange;
  const start = swiftSyntaxPosition(node.position ?? node.absolutePosition ?? node.start ?? range?.start, options);
  const end = swiftSyntaxPosition(node.endPosition ?? node.end ?? range?.end, options);
  if (!start) return undefined;
  return {
    sourceId: input.sourceHash,
    path: start.path ?? end?.path ?? input.sourcePath,
    startLine: start.line,
    startColumn: start.column,
    endLine: end?.line,
    endColumn: end?.column
  };
}

function spanFromSwiftLineFields(node, input) {
  const startLine = node.startLine ?? node.line ?? node.beginLine;
  if (typeof startLine !== 'number') return undefined;
  return {
    sourceId: input.sourceHash,
    path: node.path ?? node.filePath ?? node.file ?? input.sourcePath,
    startLine,
    startColumn: node.startColumn ?? node.column ?? node.beginColumn,
    endLine: node.endLine,
    endColumn: node.endColumn
  };
}

function spanFromSwiftRange(range, input) {
  if (!range || typeof range !== 'object') return undefined;
  const start = range.start ?? range.lowerBound ?? range.begin;
  const end = range.end ?? range.upperBound;
  const line = start?.line ?? start?.Line;
  if (typeof line !== 'number') return undefined;
  const column = start.column ?? start.character ?? start.utf8Column ?? start.Column;
  const endLine = end?.line ?? end?.Line;
  const endColumn = end?.column ?? end?.character ?? end?.utf8Column ?? end?.Column;
  return {
    sourceId: input.sourceHash,
    path: range.path ?? range.filePath ?? range.file ?? input.sourcePath,
    startLine: line,
    startColumn: typeof column === 'number' ? column : undefined,
    endLine: typeof endLine === 'number' ? endLine : undefined,
    endColumn: typeof endColumn === 'number' ? endColumn : undefined
  };
}

function swiftSyntaxPosition(value, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const position = value.position ?? value.location ?? value;
    const line = position.line ?? position.Line;
    const column = position.column ?? position.character ?? position.utf8Column ?? position.Column;
    if (typeof line === 'number') {
      return {
        path: position.path ?? position.filePath ?? position.file,
        line,
        column: typeof column === 'number' ? column : undefined
      };
    }
  }
  const resolver = typeof options.positionResolver === 'function'
    ? options.positionResolver
    : typeof options.lineMap?.position === 'function'
      ? options.lineMap.position.bind(options.lineMap)
      : typeof options.sourceLocationConverter?.location === 'function'
        ? options.sourceLocationConverter.location.bind(options.sourceLocationConverter)
        : undefined;
  if (resolver) {
    const resolved = resolver(value);
    if (resolved !== value) return swiftSyntaxPosition(resolved, options);
  }
  return undefined;
}

function swiftSyntaxPositionKind(node) {
  if (node.sourceRange || node.range) return 'source-range';
  if (node.position || node.absolutePosition) return 'absolute-position';
  if (typeof node.startLine === 'number' || typeof node.line === 'number') return 'line-column-fields';
  return undefined;
}

function swiftSyntaxDeclarations(node, kind, nativeNodeId, input) {
  if (kind === 'ImportDecl') {
    const name = swiftSyntaxImportPath(node);
    return name ? [declarationRecord(input, nativeNodeId, name, 'module', 'import')] : [];
  }
  if (swiftSyntaxTypeDeclarationKind(kind)) {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, swiftSyntaxTypeDeclarationSymbolKind(kind), 'definition')] : [];
  }
  if (kind === 'ExtensionDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (kind === 'TypeAliasDecl' || kind === 'AssociatedTypeDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'type', 'definition')] : [];
  }
  if (swiftSyntaxFunctionLikeKind(kind)) {
    const name = swiftSyntaxDeclarationName(node, kind) ?? swiftSyntaxOperatorName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, kind === 'FunctionDecl' ? 'function' : 'method', swiftSyntaxHasBody(node) ? 'definition' : 'declaration')] : [];
  }
  if (kind === 'VariableDecl') {
    return swiftSyntaxVariableNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'property', 'definition'));
  }
  if (kind === 'PatternBinding' && node.parentKind === 'VariableDecl') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'property', 'definition')] : [];
  }
  if (kind === 'EnumCaseDecl') {
    return swiftSyntaxEnumCaseNames(node).map((name) => declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition'));
  }
  if (kind === 'EnumCaseElement') {
    const name = swiftSyntaxDeclarationName(node, kind);
    return name ? [declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition')] : [];
  }
  return [];
}

function swiftSyntaxChildEntries(node, kind = swiftSyntaxKind(node)) {
  const fieldNames = Object.keys(node).filter((key) => !ignoredSwiftSyntaxField(key));
  const entries = [];
  for (const field of fieldNames) {
    const value = node[field];
    if (Array.isArray(value)) {
      entries.push([field, value.map((entry) => swiftSyntaxChildWithParent(entry, kind, field))]);
      continue;
    }
    if (value && typeof value === 'object') {
      entries.push([field, swiftSyntaxChildWithParent(value, kind, field)]);
    }
  }
  return entries.filter(([, value]) => Array.isArray(value)
    ? value.some(isSwiftSyntaxNode)
    : isSwiftSyntaxNode(value));
}

function swiftSyntaxChildWithParent(entry, parentKind, parentField) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
  if (!isSwiftSyntaxNode(entry)) return entry;
  return { parentKind, parentField, ...entry };
}

function swiftSyntaxNodeValue(node) {
  return swiftSyntaxDeclarationName(node, swiftSyntaxKind(node))
    ?? swiftSyntaxImportPath(node)
    ?? swiftSyntaxTypeName(node.type ?? node.returnClause?.type ?? node.extendedType)
    ?? swiftSyntaxLiteralValue(node);
}

function swiftSyntaxDeclarationName(node, kind = swiftSyntaxKind(node)) {
  if (!node || typeof node !== 'object') return undefined;
  if (kind === 'InitializerDecl') return 'init';
  if (kind === 'DeinitializerDecl') return 'deinit';
  if (kind === 'SubscriptDecl') return 'subscript';
  if (kind === 'ExtensionDecl') {
    const extended = swiftSyntaxTypeName(node.extendedType ?? node.type ?? node.name);
    return extended ? `extension ${extended}` : undefined;
  }
  if (kind === 'OperatorDecl') return swiftSyntaxOperatorName(node, kind);
  for (const key of ['identifier', 'name', 'simpleName', 'typeName', 'id']) {
    const name = swiftSyntaxName(node[key]);
    if (name) return name;
  }
  const patternName = swiftSyntaxPatternName(node.pattern);
  if (patternName) return patternName;
  return undefined;
}

function swiftSyntaxName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  if (typeof value.trimmedDescription === 'string') return value.trimmedDescription;
  if (typeof value.description === 'string' && !value.description.includes('[object Object]')) return value.description.trim();
  if (typeof value.identifier === 'string') return value.identifier;
  if (typeof value.name === 'string') return value.name;
  if (typeof value.value === 'string') return value.value;
  if (value.tokenKind && typeof value.tokenKind === 'object') return swiftSyntaxName(value.tokenKind);
  if (value.identifier && value.identifier !== value) return swiftSyntaxName(value.identifier);
  if (value.name && value.name !== value) return swiftSyntaxName(value.name);
  return undefined;
}

function swiftSyntaxImportPath(node) {
  if (!node || typeof node !== 'object') return undefined;
  const path = node.importPath ?? node.path ?? node.modulePath ?? node.name;
  if (typeof path === 'string') return path;
  if (Array.isArray(path)) {
    return path.map((entry) => swiftSyntaxName(entry.name ?? entry.identifier ?? entry)).filter(Boolean).join('.');
  }
  if (path && typeof path === 'object') {
    if (Array.isArray(path.components)) return path.components.map((entry) => swiftSyntaxName(entry.name ?? entry.identifier ?? entry)).filter(Boolean).join('.');
    return swiftSyntaxName(path);
  }
  return undefined;
}

function swiftSyntaxTypeName(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value.trimmedDescription === 'string') return value.trimmedDescription;
  if (typeof value.description === 'string' && !value.description.includes('[object Object]')) return value.description.trim();
  if (typeof value.name === 'string') return value.name;
  if (typeof value.text === 'string') return value.text;
  if (value.baseType) {
    const base = swiftSyntaxTypeName(value.baseType);
    return base && value.name ? `${base}.${swiftSyntaxName(value.name)}` : base;
  }
  if (value.argumentList && Array.isArray(value.argumentList)) {
    const base = swiftSyntaxName(value.name) ?? swiftSyntaxTypeName(value.baseName);
    const args = value.argumentList.map((entry) => swiftSyntaxTypeName(entry.type ?? entry)).filter(Boolean);
    return base ? `${base}<${args.join(', ')}>` : undefined;
  }
  return swiftSyntaxName(value);
}

function swiftSyntaxModifierNames(node) {
  const modifiers = node.modifiers ?? node.Modifiers;
  if (!modifiers) return [];
  if (Array.isArray(modifiers)) {
    return uniqueStrings(modifiers.map((entry) => typeof entry === 'string' ? entry : swiftSyntaxName(entry.name ?? entry.modifier ?? entry)).filter(Boolean));
  }
  if (typeof modifiers === 'string') return uniqueStrings(modifiers.split(/\s+/).filter(Boolean));
  if (typeof modifiers === 'object') {
    return uniqueStrings(Object.entries(modifiers)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key));
  }
  return [];
}

function swiftSyntaxAttributeNames(node) {
  const attributes = node.attributes ?? node.attributeList;
  if (!attributes) return [];
  if (Array.isArray(attributes)) {
    return uniqueStrings(attributes.map((entry) => typeof entry === 'string' ? entry : swiftSyntaxName(entry.attributeName ?? entry.name ?? entry)).filter(Boolean));
  }
  return [];
}

function swiftSyntaxVariableNames(node) {
  const bindings = node.bindings ?? node.bindingSpecifier?.bindings ?? node.patternBindings;
  if (Array.isArray(bindings)) return bindings.map((binding) => swiftSyntaxPatternName(binding.pattern ?? binding)).filter(Boolean);
  const name = swiftSyntaxPatternName(node.pattern) ?? swiftSyntaxDeclarationName(node);
  return name ? [name] : [];
}

function swiftSyntaxEnumCaseNames(node) {
  const elements = node.elements ?? node.caseElements ?? node.cases;
  if (Array.isArray(elements)) return elements.map((entry) => swiftSyntaxDeclarationName(entry, 'EnumCaseElement')).filter(Boolean);
  const name = swiftSyntaxDeclarationName(node);
  return name ? [name] : [];
}

function swiftSyntaxPatternName(pattern) {
  if (!pattern) return undefined;
  if (typeof pattern === 'string') return pattern;
  return swiftSyntaxName(pattern.identifier ?? pattern.name ?? pattern.boundName ?? pattern.pattern ?? pattern);
}

function swiftSyntaxTypeDeclarationKind(kind) {
  return kind === 'ClassDecl'
    || kind === 'StructDecl'
    || kind === 'EnumDecl'
    || kind === 'ProtocolDecl'
    || kind === 'ActorDecl';
}

function swiftSyntaxTypeDeclarationSymbolKind(kind) {
  if (kind === 'ClassDecl') return 'class';
  if (kind === 'StructDecl') return 'struct';
  if (kind === 'EnumDecl') return 'enum';
  if (kind === 'ProtocolDecl') return 'protocol';
  if (kind === 'ActorDecl') return 'class';
  return 'type';
}

function swiftSyntaxFunctionLikeKind(kind) {
  return kind === 'FunctionDecl'
    || kind === 'InitializerDecl'
    || kind === 'DeinitializerDecl'
    || kind === 'SubscriptDecl'
    || kind === 'OperatorDecl'
    || kind === 'PrecedenceGroupDecl';
}

function swiftSyntaxHasBody(node) {
  return Boolean(node.body || node.accessorBlock || node.memberBlock || Array.isArray(node.statements));
}

function swiftSyntaxOperatorName(node, kind) {
  if (kind === 'PrecedenceGroupDecl') return swiftSyntaxDeclarationName(node) ?? 'precedencegroup';
  const operatorToken = swiftSyntaxName(node.operatorIdentifier ?? node.operatorToken ?? node.name);
  return operatorToken ? `operator ${operatorToken}` : undefined;
}

function swiftSyntaxLiteralValue(node) {
  const value = node.value ?? node.literal;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
}

function swiftSyntaxRecoveredKind(kind) {
  return kind === 'UnexpectedNodes'
    || kind === 'MissingToken'
    || kind === 'SkippedToken'
    || kind === 'Error'
    || /Unexpected|Missing|Skipped|Error/.test(String(kind));
}

function swiftSyntaxProblemNode(node, kind) {
  return Boolean(
    node.isMissing
    || node.hasError
    || node.containsDiagnostics
    || node.containsSkippedText
    || node.presence === 'missing'
    || kind === 'UnexpectedNodes'
    || kind === 'MissingToken'
    || kind === 'SkippedToken'
    || kind === 'Error'
  );
}

function swiftSyntaxConditionalCompilationKind(kind) {
  return /IfConfig|ConditionalCompilation|PoundIf|PoundElse|PoundElseif|PoundEndif/i.test(String(kind));
}

function swiftSyntaxMacroKind(kind) {
  return /Macro/i.test(String(kind));
}

function swiftGeneratedCodeMarker(node, kind) {
  if (node.generated || node.isGenerated) return true;
  const path = String(node.filePath ?? node.path ?? node.sourcePath ?? '');
  if (swiftGeneratedSourcePath(path)) return true;
  if (kind === 'Attribute') {
    const name = swiftSyntaxDeclarationName(node);
    if (name && /(^|\.)(Generated|CompilerGenerated|_spi)Attribute?$/.test(name)) return true;
  }
  return false;
}

function swiftGeneratedSourcePath(path) {
  return typeof path === 'string' && /\.(g|generated)\.swift$/i.test(path);
}

function swiftGeneratedCodeLoss(input, nodeId, span, options = {}, metadata = {}) {
  return {
    id: `loss_${idFragment(nodeId ?? input.sourcePath ?? 'swift')}_swift_generated_code`,
    severity: 'warning',
    phase: 'parse',
    sourceFormat: input.language,
    kind: 'generatedCode',
    message: 'Swift generated-source marker was imported; generated member provenance and source ownership require host evidence.',
    span,
    nodeId,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      macroExpansionEvidence: swiftEvidenceSummary(options.macroExpansionEvidence),
      ...metadata
    }
  };
}

function swiftEvidenceSummary(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) return { entryCount: value.length };
  if (typeof value === 'string') return { value };
  if (typeof value === 'object') {
    const summary = {};
    if (typeof value.hash === 'string') summary.hash = value.hash;
    if (typeof value.solver === 'string') summary.solver = value.solver;
    if (Array.isArray(value.entries)) summary.entryCount = value.entries.length;
    if (Array.isArray(value.symbols)) summary.symbolCount = value.symbols.length;
    if (Array.isArray(value.references)) summary.referenceCount = value.references.length;
    if (Array.isArray(value.types)) summary.typeCount = value.types.length;
    if (Array.isArray(value.diagnostics)) summary.diagnosticCount = value.diagnostics.length;
    if (Array.isArray(value.macros)) summary.macroCount = value.macros.length;
    if (Array.isArray(value.packages)) summary.packageCount = value.packages.length;
    return Object.keys(summary).length ? summary : { present: true };
  }
  return { present: true };
}

function declarationRecord(input, nativeNodeId, name, symbolKind, role = 'definition') {
  return {
    name: String(name),
    symbolKind,
    role,
    symbolId: `symbol:${input.language}:${role === 'import' ? 'import:' : ''}${idFragment(name)}`,
    nativeNodeId
  };
}

function relationPredicateForDeclaration(declaration) {
  if (declaration.role === 'import') return 'imports';
  if (declaration.role === 'export') return 'exports';
  return 'defines';
}

function identifierName(node) {
  if (!node) return undefined;
  if (typeof node === 'string') return node;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.escapedText === 'string') return node.escapedText;
  if (typeof node.text === 'string') return node.text;
  if (node.type === 'Identifier' && typeof node.value === 'string') return node.value;
  return undefined;
}

function stringFromTsExpression(node) {
  if (!node) return undefined;
  if (typeof node.text === 'string') return node.text;
  if (typeof node.value === 'string') return node.value;
  return identifierName(node);
}

function typeScriptKindName(node, ts) {
  if (typeof node.kindName === 'string') return node.kindName;
  if (ts?.SyntaxKind && node.kind !== undefined) return ts.SyntaxKind[node.kind] ?? `SyntaxKind${node.kind}`;
  if (typeof node.kind === 'string') return node.kind;
  return `SyntaxKind${node.kind ?? 'Unknown'}`;
}

function spanFromTypeScriptNode(node, sourceFile) {
  const start = typeof node.getStart === 'function' ? node.getStart(sourceFile) : node.pos;
  const end = typeof node.getEnd === 'function' ? node.getEnd() : node.end;
  if (typeof start !== 'number' || typeof sourceFile?.getLineAndCharacterOfPosition !== 'function') return undefined;
  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = typeof end === 'number' ? sourceFile.getLineAndCharacterOfPosition(end) : undefined;
  return {
    sourceId: sourceFile.sourceHash,
    path: sourceFile.fileName,
    startLine: startPos.line + 1,
    startColumn: startPos.character + 1,
    endLine: endPos ? endPos.line + 1 : undefined,
    endColumn: endPos ? endPos.character + 1 : undefined
  };
}

function typeScriptNodeValue(node) {
  return identifierName(node.name) ?? stringFromTsExpression(node.moduleSpecifier) ?? undefined;
}

function primitiveTypeScriptFields(node, kind) {
  const fields = { kind };
  const name = identifierName(node.name);
  if (name) fields.name = name;
  const moduleSpecifier = stringFromTsExpression(node.moduleSpecifier);
  if (moduleSpecifier) fields.moduleSpecifier = moduleSpecifier;
  return fields;
}

function spanFromTreeSitterNode(node, input) {
  const start = node.startPosition;
  if (!start) return undefined;
  const end = node.endPosition;
  return {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: start.row + 1,
    startColumn: start.column + 1,
    endLine: end ? end.row + 1 : undefined,
    endColumn: end ? end.column + 1 : undefined
  };
}

function treeSitterFieldText(node, field) {
  if (typeof node.childForFieldName !== 'function') return undefined;
  return shortNodeText(node.childForFieldName(field));
}

function shortNodeText(node) {
  if (!node || typeof node.text !== 'string') return undefined;
  const text = node.text.trim();
  if (!text || text.length > 160) return undefined;
  return text.replace(/^['"]|['"]$/g, '');
}

function truncatedAstLoss(input, context, options) {
  return {
    id: `loss_${idFragment(input.sourcePath ?? input.language)}_${idFragment(options.astFormat ?? options.parser)}_truncated`,
    severity: 'warning',
    phase: 'read',
    sourceFormat: input.language,
    kind: 'opaqueNative',
    message: `Native AST normalization stopped after ${context.maxNodes} node(s).`,
    metadata: {
      parser: options.parser,
      astFormat: options.astFormat,
      maxNodes: context.maxNodes
    }
  };
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).map((value) => String(value)).filter(Boolean))];
}

function uniqueByLossId(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const id = value?.id ?? `loss_${result.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value.id ? value : { ...value, id });
  }
  return result;
}

function uniqueByEvidenceId(values) {
  const seen = new Set();
  const result = [];
  for (const value of values ?? []) {
    const id = value?.id ?? `evidence_${result.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value.id ? value : { ...value, id });
  }
  return result;
}

function numberOrUndefined(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function idFragment(value) {
  return String(value ?? 'native')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'native';
}
