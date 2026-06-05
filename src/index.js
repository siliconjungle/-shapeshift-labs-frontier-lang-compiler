import {
  createDocument,
  createImportResult,
  createNativeAstRecord,
  createPatch,
  createSemanticIndexRecord,
  createSourceMapRecord,
  createUniversalAstEnvelope,
  hashDocumentBase,
  hashSemanticValue,
  nativeSourceNode,
  stableUniversalAstJson,
  validateSourceMapRecord,
  validateUniversalAstEnvelope
} from '@shapeshift-labs/frontier-lang-kernel';
import { parseFrontierFile, parseFrontierSource } from '@shapeshift-labs/frontier-lang-parser';
import { checkDocument } from '@shapeshift-labs/frontier-lang-checker';
import { renderTypeScriptAst, toTypeScriptAst } from '@shapeshift-labs/frontier-lang-typescript';
import { renderJavaScriptAst, toJavaScriptAst } from '@shapeshift-labs/frontier-lang-javascript';
import { renderRustAst, toRustAst } from '@shapeshift-labs/frontier-lang-rust';
import { renderPythonAst, toPythonAst } from '@shapeshift-labs/frontier-lang-python';
import { renderCAst, toCAst } from '@shapeshift-labs/frontier-lang-c';

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

export const NativeImportTaxonomyKinds = Object.freeze([
  'exactAstImport',
  'declarationsOnly',
  'opaqueBodies',
  'macroExpansion',
  'preprocessor',
  'metaprogramming',
  'generatedCode',
  'sourcePreservation',
  'parserDiagnostics',
  'unsupportedSyntax',
  'partialSemanticIndex',
  'sourceMapApproximation'
]);

export const NativeImportLossKinds = Object.freeze([
  'declarationOnlyCoverage',
  'opaqueNative',
  'macroExpansion',
  'preprocessor',
  'metaprogramming',
  'generatedCode',
  'sourcePreservation',
  'parserDiagnostic',
  'unsupportedSyntax',
  'partialSemanticIndex',
  'sourceMapApproximation'
]);

export const NativeImportReadinessBySeverity = Object.freeze({
  none: 'ready',
  info: 'ready-with-losses',
  warning: 'needs-review',
  error: 'blocked'
});

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
    lossKinds: {}
  });
  return {
    kind: 'frontier.lang.nativeImportCoverageMatrix',
    version: 1,
    generatedAt: input.generatedAt ?? Date.now(),
    languages,
    summary,
    metadata: {
      compileTargets: [...FrontierCompileTargets],
      note: 'Coverage is evidence and capability metadata, not a claim that every language feature is losslessly portable.'
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
    evidence: {
      total: evidence.length,
      failed: evidence.filter((record) => record.status === 'failed').map((record) => record.id),
      ids: evidence.map((record) => record.id)
    },
    summary: {
      imports: imports.length,
      symbols: symbols.length,
      ownershipRegions: ownershipRegions.length,
      sourceMapMappings: sourceMapMappings.length,
      readiness,
      emptySemanticIndex: symbols.length === 0
    },
    metadata: {
      note: 'Sidecar is source-addressable semantic evidence for merge admission; lightweight scanner regions remain review-required unless exact parser evidence upgrades readiness.',
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

export function createTreeSitterNativeImporterAdapter(options = {}) {
  return {
    id: options.id ?? `frontier.tree-sitter-${idFragment(options.language ?? 'source')}-native-importer`,
    language: options.language ?? 'source',
    parser: options.parserName ?? options.parser ?? 'tree-sitter',
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
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
  const sourceEvidence = adapterDiagnosticsEvidence(summary, diagnostics, {
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
      adapterCapabilities: summary.capabilities,
      supportedExtensions: summary.supportedExtensions,
      diagnostics: diagnostics.map(serializableDiagnostic),
      ...input.metadata,
      ...parseResult.metadata
    },
    nativeAstMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
      ...input.nativeAstMetadata,
      ...parseResult.nativeAstMetadata
    },
    nativeSourceMetadata: {
      adapterId: summary.id,
      adapterVersion: summary.version,
      parser,
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
    adapter: summary,
    diagnostics
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
  const sourceHash = input.sourceHash ?? input.nativeAst?.sourceHash ?? (input.sourceText ? hashSemanticValue(input.sourceText) : hashSemanticValue(input.nativeAst?.nodes ?? input.nativeAst ?? {}));
  const targetPath = input.targetPath ?? input.target?.emitPath;
  const targetHash = input.targetHash;
  const importIdPart = idFragment(input.id ?? input.nativeSourceId ?? sourcePath ?? language);
  const lightweight = !input.nativeAst && !input.nodes && input.sourceText
    ? createLightweightNativeImport({
      language,
      sourceText: input.sourceText,
      sourcePath,
      sourceHash,
      parser: input.parser
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
      ...lightweight?.metadata,
      ...input.nativeAstMetadata
    }
  });
  const frontierNodeIds = input.frontierNodeIds ?? input.semanticNodes?.map((node) => node.id) ?? [];
  const semanticNodes = input.semanticNodes ?? [];
  const semanticStatus = input.semanticStatus ?? (semanticNodes.length ? 'mapped' : 'native-only');
  const losses = normalizeNativeLossRecords(input.losses ?? nativeAst.losses ?? lightweight?.losses ?? []);
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
      semanticStatus
    }
  }];
  const lossSummary = summarizeNativeImportLosses(losses, {
    exactAst: Boolean(input.nativeAst || input.nodes),
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
    target: input.target,
    targetPath: inferredTargetPath,
    targetHash,
    sourcePath,
    sourceHash,
    defaultSourceMapId: `source_map_${importIdPart}`
  });
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
      nativeImportLossSummary: lossSummary,
      ...input.metadata
    }
  });
  return {
    ...withNativeImportReadiness(importResult, lossSummary),
    nativeSource
  };
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
        ownershipRegionKey: ownershipRegion.key
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
          ownershipRegionKey: ownershipRegion.key
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
        precision: 'declaration'
      });
    }
    if (declaration.loss) losses.push(declaration.loss);
  }
  losses.push(...lightweightCoverageLosses(input, declarations));

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
    metadata: { parser, scanKind: 'lightweight-declaration-scan', declarationCount: declarations.length }
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
  const sourceText = options.sourceText ?? options.preservedSourceText ?? options.exactSourceText;
  if (typeof sourceText !== 'string') return undefined;
  const sourceHash = options.sourceHash ?? hashSemanticValue(sourceText);
  const hashVerified = Boolean(context.sourceHash);
  const exact = !context.sourceHash || sourceHash === context.sourceHash || options.verifySourceHash === false;
  return {
    sourceText,
    sourceHash,
    hashVerified,
    exact,
    mismatch: hashVerified && sourceHash !== context.sourceHash && options.verifySourceHash !== false
  };
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
    kind: 'sourcePreservation',
    severity: 'warning',
    message,
    metadata: {
      reason,
      projectionMode: 'native-source-stubs',
      expectedSourceHash: context.sourceHash,
      providedSourceHash: candidateSource?.sourceHash
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
  for (const { line, number } of sourceLines(input.sourceText)) {
    const trimmed = line.trim();
    const declarationLine = trimmed.replace(/^(?:export\s+)?(?:declare\s+)?/, '');
    let match;
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
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', 'variable', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\*?\s*\(([^)]*)\)/))) {
      declarations.push(nativeDeclaration(input, number, 'CommonJsFunctionExport', 'function', match[1], { parameters: splitParameters(match[2]) }, true));
    } else if ((match = trimmed.match(/^(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'CommonJsExport', 'variable', match[1], { export: 'commonjs' }, false));
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
  }
  return declarations;
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

function nativeDeclaration(input, lineNumber, languageKind, symbolKind, name, fields = {}, hasBody = false) {
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
    metadata: { scan: 'lightweight-declaration', hasBody },
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

function lightweightCoverageLosses(input, declarations) {
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
      message: 'Comments, whitespace, token order, directives, and formatting are not preserved by the lightweight importer.',
      span
    }
  ];
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
        lossIds: normalizeReferenceIds(mapping.lossIds, lossIdsForNativeNode(context.losses ?? nativeAst?.losses ?? [], nativeAstNodeId)),
        precision: normalizeSourceMapPrecision(mapping.precision, sourceSpan, generatedSpan)
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
    if (normalized === 'exact' || normalized === 'declaration' || normalized === 'line' || normalized === 'estimated' || normalized === 'unknown') return normalized;
    if (normalized === 'estimate' || normalized === 'approx' || normalized === 'approximate' || normalized === 'approximated') return 'estimated';
    return explicit;
  }
  if (hasExactSpan(sourceSpan) && hasExactSpan(generatedSpan)) return 'exact';
  if (sourceSpan?.startLine && generatedSpan?.startLine) return 'line';
  if (sourceSpan?.startLine) return 'declaration';
  if (generatedSpan?.startLine) return 'line';
  return 'unknown';
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
  if (kind === 'sourcePreservation' || kind === 'nonRoundTrippable') return 'sourcePreservation';
  if (kind === 'parserDiagnostic') return 'parserDiagnostics';
  if (kind === 'unsupportedSyntax' || kind === 'unsupportedSemantic') return 'unsupportedSyntax';
  if (kind === 'partialSemanticIndex') return 'partialSemanticIndex';
  if (kind === 'sourceMapApproximation') return 'sourceMapApproximation';
  return String(kind ?? 'opaqueNative');
}

function nativeImportLanguageProfile(language, input = {}) {
  const lossKinds = input.lossKinds ?? ['declarationOnlyCoverage', 'opaqueNative', 'sourceMapApproximation', 'sourcePreservation'];
  return Object.freeze({
    language,
    aliases: Object.freeze(uniqueStrings(input.aliases ?? [])),
    extensions: Object.freeze(uniqueStrings(input.extensions ?? [])),
    supportsLightweightScan: input.supportsLightweightScan !== false,
    parserAdapters: Object.freeze(uniqueStrings(input.parserAdapters ?? ['tree-sitter'])),
    projectionTargets: Object.freeze(uniqueStrings(input.projectionTargets ?? FrontierCompileTargets)),
    knownLossKinds: Object.freeze(uniqueStrings(lossKinds)),
    defaultReadiness: input.defaultReadiness ?? 'needs-review',
    notes: Object.freeze(uniqueStrings(input.notes ?? ['lightweight scanner records declarations only; exact parser adapters must be injected by the host']))
  });
}

function mergeNativeImportProfiles(languages, imports, adapters) {
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
    projectionTargets: uniqueStrings(profile.projectionTargets ?? FrontierCompileTargets),
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

function semanticImportSidecarEntry(imported, index, options) {
  const semanticIndex = imported?.semanticIndex ?? imported?.universalAst?.semanticIndex;
  const nativeAst = imported?.nativeAst ?? imported?.nativeSource?.ast;
  const sourceMaps = imported?.sourceMaps ?? imported?.universalAst?.sourceMaps ?? [];
  const sourceMapMappings = sourceMaps.flatMap((sourceMap) => sourceMap?.mappings ?? []);
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
      readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review'
    });
  }
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
    readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review',
    emptySemanticIndex: symbols.length === 0,
    symbols,
    ownershipRegions: uniqueRecordsById(regions)
  };
}

function semanticOwnershipRegionForSymbol(imported, symbol, mapping, nativeNode, options = {}) {
  const sourcePath = mapping?.sourceSpan?.path ?? symbol.definitionSpan?.path ?? nativeNode?.span?.path ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath;
  const language = symbol.language ?? imported?.language ?? imported?.nativeAst?.language ?? imported?.nativeSource?.language;
  const sourceSpan = mapping?.sourceSpan ?? symbol.definitionSpan ?? nativeNode?.span;
  const key = [
    options.regionPrefix ?? 'source',
    sourcePath ?? `${language}:memory`,
    symbol.kind ?? 'symbol',
    symbol.name ?? symbol.id
  ].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
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
    mergePolicy: 'single-writer-review-required'
  };
}

function semanticOwnershipRegionForDeclaration(input, declaration, documentId) {
  const name = declaration.name ?? declaration.importPath ?? declaration.nodeId ?? declaration.nativeNode?.id;
  const kind = declaration.symbolKind ?? declaration.kind ?? declaration.nativeNode?.kind ?? 'symbol';
  const sourcePath = declaration.span?.path ?? declaration.nativeNode?.span?.path ?? input.sourcePath ?? `${input.language}:memory`;
  const key = ['source', sourcePath, kind, name].map((part) => String(part).replace(/\s+/g, ' ').trim()).join('#');
  return {
    id: `region_${idFragment(key)}`,
    key,
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
    mergePolicy: 'single-writer-review-required'
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
    supportedOperations: ['replace-region', 'insert-before-region', 'insert-after-region'],
    projection: {
      sourceLanguage: region.language,
      targetPath: options.targetPath ?? region.sourcePath,
      requiresSourceMap: true
    }
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
  return {
    ...importResult,
    mergeCandidates,
    metadata: {
      ...importResult.metadata,
      nativeImportLossSummary: lossSummary,
      semanticMergeReadiness: mergeCandidates[0]?.readiness ?? lossSummary.semanticMergeReadiness,
      lossCategories: lossSummary.categories,
      lossSeverityCounts: lossSummary.bySeverity,
      lossKindCounts: lossSummary.byKind
    }
  };
}

function maxSemanticMergeReadiness(left, right) {
  const leftRank = semanticMergeReadinessRank[left] ?? semanticMergeReadinessRank['needs-review'];
  const rightRank = semanticMergeReadinessRank[right] ?? semanticMergeReadinessRank['needs-review'];
  return leftRank >= rightRank ? left : right;
}

export function createUniversalAstFromDocument(document, input = {}) {
  return createUniversalAstEnvelope({
    id: input.id ?? `universal_ast_${idFragment(document.id)}`,
    document,
    semanticIndex: input.semanticIndex,
    sourceMaps: input.sourceMaps ?? [],
    evidence: input.evidence ?? [],
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

function createJavaScriptSyntaxImporterAdapter(options) {
  return {
    id: options.id,
    language: options.language,
    parser: options.parser,
    version: options.version,
    capabilities: uniqueStrings(['nativeAst', 'semanticIndex', 'sourceMaps', 'diagnostics', ...(options.capabilities ?? [])]),
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
      ownershipRegionKey: ownershipRegion.key
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
        ownershipRegionKey: ownershipRegion.key
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
      ...input.documentMetadata
    }
  });
  const universalAst = createUniversalAstEnvelope({
    id: input.universalAstId ?? `universal_ast_${idPart}`,
    document,
    nativeSources,
    semanticIndex,
    sourceMaps,
    losses: uniqueByLossId(losses),
    evidence: uniqueByEvidenceId(evidence),
    metadata: {
      sourceLanguage: input.language ?? 'mixed',
      projectRoot: input.projectRoot,
      sourceCount: imports.length,
      ...input.universalAstMetadata
    }
  });
  const patch = createPatch({
    id: input.patchId ?? `patch_${idPart}_project_import`,
    author: input.author ?? '@shapeshift-labs/frontier-lang-compiler/importNativeProject',
    risk: losses.some((loss) => loss.severity === 'error') ? 'high' : losses.some((loss) => loss.severity === 'warning') ? 'medium' : 'low',
    operations,
    evidence: uniqueByEvidenceId(evidence),
    metadata: {
      semanticIndexId: semanticIndex?.id,
      universalAstId: universalAst.id,
      sourceMapIds: sourceMaps.map((sourceMap) => sourceMap.id),
      sourceCount: imports.length
    }
  });
  return {
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
    losses: uniqueByLossId(losses),
    evidence: uniqueByEvidenceId(evidence),
    mergeCandidates,
    metadata: {
      sourceCount: imports.length,
      sourcePaths: imports.map((result) => result.sourcePath).filter(Boolean),
      ...input.metadata
    }
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
  return Object.freeze({
    ...summaryInput,
    capabilities: normalizeStringList(adapter.capabilities),
    supportedExtensions: normalizeStringList(adapter.supportedExtensions).map((extension) => extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`),
    diagnostics: normalizeAdapterDiagnostics(adapter.diagnostics, summaryInput, {
      language: adapter.language,
      parser: String(adapter.parser),
      parserVersion: adapter.version === undefined ? undefined : String(adapter.version)
    }, 'adapter')
  });
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

function literalSyntaxValue(node) {
  if (node.value === null || typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') return node.value;
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
