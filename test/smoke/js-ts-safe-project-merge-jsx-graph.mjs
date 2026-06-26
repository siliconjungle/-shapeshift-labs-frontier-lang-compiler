import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';
import './js-ts-safe-project-merge-jsx-prop-values.mjs';
import { addProjectGraphDeltaConflictSummary, projectGraphDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-conflicts.js';
import { projectJsxChildOrderDeltaConflicts, projectJsxPropDeltaConflicts, projectJsxRenderRiskDeltaConflicts } from '../../src/js-ts-safe-project-merge-jsx-graph-conflicts.js';
import {
  jsxDelta,
  jsxElementDelta,
  jsxContextValueRisk,
  jsxEventHandlerRisk,
  jsxHookDependencyRisk,
  jsxHookEffectRisk,
  jsxHookOrderRisk,
  jsxKeyedChild,
  jsxProp,
  jsxProviderNestingRisk,
  jsxRenderRisk,
  jsxRenderRiskDelta,
  jsxSpreadProp
} from './js-ts-safe-project-merge-jsx-graph-helpers.mjs';

const sourceText = [
  'type ButtonProps = { tone: string; size: string };',
  'function Button(_props: ButtonProps) { return null; }',
  'const ThemeContext = React.createContext({ tone: "neutral" });',
  'const passthrough = { disabled: false };',
  'export function View() {',
  '  const theme = useContext(ThemeContext);',
  '  const themedTone = useMemo(() => theme.tone, [theme]);',
  '  useEffect(() => { subscribe(theme); return () => unsubscribe(theme); }, [theme]);',
  '  function handleClick() { return themedTone; }',
  '  return <ThemeContext.Provider value={themedTone}><Button key="primary" {...passthrough} tone="neutral" size="m" onClick={handleClick} data-id={1} /></ThemeContext.Provider>;',
  '}',
  ''
].join('\n');
const project = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_output_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': sourceText },
  workerFiles: { 'src/view.tsx': sourceText },
  headFiles: { 'src/view.tsx': sourceText },
  outputDiagnostics: []
});

const graph = project.outputProjectSymbolGraph;
assert.equal(project.status, 'merged');
assert.equal(graph.jsxElementRecords.length > 0, true);
assert.equal(graph.jsxPropRecords.length >= 4, true);
assert.equal(project.outputProjectImport.projectSymbolGraph.jsxPropRecords.length, graph.jsxPropRecords.length);
assert.equal(graph.remainingFields.includes('jsxElementRecords'), false);
assert.equal(graph.remainingFields.includes('jsxPropRecords'), false);

const button = graph.jsxElementRecords.find((record) => record.tagName === 'Button');
assert.equal(Boolean(button?.publicContract), true);
assert.equal(button.publicOwnerName, 'View');
assert.deepEqual(button.propNames, ['key', '...spread#1', 'tone', 'size', 'onClick', 'data-id']);
assert.deepEqual(button.propKinds, ['named', 'spread']);
assert.equal(button.spreadPropCount, 1);
assert.equal(button.keyedChild, true);
assert.equal(button.keyPropValue, 'primary');
assert.equal(typeof button.keyPropHash, 'string');
assert.equal(typeof button.childOrderSignatureHash, 'string');
assert.equal(button.renderRiskKinds.includes('hook-owner-render-scope'), true);
assert.equal(button.renderRiskKinds.includes('hook-call-order-boundary'), true);
assert.equal(button.renderRiskKinds.includes('hook-dependency-boundary'), true);
assert.equal(button.renderRiskKinds.includes('hook-effect-boundary'), true);
assert.equal(button.renderRiskKinds.includes('context-provider-nesting'), true);
assert.equal(button.renderRiskKinds.includes('event-handler-prop-boundary'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-hook-call-order-unsupported'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-hook-dependency-array-static-evidence'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-hook-effect-static-callback-evidence'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-context-provider-nesting-unsupported'), true);
assert.equal(button.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-static-evidence'), true);
assert.deepEqual(button.contextProviderPath, ['ThemeContext']);
assert.deepEqual(button.contextProviderAncestorTags, ['ThemeContext.Provider']);
assert.equal(button.contextProviderAncestorCount, 1);
assert.equal(typeof button.contextProviderNestingSignatureHash, 'string');
assert.deepEqual(button.hookNames, ['useContext', 'useMemo', 'useEffect']);
assert.deepEqual(button.hookCallOrder, ['useContext', 'useMemo', 'useEffect']);
assert.equal(button.hookCallCount, 3);
assert.equal(typeof button.hookCallOrderSignatureHash, 'string');
assert.equal(button.hookDependencyCount, 2);
assert.equal(button.hookDependencyRecords[0].hookName, 'useMemo');
assert.deepEqual(button.hookDependencyRecords[0].dependencyTexts, ['theme']);
assert.equal(button.hookDependencyRecords[0].dependencyCount, 1); assert.equal(button.hookDependencyRecords[0].proofStatus, 'static-dependency-array-evidence');
assert.equal(typeof button.hookDependencyRecords[0].dependencyArrayHash, 'string');
assert.equal(typeof button.hookDependencyRecords[0].dependencySignatureHash, 'string');
assert.equal(typeof button.hookDependencySignatureHash, 'string');
assert.equal(button.hookEffectCount, 1);
assert.equal(button.hookEffectRecords[0].hookName, 'useEffect');
assert.equal(button.hookEffectRecords[0].cleanupReturnPresent, true);
assert.equal(typeof button.hookEffectRecords[0].callbackHash, 'string');
assert.equal(typeof button.hookEffectRecords[0].cleanupReturnHash, 'string');
assert.equal(typeof button.hookEffectSignatureHash, 'string');
assert.deepEqual(button.eventHandlerPropNames, ['onClick']);
assert.equal(button.eventHandlerPropCount, 1);
assert.equal(button.eventHandlerPropRecords[0].propName, 'onClick');
assert.equal(button.eventHandlerPropRecords[0].propKind, 'named');
assert.equal(typeof button.eventHandlerPropRecords[0].expressionHash, 'string');
assert.equal(typeof button.eventHandlerPropRecords[0].signatureHash, 'string');
assert.equal(typeof button.eventHandlerSignatureHash, 'string');
assert.equal(graph.jsxPropRecords.some((record) => record.elementId === button.id && record.propName === 'tone' && record.publicOwnerName === 'View'), true);
const spreadProp = graph.jsxPropRecords.find((record) => record.elementId === button.id && record.propKind === 'spread');
assert.equal(Boolean(spreadProp), true);
assert.equal(spreadProp.propName, '...spread#1');
assert.equal(spreadProp.spread, true);
assert.equal(spreadProp.spreadOrdinal, 1);
assert.equal(typeof spreadProp.spreadExpressionHash, 'string');

const provider = graph.jsxElementRecords.find((record) => record.tagName === 'ThemeContext.Provider');
assert.equal(Boolean(provider?.publicContract), true);
assert.deepEqual(provider.renderRiskKinds, ['context-provider-boundary', 'context-provider-value-boundary', 'hook-owner-render-scope', 'hook-call-order-boundary', 'hook-dependency-boundary', 'hook-effect-boundary', 'context-consumer-boundary', 'render-return-boundary']);
assert.deepEqual(provider.renderRiskReasonCodes, ['jsx-render-context-provider-boundary', 'jsx-render-context-provider-value-static-reference-evidence', 'jsx-render-public-owner-hooks', 'jsx-render-hook-call-order-unsupported', 'jsx-render-hook-dependency-array-static-evidence', 'jsx-render-hook-effect-static-callback-evidence', 'jsx-render-hook-effect-static-cleanup-evidence', 'jsx-render-hook-effect-runtime-equivalence-unproved', 'jsx-render-context-consumer-target-static-evidence', 'jsx-render-return-static-evidence']);
assert.equal(provider.contextBoundaryKind, 'context-provider');
assert.equal(provider.contextName, 'ThemeContext');
assert.equal(provider.contextValuePropName, 'value');
assert.equal(provider.contextValueRecord.propName, 'value');
assert.equal(provider.contextValueRecord.propKind, 'named');
assert.equal(provider.contextValueRecord.proofStatus, 'static-reference-context-value-evidence'); assert.equal(provider.contextValueRecord.staticValueKind, 'reference'); assert.equal(provider.contextValueRecord.staticValueText, 'themedTone');
assert.equal(typeof provider.contextValueExpressionHash, 'string');
assert.equal(typeof provider.contextValueSignatureHash, 'string');
assert.equal(typeof provider.contextValueRecord.expressionHash, 'string');
assert.equal(typeof provider.contextValueRecord.signatureHash, 'string');
assert.deepEqual(provider.hookNames, ['useContext', 'useMemo', 'useEffect']);
assert.deepEqual(provider.hookCallOrder, ['useContext', 'useMemo', 'useEffect']);
assert.equal(provider.hookCallCount, 3);
assert.equal(typeof provider.hookCallOrderSignatureHash, 'string');
assert.equal(provider.hookDependencyCount, 2);
assert.deepEqual(provider.hookDependencyRecords[0].dependencyTexts, ['theme']);
assert.equal(typeof provider.hookDependencySignatureHash, 'string');
assert.equal(provider.hookEffectCount, 1);
assert.equal(typeof provider.hookEffectSignatureHash, 'string');
assert.equal(provider.contextConsumerCount, 1);
assert.equal(typeof provider.renderRiskSignatureHash, 'string');

const literalContextSource = 'const ThemeContext = React.createContext("light");\nexport function LiteralView() {\n  return <ThemeContext.Provider value="dark"><button /></ThemeContext.Provider>;\n}\n';
const literalContextFiles = { 'src/literal.tsx': literalContextSource };
const literalContextProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_literal_context_value_graph',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: literalContextFiles,
  workerFiles: literalContextFiles,
  headFiles: literalContextFiles,
  outputDiagnostics: []
});
const literalProvider = literalContextProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'ThemeContext.Provider');
assert.equal(Boolean(literalProvider?.publicContract), true);
assert.deepEqual(literalProvider.renderRiskKinds, ['context-provider-boundary', 'context-provider-value-boundary', 'render-return-boundary']);
assert.deepEqual(literalProvider.renderRiskReasonCodes, ['jsx-render-context-provider-boundary', 'jsx-render-context-provider-value-literal-evidence', 'jsx-render-return-static-evidence']);
assert.equal(literalProvider.contextValueRecord.proofStatus, 'literal-context-value-evidence'); assert.equal(literalProvider.contextValueRecord.literalValueKind, 'string'); assert.equal(literalProvider.contextValueRecord.literalValueText, '"dark"');
assert.equal(typeof literalProvider.contextValueRecord.expressionHash, 'string');

const delta = jsxDelta({
  base: jsxProp('base', 'jsx:base'),
  worker: jsxProp('worker', 'jsx:worker'),
  head: jsxProp('head', 'jsx:head'),
  output: jsxProp('output', 'jsx:output')
});
const conflicts = projectJsxPropDeltaConflicts(delta);
const summarized = addProjectGraphDeltaConflictSummary(delta, conflicts);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].code, 'project-jsx-public-prop-delta-conflict');
assert.equal(conflicts[0].details.identityKey, 'jsx-prop#src/view.tsx#View#Button#1#Button#tone');
assert.equal(conflicts[0].details.worker.signatureHash, 'jsx:worker');
assert.equal(summarized.summary.jsxPropConflicts, 1);

const unchangedHeadDelta = jsxDelta({
  base: jsxProp('base', 'jsx:base'),
  worker: jsxProp('worker', 'jsx:worker'),
  head: jsxProp('head', 'jsx:base')
});
assert.equal(projectJsxPropDeltaConflicts(unchangedHeadDelta).length, 0);

const spreadDelta = jsxDelta({
  base: jsxSpreadProp('base', 'jsx:spread:base'),
  worker: jsxSpreadProp('worker', 'jsx:spread:worker'),
  head: jsxSpreadProp('head', 'jsx:spread:head'),
  output: jsxSpreadProp('output', 'jsx:spread:output')
});
const spreadConflicts = projectJsxPropDeltaConflicts(spreadDelta);
assert.equal(spreadConflicts.length, 1);
assert.equal(spreadConflicts[0].message.includes('spread attribute'), true);
assert.equal(spreadConflicts[0].details.identityKey, 'jsx-prop#src/view.tsx#View#Button#1#Button#...spread#1');
assert.equal(spreadConflicts[0].details.worker.propKind, 'spread');
assert.equal(spreadConflicts[0].details.worker.spreadOrdinal, 1);
assert.equal(spreadConflicts[0].details.worker.spreadExpressionHash, 'spread:worker');

const renderRiskDelta = jsxRenderRiskDelta({
  base: undefined,
  worker: jsxRenderRisk('worker', 'render-risk:worker', ['hook-owner-render-scope'], ['useContext']),
  head: jsxRenderRisk('head', 'render-risk:head', ['hook-owner-render-scope'], ['useMemo']),
  output: jsxRenderRisk('output', 'render-risk:output', ['hook-owner-render-scope'], ['useContext', 'useMemo'])
});
const renderRiskConflicts = projectJsxRenderRiskDeltaConflicts(renderRiskDelta);
const summarizedRenderRisk = addProjectGraphDeltaConflictSummary(renderRiskDelta, renderRiskConflicts);
assert.equal(renderRiskConflicts.length, 1);
assert.equal(renderRiskConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(renderRiskConflicts[0].details.identityKey, 'jsx-render-risk#src/view.tsx#View#ThemeContext.Provider#1#ThemeContext.Provider');
assert.deepEqual(renderRiskConflicts[0].details.worker.hookNames, ['useContext']);
assert.deepEqual(renderRiskConflicts[0].details.head.hookNames, ['useMemo']);
assert.equal(summarizedRenderRisk.summary.jsxRenderRiskConflicts, 1);

const hookOrderDelta = jsxRenderRiskDelta({
  base: jsxHookOrderRisk('base', ['useAlpha', 'useBeta']),
  worker: jsxHookOrderRisk('worker', ['useBeta', 'useAlpha']),
  head: jsxHookOrderRisk('head', ['useAlpha', 'useBeta', 'useGamma']),
  output: jsxHookOrderRisk('output', ['useBeta', 'useAlpha', 'useGamma'])
});
const hookOrderConflicts = projectGraphDeltaConflicts(hookOrderDelta);
assert.equal(hookOrderConflicts.length, 1);
assert.equal(hookOrderConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(hookOrderConflicts[0].details.reasonCodes.includes('jsx-render-hook-call-order-unsupported'), true);
assert.deepEqual(hookOrderConflicts[0].details.worker.hookNames, ['useBeta', 'useAlpha']);
assert.deepEqual(hookOrderConflicts[0].details.worker.hookCallOrder, ['useBeta', 'useAlpha']);
assert.equal(hookOrderConflicts[0].details.worker.hookCallCount, 2);
assert.equal(hookOrderConflicts[0].details.head.hookCallCount, 3);

const providerNestingDelta = jsxRenderRiskDelta({
  base: undefined,
  worker: jsxProviderNestingRisk('worker', ['ThemeContext']),
  head: jsxProviderNestingRisk('head', ['LocaleContext']),
  output: jsxProviderNestingRisk('output', ['LocaleContext', 'ThemeContext'])
});
const providerNestingDeltaConflicts = projectGraphDeltaConflicts(providerNestingDelta);
assert.equal(providerNestingDeltaConflicts.length, 1);
assert.equal(providerNestingDeltaConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(providerNestingDeltaConflicts[0].details.reasonCodes.includes('jsx-render-context-provider-nesting-unsupported'), true);
assert.deepEqual(providerNestingDeltaConflicts[0].details.worker.contextProviderPath, ['ThemeContext']);
assert.deepEqual(providerNestingDeltaConflicts[0].details.head.contextProviderPath, ['LocaleContext']);
assert.deepEqual(providerNestingDeltaConflicts[0].details.output.contextProviderPath, ['LocaleContext', 'ThemeContext']);

const contextValueDelta = jsxRenderRiskDelta({
  base: jsxContextValueRisk('base', 'context-value:base'),
  worker: jsxContextValueRisk('worker', 'context-value:worker'),
  head: jsxContextValueRisk('head', 'context-value:head'),
  output: jsxContextValueRisk('output', 'context-value:output')
});
const contextValueConflicts = projectGraphDeltaConflicts(contextValueDelta);
assert.equal(contextValueConflicts.length, 1);
assert.equal(contextValueConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(contextValueConflicts[0].details.reasonCodes.includes('jsx-render-context-provider-value-unsupported'), true);
assert.equal(contextValueConflicts[0].details.worker.contextValueRecord.propName, 'value');
assert.equal(contextValueConflicts[0].details.worker.contextValueExpressionHash, 'context-value:worker');
assert.equal(contextValueConflicts[0].details.head.contextValueExpressionHash, 'context-value:head');

const hookDependencyDelta = jsxRenderRiskDelta({
  base: jsxHookDependencyRisk('base', ['theme']),
  worker: jsxHookDependencyRisk('worker', ['theme', 'locale']),
  head: jsxHookDependencyRisk('head', ['theme', 'featureFlag']),
  output: jsxHookDependencyRisk('output', ['theme', 'locale', 'featureFlag'])
});
const hookDependencyConflicts = projectGraphDeltaConflicts(hookDependencyDelta);
assert.equal(hookDependencyConflicts.length, 1);
assert.equal(hookDependencyConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(hookDependencyConflicts[0].details.reasonCodes.includes('jsx-render-hook-dependency-array-static-evidence'), true);
assert.deepEqual(hookDependencyConflicts[0].details.worker.hookDependencyRecords[0].dependencyTexts, ['theme', 'locale']);
assert.deepEqual(hookDependencyConflicts[0].details.head.hookDependencyRecords[0].dependencyTexts, ['theme', 'featureFlag']);
assert.equal(hookDependencyConflicts[0].details.worker.hookDependencyCount, 1);

const hookEffectDelta = jsxRenderRiskDelta({
  base: jsxHookEffectRisk('base', 'effect:callback:base', 'effect:cleanup:base'),
  worker: jsxHookEffectRisk('worker', 'effect:callback:worker', 'effect:cleanup:base'),
  head: jsxHookEffectRisk('head', 'effect:callback:base', 'effect:cleanup:head'),
  output: jsxHookEffectRisk('output', 'effect:callback:worker', 'effect:cleanup:head')
});
const hookEffectConflicts = projectGraphDeltaConflicts(hookEffectDelta);
assert.equal(hookEffectConflicts.length, 1);
assert.equal(hookEffectConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(hookEffectConflicts[0].details.reasonCodes.includes('jsx-render-hook-effect-static-callback-evidence'), true);
assert.equal(hookEffectConflicts[0].details.worker.hookEffectRecords[0].callbackHash, 'effect:callback:worker');
assert.equal(hookEffectConflicts[0].details.head.hookEffectRecords[0].cleanupReturnHash, 'effect:cleanup:head');
assert.equal(hookEffectConflicts[0].details.worker.hookEffectCount, 1);

const eventHandlerDelta = jsxRenderRiskDelta({
  base: jsxEventHandlerRisk('base', [{ propName: 'onClick', expressionHash: 'handler:base:click' }]),
  worker: jsxEventHandlerRisk('worker', [
    { propName: 'onClick', expressionHash: 'handler:base:click' },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover' }
  ]),
  head: jsxEventHandlerRisk('head', [
    { propName: 'onClick', expressionHash: 'handler:head:click' },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key' }
  ]),
  output: jsxEventHandlerRisk('output', [
    { propName: 'onClick', expressionHash: 'handler:head:click' },
    { propName: 'onMouseEnter', expressionHash: 'handler:worker:hover' },
    { propName: 'onKeyDown', expressionHash: 'handler:head:key' }
  ])
});
const eventHandlerConflicts = projectGraphDeltaConflicts(eventHandlerDelta);
assert.equal(eventHandlerConflicts.length, 1);
assert.equal(eventHandlerConflicts[0].code, 'project-jsx-public-render-risk-delta-conflict');
assert.equal(eventHandlerConflicts[0].details.reasonCodes.includes('jsx-render-event-handler-prop-static-evidence'), true);
assert.deepEqual(eventHandlerConflicts[0].details.worker.eventHandlerPropNames, ['onClick', 'onMouseEnter']);
assert.deepEqual(eventHandlerConflicts[0].details.head.eventHandlerPropNames, ['onClick', 'onKeyDown']);
assert.equal(eventHandlerConflicts[0].details.worker.eventHandlerPropCount, 2);

const childOrderDelta = jsxElementDelta({
  base: jsxKeyedChild('base', 1, 'child-order:base'),
  worker: jsxKeyedChild('worker', 2, 'child-order:worker'),
  head: jsxKeyedChild('head', 3, 'child-order:head'),
  output: jsxKeyedChild('output', 4, 'child-order:output')
});
const childOrderConflicts = projectJsxChildOrderDeltaConflicts(childOrderDelta);
assert.equal(childOrderConflicts.length, 1);
assert.equal(childOrderConflicts[0].code, 'project-jsx-public-child-order-delta-conflict');
assert.equal(childOrderConflicts[0].details.identityKey, 'jsx-child-order#src/view.tsx#View#primary');
assert.equal(childOrderConflicts[0].details.worker.ordinal, 2);

const unchangedChildOrderDelta = jsxElementDelta({
  base: jsxKeyedChild('base', 1, 'child-order:base'),
  worker: jsxKeyedChild('worker', 2, 'child-order:worker'),
  head: jsxKeyedChild('head', 1, 'child-order:base')
});
assert.equal(projectJsxChildOrderDeltaConflicts(unchangedChildOrderDelta).length, 0);
