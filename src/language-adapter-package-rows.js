const packageRows = [
  row('@shapeshift-labs/frontier-lang-typescript', '0.3.12', 'typescript', 'typescript-compiler-api', { target: 'typescript' }),
  row('@shapeshift-labs/frontier-lang-javascript', '0.2.12', 'javascript', 'estree', { target: 'javascript', formats: ['estree', 'babel'] }),
  row('@shapeshift-labs/frontier-lang-rust', '0.2.14', 'rust', 'rust-syn', { target: 'rust', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'macroExpansionEvidence'] }),
  row('@shapeshift-labs/frontier-lang-python', '0.2.13', 'python', 'python-ast', { target: 'python', formats: ['python-ast', 'libcst'] }),
  row('@shapeshift-labs/frontier-lang-c', '0.2.13', 'c', 'clang-ast-json', { target: 'c', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'compileCommandsHash', 'preprocessorRecordsHash'] }),
  platform('@shapeshift-labs/frontier-lang-java', '0.1.18', 'java', 'java-ast', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-kotlin', '0.1.18', 'kotlin', 'kotlin-psi', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-swift', '0.1.18', 'swift', 'swift-syntax', ['sourcekit-lsp', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-csharp', '0.1.18', 'csharp', 'roslyn-csharp', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-go', '0.1.18', 'go', 'go-ast', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-clang', '0.1.18', 'c', 'clang-ast-json', ['lsp'], {
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
  plannedPlatform('@shapeshift-labs/frontier-lang-unison', 'unison', 'unison-parser', ['lsp'], {
    parserCaveats: ['Unison contracts require host evidence for content-addressed definitions, names/namespace resolution, abilities, watches, transcripts, codebase state, source ranges, and pretty-printer trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-dhall', 'dhall', 'dhall-parser', ['semantic-hash'], {
    family: 'typed-config',
    parserCaveats: ['Dhall contracts require host evidence for total evaluation, import resolution, semantic integrity hashes, normalization, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-cue', 'cue', 'cue-parser', ['constraint-graph'], {
    family: 'constraint-config',
    parserCaveats: ['CUE contracts require host evidence for constraint unification, defaults, schema/data duality, package context, generated output, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-nix', 'nix', 'rnix', ['derivation-graph'], {
    family: 'build-config',
    parserCaveats: ['Nix contracts require host evidence for lazy evaluation, import paths, flakes, derivation graphs, overlays, generated store paths, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-nickel', 'nickel', 'nickel-parser', ['contract-graph'], {
    family: 'constraint-config',
    parserCaveats: ['Nickel contracts require host evidence for contracts, merging semantics, package/import context, generated output, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-roc', 'roc', 'roc-parser', ['lsp'], {
    family: 'effect-functional',
    parserCaveats: ['Roc contracts require host evidence for platforms, abilities, effect boundaries, package context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-koka', 'koka', 'koka-parser', ['lsp'], {
    family: 'effect-functional',
    parserCaveats: ['Koka contracts require host evidence for effect rows, handlers, type inference, backend/runtime boundaries, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-elm', 'elm', 'elm-parser', ['lsp'], {
    family: 'pure-ui-functional',
    parserCaveats: ['Elm contracts require host evidence for module/package context, The Elm Architecture runtime boundaries, ports, generated JavaScript, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-purescript', 'purescript', 'purescript-cst', ['lsp'], {
    family: 'typed-functional',
    parserCaveats: ['PureScript contracts require host evidence for row types, typeclass resolution, effect rows, FFI boundaries, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-gleam', 'gleam', 'gleam-parser', ['lsp'], {
    family: 'beam-functional',
    parserCaveats: ['Gleam contracts require host evidence for OTP/BEAM boundaries, package context, generated Erlang/JavaScript targets, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-fsharp', 'fsharp', 'fsharp-compiler-service', ['lsp'], {
    family: 'ml-dotnet',
    parserCaveats: ['F# contracts require host evidence for computation expressions, type providers, active patterns, .NET project context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-lean', 'lean', 'lean-elab', ['lsp', 'proof-terms'], {
    family: 'proof-dependent',
    parserCaveats: ['Lean contracts require host evidence for elaboration, dependent types, tactics, proof terms, imports, source ranges, and pretty-printer trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-coq', 'coq', 'coq-serapi', ['proof-terms'], {
    family: 'proof-dependent',
    parserCaveats: ['Coq/Rocq contracts require host evidence for vernacular parsing, tactics, proof terms, module context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-agda', 'agda', 'agda-interface', ['proof-terms'], {
    family: 'proof-dependent',
    parserCaveats: ['Agda contracts require host evidence for dependent types, holes, termination checking, module/import context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-idris', 'idris', 'idris2-api', ['proof-terms'], {
    family: 'proof-dependent',
    parserCaveats: ['Idris contracts require host evidence for dependent types, totality checking, elaboration, effects, source ranges, and comments/trivia preservation.']
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
  plannedPlatform('@shapeshift-labs/frontier-lang-prolog', 'prolog', 'swi-prolog', ['logic-index'], {
    family: 'logic',
    parserCaveats: ['Prolog contracts require host evidence for module predicates, operator declarations, dynamic predicates, cut/control semantics, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-mercury', 'mercury', 'mercury-parser', ['logic-index'], {
    family: 'logic',
    parserCaveats: ['Mercury contracts require host evidence for modes, determinism, typeclass resolution, module context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-smalltalk', 'smalltalk', 'smalltalk-parser', ['image-index'], {
    family: 'image-oo',
    parserCaveats: ['Smalltalk contracts require host evidence for image state, class/category organization, message dispatch, dynamic method dictionaries, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-forth', 'forth', 'forth-parser', ['stack-effect-index'], {
    family: 'concatenative-stack',
    parserCaveats: ['Forth contracts require host evidence for dictionary state, stack effects, parsing words, target image/runtime state, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-factor', 'factor', 'factor-parser', ['stack-effect-index'], {
    family: 'concatenative-stack',
    parserCaveats: ['Factor contracts require host evidence for vocabulary resolution, stack effects, parsing words, quotations, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-array', 'apl', 'apl-parser', ['array-rank-index'], {
    supportedLanguages: ['apl', 'j', 'q'],
    family: 'array',
    parserCaveats: ['Array-language contracts require host evidence for rank/shape semantics, tacit definitions, glyph/encoding normalization, table/time-series runtime behavior, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-pony', 'pony', 'pony-parser', ['lsp'], {
    family: 'actor-capability',
    parserCaveats: ['Pony contracts require host evidence for reference capabilities, actor isolation, send boundaries, package context, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-sql', 'sql', 'sqlparser', ['lsp'], {
    supportedLanguages: ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'tsql'],
    parserCaveats: ['SQL parser contracts require host evidence for dialect selection, schema/catalog metadata, migrations, vendor extensions, procedural SQL blocks, source ranges, and comments/trivia.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-graphql', 'graphql', 'graphql-js', ['graphql-schema', 'lsp'], {
    family: 'query',
    parserCaveats: ['GraphQL contracts require host evidence for schema/catalog versions, fragments, directives, resolver/runtime boundaries, persisted queries, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-cypher', 'cypher', 'cypher-parser', ['graph-schema'], {
    family: 'query',
    parserCaveats: ['Cypher contracts require host evidence for graph schema/catalog metadata, procedure/function availability, planner/runtime behavior, vendor dialects, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-sparql', 'sparql', 'sparqljs', ['rdf-schema'], {
    family: 'query',
    parserCaveats: ['SPARQL contracts require host evidence for RDF dataset shape, prefixes, entailment regime, service federation, update semantics, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-datalog', 'datalog', 'souffle', ['logic-schema'], {
    family: 'query',
    parserCaveats: ['Datalog contracts require host evidence for dialect selection, relation schemas, fixed-point evaluation semantics, negation/stratification, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-jsonpath', 'jsonpath', 'jsonpath-parser', ['json-schema'], {
    family: 'query',
    parserCaveats: ['JSONPath contracts require host evidence for dialect selection, JSON schema/catalog metadata, selector evaluation semantics, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-xpath', 'xpath', 'xpath-parser', ['xml-schema'], {
    family: 'query',
    parserCaveats: ['XPath contracts require host evidence for XML namespaces, schema/catalog metadata, function libraries, host document model, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-promql', 'promql', 'promql-parser', ['metric-catalog'], {
    family: 'query',
    parserCaveats: ['PromQL contracts require host evidence for metric catalogs, label cardinality, recording rules, evaluation interval/range semantics, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-build', 'make', 'make-parser', ['build-graph'], {
    supportedLanguages: ['make', 'starlark'],
    family: 'build',
    parserCaveats: ['Build-language contracts require host evidence for target graphs, generated files, repository rules, shell/runtime boundaries, environment inputs, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-config', 'hcl', 'hcl-parser', ['provider-schema'], {
    supportedLanguages: ['hcl', 'rego', 'cel'],
    family: 'policy-config',
    parserCaveats: ['Config/policy contracts require host evidence for provider schemas, policy input schemas, partial evaluation, plan/runtime effects, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-solidity', 'solidity', 'solc-ast', ['contract-abi'], {
    family: 'contract-vm',
    parserCaveats: ['Solidity contracts require host evidence for compiler version, ABI/storage layout, EVM bytecode/source maps, chain/runtime assumptions, source ranges, and comments/trivia preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-wasm', 'wasm', 'wabt', ['wasm-tools'], {
    family: 'bytecode-ir',
    parserCaveats: ['WebAssembly contracts require host evidence for WAT/binary mapping, imports/exports, memory/table effects, host bindings, source maps, and binary/source preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-assembly', 'assembly', 'tree-sitter-asm', ['disassembly', 'debug-symbols'], {
    supportedLanguages: ['assembly', 'x86', 'x86-64', 'arm64', 'riscv', 'llvm-ir', 'ebpf'],
    family: 'low-level-ir',
    parserCaveats: ['Assembly and IR contracts require host evidence for instruction set, ABI/calling convention, linker symbols, relocation records, debug/source maps, register/flag effects, memory effects, and binary roundtrip preservation.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-retro-assembly', 'asm-6502', 'ca65', ['memory-map', 'cycle-model'], {
    supportedLanguages: ['asm-6502', 'asm-65816', 'snes-asm', 'z80', 'sm83', 'm68k'],
    family: 'retro-low-level',
    parserCaveats: ['Retro assembly contracts require host evidence for assembler dialect, labels/macros, memory maps, bank switching, CPU/PPU/APU or platform registers, cycle timing, interrupt behavior, binary/source maps, and emulator/runtime traces.']
  }),
  plannedPlatform('@shapeshift-labs/frontier-lang-hardware', 'verilog', 'verible', ['hdl-elaboration'], {
    supportedLanguages: ['verilog', 'vhdl'],
    family: 'hardware',
    parserCaveats: ['Hardware-description contracts require host evidence for elaboration, synthesis/simulation semantics, clocks/resets, module/interface binding, source ranges, and comments/trivia preservation.']
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
