import {
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';
import { NativeImportAdditionalLanguageProfiles } from './native-import-language-profiles-additional.js';

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
  ...NativeImportAdditionalLanguageProfiles.map((profile) => nativeImportLanguageProfile(profile.language, profile)),
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
