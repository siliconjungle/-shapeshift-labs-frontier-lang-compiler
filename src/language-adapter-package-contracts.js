import {
  nativeProjectionTargetsForLanguage
} from './coverage-matrix-profiles.js';
import {
  NativeParserAstFormatProfiles,
  parserAstFormatIdForParser
} from './native-parser-ast-format-profiles.js';
import {
  idFragment,
  normalizeNativeLanguageId,
  uniqueStrings
} from './native-import-utils.js';

export const LanguageAdapterPackageReleaseReadinessStatuses = Object.freeze([
  'ready',
  'ready-with-losses',
  'needs-review',
  'blocked'
]);

const packageRows = [
  row('@shapeshift-labs/frontier-lang-typescript', '0.3.8', 'typescript', 'typescript-compiler-api', { target: 'typescript' }),
  row('@shapeshift-labs/frontier-lang-javascript', '0.2.8', 'javascript', 'estree', { target: 'javascript', formats: ['estree', 'babel'] }),
  row('@shapeshift-labs/frontier-lang-rust', '0.2.8', 'rust', 'rust-syn', { target: 'rust', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'macroExpansionEvidence'] }),
  row('@shapeshift-labs/frontier-lang-python', '0.2.8', 'python', 'python-ast', { target: 'python', formats: ['python-ast', 'libcst'] }),
  row('@shapeshift-labs/frontier-lang-c', '0.2.8', 'c', 'clang-ast-json', { target: 'c', proofKeys: ['parserAst', 'sourceMap', 'semanticSidecar', 'compileCommandsHash', 'preprocessorRecordsHash'] }),
  platform('@shapeshift-labs/frontier-lang-java', '0.1.6', 'java', 'java-ast', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-kotlin', '0.1.6', 'kotlin', 'kotlin-psi', ['semanticdb', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-swift', '0.1.6', 'swift', 'swift-syntax', ['sourcekit-lsp', 'lsp']),
  platform('@shapeshift-labs/frontier-lang-csharp', '0.1.6', 'csharp', 'roslyn-csharp', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-go', '0.1.6', 'go', 'go-ast', ['lsp']),
  platform('@shapeshift-labs/frontier-lang-clang', '0.1.6', 'c', 'clang-ast-json', ['lsp'], {
    supportedLanguages: ['c', 'cpp'],
    proofKeys: ['parserAst', 'semanticIndex', 'compileCommandsHash', 'preprocessorRecordsHash']
  })
];

export const LanguageAdapterPackageContracts = Object.freeze(packageRows.map(createLanguageAdapterPackageContract));

export function createLanguageAdapterPackageContract(input = {}) {
  const language = normalizeNativeLanguageId(input.language);
  const parser = String(input.parser ?? input.sourceParser?.parser ?? input.parserFormat ?? 'unknown');
  const format = parserAstFormatIdForParser(input.parserFormat ?? input.sourceParser?.format ?? parser);
  const formatProfile = NativeParserAstFormatProfiles.find((profile) =>
    profile.id === format || (profile.aliases ?? []).includes(format)
  );
  const packageName = String(input.packageName ?? input.package?.name ?? `@shapeshift-labs/frontier-lang-${language || 'adapter'}`);
  const packageVersion = String(input.packageVersion ?? input.package?.version ?? '0.0.0');
  const packageClass = input.packageClass ?? input.package?.packageClass ?? 'target-projection';
  const targetRows = projectionRows(input, language);
  const releaseStatus = normalizeReleaseStatus(input.releaseReadiness?.status ?? input.releaseReadiness ?? input.readiness);
  const releaseReady = input.releaseReadiness?.releaseReady ?? input.releaseReady ?? (releaseStatus === 'ready' || releaseStatus === 'ready-with-losses');
  const supportedTargetRows = targetRows.filter((target) => target.supported);
  const contract = {
    kind: 'frontier.lang.languageAdapterPackageContract',
    version: 3,
    id: input.id ?? `language_adapter_package_contract_${idFragment(packageName)}`,
    packageName,
    packageVersion,
    package: Object.freeze({
      name: packageName,
      version: packageVersion,
      exportPath: input.exportPath ?? input.package?.exportPath ?? '.',
      packageClass,
      family: input.family ?? input.package?.family ?? adapterFamily(language, parser),
      adapterId: input.adapterId ?? `${idFragment(packageName)}_adapter`
    }),
    sourceParser: Object.freeze({
      language,
      parser,
      format,
      supportedLanguages: freezeStrings(input.supportedLanguages ?? input.languages ?? input.sourceParser?.supportedLanguages ?? [language]),
      supportedFormats: freezeStrings(input.supportedFormats ?? input.formats ?? [format]),
      formatKind: formatProfile?.kind ?? 'unknown',
      exactness: input.exactness ?? formatProfile?.exactness ?? 'unknown',
      sourceRangeModel: input.sourceRangeModel ?? formatProfile?.sourceRangeModel ?? 'unknown',
      preservesTokens: input.preservesTokens ?? formatProfile?.preservesTokens ?? false,
      preservesTrivia: input.preservesTrivia ?? formatProfile?.preservesTrivia ?? false,
      supportsErrorRecovery: input.supportsErrorRecovery ?? formatProfile?.supportsErrorRecovery ?? false,
      caveats: freezeTextList(input.sourceParser?.caveats ?? input.parserCaveats ?? formatProfile?.notes ?? [])
    }),
    targetProjection: Object.freeze({
      supported: targetRows.some((target) => target.supported),
      targets: freezeStrings(supportedTargetRows.map((target) => target.target)),
      defaultTarget: input.target ?? supportedTargetRows[0]?.target,
      support: Object.freeze(targetRows),
      caveats: freezeTextList(input.targetProjection?.caveats ?? input.targetCaveats ?? targetProjectionCaveats(targetRows, packageClass))
    }),
    semanticIndex: Object.freeze({
      supported: input.semanticIndex?.supported ?? true,
      formats: freezeStrings(input.semanticIndex?.formats ?? ['frontier-semantic-index']),
      capabilities: freezeStrings(input.semanticIndex?.capabilities ?? ['declarations', 'symbols', 'sourceMapMappings', 'ownershipRegions']),
      hostEvidenceRequired: input.semanticIndex?.hostEvidenceRequired ?? packageClass !== 'target-projection'
    }),
    proofEvidence: Object.freeze({
      supported: input.proofEvidence?.supported ?? true,
      evidenceKinds: freezeStrings(input.proofEvidence?.evidenceKinds ?? ['parser', 'source-map', 'semantic-sidecar', 'package-contract']),
      proofKinds: freezeStrings(input.proofEvidence?.proofKinds ?? ['semantic-import-sidecar', 'native-import-result-contract']),
      requiredEvidenceKeys: freezeStrings(input.proofEvidence?.requiredEvidenceKeys ?? input.proofKeys ?? ['parserAst', 'sourceMap', 'semanticSidecar']),
      hostEvidenceRequired: input.proofEvidence?.hostEvidenceRequired ?? packageClass !== 'target-projection'
    }),
    releaseReadiness: Object.freeze({
      status: releaseStatus,
      releaseReady,
      packageName,
      packageVersion,
      versionSource: input.releaseReadiness?.versionSource ?? input.versionSource ?? packageVersionSource(packageVersion, packageClass),
      reasons: freezeStrings(input.releaseReadiness?.reasons ?? input.reasons ?? releaseReasons(packageClass, releaseStatus)),
      blockers: freezeStrings(input.releaseReadiness?.blockers ?? input.blockers ?? (releaseReady ? [] : ['adapter package is a structural contract candidate'])),
      signals: freezeTextList(input.releaseReadiness?.signals ?? input.signals ?? releaseSignals(packageClass, releaseStatus, releaseReady, packageVersion, input.releaseReadiness?.versionSource ?? input.versionSource))
    }),
    runtime: Object.freeze({
      importsAdapterPackage: false,
      contractOnly: true,
      importPath: input.runtime?.importPath ?? packageName
    }),
    metadata: Object.freeze({
      note: 'Static adapter package contract metadata for release trains and semantic merge planners; querying it does not import the adapter package.',
      ...(input.metadata ?? {})
    })
  };
  return Object.freeze(contract);
}

export function getLanguageAdapterPackageContract(ref, contracts = LanguageAdapterPackageContracts) {
  if (ref && typeof ref === 'object') return queryLanguageAdapterPackageContracts(ref, contracts)[0];
  const text = String(ref ?? '').trim();
  const normalized = normalizeNativeLanguageId(text);
  return (contracts ?? []).find((contract) =>
    contract.id === text ||
    contract.packageName === text ||
    contract.package.name === text ||
    contract.package.adapterId === text ||
    contract.sourceParser.language === normalized
  );
}

export function queryLanguageAdapterPackageContracts(query = {}, contracts = LanguageAdapterPackageContracts) {
  const language = normalizeNativeLanguageId(query.language ?? query.sourceLanguage);
  const target = query.target ? String(query.target).toLowerCase() : '';
  const semanticFormat = query.semanticIndexFormat ? String(query.semanticIndexFormat).toLowerCase() : '';
  return (contracts ?? []).filter((contract) =>
    (!query.packageName || contract.packageName === query.packageName) &&
    (!query.packageClass || contract.package.packageClass === query.packageClass) &&
    (!language || contract.sourceParser.language === language) &&
    (!target || contract.targetProjection.targets.includes(target)) &&
    (!semanticFormat || contract.semanticIndex.formats.map((format) => format.toLowerCase()).includes(semanticFormat)) &&
    (query.releaseReady === undefined || contract.releaseReadiness.releaseReady === query.releaseReady) &&
    (query.importsAdapterPackage === undefined || contract.runtime.importsAdapterPackage === query.importsAdapterPackage) &&
    (query.proofEvidenceSupported === undefined || contract.proofEvidence.supported === query.proofEvidenceSupported)
  );
}

export function summarizeLanguageAdapterPackageContracts(contracts = LanguageAdapterPackageContracts) {
  const list = [...(contracts ?? [])];
  return Object.freeze({
    kind: 'frontier.lang.languageAdapterPackageContractSummary',
    version: 1,
    packages: list.length,
    releaseReady: list.filter((contract) => contract.releaseReadiness.releaseReady).length,
    runtimeImportsAdapterPackages: list.filter((contract) => contract.runtime.importsAdapterPackage).length,
    languages: freezeStrings(list.map((contract) => contract.sourceParser.language)),
    parserFormats: freezeStrings(list.map((contract) => contract.sourceParser.format)),
    projectionTargets: freezeStrings(list.flatMap((contract) => contract.targetProjection.targets)),
    semanticIndexFormats: freezeStrings(list.flatMap((contract) => contract.semanticIndex.formats)),
    byPackageClass: countContracts(list, (contract) => contract.package.packageClass),
    byReleaseReadiness: countContracts(list, (contract) => contract.releaseReadiness.status)
  });
}

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

function projectionRows(input, language) {
  const targets = input.targetProjection?.targets ?? input.targets ?? input.target ?? nativeProjectionTargetsForLanguage(language);
  const normalizedTargets = freezeStrings(targets);
  if (normalizedTargets.length === 0) {
    return [Object.freeze({
      target: 'none',
      supported: false,
      support: 'not-shipped',
      readiness: 'needs-review',
      lossClass: 'missingAdapter',
      reasons: Object.freeze(['No target projection package is declared for this platform importer contract.'])
    })];
  }
  return normalizedTargets.map((target) => Object.freeze({
    target,
    supported: true,
    support: input.targetProjection?.support ?? 'package-projection',
    readiness: input.targetProjection?.readiness ?? 'ready-with-losses',
    lossClass: input.targetProjection?.lossClass ?? 'targetAdapterProjection',
    reasons: freezeStrings(input.targetProjection?.reasons ?? ['Same-language target projection is package-owned; semantic equivalence still depends on evidence.'])
  }));
}

function normalizeReleaseStatus(value) {
  const status = String(value ?? 'ready-with-losses').toLowerCase();
  return LanguageAdapterPackageReleaseReadinessStatuses.includes(status) ? status : 'needs-review';
}

function releaseReasons(packageClass, status) {
  if (packageClass === 'platform-importer' && (status === 'ready' || status === 'ready-with-losses')) {
    return ['Platform importer package is published with explicit host parser, build graph, and semantic-evidence boundaries.'];
  }
  if (packageClass === 'platform-importer') return ['Platform importer contract is structural and requires host parser/build evidence before release.'];
  if (status === 'ready') return ['Package contract declares required parser, projection, semantic-index, and proof/evidence metadata.'];
  return ['Package contract is release-ready with explicit loss/evidence boundaries.'];
}

function packageVersionSource(packageVersion, packageClass) {
  if (packageVersion === '0.0.0') return 'related-package-catalog-placeholder';
  if (packageClass === 'target-projection') return 'package-json-dependency';
  return 'static-package-catalog';
}

function releaseSignals(packageClass, status, releaseReady, packageVersion, versionSource) {
  const source = versionSource ?? packageVersionSource(packageVersion, packageClass);
  const signals = ['Contract metadata is static and does not import the adapter package at runtime.'];
  if (source === 'package-json-dependency') signals.push('Package version must match this facade package.json dependency.');
  if (packageVersion === '0.0.0') signals.push('0.0.0 marks a structural placeholder until a standalone adapter package version is pinned.');
  if (packageClass !== 'target-projection') {
    signals.push(releaseReady
      ? 'Host parser, build graph, and semantic evidence remain required before semantic imports are high-confidence.'
      : 'Host parser, build graph, and semantic evidence are required before release.');
  }
  signals.push(releaseReady
    ? `Release status ${status} is ready for the facade with explicit loss boundaries.`
    : `Release status ${status} blocks package release without additional evidence.`);
  return signals;
}

function targetProjectionCaveats(targetRows, packageClass) {
  if (!targetRows.some((target) => target.supported)) {
    return ['No target projection package is declared; preserve native source or require host-owned target adapter evidence.'];
  }
  const caveats = ['Target projection support is a package-contract claim; semantic equivalence still depends on parser, source-map, and proof evidence.'];
  if (packageClass !== 'target-projection') caveats.push('Platform importer contracts do not ship target projection adapters from this facade.');
  return caveats;
}

function adapterFamily(language, parser) {
  if (language === 'javascript' || language === 'typescript') return 'javascript-typescript';
  if (language === 'java' || language === 'kotlin') return 'jvm';
  if (language === 'csharp') return 'dotnet';
  if (language === 'c' || language === 'cpp' || language === 'rust') return 'systems';
  return language || parser || 'native';
}

function freezeStrings(value) {
  if (value === undefined || value === null) return Object.freeze([]);
  return Object.freeze(uniqueStrings(Array.isArray(value) ? value : [value]).map((entry) => String(entry).toLowerCase()));
}

function freezeTextList(value) {
  if (value === undefined || value === null) return Object.freeze([]);
  return Object.freeze(uniqueStrings(Array.isArray(value) ? value : [value]));
}

function countContracts(contracts, select) {
  const counts = {};
  for (const contract of contracts) {
    const key = String(select(contract) ?? 'unknown');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.freeze(counts);
}
