import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { isJsxSpreadAttribute } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function jsxPropValueEvidence(tag, attribute) {
  if (isJsxSpreadAttribute(attribute)) return undefined;
  const assignedValueText = jsxAssignedPropValueText(attribute);
  const evidence = assignedValueText === undefined
    ? staticPropValueEvidence('boolean-shorthand', 'true', 'true')
    : jsxAssignedPropValueEvidence(assignedValueText);
  return compactRecord({
    ...evidence,
    expressionHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxPropValueExpression',
      tagName: tag.tagName,
      tagKey: tag.key,
      propName: attribute.name,
      expressionText: evidence.expressionText ?? evidence.valueText ?? evidence.dynamicText
    }),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxPropValue',
      tagName: tag.tagName,
      tagKey: tag.key,
      propName: attribute.name,
      propKind: propKind(attribute),
      proofStatus: evidence.proofStatus,
      reasonCode: evidence.reasonCode,
      valueKind: evidence.valueKind,
      valueText: evidence.valueText,
      expressionText: evidence.expressionText,
      referenceRoot: evidence.referenceRoot,
      referencePath: evidence.referencePath,
      optionalReference: evidence.optionalReference,
      optionalReferenceSegments: evidence.optionalReferenceSegments,
      optionalReferenceSegmentIndexes: evidence.optionalReferenceSegmentIndexes,
      optionalNullishBoundaryCount: evidence.optionalNullishBoundaryCount,
      dynamicText: evidence.dynamicText,
      dynamicBlockerReasonCode: evidence.dynamicBlockerReasonCode
    })
  });
}

function jsxAssignedPropValueText(attribute) {
  const match = /^[A-Za-z_$][\w$:-]*\s*=\s*([\s\S]*)$/.exec(String(attribute?.text ?? '').trim());
  return match ? normalizedText(match[1]) : undefined;
}

function jsxAssignedPropValueEvidence(valueText) {
  const text = normalizedText(valueText);
  if (quotedLiteralText(text)) return staticPropValueEvidence('string', text, text);
  const expressionText = bracedExpressionText(text);
  if (expressionText === undefined) return staticPropValueEvidence('unquoted-literal', text, text);
  const literalKind = staticLiteralKind(expressionText);
  if (literalKind) return staticPropValueEvidence(literalKind, expressionText, expressionText);
  const reference = staticPropReference(expressionText);
  if (reference) return staticReferencePropValueEvidence(reference, expressionText);
  const optionalReference = staticOptionalMemberReference(expressionText);
  if (optionalReference) return staticOptionalReferencePropValueEvidence(optionalReference, expressionText);
  return {
    proofStatus: 'dynamic-jsx-prop-value-unsupported',
    reasonCode: 'jsx-render-prop-value-unsupported',
    expressionText,
    dynamicText: expressionText,
    dynamicBlockerReasonCode: jsxPropValueDynamicBlockerReasonCode(expressionText)
  };
}

function staticPropValueEvidence(valueKind, valueText, expressionText) {
  return {
    proofStatus: 'static-literal-jsx-prop-value-evidence',
    reasonCode: 'jsx-render-prop-value-literal-evidence',
    valueKind,
    valueText,
    expressionText
  };
}

function staticReferencePropValueEvidence(reference, expressionText) {
  return {
    proofStatus: 'static-reference-jsx-prop-value-evidence',
    reasonCode: 'jsx-render-prop-value-static-reference-evidence',
    valueKind: 'reference',
    valueText: reference.text,
    expressionText,
    referenceRoot: reference.root,
    referencePath: reference.path
  };
}

function staticOptionalReferencePropValueEvidence(reference, expressionText) {
  return {
    proofStatus: 'static-optional-reference-jsx-prop-value-evidence',
    reasonCode: 'jsx-render-prop-value-static-optional-reference-evidence',
    valueKind: 'optional-reference',
    valueText: reference.text,
    expressionText,
    referenceRoot: reference.root,
    referencePath: reference.path,
    optionalReference: true,
    optionalReferenceSegments: reference.optionalSegments,
    optionalReferenceSegmentIndexes: reference.optionalSegmentIndexes,
    optionalNullishBoundaryCount: reference.optionalSegmentIndexes.length
  };
}

function bracedExpressionText(text) {
  const match = /^\{\s*([\s\S]*?)\s*\}$/.exec(String(text ?? '').trim());
  return match ? normalizedText(match[1]) : undefined;
}

function quotedLiteralText(text) {
  return /^"(?:[^"\\]|\\.)*"$/.test(text) || /^'(?:[^'\\]|\\.)*'$/.test(text);
}

function staticLiteralKind(text) {
  const value = normalizedText(text);
  if (/^(?:true|false)$/.test(value)) return 'boolean';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  if (/^[-]?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return 'number';
  if (quotedLiteralText(value)) return 'string';
  return staticStructuredLiteralKind(value);
}

function staticStructuredLiteralKind(text) {
  const parsed = parseStaticLiteralExpression(text);
  return parsed && ['object-literal', 'array-literal', 'template-string'].includes(parsed.kind)
    ? parsed.kind
    : undefined;
}

function parseStaticLiteralExpression(text) {
  const state = { text: String(text ?? ''), index: 0 };
  const parsed = parseStaticLiteralValue(state);
  skipWhitespace(state);
  return parsed && state.index === state.text.length ? parsed : undefined;
}

function parseStaticLiteralValue(state) {
  skipWhitespace(state);
  const char = state.text[state.index];
  if (char === '"' || char === "'") return parseQuotedStaticString(state) ? { kind: 'string' } : undefined;
  if (char === '`') return parseStaticTemplateString(state) ? { kind: 'template-string' } : undefined;
  if (char === '{') return parseStaticObjectLiteral(state) ? { kind: 'object-literal' } : undefined;
  if (char === '[') return parseStaticArrayLiteral(state) ? { kind: 'array-literal' } : undefined;
  const primitive = parseStaticPrimitiveToken(state);
  return primitive ? { kind: primitive } : undefined;
}

function parseStaticObjectLiteral(state) {
  state.index += 1;
  skipWhitespace(state);
  if (consumeChar(state, '}')) return true;
  while (state.index < state.text.length) {
    if (state.text.startsWith('...', state.index) || state.text[state.index] === '[') return false;
    if (!parseStaticObjectKey(state)) return false;
    skipWhitespace(state);
    if (!consumeChar(state, ':')) return false;
    if (!parseStaticLiteralValue(state)) return false;
    skipWhitespace(state);
    if (consumeChar(state, '}')) return true;
    if (!consumeChar(state, ',')) return false;
    skipWhitespace(state);
    if (consumeChar(state, '}')) return true;
  }
  return false;
}

function parseStaticArrayLiteral(state) {
  state.index += 1;
  skipWhitespace(state);
  if (consumeChar(state, ']')) return true;
  while (state.index < state.text.length) {
    if (state.text.startsWith('...', state.index) || state.text[state.index] === ',') return false;
    if (!parseStaticLiteralValue(state)) return false;
    skipWhitespace(state);
    if (consumeChar(state, ']')) return true;
    if (!consumeChar(state, ',')) return false;
    skipWhitespace(state);
    if (consumeChar(state, ']')) return true;
  }
  return false;
}

function parseStaticObjectKey(state) {
  skipWhitespace(state);
  const char = state.text[state.index];
  if (char === '"' || char === "'") return parseQuotedStaticString(state);
  const numberStart = state.index;
  if (parseStaticNumberToken(state)) return true;
  state.index = numberStart;
  return Boolean(parseIdentifierToken(state));
}

function parseQuotedStaticString(state) {
  const quote = state.text[state.index];
  if (quote !== '"' && quote !== "'") return false;
  state.index += 1;
  while (state.index < state.text.length) {
    const char = state.text[state.index];
    if (char === '\\') {
      state.index += 2;
      continue;
    }
    state.index += 1;
    if (char === quote) return true;
  }
  return false;
}

function parseStaticTemplateString(state) {
  if (state.text[state.index] !== '`') return false;
  state.index += 1;
  while (state.index < state.text.length) {
    const char = state.text[state.index];
    if (char === '\\') {
      state.index += 2;
      continue;
    }
    if (char === '$' && state.text[state.index + 1] === '{') return false;
    state.index += 1;
    if (char === '`') return true;
  }
  return false;
}

function parseStaticPrimitiveToken(state) {
  const number = parseStaticNumberToken(state);
  if (number) return 'number';
  const identifier = parseIdentifierToken(state);
  if (['true', 'false'].includes(identifier)) return 'boolean';
  if (identifier === 'null') return 'null';
  if (identifier === 'undefined') return 'undefined';
  return undefined;
}

function parseStaticNumberToken(state) {
  const match = /^[-]?(?:0|[1-9]\d*)(?:\.\d+)?/.exec(state.text.slice(state.index));
  if (!match) return undefined;
  state.index += match[0].length;
  return match[0];
}

function parseIdentifierToken(state) {
  const match = /^[A-Za-z_$][\w$]*/.exec(state.text.slice(state.index));
  if (!match) return undefined;
  state.index += match[0].length;
  return match[0];
}

function consumeChar(state, char) {
  if (state.text[state.index] !== char) return false;
  state.index += 1;
  return true;
}

function skipWhitespace(state) {
  while (/\s/.test(state.text[state.index] ?? '')) state.index += 1;
}

function staticPropReference(text) {
  const value = normalizedText(text);
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(value)) return undefined;
  const normalized = value.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { text: normalized, root: path[0], path };
}

function jsxPropValueDynamicBlockerReasonCode(text) {
  const value = normalizedText(text);
  if (/\[[\s\S]*\]/.test(value)) return 'jsx-render-prop-value-computed-reference-unsupported';
  if (/^`[\s\S]*\$\{[\s\S]*`$/.test(value)) return 'jsx-render-prop-value-template-interpolation-unsupported';
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'jsx-render-prop-value-call-expression-unsupported';
  if (/\?\./.test(value)) return 'jsx-render-prop-value-optional-reference-unsupported';
  return 'jsx-render-prop-value-expression-unsupported';
}

function propKind(attribute) { return isJsxSpreadAttribute(attribute) ? 'spread' : 'named'; }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxPropValueEvidence };
