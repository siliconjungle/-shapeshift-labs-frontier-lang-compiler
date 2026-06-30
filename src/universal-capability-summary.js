export function universalCapabilityMatrixSummary(rows) {
  const byReadiness = {};
  const byImportReadiness = {};
  const byParserReadiness = {};
  const byProjectionReadiness = {};
  let imports = 0;
  let symbols = 0;
  let sourceMapMappings = 0;
  let losses = 0;
  let parserRows = 0;
  let parserMergeReady = 0;
  let targetEntries = 0;
  let missingAdapters = 0;
  let unsupportedTargetFeatures = 0;
  let exactSourceProjection = 0;
  let nativeSourceStubs = 0;
  let representationConstructs = 0;
  let representationMissing = 0;
  let packageContractRows = 0;
  let packageContracts = 0;
  let packageReleaseReady = 0;
  let packagePlannedOnly = 0;
  let packageMissingContracts = 0;
  let packageSourceImporterOnly = 0;
  let packageTargetProjectionSupported = 0;
  const byPackageClass = {};
  const byPackageReleaseReadiness = {};
  let blockers = 0;
  let reviewReasons = 0;
  for (const row of rows) {
    byReadiness[row.readiness] = (byReadiness[row.readiness] ?? 0) + 1;
    byImportReadiness[row.imports.readiness] = (byImportReadiness[row.imports.readiness] ?? 0) + 1;
    byParserReadiness[row.parser.readiness] = (byParserReadiness[row.parser.readiness] ?? 0) + 1;
    byProjectionReadiness[row.projection.readiness] = (byProjectionReadiness[row.projection.readiness] ?? 0) + 1;
    imports += row.imports.total;
    symbols += row.imports.symbols;
    sourceMapMappings += row.imports.sourceMapMappings;
    losses += row.imports.losses;
    parserRows += row.parser.rows;
    parserMergeReady += row.parser.mergeReadyParsers.length;
    targetEntries += row.projection.targets.length;
    missingAdapters += row.projection.missingTargets.length;
    unsupportedTargetFeatures += row.projection.unsupportedTargets.length;
    exactSourceProjection += row.projection.summary.byLossClass?.exactSourceProjection ?? 0;
    nativeSourceStubs += row.projection.summary.byLossClass?.nativeSourceStubs ?? 0;
    representationConstructs += row.representation?.summary?.representedConstructs ?? 0;
    representationMissing += row.representation?.summary?.missing ?? 0;
    if (row.packageContract.total) packageContractRows += 1;
    packageContracts += row.packageContract.total;
    packageReleaseReady += row.packageContract.releaseReadyCount;
    if (row.packageContract.plannedOnly) packagePlannedOnly += 1;
    if (row.packageContract.missingContract) packageMissingContracts += 1;
    if (row.packageContract.sourceImporterOnly) packageSourceImporterOnly += 1;
    if (row.packageContract.targetProjection.supported) packageTargetProjectionSupported += 1;
    for (const [packageClass, count] of Object.entries(row.packageContract.byPackageClass)) {
      byPackageClass[packageClass] = (byPackageClass[packageClass] ?? 0) + count;
    }
    for (const [status, count] of Object.entries(row.packageContract.byReleaseReadiness)) {
      byPackageReleaseReadiness[status] = (byPackageReleaseReadiness[status] ?? 0) + count;
    }
    blockers += row.blockers.length;
    reviewReasons += row.review.length;
  }
  return {
    languages: rows.length,
    imports,
    symbols,
    sourceMapMappings,
    losses,
    parserRows,
    parserMergeReady,
    targetEntries,
    missingAdapters,
    unsupportedTargetFeatures,
    exactSourceProjection,
    nativeSourceStubs,
    representationConstructs,
    representationMissing,
    packageContractRows,
    packageContracts,
    packageReleaseReady,
    packagePlannedOnly,
    packageMissingContracts,
    packageSourceImporterOnly,
    packageTargetProjectionSupported,
    blockers,
    reviewReasons,
    readyLanguages: rows.filter((row) => row.readiness === 'ready').length,
    readyWithLossesLanguages: rows.filter((row) => row.readiness === 'ready-with-losses').length,
    reviewLanguages: rows.filter((row) => row.readiness === 'needs-review').length,
    blockedLanguages: rows.filter((row) => row.readiness === 'blocked').length,
    byReadiness,
    byImportReadiness,
    byParserReadiness,
    byProjectionReadiness,
    byPackageClass,
    byPackageReleaseReadiness
  };
}
