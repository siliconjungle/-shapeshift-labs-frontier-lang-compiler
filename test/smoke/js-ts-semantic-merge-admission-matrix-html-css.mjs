import { assert } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import { safeMergeJsTsProject } from '../../src/index.js';
import { htmlCssProjectMergeMatrixProofStatus } from '../../src/js-ts-safe-project-merge-html-css-matrix.js';

const matrixCells = [
  { id: 'source-text-merge/baseline-candidate-recorded', status: 'done', support: 'baseline', evidence: 'js-ts-project-source-text-merge-candidate', note: 'project admission records the conservative concrete source merge candidate as the baseline reviewed by semantic proof surfaces' },
  { id: 'html-css/html-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML parser/source evidence is parse5/source-span bounded and does not imply browser DOM or render equivalence' },
  { id: 'html-css/css-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS parser/source evidence is PostCSS/source-span bounded and does not imply cascade or browser equivalence' },
  { id: 'html-css/html-identity-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML identity evidence records explicit/path identity and duplicate identity blockers before structural admission' },
  { id: 'html-css/css-selector-target-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS selector target evidence records target/specificity/rebase proof status before cascade admission' },
  { id: 'html-css/html-structural-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML structural merges require parser-backed identity evidence and keep runtime/browser proof as a separate row' },
  { id: 'html-css/css-cascade-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS cascade merges require selector target, specificity, scoped cascade, and dependency evidence before admission' },
  { id: 'html-css/css-dependency-graph-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS dependency graph evidence is absent until custom property, animation, font, and asset dependency surfaces require it' },
  { id: 'html-css/css-runtime-descriptor-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS runtime descriptor evidence for property and page at-rules is parser/source bounded and separate from browser proof' },
  { id: 'css-modules/use-site-graph-proof', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-css-modules-use-sites', note: 'CSS Module use-site graph proof is a distinct project graph row and does not absorb transform proof gaps' },
  { id: 'css-modules/generated-class-name-map-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-contract-proofs', note: 'CSS Module generated class-name maps are proof-gated transform evidence and fail closed when absent' },
  { id: 'css-modules/bundler-transform-identity-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-contract-proofs', note: 'CSS Module bundler transform identity is proof-gated transform evidence and fail closed when absent' },
  { id: 'css-modules/source-map-identity-proof', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-css-modules-contract-proofs', note: 'CSS Module source-map identity is proof-gated transform evidence and fail closed when absent' },
  { id: 'html-css/browser-runtime-proof-bounded', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML/CSS browser runtime proof remains explicit bounded evidence and is missing by default without a proof bundle' }
];
assert.equal(matrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of matrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['baseline', 'bounded-evidence', 'partial'].includes(cell.support), true, `${cell.id}: support`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}

const oracleHtmlCssProject = safeMergeJsTsProject({
  id: 'oracle_project_html_css_matrix_rows',
  baseFiles: {
    'src/view.html': '<main id="app"><h1>Todo</h1><button data-frontier-key="save" type="button">Save</button></main>\n',
    'src/button.css': '.button { color: red; padding: 1rem; }\n'
  },
  workerFiles: {
    'src/view.html': '<main id="app"><h1>Todos</h1><button data-frontier-key="save" type="button">Save</button></main>\n',
    'src/button.css': '.button { color: blue; padding: 1rem; }\n'
  },
  headFiles: {
    'src/view.html': '<main id="app"><h1>Todo</h1><button data-frontier-key="save" type="button" aria-label="Save item">Save</button></main>\n',
    'src/button.css': '.button { color: red; padding: 1rem; background-color: white; }\n'
  }
});
assert.equal(oracleHtmlCssProject.status, 'merged');
assert.equal(oracleHtmlCssProject.summary.htmlFiles, 1);
assert.equal(oracleHtmlCssProject.summary.cssFiles, 1);
assert.equal(oracleHtmlCssProject.summary.htmlCssMergedFiles, 2);
assert.equal(oracleHtmlCssProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(oracleHtmlCssProject.summary.cssParserEvidenceFiles, 1);
assert.equal(oracleHtmlCssProject.summary.htmlIdentityEvidenceFiles, 1);
assert.equal(oracleHtmlCssProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(oracleHtmlCssProject.summary.htmlCssBrowserRuntimeProofs, 0);
assertSurface(oracleHtmlCssProject, 'html-parser-source-evidence', 'bounded-evidence', 'html-parser-source-evidence', 'passed');
assertSurface(oracleHtmlCssProject, 'css-parser-source-evidence', 'bounded-evidence', 'css-parser-source-evidence', 'passed');
assertSurface(oracleHtmlCssProject, 'html-identity-evidence', 'bounded-evidence', 'html-identity-evidence', 'passed');
assertSurface(oracleHtmlCssProject, 'css-selector-target-evidence', 'bounded-evidence', 'css-selector-target-evidence', 'passed');
assertSurface(oracleHtmlCssProject, 'html-structural-merge-admission', 'partial', 'html-structural-merge', 'passed');
assertSurface(oracleHtmlCssProject, 'css-cascade-merge-admission', 'partial', 'css-cascade-merge', 'passed');
assertSurface(oracleHtmlCssProject, 'css-dependency-graph-evidence', 'bounded-evidence', 'css-dependency-graph', 'absent');
assertSurface(oracleHtmlCssProject, 'css-runtime-descriptor-evidence', 'bounded-evidence', 'css-runtime-descriptor-evidence', 'absent');
const oracleBrowserSurface = assertSurface(oracleHtmlCssProject, 'html-css-browser-runtime-proof', 'bounded-evidence', 'browser-runtime-proof', 'missing');
assert.equal(oracleBrowserSurface.missingRouteIds.includes('prove-html-css-browser-runtime'), true);
const oracleBrowserMissingEvidence = oracleHtmlCssProject.confidence.missingEvidence.find((item) => item.code === 'html-css-browser-runtime-proof-not-available');
assert.ok(oracleBrowserMissingEvidence, 'missing browser runtime proof evidence item');
assert.equal(oracleBrowserMissingEvidence.routeNext, 'produce-playwright-assertion-runtime-proof-bundle');
assert.match(oracleBrowserMissingEvidence.summary, /runFrontierPlaywrightAssertionRuntimeProof/);
assert.equal(oracleBrowserMissingEvidence.suggestedInput.playwrightAssertionRuntimeProof, true);
assert.equal(oracleBrowserMissingEvidence.suggestedInput.proofBuilderInput, true);
assert.equal(oracleHtmlCssProject.admission.semanticEquivalenceClaim, false);

const cssModuleSourcePath = 'src/Button.module.css';
const cssModuleSpecifier = './Button.module' + '.css';
const cssModuleSourceText = '.root { color: red; }\n';
const cssModuleButtonSourceText = [
  `import styles from '${cssModuleSpecifier}';`,
  'export function Button() { return <button className={styles.root} />; }',
  ''
].join('\n');
const cssModuleBoundaryProject = safeMergeJsTsProject({
  id: 'oracle_project_css_module_matrix_proof_boundaries',
  includeOutputProjectSymbolGraph: true,
  files: [
    { language: 'css', sourcePath: cssModuleSourcePath, headSourceText: cssModuleSourceText },
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      baseSourceText: cssModuleButtonSourceText,
      workerSourceText: cssModuleButtonSourceText,
      headSourceText: cssModuleButtonSourceText
    }
  ]
});
assert.equal(cssModuleBoundaryProject.status, 'blocked');
assert.equal(cssModuleBoundaryProject.summary.projectGraphCssModuleUseSiteProofBlockers, 0);
assert.equal(cssModuleBoundaryProject.summary.projectGraphCssModuleGeneratedClassNameMapBlockers, 1);
assert.equal(cssModuleBoundaryProject.summary.projectGraphCssModuleBundlerTransformIdentityBlockers, 1);
assert.equal(cssModuleBoundaryProject.summary.projectGraphCssModuleSourceMapIdentityBlockers, 1);
const cssModuleUseSiteSurface = assertSurface(cssModuleBoundaryProject, 'css-modules-use-site-graph', 'partial', 'css-module-use-site-graph', 'passed');
assert.equal(cssModuleUseSiteSurface.missingRouteIds.includes('prove-css-module-use-site-graph'), false);
assert.equal(cssModuleUseSiteSurface.missingRouteIds.includes('prove-css-module-generated-class-name-map'), false);
const generatedClassNameMapSurface = assertSurface(cssModuleBoundaryProject, 'css-modules-generated-class-name-map', 'bounded-evidence', 'css-module-generated-class-name-map', 'failed');
const bundlerTransformIdentitySurface = assertSurface(cssModuleBoundaryProject, 'css-modules-bundler-transform-identity', 'bounded-evidence', 'css-module-bundler-transform-identity', 'failed');
const sourceMapIdentitySurface = assertSurface(cssModuleBoundaryProject, 'css-modules-source-map-identity', 'bounded-evidence', 'css-module-source-map-identity', 'failed');
assert.equal(generatedClassNameMapSurface.missingRouteIds.includes('prove-css-module-generated-class-name-map'), true);
assert.equal(bundlerTransformIdentitySurface.missingRouteIds.includes('prove-css-module-bundler-transform-identity'), true);
assert.equal(sourceMapIdentitySurface.missingRouteIds.includes('prove-css-module-source-map-identity'), true);

const htmlCssSummaryFieldOracles = [
  {
    surface: 'html-parser-source-evidence',
    readmeLabel: 'HTML parser/source evidence',
    cellId: 'html-parser-source-evidence',
    support: 'bounded-evidence',
    proofLevel: 'html-parser-source-evidence',
    routeId: 'prove-html-parser-source-evidence',
    fields: ['htmlFiles', 'htmlParserEvidenceFiles', 'htmlParserEvidenceFailedFiles'],
    expectedProofStatus: (summary) => summary.htmlFiles ? (summary.htmlParserEvidenceFailedFiles ? 'failed' : summary.htmlParserEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlFiles && summary.htmlParserEvidenceFiles !== summary.htmlFiles)
  },
  {
    surface: 'css-parser-source-evidence',
    readmeLabel: 'CSS parser/source evidence',
    cellId: 'css-parser-source-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-parser-source-evidence',
    routeId: 'prove-css-parser-source-evidence',
    fields: ['cssFiles', 'cssParserEvidenceFiles', 'cssParserEvidenceFailedFiles'],
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssParserEvidenceFailedFiles ? 'failed' : summary.cssParserEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssFiles && summary.cssParserEvidenceFiles !== summary.cssFiles)
  },
  {
    surface: 'html-identity-evidence',
    readmeLabel: 'HTML identity evidence',
    cellId: 'html-identity-evidence',
    support: 'bounded-evidence',
    proofLevel: 'html-identity-evidence',
    routeId: 'prove-html-identity-evidence',
    fields: ['htmlFiles', 'htmlIdentityEvidenceFiles', 'htmlIdentityEvidenceFailedFiles'],
    expectedProofStatus: (summary) => summary.htmlFiles ? (summary.htmlIdentityEvidenceFailedFiles ? 'failed' : summary.htmlIdentityEvidenceFiles === summary.htmlFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlFiles && summary.htmlIdentityEvidenceFiles !== summary.htmlFiles)
  },
  {
    surface: 'css-selector-target-evidence',
    readmeLabel: 'CSS selector target evidence',
    cellId: 'css-selector-target-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-selector-target-evidence',
    routeId: 'prove-css-selector-target-evidence',
    fields: ['cssFiles', 'cssSelectorTargetEvidenceFiles', 'cssSelectorTargetConflictFiles'],
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssSelectorTargetConflictFiles ? 'failed' : summary.cssSelectorTargetEvidenceFiles === summary.cssFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssFiles && (summary.cssSelectorTargetEvidenceFiles !== summary.cssFiles || summary.cssSelectorTargetConflictFiles))
  },
  {
    surface: 'html-structural-merge-admission',
    readmeLabel: 'HTML structural merge admission',
    cellId: 'html-structural-merge-admission',
    support: 'partial',
    proofLevel: 'html-structural-merge',
    routeId: 'admit-html-structural-merge',
    fields: ['htmlFiles', 'htmlMergedFiles', 'htmlBlockedFiles'],
    expectedProofStatus: (summary) => summary.htmlFiles ? (summary.htmlBlockedFiles ? 'failed' : summary.htmlMergedFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlBlockedFiles)
  },
  {
    surface: 'css-cascade-merge-admission',
    readmeLabel: 'CSS cascade merge admission',
    cellId: 'css-cascade-merge-admission',
    support: 'partial',
    proofLevel: 'css-cascade-merge',
    routeId: 'admit-css-cascade-merge',
    fields: ['cssFiles', 'cssMergedFiles', 'cssBlockedFiles'],
    expectedProofStatus: (summary) => summary.cssFiles ? (summary.cssBlockedFiles ? 'failed' : summary.cssMergedFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssBlockedFiles)
  },
  {
    surface: 'css-dependency-graph-evidence',
    readmeLabel: 'CSS dependency graph evidence',
    cellId: 'css-dependency-graph-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-dependency-graph',
    routeId: 'prove-css-dependency-graph',
    fields: ['cssDependencySurfaceFiles', 'cssDependencyGraphEvidenceFiles', 'cssDependencyGraphMissingProofFiles', 'cssDependencyGraphBlockedFiles'],
    expectedProofStatus: (summary) => summary.cssDependencySurfaceFiles ? (summary.cssDependencyGraphBlockedFiles ? 'failed' : summary.cssDependencyGraphEvidenceFiles === summary.cssDependencySurfaceFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssDependencySurfaceFiles && (summary.cssDependencyGraphEvidenceFiles !== summary.cssDependencySurfaceFiles || summary.cssDependencyGraphMissingProofFiles || summary.cssDependencyGraphBlockedFiles))
  },
  {
    surface: 'css-runtime-descriptor-evidence',
    readmeLabel: 'CSS runtime descriptor evidence',
    cellId: 'css-runtime-descriptor-evidence',
    support: 'bounded-evidence',
    proofLevel: 'css-runtime-descriptor-evidence',
    routeId: 'prove-css-runtime-descriptor-evidence',
    fields: ['cssRuntimeDescriptorFiles', 'cssRuntimeDescriptorEvidenceFiles', 'cssRuntimeDescriptorBlockedFiles'],
    expectedProofStatus: (summary) => summary.cssRuntimeDescriptorFiles ? (summary.cssRuntimeDescriptorBlockedFiles ? 'failed' : summary.cssRuntimeDescriptorEvidenceFiles === summary.cssRuntimeDescriptorFiles ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.cssRuntimeDescriptorFiles && (summary.cssRuntimeDescriptorEvidenceFiles !== summary.cssRuntimeDescriptorFiles || summary.cssRuntimeDescriptorBlockedFiles))
  },
  {
    surface: 'html-css-browser-runtime-proof',
    readmeLabel: 'HTML/CSS browser runtime proof',
    cellId: 'browser-runtime-proof-bounded',
    support: 'bounded-evidence',
    proofLevel: 'browser-runtime-proof',
    routeId: 'prove-html-css-browser-runtime',
    fields: ['htmlCssFiles', 'htmlCssMergedFiles', 'htmlCssBrowserRuntimeProofs'],
    expectedProofStatus: (summary) => summary.htmlCssFiles ? (summary.htmlCssBrowserRuntimeProofs ? 'passed' : 'missing') : 'absent',
    expectedMissingRoute: (summary) => Boolean(summary.htmlCssMergedFiles && !summary.htmlCssBrowserRuntimeProofs)
  }
];

assertReadmeHtmlCssMatrixRows();
assertHtmlCssSummaryBackedMatrix(oracleHtmlCssProject);

function assertSurface(project, surface, status, proofLevel, proofStatus) {
  const record = projectMatrixSurface(project, surface);
  assert.equal(record.status, status);
  assert.equal(record.proofStatuses[proofLevel], proofStatus);
  return record;
}

function projectMatrixSurface(project, surface) {
  const record = project.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}

function assertHtmlCssSummaryBackedMatrix(project) {
  assert.ok(project.summary, `${project.id}: missing project summary`);
  assert.ok(project.confidence?.admissionMatrixAudit, `${project.id}: missing admission matrix audit`);
  for (const oracle of htmlCssSummaryFieldOracles) {
    for (const field of oracle.fields) {
      assert.equal(Object.prototype.hasOwnProperty.call(project.summary, field), true, `${oracle.surface}: summary missing ${field}`);
    }
    const record = projectMatrixSurface(project, oracle.surface);
    const expectedProofStatus = oracle.expectedProofStatus(project.summary);
    assert.equal(record.status, oracle.support, `${oracle.surface}: support status`);
    assert.deepEqual(record.proofLevels, [oracle.proofLevel], `${oracle.surface}: proof levels`);
    assert.equal(record.routeIds.includes(oracle.routeId), true, `${oracle.surface}: route id`);
    assert.equal(record.proofStatuses[oracle.proofLevel], expectedProofStatus, `${oracle.surface}: summary-backed proof status`);
    assert.equal(htmlCssProjectMergeMatrixProofStatus(oracle.proofLevel, project.summary), expectedProofStatus, `${oracle.surface}: status helper`);
    assert.equal(record.missingRouteIds.includes(oracle.routeId), oracle.expectedMissingRoute(project.summary), `${oracle.surface}: summary-backed missing route`);
  }
}

function assertReadmeHtmlCssMatrixRows() {
  const readmeRows = readReadmeMatrixRows();
  const forbiddenBroadClaim = /\b(?:full|complete|unbounded|guaranteed)\s+(?:browser|render|cascade|runtime)\s+equivalence\b/i;
  for (const oracle of htmlCssSummaryFieldOracles) {
    const staticCell = matrixCells.find((cell) => cell.id === `html-css/${oracle.cellId}`);
    assert.ok(staticCell, `missing static matrix cell ${oracle.cellId}`);
    assert.equal(staticCell.support, oracle.support, `${oracle.cellId}: static support`);
    assert.equal(staticCell.evidence, 'js-ts-safe-project-merge-html-css', `${oracle.cellId}: static evidence`);

    const readmeRow = readmeRows.get(oracle.readmeLabel);
    assert.ok(readmeRow, `README missing ${oracle.readmeLabel}`);
    assert.equal(readmeRow.status, oracle.support, `${oracle.readmeLabel}: README status`);
    assert.equal(readmeRow.evidence.includes(oracle.proofLevel), true, `${oracle.readmeLabel}: README proof level`);
    assert.equal(forbiddenBroadClaim.test(readmeRow.evidence), false, `${oracle.readmeLabel}: README broad equivalence claim`);
  }
  const browserRow = readmeRows.get('HTML/CSS browser runtime proof');
  assert.match(browserRow.evidence, /browser\/render\/cascade equivalence claims false unless a bounded browser proof bundle is attached/);
  assert.match(browserRow.evidence, /Missing proof routes to `prove-html-css-browser-runtime`/);
}

function readReadmeMatrixRows() {
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  const rows = new Map();
  for (const line of readme.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    if (cells.length < 3) continue;
    const [surface, status, ...evidenceParts] = cells.map((cell) => cell.trim());
    if (surface === 'Surface' || surface === '---') continue;
    rows.set(surface, { status, evidence: evidenceParts.join('|').trim() });
  }
  return rows;
}
