import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import { projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { jsxComponentProviderLookupRisk, jsxContextConsumerRisk, jsxRenderRiskDelta } from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const sourceText = [
  'const ThemeContext = React.createContext("light");',
  'const LocaleContext = React.createContext("en");',
  'const contexts = { theme: ThemeContext };',
  'function Button() { return <button />; }',
  'export function View({ current }) {',
  '  const theme = useContext(ThemeContext);',
  '  const dynamic = useContext(contexts[current]);',
  '  return <ThemeContext.Provider value={theme}><Button data-theme={theme} data-dynamic={dynamic} /></ThemeContext.Provider>;',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_context_consumers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': sourceText },
  workerFiles: { 'src/view.tsx': sourceText },
  headFiles: { 'src/view.tsx': sourceText },
  outputDiagnostics: []
});
assert.equal(project.status, 'merged');
const button = project.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'Button');
assert.ok(button);
assert.equal(button.renderRiskKinds.includes('context-consumer-boundary'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-static-evidence'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-lookup-static-evidence'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-unsupported'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-context-consumer-dynamic-target-unsupported'), true);
assert.deepEqual(button.contextConsumerNames, ['ThemeContext']);
assert.equal(button.contextConsumerCount, 2);
assert.equal(button.contextConsumerRecords[0].hookName, 'useContext');
assert.equal(button.contextConsumerRecords[0].contextName, 'ThemeContext');
assert.equal(button.contextConsumerRecords[0].contextExpressionText, 'ThemeContext');
assert.equal(button.contextConsumerRecords[0].proofStatus, 'static-context-target-evidence');
assert.equal(button.contextConsumerRecords[0].contextTargetKind, 'reference');
assert.equal(button.contextConsumerRecords[0].contextTargetReasonCode, 'jsx-render-context-consumer-target-static-evidence');
assert.equal(button.contextConsumerRecords[0].contextTargetReferenceRoot, 'ThemeContext');
assert.deepEqual(button.contextConsumerRecords[0].contextTargetReferencePath, ['ThemeContext']);
assert.equal(typeof button.contextConsumerRecords[0].contextExpressionHash, 'string');
assert.equal(button.contextConsumerRecords[0].contextProviderLookupStatus, 'static-provider-ancestor-evidence');
assert.equal(button.contextConsumerRecords[0].contextProviderLookupName, 'ThemeContext');
assert.equal(button.contextConsumerRecords[0].contextProviderLookupTagName, 'ThemeContext.Provider');
assert.equal(button.contextConsumerRecords[0].contextProviderLookupDepth, 1);
assert.equal(typeof button.contextConsumerRecords[0].contextProviderLookupHash, 'string');
assert.equal(typeof button.contextConsumerRecords[0].signatureHash, 'string');
assert.equal(button.contextConsumerRecords[1].dynamicTarget, true);
assert.equal(button.contextConsumerRecords[1].contextTargetKind, 'dynamic-expression');
assert.equal(button.contextConsumerRecords[1].dynamicTargetKind, 'computed-reference');
assert.equal(button.contextConsumerRecords[1].dynamicBlockerReasonCode, 'jsx-render-context-consumer-target-computed-reference-unsupported');
assert.equal(button.contextConsumerRecords[1].contextName, undefined);
assert.equal(button.contextConsumerRecords[1].contextExpressionText, 'contexts[current]');
assert.equal(button.contextConsumerRecords[1].proofStatus, 'dynamic-context-target-unsupported');
assert.equal(button.contextConsumerRecords[1].contextProviderLookupStatus, undefined);
assert.equal(typeof button.contextConsumerSignatureHash, 'string');

const staticOnlyProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_static_context_consumers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nexport function View() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\n' },
  workerFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nexport function View() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\n' },
  headFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nexport function View() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\n' },
  outputDiagnostics: []
});
const staticButton = staticOnlyProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'button');
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-static-evidence'), true);
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-unsupported'), false);
assert.equal(staticButton.contextConsumerRecords[0].proofStatus, 'static-context-target-evidence');

const optionalTargetProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_optional_context_consumer_target',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nconst OptionalContexts = { theme: ThemeContext };\nexport function View() { const theme = useContext(OptionalContexts?.theme); return <button data-theme={theme} />; }\n' },
  workerFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nconst OptionalContexts = { theme: ThemeContext };\nexport function View() { const theme = useContext(OptionalContexts?.theme); return <button data-theme={theme} />; }\n' },
  headFiles: { 'src/view.tsx': 'const ThemeContext = React.createContext("light");\nconst OptionalContexts = { theme: ThemeContext };\nexport function View() { const theme = useContext(OptionalContexts?.theme); return <button data-theme={theme} />; }\n' },
  outputDiagnostics: []
});
const optionalTargetButton = optionalTargetProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'button');
const optionalTargetRecord = optionalTargetButton.contextConsumerRecords[0];
assert.equal(optionalTargetButton.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-static-optional-reference-evidence'), true);
assert.equal(optionalTargetButton.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-unsupported'), false);
assert.equal(optionalTargetRecord.proofStatus, 'static-optional-context-target-evidence');
assert.equal(optionalTargetRecord.contextName, 'OptionalContexts?.theme');
assert.equal(optionalTargetRecord.contextTargetKind, 'optional-reference');
assert.equal(optionalTargetRecord.optionalReference, true);
assert.deepEqual(optionalTargetRecord.contextTargetReferencePath, ['OptionalContexts', 'theme']);
assert.deepEqual(optionalTargetRecord.optionalReferenceSegments, ['theme']);
assert.deepEqual(optionalTargetRecord.optionalReferenceSegmentIndexes, [1]);
assert.equal(optionalTargetRecord.optionalNullishBoundaryCount, 1);

const componentProviderSource = [
  'const ThemeContext = React.createContext("light");',
  'function Child() {',
  '  const theme = useContext(ThemeContext);',
  '  return <button data-theme={theme} />;',
  '}',
  'export function View() {',
  '  return <ThemeContext.Provider value="dark"><Child /></ThemeContext.Provider>;',
  '}',
  ''
].join('\n');
const componentProviderProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_component_provider_lookup',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/component-provider.tsx': componentProviderSource },
  workerFiles: { 'src/component-provider.tsx': componentProviderSource },
  headFiles: { 'src/component-provider.tsx': componentProviderSource },
  outputDiagnostics: []
});
const childCall = componentProviderProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'Child');
assert.ok(childCall);
assert.equal(childCall.publicOwnerName, 'View');
assert.equal(childCall.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-static-evidence'), true);
assert.equal(childCall.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-lookup-static-evidence'), true);
assert.equal(childCall.contextConsumerNames[0], 'ThemeContext');
assert.equal(childCall.contextConsumerRecords[0].contextProviderLookupStatus, 'static-same-file-component-provider-evidence');
assert.equal(childCall.contextConsumerRecords[0].contextProviderLookupScope, 'same-file-direct-component');
assert.equal(childCall.contextConsumerRecords[0].contextProviderLookupTagName, 'ThemeContext.Provider');
assert.equal(childCall.contextConsumerRecords[0].componentCallLookupStatus, 'same-file-component-target-evidence');
assert.equal(childCall.contextConsumerRecords[0].componentCallTagName, 'Child');
assert.equal(childCall.contextConsumerRecords[0].componentCallTargetName, 'Child');
assert.equal(childCall.contextConsumerRecords[0].componentCallTargetOwnerName, 'Child');
assert.equal(typeof childCall.contextConsumerRecords[0].componentCallLookupHash, 'string');

const memberComponentProviderSource = [
  'const ThemeContext = React.createContext("light");',
  'function Child() {',
  '  const theme = useContext(ThemeContext);',
  '  return <button data-theme={theme} />;',
  '}',
  'const UI = { Child };',
  'export function View() {',
  '  return <ThemeContext.Provider value="dark"><UI.Child /></ThemeContext.Provider>;',
  '}',
  ''
].join('\n');
const memberComponentProviderProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_member_component_provider_lookup',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/member-component-provider.tsx': memberComponentProviderSource },
  workerFiles: { 'src/member-component-provider.tsx': memberComponentProviderSource },
  headFiles: { 'src/member-component-provider.tsx': memberComponentProviderSource },
  outputDiagnostics: []
});
const memberChildCall = memberComponentProviderProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'UI.Child');
assert.ok(memberChildCall);
assert.equal(memberChildCall.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), false);
assert.equal(memberChildCall.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-lookup-static-evidence'), true);
assert.equal(memberChildCall.contextConsumerRecords[0].contextProviderLookupStatus, 'static-same-file-component-provider-evidence');
assert.equal(memberChildCall.contextConsumerRecords[0].contextProviderLookupScope, 'same-file-member-component');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallLookupStatus, 'same-file-member-component-target-evidence');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallTargetName, 'UI.Child');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallTargetOwnerName, 'Child');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallMemberObjectName, 'UI');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallMemberPropertyName, 'Child');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallMemberLocalName, 'Child');
assert.equal(memberChildCall.contextConsumerRecords[0].componentCallMemberBindingKind, 'const');
assert.equal(typeof memberChildCall.contextConsumerRecords[0].componentCallMemberBindingHash, 'string');

const providerFlowSource = [
  'const ThemeContext = React.createContext("light");',
  'function Shell({ children }) {',
  '  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;',
  '}',
  'function Child() {',
  '  const theme = useContext(ThemeContext);',
  '  return <button data-theme={theme} />;',
  '}',
  'export function View() {',
  '  return <Shell><Child /></Shell>;',
  '}',
  ''
].join('\n');
const providerFlowProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_component_provider_children_flow',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/provider-flow.tsx': providerFlowSource },
  workerFiles: { 'src/provider-flow.tsx': providerFlowSource },
  headFiles: { 'src/provider-flow.tsx': providerFlowSource },
  outputDiagnostics: []
});
const providerFlowChild = providerFlowProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'Child');
assert.ok(providerFlowChild);
assert.equal(providerFlowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-target-static-evidence'), true);
assert.equal(providerFlowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-flow-static-evidence'), true);
assert.equal(providerFlowChild.contextConsumerRecords[0].contextProviderLookupStatus, 'static-same-file-component-provider-flow-evidence');
assert.equal(providerFlowChild.contextConsumerRecords[0].contextProviderLookupScope, 'same-file-component-children-flow');
assert.equal(providerFlowChild.contextConsumerRecords[0].componentProviderFlowStatus, 'static-provider-children-flow-evidence');
assert.equal(providerFlowChild.contextConsumerRecords[0].componentProviderFlowOwnerName, 'Shell');
assert.equal(typeof providerFlowChild.contextConsumerRecords[0].componentProviderFlowHash, 'string');
assert.equal(providerFlowChild.contextConsumerRecords[0].componentCallTargetName, 'Child');

const classProviderFlowSource = [
  'const ThemeContext = React.createContext("light");',
  'class Shell extends React.Component {',
  '  render() {',
  '    return <ThemeContext.Provider value="dark">{this.props.children}</ThemeContext.Provider>;',
  '  }',
  '}',
  'function Child() {',
  '  const theme = useContext(ThemeContext);',
  '  return <button data-theme={theme} />;',
  '}',
  'export function View() {',
  '  return <Shell><Child /></Shell>;',
  '}',
  ''
].join('\n');
const classProviderFlowProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_class_provider_children_flow',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/class-provider-flow.tsx': classProviderFlowSource },
  workerFiles: { 'src/class-provider-flow.tsx': classProviderFlowSource },
  headFiles: { 'src/class-provider-flow.tsx': classProviderFlowSource },
  outputDiagnostics: []
});
const classProviderFlowChild = classProviderFlowProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'Child');
assert.ok(classProviderFlowChild);
assert.equal(classProviderFlowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-flow-static-evidence'), true);
assert.equal(classProviderFlowChild.contextConsumerRecords[0].contextProviderLookupScope, 'same-file-component-children-flow');
assert.equal(classProviderFlowChild.contextConsumerRecords[0].componentProviderFlowOwnerName, 'Shell');

const missingChildrenFlowSource = [
  'const ThemeContext = React.createContext("light");',
  'function Shell({ children }) {',
  '  return <ThemeContext.Provider value="dark"><span /></ThemeContext.Provider>;',
  '}',
  'function Child() {',
  '  const theme = useContext(ThemeContext);',
  '  return <button data-theme={theme} />;',
  '}',
  'export function View() {',
  '  return <Shell><Child /></Shell>;',
  '}',
  ''
].join('\n');
const missingChildrenFlowProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_component_provider_missing_children_flow',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/missing-provider-flow.tsx': missingChildrenFlowSource },
  workerFiles: { 'src/missing-provider-flow.tsx': missingChildrenFlowSource },
  headFiles: { 'src/missing-provider-flow.tsx': missingChildrenFlowSource },
  outputDiagnostics: []
});
const missingFlowChild = missingChildrenFlowProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'Child');
assert.ok(missingFlowChild);
assert.equal(missingFlowChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-flow-static-evidence'), false);
assert.equal(missingFlowChild.contextConsumerRecords?.[0]?.componentProviderFlowStatus, undefined);

const unsupportedComponentProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_component_provider_lookup_unsupported',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/imported-provider.tsx': 'const ThemeContext = React.createContext("light");\nfunction Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\nfunction Fallback() { return <span />; }\nconst UI = { Child: enabled ? Child : Fallback };\nexport function View({ enabled }) { const Target = enabled ? Child : Fallback; return <ThemeContext.Provider value="dark"><ImportedChild /><UI.Child /><Target /></ThemeContext.Provider>; }\n' },
  workerFiles: { 'src/imported-provider.tsx': 'const ThemeContext = React.createContext("light");\nfunction Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\nfunction Fallback() { return <span />; }\nconst UI = { Child: enabled ? Child : Fallback };\nexport function View({ enabled }) { const Target = enabled ? Child : Fallback; return <ThemeContext.Provider value="dark"><ImportedChild /><UI.Child /><Target /></ThemeContext.Provider>; }\n' },
  headFiles: { 'src/imported-provider.tsx': 'const ThemeContext = React.createContext("light");\nfunction Child() { const theme = useContext(ThemeContext); return <button data-theme={theme} />; }\nfunction Fallback() { return <span />; }\nconst UI = { Child: enabled ? Child : Fallback };\nexport function View({ enabled }) { const Target = enabled ? Child : Fallback; return <ThemeContext.Provider value="dark"><ImportedChild /><UI.Child /><Target /></ThemeContext.Provider>; }\n' },
  outputDiagnostics: []
});
const importedChild = unsupportedComponentProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'ImportedChild');
const memberChild = unsupportedComponentProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'UI.Child');
const dynamicTarget = unsupportedComponentProject.outputProjectSymbolGraph.jsxElementRecords
  .find((record) => record.tagName === 'Target');
assert.equal(importedChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), true);
assert.equal(importedChild.contextConsumerRecords[0].componentCallLookupStatus, 'component-target-unsupported');
assert.deepEqual(importedChild.contextConsumerRecords[0].componentCallUnsupportedReasonCodes, ['jsx-render-context-consumer-provider-component-target-unsupported']);
assert.equal(memberChild.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), true);
assert.equal(memberChild.contextConsumerRecords[0].componentCallTargetName, 'UI.Child');
assert.equal(dynamicTarget.renderRiskReasonCodes.includes('jsx-render-context-consumer-provider-component-target-unsupported'), true);
assert.equal(dynamicTarget.contextConsumerRecords[0].componentCallTargetName, 'Target');

const delta = jsxRenderRiskDelta({
  base: jsxContextConsumerRisk('base', ['ThemeContext']),
  worker: jsxContextConsumerRisk('worker', ['LocaleContext']),
  head: jsxContextConsumerRisk('head', ['FeatureFlagContext']),
  output: jsxContextConsumerRisk('output', ['LocaleContext', 'FeatureFlagContext'])
});
const conflicts = projectGraphDeltaConflicts(delta);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(conflicts[0].details.reasonCodes.includes('jsx-render-context-consumer-target-static-evidence'), true);
assert.deepEqual(conflicts[0].details.worker.contextConsumerNames, ['LocaleContext']);
assert.deepEqual(conflicts[0].details.head.contextConsumerNames, ['FeatureFlagContext']);
assert.equal(conflicts[0].details.worker.contextConsumerCount, 1);

const componentLookupDelta = jsxRenderRiskDelta({
  base: jsxComponentProviderLookupRisk('base', 'ThemeContext'),
  worker: jsxComponentProviderLookupRisk('worker', 'LocaleContext'),
  head: jsxComponentProviderLookupRisk('head', 'FeatureFlagContext'),
  output: jsxComponentProviderLookupRisk('output', 'LocaleContext')
});
const componentLookupConflicts = projectGraphDeltaConflicts(componentLookupDelta);
assert.equal(componentLookupConflicts.length, 1);
assert.equal(componentLookupConflicts[0].details.reasonCodes.includes('jsx-render-context-consumer-provider-component-lookup-static-evidence'), true);
assert.equal(componentLookupConflicts[0].details.worker.contextConsumerRecords[0].contextProviderLookupScope, 'same-file-direct-component');
assert.equal(componentLookupConflicts[0].details.worker.contextConsumerRecords[0].componentCallTargetName, 'Child');
