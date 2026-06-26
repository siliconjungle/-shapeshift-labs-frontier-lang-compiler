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
  return undefined;
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
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'jsx-render-prop-value-call-expression-unsupported';
  if (/\?\./.test(value)) return 'jsx-render-prop-value-optional-reference-unsupported';
  return 'jsx-render-prop-value-expression-unsupported';
}

function propKind(attribute) { return isJsxSpreadAttribute(attribute) ? 'spread' : 'named'; }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxPropValueEvidence };
