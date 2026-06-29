import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';
import { svgBase, svgHead, svgRuntimeProof, svgWorker } from './svg-merge-test-helpers.mjs';

const svgRuntimeVocabularyBase = [
  '<svg id="icon" viewBox="0 0 10 10">',
  '  <script>setup()</script>',
  '  <foreignObject id="label"><div onclick="render()">HTML</div></foreignObject>',
  '  <a id="docs" href="https://example.com/icon">',
  '  <rect id="box" onclick="select()" pointer-events="none" width="10" height="10">',
  '    <animate id="pulse" attributeName="opacity" from="0" to="1" dur="1s" />',
  '  </rect>',
  '  </a>',
  '</svg>',
  ''
].join('\n');
const svgRuntimeVocabularyWorker = svgRuntimeVocabularyBase.replace('width="10"', 'width="12"');
const svgRuntimeVocabularyHead = svgRuntimeVocabularyBase.replace('<svg id="icon"', '<svg id="icon" role="img"');
const svgRuntimeVocabularyProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_runtime_vocabulary_inert_structural_change',
  files: [{
    sourcePath: 'src/runtime-vocabulary.svg',
    baseSourceText: svgRuntimeVocabularyBase,
    workerSourceText: svgRuntimeVocabularyWorker,
    headSourceText: svgRuntimeVocabularyHead
  }]
});
assert.equal(svgRuntimeVocabularyProject.status, 'merged');
assert.equal(svgRuntimeVocabularyProject.conflicts.some((conflict) => conflict.code === 'svg-runtime-boundary-blocked'), false);
assert.match(svgRuntimeVocabularyProject.outputFiles[0].sourceText, /role="img"/);
assert.match(svgRuntimeVocabularyProject.outputFiles[0].sourceText, /width="12"/);

const svgLegacyRuntimeProofProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_runtime_legacy_no_capsule_blocked',
  svgRuntimeProofsByPath: {
    'src/icon.svg': [{ ...svgRuntimeProof, id: 'proof_svg_icon_runtime_legacy_no_capsule', runtimeProofCapsule: undefined }]
  },
  files: [{ sourcePath: 'src/icon.svg', baseSourceText: svgBase, workerSourceText: svgWorker, headSourceText: svgHead }]
});
assert.equal(svgLegacyRuntimeProofProject.status, 'blocked');
assert.equal(svgLegacyRuntimeProofProject.conflicts.some((conflict) => conflict.code === 'svg-runtime-proof-blocked' && conflict.details.reasonCodes.includes('runtime-proof-capsule-missing')), true);
assert.equal(svgLegacyRuntimeProofProject.summary.svgBrowserRuntimeProofBlockedFiles, 1);
assert.equal(matrixSurface(svgLegacyRuntimeProofProject, 'svg-browser-runtime-proof').proofStatuses['svg-browser-runtime-proof'], 'failed');

const duplicateSvgIdentityProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_duplicate_identity_blocked',
  files: [{
    sourcePath: 'src/duplicate-icon.svg',
    baseSourceText: '<svg id="icon"><path id="dup" d="M0 0h1v1z" /><circle id="dup" cx="1" cy="1" r="1" /></svg>\n',
    workerSourceText: '<svg id="icon" role="img"><path id="dup" d="M0 0h1v1z" /><circle id="dup" cx="1" cy="1" r="1" /></svg>\n',
    headSourceText: '<svg id="icon"><path id="dup" d="M0 0h1v1z" /><circle id="dup" cx="1" cy="1" r="1" /></svg>\n'
  }]
});
assert.equal(duplicateSvgIdentityProject.status, 'blocked');
assert.equal(duplicateSvgIdentityProject.summary.svgDuplicateIdentityEvidenceFiles, 1);
assert.equal(duplicateSvgIdentityProject.summary.svgReferenceGraphEvidenceFailedFiles, 1);
assert.equal(duplicateSvgIdentityProject.files[0].result.svgReferenceGraphEvidence.referenceErrorCodes.includes('svg-reference-definition-duplicate'), true);
assert.equal(duplicateSvgIdentityProject.conflicts.some((conflict) => conflict.details?.reasonCode === 'html-duplicate-explicit-identity'), true);
assert.equal(matrixSurface(duplicateSvgIdentityProject, 'svg-identity-evidence').proofStatuses['svg-identity-evidence'], 'failed');

const malformedSvgProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_svg_parser_blocked',
  files: [{
    sourcePath: 'src/broken-icon.svg',
    baseSourceText: '<svg id="icon"><g></svg>\n',
    workerSourceText: '<svg id="icon" role="img"><g></svg>\n',
    headSourceText: '<svg id="icon"><g></svg>\n'
  }]
});
assert.equal(malformedSvgProject.status, 'blocked');
assert.equal(malformedSvgProject.summary.svgParserEvidenceFailedFiles, 1);
assert.equal(malformedSvgProject.conflicts.some((conflict) => conflict.code === 'svg-parser-source-evidence-blocked'), true);
assert.equal(matrixSurface(malformedSvgProject, 'svg-parser-source-evidence').proofStatuses['svg-parser-source-evidence'], 'failed');
