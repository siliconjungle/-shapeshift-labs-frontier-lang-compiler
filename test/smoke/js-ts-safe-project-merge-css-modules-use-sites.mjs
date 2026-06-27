import { assert } from './helpers.mjs';
import { importNativeProject, importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';

const cssModuleSpecifier = './Button.module.css';
const buttonSourceText = [
  `import styles from '${cssModuleSpecifier}';`,
  'export function Button({ state }) {',
  '  const { root: rootClass } = styles;',
  "  const activeClass = styles['active'];",
  '  const dynamicClass = styles[state.kind];',
  "  styles.mutated = 'nope';",
  '  return <>',
  '    <button className={styles.root}>{styles.label}</button>',
  "    <span className={cx(styles.root, state.ready && styles.active, styles['label'])} />",
  '    <em className={styles?.label} />',
  "    <strong className={styles['active']} />",
  '    <i className="root" />',
  '    {rootClass}{activeClass}{dynamicClass}',
  '  </>;',
  '}',
  ''
].join('\n');
const cssModuleSourceText = [
  '.root { color: red; }',
  '.label { display: block; }',
  '.active { color: blue; }',
  ''
].join('\n');
const missingCssModuleSpecifier = './MissingButton.module.css';
const missingButtonSourceText = [
  `import missingStyles from '${missingCssModuleSpecifier}';`,
  'export function MissingButton() { return <button className={missingStyles.root} />; }',
  ''
].join('\n');
const readyCssModuleSpecifier = './Ready.module.css';
const readyButtonSourceText = [
  `import readyStyles from '${readyCssModuleSpecifier}';`,
  'const cx = (...values) => values.filter(Boolean).join(" ");',
  'export function ReadyButton() {',
  '  return <button className={cx(readyStyles.root, readyStyles.label)}>{readyStyles.label}</button>;',
  '}',
  ''
].join('\n');
const readyCssModuleSourceText = [
  '.root { color: red; }',
  '.label { display: block; }',
  ''
].join('\n');

const project = await importNativeProject({
  language: 'mixed',
  sources: [
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      sourceText: buttonSourceText
    },
    {
      language: 'css',
      sourcePath: 'src/Button.module.css',
      sourceText: cssModuleSourceText
    }
  ]
});

const graph = project.projectSymbolGraph;
assert.equal(graph.cssModuleImportBindings.length, 1);
const binding = graph.cssModuleImportBindings[0];
assert.equal(binding.kind, 'css-module-import-binding');
assert.equal(binding.importKind, 'default');
assert.equal(binding.localName, 'styles');
assert.equal(binding.moduleSpecifier, './Button.module.css');
assert.equal(binding.resolvedModulePath, 'src/Button.module.css');
assert.equal(binding.cssModuleSourcePath, 'src/Button.module.css');
assert.equal(binding.cssModuleEvidenceStatus, 'supplied');
assert.equal(binding.cssModuleEvidenceSource, 'inferred-source');
assert.deepEqual(binding.cssModuleExportNames, ['active', 'label', 'root']);
assert.equal(typeof binding.cssModuleHash, 'string');
assert.equal(typeof binding.cssModuleExportNamesHash, 'string');
assert.equal(typeof binding.signatureHash, 'string');

const jsxRoot = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className' && record.exportName === 'root');
assert.equal(jsxRoot?.accessKind, 'dot');
assert.equal(jsxRoot.receiverLocalName, 'styles');
assert.equal(typeof jsxRoot.jsxPropRecordId, 'string');
assert.equal(typeof jsxRoot.signatureHash, 'string');

const destructuredRoot = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'destructured-binding' && record.exportName === 'root');
assert.equal(destructuredRoot?.localReferenceName, 'rootClass');
assert.equal(destructuredRoot.accessKind, 'destructure');

const staticBracket = graph.cssModuleUseSites.find((record) => record.exportName === 'active' && record.accessKind === 'static-bracket');
assert.equal(staticBracket?.expressionText, "styles['active']");

const labelRead = graph.cssModuleUseSites.find((record) => record.exportName === 'label' && record.useSiteKind === 'scope-member-read');
assert.equal(labelRead?.expressionText, 'styles.label');

const helperRoot = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className-helper' && record.exportName === 'root');
assert.equal(helperRoot?.accessKind, 'dot');
assert.equal(helperRoot.receiverLocalName, 'styles');
assert.equal(helperRoot.expressionText, 'styles.root');
assert.equal(helperRoot.conditionalRuntimePresence, undefined);
assert.equal(typeof helperRoot.jsxPropRecordId, 'string');
assert.equal(helperRoot.helperCallProofLevel, 'css-module-class-helper-source-bounded-token-graph');
assert.equal(helperRoot.helperCalleeName, 'cx');
assert.equal(helperRoot.helperCalleeRoot, 'cx');
assert.equal(helperRoot.helperCalleeSource, 'local-name-convention');
assert.equal(typeof helperRoot.helperCallGraphHash, 'string');

const helperActive = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className-helper' && record.exportName === 'active');
assert.equal(helperActive?.accessKind, 'dot');
assert.equal(helperActive.receiverLocalName, 'styles');
assert.equal(helperActive.expressionText, 'styles.active');
assert.equal(helperActive.conditionalRuntimePresence, true);
assert.equal(typeof helperActive.jsxPropRecordId, 'string');
assert.equal(helperActive.helperCallProofLevel, 'css-module-class-helper-source-bounded-token-graph');
assert.equal(helperActive.helperCallGraphHash, helperRoot.helperCallGraphHash);

const helperLabel = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className-helper' && record.exportName === 'label');
assert.equal(helperLabel?.accessKind, 'static-bracket');
assert.equal(helperLabel.receiverLocalName, 'styles');
assert.equal(helperLabel.expressionText, "styles['label']");
assert.equal(helperLabel.conditionalRuntimePresence, undefined);
assert.equal(typeof helperLabel.jsxPropRecordId, 'string');
assert.equal(helperLabel.helperCallProofLevel, 'css-module-class-helper-source-bounded-token-graph');
assert.equal(helperLabel.helperCallGraphHash, helperRoot.helperCallGraphHash);

const optionalLabel = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className' && record.exportName === 'label' && record.conditionalRuntimePresence === true);
assert.equal(optionalLabel?.accessKind, 'dot');
assert.equal(optionalLabel.receiverLocalName, 'styles');
assert.equal(optionalLabel.expressionText, 'styles?.label');
assert.equal(typeof optionalLabel.jsxPropRecordId, 'string');

const staticBracketClassName = graph.cssModuleUseSites.find((record) => record.useSiteKind === 'jsx-className' && record.exportName === 'active' && record.accessKind === 'static-bracket');
assert.equal(staticBracketClassName?.receiverLocalName, 'styles');
assert.equal(staticBracketClassName.expressionText, "styles['active']");
assert.equal(staticBracketClassName.conditionalRuntimePresence, undefined);
assert.equal(typeof staticBracketClassName.jsxPropRecordId, 'string');

const blockerReasonCodes = graph.cssModuleUseSiteBlockers.map((record) => record.reasonCode);
assert.equal(blockerReasonCodes.includes('css-module-dynamic-member-access-unproved'), true);
assert.equal(blockerReasonCodes.includes('css-module-member-write-unsupported'), true);
assert.equal(blockerReasonCodes.includes('css-module-helper-call-unproved'), false);
assert.equal(blockerReasonCodes.includes('css-module-string-literal-classname-unproved'), true);
assert.equal(blockerReasonCodes.includes('css-module-generated-class-map-unproved'), true);
assert.equal(blockerReasonCodes.includes('css-module-bundler-transform-identity-unproved'), true);
assert.equal(blockerReasonCodes.includes('css-module-source-map-proof-unproved'), true);

const dynamicBlocker = graph.cssModuleUseSiteBlockers.find((record) => record.reasonCode === 'css-module-dynamic-member-access-unproved');
assert.equal(dynamicBlocker?.failClosed, true);
assert.equal(dynamicBlocker.semanticEquivalenceClaim, false);

assert.equal(graph.cssModuleUseSiteGraphs.length, 1);
const useSiteGraph = graph.cssModuleUseSiteGraphs[0];
assert.equal(useSiteGraph.kind, 'frontier.lang.cssModuleUseSiteGraph');
assert.equal(useSiteGraph.cssModuleSourcePath, 'src/Button.module.css');
assert.equal(useSiteGraph.importBindingCount, 1);
assert.equal(useSiteGraph.useSiteCount >= 8, true);
assert.equal(useSiteGraph.blockerCount >= 7, true);
assert.equal(useSiteGraph.status, 'blocked');
assert.equal(useSiteGraph.autoMergeClaim, false);
assert.equal(useSiteGraph.semanticEquivalenceClaim, false);
assert.equal(typeof useSiteGraph.graphHash, 'string');
assert.equal(typeof useSiteGraph.cssModuleClassNameHelperGraphHash, 'string');
assert.deepEqual(useSiteGraph.cssModuleClassNameHelperProofLevels, ['css-module-class-helper-source-bounded-token-graph']);
assert.deepEqual(useSiteGraph.cssModuleClassNameHelperSources, ['local-name-convention']);

const mergeProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_modules_use_sites',
  includeOutputProjectSymbolGraph: true,
  files: [
    {
      language: 'css',
      sourcePath: 'src/Button.module.css',
      headSourceText: cssModuleSourceText
    },
    {
      language: 'tsx',
      sourcePath: 'src/Button.tsx',
      baseSourceText: buttonSourceText,
      workerSourceText: buttonSourceText,
      headSourceText: buttonSourceText
    }
  ]
});
assert.equal(mergeProject.status, 'blocked');
assert.equal(mergeProject.conflicts.some((conflict) => conflict.code === 'project-output-symbol-unresolved'), false);
const cssModuleProofConflicts = mergeProject.conflicts.filter((conflict) => conflict.code === 'project-css-module-use-site-proof-blocked');
assert.equal(cssModuleProofConflicts.length >= 6, true);
const cssModuleConflictReasonCodes = cssModuleProofConflicts.map((conflict) => conflict.details.reasonCode);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-dynamic-member-access-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-member-write-unsupported'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-helper-call-unproved'), false);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-string-literal-classname-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-generated-class-map-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-bundler-transform-identity-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-source-map-proof-unproved'), true);
assert.equal(mergeProject.summary.projectGraphCssModuleUseSiteConflicts >= 6, true);
assert.equal(mergeProject.summary.projectGraphCssModuleUseSiteBlockers >= 6, true);
assert.equal(mergeProject.summary.projectGraphCssModuleUseSiteGraphs, 1);
const blockedCssModuleSurface = matrixSurface(mergeProject, 'css-modules-use-site-graph');
assert.equal(blockedCssModuleSurface.proofStatuses['css-module-use-site-graph'], 'failed');
assert.equal(blockedCssModuleSurface.missingRouteIds.includes('prove-css-module-use-site-graph'), true);
assert.equal(blockedCssModuleSurface.nextMissingRouteId, 'prove-css-module-use-site-graph');
const blockedGeneratedClassNameMapSurface = matrixSurface(mergeProject, 'css-modules-generated-class-name-map'), blockedBundlerIdentitySurface = matrixSurface(mergeProject, 'css-modules-bundler-transform-identity'), blockedSourceMapIdentitySurface = matrixSurface(mergeProject, 'css-modules-source-map-identity');
assert.equal(blockedGeneratedClassNameMapSurface.proofStatuses['css-module-generated-class-name-map'], 'failed'); assert.equal(blockedBundlerIdentitySurface.proofStatuses['css-module-bundler-transform-identity'], 'failed'); assert.equal(blockedSourceMapIdentitySurface.proofStatuses['css-module-source-map-identity'], 'failed');
assert.equal(blockedGeneratedClassNameMapSurface.missingRouteIds.includes('prove-css-module-generated-class-name-map'), true); assert.equal(blockedBundlerIdentitySurface.missingRouteIds.includes('prove-css-module-bundler-transform-identity'), true); assert.equal(blockedSourceMapIdentitySurface.missingRouteIds.includes('prove-css-module-source-map-identity'), true);

const missingCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_missing_css_module',
  includeOutputProjectSymbolGraph: true,
  files: [
    {
      language: 'tsx',
      sourcePath: 'src/MissingButton.tsx',
      baseSourceText: missingButtonSourceText,
      workerSourceText: missingButtonSourceText,
      headSourceText: missingButtonSourceText
    }
  ]
});
assert.equal(missingCssModuleProject.status, 'blocked');
assert.equal(missingCssModuleProject.conflicts.some((conflict) => conflict.code === 'project-output-module-unresolved'), true);

const readyCssModuleImport = importNativeSource({
  language: 'css',
  sourcePath: 'src/Ready.module.css',
  sourceText: readyCssModuleSourceText,
  metadata: {
    cssModuleEvidence: {
      moduleHash: 'css-module:ready',
      generatedClassNameMap: { root: '_root_123', label: '_label_456' },
      jsTsUseSiteGraphHash: 'css-module-use-sites:ready',
      cssModuleCompositionGraphHash: 'css-module-composition:ready',
      icssGraphHash: 'icss:ready'
    },
    bundlerTransformHash: 'bundler-transform:ready',
    sourceMapProofHash: 'source-map-proof:ready'
  }
});
const readyCssModuleProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_ready_css_module',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyCssModuleImport],
  files: [
    {
      language: 'css',
      sourcePath: 'src/Ready.module.css',
      headSourceText: readyCssModuleSourceText
    },
    {
      language: 'tsx',
      sourcePath: 'src/Ready.tsx',
      baseSourceText: readyButtonSourceText,
      workerSourceText: readyButtonSourceText,
      headSourceText: readyButtonSourceText
    }
  ]
});
assert.equal(readyCssModuleProject.status, 'merged');
const readyCssModuleGraph = readyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0];
assert.equal(readyCssModuleGraph.status, 'ready');
assert.equal(readyCssModuleGraph.blockerCount, 0);
assert.equal(typeof readyCssModuleGraph.cssModuleClassNameHelperGraphHash, 'string');
assert.deepEqual(readyCssModuleGraph.cssModuleClassNameHelperProofLevels, ['css-module-class-helper-source-bounded-token-graph']);
assert.equal(typeof readyCssModuleGraph.cssModuleExportNamesHash, 'string');
const readyHelperUseSites = readyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.filter((site) => site.useSiteKind === 'jsx-className-helper');
assert.equal(readyHelperUseSites.length >= 2, true);
assert.equal(readyHelperUseSites.every((site) => site.helperCallProofLevel === 'css-module-class-helper-source-bounded-token-graph'), true);
assert.equal(readyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.every((site) => typeof site.cssModuleExportHash === 'string'), true);
assert.equal(readyCssModuleProject.summary.projectGraphCssModuleUseSiteConflicts, 0);
assert.equal(readyCssModuleProject.summary.projectGraphCssModuleUseSiteBlockers, 0);
assert.equal(readyCssModuleProject.summary.projectGraphCssModuleUseSiteGraphs, 1);
assert.equal(readyCssModuleProject.summary.projectGraphCssModuleUseSites >= 2, true);
assert.equal(readyCssModuleProject.summary.projectGraphCssModuleImportBindings, 1);
const readyCssModuleSurface = matrixSurface(readyCssModuleProject, 'css-modules-use-site-graph');
assert.equal(readyCssModuleSurface.proofStatuses['css-module-use-site-graph'], 'passed');
assert.equal((readyCssModuleSurface.missingRouteIds ?? []).includes('prove-css-module-use-site-graph'), false);
assert.equal(matrixSurface(readyCssModuleProject, 'css-modules-generated-class-name-map').proofStatuses['css-module-generated-class-name-map'], 'passed'); assert.equal(matrixSurface(readyCssModuleProject, 'css-modules-bundler-transform-identity').proofStatuses['css-module-bundler-transform-identity'], 'passed'); assert.equal(matrixSurface(readyCssModuleProject, 'css-modules-source-map-identity').proofStatuses['css-module-source-map-identity'], 'passed');

const unsafeHelperButtonSourceText = [
  `import readyStyles from '${readyCssModuleSpecifier}';`,
  'const cx = (...values) => values.filter(Boolean).join(" ");',
  'function choose(value) { return value; }',
  'export function UnsafeHelperButton() {',
  '  return <button className={cx(readyStyles.root, choose(readyStyles.label))} />;',
  '}',
  ''
].join('\n');
const unsafeHelperProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_unsafe_helper_call',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [readyCssModuleImport],
  files: [
    {
      language: 'css',
      sourcePath: 'src/Ready.module.css',
      headSourceText: readyCssModuleSourceText
    },
    {
      language: 'tsx',
      sourcePath: 'src/UnsafeReady.tsx',
      baseSourceText: unsafeHelperButtonSourceText,
      workerSourceText: unsafeHelperButtonSourceText,
      headSourceText: unsafeHelperButtonSourceText
    }
  ]
});
assert.equal(unsafeHelperProject.status, 'blocked');
assert.equal(unsafeHelperProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-helper-call-unproved'), true);
assert.equal(unsafeHelperProject.outputProjectSymbolGraph.cssModuleUseSiteGraphs[0].status, 'blocked');

function matrixSurface(result, surface) {
  const record = result.confidence.admissionMatrixAudit.surfaces.find((entry) => entry.surface === surface);
  assert.ok(record, `missing ${surface} matrix surface`);
  return record;
}
