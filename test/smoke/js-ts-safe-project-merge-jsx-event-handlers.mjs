import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from './compiler-api.mjs';

const staticSource = [
  'export function View({ handlers }) {',
  '  function handleClick() { return handlers.click(); }',
  '  const handleBlur = () => handlers.blur();',
  '  return <button onClick={handleClick} onFocus={handlers.focus} onMouseDown={handlers?.press} onMouseUp={handlers?.nested?.release} onBlur={handleBlur} />;',
  '}',
  ''
].join('\n');
const staticProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_static_event_handlers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': staticSource },
  workerFiles: { 'src/view.tsx': staticSource },
  headFiles: { 'src/view.tsx': staticSource },
  outputDiagnostics: []
});
const staticButton = staticProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'button');
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-static-evidence'), true);
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-unsupported'), false);
assert.deepEqual(staticButton.eventHandlerPropNames, ['onClick', 'onFocus', 'onMouseDown', 'onMouseUp', 'onBlur']);
assert.equal(staticButton.eventHandlerPropRecords[0].proofStatus, 'static-event-handler-reference-evidence');
assert.equal(staticButton.eventHandlerPropRecords[0].handlerReferenceText, 'handleClick');
assert.deepEqual(staticButton.eventHandlerPropRecords[0].handlerReferencePath, ['handleClick']);
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-event-handler-local-declaration-evidence'), true);
assert.equal(staticButton.eventHandlerPropRecords[0].handlerDeclarationKind, 'function');
assert.equal(staticButton.eventHandlerPropRecords[0].handlerDeclarationName, 'handleClick');
assert.equal(staticButton.eventHandlerPropRecords[0].handlerDeclarationOwnerName, 'View');
assert.equal(typeof staticButton.eventHandlerPropRecords[0].handlerDeclarationHash, 'string');
assert.equal(staticButton.eventHandlerPropRecords[1].handlerReferenceText, 'handlers.focus');
assert.deepEqual(staticButton.eventHandlerPropRecords[1].handlerReferencePath, ['handlers', 'focus']);
assert.equal(staticButton.eventHandlerPropRecords[1].handlerDeclarationHash, undefined);
assert.equal(staticButton.eventHandlerPropRecords[2].proofStatus, 'static-optional-event-handler-reference-evidence');
assert.equal(staticButton.eventHandlerPropRecords[2].reasonCode, 'jsx-render-event-handler-prop-static-optional-reference-evidence');
assert.equal(staticButton.eventHandlerPropRecords[2].handlerReferenceText, 'handlers?.press');
assert.deepEqual(staticButton.eventHandlerPropRecords[2].handlerReferencePath, ['handlers', 'press']);
assert.deepEqual(staticButton.eventHandlerPropRecords[2].optionalReferenceSegments, ['press']);
assert.deepEqual(staticButton.eventHandlerPropRecords[2].optionalReferenceSegmentIndexes, [1]);
assert.equal(staticButton.eventHandlerPropRecords[2].optionalNullishBoundaryCount, 1);
assert.equal(staticButton.eventHandlerPropRecords[3].handlerReferenceText, 'handlers?.nested?.release');
assert.deepEqual(staticButton.eventHandlerPropRecords[3].optionalReferenceSegments, ['nested', 'release']);
assert.equal(staticButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-static-optional-reference-evidence'), true);
assert.equal(staticButton.eventHandlerPropRecords[4].handlerReferenceText, 'handleBlur');
assert.equal(staticButton.eventHandlerPropRecords[4].handlerDeclarationKind, 'arrow-function');
assert.equal(staticButton.eventHandlerPropRecords[4].handlerDeclarationName, 'handleBlur');
assert.equal(typeof staticButton.eventHandlerPropRecords[4].handlerDeclarationHash, 'string');

const dynamicSource = [
  'export function View({ id }) {',
  '  return <button onClick={() => activate(id)} onKeyDown={makeHandler?.(id)} onKeyUp={handlers[id]} />;',
  '}',
  ''
].join('\n');
const dynamicProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_jsx_dynamic_event_handlers',
  language: 'tsx',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/view.tsx': dynamicSource },
  workerFiles: { 'src/view.tsx': dynamicSource },
  headFiles: { 'src/view.tsx': dynamicSource },
  outputDiagnostics: []
});
const dynamicButton = dynamicProject.outputProjectSymbolGraph.jsxElementRecords.find((record) => record.tagName === 'button');
assert.equal(dynamicButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-unsupported'), true);
assert.equal(dynamicButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-static-evidence'), true);
assert.equal(dynamicButton.renderRiskReasonCodes.includes('jsx-render-event-handler-prop-static-inline-evidence'), true);
assert.equal(dynamicButton.eventHandlerPropRecords[0].proofStatus, 'static-inline-event-handler-evidence');
assert.equal(dynamicButton.eventHandlerPropRecords[0].inlineHandlerText, '() => activate(id)');
assert.equal(typeof dynamicButton.eventHandlerPropRecords[0].inlineHandlerExpressionHash, 'string');
assert.equal(dynamicButton.eventHandlerPropRecords[0].dynamicExpressionText, undefined);
assert.equal(dynamicButton.eventHandlerPropRecords[1].proofStatus, 'dynamic-event-handler-unsupported');
assert.equal(dynamicButton.eventHandlerPropRecords[1].dynamicExpressionText, '{makeHandler?.(id)}');
assert.equal(dynamicButton.eventHandlerPropRecords[1].dynamicExpressionKind, 'call-expression');
assert.equal(dynamicButton.eventHandlerPropRecords[1].dynamicBlockerReasonCode, 'jsx-render-event-handler-prop-call-expression-unsupported');
assert.equal(dynamicButton.eventHandlerPropRecords[2].proofStatus, 'dynamic-event-handler-unsupported');
assert.equal(dynamicButton.eventHandlerPropRecords[2].dynamicExpressionKind, 'computed-reference');
assert.equal(dynamicButton.eventHandlerPropRecords[2].dynamicBlockerReasonCode, 'jsx-render-event-handler-prop-computed-reference-unsupported');
