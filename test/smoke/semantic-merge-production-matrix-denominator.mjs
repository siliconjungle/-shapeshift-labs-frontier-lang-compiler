import { assert } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import {
  createSemanticMergeProductionMatrixStatus,
  sourceAnchorUrls
} from '../../bench/semantic-merge-production-matrix-status.mjs';

const status = createSemanticMergeProductionMatrixStatus();
const smokeManifest = readFileSync(new URL('../smoke.mjs', import.meta.url), 'utf8');
const jsTsCoreAreas = new Set([
  'JS/TS parser, source spans, and trivia',
  'JS/TS scope and use-def graph',
  'JS/TS module/export/import graph',
  'JS/TS public API and type graph',
  'JS/TS control-flow and effect graph',
  'Generic semantic edit admission and replay',
  'Symbol move between files',
  'Split/merge modules and classes'
]);

assert.equal(status.kind, 'frontier.lang.semanticMergeProductionMatrixStatus');
assert.equal(status.version, 1);
assert.equal(status.duplicateAreas.length, 0, 'production matrix areas must be unique');
assert.equal(status.unmappedMatrixRows.length, 0, 'production matrix rows must map to proof rows');
assert.equal(status.unmappedProofRows.length, 0, 'proof rows must map to production matrix rows');
assert.equal(status.unmappedSourceAnchors.length, 0, 'all source anchors must be linked');
assert.equal(status.unmappedRemainingWork.length, 0, 'all remaining-work rows must be linked');
assert.equal(status.rowCount, 24, 'production matrix row count');
assert.equal(status.remainingWorkCount, 2, 'remaining work row count');
assert.equal(status.statusCounts.high, 22, 'high matrix row count');
assert.equal(status.statusCounts.partial, 2, 'partial matrix row count');
assert.deepEqual(status.highRowsWithoutExecutableEvidence, [], 'high rows must map to executable evidence');
assert.deepEqual(status.runtimeEquivalenceOverclaimRows, [], 'runtime/browser/render rows must stay bounded or fail-closed');
assert.equal(
  status.rows.some((row) => /broader runtime-equivalence|browser-equivalence|paint\/layout\/runtime equivalence/.test(row.remainingWorkText)),
  true,
  'remaining-work zero keeps broader runtime/browser equivalence caveats'
);
assert.equal(
  status.rows.some((row) => /Keep expanding|Broaden|Add more/.test(row.remainingWorkText)),
  true,
  'remaining-work zero keeps row-level corpus and denominator growth caveats'
);

const realRepoRow = status.rows.find((row) => row.area === 'Real-repo corpus');
assert.equal(Boolean(realRepoRow), true, 'real-repo corpus matrix row exists');
assert.equal(realRepoRow.status, 'high', 'real-repo corpus high after live corpus/build/license cache proof');
assert.equal(realRepoRow.remainingWork.length, 0, 'real-repo corpus remaining work rows');
assert.equal(realRepoRow.evidenceFiles.some((file) => file.path === 'bench/real-repo-corpus-upstream-proof.mjs' && file.present), true, 'real-repo upstream proof runner evidence');
assert.equal(realRepoRow.evidenceFiles.some((file) => file.path === 'research/real-repo-corpus-upstream-proof.json' && file.present), true, 'real-repo upstream proof artifact evidence');
assert.equal(realRepoRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-real-repo-corpus-upstream-proof-artifact.mjs' && file.present), true, 'real-repo upstream proof artifact smoke evidence');

const genericReplayRow = status.rows.find((row) => row.area === 'Generic semantic edit admission and replay');
assert.equal(Boolean(genericReplayRow), true, 'generic replay matrix row exists');
assert.equal(genericReplayRow.status, 'high', 'generic replay high after source-bound bundle composition proof');
assert.match(genericReplayRow.currentExecutableEvidence, /source-bound same-file bundle composition replay/, 'generic replay row names source-bound bundle composition proof');
assert.match(genericReplayRow.currentExecutableEvidence, /current\/output hash binding/, 'generic replay row names current/output binding');
assert.equal(genericReplayRow.evidenceFiles.some((file) => file.path === 'test/smoke/semantic-edit-bundle-auto-merge.mjs' && file.present), true, 'generic replay source edit dedupe evidence');
assert.equal(genericReplayRow.evidenceFiles.some((file) => file.path === 'test/smoke/semantic-patch-bundle-overlaps-same-file.mjs' && file.present), true, 'generic replay source-bound bundle composition evidence');

const svgRow = status.rows.find((row) => row.area === 'SVG parser, identity, structural, and runtime proof');
assert.equal(Boolean(svgRow), true, 'svg matrix row exists');
assert.equal(svgRow.status, 'high', 'svg row high after parser, identity, structural, and runtime proof fixtures');
assert.match(svgRow.currentExecutableEvidence, /source-bound SVG runtime proof capsules/, 'svg row names source-bound runtime proof capsules');
assert.match(svgRow.currentExecutableEvidence, /missing-capsule runtime proofs/, 'svg row names missing-capsule rejection');
assert.match(svgRow.currentExecutableEvidence, /runtime-sensitive SVG animation/, 'svg row names runtime-sensitive SVG boundary rejection');
assert.equal(svgRow.sourceAnchors.some((anchor) => anchor.anchor === 'SVG XML graphics structure and browser paint/layout boundaries' && anchor.present && anchor.urls.length > 0), true, 'svg source anchor evidence');
assert.equal(svgRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-safe-project-merge-html-css.mjs' && file.present), true, 'svg safe merge smoke evidence');
assert.equal(svgRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-safe-project-merge-svg.mjs' && file.present), true, 'svg dedicated smoke evidence');
assert.equal(svgRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-semantic-merge-admission-matrix-html-css.mjs' && file.present), true, 'svg admission matrix evidence');

const svgReferenceRow = status.rows.find((row) => row.area === 'SVG reference graph and paint-server dependencies');
assert.equal(Boolean(svgReferenceRow), true, 'svg reference graph matrix row exists');
assert.equal(svgReferenceRow.status, 'high', 'svg reference graph row high after source-bound reference evidence fixtures');
assert.match(svgReferenceRow.currentExecutableEvidence, /href.*xlink:href/, 'svg reference row names href reference evidence');
assert.match(svgReferenceRow.currentExecutableEvidence, /missing local paint-server targets fail closed/, 'svg reference row names fail-closed paint-server references');
assert.equal(svgReferenceRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-safe-project-merge-svg.mjs' && file.present), true, 'svg reference graph smoke evidence');
assert.equal(svgReferenceRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-semantic-merge-admission-matrix-html-css.mjs' && file.present), true, 'svg reference graph admission matrix evidence');

const completenessRow = status.rows.find((row) => row.area === 'Source-backed completeness matrix');
assert.equal(Boolean(completenessRow), true, 'source-backed completeness matrix row exists');
assert.doesNotMatch(completenessRow.currentExecutableEvidence, /\bCI publishes\b/, 'source-backed completeness row must not claim missing CI publication evidence');
assert.match(completenessRow.currentExecutableEvidence, /executable evidence files/, 'source-backed completeness row names executable evidence mapping');
assert.match(completenessRow.currentExecutableEvidence, /exact source-anchor URLs/, 'source-backed completeness row names exact source-anchor URL checks');
assert.match(completenessRow.currentExecutableEvidence, /remaining-work rows mapped/, 'source-backed completeness row names mapped remaining-work rows');
assert.match(completenessRow.currentExecutableEvidence, /runtime-equivalence caveats/, 'source-backed completeness row names runtime-equivalence caveats');

const packageManagementRow = status.rows.find((row) => row.area === 'Package management intent and lockfile proof');
assert.equal(Boolean(packageManagementRow), true, 'package-management matrix row exists');
assert.equal(packageManagementRow.status, 'partial', 'package-management row stays partial until package-manager execution corpus exists');
assert.match(packageManagementRow.currentExecutableEvidence, /does not text-merge lockfiles/, 'package-management row names lockfile no-text-merge rule');
assert.equal(packageManagementRow.remainingWork.some((item) => item.workItem === 'Package manager execution proof corpus' && item.present), true, 'package-manager execution proof work is tracked');
assert.equal(packageManagementRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-safe-project-merge-package-canvas.mjs' && file.present), true, 'package-management focused smoke evidence');

const canvasRow = status.rows.find((row) => row.area === 'Canvas static element and runtime proof');
assert.equal(Boolean(canvasRow), true, 'canvas matrix row exists');
assert.equal(canvasRow.status, 'partial', 'canvas row stays partial until browser probe corpus exists');
assert.match(canvasRow.currentExecutableEvidence, /OffscreenCanvas worker fail-closed/, 'canvas row names OffscreenCanvas fail-closed behavior');
assert.equal(canvasRow.remainingWork.some((item) => item.workItem === 'Canvas browser probe corpus' && item.present), true, 'canvas browser probe work is tracked');
assert.equal(canvasRow.evidenceFiles.some((file) => file.path === 'test/smoke/js-ts-safe-project-merge-package-canvas.mjs' && file.present), true, 'canvas focused smoke evidence');

const readmeMatrix = status.readmeSemanticMergeMatrix;
assert.equal(Boolean(readmeMatrix), true, 'README semantic merge matrix audit exists');
assert.equal(readmeMatrix.matrixPath, 'README.md', 'README semantic merge matrix path');
assert.equal(readmeMatrix.rowCount, 35, 'README semantic merge row count');
assert.equal(readmeMatrix.statusCounts.high, 1, 'README semantic merge high row count');
assert.deepEqual(readmeMatrix.unmappedHighRows, [], 'README high rows must map to proof rows');
assert.deepEqual(readmeMatrix.highRowsWithoutSourceAnchors, [], 'README high rows must map to source anchors');
assert.deepEqual(readmeMatrix.highRowsWithoutExecutableEvidence, [], 'README high rows must map to executable evidence');
assert.deepEqual(readmeMatrix.runtimeEquivalenceOverclaimRows, [], 'README runtime/browser/render rows must stay bounded or fail-closed');

const readmeRealRepoRow = readmeMatrix.rows.find((row) => row.surface === 'Real-repo benchmark suite');
assert.equal(Boolean(readmeRealRepoRow), true, 'README real-repo high row exists');
assert.equal(readmeRealRepoRow.status, 'High', 'README real-repo high status');
assert.equal(readmeRealRepoRow.sourceAnchorsPresent, true, 'README real-repo source anchors');
assert.equal(readmeRealRepoRow.executableEvidenceFilesPresent, true, 'README real-repo executable evidence');
assert.equal(readmeRealRepoRow.currentEvidence.includes('Dependency installation and checked-out repository build/test execution remain default-off'), true, 'README real-repo default-off command caveat');
assert.equal(readmeRealRepoRow.currentEvidence.includes('bench/real-repo-corpus-upstream-proof.mjs'), true, 'README real-repo proof runner path');
assert.equal(readmeRealRepoRow.currentEvidence.includes('research/real-repo-corpus-upstream-proof.json'), true, 'README real-repo proof artifact path');

for (const row of status.rows.filter((candidate) => jsTsCoreAreas.has(candidate.area))) {
  assert.equal(row.sourceAnchors.some((anchor) => anchor.anchor === 'JavaScript syntax and runtime semantics'), true, `${row.area}: JS source anchor`);
  assert.equal(row.sourceAnchors.some((anchor) => anchor.anchor === 'TypeScript symbols, types, and diagnostics'), true, `${row.area}: TS source anchor`);
  for (const file of row.executableEvidenceFiles.filter((candidate) => candidate.path.startsWith('test/smoke/'))) {
    const manifestPath = `./smoke/${file.path.slice('test/smoke/'.length)}`;
    assert.equal(smokeManifest.includes(manifestPath), true, `${row.area}: ${manifestPath} is wired into test/smoke.mjs`);
  }
}

for (const row of status.rows) {
  assert.equal(['high', 'partial', 'missing'].includes(row.status), true, `${row.area}: supported status`);
  assert.equal(row.mapped, true, `${row.area}: proof mapping`);
  assert.notEqual(row.currentExecutableEvidence, '', `${row.area}: executable evidence text`);
  assert.notEqual(row.remainingWorkText, '', `${row.area}: remaining work text`);
  assert.equal(row.sourceAnchors.length > 0, true, `${row.area}: source anchors`);
  assert.equal(row.evidenceFiles.length > 0, true, `${row.area}: evidence files`);
  assert.equal(row.executableEvidenceFiles.length > 0, true, `${row.area}: executable evidence files`);
  assert.equal(row.sourceAnchorsPresent, true, `${row.area}: source anchors and URLs present`);
  assert.equal(row.evidenceFilesPresent, true, `${row.area}: evidence files present`);
  assert.equal(row.executableEvidenceFilesPresent, true, `${row.area}: executable evidence files present`);
  assert.equal(row.remainingWorkPresent, true, `${row.area}: remaining work rows present`);
  assert.equal(row.runtimeEquivalenceGuard.forbiddenClaim, false, `${row.area}: broad runtime/browser/render equivalence claim`);
  assert.equal(row.runtimeEquivalenceGuard.caveatPresent, true, `${row.area}: runtime/browser/render caveat`);
  assert.equal(row.partialRowOverstatesCompletion, false, `${row.area}: partial row overstates completeness`);
  for (const anchor of row.sourceAnchors) {
    assert.deepEqual(anchor.urls, sourceAnchorUrls[anchor.anchor] ?? [], `${row.area}: exact source-anchor URLs for ${anchor.anchor}`);
  }
}
