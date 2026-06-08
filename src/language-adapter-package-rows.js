const packageRows = [
  row('@shapeshift-labs/frontier-lang-typescript', '0.3.8', 'typescript', 'typescript-compiler-api', { target: 'typescript' }),
  row('@shapeshift-labs/frontier-lang-javascript', '0.2.8', 'javascript', 'estree', { target: 'javascript', formats: ['estree', 'babel'] }),
  row('@shapeshift-labs/frontier-lang-rust', '0.2.8', 'rust', 'rust-syn', { target: 'rust', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'macroExpansionEvidence'] }),
  row('@shapeshift-labs/frontier-lang-python', '0.2.8', 'python', 'python-ast', { target: 'python', formats: ['python-ast', 'libcst'] }),
  row('@shapeshift-labs/frontier-lang-c', '0.2.8', 'c', 'clang-ast-json', { target: 'c', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'compileCommandsHash', 'preprocessorRecordsHash'] }),
  platform('@shapeshift-labs/frontier-lang-java', '0.1.8', 'java', 'java-ast', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-kotlin', '0.1.8', 'kotlin', 'kotlin-psi', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-swift', '0.1.8', 'swift', 'swift-syntax', ['sourcekit-lsp', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-csharp', '0.1.8', 'csharp', 'roslyn-csharp', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-go', '0.1.8', 'go', 'go-ast', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-clang', '0.1.8', 'c', 'clang-ast-json', ['lsp'], {
    supportedLanguages: ['c', 'cpp'],
    proofKeys: ['parserAst', 'semanticIndex', 'compileCommandsHash', 'preprocessorRecordsHash']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-lisp', 'lisp', 'tree-sitter-lisp', ['lsp'], {
    supportedLanguages: ['lisp', 'common-lisp', 'scheme', 'racket'],
    formats: ['tree-sitter'],
    family: 'lisp-scheme',
    parserCaveats: ['Lisp and Scheme contracts need host evidence for reader conditionals, package/module systems, macros, quoting semantics, source ranges, and comment/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-haskell', 'haskell', 'ghc-api', ['lsp'], {
    parserCaveats: ['GHC API parse trees require host evidence for CPP, Template Haskell, quasiquotes, package flags, renamer/typechecker facts, source ranges, and layout-sensitive source preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-erlang', 'erlang', 'erl_parse', ['lsp'], {
    parserCaveats: ['Erlang parser contracts require host evidence for include paths, record definitions, macros, parse transforms, specs, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-elixir', 'elixir', 'elixir-quoted', ['lsp'], {
    parserCaveats: ['Elixir quoted AST contracts require host evidence for macro expansion, aliases/imports, protocols, Mix compile context, generated code, source ranges, and formatter trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-ruby', 'ruby', 'prism', ['lsp'], {
    parserCaveats: ['Ruby parser contracts require host evidence for dynamic constant lookup, refinements, metaprogramming, comments/trivia, source ranges, and optional type signature ecosystems.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-php', 'php', 'php-parser', ['lsp'], {
    parserCaveats: ['PHP parser contracts require host evidence for Composer/autoload context, conditional declarations, attributes, PHPDoc, generated code, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-lua', 'lua', 'luaparse', ['lsp'], {
    parserCaveats: ['Lua parser contracts require host evidence for dynamic module loading, metatables, embedded DSLs, comments/trivia, source ranges, and version-specific syntax.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-r', 'r', 'r-parser', ['lsp'], {
    parserCaveats: ['R parser contracts require host evidence for non-standard evaluation, library search paths, generated code, comments/trivia, source ranges, and version-specific syntax.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-julia', 'julia', 'julia-syntax', ['lsp'], {
    parserCaveats: ['Julia parser contracts require host evidence for macro expansion, generated functions, multiple dispatch/type facts, package environments, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-zig', 'zig', 'zig-ast', ['lsp'], {
    parserCaveats: ['Zig parser contracts require host evidence for comptime evaluation, build.zig context, imports, generated code, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-ocaml', 'ocaml', 'ocaml-parsetree', ['lsp'], {
    parserCaveats: ['OCaml parsetree contracts require host evidence for PPX rewrites, module/functor resolution, typedtree facts, Dune context, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-scala', 'scala', 'scalameta', ['semanticdb', 'lsp'], {
    parserCaveats: ['Scala parser contracts require host evidence for Scala 2/3 dialects, macros, givens/implicits, SemanticDB/TASTy facts, build targets, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-dart', 'dart', 'dart-analyzer', ['lsp'], {
    parserCaveats: ['Dart analyzer contracts require host evidence for analysis context, null-safety mode, package config, build_runner generated sources, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-sql', 'sql', 'sqlparser', ['lsp'], {
    supportedLanguages: ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'tsql'],
    parserCaveats: ['SQL parser contracts require host evidence for dialect selection, schema/catalog metadata, migrations, vendor extensions, procedural SQL blocks, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-shader', 'shader', 'tree-sitter-shader', ['lsp', 'spirv-reflect'], {
    supportedLanguages: ['shader', 'glsl', 'hlsl', 'wgsl', 'slang'],
    formats: ['tree-sitter'],
    family: 'shader',
    parserCaveats: ['Shader parser contracts require host evidence for dialect selection, preprocessor/includes, entry points, resource layouts, generated variants, source ranges, and reflection data.']
  })
];

export { packageRows };

function row(packageName, packageVersion, language, parser, input = {}) {
  return {
    packageName,
    packageVersion,
    language,
    parser,
    supportedFormats: input.formats,
    target: input.target,
    packageClass: 'target-projection',
    releaseReadiness: { status: 'ready-with-losses', releaseReady: true, versionSource: 'package-json-dependency' },
    semanticIndex: { formats: ['frontier-semantic-index', 'scip', 'lsif', 'lsp'], hostEvidenceRequired: false },
    proofKeys: input.proofKeys
  };
}

function platform(packageName, packageVersion, language, parser, semanticFormats, input = {}) {
  const published = packageVersion !== '0.0.0';
  return {
    packageName,
    packageVersion,
    language,
    parser,
    family: input.family,
    supportedLanguages: input.supportedLanguages,
    supportedFormats: input.formats,
    packageClass: 'platform-importer',
    targetProjection: { targets: [], caveats: input.targetCaveats },
    releaseReadiness: {
      status: published ? 'ready-with-losses' : 'needs-review',
      releaseReady: published,
      versionSource: published ? 'static-package-catalog' : 'related-package-catalog-placeholder',
      signals: input.signals
    },
    semanticIndex: { formats: ['frontier-semantic-index', ...semanticFormats], hostEvidenceRequired: true },
    proofEvidence: { hostEvidenceRequired: true, requiredEvidenceKeys: input.proofKeys ?? ['parserAst', 'semanticIndex', 'buildGraphEvidence'] },
    parserCaveats: input.parserCaveats
  };
}

function plannedPlatform(packageName, language, parser, semanticFormats, input = {}) {
  return platform(packageName, '0.0.0', language, parser, semanticFormats, {
    proofKeys: ['parserAst', 'semanticIndex', 'sourceMap', 'sourcePreservationEvidence', 'projectionCaveats'],
    ...input
  });
}
