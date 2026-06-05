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

export const NativeImportRegionTaxonomyKinds = Object.freeze([
  'symbol',
  'declaration',
  'import',
  'body',
  'call',
  'type',
  'effect',
  'generatedOutput'
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
      note: 'Coverage is evidence and capability metadata, not a claim that every language feature is losslessly portable.'
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
      ...(sourcePreservation ? {
        sourcePreservationId: sourcePreservation.id,
        sourcePreservation
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
        ownershipRegionId: mapping.ownershipRegionId ?? symbol?.metadata?.ownershipRegionId,
        ownershipRegionKey: mapping.ownershipRegionKey ?? symbol?.metadata?.ownershipRegionKey,
        ownershipRegionKind: mapping.ownershipRegionKind ?? symbol?.metadata?.ownershipRegionKind,
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
  if (kind === 'overloadResolution' || kind === 'typeInference') return 'overloadTypeInference';
  if (kind === 'sourcePreservation' || kind === 'commentsTrivia' || kind === 'nonRoundTrippable') return 'sourcePreservation';
  if (kind === 'parserDiagnostic') return 'parserDiagnostics';
  if (kind === 'unsupportedSyntax' || kind === 'unsupportedSemantic') return 'unsupportedSyntax';
  if (kind === 'partialSemanticIndex' || kind === 'unverifiedNativeAst') return 'partialSemanticIndex';
  if (kind === 'sourceMapApproximation') return 'sourceMapApproximation';
  if (kind === 'targetProjectionLoss') return 'targetProjectionLoss';
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
    readiness: imported?.metadata?.semanticMergeReadiness ?? imported?.mergeCandidates?.[0]?.readiness ?? 'needs-review',
    emptySemanticIndex: symbols.length === 0,
    regionTaxonomy,
    symbols,
    ownershipRegions
  };
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
