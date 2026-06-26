import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { isJsxSpreadAttribute } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function jsxOwnerEventHandlerDeclarations(sourceText, ownerName) {
  const records = [
    ...functionHandlerDeclarations(sourceText, ownerName),
    ...variableHandlerDeclarations(sourceText, ownerName)
  ];
  return records.length ? new Map(records.map((record) => [record.name, record])) : undefined;
}

function functionHandlerDeclarations(sourceText, ownerName) {
  return [...String(sourceText ?? '').matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g)]
    .map((match) => handlerDeclarationRecord(sourceText, ownerName, match[1], 'function', match.index, balancedEnd(sourceText, match.index + match[0].lastIndexOf('{'), '{', '}')));
}

function variableHandlerDeclarations(sourceText, ownerName) {
  return [...String(sourceText ?? '').matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g)]
    .map((match) => handlerDeclarationRecord(sourceText, ownerName, match[1], match[0].includes('function') ? 'function-expression' : 'arrow-function', match.index, statementEnd(sourceText, match.index)));
}

function handlerDeclarationRecord(sourceText, ownerName, name, declarationKind, start, end) {
  const declarationText = normalizedDeclarationText(String(sourceText ?? '').slice(start, end ?? statementEnd(sourceText, start)));
  return compactRecord({
    name,
    declarationKind,
    ownerName,
    declarationHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxEventHandlerDeclaration', ownerName, name, declarationKind, declarationText })
  });
}

function jsxEventHandlerProps(attributes = [], handlerDeclarations) {
  const eventHandlers = attributes.filter(isJsxEventHandlerAttribute);
  return eventHandlers.map((attribute, index) => jsxEventHandlerPropRecord(attribute, index + 1, handlerDeclarations));
}

function jsxEventHandlerPropRecord(attribute, ordinal, handlerDeclarations) {
  const expressionText = normalizedJsxAttributeValueText(attribute.text);
  const handlerReference = staticEventHandlerReference(expressionText);
  const inlineHandlerText = handlerReference ? undefined : staticJsxInlineHandlerText(expressionText);
  const handlerDeclaration = handlerReference?.plainReference ? handlerDeclarations?.get(handlerReference.text) : undefined;
  const inlineHandlerExpressionHash = inlineHandlerText ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxInlineEventHandlerExpression',
    propName: attribute.name,
    inlineHandlerText
  }) : undefined;
  return compactRecord({
    propName: attribute.name,
    ordinal,
    propKind: propKind(attribute),
    proofStatus: handlerReference?.proofStatus ?? (inlineHandlerText ? 'static-inline-event-handler-evidence' : 'dynamic-event-handler-unsupported'),
    reasonCode: handlerReference?.reasonCode,
    handlerReferenceText: handlerReference?.text,
    handlerReferenceRoot: handlerReference?.root,
    handlerReferencePath: handlerReference?.path,
    optionalReference: handlerReference?.optionalReference,
    optionalReferenceSegments: handlerReference?.optionalSegments,
    optionalReferenceSegmentIndexes: handlerReference?.optionalSegmentIndexes,
    optionalNullishBoundaryCount: handlerReference?.optionalSegmentIndexes?.length,
    handlerDeclarationKind: handlerDeclaration?.declarationKind,
    handlerDeclarationName: handlerDeclaration?.name,
    handlerDeclarationOwnerName: handlerDeclaration?.ownerName,
    handlerDeclarationHash: handlerDeclaration?.declarationHash,
    inlineHandlerText,
    inlineHandlerExpressionHash,
    dynamicExpressionText: handlerReference || inlineHandlerText ? undefined : expressionText,
    dynamicExpressionKind: handlerReference || inlineHandlerText ? undefined : dynamicEventHandlerExpressionKind(expressionText),
    dynamicBlockerReasonCode: handlerReference || inlineHandlerText ? undefined : dynamicEventHandlerBlockerReasonCode(expressionText),
    expressionHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxEventHandlerExpression',
      propName: attribute.name,
      expressionText
    }),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxEventHandlerProp',
      propName: attribute.name,
      ordinal,
      expressionText,
      handlerReference,
      handlerDeclarationHash: handlerDeclaration?.declarationHash,
      inlineHandlerText,
      dynamicBlockerReasonCode: handlerReference || inlineHandlerText ? undefined : dynamicEventHandlerBlockerReasonCode(expressionText)
    })
  });
}

function jsxEventHandlerReasonCodes(records = []) {
  if (!records.length) return [];
  const hasStaticReference = records.some((record) => record.proofStatus === 'static-event-handler-reference-evidence');
  const hasOptionalReference = records.some((record) => record.proofStatus === 'static-optional-event-handler-reference-evidence');
  const hasInline = records.some((record) => record.proofStatus === 'static-inline-event-handler-evidence');
  const hasDynamic = records.some((record) => record.proofStatus === 'dynamic-event-handler-unsupported');
  return [
    hasStaticReference || hasOptionalReference || hasInline ? 'jsx-render-event-handler-prop-static-evidence' : undefined,
    hasOptionalReference ? 'jsx-render-event-handler-prop-static-optional-reference-evidence' : undefined,
    hasInline ? 'jsx-render-event-handler-prop-static-inline-evidence' : undefined,
    records.some((record) => record.handlerDeclarationHash) ? 'jsx-render-event-handler-local-declaration-evidence' : undefined,
    hasDynamic ? 'jsx-render-event-handler-prop-unsupported' : undefined
  ];
}

function staticEventHandlerReference(expressionText) {
  const text = normalizedText(expressionText);
  const expression = normalizedText(/^\{\s*([\s\S]*?)\s*\}$/.exec(text)?.[1] ?? text);
  const optionalReference = staticOptionalMemberReference(expression);
  if (optionalReference) return {
    ...optionalReference,
    proofStatus: 'static-optional-event-handler-reference-evidence',
    reasonCode: 'jsx-render-event-handler-prop-static-optional-reference-evidence',
    optionalReference: true
  };
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(expression)) return undefined;
  const normalized = expression.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { text: normalized, root: path[0], path, proofStatus: 'static-event-handler-reference-evidence', plainReference: true };
}

function staticJsxInlineHandlerText(expressionText) {
  const text = normalizedText(expressionText);
  const expression = normalizedText(/^\{\s*([\s\S]*?)\s*\}$/.exec(text)?.[1] ?? text);
  if (/^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>[\s\S]+$/.test(expression)) return expression;
  if (/^(?:async\s+)?function(?:\s+[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{[\s\S]*\}$/.test(expression)) return expression;
  return undefined;
}

function dynamicEventHandlerExpressionKind(expressionText) {
  const expression = normalizedEventHandlerExpression(expressionText);
  if (/\[[\s\S]*\]/.test(expression)) return 'computed-reference';
  if (/\?\.\s*\(/.test(expression) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(expression)) return 'call-expression';
  if (/\?\./.test(expression)) return 'optional-reference';
  return 'dynamic-expression';
}

function dynamicEventHandlerBlockerReasonCode(expressionText) {
  return `jsx-render-event-handler-prop-${dynamicEventHandlerExpressionKind(expressionText)}-unsupported`;
}

function balancedEnd(text, openIndex, open, close) {
  const value = String(text ?? '');
  if (value[openIndex] !== open) return undefined;
  let depth = 0;
  for (let index = openIndex; index < value.length; index += 1) {
    if (value[index] === open) depth += 1;
    else if (value[index] === close && --depth === 0) return index + 1;
  }
  return undefined;
}

function statementEnd(text, start) {
  const value = String(text ?? '');
  const end = value.indexOf(';', start);
  if (end !== -1) return end + 1;
  const lineEnd = value.indexOf('\n', start);
  return lineEnd === -1 ? value.length : lineEnd;
}

function normalizedDeclarationText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function normalizedJsxAttributeValueText(text) {
  const match = /^[A-Za-z_$][\w$:-]*\s*=\s*([\s\S]*)$/.exec(String(text ?? '').trim());
  return normalizedText(match?.[1] ?? '');
}
function normalizedEventHandlerExpression(text) {
  const normalized = normalizedText(text);
  return normalizedText(/^\{\s*([\s\S]*?)\s*\}$/.exec(normalized)?.[1] ?? normalized);
}
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function propKind(attribute) { return isJsxSpreadAttribute(attribute) ? 'spread' : 'named'; }
function isJsxEventHandlerAttribute(attribute) { return !isJsxSpreadAttribute(attribute) && /^on[A-Z0-9]/.test(String(attribute?.name ?? '')); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxEventHandlerProps, jsxEventHandlerReasonCodes, jsxOwnerEventHandlerDeclarations };
