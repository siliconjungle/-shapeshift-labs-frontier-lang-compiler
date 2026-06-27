import { assert } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import { safeMergeJsTsProject } from '../../src/index.js';
import {
  HtmlCssProjectMergeMissingSignals,
  htmlCssProjectMergeAdmissionMatrixRows,
  htmlCssProjectMergeMatrixProofStatus,
  htmlCssProjectMergeMissingEvidenceItems,
  htmlCssProjectMergeMissingEvidenceRoutes
} from '../../src/js-ts-safe-project-merge-html-css-matrix.js';
import { htmlCssSummaryFieldOracles, matrixCells } from './html-css-admission-matrix-fixtures.mjs';

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

assertReadmeHtmlCssMatrixRows();
assertHtmlCssMatrixModuleRowsAndRoutes();
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

function assertHtmlCssMatrixModuleRowsAndRoutes() {
  const rows = htmlCssProjectMergeAdmissionMatrixRows(
    (surface, status, proofLevels, signals) => ({ surface, status, proofLevels, signals }),
    HtmlCssProjectMergeMissingSignals
  );
  const routes = htmlCssProjectMergeMissingEvidenceRoutes(
    (id, lane, next) => ({ id, lane, next }),
    HtmlCssProjectMergeMissingSignals
  );
  const rowsBySurface = new Map(rows.map((row) => [row.surface, row]));
  assert.equal(rows.length, htmlCssSummaryFieldOracles.length, 'HTML/CSS matrix row count');
  assert.equal(Object.keys(routes).length, htmlCssSummaryFieldOracles.length, 'HTML/CSS missing route count');

  for (const oracle of htmlCssSummaryFieldOracles) {
    const row = rowsBySurface.get(oracle.surface);
    assert.ok(row, `matrix missing ${oracle.surface}`);
    assert.equal(row.status, oracle.support, `${oracle.surface}: matrix support`);
    assert.deepEqual(row.proofLevels, [oracle.proofLevel], `${oracle.surface}: matrix proof level`);
    assert.deepEqual(row.signals, [oracle.signal], `${oracle.surface}: matrix signal`);

    const route = routes[oracle.signal];
    assert.ok(route, `${oracle.surface}: missing route for signal`);
    assert.equal(route.id, oracle.routeId, `${oracle.surface}: route id`);
    assert.equal(route.lane, oracle.routeLane, `${oracle.surface}: route lane`);
    assert.equal(route.next, oracle.routeNext, `${oracle.surface}: route next`);

    const missingItems = htmlCssProjectMergeMissingEvidenceItems(
      oracle.missingSummary,
      HtmlCssProjectMergeMissingSignals,
      (input) => ({ ...input, route: routes[input.code], routeId: routes[input.code]?.id, routeLane: routes[input.code]?.lane, routeNext: routes[input.code]?.next })
    );
    const missingItem = missingItems.find((item) => item.code === oracle.signal);
    assert.ok(missingItem, `${oracle.surface}: missing synthetic evidence record`);
    assert.equal(missingItem.proofLevel, oracle.proofLevel, `${oracle.surface}: missing evidence proof level`);
    assert.equal(missingItem.scope, oracle.routeLane, `${oracle.surface}: missing evidence scope`);
    assert.equal(missingItem.routeId, oracle.routeId, `${oracle.surface}: missing evidence route id`);
    assert.equal(missingItem.routeNext, oracle.routeNext, `${oracle.surface}: missing evidence route next`);
    assert.equal(htmlCssProjectMergeMatrixProofStatus(oracle.proofLevel, oracle.missingSummary), oracle.expectedProofStatus(oracle.missingSummary), `${oracle.surface}: synthetic proof status`);
    assert.equal(Boolean(missingItem), oracle.expectedMissingRoute(oracle.missingSummary), `${oracle.surface}: synthetic missing route`);
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
