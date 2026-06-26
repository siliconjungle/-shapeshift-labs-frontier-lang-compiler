function jsxDelta(stages) {
  return propDelta(stages, 'jsxPropRecords');
}

function jsxRenderRiskDelta(stages) {
  return elementDelta(stages);
}

function jsxElementDelta(stages) {
  return elementDelta(stages);
}

function propDelta(stages, field) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { [field]: record ? [record] : [] },
      summary: { [field]: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function elementDelta(stages) {
  return propDelta(stages, 'jsxElementRecords');
}

function jsxProp(stage, signatureHash) {
  return {
    id: `jsx_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'Button',
    tagKey: 'Button#1',
    propName: 'tone',
    ordinal: 1,
    publicContract: true,
    publicOwnerName: 'View',
    signatureHash,
    sourceHash: `source:${stage}`
  };
}

function jsxSpreadProp(stage, signatureHash) {
  return {
    ...jsxProp(stage, signatureHash),
    propName: '...spread#1',
    propKind: 'spread',
    spread: true,
    spreadOrdinal: 1,
    spreadExpressionHash: `spread:${stage}`
  };
}

function jsxRenderRisk(stage, signatureHash, renderRiskKinds, hookNames) {
  return {
    id: `jsx_render_risk_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'ThemeContext.Provider',
    tagKey: 'ThemeContext.Provider#1',
    publicContract: true,
    publicOwnerName: 'View',
    renderRiskKinds,
    renderRiskReasonCodes: ['jsx-render-public-owner-hooks'],
    contextBoundaryKind: renderRiskKinds.includes('context-provider-boundary') ? 'context-provider' : undefined,
    contextName: renderRiskKinds.includes('context-provider-boundary') ? 'ThemeContext' : undefined,
    hookNames,
    hookCallOrder: hookNames,
    hookCallCount: hookNames.length,
    hookCallOrderSignatureHash: `hook-order:${stage}`,
    renderRiskSignatureHash: signatureHash,
    sourceHash: `source:${stage}`
  };
}

function jsxHookOrderRisk(stage, hookCallOrder) {
  return {
    ...jsxRenderRisk(stage, 'render-risk:stable-hook-owner', ['hook-owner-render-scope', 'hook-call-order-boundary'], hookCallOrder),
    renderRiskReasonCodes: ['jsx-render-public-owner-hooks', 'jsx-render-hook-call-order-unsupported'],
    hookCallOrder,
    hookCallCount: hookCallOrder.length,
    hookCallOrderSignatureHash: `hook-order:${stage}:${hookCallOrder.join('>')}`
  };
}

function jsxProviderNestingRisk(stage, contextProviderPath) {
  return {
    ...jsxRenderRisk(stage, `render-risk:provider-nesting:${stage}`, ['context-provider-nesting'], []),
    renderRiskReasonCodes: ['jsx-render-context-provider-nesting-unsupported'],
    contextProviderPath,
    contextProviderAncestorTags: contextProviderPath.map((contextName) => `${contextName}.Provider`),
    contextProviderAncestorCount: contextProviderPath.length,
    contextProviderNestingSignatureHash: `context-provider-nesting:${stage}:${contextProviderPath.join('>')}`
  };
}

function jsxContextValueRisk(stage, expressionHash) {
  return {
    ...jsxRenderRisk(stage, `render-risk:context-value:${stage}`, ['context-provider-boundary', 'context-provider-value-boundary'], []),
    renderRiskReasonCodes: ['jsx-render-context-provider-boundary', 'jsx-render-context-provider-value-unsupported'],
    contextValuePropName: 'value',
    contextValueExpressionHash: expressionHash,
    contextValueSignatureHash: `context-value:${stage}:${expressionHash}`,
    contextValueRecord: {
      propName: 'value',
      propKind: 'named',
      expressionHash,
      signatureHash: `context-value:${stage}:${expressionHash}`
    }
  };
}

function jsxHookDependencyRisk(stage, dependencyTexts) {
  return {
    ...jsxRenderRisk(stage, `render-risk:hook-dependencies:${stage}`, ['hook-owner-render-scope', 'hook-dependency-boundary'], ['useMemo']),
    renderRiskReasonCodes: ['jsx-render-public-owner-hooks', 'jsx-render-hook-dependency-array-static-evidence'],
    hookDependencyRecords: [{
      hookName: 'useMemo',
      ordinal: 1,
      dependencyCount: dependencyTexts.length,
      dependencyTexts,
      proofStatus: 'static-dependency-array-evidence',
      dependencyArrayHash: `hook-dependency-array:${stage}:${dependencyTexts.join('|')}`,
      dependencySignatureHash: `hook-dependency-signature:${stage}:${dependencyTexts.join('|')}`
    }],
    hookDependencyCount: 1,
    hookDependencySignatureHash: `hook-dependencies:${stage}:${dependencyTexts.join('|')}`
  };
}

function jsxHookEffectRisk(stage, callbackHash, cleanupReturnHash) {
  return {
    ...jsxRenderRisk(stage, `render-risk:hook-effect:${stage}`, ['hook-owner-render-scope', 'hook-effect-boundary'], ['useEffect']),
    renderRiskReasonCodes: [
      'jsx-render-public-owner-hooks',
      'jsx-render-hook-effect-static-callback-evidence',
      'jsx-render-hook-effect-runtime-equivalence-unproved'
    ],
    hookEffectRecords: [{
      hookName: 'useEffect',
      ordinal: 1,
      proofStatus: 'static-effect-callback-source-evidence',
      callbackKind: 'arrow-function',
      callbackHash,
      cleanupReturnHash,
      cleanupReturnPresent: Boolean(cleanupReturnHash),
      runtimeEquivalenceClaim: false,
      signatureHash: `hook-effect-signature:${stage}:${callbackHash}:${cleanupReturnHash ?? ''}`
    }],
    hookEffectCount: 1,
    hookEffectSignatureHash: `hook-effect:${stage}:${callbackHash}:${cleanupReturnHash ?? ''}`
  };
}

function jsxContextConsumerRisk(stage, contextNames) {
  const records = contextNames.map((contextName, index) => ({
    hookName: 'useContext',
    ordinal: index + 1,
    contextName,
    contextExpressionText: contextName,
    contextExpressionHash: `context-consumer-expression:${stage}:${contextName}`,
    signatureHash: `context-consumer:${stage}:${contextName}`,
    proofStatus: 'static-context-target-evidence'
  }));
  return {
    ...jsxRenderRisk(stage, `render-risk:context-consumer:${stage}`, ['context-consumer-boundary'], ['useContext']),
    renderRiskReasonCodes: ['jsx-render-public-owner-hooks', 'jsx-render-context-consumer-target-static-evidence'],
    contextConsumerNames: contextNames,
    contextConsumerRecords: records,
    contextConsumerCount: records.length,
    contextConsumerSignatureHash: `context-consumers:${stage}:${contextNames.join('|')}`
  };
}

function jsxComponentProviderLookupRisk(stage, contextName) {
  const record = {
    hookName: 'useContext',
    ordinal: 1,
    contextName,
    contextExpressionText: contextName,
    contextExpressionHash: `component-context-expression:${stage}:${contextName}`,
    contextProviderLookupStatus: 'static-same-file-component-provider-evidence',
    contextProviderLookupScope: 'same-file-direct-component',
    contextProviderLookupName: contextName,
    contextProviderLookupTagName: `${contextName}.Provider`,
    contextProviderLookupDepth: 1,
    contextProviderLookupHash: `component-provider-lookup:${stage}:${contextName}`,
    componentCallLookupStatus: 'same-file-component-target-evidence',
    componentCallTagName: 'Child',
    componentCallTargetName: 'Child',
    componentCallTargetOwnerName: 'Child',
    componentCallLookupHash: `component-target:${stage}:Child`,
    signatureHash: `component-context-consumer:${stage}:${contextName}`,
    proofStatus: 'static-context-target-evidence'
  };
  return {
    ...jsxRenderRisk(stage, `render-risk:component-context-consumer:${stage}`, ['context-consumer-boundary'], ['useContext']),
    renderRiskReasonCodes: ['jsx-render-public-owner-hooks', 'jsx-render-context-consumer-target-static-evidence', 'jsx-render-context-consumer-provider-component-lookup-static-evidence'],
    contextConsumerNames: [contextName],
    contextConsumerRecords: [record],
    contextConsumerCount: 1,
    contextConsumerSignatureHash: `component-context-consumers:${stage}:${contextName}`
  };
}

function jsxEventHandlerRisk(stage, eventHandlers) {
  return {
    id: `jsx_event_handler_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'Button',
    tagKey: 'Button#1',
    publicContract: true,
    publicOwnerName: 'View',
    renderRiskKinds: ['event-handler-prop-boundary'],
    renderRiskReasonCodes: ['jsx-render-event-handler-prop-static-evidence'],
    eventHandlerPropNames: eventHandlers.map((handler) => handler.propName),
    eventHandlerPropRecords: eventHandlers.map((handler, index) => ({
      propName: handler.propName,
      ordinal: index + 1,
      propKind: 'named',
      proofStatus: 'static-event-handler-reference-evidence',
      handlerReferenceText: handler.handlerReferenceText ?? handler.propName,
      expressionHash: handler.expressionHash,
      signatureHash: `event-handler:${stage}:${handler.propName}:${handler.expressionHash}`
    })),
    eventHandlerPropCount: eventHandlers.length,
    eventHandlerSignatureHash: `event-handlers:${stage}:${eventHandlers.map((handler) => `${handler.propName}:${handler.expressionHash}`).join('|')}`,
    renderRiskSignatureHash: `render-risk:event-handlers:${stage}`,
    sourceHash: `source:${stage}`
  };
}

function jsxRenderReturnRisk(stage, expressionTexts) {
  const records = expressionTexts.map((expressionText, index) => ({
    ordinal: index + 1,
    proofStatus: 'static-render-return-evidence',
    branchControlKind: index === 0 && expressionTexts.length > 1 ? 'conditional-expression' : 'return-statement',
    expressionText,
    expressionHash: `render-return-expression:${stage}:${expressionText}`,
    signatureHash: `render-return:${stage}:${index + 1}:${expressionText}`
  }));
  return {
    ...jsxRenderRisk(stage, `render-risk:render-return:${stage}`, ['render-return-boundary', 'render-return-branch-control-flow'], []),
    renderRiskReasonCodes: ['jsx-render-return-static-evidence', 'jsx-render-return-branch-unsupported'],
    renderReturnRecords: records,
    renderReturnCount: records.length,
    renderReturnBranchCount: records.length > 1 ? 1 : undefined,
    renderReturnSignatureHash: `render-returns:${stage}:${expressionTexts.join('|')}`
  };
}

function jsxKeyedChild(stage, ordinal, childOrderSignatureHash) {
  return {
    id: `jsx_keyed_child_${stage}`,
    sourcePath: 'src/view.tsx',
    tagName: 'Button',
    tagKey: `Button#${ordinal}`,
    publicContract: true,
    publicOwnerName: 'View',
    keyPropValue: 'primary',
    keyPropHash: `key:${stage}`,
    ordinal,
    childOrderSignatureHash,
    sourceHash: `source:${stage}`
  };
}

export {
  jsxDelta,
  jsxElementDelta,
  jsxComponentProviderLookupRisk,
  jsxContextConsumerRisk,
  jsxContextValueRisk,
  jsxEventHandlerRisk,
  jsxHookDependencyRisk,
  jsxHookEffectRisk,
  jsxHookOrderRisk,
  jsxKeyedChild,
  jsxProp,
  jsxProviderNestingRisk,
  jsxRenderReturnRisk,
  jsxRenderRisk,
  jsxRenderRiskDelta,
  jsxSpreadProp
};
