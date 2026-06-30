import { LanguageAdapterPackageContracts } from './language-adapter-package-contracts.js';
import { normalizeNativeLanguageId, uniqueStrings } from './native-import-utils.js';

const DefaultUniversalCapabilityPackageContracts = LanguageAdapterPackageContracts;

function universalCapabilityLanguages(languages, packageContracts, denominator) {
  const entries = [...asArray(languages)];
  const seen = new Set(entries.map((entry) => normalizeNativeLanguageId(entry?.language ?? entry)).filter(Boolean));
  const explicitDenominator = asArray(denominator);
  for (const language of explicitDenominator) {
    const normalized = normalizeNativeLanguageId(language?.language ?? language);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    entries.push({ language: normalized, supportsLightweightScan: false, parserAdapters: [], defaultReadiness: 'blocked' });
  }
  if (explicitDenominator.length) return entries;
  for (const contract of packageContracts ?? []) {
    for (const language of contractLanguageIds(contract)) {
      if (seen.has(language)) continue;
      seen.add(language);
      entries.push({
        language,
        supportsLightweightScan: false,
        parserAdapters: [contract.sourceParser?.parser].filter(Boolean),
        defaultReadiness: contract.releaseReadiness?.releaseReady ? 'needs-review' : 'blocked',
        notes: ['language is present through a package contract but has no native import profile in this matrix input']
      });
    }
  }
  return entries;
}

function packageContractCoverageForLanguage(languageIds, packageContracts = []) {
  const contracts = (packageContracts ?? []).filter((contract) => contractLanguageIds(contract).some((id) => languageIds.includes(id)));
  const total = contracts.length;
  const releaseReadyContracts = contracts.filter((contract) => contract.releaseReadiness?.releaseReady === true);
  const targetProjectionContracts = contracts.filter((contract) => contract.targetProjection?.supported === true);
  const readiness = total === 0 ? 'blocked' : releaseReadyContracts.length ? 'ready-with-losses' : 'needs-review';
  const byPackageClass = countBy(contracts.map((contract) => contract.package?.packageClass ?? 'unknown'));
  const byReleaseReadiness = countBy(contracts.map((contract) => contract.releaseReadiness?.status ?? 'needs-review'));
  const targetProjectionTargets = uniqueStrings(targetProjectionContracts.flatMap((contract) => contract.targetProjection?.targets ?? []));
  const sourceImporterOnly = total > 0 && targetProjectionContracts.length === 0;
  return {
    total,
    readiness,
    missingContract: total === 0,
    releaseReady: releaseReadyContracts.length > 0,
    releaseReadyCount: releaseReadyContracts.length,
    plannedOnly: total > 0 && releaseReadyContracts.length === 0 && contracts.every((contract) => contract.packageVersion === '0.0.0' || contract.releaseReadiness?.versionSource === 'related-package-catalog-placeholder'),
    packageNames: contracts.map((contract) => contract.packageName),
    packageVersions: contracts.map((contract) => contract.packageVersion),
    packageClasses: uniqueStrings(contracts.map((contract) => contract.package?.packageClass)),
    byPackageClass,
    byReleaseReadiness,
    sourceParsers: uniqueStrings(contracts.map((contract) => contract.sourceParser?.parser)),
    sourceFormats: uniqueStrings(contracts.map((contract) => contract.sourceParser?.format)),
    semanticIndexFormats: uniqueStrings(contracts.flatMap((contract) => contract.semanticIndex?.formats ?? [])),
    requiredEvidenceKeys: uniqueStrings(contracts.flatMap((contract) => contract.proofEvidence?.requiredEvidenceKeys ?? [])),
    hostEvidenceRequired: contracts.some((contract) => contract.proofEvidence?.hostEvidenceRequired || contract.semanticIndex?.hostEvidenceRequired),
    sourceImporterOnly,
    targetProjection: {
      supported: targetProjectionContracts.length > 0,
      packages: targetProjectionContracts.map((contract) => contract.packageName),
      targets: targetProjectionTargets,
      missing: total > 0 && targetProjectionContracts.length === 0
    }
  };
}

function universalCapabilityPackageContractSummary(packageContracts = []) {
  const contracts = [...(packageContracts ?? [])];
  return {
    kind: 'frontier.lang.universalCapabilityPackageContractMatrix',
    version: 1,
    packages: contracts.length,
    releaseReady: contracts.filter((contract) => contract.releaseReadiness?.releaseReady).length,
    plannedOnly: contracts.filter((contract) => contract.packageVersion === '0.0.0' || contract.releaseReadiness?.versionSource === 'related-package-catalog-placeholder').length,
    languages: uniqueStrings(contracts.flatMap(contractLanguageIds)),
    projectionTargets: uniqueStrings(contracts.flatMap((contract) => contract.targetProjection?.targets ?? [])),
    byPackageClass: countBy(contracts.map((contract) => contract.package?.packageClass ?? 'unknown')),
    byReleaseReadiness: countBy(contracts.map((contract) => contract.releaseReadiness?.status ?? 'needs-review'))
  };
}

function contractLanguageIds(contract) {
  return uniqueStrings([
    contract?.sourceParser?.language,
    ...(contract?.sourceParser?.supportedLanguages ?? [])
  ].map(normalizeNativeLanguageId).filter(Boolean));
}

function countBy(values) {
  const counts = {};
  for (const value of values ?? []) {
    const key = String(value ?? 'unknown');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

export {
  DefaultUniversalCapabilityPackageContracts,
  packageContractCoverageForLanguage,
  universalCapabilityLanguages,
  universalCapabilityPackageContractSummary
};
