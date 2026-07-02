import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';

export const ProjectionTargetLossClasses = Object.freeze([
  'exactSourceProjection',
  'nativeSourceStubs',
  'unsupportedTargetFeatures',
  'targetAdapterProjection',
  'missingAdapter'
]);


export const NativeImportLanguageProfiles = Object.freeze([
  nativeImportLanguageProfile('javascript', {
    aliases: ['js', 'mjs', 'cjs', 'jsx'],
    extensions: ['.js', '.mjs', '.cjs', '.jsx'],
    parserAdapters: ['estree', 'babel', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'dynamicRuntime'],
    notes: [
      'lightweight scanner records declarations only; exact parser adapters must be injected by the host',
      '.jsx sources are classified as javascript for declaration scanning; JSX element trees remain opaque without host parser evidence'
    ]
  }),
  nativeImportLanguageProfile('typescript', {
    aliases: ['ts', 'tsx'],
    extensions: ['.ts', '.tsx'],
    parserAdapters: ['typescript-compiler-api', 'babel', 'tree-sitter'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'unsupportedSyntax'],
    notes: [
      'lightweight scanner records declarations only; exact parser adapters must be injected by the host',
      '.tsx sources are classified as typescript for declaration scanning; JSX element trees remain opaque without host parser evidence'
    ]
  }),
  nativeImportLanguageProfile('html', {
    aliases: ['htm'],
    extensions: ['.html', '.htm'],
    supportsLightweightScan: false,
    defaultReadiness: 'blocked',
    parserAdapters: ['parse5', 'htmlparser2', 'rehype', 'tree-sitter-html'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'browserRuntime', 'hydrationRuntime'],
    notes: [
      'HTML semantic merge evidence is tree/attribute/source-span oriented; browser DOM normalization, custom elements, slots, templates, and hydration remain host-owned evidence',
      'layout/render equivalence requires browser evidence and should remain fail-closed when only parser evidence is present'
    ]
  }),
  nativeImportLanguageProfile('css', {
    extensions: ['.css'],
    supportsLightweightScan: false,
    defaultReadiness: 'blocked',
    parserAdapters: ['postcss', 'csstree', 'css-tree', 'lightningcss', 'tree-sitter-css'],
    lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation', 'cascadeRuntime', 'browserRuntime', 'cssModuleTransform', 'cssModuleUseSiteGraph'],
    notes: [
      'CSS semantic merge evidence is selector/declaration/cascade oriented; computed style, inheritance, layout, and browser-specific normalization remain host-owned evidence',
      'CSS Modules require exported local class, ICSS, composes, generated class-name, and JS/TS/JSX use-site graph evidence before equivalence can be claimed',
      'cascade/render equivalence requires browser evidence and should remain fail-closed when only parser evidence is present'
    ]
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
  nativeImportLanguageProfile('unison', { aliases: ['u'], extensions: ['.u', '.unison'], parserAdapters: ['unison-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'contentAddressedDefinitions', 'abilityHandlers', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('dhall', { extensions: ['.dhall'], parserAdapters: ['dhall-parser', 'tree-sitter-dhall'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'totalEvaluation', 'importIntegrity', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('cue', { extensions: ['.cue'], parserAdapters: ['cue-parser', 'cuelang'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'constraintSolving', 'schemaUnification', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('nix', { extensions: ['.nix'], parserAdapters: ['rnix', 'nix-parser', 'tree-sitter-nix'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'lazyEvaluation', 'derivationGraph', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('nickel', { extensions: ['.ncl'], parserAdapters: ['nickel-parser', 'tree-sitter-nickel'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'contracts', 'mergeSemantics', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('roc', { extensions: ['.roc'], parserAdapters: ['roc-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'platformEffects', 'abilities', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('koka', { extensions: ['.kk'], parserAdapters: ['koka-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'effectTypes', 'handlerSemantics', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('elm', { extensions: ['.elm'], parserAdapters: ['elm-parser', 'tree-sitter-elm'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'architectureRuntime', 'ports', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('purescript', { aliases: ['purs'], extensions: ['.purs'], parserAdapters: ['purescript-cst', 'tree-sitter-purescript'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'rowTypes', 'effectRows', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('gleam', { extensions: ['.gleam'], parserAdapters: ['gleam-parser', 'tree-sitter-gleam'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'beamRuntime', 'otpBoundaries', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('fsharp', { aliases: ['f#', 'fs', 'fsx'], extensions: ['.fs', '.fsx', '.fsi'], parserAdapters: ['fsharp-compiler-service', 'tree-sitter-fsharp'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dotnetRuntime', 'computationExpressions', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('lean', { aliases: ['lean4'], extensions: ['.lean'], parserAdapters: ['lean-elab', 'tree-sitter-lean'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dependentTypes', 'elaboration', 'proofTerms', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('coq', { aliases: ['rocq'], extensions: ['.v'], parserAdapters: ['coq-serapi', 'rocq-serapi'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dependentTypes', 'tactics', 'proofTerms', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('agda', { extensions: ['.agda', '.lagda'], parserAdapters: ['agda-interface', 'tree-sitter-agda'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dependentTypes', 'terminationChecking', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('idris', { aliases: ['idr'], extensions: ['.idr'], parserAdapters: ['idris2-api', 'tree-sitter-idris'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dependentTypes', 'totalityChecking', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('prolog', { aliases: ['pl'], extensions: ['.pl', '.pro'], parserAdapters: ['swi-prolog', 'tree-sitter-prolog'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'logicResolution', 'cutSemantics', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('mercury', { extensions: ['.m'], parserAdapters: ['mercury-parser'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'modesDeterminism', 'logicResolution', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('smalltalk', { aliases: ['st'], extensions: ['.st'], parserAdapters: ['smalltalk-parser', 'tree-sitter-smalltalk'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'imageRuntime', 'messageDispatch', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('forth', { aliases: ['fth'], extensions: ['.fth', '.forth'], parserAdapters: ['forth-parser', 'tree-sitter-forth'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'stackEffects', 'dictionaryMutation', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('factor', { extensions: ['.factor'], parserAdapters: ['factor-parser'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'stackEffects', 'vocabularyResolution', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('apl', { extensions: ['.apl'], parserAdapters: ['apl-parser', 'tree-sitter-apl'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'arrayRankSemantics', 'glyphNormalization', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('j', { extensions: ['.ijs'], parserAdapters: ['j-parser'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'arrayRankSemantics', 'tacitDefinitions', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('q', { extensions: ['.q'], parserAdapters: ['q-parser'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'arrayTableSemantics', 'temporalRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('pony', { extensions: ['.pony'], parserAdapters: ['pony-parser', 'tree-sitter-pony'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'referenceCapabilities', 'actorRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('make', { extensions: ['Makefile', '.mk'], parserAdapters: ['make-parser', 'tree-sitter-make'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'buildGraphRuntime', 'shellRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('starlark', { aliases: ['bzl'], extensions: ['.bzl', 'BUILD', 'WORKSPACE'], parserAdapters: ['starlark-go', 'tree-sitter-starlark'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'buildGraphRuntime', 'repositoryRules', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('hcl', { aliases: ['tf'], extensions: ['.hcl', '.tf'], parserAdapters: ['hcl-parser', 'tree-sitter-hcl'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'providerSchemaCatalog', 'planRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('rego', { extensions: ['.rego'], parserAdapters: ['opa-parser', 'tree-sitter-rego'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'policyInputSchema', 'partialEvaluation', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('cel', { extensions: ['.cel'], parserAdapters: ['cel-parser'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'hostTypeEnvironment', 'policyRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('solidity', { aliases: ['sol'], extensions: ['.sol'], parserAdapters: ['solc-ast', 'tree-sitter-solidity'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'evmRuntime', 'contractAbi', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('wasm', { aliases: ['wat'], extensions: ['.wat', '.wasm'], parserAdapters: ['wabt', 'wasm-tools'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'bytecodeSemantics', 'hostImports', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('assembly', { aliases: ['asm', 's'], extensions: ['.asm', '.s'], parserAdapters: ['tree-sitter-asm', 'capstone', 'llvm-mc'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'memoryEffects', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('x86', { extensions: ['.x86.asm'], parserAdapters: ['nasm', 'capstone', 'llvm-mc'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'flagsSemantics', 'callingConvention', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('x86-64', { aliases: ['x64', 'x86_64', 'amd64'], extensions: ['.x64.asm'], parserAdapters: ['nasm', 'capstone', 'llvm-mc'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'flagsSemantics', 'callingConvention', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('arm64', { aliases: ['aarch64'], extensions: ['.aarch64.s'], parserAdapters: ['llvm-mc', 'capstone'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'conditionFlags', 'callingConvention', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('riscv', { aliases: ['risc-v'], extensions: ['.riscv.s'], parserAdapters: ['llvm-mc', 'capstone'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'memoryModel', 'callingConvention', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('llvm-ir', { aliases: ['ll', 'llvm'], extensions: ['.ll'], parserAdapters: ['llvm-ir-parser', 'llvm-as'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'ssaSemantics', 'targetDataLayout', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('ebpf', { aliases: ['bpf'], extensions: ['.bpf.c', '.ebpf'], parserAdapters: ['llvm-bpf', 'bpftool'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'verifierSemantics', 'kernelHelperRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('asm-6502', { aliases: ['6502'], extensions: ['.6502.asm'], parserAdapters: ['ca65', 'vasm', 'asm6'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'statusFlags', 'memoryMap', 'cycleTiming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('asm-65816', { aliases: ['65816', 'snes'], extensions: ['.65816.asm', '.sfc.asm'], parserAdapters: ['asar', 'ca65', 'wla-dx'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'statusFlags', 'bankedMemory', 'cycleTiming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('z80', { extensions: ['.z80.asm'], parserAdapters: ['z80asm', 'wla-dx'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'statusFlags', 'memoryMap', 'cycleTiming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('sm83', { aliases: ['gbz80', 'gameboy'], extensions: ['.gb.asm', '.sm83.asm'], parserAdapters: ['rgbasm', 'wla-dx'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'statusFlags', 'memoryMap', 'cycleTiming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('m68k', { extensions: ['.m68k.asm', '.68k.asm'], parserAdapters: ['vasm', 'llvm-mc'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'registerEffects', 'conditionCodes', 'memoryMap', 'cycleTiming', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('verilog', { aliases: ['v'], extensions: ['.v', '.sv'], parserAdapters: ['verible', 'slang', 'tree-sitter-verilog'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'hardwareConcurrency', 'synthesisSemantics', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('vhdl', { extensions: ['.vhdl', '.vhd'], parserAdapters: ['ghdl', 'tree-sitter-vhdl'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'hardwareConcurrency', 'elaborationSemantics', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('graphql', { aliases: ['gql'], extensions: ['.graphql', '.gql'], parserAdapters: ['graphql-js', 'tree-sitter-graphql'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'schemaCatalog', 'resolverRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('cypher', { extensions: ['.cypher'], parserAdapters: ['cypher-parser', 'tree-sitter-cypher'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'graphSchemaCatalog', 'queryPlannerRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('sparql', { aliases: ['rq'], extensions: ['.sparql', '.rq'], parserAdapters: ['sparqljs', 'tree-sitter-sparql'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'rdfSchemaCatalog', 'entailmentRegime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('datalog', { aliases: ['dl'], extensions: ['.dl', '.datalog'], parserAdapters: ['souffle', 'tree-sitter-datalog'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'logicProgramSemantics', 'fixedPointEvaluation', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('jsonpath', { extensions: ['.jsonpath'], parserAdapters: ['jsonpath-parser', 'jsonpath-plus'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'jsonSchemaCatalog', 'selectorRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('xpath', { extensions: ['.xpath'], parserAdapters: ['xpath-parser', 'fontoxpath'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'xmlSchemaCatalog', 'namespaceContext', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('promql', { extensions: ['.promql'], parserAdapters: ['prometheus-promql-parser', 'tree-sitter-promql'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'metricCatalog', 'timeSeriesRuntime', 'sourceMapApproximation', 'sourcePreservation'] }),
  nativeImportLanguageProfile('r', { aliases: ['R'], extensions: ['.r', '.R'], parserAdapters: ['r-parser', 'tree-sitter'], lossKinds: ['declarationOnlyCoverage', 'opaqueNative', 'dynamicRuntime', 'sourceMapApproximation', 'sourcePreservation'] })
]);


export function nativeProjectionTargetsForLanguage(language, aliases = []) {
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


export function normalizeProjectionMatrixTargets(targets) {
  const canonicalTargets = { ts: 'typescript', js: 'javascript', rs: 'rust', py: 'python', h: 'c', htm: 'html' };
  return uniqueStrings((Array.isArray(targets) ? targets : [targets])
    .map((target) => {
      if (target === undefined || target === null) return undefined;
      const normalized = String(target).trim().toLowerCase();
      return canonicalTargets[normalized] ?? normalized;
    })
    .filter(Boolean));
}


export function nativeLanguageCompileTarget(language, aliases = []) {
  const ids = [language, ...aliases].map(normalizeNativeLanguageId);
  if (ids.includes('typescript')) return 'typescript';
  if (ids.includes('javascript')) return 'javascript';
  if (ids.includes('html')) return 'html';
  if (ids.includes('css')) return 'css';
  if (ids.includes('rust')) return 'rust';
  if (ids.includes('python')) return 'python';
  if (ids.includes('c')) return 'c';
  return undefined;
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

export function mergeNativeImportProfiles(languages, imports = [], adapters = [], targetAdapters = [], context = {}) {
  const profilesByLanguage = new Map();
  for (const profile of languages ?? []) {
    const normalized = normalizeNativeLanguageId(profile.language ?? profile);
    profilesByLanguage.set(normalized, normalizeNativeImportLanguageProfile(profile, normalized));
  }
  for (const imported of imports ?? []) {
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
  for (const adapter of adapters ?? []) {
    const normalized = normalizeNativeLanguageId(adapter?.language);
    if (!normalized) continue;
    const existing = profilesByLanguage.get(normalized) ?? nativeImportLanguageProfile(normalized, { supportsLightweightScan: false, parserAdapters: [] });
    profilesByLanguage.set(normalized, {
      ...existing,
      parserAdapters: uniqueStrings([...(existing.parserAdapters ?? []), adapter.parser ?? adapter.id].filter(Boolean))
    });
  }
  for (const adapter of targetAdapters ?? []) {
    const summary = context.safeNativeTargetProjectionAdapterSummary?.(adapter);
    const normalized = normalizeNativeLanguageId(summary?.sourceLanguage ?? adapter?.sourceLanguage ?? adapter?.language);
    if (!normalized) continue;
    const existing = profilesByLanguage.get(normalized) ?? nativeImportLanguageProfile(normalized, { supportsLightweightScan: false, parserAdapters: [] });
    profilesByLanguage.set(normalized, {
      ...existing,
      projectionTargets: uniqueStrings([...(existing.projectionTargets ?? []), summary?.target ?? adapter?.target ?? adapter?.targetLanguage].filter(Boolean))
    });
  }
  return [...profilesByLanguage.values()].sort((left, right) => left.language.localeCompare(right.language));
}
