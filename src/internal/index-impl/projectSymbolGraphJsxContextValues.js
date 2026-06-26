import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { isJsxSpreadAttribute } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function jsxContextProviderValueRecord(attributes = []) {
  const attribute = attributes.find((candidate) => candidate.name === 'value' && !isJsxSpreadAttribute(candidate));
  if (!attribute) return undefined;
  const expressionText = normalizedJsxAttributeValueText(attribute.text);
  const classification = jsxContextValueClassification(expressionText);
  const referenceBindingHash = classification.referenceBinding ? hashSemanticValue({
    kind: 'frontier.lang.projectJsxContextProviderValueReferenceBinding',
    expressionText,
    referenceText: classification.referenceBinding.text,
    root: classification.referenceBinding.root,
    memberPath: classification.referenceBinding.memberPath,
    optionalReference: classification.referenceBinding.optionalReference,
    optionalReferenceSegments: classification.referenceBinding.optionalSegments,
    optionalReferenceSegmentIndexes: classification.referenceBinding.optionalSegmentIndexes
  }) : undefined;
  return compactRecord({
    propName: 'value',
    propKind: propKind(attribute),
    proofStatus: classification.proofStatus,
    reasonCode: classification.reasonCode,
    literalValueKind: classification.literal?.kind,
    literalValueText: classification.literal?.text,
    staticValueKind: classification.staticValueKind,
    staticValueText: classification.staticValueText,
    staticReferenceRoot: classification.referenceBinding?.root,
    staticReferencePath: classification.referenceBinding?.path,
    staticReferenceMemberPath: classification.referenceBinding?.memberPath,
    optionalReference: classification.referenceBinding?.optionalReference,
    optionalReferenceSegments: classification.referenceBinding?.optionalSegments,
    optionalReferenceSegmentIndexes: classification.referenceBinding?.optionalSegmentIndexes,
    optionalNullishBoundaryCount: classification.referenceBinding?.optionalSegmentIndexes?.length,
    referenceBindingStatus: classification.referenceBinding?.status,
    referenceBindingScope: classification.referenceBinding?.scope,
    referenceBindingHash,
    dynamicValueKind: classification.dynamic?.kind,
    dynamicValueText: classification.dynamic?.text,
    dynamicBlockerReasonCode: classification.dynamic?.reasonCode,
    expressionHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxContextProviderValueExpression',
      expressionText
    }),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxContextProviderValue',
      expressionText,
      proofStatus: classification.proofStatus,
      staticValueKind: classification.staticValueKind,
      optionalNullishBoundaryCount: classification.referenceBinding?.optionalSegmentIndexes?.length,
      referenceBindingHash,
      dynamicValueKind: classification.dynamic?.kind,
      dynamicBlockerReasonCode: classification.dynamic?.reasonCode
    })
  });
}

function jsxContextProviderValueReasonCode(record) {
  if (record.reasonCode) return record.reasonCode;
  if (record.proofStatus === 'literal-context-value-evidence') return 'jsx-render-context-provider-value-literal-evidence';
  if (record.proofStatus === 'static-reference-context-value-evidence') return 'jsx-render-context-provider-value-static-reference-evidence';
  if (record.proofStatus === 'static-optional-reference-context-value-evidence') return 'jsx-render-context-provider-value-static-optional-reference-evidence';
  if (record.proofStatus === 'static-data-context-value-evidence') return 'jsx-render-context-provider-value-static-data-evidence';
  return 'jsx-render-context-provider-value-unsupported';
}

function jsxContextValueClassification(expressionText) {
  const literal = jsxLiteralContextValue(expressionText);
  if (literal) {
    return {
      proofStatus: 'literal-context-value-evidence',
      reasonCode: 'jsx-render-context-provider-value-literal-evidence',
      literal
    };
  }
  const expression = unwrapJsxExpression(expressionText);
  const referenceBinding = staticReferenceBinding(expression);
  if (referenceBinding) {
    return {
      proofStatus: 'static-reference-context-value-evidence',
      reasonCode: 'jsx-render-context-provider-value-static-reference-evidence',
      staticValueKind: 'reference',
      staticValueText: referenceBinding.text,
      referenceBinding
    };
  }
  const optionalReferenceBinding = staticOptionalReferenceBinding(expression);
  if (optionalReferenceBinding) {
    return {
      proofStatus: 'static-optional-reference-context-value-evidence',
      reasonCode: 'jsx-render-context-provider-value-static-optional-reference-evidence',
      staticValueKind: 'optional-reference',
      staticValueText: optionalReferenceBinding.text,
      referenceBinding: optionalReferenceBinding
    };
  }
  const dataKind = staticDataExpressionKind(expression);
  if (dataKind) {
    return {
      proofStatus: 'static-data-context-value-evidence',
      reasonCode: 'jsx-render-context-provider-value-static-data-evidence',
      staticValueKind: dataKind,
      staticValueText: normalizedText(expression)
    };
  }
  return {
    proofStatus: 'dynamic-context-value-unsupported',
    reasonCode: 'jsx-render-context-provider-value-unsupported',
    dynamic: dynamicContextValueBlocker(expression)
  };
}

function jsxLiteralContextValue(expressionText) {
  const expression = unwrapJsxExpression(expressionText);
  if (/^"(?:[^"\\]|\\.)*"$/.test(expression) || /^'(?:[^'\\]|\\.)*'$/.test(expression)) return { kind: 'string', text: expression };
  if (/^(?:true|false)$/.test(expression)) return { kind: 'boolean', text: expression };
  if (/^(?:null|undefined)$/.test(expression)) return { kind: expression, text: expression };
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(expression)) return { kind: 'number', text: expression };
  return undefined;
}

function staticDataExpressionKind(expressionText) {
  const expression = normalizedText(expressionText);
  const kind = expression.startsWith('{') && expression.endsWith('}') ? 'object' : expression.startsWith('[') && expression.endsWith(']') ? 'array' : undefined;
  if (!kind || !balancedDelimiters(expression)) return undefined;
  if (/[();=]|=>|\.\.\.|\b(?:await|yield|new|function|class|import|require)\b/.test(expression)) return undefined;
  if (!/^[\s{}\[\],:."'A-Za-z0-9_$-]+$/.test(expression)) return undefined;
  return kind;
}

function staticReferenceBinding(expressionText) {
  const expression = normalizedText(expressionText);
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(expression)) return undefined;
  const text = expression.replace(/\s+/g, '');
  const path = text.split('.');
  const [root, ...memberPath] = path;
  return {
    text,
    root,
    path,
    memberPath,
    status: 'static-reference-binding-evidence',
    scope: 'jsx-context-provider-value-reference'
  };
}

function staticOptionalReferenceBinding(expressionText) {
  const reference = staticOptionalMemberReference(expressionText);
  return reference ? {
    ...reference,
    optionalReference: true,
    status: 'static-optional-reference-binding-evidence',
    scope: 'jsx-context-provider-value-optional-reference'
  } : undefined;
}

function dynamicContextValueBlocker(expressionText) {
  const text = normalizedText(expressionText);
  if (!text) return dynamicBlocker('empty-expression', text);
  if (/\.\.\./.test(text)) return dynamicBlocker('spread-data', text);
  if (/\[[\s\S]*\]/.test(text)) return dynamicBlocker('computed-reference', text);
  if (/(?:^|[^\w$])(?:await|yield|new|function|class|import|require)\b/.test(text)) return dynamicBlocker('runtime-expression', text);
  if (/=>/.test(text)) return dynamicBlocker('function-expression', text);
  if (/\?\.\s*\(/.test(text) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*(?:<[^>]+>\s*)?\(/.test(text)) return dynamicBlocker('call-expression', text);
  if (/\?\./.test(text)) return dynamicBlocker('optional-reference', text);
  return dynamicBlocker('dynamic-expression', text);
}

function dynamicBlocker(kind, text) {
  return {
    kind,
    text,
    reasonCode: `jsx-render-context-provider-value-${kind}-unsupported`
  };
}

function balancedDelimiters(text) {
  const stack = [];
  const pairs = { '{': '}', '[': ']' };
  let quote;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (pairs[char]) {
      stack.push(pairs[char]);
    } else if ((char === '}' || char === ']') && stack.pop() !== char) {
      return false;
    }
  }
  return !quote && stack.length === 0;
}

function unwrapJsxExpression(text) {
  const normalized = normalizedText(text);
  return normalizedText(/^\{\s*([\s\S]*?)\s*\}$/.exec(normalized)?.[1] ?? normalized);
}

function normalizedJsxAttributeValueText(text) {
  const match = /^[A-Za-z_$][\w$:-]*\s*=\s*([\s\S]*)$/.exec(String(text ?? '').trim());
  return normalizedText(match?.[1] ?? '');
}

function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function propKind(attribute) { return isJsxSpreadAttribute(attribute) ? 'spread' : 'named'; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxContextProviderValueReasonCode, jsxContextProviderValueRecord };
