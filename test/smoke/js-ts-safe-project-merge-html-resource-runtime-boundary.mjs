import { assert } from './helpers.mjs';
import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { runtimeProofCapsule } from './html-css-merge-test-helpers.mjs';

function resourceRuntimeEvidence(label) {
  const command = `node test/html-runtime/${label}.mjs`;
  const probeId = `html:resource-loading-runtime-boundary:html-resource-loading-attribute`;
  const evidenceHash = `html-runtime-evidence:resource-loading-runtime-boundary:html-resource-loading-attribute:${label}`;
  const signals = ['html-resource-loading-runtime'];
  return {
    runtimeCommand: command,
    runtimeProbeId: probeId,
    runtimeEvidenceHash: evidenceHash,
    runtimeSignals: signals,
    runtimeProofCapsule: runtimeProofCapsule({ command, probeId, evidenceHash, signals, label })
  };
}

function sourceHashBinding(base, worker, head, output) {
  return {
    baseSourceHash: hashSemanticValue(base),
    workerSourceHash: hashSemanticValue(worker),
    headSourceHash: hashSemanticValue(head),
    outputSourceHash: hashSemanticValue(output)
  };
}

const linkBase = '<link data-frontier-key="theme" rel="stylesheet" href="/a.css">\n';
const linkWorker = '<link data-frontier-key="theme" rel="stylesheet" href="/b.css">\n';
const linkBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_link_resource_runtime_block',
  files: [{ sourcePath: 'src/resource.html', baseSourceText: linkBase, workerSourceText: linkWorker, headSourceText: linkBase }]
});
assert.equal(linkBlockedProject.status, 'blocked');
assert.equal(linkBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(linkBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(linkBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'resource-loading-runtime-boundary'), true);
assert.match(linkBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'resource-loading-runtime-boundary').details.proofGap.nextProof, /htmlRuntimeBoundaryProofsByPath/);

const linkWrongProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_link_resource_runtime_wrong_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/resource.html': [{
      id: 'html_link_resource_wrong_attribute',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/resource.html',
      reasonCode: 'resource-loading-runtime-boundary',
      side: 'worker',
      boundary: 'html-resource-loading-attribute',
      boundaryAttributes: ['media'],
      sourceTexts: { base: linkBase, worker: linkWorker, head: linkBase, output: linkWorker },
      ...resourceRuntimeEvidence('link-wrong-attribute')
    }]
  },
  files: [{ sourcePath: 'src/resource.html', baseSourceText: linkBase, workerSourceText: linkWorker, headSourceText: linkBase }]
});
assert.equal(linkWrongProofProject.status, 'blocked');
assert.equal(linkWrongProofProject.conflicts.some((conflict) => conflict.details.reasonCode === 'resource-loading-runtime-boundary'), true);

const linkProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_link_resource_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/resource.html': [{
      id: 'html_link_resource_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/resource.html',
      reasonCode: 'resource-loading-runtime-boundary',
      side: 'worker',
      boundary: 'html-resource-loading-attribute',
      boundaryAttributes: ['href'],
      sourceTexts: { base: linkBase, worker: linkWorker, head: linkBase, output: linkWorker },
      ...resourceRuntimeEvidence('link')
    }]
  },
  files: [{ sourcePath: 'src/resource.html', baseSourceText: linkBase, workerSourceText: linkWorker, headSourceText: linkBase }]
});
assert.equal(linkProvenProject.status, 'merged');
assert.equal(linkProvenProject.summary.htmlCssBrowserRuntimeProofs, 1);
assert.equal(linkProvenProject.files[0].result.runtimeBoundaryProofs[0].boundary, 'html-resource-loading-attribute');
assert.equal(linkProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes[0], 'href');
assert.match(linkProvenProject.outputFiles[0].sourceText, /href="\/b.css"/);

const preloadBase = '<link data-frontier-key="hero-preload" rel="preload" as="image" href="/hero.jpg" imagesrcset="/hero-600.jpg 600w, /hero-1200.jpg 1200w" imagesizes="100vw" media="(min-width: 600px)" integrity="sha256-old" crossorigin="anonymous" referrerpolicy="origin">\n';
const preloadWorker = '<link data-frontier-key="hero-preload" rel="preload" as="image" href="/hero.jpg" imagesrcset="/hero-800.jpg 800w, /hero-1600.jpg 1600w" imagesizes="80vw" media="(min-width: 720px)" integrity="sha256-new" crossorigin="use-credentials" referrerpolicy="no-referrer">\n';
const preloadBoundaryAttributes = ['imagesrcset', 'imagesizes', 'media', 'integrity', 'crossorigin', 'referrerpolicy'];
const preloadBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_preload_resource_runtime_block',
  files: [{ sourcePath: 'src/preload.html', baseSourceText: preloadBase, workerSourceText: preloadWorker, headSourceText: preloadBase }]
});
assert.equal(preloadBlockedProject.status, 'blocked');
const preloadBlockedConflict = preloadBlockedProject.conflicts.find((conflict) => conflict.details.reasonCode === 'resource-loading-runtime-boundary');
assert.ok(preloadBlockedConflict);
assert.equal(preloadBlockedConflict.details.boundary, 'html-resource-loading-attribute');
assert.equal(preloadBlockedConflict.details.boundaryAttributes.includes('imagesrcset'), true);

const preloadProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_preload_resource_runtime_hash_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/preload.html': [{
      id: 'html_preload_resource_hash_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/preload.html',
      reasonCode: 'resource-loading-runtime-boundary',
      side: 'worker',
      boundary: 'html-resource-loading-attribute',
      boundaryAttributes: preloadBoundaryAttributes,
      ...sourceHashBinding(preloadBase, preloadWorker, preloadBase, preloadWorker),
      ...resourceRuntimeEvidence('preload-responsive-image')
    }]
  },
  files: [{ sourcePath: 'src/preload.html', baseSourceText: preloadBase, workerSourceText: preloadWorker, headSourceText: preloadBase }]
});
assert.equal(preloadProvenProject.status, 'merged');
const preloadRuntimeProof = preloadProvenProject.files[0].result.runtimeBoundaryProofs[0];
assert.deepEqual([...preloadRuntimeProof.boundaryAttributes].sort(), [...preloadBoundaryAttributes].sort());
assert.equal(preloadRuntimeProof.baseSourceHash, hashSemanticValue(preloadBase));
assert.equal(preloadRuntimeProof.workerSourceHash, hashSemanticValue(preloadWorker));
assert.equal(preloadRuntimeProof.headSourceHash, hashSemanticValue(preloadBase));
assert.equal(preloadRuntimeProof.outputSourceHash, hashSemanticValue(preloadWorker));
assert.equal(preloadRuntimeProof.runtimeSignals.includes('html-resource-loading-runtime'), true);
assert.equal(preloadRuntimeProof.requiredRuntimeSignals.includes('html-resource-loading-runtime'), true);
assert.equal(preloadRuntimeProof.runtimeEvidenceBound, true);
assert.match(preloadProvenProject.outputFiles[0].sourceText, /imagesrcset="\/hero-800\.jpg 800w, \/hero-1600\.jpg 1600w"/);

const baseBase = '<base data-frontier-key="base" href="/old/">\n';
const baseWorker = '<base data-frontier-key="base" href="/new/">\n';
const baseBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_base_runtime_block',
  files: [{ sourcePath: 'src/base.html', baseSourceText: baseBase, workerSourceText: baseWorker, headSourceText: baseBase }]
});
assert.equal(baseBlockedProject.status, 'blocked');
assert.equal(baseBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'document-base-runtime-boundary'), true);

const metaBase = '<meta data-frontier-key="refresh" http-equiv="refresh" content="30">\n';
const metaWorker = '<meta data-frontier-key="refresh" http-equiv="refresh" content="0">\n';
const metaBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_meta_runtime_block',
  files: [{ sourcePath: 'src/meta.html', baseSourceText: metaBase, workerSourceText: metaWorker, headSourceText: metaBase }]
});
assert.equal(metaBlockedProject.status, 'blocked');
assert.equal(metaBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'document-metadata-runtime-boundary'), true);

const mediaBase = '<video data-frontier-key="hero" poster="/a.jpg" preload="metadata"></video>\n';
const mediaWorker = '<video data-frontier-key="hero" poster="/b.jpg" preload="metadata"></video>\n';
const mediaProvenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_media_resource_runtime_source_bound_proof',
  htmlRuntimeBoundaryProofsByPath: {
    'src/media.html': [{
      id: 'html_media_resource_source_bound',
      kind: 'html-source-bound-runtime-boundary-proof',
      status: 'passed',
      sourcePath: 'src/media.html',
      reasonCode: 'resource-loading-runtime-boundary',
      side: 'worker',
      boundary: 'html-resource-loading-attribute',
      boundaryAttributes: ['poster'],
      sourceTexts: { base: mediaBase, worker: mediaWorker, head: mediaBase, output: mediaWorker },
      ...resourceRuntimeEvidence('media')
    }]
  },
  files: [{ sourcePath: 'src/media.html', baseSourceText: mediaBase, workerSourceText: mediaWorker, headSourceText: mediaBase }]
});
assert.equal(mediaProvenProject.status, 'merged');
assert.equal(mediaProvenProject.files[0].result.runtimeBoundaryProofs[0].boundaryAttributes[0], 'poster');
assert.match(mediaProvenProject.outputFiles[0].sourceText, /poster="\/b.jpg"/);
