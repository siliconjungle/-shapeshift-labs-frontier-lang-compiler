import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { matrixSurface } from './html-css-merge-test-helpers.mjs';

const htmlBase = [
  '<main id="app">',
  '  <h1>Todo</h1>',
  '  <button data-frontier-key="save" type="button">Save</button>',
  '</main>',
  ''
].join('\n');
const htmlWorker = htmlBase.replace('Todo</h1>', 'Todos</h1>');
const htmlHead = htmlBase.replace('type="button"', 'type="button" aria-label="Save item"');
const cssBase = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '}',
  ''
].join('\n');
const cssWorker = cssBase.replace('color: red', 'color: blue');
const cssHead = [
  '.button {',
  '  color: red;',
  '  padding: 1rem;',
  '  background-color: white;',
  '}',
  ''
].join('\n');

const mixedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_css',
  baseFiles: {
    'src/view.html': htmlBase,
    'src/button.css': cssBase
  },
  workerFiles: {
    'src/view.html': htmlWorker,
    'src/button.css': cssWorker
  },
  headFiles: {
    'src/view.html': htmlHead,
    'src/button.css': cssHead
  }
});
assert.equal(mixedProject.status, 'merged');
assert.equal(mixedProject.summary.htmlFiles, 1);
assert.equal(mixedProject.summary.cssFiles, 1);
assert.equal(mixedProject.summary.htmlCssFiles, 2);
assert.equal(mixedProject.summary.htmlMergedFiles, 1);
assert.equal(mixedProject.summary.cssMergedFiles, 1);
assert.equal(mixedProject.summary.htmlCssMergedFiles, 2);
assert.equal(mixedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlCssParserEvidenceFiles, 2);
assert.equal(mixedProject.summary.htmlIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlExplicitIdentityEvidenceFiles, 1);
assert.equal(mixedProject.summary.htmlPathOnlyIdentityResidualFiles, 1);
assert.equal(mixedProject.summary.htmlDuplicateIdentityEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlDuplicateIdentityKeys, 0);
assert.equal(mixedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlFrameworkBoundaryEvidenceFiles, 0);
assert.equal(mixedProject.summary.htmlProofGapBlockedFiles, 0);
assert.equal(mixedProject.summary.cssSelectorTargetEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssSelectorTargetGraphEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssSelectorSpecificityEvidenceFiles, 1);
assert.equal(mixedProject.summary.cssSelectorTargetMoveFiles, 0);
assert.equal(mixedProject.summary.htmlCssStructuralTargetEvidenceFiles, 2);
assert.equal(mixedProject.summary.cssScopedCascadeFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssScopedCascadeBlockedFiles, 0);
assert.equal(mixedProject.summary.cssDependencySurfaceFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphEvidenceFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphMissingProofFiles, 0);
assert.equal(mixedProject.summary.cssDependencyGraphBlockedFiles, 0);
assert.equal(mixedProject.summary.htmlCssBrowserRuntimeProofs, 0);
const outputByPath = new Map(mixedProject.outputFiles.map((file) => [file.sourcePath, file]));
assert.equal(outputByPath.get('src/view.html').language, 'html');
assert.equal(outputByPath.get('src/view.html').operation, 'merged-html-source');
assert.match(outputByPath.get('src/view.html').sourceText, /<h1>Todos<\/h1>/);
assert.match(outputByPath.get('src/view.html').sourceText, /aria-label="Save item"/);
assert.equal(outputByPath.get('src/button.css').language, 'css');
assert.equal(outputByPath.get('src/button.css').operation, 'merged-css-source');
assert.match(outputByPath.get('src/button.css').sourceText, /color: blue/);
assert.match(outputByPath.get('src/button.css').sourceText, /background-color: white/);
assert.equal(matrixSurface(mixedProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-cascade-merge-admission').proofStatuses['css-cascade-merge'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-parser-source-evidence').proofStatuses['html-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-parser-source-evidence').proofStatuses['css-parser-source-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'html-identity-evidence').proofStatuses['html-identity-evidence'], 'passed');
assert.equal(matrixSurface(mixedProject, 'css-selector-target-evidence').proofStatuses['css-selector-target-evidence'], 'passed');
const browserSurface = matrixSurface(mixedProject, 'html-css-browser-runtime-proof');
assert.equal(browserSurface.proofStatuses['browser-runtime-proof'], 'missing');
assert.equal(browserSurface.missingRouteIds.includes('prove-html-css-browser-runtime'), true);

const htmlClassTokenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_class_tokens',
  files: [{
    sourcePath: 'src/panel.html',
    baseSourceText: '<div data-frontier-key="panel" class="card selected muted">Panel</div>\n',
    workerSourceText: '<div data-frontier-key="panel" class="card muted">Panel</div>\n',
    headSourceText: '<div data-frontier-key="panel" class="card selected muted compact">Panel</div>\n'
  }]
});
assert.equal(htmlClassTokenProject.status, 'merged');
assert.equal(htmlClassTokenProject.summary.htmlClassTokenMergeFiles, 1);
assert.equal(htmlClassTokenProject.summary.htmlClassTokenMergeEvidenceRecords, 1);
assert.equal(htmlClassTokenProject.summary.htmlTokenListMergeFiles, 1);
assert.equal(htmlClassTokenProject.summary.htmlTokenListMergeEvidenceRecords, 1);
assert.match(htmlClassTokenProject.outputFiles[0].sourceText, /class="card muted compact"/);
assert.deepEqual(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].workerRemovedTokens, ['selected']);
assert.equal(htmlClassTokenProject.files[0].result.htmlTokenListMergeEvidence[0].attributeName, 'class');
assert.deepEqual(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].headAddedTokens, ['compact']);
assert.equal(htmlClassTokenProject.files[0].result.htmlClassTokenMergeEvidence[0].browserRenderEquivalenceClaim, false);
assert.equal(matrixSurface(htmlClassTokenProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlPartTokenProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_part_tokens',
  files: [{
    sourcePath: 'src/panel.html',
    baseSourceText: '<div data-frontier-key="panel" part="card">Panel</div>\n',
    workerSourceText: '<div data-frontier-key="panel" part="card toolbar">Panel</div>\n',
    headSourceText: '<div data-frontier-key="panel" part="card compact">Panel</div>\n'
  }]
});
assert.equal(htmlPartTokenProject.status, 'merged');
assert.equal(htmlPartTokenProject.summary.htmlClassTokenMergeFiles, 0);
assert.equal(htmlPartTokenProject.summary.htmlClassTokenMergeEvidenceRecords, 0);
assert.equal(htmlPartTokenProject.summary.htmlTokenListMergeFiles, 1);
assert.equal(htmlPartTokenProject.summary.htmlTokenListMergeEvidenceRecords, 1);
assert.match(htmlPartTokenProject.outputFiles[0].sourceText, /part="card compact toolbar"/);
assert.equal(htmlPartTokenProject.files[0].result.htmlTokenListMergeEvidence[0].kind, 'frontier.lang.htmlTokenListMergeEvidence');
assert.equal(htmlPartTokenProject.files[0].result.htmlTokenListMergeEvidence[0].attributeName, 'part');
assert.deepEqual(htmlPartTokenProject.files[0].result.htmlTokenListMergeEvidence[0].workerAddedTokens, ['toolbar']);
assert.deepEqual(htmlPartTokenProject.files[0].result.htmlTokenListMergeEvidence[0].headAddedTokens, ['compact']);
assert.equal(htmlPartTokenProject.files[0].result.htmlTokenListMergeEvidence[0].browserRenderEquivalenceClaim, false);
assert.equal(matrixSurface(htmlPartTokenProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlUnkeyedAddBase = [
  '<section data-frontier-key="todo-root">',
  '  <ul id="todos">',
  '    <li>A</li>',
  '  </ul>',
  '</section>',
  ''
].join('\n');
const htmlUnkeyedAddProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_unkeyed_structural_add',
  files: [{
    sourcePath: 'src/todos.html',
    baseSourceText: htmlUnkeyedAddBase,
    workerSourceText: htmlUnkeyedAddBase.replace('    <li>A</li>\n', '    <li>A</li>\n    <li>B</li>\n'),
    headSourceText: htmlUnkeyedAddBase.replace('<ul id="todos">', '<ul id="todos" class="todo-list">')
  }]
});
assert.equal(htmlUnkeyedAddProject.status, 'merged');
assert.equal(htmlUnkeyedAddProject.summary.htmlUnkeyedStructuralAddFiles, 1);
assert.equal(htmlUnkeyedAddProject.summary.htmlUnkeyedStructuralAddEvidenceRecords, 1);
assert.match(htmlUnkeyedAddProject.outputFiles[0].sourceText, /<ul id="todos" class="todo-list">/);
assert.match(htmlUnkeyedAddProject.outputFiles[0].sourceText, /<li>B<\/li>/);
assert.equal(htmlUnkeyedAddProject.files[0].result.htmlUnkeyedStructuralAddEvidence[0].kind, 'frontier.lang.htmlUnkeyedStructuralAddEvidence');
assert.equal(htmlUnkeyedAddProject.files[0].result.htmlUnkeyedStructuralAddEvidence[0].parentExplicitIdentity, true);
assert.equal(htmlUnkeyedAddProject.files[0].result.htmlUnkeyedStructuralAddEvidence[0].addOnly, true);
assert.equal(htmlUnkeyedAddProject.files[0].result.htmlUnkeyedStructuralAddEvidence[0].autoMergeClaim, false);
assert.equal(htmlUnkeyedAddProject.files[0].result.htmlUnkeyedStructuralAddEvidence[0].semanticEquivalenceClaim, false);
assert.equal(matrixSurface(htmlUnkeyedAddProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlUnkeyedDeleteBase = [
  '<section data-frontier-key="todo-root">',
  '  <ul id="todos">',
  '    <li>A</li>',
  '    <li>B</li>',
  '  </ul>',
  '</section>',
  ''
].join('\n');
const htmlUnkeyedDeleteProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_unkeyed_structural_delete',
  files: [{
    sourcePath: 'src/todos.html',
    baseSourceText: htmlUnkeyedDeleteBase,
    workerSourceText: htmlUnkeyedDeleteBase.replace('    <li>B</li>\n', ''),
    headSourceText: htmlUnkeyedDeleteBase.replace('<ul id="todos">', '<ul id="todos" class="todo-list">')
  }]
});
assert.equal(htmlUnkeyedDeleteProject.status, 'merged');
assert.equal(htmlUnkeyedDeleteProject.summary.htmlUnkeyedStructuralDeleteFiles, 1);
assert.equal(htmlUnkeyedDeleteProject.summary.htmlUnkeyedStructuralDeleteEvidenceRecords, 1);
assert.match(htmlUnkeyedDeleteProject.outputFiles[0].sourceText, /<ul id="todos" class="todo-list">/);
assert.doesNotMatch(htmlUnkeyedDeleteProject.outputFiles[0].sourceText, /<li>B<\/li>/);
assert.equal(htmlUnkeyedDeleteProject.files[0].result.htmlUnkeyedStructuralDeleteEvidence[0].kind, 'frontier.lang.htmlUnkeyedStructuralDeleteEvidence');
assert.equal(htmlUnkeyedDeleteProject.files[0].result.htmlUnkeyedStructuralDeleteEvidence[0].parentExplicitIdentity, true);
assert.equal(htmlUnkeyedDeleteProject.files[0].result.htmlUnkeyedStructuralDeleteEvidence[0].deleteOnly, true);
assert.equal(htmlUnkeyedDeleteProject.files[0].result.htmlUnkeyedStructuralDeleteEvidence[0].autoMergeClaim, false);
assert.equal(htmlUnkeyedDeleteProject.files[0].result.htmlUnkeyedStructuralDeleteEvidence[0].semanticEquivalenceClaim, false);
assert.equal(matrixSurface(htmlUnkeyedDeleteProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlUnkeyedMoveBase = [
  '<section data-frontier-key="todo-root">',
  '  <ul id="todos">',
  '    <li data-frontier-key="a">A</li>',
  '    <li>Loose</li>',
  '    <li data-frontier-key="b">B</li>',
  '  </ul>',
  '</section>',
  ''
].join('\n');
const htmlUnkeyedMoveProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_unkeyed_structural_move',
  files: [{
    sourcePath: 'src/todos.html',
    baseSourceText: htmlUnkeyedMoveBase,
    workerSourceText: htmlUnkeyedMoveBase.replace('    <li>Loose</li>\n    <li data-frontier-key="b">B</li>', '    <li data-frontier-key="b">B</li>\n    <li>Loose</li>'),
    headSourceText: htmlUnkeyedMoveBase.replace('<ul id="todos">', '<ul id="todos" class="todo-list">')
  }]
});
assert.equal(htmlUnkeyedMoveProject.status, 'merged');
assert.equal(htmlUnkeyedMoveProject.summary.htmlUnkeyedStructuralMoveFiles, 1);
assert.equal(htmlUnkeyedMoveProject.summary.htmlUnkeyedStructuralMoveEvidenceRecords, 1);
assert.match(htmlUnkeyedMoveProject.outputFiles[0].sourceText, /<ul id="todos" class="todo-list">/);
assert.match(htmlUnkeyedMoveProject.outputFiles[0].sourceText, /data-frontier-key="b">B<\/li>\n    <li>Loose<\/li>/);
assert.equal(htmlUnkeyedMoveProject.files[0].result.htmlUnkeyedStructuralMoveEvidence[0].kind, 'frontier.lang.htmlUnkeyedStructuralMoveEvidence');
assert.equal(htmlUnkeyedMoveProject.files[0].result.htmlUnkeyedStructuralMoveEvidence[0].parentExplicitIdentity, true);
assert.equal(htmlUnkeyedMoveProject.files[0].result.htmlUnkeyedStructuralMoveEvidence[0].moveOnly, true);
assert.equal(htmlUnkeyedMoveProject.files[0].result.htmlUnkeyedStructuralMoveEvidence[0].keyedSiblingAnchor, true);
assert.equal(htmlUnkeyedMoveProject.files[0].result.htmlUnkeyedStructuralMoveEvidence[0].semanticEquivalenceClaim, false);
assert.equal(matrixSurface(htmlUnkeyedMoveProject, 'html-structural-merge-admission').proofStatuses['html-structural-merge'], 'passed');

const htmlDuplicateIdentityBase = [
  '<main id="app">',
  '  <button data-frontier-key="dup">A</button>',
  '  <button data-frontier-key="dup">B</button>',
  '</main>',
  ''
].join('\n');
const htmlDuplicateIdentityProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_duplicate_identity',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: htmlDuplicateIdentityBase,
    workerSourceText: htmlDuplicateIdentityBase.replace('A</button>', 'Save</button>'),
    headSourceText: htmlDuplicateIdentityBase.replace('id="app"', 'id="app" class="shell"')
  }]
});
assert.equal(htmlDuplicateIdentityProject.status, 'blocked');
assert.equal(htmlDuplicateIdentityProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlIdentityEvidenceFiles, 0);
assert.equal(htmlDuplicateIdentityProject.summary.htmlIdentityEvidenceFailedFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlDuplicateIdentityEvidenceFiles, 1);
assert.equal(htmlDuplicateIdentityProject.summary.htmlDuplicateIdentityKeys, 3);
assert.equal(htmlDuplicateIdentityProject.conflicts.some((conflict) => conflict.code === 'html-duplicate-explicit-identity'), true);
assert.equal(htmlDuplicateIdentityProject.conflicts.some((conflict) => conflict.details.reasonCode === 'html-duplicate-explicit-identity'), true);
const htmlDuplicateIdentitySurface = matrixSurface(htmlDuplicateIdentityProject, 'html-identity-evidence');
assert.equal(htmlDuplicateIdentitySurface.proofStatuses['html-identity-evidence'], 'failed');
assert.equal(htmlDuplicateIdentitySurface.missingRouteIds.includes('prove-html-identity-evidence'), true);

const htmlBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_html_runtime_block',
  files: [{
    sourcePath: 'src/view.html',
    baseSourceText: '<script>window.value = 1;</script>\n',
    workerSourceText: '<script>window.value = 2;</script>\n',
    headSourceText: '<script>window.value = 1;</script>\n'
  }]
});
assert.equal(htmlBlockedProject.status, 'blocked');
assert.equal(htmlBlockedProject.summary.htmlBlockedFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlParserEvidenceFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlExplicitIdentityEvidenceFiles, 0);
assert.equal(htmlBlockedProject.summary.htmlRuntimeBoundaryEvidenceFiles, 1);
assert.equal(htmlBlockedProject.summary.htmlProofGapBlockedFiles, 1);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.code === 'html-proof-gap-blocked'), true);
assert.equal(htmlBlockedProject.conflicts.some((conflict) => conflict.details.reasonCode === 'script-runtime-boundary'), true);
assert.equal(typeof htmlBlockedProject.files[0].baseHash, 'string');
assert.equal(typeof htmlBlockedProject.files[0].workerHash, 'string');
assert.equal(typeof htmlBlockedProject.files[0].headHash, 'string');
const htmlBlockedSurface = matrixSurface(htmlBlockedProject, 'html-structural-merge-admission');
assert.equal(htmlBlockedSurface.proofStatuses['html-structural-merge'], 'failed');
assert.equal(htmlBlockedSurface.missingRouteIds.includes('admit-html-structural-merge'), true);

const cssBlockedProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_conflict',
  files: [{
    sourcePath: 'src/button.css',
    baseSourceText: cssBase,
    workerSourceText: cssWorker,
    headSourceText: cssBase.replace('color: red', 'color: green')
  }]
});
assert.equal(cssBlockedProject.status, 'blocked');
assert.equal(cssBlockedProject.summary.cssBlockedFiles, 1);
assert.equal(cssBlockedProject.summary.cssParserEvidenceFiles, 1);
assert.equal(cssBlockedProject.conflicts.some((conflict) => conflict.code === 'css-cascade-declaration-conflict'), true);
assert.equal(typeof cssBlockedProject.files[0].baseHash, 'string');
assert.equal(typeof cssBlockedProject.files[0].workerHash, 'string');
assert.equal(typeof cssBlockedProject.files[0].headHash, 'string');
const cssBlockedSurface = matrixSurface(cssBlockedProject, 'css-cascade-merge-admission');
assert.equal(cssBlockedSurface.proofStatuses['css-cascade-merge'], 'failed');
assert.equal(cssBlockedSurface.missingRouteIds.includes('admit-css-cascade-merge'), true);
