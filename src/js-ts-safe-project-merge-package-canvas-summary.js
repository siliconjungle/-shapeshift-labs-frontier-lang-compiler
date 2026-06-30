function packageCanvasProjectSummary(files) {
  return {
    ...packageManagementSummary(files),
    ...canvasProjectSummary(files)
  };
}

function packageManagementSummary(files) {
  const packageFiles = files.filter(isPackageManagementFile);
  const packageJsonFiles = packageFiles.filter((file) => file.language === 'package-json');
  const lockfiles = packageFiles.filter((file) => /lockfile$/.test(String(file.language)));
  const conflicts = packageFiles.flatMap(fileConflicts);
  const proofs = packageFiles.flatMap((file) => file.result?.packageManagementProofs ?? []);
  return {
    packageManagementFiles: packageFiles.length,
    packageJsonFiles: packageJsonFiles.length,
    packageLockfileFiles: lockfiles.length,
    packageManagementMergedFiles: packageFiles.filter(isMerged).length,
    packageManagementBlockedFiles: packageFiles.filter(isBlocked).length,
    packageIntentMergeFiles: packageJsonFiles.filter((file) => file.result?.summary?.packageIntentMerge === true).length,
    packageGraphEvidenceFiles: packageJsonFiles.filter((file) => file.result?.packageGraphEvidence).length,
    packageLockfileRegeneratedFiles: lockfiles.filter((file) => file.result?.summary?.lockfileRegenerated === true).length,
    packageLockfileUnchangedFiles: lockfiles.filter((file) => file.result?.summary?.lockfileUnchanged === true).length,
    packageManagementProofs: proofs.length,
    packageLockfileRegenerationProofs: proofs.filter((proof) => proof.proofLevel === 'package-lockfile-regeneration-proof').length,
    packagePublicSurfaceProofs: proofs.filter((proof) => proof.proofLevel === 'package-public-surface-proof').length,
    packagePeerResolutionProofs: proofs.filter((proof) => proof.proofLevel === 'package-peer-resolution-proof').length,
    packageResolutionOverrideProofs: proofs.filter((proof) => proof.proofLevel === 'package-resolution-override-proof').length,
    packageInstallScriptProofs: proofs.filter((proof) => proof.proofLevel === 'package-install-script-proof').length,
    packageWorkspaceProofs: proofs.filter((proof) => proof.proofLevel === 'package-workspace-proof').length,
    packageManagerMigrationProofs: proofs.filter((proof) => proof.proofLevel === 'package-manager-migration-proof').length,
    packageDependencyRangeConflictFiles: countFilesWithReason(packageFiles, 'package-dependency-range-conflict'),
    packagePeerResolutionBlockedFiles: countFilesWithReason(packageFiles, 'package-peer-dependency-resolution-proof-missing'),
    packageResolutionOverrideBlockedFiles: countFilesWithReason(packageFiles, 'package-resolution-override-proof-missing'),
    packageInstallScriptBlockedFiles: countFilesWithReason(packageFiles, 'package-install-script-change-blocked'),
    packagePublicSurfaceBlockedFiles: countFilesWithReason(packageFiles, 'package-public-surface-proof-missing'),
    packageWorkspaceBlockedFiles: countFilesWithReason(packageFiles, 'package-workspace-proof-missing'),
    packageManagerMigrationBlockedFiles: countFilesWithReason(packageFiles, 'package-manager-migration-proof-missing'),
    packageLockfileRegenerationBlockedFiles: countFilesWithReason(packageFiles, 'package-lockfile-regeneration-proof-missing') + countFilesWithReason(packageFiles, 'package-lockfile-regeneration-output-missing') + countFilesWithReason(packageFiles, 'package-lockfile-regeneration-output-mismatch'),
    packageScriptConflictFiles: countFilesWithReason(packageFiles, 'package-script-conflict'),
    packageJsonParseErrorFiles: countFilesWithReason(packageFiles, 'package-json-parse-error'),
    packageManagementConflictSignals: conflicts.length
  };
}

function canvasProjectSummary(files) {
  const canvasFiles = files.filter(hasCanvasSurface);
  const htmlCanvasFiles = files.filter((file) => isHtml(file) && hasCanvasText(file));
  const runtimeConflicts = files.filter((file) => fileConflicts(file).some(isCanvasConflict));
  const proofs = files.flatMap((file) => file.result?.canvasRuntimeProofs ?? []);
  return {
    canvasSurfaceFiles: canvasFiles.length,
    htmlCanvasElementFiles: htmlCanvasFiles.length,
    htmlCanvasStaticMergedFiles: htmlCanvasFiles.filter(isMerged).length,
    canvasRuntimeSurfaceFiles: files.filter((file) => file.result?.canvasRuntimeProofs?.length || fileConflicts(file).some(isCanvasConflict)).length,
    canvasRuntimeProofs: proofs.length,
    canvasRuntimeProofFiles: files.filter((file) => (file.result?.canvasRuntimeProofs ?? []).length).length,
    canvasRuntimeBlockedFiles: runtimeConflicts.length,
    canvasDrawingRuntimeBlockedFiles: countFilesWithReason(files, 'canvas-drawing-runtime-proof-missing'),
    canvasOffscreenWorkerBlockedFiles: countFilesWithReason(files, 'canvas-offscreen-worker-proof-missing'),
    canvasOffscreenWorkerProofs: proofs.filter((proof) => proof.offscreenWorkerProofHash).length
  };
}

function hasCanvasSurface(file) {
  return hasCanvasText(file) || (file.result?.canvasRuntimeProofs ?? []).length > 0 || fileConflicts(file).some(isCanvasConflict);
}

function hasCanvasText(file) {
  const text = `${file.outputSourceText ?? ''}\n${file.result?.mergedSourceText ?? ''}`;
  return /<canvas\b|\bOffscreenCanvas\b|\btransferControlToOffscreen\s*\(|\bCanvasRenderingContext2D\b|\bgetContext\s*\(/i.test(text);
}

function isCanvasConflict(conflict) {
  return String(conflict?.gateId) === 'canvas-runtime-semantic-merge' || String(conflict?.details?.reasonCode ?? conflict?.code).startsWith('canvas-');
}

function countFilesWithReason(files, reasonCode) {
  return files.filter((file) => fileConflicts(file).some((conflict) => (conflict.details?.reasonCode ?? conflict.code) === reasonCode)).length;
}

function fileConflicts(file) {
  return [...(file?.conflicts ?? []), ...(file?.result?.conflicts ?? [])];
}

function isPackageManagementFile(file) { return /^package-json$|lockfile$/.test(String(file?.language ?? '')); }
function isHtml(file) { return String(file?.language ?? '').toLowerCase() === 'html'; }
function isMerged(file) { return file.status === 'merged'; }
function isBlocked(file) { return file.status === 'blocked'; }

export { packageCanvasProjectSummary };
