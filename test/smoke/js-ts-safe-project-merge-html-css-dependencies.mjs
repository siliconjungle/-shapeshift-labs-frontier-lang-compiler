import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { parseCssSemanticSheet } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { projectCssDependencyProofOptionsForBlockedMerge } from '../../src/js-ts-safe-project-merge-css-dependency-proofs.js';

const dependencyCssBase = [
  ':root {',
  '  --motion-name: fade;',
  '  --spinner-asset: url("./spinner.svg");',
  '}',
  '.spinner {',
  '  animation-name: var(--motion-name, fade);',
  '  background-image: var(--spinner-asset, url("./fallback.svg"));',
  '  color: red;',
  '}',
  ''
].join('\n');
const dependencyCssWorker = dependencyCssBase.replace('--motion-name: fade;', '--motion-name: slide;');
const dependencyCssHead = dependencyCssBase.replace('color: red;', 'color: blue;');
const cssDependencyMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_dependency_graph_missing',
  disableProjectCssDependencyGraphProofSynthesis: true,
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: dependencyCssBase, workerSourceText: dependencyCssWorker, headSourceText: dependencyCssHead }]
});
assert.equal(cssDependencyMissingProof.status, 'blocked');
assert.equal(cssDependencyMissingProof.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphEvidenceFiles, 1);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphMissingProofFiles, 0);
assert.equal(cssDependencyMissingProof.summary.cssDependencyGraphBlockedFiles, 1);
assert.equal(cssDependencyMissingProof.confidence.missingSignals.includes('css-dependency-graph-evidence-missing'), true);
const cssDependencySurface = matrixSurface(cssDependencyMissingProof, 'css-dependency-graph-evidence');
assert.equal(cssDependencySurface.proofStatuses['css-dependency-graph'], 'failed');
assert.equal(cssDependencySurface.missingRouteIds.includes('prove-css-dependency-graph'), true);
assert.equal(matrixSurface(cssDependencyMissingProof, 'html-css-browser-runtime-proof').proofStatuses['browser-runtime-proof'], 'missing');

const dependencyCssOutput = [
  ':root {',
  '  --motion-name: slide;',
  '  --spinner-asset: url("./spinner.svg");',
  '}',
  '',
  '.spinner {',
  '  animation-name: var(--motion-name, fade);',
  '  background-image: var(--spinner-asset, url("./fallback.svg"));',
  '  color: blue;',
  '}',
  ''
].join('\n');
const cssDependencyAutoProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_dependency_graph_auto_proven',
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: dependencyCssBase, workerSourceText: dependencyCssWorker, headSourceText: dependencyCssHead }]
});
assert.equal(cssDependencyAutoProof.status, 'merged');
assert.equal(cssDependencyAutoProof.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssDependencyAutoProof.summary.cssDependencyGraphEvidenceFiles, 1);
assert.equal(cssDependencyAutoProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssDependencyAutoProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssDependencyAutoProof.files[0].result.dependencyGraphProofs[0].proofLevel, 'css-custom-property-dependency-graph-project-source-bound');
assert.equal(cssDependencyAutoProof.files[0].result.dependencyGraphProofs[0].cascadeKey, ':root::--motion-name');
assert.equal(cssDependencyAutoProof.outputFiles[0].sourceText, dependencyCssOutput);
assert.equal(matrixSurface(cssDependencyAutoProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');
const dependencyGraphHash = (sourceText) => parseCssSemanticSheet(sourceText, { sourcePath: 'src/spinner.css' }).dependencyGraphEvidence.dependencyGraphHash;
const cssDependencyAutoProofOptions = projectCssDependencyProofOptionsForBlockedMerge({
  projectInput: {},
  sourcePath: 'src/spinner.css',
  firstResult: cssDependencyMissingProof.files[0].result,
  base: dependencyCssBase,
  worker: dependencyCssWorker,
  head: dependencyCssHead
});
const cssCustomPropertySynthesizedProof = cssDependencyAutoProofOptions.mergeOptions.cssDependencyGraphProofs[0];
assert.equal(cssCustomPropertySynthesizedProof.sourceBoundDependencyRecords.base[0].kind, 'custom-property-definition');
assert.equal(cssCustomPropertySynthesizedProof.sourceBoundDependencyRecords.worker[0].kind, 'custom-property-definition');
assert.equal(Number.isInteger(cssCustomPropertySynthesizedProof.sourceBoundDependencyRecords.base[0].sourceSpan.startOffset), true);
assert.equal(cssCustomPropertySynthesizedProof.sourceBoundDependencyRecordHashes.base.length, 1);
assert.equal(cssCustomPropertySynthesizedProof.sourceBoundDependencyRecordHashes.worker.length, 1);
const cssDependencyWithProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_dependency_graph_proven',
  cssMergeOptionsByPath: {
    'src/spinner.css': {
      cssDependencyGraphProofs: [{
        id: 'proof_css_dependency_graph_motion_name',
        kind: 'css-source-bound-dependency-graph-proof',
        status: 'passed',
        sourcePath: 'src/spinner.css',
        reasonCode: 'css-dependency-graph-proof-unproved',
        side: 'worker',
        cascadeKey: ':root::--motion-name',
        baseSourceHash: hashSemanticValue(dependencyCssBase),
        workerSourceHash: hashSemanticValue(dependencyCssWorker),
        headSourceHash: hashSemanticValue(dependencyCssHead),
        outputSourceHash: hashSemanticValue(dependencyCssOutput),
        dependencyGraphHashes: { base: dependencyGraphHash(dependencyCssBase), worker: dependencyGraphHash(dependencyCssWorker), head: dependencyGraphHash(dependencyCssHead) }
      }]
    }
  },
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: dependencyCssBase, workerSourceText: dependencyCssWorker, headSourceText: dependencyCssHead }]
});
assert.equal(cssDependencyWithProof.status, 'merged');
assert.equal(cssDependencyWithProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssDependencyWithProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssDependencyWithProof.outputFiles[0].sourceText, dependencyCssOutput);
assert.equal(matrixSurface(cssDependencyWithProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');

const fallbackDependencyCssBase = [
  ':root {',
  '  --primary: red;',
  '  --secondary: purple;',
  '}',
  '.button {',
  '  color: var(--theme, var(--primary, blue));',
  '  border-color: red;',
  '}',
  ''
].join('\n');
const fallbackDependencyCssWorker = fallbackDependencyCssBase.replace('var(--theme, var(--primary, blue))', 'var(--theme, var(--secondary, blue))');
const fallbackDependencyCssHead = fallbackDependencyCssBase.replace('border-color: red;', 'border-color: blue;');
const fallbackDependencyCssOutput = [
  ':root {',
  '  --primary: red;',
  '  --secondary: purple;',
  '}',
  '',
  '.button {',
  '  color: var(--theme, var(--secondary, blue));',
  '  border-color: blue;',
  '}',
  ''
].join('\n');
const cssVarFallbackMissingProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_var_fallback_dependency_graph_missing',
  disableProjectCssDependencyGraphProofSynthesis: true,
  files: [{ sourcePath: 'src/theme.css', baseSourceText: fallbackDependencyCssBase, workerSourceText: fallbackDependencyCssWorker, headSourceText: fallbackDependencyCssHead }]
});
assert.equal(cssVarFallbackMissingProof.status, 'blocked');
assert.equal(cssVarFallbackMissingProof.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssVarFallbackMissingProof.summary.cssDependencyGraphBlockedFiles, 1);
assert.equal(matrixSurface(cssVarFallbackMissingProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'failed');
const cssVarFallbackProofOptions = projectCssDependencyProofOptionsForBlockedMerge({
  projectInput: {},
  sourcePath: 'src/theme.css',
  firstResult: cssVarFallbackMissingProof.files[0].result,
  base: fallbackDependencyCssBase,
  worker: fallbackDependencyCssWorker,
  head: fallbackDependencyCssHead
});
const cssVarFallbackSynthesizedProof = cssVarFallbackProofOptions.mergeOptions.cssDependencyGraphProofs[0];
assert.equal(cssVarFallbackSynthesizedProof.proofLevel, 'css-var-fallback-dependency-graph-project-source-bound');
assert.equal(cssVarFallbackSynthesizedProof.cascadeKey, '.button::color');
assert.equal(cssVarFallbackSynthesizedProof.varFallbackReferenceHashes.base.length, 1);
assert.equal(cssVarFallbackSynthesizedProof.varFallbackReferenceHashes.worker.length, 1);
assert.notEqual(cssVarFallbackSynthesizedProof.varFallbackReferenceHashes.base[0], cssVarFallbackSynthesizedProof.varFallbackReferenceHashes.worker[0]);
assert.equal(cssVarFallbackSynthesizedProof.sourceBoundDependencyRecords.base[0].kind, 'custom-property-reference');
assert.equal(cssVarFallbackSynthesizedProof.sourceBoundDependencyRecords.worker[0].kind, 'custom-property-reference');
assert.equal(cssVarFallbackSynthesizedProof.sourceBoundDependencyRecords.base[0].fallbackHash, cssVarFallbackSynthesizedProof.varFallbackReferenceHashes.base[0]);
assert.equal(cssVarFallbackSynthesizedProof.sourceBoundDependencyRecordHashes.base.length, 1);

const cssVarFallbackAutoProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_var_fallback_dependency_graph_auto_proven',
  files: [{ sourcePath: 'src/theme.css', baseSourceText: fallbackDependencyCssBase, workerSourceText: fallbackDependencyCssWorker, headSourceText: fallbackDependencyCssHead }]
});
assert.equal(cssVarFallbackAutoProof.status, 'merged');
assert.equal(cssVarFallbackAutoProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssVarFallbackAutoProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssVarFallbackAutoProof.files[0].result.dependencyGraphProofs[0].proofLevel, 'css-var-fallback-dependency-graph-project-source-bound');
assert.equal(cssVarFallbackAutoProof.outputFiles[0].sourceText, fallbackDependencyCssOutput);
assert.equal(matrixSurface(cssVarFallbackAutoProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');

const fallbackDependencyGraphHash = (sourceText) => parseCssSemanticSheet(sourceText, { sourcePath: 'src/theme.css' }).dependencyGraphEvidence.dependencyGraphHash;
const cssVarFallbackStaleProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_var_fallback_dependency_graph_stale_proof',
  disableProjectCssDependencyGraphProofSynthesis: true,
  cssMergeOptionsByPath: {
    'src/theme.css': {
      cssDependencyGraphProofs: [{
        id: 'proof_css_var_fallback_dependency_graph_stale',
        kind: 'css-source-bound-dependency-graph-proof',
        status: 'passed',
        proofLevel: 'css-var-fallback-dependency-graph-project-source-bound',
        sourcePath: 'src/theme.css',
        reasonCode: 'css-dependency-graph-proof-unproved',
        side: 'worker',
        cascadeKey: '.button::color',
        baseSourceHash: hashSemanticValue(fallbackDependencyCssBase),
        workerSourceHash: hashSemanticValue(fallbackDependencyCssWorker),
        headSourceHash: hashSemanticValue(fallbackDependencyCssHead),
        outputSourceHash: hashSemanticValue(fallbackDependencyCssOutput),
        dependencyGraphHashes: {
          base: fallbackDependencyGraphHash(fallbackDependencyCssBase),
          worker: 'stale-css-var-fallback-dependency-graph-hash',
          head: fallbackDependencyGraphHash(fallbackDependencyCssHead)
        }
      }]
    }
  },
  files: [{ sourcePath: 'src/theme.css', baseSourceText: fallbackDependencyCssBase, workerSourceText: fallbackDependencyCssWorker, headSourceText: fallbackDependencyCssHead }]
});
assert.equal(cssVarFallbackStaleProof.status, 'blocked');
assert.equal(cssVarFallbackStaleProof.summary.cssDependencyGraphBlockedFiles, 1);
assert.equal(cssVarFallbackStaleProof.conflicts.some((conflict) => conflict.code === 'css-dependency-graph-proof-blocked'), true);
assert.equal(matrixSurface(cssVarFallbackStaleProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'failed');

const cssVarFallbackMissingSourceBoundRecords = projectCssDependencyProofOptionsForBlockedMerge({
  projectInput: {},
  sourcePath: 'src/theme.css',
  firstResult: stripSourceBoundDependencyRecords(cssVarFallbackMissingProof.files[0].result, '.button::color'),
  base: fallbackDependencyCssBase,
  worker: fallbackDependencyCssWorker,
  head: fallbackDependencyCssHead
});
assert.equal(cssVarFallbackMissingSourceBoundRecords.mergeOptions, undefined);
assert.equal(cssVarFallbackMissingSourceBoundRecords.result.status, 'blocked');
assert.equal(cssVarFallbackMissingSourceBoundRecords.result.conflicts.some((conflict) => conflict.code === 'css-source-bound-dependency-record-proof-blocked'), true);
const missingSourceRecordConflict = cssVarFallbackMissingSourceBoundRecords.result.conflicts.find((conflict) => conflict.code === 'css-source-bound-dependency-record-proof-blocked');
assert.equal(missingSourceRecordConflict.details.reasonCode, 'css-source-bound-dependency-records-missing');
assert.deepEqual(missingSourceRecordConflict.details.missingSourceBoundDependencyRecordSides, ['base', 'worker']);
assert.equal(missingSourceRecordConflict.details.proofGap.semanticEquivalenceClaim, false);

const cssVarFallbackPartialKindRecords = projectCssDependencyProofOptionsForBlockedMerge({
  projectInput: {}, sourcePath: 'src/theme.css',
  firstResult: addSyntheticDependencyKindRequirement(cssVarFallbackMissingProof.files[0].result, '.button::color', 'custom-property-definition'),
  base: fallbackDependencyCssBase, worker: fallbackDependencyCssWorker, head: fallbackDependencyCssHead
});
assert.equal(cssVarFallbackPartialKindRecords.mergeOptions, undefined);
assert.equal(cssVarFallbackPartialKindRecords.result.status, 'blocked');
const partialKindConflict = cssVarFallbackPartialKindRecords.result.conflicts.find((conflict) => conflict.code === 'css-source-bound-dependency-record-proof-blocked');
assert.equal(partialKindConflict.details.reasonCode, 'css-source-bound-dependency-records-missing');
assert.deepEqual(partialKindConflict.details.missingSourceBoundDependencyRecordSides, ['base', 'worker']);
assert.equal(partialKindConflict.details.dependencyKinds.includes('custom-property-definition'), true);
assert.equal(partialKindConflict.details.sourceBoundDependencyRecords.base.every((record) => record.kind !== 'custom-property-definition'), true);

const keyframesCssBase = [
  '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
  '.spinner {',
  '  animation-name: fade;',
  '  color: red;',
  '}',
  ''
].join('\n');
const keyframesCssWorker = keyframesCssBase.replace('@keyframes fade', '@keyframes slide').replace('animation-name: fade;', 'animation-name: slide;');
const keyframesCssHead = keyframesCssBase.replace('color: red;', 'color: blue;');
const cssKeyframesDependencyAutoProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_keyframes_dependency_auto_proven',
  files: [{ sourcePath: 'src/spinner.css', baseSourceText: keyframesCssBase, workerSourceText: keyframesCssWorker, headSourceText: keyframesCssHead }]
});
assert.equal(cssKeyframesDependencyAutoProof.status, 'merged');
assert.equal(cssKeyframesDependencyAutoProof.summary.cssDependencySurfaceFiles, 1);
assert.equal(cssKeyframesDependencyAutoProof.summary.cssDependencyGraphEvidenceFiles, 1);
assert.equal(cssKeyframesDependencyAutoProof.summary.cssDependencyGraphMissingProofFiles, 0);
assert.equal(cssKeyframesDependencyAutoProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].proofLevel, 'css-keyframes-animation-name-source-bound');
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].autoGenerated, true);
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].keyframeRename.from, 'fade');
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].keyframeRename.to, 'slide');
assert.deepEqual(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].keyframeRename.declarationCascadeKeys, ['.spinner::animation-name']);
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.dependencyGraphProofs[0].coveredSourceShapeChanges.length, 2);
assert.equal(cssKeyframesDependencyAutoProof.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(cssKeyframesDependencyAutoProof.outputFiles[0].sourceText, '@keyframes slide { from { opacity: 0; } to { opacity: 1; } }\n\n.spinner {\n  animation-name: slide;\n  color: blue;\n}\n');
assert.equal(matrixSurface(cssKeyframesDependencyAutoProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');

const fontFaceCssBase = '@font-face { font-family: Inter; src: url("./inter.woff2"); font-weight: 400; }\n.copy { font-family: Inter, sans-serif; color: red; }\n';
const fontFaceCssWorker = fontFaceCssBase.replace('font-family: Inter; src', 'font-family: InterNext; src').replace('font-family: Inter, sans-serif', 'font-family: InterNext, sans-serif');
const fontFaceCssHead = fontFaceCssBase.replace('color: red', 'color: blue');
const cssFontFaceDependencyAutoProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_font_face_dependency_auto_proven',
  files: [{ sourcePath: 'src/fonts.css', baseSourceText: fontFaceCssBase, workerSourceText: fontFaceCssWorker, headSourceText: fontFaceCssHead }]
});
assert.equal(cssFontFaceDependencyAutoProof.status, 'merged');
assert.equal(cssFontFaceDependencyAutoProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssFontFaceDependencyAutoProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssFontFaceDependencyAutoProof.files[0].result.dependencyGraphProofs[0].proofLevel, 'css-font-face-family-source-bound');
assert.equal(cssFontFaceDependencyAutoProof.files[0].result.dependencyGraphProofs[0].fontFaceRename.from, 'Inter');
assert.equal(cssFontFaceDependencyAutoProof.files[0].result.dependencyGraphProofs[0].fontFaceRename.to, 'InterNext');
assert.equal(cssFontFaceDependencyAutoProof.files[0].result.dependencyGraphProofs[0].coveredSourceShapeChanges.length, 1);
assert.equal(cssFontFaceDependencyAutoProof.outputFiles[0].sourceText, '@font-face { font-family: InterNext; src: url("./inter.woff2"); font-weight: 400; }\n\n.copy {\n  font-family: InterNext, sans-serif;\n  color: blue;\n}\n');
assert.equal(matrixSurface(cssFontFaceDependencyAutoProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');

const urlAssetCssBase = '.hero {\n  background-image: url("./hero.png");\n  color: red;\n}\n';
const urlAssetCssWorker = urlAssetCssBase.replace('./hero.png', './hero@2x.png');
const urlAssetCssHead = urlAssetCssBase.replace('color: red', 'color: blue');
const cssUrlAssetDependencyAutoProof = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_url_asset_dependency_auto_proven',
  files: [{ sourcePath: 'src/hero.css', baseSourceText: urlAssetCssBase, workerSourceText: urlAssetCssWorker, headSourceText: urlAssetCssHead }]
});
assert.equal(cssUrlAssetDependencyAutoProof.status, 'merged');
assert.equal(cssUrlAssetDependencyAutoProof.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(cssUrlAssetDependencyAutoProof.files[0].result.dependencyGraphProofs.length, 1);
assert.equal(cssUrlAssetDependencyAutoProof.files[0].result.dependencyGraphProofs[0].proofLevel, 'css-url-asset-source-bound');
assert.equal(cssUrlAssetDependencyAutoProof.files[0].result.dependencyGraphProofs[0].urlAssetRename.from, './hero.png');
assert.equal(cssUrlAssetDependencyAutoProof.files[0].result.dependencyGraphProofs[0].urlAssetRename.to, './hero@2x.png');
assert.equal(cssUrlAssetDependencyAutoProof.files[0].result.browserCascadeEquivalenceClaim, false);
assert.equal(cssUrlAssetDependencyAutoProof.outputFiles[0].sourceText, '.hero {\n  background-image: url("./hero@2x.png");\n  color: blue;\n}\n');
assert.equal(matrixSurface(cssUrlAssetDependencyAutoProof, 'css-dependency-graph-evidence').proofStatuses['css-dependency-graph'], 'passed');

function stripSourceBoundDependencyRecords(result, cascadeKey) {
  const copy = JSON.parse(JSON.stringify(result));
  for (const side of Object.values(copy.dependencyGraphEvidence?.sides ?? {})) {
    for (const key of ['customPropertyDefinitions', 'customPropertyReferences']) {
      side.records[key] = (side.records[key] ?? []).map((record) => record.cascadeKey === cascadeKey ? stripSourceBoundDependencyRecord(record) : record);
    }
  }
  return copy;
}

function stripSourceBoundDependencyRecord(record) {
  const { declarationHash, sourceHash, sourceSpan, ...rest } = record;
  return rest;
}

function addSyntheticDependencyKindRequirement(result, cascadeKey, dependencyKind) {
  const copy = JSON.parse(JSON.stringify(result));
  for (const change of copy.dependencyGraphEvidence?.changedDependencySurfaces ?? []) {
    if (change.cascadeKey !== cascadeKey) continue;
    for (const summary of [change.before, change.after]) if (summary?.dependencyKinds) summary.dependencyKinds = [...new Set([...summary.dependencyKinds, dependencyKind])];
  }
  return copy;
}
