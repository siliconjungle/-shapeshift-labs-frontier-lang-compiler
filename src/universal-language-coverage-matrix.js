import { NativeImportLanguageProfiles } from './coverage-matrix-profiles.js';
import { LanguageAdapterPackageContracts } from './language-adapter-package-contracts.js';
import {
  DefaultCoverageRows,
  UniversalLanguageCoverageReadinessStatuses,
  UniversalLanguageCoverageStatuses,
  UniversalLanguageCoverageSurfaceIds,
  coverageRow,
  normalizeCoverageId
} from './universal-language-coverage-defaults.js';
import {
  compareCoverageRows,
  contractCoverageIds,
  coverageIdsForProfile,
  createCoverageRow,
  languageCoverageRowMatches,
  normalizeDenominatorList,
  summarizeLanguageCoverageRows
} from './universal-language-coverage-helpers.js';

export {
  UniversalLanguageCoverageReadinessStatuses,
  UniversalLanguageCoverageStatuses,
  UniversalLanguageCoverageSurfaceIds
};

export function createUniversalLanguageCoverageMatrix(input = {}, context = {}) {
  const generatedAt = input.generatedAt ?? Date.now();
  const packageContracts = input.packageContracts ?? LanguageAdapterPackageContracts;
  const denominator = createLanguageDenominator(input, packageContracts);
  const rows = denominator.map((entry) => createCoverageRow(entry, {
    packageContracts,
    surfaceOverrides: input.surfaceOverrides,
    rowOverrides: input.rowOverrides,
    productionEvidence: input.productionEvidence,
    context
  }));
  return {
    kind: 'frontier.lang.universalLanguageCoverageMatrix',
    version: 1,
    generatedAt,
    surfaces: UniversalLanguageCoverageSurfaceIds,
    languages: rows,
    summary: summarizeLanguageCoverageRows(rows),
    metadata: {
      languageDenominator: rows.map((row) => row.id),
      statusVocabulary: UniversalLanguageCoverageStatuses,
      readinessVocabulary: UniversalLanguageCoverageReadinessStatuses,
      note: 'Coverage is a conservative implementation denominator for semantic merge and cross-language projection. It is not a claim that every feature of each language is losslessly modeled.'
    }
  };
}

export function queryUniversalLanguageCoverageMatrix(matrixOrInput = {}, query = {}, context = {}) {
  const matrix = matrixOrInput?.kind === 'frontier.lang.universalLanguageCoverageMatrix'
    ? matrixOrInput
    : createUniversalLanguageCoverageMatrix(matrixOrInput, context);
  const rows = (matrix.languages ?? []).filter((row) => languageCoverageRowMatches(row, query));
  return {
    kind: 'frontier.lang.universalLanguageCoverageQuery',
    version: 1,
    found: rows.length > 0,
    rows,
    bestRow: rows.slice().sort(compareCoverageRows)[0],
    summary: summarizeLanguageCoverageRows(rows),
    reasons: rows.length ? [] : [`No universal language coverage row matched ${query.language ?? query.id ?? '*'}.`]
  };
}

function createLanguageDenominator(input, packageContracts) {
  const explicit = normalizeDenominatorList(input.languageDenominator);
  if (explicit.length) return explicit.map((id) => entryForId(id, input, packageContracts));
  const byId = new Map();
  for (const profile of input.languages ?? NativeImportLanguageProfiles) {
    const id = normalizeCoverageId(profile?.language ?? profile);
    if (id) byId.set(id, coverageRow(id, typeof profile === 'object' ? profile : {}));
  }
  for (const contract of packageContracts ?? []) {
    for (const id of contractCoverageIds(contract)) {
      if (!id || byId.has(id)) continue;
      byId.set(id, coverageRow(id, {
        parserAdapters: [contract.sourceParser?.parser].filter(Boolean),
        notes: ['Language appears in the adapter package catalog but not the native import profile list.']
      }));
    }
  }
  if (input.includeDefaultSemanticSurfaces !== false) {
    for (const row of DefaultCoverageRows) byId.set(row.id, row);
  }
  for (const id of normalizeDenominatorList(input.requiredLanguages)) {
    if (!byId.has(id)) byId.set(id, entryForId(id, input, packageContracts));
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function entryForId(id, input, packageContracts) {
  const profile = (input.languages ?? NativeImportLanguageProfiles).find((candidate) =>
    coverageIdsForProfile(candidate).includes(id)
  );
  const defaultRow = DefaultCoverageRows.find((row) => row.id === id || row.aliases.includes(id));
  if (defaultRow) return defaultRow;
  if (profile) return coverageRow(id, profile);
  const contract = (packageContracts ?? []).find((candidate) => contractCoverageIds(candidate).includes(id));
  return coverageRow(id, {
    language: id,
    parserAdapters: [contract?.sourceParser?.parser].filter(Boolean),
    notes: contract
      ? ['Language appears only through adapter package contract evidence.']
      : ['Language has no built-in profile or package contract evidence.']
  });
}
