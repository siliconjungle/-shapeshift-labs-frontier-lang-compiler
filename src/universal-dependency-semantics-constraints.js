import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalDependencySemanticsConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalDependencySemanticsConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeDependencyRecords('source', [
    ...(input.sourceDependencySemanticsRecords ?? []), ...(input.dependencySemanticsRecords ?? []), ...(input.dependencyRecords ?? []),
    ...(input.packageRecords ?? []), ...(input.packageManifestRecords ?? []), ...(input.lockfileRecords ?? []), ...(input.dependencyGraphRecords ?? []),
    ...(input.packageManagerRecords ?? []), ...(input.buildDependencyRecords ?? []), ...(input.sourceDependencySemanticsConstraints ?? []),
    ...(input.dependencySemanticsConstraints ?? []), ...(input.imports ?? []).flatMap(dependencyRecordsFromImport)
  ]);
  const targetRecords = normalizeDependencyRecords('target', [
    ...(input.targetDependencySemanticsRecords ?? []), ...(input.targetDependencySemanticsConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedDependencyKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = dependencyMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = dependencyReview(missingKinds, sourceRecords, targetRecords, context);
  const status = dependencyStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalDependencySemanticsConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalDependencySemanticsConstraintEvidence.v1',
    id: input.id ?? `dependency_semantics_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId, sourceLanguage, target, status, action: dependencyAction(status),
    requiredKinds, representedKinds, missingKinds, missingEvidence, blockers, review, sourceRecords, targetRecords,
    dependencySemanticsConstraints: requiredKinds.map((kind) => dependencyConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { dependencyEquivalenceClaim: false, resolutionEquivalenceClaim: false, lockfileEquivalenceClaim: false, supplyChainEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Dependency-semantics constraints model package, lockfile, install, and supply-chain behavior for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function dependencySemanticsConstraintMatches(evidence = {}, query = {}) {
  return match(query.dependencySemanticsConstraintStatus, [evidence.status])
    && match(query.dependencySemanticsConstraintAction, [evidence.action])
    && match(query.dependencySemanticsConstraintRequiredKind, evidence.requiredKinds)
    && match(query.dependencySemanticsConstraintRepresentedKind, evidence.representedKinds)
    && match(query.dependencySemanticsConstraintMissingKind, evidence.missingKinds)
    && match(query.dependencySemanticsConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.dependencySemanticsConstraintEvidenceId, evidence.evidenceIds);
}

export function dependencySemanticsConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingDependencyInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceDependencySemanticsRecords ?? []), ...(explicit?.dependencySemanticsRecords ?? []), ...(explicit?.dependencyRecords ?? []),
    ...(explicit?.packageRecords ?? []), ...(explicit?.packageManifestRecords ?? []), ...(explicit?.lockfileRecords ?? []), ...(explicit?.dependencyGraphRecords ?? []),
    ...(explicit?.packageManagerRecords ?? []), ...(explicit?.buildDependencyRecords ?? []), ...(explicit?.sourceDependencySemanticsConstraints ?? []),
    ...(explicit?.dependencySemanticsConstraints ?? []), ...routeImports.flatMap(dependencyRecordsFromImport)
  ];
  const targetRecords = [...(explicit?.targetDependencySemanticsRecords ?? []), ...(explicit?.targetDependencySemanticsConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalDependencySemanticsConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceDependencySemanticsRecords: sourceRecords, targetDependencySemanticsRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeDependencyRecords(role, records) {
  return uniqueDependencyRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = dependencyConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_dependency_${index + 1}_${idFragment(constraintKinds.join('_'))}`, role: record?.role ?? role,
      name: record?.name ?? record?.packageName ?? record?.manifestName ?? record?.managerName, symbolId: record?.symbolId ?? record?.id,
      packageManager: record?.packageManager ?? record?.manager, manifestSchema: record?.manifestSchema ?? record?.manifestKind ?? record?.schema,
      packageName: record?.packageName ?? record?.name, versionRange: record?.versionRange ?? record?.range,
      resolvedVersion: record?.resolvedVersion ?? record?.version, lockfile: record?.lockfile ?? record?.lockfilePath,
      integrity: record?.integrity ?? record?.lockfileIntegrity, dependencyClass: record?.dependencyClass ?? record?.dependencyType ?? record?.type,
      peerDependencies: record?.peerDependencies ?? record?.peers, optionalDependencies: record?.optionalDependencies ?? record?.optional,
      devDependencies: record?.devDependencies ?? record?.dev, features: record?.features ?? record?.extras ?? record?.flags,
      workspace: record?.workspace ?? record?.workspaceBoundary, registry: record?.registry ?? record?.registrySource,
      source: record?.source ?? record?.sourceUrl, lifecycleScripts: record?.lifecycleScripts ?? record?.scripts,
      nativeAbi: record?.nativeAbi ?? record?.abi, buildTool: record?.buildTool ?? record?.builder,
      packageManagerVersion: record?.packageManagerVersion ?? record?.managerVersion, offlineCache: record?.offlineCache ?? record?.cachePolicy,
      dedupeHoist: record?.dedupeHoist ?? record?.hoistPolicy, provenance: record?.provenance ?? record?.sourceProvenance,
      trust: record?.trust ?? record?.supplyChainTrust, constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path, sourceHash: record?.sourceHash, sourceSpan: record?.sourceSpan, evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function dependencyRecordsFromImport(imported) {
  return uniqueDependencyRecords([
    ...(imported?.dependencySemanticsConstraints ?? []), ...(imported?.dependencySemanticsRecords ?? []), ...(imported?.dependencyRecords ?? []),
    ...(imported?.packageRecords ?? []), ...(imported?.packageManifestRecords ?? []), ...(imported?.packageDependencyRecords ?? []),
    ...(imported?.lockfileRecords ?? []), ...(imported?.packageManagerRecords ?? []), ...(imported?.dependencyGraphRecords ?? []),
    ...(imported?.buildDependencyRecords ?? []), ...(imported?.packageManifest ? [imported.packageManifest] : []), ...(imported?.packageEvidence ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(dependencyLikeRecord), ...(imported?.semanticIndex?.facts ?? []).filter(dependencyLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(dependencyLikeRecord), ...(imported?.nativeAst?.expressions ?? []).filter(dependencyLikeRecord)
  ]);
}

function dependencyLikeRecord(record = {}) {
  const token = String([record.kind, record.packageManager, record.manager, record.manifestSchema, record.lockfile, record.dependencyClass, record.versionRange, record.resolvedVersion, record.registry, record.lifecycleScripts, record.nativeAbi, record.buildTool, record.packageManagerVersion, record.dedupeHoist, record.trust].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.packageManager || record.manifestSchema || record.packageName || record.versionRange || record.lockfile || record.integrity || record.peerDependencies || record.optionalDependencies || record.devDependencies || record.registry || record.lifecycleScripts || record.nativeAbi || record.buildTool || /npm|pnpm|yarn|bun|cargo|gem|pip|poetry|maven|gradle|nuget|package|manifest|lockfile|integrity|peer|optional|dev-dependency|workspace|registry|lifecycle|install-script|native|abi|build-tool|hoist|dedupe|supply-chain|provenance/.test(token));
}

function dependencyConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken, record.packageManager, record.manager, record.manifestSchema, record.manifestKind, record.schema, record.packageName, record.versionRange, record.range,
    record.resolvedVersion, record.version, record.lockfile, record.lockfilePath, record.integrity, record.lockfileIntegrity, record.dependencyClass, record.dependencyType, record.type,
    record.peerDependencies, record.peers, record.optionalDependencies, record.optional, record.devDependencies, record.dev, record.features, record.extras, record.flags,
    record.workspace, record.workspaceBoundary, record.registry, record.registrySource, record.source, record.sourceUrl, record.lifecycleScripts, record.scripts,
    record.nativeAbi, record.abi, record.buildTool, record.builder, record.packageManagerVersion, record.managerVersion, record.offlineCache, record.cachePolicy,
    record.dedupeHoist, record.hoistPolicy, record.provenance, record.sourceProvenance, record.trust, record.supplyChainTrust,
    ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(dependencyKindForToken));
}

function dependencyKindForToken(token) {
  const kinds = [];
  if (/npm|pnpm|yarn|bun|cargo|gem|bundler|pip|poetry|maven|gradle|nuget|composer|package-manager|manager/.test(token)) kinds.push('package-manager');
  if (/manifest|package-json|cargo-toml|pyproject|pom|csproj|schema/.test(token)) kinds.push('manifest-schema');
  if (/range|\^|~|semver|caret|tilde|wildcard|workspace-range|version-range/.test(token)) kinds.push('version-range');
  if (/resolved|pinned|exact-version|version/.test(token)) kinds.push('resolved-version');
  if (/lock|lockfile|integrity|checksum|hash|signature/.test(token)) kinds.push('lockfile-integrity');
  if (/dependency-class|runtime|prod|production|dep-type|dependency-type/.test(token)) kinds.push('dependency-class');
  if (/peer/.test(token)) kinds.push('peer-dependency');
  if (/optional/.test(token)) kinds.push('optional-dependency');
  if (/dev|development|test-dependency/.test(token)) kinds.push('dev-dependency');
  if (/feature|extra|flag|optional-feature/.test(token)) kinds.push('feature-flag');
  if (/workspace|monorepo|package-boundary|local-package/.test(token)) kinds.push('workspace-boundary');
  if (/registry|source|git|url|tarball|path|mirror/.test(token)) kinds.push('registry-source');
  if (/script|lifecycle|preinstall|postinstall|build-script|install-script/.test(token)) kinds.push('lifecycle-script');
  if (/native|abi|node-gyp|napi|binary|platform|arch/.test(token)) kinds.push('native-abi');
  if (/build-tool|builder|bundler|vite|webpack|rollup|esbuild|tsc|babel|gradle|maven/.test(token)) kinds.push('build-tool');
  if (/manager-version|package-manager-version|npm-version|pnpm-version|yarn-version|tool-version/.test(token)) kinds.push('package-manager-version');
  if (/offline|cache|frozen|immutable|vendor/.test(token)) kinds.push('offline-cache');
  if (/dedupe|hoist|flat-node-modules|nohoist|resolution-layout/.test(token)) kinds.push('dedupe-hoist');
  if (/trust|provenance|attestation|slsa|sigstore|supply-chain|audit/.test(token)) kinds.push('supply-chain-trust');
  return kinds;
}

function representedDependencyKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function dependencyMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-dependency-semantics-target-evidence']),
    ...(missingKinds.length ? ['translation-dependency-semantics-proof'] : []),
    ...missingKinds.map((kind) => `translation-dependency-semantics:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function dependencyReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Dependency semantics are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source package, lockfile, and install behavior is not represented by target dependency-semantics evidence.'] : []),
    ...(missingKinds.some((kind) => ['package-manager', 'manifest-schema', 'package-manager-version', 'build-tool'].includes(kind)) ? ['Package-manager, manifest, tool-version, and build-tool behavior require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['version-range', 'resolved-version', 'lockfile-integrity', 'offline-cache'].includes(kind)) ? ['Version ranges, resolved versions, lockfile integrity, and frozen/cache policy require source-bound target evidence.'] : []),
    ...(missingKinds.some((kind) => ['dependency-class', 'peer-dependency', 'optional-dependency', 'dev-dependency', 'feature-flag', 'workspace-boundary'].includes(kind)) ? ['Dependency class, peer/optional/dev behavior, feature flags, and workspace boundaries require explicit proof.'] : []),
    ...(missingKinds.some((kind) => ['registry-source', 'lifecycle-script', 'native-abi', 'dedupe-hoist', 'supply-chain-trust'].includes(kind)) ? ['Registry provenance, lifecycle scripts, native ABI, hoist layout, and supply-chain trust require explicit proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function dependencyStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function dependencyAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-dependency-semantics-evidence';
  if (status === 'degraded') return 'review-dependency-semantics-loss';
  if (status === 'satisfied') return 'attach-dependency-semantics-record';
  return 'skip';
}

function dependencyConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind, status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceDependencySemanticsIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetDependencySemanticsIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['version-range', 'resolved-version', 'lockfile-integrity', 'peer-dependency', 'optional-dependency', 'feature-flag', 'workspace-boundary', 'registry-source', 'lifecycle-script', 'native-abi', 'dedupe-hoist', 'supply-chain-trust'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingDependencyInput(input, route, routeEvidence) {
  const candidates = [input.dependencySemanticsConstraint, input.translationDependencySemanticsConstraint, ...(input.dependencySemanticsConstraints ?? []), ...routeEvidence.flatMap(dependencyCandidatesFromRouteEvidence)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function dependencyCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.dependencySemanticsConstraint, record.translationDependencySemanticsConstraint, dependencyEvidenceRecord(record) ? record : undefined, ...(record.dependencySemanticsConstraints ?? []), ...(record.translationDependencySemanticsConstraints ?? [])].filter(Boolean);
}

function dependencyEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalDependencySemanticsConstraintEvidence' || record?.schema === 'frontier.lang.universalDependencySemanticsConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.dependencySemanticsConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
}

function sameLanguage(source, target) {
  const sourceKey = normalizeToken(source);
  const targetKey = normalizeToken(target);
  return Boolean(sourceKey && targetKey && sourceKey === targetKey);
}

function match(filter, values) {
  const filters = (Array.isArray(filter) ? filter : filter === undefined || filter === null ? [] : [filter]).filter((item) => item !== null && item !== undefined);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter((value) => value !== null && value !== undefined).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function uniqueDependencyRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.packageName, record.packageManager, record.manifestSchema, record.lockfile, record.registry].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
