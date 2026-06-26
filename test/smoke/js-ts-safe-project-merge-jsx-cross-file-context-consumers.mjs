import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

function graphFor(id, files, expectedStatus = 'merged') {
  const project = safeMergeJsTsProject({
    id,
    language: 'tsx',
    includeOutputProjectSymbolGraph: true,
    baseFiles: files,
    workerFiles: files,
    headFiles: files,
    outputDiagnostics: []
  });
  assert.equal(project.status, expectedStatus);
  return project.outputProjectSymbolGraph;
}

function sharedTheme() {
  return { 'src/theme.tsx': 'export const ThemeContext = React.createContext("light");\n' };
}

function namedChild() {
  return {
    'src/child.tsx': [
      'import { ThemeContext } from "./theme.js";',
      'export function Child() {',
      '  const theme = useContext(ThemeContext);',
      '  return <button data-theme={theme} />;',
      '}',
      ''
    ].join('\n')
  };
}

function element(graph, sourcePath, tagName) {
  const record = graph.jsxElementRecords.find((candidate) => candidate.sourcePath === sourcePath && candidate.tagName === tagName);
  assert.ok(record, `${sourcePath} ${tagName}`);
  return record;
}

const namedGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_named_context_consumer', {
  ...sharedTheme(),
  ...namedChild(),
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child as RenamedChild } from "./child.js";',
    'export function View() {',
    '  return <ThemeContext.Provider value="dark"><RenamedChild /></ThemeContext.Provider>;',
    '}',
    ''
  ].join('\n')
});
const namedRecord = element(namedGraph, 'src/view.tsx', 'RenamedChild').contextConsumerRecords[0];
assert.equal(namedRecord.contextProviderLookupStatus, 'static-project-import-component-provider-evidence');
assert.equal(namedRecord.contextProviderLookupScope, 'project-import-direct-component');
assert.equal(namedRecord.componentCallLookupStatus, 'project-import-component-target-evidence');
assert.equal(namedRecord.componentCallTargetOwnerName, 'Child');
assert.equal(namedRecord.componentCallTargetSourcePath, 'src/child.tsx');
assert.equal(namedRecord.componentCallImportKind, 'named');
assert.equal(namedRecord.componentCallImportedName, 'Child');
assert.equal(namedRecord.componentCallLocalName, 'RenamedChild');
assert.equal(namedRecord.componentCallTargetExportName, 'Child');
assert.equal(typeof namedRecord.componentCallImportEdgeId, 'string');

const defaultGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_default_context_consumer', {
  ...sharedTheme(),
  'src/child.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'export default function Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }',
    ''
  ].join('\n'),
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import Child from "./child.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
});
const defaultRecord = element(defaultGraph, 'src/view.tsx', 'Child').contextConsumerRecords[0];
assert.equal(defaultRecord.contextProviderLookupStatus, 'static-project-import-component-provider-evidence');
assert.equal(defaultRecord.componentCallImportKind, 'default');
assert.equal(defaultRecord.componentCallImportedName, 'default');
assert.equal(defaultRecord.componentCallTargetExportName, 'default');

const barrelGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_barrel_context_consumer', {
  ...sharedTheme(),
  ...namedChild(),
  'src/components.ts': 'export { Child as Button } from "./child.js";\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Button } from "./components.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Button /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
});
const barrelRecord = element(barrelGraph, 'src/view.tsx', 'Button').contextConsumerRecords[0];
assert.equal(barrelRecord.contextProviderLookupStatus, 'static-project-import-component-provider-evidence');
assert.equal(barrelRecord.contextProviderLookupScope, 'project-import-reexport-component');
assert.equal(barrelRecord.componentCallLookupStatus, 'project-import-reexport-component-target-evidence');
assert.equal(barrelRecord.componentCallTargetOwnerName, 'Child');
assert.equal(barrelRecord.componentCallTargetSourcePath, 'src/child.tsx');
assert.equal(barrelRecord.componentCallImportedName, 'Button');
assert.equal(barrelRecord.componentCallTargetExportName, 'Child');
assert.equal(barrelRecord.componentCallReExportSourcePath, 'src/components.ts');
assert.equal(barrelRecord.componentCallReExportExportedName, 'Button');
assert.equal(barrelRecord.componentCallReExportLocalName, 'Child');
assert.equal(barrelRecord.componentCallReExportTargetSourcePath, 'src/child.tsx');
assert.equal(typeof barrelRecord.componentCallReExportEdgeId, 'string');

const defaultBarrelGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_default_barrel_context_consumer', {
  ...sharedTheme(),
  'src/child.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'export default function Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }',
    ''
  ].join('\n'),
  'src/components.ts': 'export { default as Child } from "./child.js";\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child } from "./components.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
});
const defaultBarrelRecord = element(defaultBarrelGraph, 'src/view.tsx', 'Child').contextConsumerRecords[0];
assert.equal(defaultBarrelRecord.contextProviderLookupScope, 'project-import-reexport-component');
assert.equal(defaultBarrelRecord.componentCallReExportLocalName, 'default');
assert.equal(defaultBarrelRecord.componentCallTargetExportName, 'default');

const starBarrelGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_star_barrel_context_consumer', {
  ...sharedTheme(),
  ...namedChild(),
  'src/components.ts': 'export * from "./child.js";\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child } from "./components.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
});
const starBarrelRecord = element(starBarrelGraph, 'src/view.tsx', 'Child').contextConsumerRecords[0];
assert.equal(starBarrelRecord.contextProviderLookupScope, 'project-import-reexport-component');
assert.equal(starBarrelRecord.componentCallLookupStatus, 'project-import-reexport-component-target-evidence');
assert.equal(starBarrelRecord.componentCallReExportKind, 'export-star');
assert.equal(starBarrelRecord.componentCallReExportTargetSourcePath, 'src/child.tsx');
assert.equal(typeof starBarrelRecord.componentCallReExportIdentityId, 'string');

const memberObjectGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_member_object_context_consumer', {
  ...sharedTheme(),
  ...namedChild(),
  'src/ui.tsx': 'import { Child } from "./child.js";\nexport const UI = { Child };\n',
  'src/components.ts': 'export { UI as Kit } from "./ui.js";\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { UI as ImportedUI } from "./ui.js";',
    'import { Kit } from "./components.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><ImportedUI.Child /><Kit.Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
});
const importedMemberRecord = element(memberObjectGraph, 'src/view.tsx', 'ImportedUI.Child').contextConsumerRecords[0];
assert.equal(importedMemberRecord.contextProviderLookupScope, 'project-import-member-component');
assert.equal(importedMemberRecord.componentCallLookupStatus, 'project-import-member-component-target-evidence');
assert.equal(importedMemberRecord.componentCallTargetOwnerName, 'Child');
assert.equal(importedMemberRecord.componentCallTargetSourcePath, 'src/child.tsx');
assert.equal(importedMemberRecord.componentCallImportedName, 'UI');
assert.equal(importedMemberRecord.componentCallLocalName, 'ImportedUI');
assert.equal(importedMemberRecord.componentCallTargetExportName, 'UI');
assert.equal(importedMemberRecord.componentCallMemberObjectName, 'ImportedUI');
assert.equal(importedMemberRecord.componentCallMemberPropertyName, 'Child');
assert.equal(importedMemberRecord.componentCallMemberLocalName, 'Child');
assert.equal(typeof importedMemberRecord.componentCallMemberBindingHash, 'string');
const reexportMemberRecord = element(memberObjectGraph, 'src/view.tsx', 'Kit.Child').contextConsumerRecords[0];
assert.equal(reexportMemberRecord.contextProviderLookupScope, 'project-import-reexport-member-component');
assert.equal(reexportMemberRecord.componentCallLookupStatus, 'project-import-reexport-member-component-target-evidence');
assert.equal(reexportMemberRecord.componentCallReExportSourcePath, 'src/components.ts');
assert.equal(reexportMemberRecord.componentCallReExportTargetSourcePath, 'src/ui.tsx');
assert.equal(reexportMemberRecord.componentCallMemberObjectName, 'Kit');

const ambiguousStarGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_ambiguous_star_barrel_context_consumer', {
  ...sharedTheme(),
  'src/a.tsx': 'import { ThemeContext } from "./theme.js";\nexport function Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\n',
  'src/b.tsx': 'import { ThemeContext } from "./theme.js";\nexport function Child() { const theme = useContext(ThemeContext); return <a data-theme={theme} />; }\n',
  'src/components.ts': 'export * from "./a.js";\nexport * from "./b.js";\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child } from "./components.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
}, 'blocked');
const ambiguousStarChild = element(ambiguousStarGraph, 'src/view.tsx', 'Child');
assert.equal(ambiguousStarChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), true);
assert.equal(ambiguousStarChild.contextConsumerRecords[0].componentCallLookupStatus, 'component-target-unsupported');

const flowGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_provider_flow_context_consumer', {
  ...sharedTheme(),
  ...namedChild(),
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child } from "./child.js";',
    'function Shell({ children }) { return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>; }',
    'export function View() { return <Shell><Child /></Shell>; }',
    ''
  ].join('\n')
});
const flowChild = element(flowGraph, 'src/view.tsx', 'Child');
assert.equal(flowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-project-component-flow-static-evidence'), true);
assert.equal(flowChild.contextConsumerRecords[0].contextProviderLookupStatus, 'static-project-import-component-provider-flow-evidence');
assert.equal(flowChild.contextConsumerRecords[0].contextProviderLookupScope, 'project-import-component-children-flow');
assert.equal(flowChild.contextConsumerRecords[0].componentProviderFlowOwnerName, 'Shell');

const importedProviderFlowGraph = graphFor('js_ts_project_safe_merge_jsx_imported_provider_flow_context_consumer', {
  ...sharedTheme(),
  'src/shell.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'export function Shell({ children }) {',
    '  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;',
    '}',
    ''
  ].join('\n'),
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Shell } from "./shell.js";',
    'function Child() {',
    '  const theme = useContext(ThemeContext);',
    '  return <button data-theme={theme} />;',
    '}',
    'export function View() { return <Shell><Child /></Shell>; }',
    ''
  ].join('\n')
});
const importedProviderFlowChild = element(importedProviderFlowGraph, 'src/view.tsx', 'Child');
const importedProviderFlowRecord = importedProviderFlowChild.contextConsumerRecords[0];
assert.equal(importedProviderFlowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-project-component-flow-static-evidence'), true);
assert.equal(importedProviderFlowRecord.contextProviderLookupStatus, 'static-project-import-component-provider-flow-evidence');
assert.equal(importedProviderFlowRecord.contextProviderLookupScope, 'project-import-component-children-flow');
assert.equal(importedProviderFlowRecord.componentCallLookupStatus, 'same-file-component-target-evidence');
assert.equal(importedProviderFlowRecord.componentProviderFlowOwnerName, 'Shell');
assert.equal(importedProviderFlowRecord.componentProviderFlowLookupStatus, 'project-import-component-target-evidence');
assert.equal(importedProviderFlowRecord.componentProviderFlowLookupScope, 'project-import-direct-component');
assert.equal(importedProviderFlowRecord.componentProviderFlowComponentTagName, 'Shell');
assert.equal(importedProviderFlowRecord.componentProviderFlowTargetOwnerName, 'Shell');
assert.equal(importedProviderFlowRecord.componentProviderFlowTargetSourcePath, 'src/shell.tsx');
assert.equal(importedProviderFlowRecord.componentProviderFlowImportKind, 'named');
assert.equal(importedProviderFlowRecord.componentProviderFlowImportedName, 'Shell');
assert.equal(importedProviderFlowRecord.componentProviderFlowLocalName, 'Shell');
assert.equal(importedProviderFlowRecord.componentProviderFlowTargetExportName, 'Shell');
assert.equal(typeof importedProviderFlowRecord.componentProviderFlowImportEdgeId, 'string');
assert.equal(typeof importedProviderFlowRecord.componentProviderFlowLookupHash, 'string');

const importedProviderMissingFlowGraph = graphFor('js_ts_project_safe_merge_jsx_imported_provider_missing_children_flow_context_consumer', {
  ...sharedTheme(),
  'src/shell.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'export function Shell({ children }) {',
    '  return <ThemeContext.Provider value="dark"><span /></ThemeContext.Provider>;',
    '}',
    ''
  ].join('\n'),
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Shell } from "./shell.js";',
    'function Child() {',
    '  const theme = useContext(ThemeContext);',
    '  return <button data-theme={theme} />;',
    '}',
    'export function View() { return <Shell><Child /></Shell>; }',
    ''
  ].join('\n')
});
const importedProviderMissingFlowChild = element(importedProviderMissingFlowGraph, 'src/view.tsx', 'Child');
assert.equal(importedProviderMissingFlowChild.renderRiskReasonCodes?.includes('jsx-render-context-consumer-provider-project-component-flow-static-evidence') ?? false, false);
assert.equal(importedProviderMissingFlowChild.contextConsumerRecords?.length ?? 0, 0);

const missingExportGraph = graphFor('js_ts_project_safe_merge_jsx_cross_file_missing_export_context_consumer', {
  ...sharedTheme(),
  'src/not-child.tsx': 'export function NotChild() { return <span />; }\n',
  'src/view.tsx': [
    'import { ThemeContext } from "./theme.js";',
    'import { Child } from "./not-child.js";',
    'export function View() { return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>; }',
    ''
  ].join('\n')
}, 'blocked');
const missingChild = element(missingExportGraph, 'src/view.tsx', 'Child');
assert.equal(missingChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), true);
assert.equal(missingChild.contextConsumerRecords[0].componentCallLookupStatus, 'component-target-unsupported');
assert.equal(missingChild.contextConsumerRecords[0].componentCallTargetSourcePath, undefined);
