const PackageCanvasProjectMergeMissingSignals = Object.freeze({
  packageIntent: 'package-management-intent-merge-proof-missing',
  packageLockfileRegeneration: 'package-lockfile-regeneration-proof-missing',
  packagePublicSurface: 'package-public-surface-proof-missing',
  packagePeerResolution: 'package-peer-resolution-proof-missing',
  packageInstallScript: 'package-install-script-proof-missing',
  packageWorkspace: 'package-workspace-proof-missing',
  packageManagerMigration: 'package-manager-migration-proof-missing',
  canvasStaticElement: 'canvas-static-element-evidence-missing',
  canvasRuntimeProof: 'canvas-runtime-proof-not-available',
  canvasOffscreenWorkerProof: 'canvas-offscreen-worker-proof-not-available'
});

function packageCanvasProjectMergeMissingEvidenceRoutes(route, signals) {
  return {
    [signals.packageIntent]: route('admit-package-management-intent', 'package-graph', 'merge-package-json-intent-by-dependency-script-export-and-workspace-identity'),
    [signals.packageLockfileRegeneration]: route('regenerate-package-lockfile', 'package-manager', 'regenerate-lockfile-with-declared-package-manager-and-frozen-install-proof'),
    [signals.packagePublicSurface]: route('prove-package-public-surface', 'package-api', 'supply-exports-types-main-module-bin-public-surface-proof'),
    [signals.packagePeerResolution]: route('prove-package-peer-resolution', 'package-manager', 'supply-peer-dependency-resolution-proof'),
    [signals.packageInstallScript]: route('prove-package-install-script', 'package-manager', 'supply-install-time-script-behavior-proof'),
    [signals.packageWorkspace]: route('prove-package-workspace-graph', 'package-workspace', 'supply-workspace-boundary-local-link-and-hoist-proof'),
    [signals.packageManagerMigration]: route('prove-package-manager-migration', 'package-manager', 'supply-package-manager-migration-proof'),
    [signals.canvasStaticElement]: route('admit-canvas-static-element', 'canvas-markup', 'prove-canvas-element-identity-attributes-and-fallback-children'),
    [signals.canvasRuntimeProof]: route('prove-canvas-runtime', 'browser-proof', 'supply-canvas-deterministic-input-draw-trace-bitmap-hit-test-frame-and-accessibility-proof'),
    [signals.canvasOffscreenWorkerProof]: route('prove-canvas-offscreen-worker', 'browser-proof', 'supply-offscreen-canvas-worker-transfer-and-message-boundary-proof')
  };
}

function packageCanvasProjectMergeAdmissionMatrixRows(matrixRow, signals) {
  return [
    matrixRow('package-management-intent-merge', 'partial', ['package-management-intent'], [signals.packageIntent]),
    matrixRow('package-lockfile-regeneration-proof', 'bounded-evidence', ['package-lockfile-regeneration-proof'], [signals.packageLockfileRegeneration]),
    matrixRow('package-public-surface-proof', 'bounded-evidence', ['package-public-surface-proof'], [signals.packagePublicSurface]),
    matrixRow('package-peer-resolution-proof', 'bounded-evidence', ['package-peer-resolution-proof'], [signals.packagePeerResolution]),
    matrixRow('package-install-script-proof', 'bounded-evidence', ['package-install-script-proof'], [signals.packageInstallScript]),
    matrixRow('package-workspace-graph-proof', 'bounded-evidence', ['package-workspace-proof'], [signals.packageWorkspace]),
    matrixRow('package-manager-migration-proof', 'bounded-evidence', ['package-manager-migration-proof'], [signals.packageManagerMigration]),
    matrixRow('canvas-static-element-merge', 'partial', ['canvas-static-element'], [signals.canvasStaticElement]),
    matrixRow('canvas-runtime-proof', 'bounded-evidence', ['canvas-runtime-proof'], [signals.canvasRuntimeProof]),
    matrixRow('canvas-offscreen-worker-proof', 'bounded-evidence', ['canvas-offscreen-worker-proof'], [signals.canvasOffscreenWorkerProof])
  ];
}

function packageCanvasProjectMergeMissingEvidenceItems(summary, signals, missingEvidenceItem) {
  const items = [];
  if (summary.packageJsonFiles && (summary.packageManagementBlockedFiles || summary.packageGraphEvidenceFiles !== summary.packageJsonFiles)) items.push(missingEvidenceItem({ code: signals.packageIntent, scope: 'package-graph', kind: 'package-management-intent', proofLevel: 'package-management-intent', action: 'review', summary: `Package-management merge has package graph evidence for ${summary.packageGraphEvidenceFiles}/${summary.packageJsonFiles} package.json file(s) and ${summary.packageManagementBlockedFiles} blocked package-management file(s); merge dependency/script/export/workspace intent by stable package graph identity and keep install equivalence false until package-manager proof passes.` }));
  if (summary.packageLockfileFiles && summary.packageLockfileRegeneratedFiles + summary.packageLockfileUnchangedFiles !== summary.packageLockfileFiles) items.push(missingEvidenceItem({ code: signals.packageLockfileRegeneration, scope: 'package-manager', kind: 'package-lockfile-regeneration-proof', proofLevel: 'package-lockfile-regeneration-proof', action: 'review', summary: `Package lockfiles have ${summary.packageLockfileRegeneratedFiles} regenerated, ${summary.packageLockfileUnchangedFiles} unchanged, and ${summary.packageLockfileRegenerationBlockedFiles} blocked file(s); do not text-merge lockfiles without a source-bound regeneration proof from the declared package manager and frozen/equivalent install evidence.`, suggestedInput: { packageLockfileRegenerationProofsByPath: true } }));
  if (summary.packagePublicSurfaceBlockedFiles) items.push(missingEvidenceItem({ code: signals.packagePublicSurface, scope: 'package-api', kind: 'package-public-surface-proof', proofLevel: 'package-public-surface-proof', action: 'review', summary: `Package public surface changes are blocked in ${summary.packagePublicSurfaceBlockedFiles} file(s); require source-bound exports/types/main/module/bin proof before admission.`, suggestedInput: { packagePublicSurfaceProofsByPath: true } }));
  if (summary.packagePeerResolutionBlockedFiles) items.push(missingEvidenceItem({ code: signals.packagePeerResolution, scope: 'package-manager', kind: 'package-peer-resolution-proof', proofLevel: 'package-peer-resolution-proof', action: 'review', summary: `Peer dependency resolution changes are blocked in ${summary.packagePeerResolutionBlockedFiles} file(s); require peer resolution evidence before admission.`, suggestedInput: { packagePeerResolutionProofsByPath: true } }));
  if (summary.packageInstallScriptBlockedFiles) items.push(missingEvidenceItem({ code: signals.packageInstallScript, scope: 'package-manager', kind: 'package-install-script-proof', proofLevel: 'package-install-script-proof', action: 'review', summary: `Install-time script changes are blocked in ${summary.packageInstallScriptBlockedFiles} file(s); require behavior proof for preinstall/install/postinstall/prepare changes.`, suggestedInput: { packageInstallScriptProofsByPath: true } }));
  if (summary.packageWorkspaceBlockedFiles) items.push(missingEvidenceItem({ code: signals.packageWorkspace, scope: 'package-workspace', kind: 'package-workspace-proof', proofLevel: 'package-workspace-proof', action: 'review', summary: `Workspace graph changes are blocked in ${summary.packageWorkspaceBlockedFiles} file(s); require workspace boundary/local-link/hoist proof before admission.`, suggestedInput: { packageWorkspaceProofsByPath: true } }));
  if (summary.packageManagerMigrationBlockedFiles) items.push(missingEvidenceItem({ code: signals.packageManagerMigration, scope: 'package-manager', kind: 'package-manager-migration-proof', proofLevel: 'package-manager-migration-proof', action: 'review', summary: `Package manager changes are blocked in ${summary.packageManagerMigrationBlockedFiles} file(s); require package-manager migration proof before admission.`, suggestedInput: { packageManagerMigrationProofsByPath: true } }));
  if (summary.htmlCanvasElementFiles && summary.htmlCanvasStaticMergedFiles !== summary.htmlCanvasElementFiles) items.push(missingEvidenceItem({ code: signals.canvasStaticElement, scope: 'canvas-markup', kind: 'canvas-static-element', proofLevel: 'canvas-static-element', action: 'review', summary: `Canvas static element merge has ${summary.htmlCanvasStaticMergedFiles}/${summary.htmlCanvasElementFiles} HTML canvas file(s) merged; require stable canvas DOM identity, bounded width/height/aria/fallback-child evidence, and separate runtime proof for handlers or drawing behavior.` }));
  if (summary.canvasRuntimeBlockedFiles) items.push(missingEvidenceItem({ code: signals.canvasRuntimeProof, scope: 'browser-proof', kind: 'canvas-runtime-proof', proofLevel: 'canvas-runtime-proof', action: 'review', summary: `Canvas runtime behavior is blocked in ${summary.canvasRuntimeBlockedFiles} file(s); attach source-bound proof with deterministic input, viewport/DPR, draw command trace hash, bitmap/perceptual diff, hit-test/pointer evidence, frame budget, accessibility/fallback evidence, and no broad equivalence claims.`, suggestedInput: { canvasRuntimeProofsByPath: true } }));
  if (summary.canvasOffscreenWorkerBlockedFiles) items.push(missingEvidenceItem({ code: signals.canvasOffscreenWorkerProof, scope: 'browser-proof', kind: 'canvas-offscreen-worker-proof', proofLevel: 'canvas-offscreen-worker-proof', action: 'review', summary: `OffscreenCanvas worker transfer changes are blocked in ${summary.canvasOffscreenWorkerBlockedFiles} file(s); attach worker-bound proof for transferControlToOffscreen, worker messages, draw trace, and output bitmap evidence.`, suggestedInput: { canvasOffscreenWorkerProofsByPath: true } }));
  return items;
}

function packageCanvasProjectMergeMatrixProofStatus(level, summary) {
  if (level === 'package-management-intent') return summary.packageJsonFiles ? (summary.packageManagementBlockedFiles ? 'failed' : summary.packageGraphEvidenceFiles === summary.packageJsonFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'package-lockfile-regeneration-proof') return summary.packageLockfileFiles ? (summary.packageLockfileRegenerationBlockedFiles ? 'failed' : summary.packageLockfileRegeneratedFiles + summary.packageLockfileUnchangedFiles === summary.packageLockfileFiles ? 'passed' : 'missing') : 'absent';
  if (level === 'package-public-surface-proof') return summary.packagePublicSurfaceBlockedFiles ? 'failed' : summary.packagePublicSurfaceProofs ? 'passed' : 'absent';
  if (level === 'package-peer-resolution-proof') return summary.packagePeerResolutionBlockedFiles ? 'failed' : summary.packagePeerResolutionProofs ? 'passed' : 'absent';
  if (level === 'package-install-script-proof') return summary.packageInstallScriptBlockedFiles ? 'failed' : summary.packageInstallScriptProofs ? 'passed' : 'absent';
  if (level === 'package-workspace-proof') return summary.packageWorkspaceBlockedFiles ? 'failed' : summary.packageWorkspaceProofs ? 'passed' : 'absent';
  if (level === 'package-manager-migration-proof') return summary.packageManagerMigrationBlockedFiles ? 'failed' : summary.packageManagerMigrationProofs ? 'passed' : 'absent';
  if (level === 'canvas-static-element') return summary.htmlCanvasElementFiles ? (summary.htmlCanvasStaticMergedFiles === summary.htmlCanvasElementFiles ? 'passed' : 'failed') : 'absent';
  if (level === 'canvas-runtime-proof') return summary.canvasRuntimeSurfaceFiles ? (summary.canvasRuntimeBlockedFiles ? 'failed' : summary.canvasRuntimeProofs ? 'passed' : 'missing') : 'absent';
  if (level === 'canvas-offscreen-worker-proof') return summary.canvasOffscreenWorkerBlockedFiles ? 'failed' : summary.canvasOffscreenWorkerProofs ? 'passed' : 'absent';
  return undefined;
}

export { PackageCanvasProjectMergeMissingSignals, packageCanvasProjectMergeAdmissionMatrixRows, packageCanvasProjectMergeMatrixProofStatus, packageCanvasProjectMergeMissingEvidenceItems, packageCanvasProjectMergeMissingEvidenceRoutes };
