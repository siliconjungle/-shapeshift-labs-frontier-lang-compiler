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
  '    <span className={cx(styles.root, state.ready && styles.active)} />',
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
  'export function ReadyButton() {',
  '  return <button className={readyStyles.root}>{readyStyles.label}</button>;',
  '}',
  ''
].join('\n');
const missingExportButtonSourceText = [
  `import readyStyles from '${readyCssModuleSpecifier}';`,
  'export function BrokenButton() {',
  '  return <button className={readyStyles.missing}>{readyStyles.label}</button>;',
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

const blockerReasonCodes = graph.cssModuleUseSiteBlockers.map((record) => record.reasonCode);
assert.equal(blockerReasonCodes.includes('css-module-dynamic-member-access-unproved'), true);
assert.equal(blockerReasonCodes.includes('css-module-member-write-unsupported'), true);
assert.equal(blockerReasonCodes.includes('css-module-helper-call-unproved'), true);
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
assert.equal(useSiteGraph.useSiteCount >= 4, true);
assert.equal(useSiteGraph.blockerCount >= 7, true);
assert.equal(useSiteGraph.status, 'blocked');
assert.equal(useSiteGraph.autoMergeClaim, false);
assert.equal(useSiteGraph.semanticEquivalenceClaim, false);
assert.equal(typeof useSiteGraph.graphHash, 'string');

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
assert.equal(cssModuleProofConflicts.length >= 7, true);
const cssModuleConflictReasonCodes = cssModuleProofConflicts.map((conflict) => conflict.details.reasonCode);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-dynamic-member-access-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-member-write-unsupported'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-helper-call-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-string-literal-classname-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-generated-class-map-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-bundler-transform-identity-unproved'), true);
assert.equal(cssModuleConflictReasonCodes.includes('css-module-source-map-proof-unproved'), true);

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
assert.equal(typeof readyCssModuleGraph.cssModuleExportNamesHash, 'string');
assert.equal(readyCssModuleProject.outputProjectSymbolGraph.cssModuleUseSites.every((site) => typeof site.cssModuleExportHash === 'string'), true);

const missingExportProject = safeMergeJsTsProject({
  id: 'js_ts_safe_project_merge_css_module_missing_export',
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
      sourcePath: 'src/Broken.tsx',
      baseSourceText: missingExportButtonSourceText,
      workerSourceText: missingExportButtonSourceText,
      headSourceText: missingExportButtonSourceText
    }
  ]
});
assert.equal(missingExportProject.status, 'blocked');
assert.equal(missingExportProject.conflicts.some((conflict) => conflict.code === 'project-output-symbol-unresolved'), false);
assert.equal(missingExportProject.conflicts.some((conflict) => conflict.details.reasonCode === 'css-module-export-name-unresolved'), true);
