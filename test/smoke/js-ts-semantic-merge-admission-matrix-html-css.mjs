import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const matrixCells = [
  { id: 'source-text-merge/baseline-candidate-recorded', status: 'done', support: 'baseline', evidence: 'js-ts-project-source-text-merge-candidate', note: 'project admission records the conservative concrete source merge candidate as the baseline reviewed by semantic proof surfaces' },
  { id: 'html-css/html-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML parser/source evidence is parse5/source-span bounded and does not imply browser DOM or render equivalence' },
  { id: 'html-css/css-parser-source-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS parser/source evidence is PostCSS/source-span bounded and does not imply cascade or browser equivalence' },
  { id: 'html-css/html-identity-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML identity evidence records explicit/path identity and duplicate identity blockers before structural admission' },
  { id: 'html-css/css-selector-target-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS selector target evidence records target/specificity/rebase proof status before cascade admission' },
  { id: 'html-css/html-structural-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'HTML structural merges require parser-backed identity evidence and keep runtime/browser proof as a separate row' },
  { id: 'html-css/css-cascade-merge-admission', status: 'done', support: 'partial', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS cascade merges require selector target, specificity, scoped cascade, and dependency evidence before admission' },
  { id: 'html-css/css-dependency-graph-evidence', status: 'done', support: 'bounded-evidence', evidence: 'js-ts-safe-project-merge-html-css', note: 'CSS dependency graph evidence is absent until custom property, animation, font, and asset dependency surfaces require it' },
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
    'src/view.html': '<main id="app"><h1>Todo</h1><button data-frontier-key="save" type="button" disabled>Save</button></main>\n',
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
const oracleBrowserSurface = assertSurface(oracleHtmlCssProject, 'html-css-browser-runtime-proof', 'bounded-evidence', 'browser-runtime-proof', 'missing');
assert.equal(oracleBrowserSurface.missingRouteIds.includes('prove-html-css-browser-runtime'), true);
assert.equal(oracleHtmlCssProject.admission.semanticEquivalenceClaim, false);

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
