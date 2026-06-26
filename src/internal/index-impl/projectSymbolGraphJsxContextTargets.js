import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function jsxContextTargetClassification(expressionText) {
  const text = normalizedContextTargetText(expressionText);
  if (!text) return undefined;
  const optionalReference = staticOptionalMemberReference(text);
  if (optionalReference) return staticOptionalContextTarget(optionalReference);
  const reference = staticContextTargetReference(text);
  if (reference) return staticContextTarget(reference);
  return dynamicContextTarget(text);
}

function staticOptionalContextTarget(reference) {
  return {
    proofStatus: 'static-optional-context-target-evidence',
    reasonCode: 'jsx-render-context-consumer-target-static-optional-reference-evidence',
    contextName: reference.text,
    contextTargetKind: 'optional-reference',
    contextTargetReferenceRoot: reference.root,
    contextTargetReferencePath: reference.path,
    contextTargetReferenceMemberPath: reference.memberPath,
    optionalReference: true,
    optionalReferenceSegments: reference.optionalSegments,
    optionalReferenceSegmentIndexes: reference.optionalSegmentIndexes,
    optionalNullishBoundaryCount: reference.optionalSegmentIndexes.length
  };
}

function staticContextTarget(reference) {
  return {
    proofStatus: 'static-context-target-evidence',
    reasonCode: 'jsx-render-context-consumer-target-static-evidence',
    contextName: reference.text,
    contextTargetKind: 'reference',
    contextTargetReferenceRoot: reference.root,
    contextTargetReferencePath: reference.path,
    contextTargetReferenceMemberPath: reference.memberPath
  };
}

function dynamicContextTarget(text) {
  const dynamicTargetKind = dynamicContextTargetKind(text);
  return {
    proofStatus: 'dynamic-context-target-unsupported',
    reasonCode: 'jsx-render-context-consumer-target-unsupported',
    contextTargetKind: 'dynamic-expression',
    dynamicTarget: true,
    dynamicTargetKind,
    dynamicBlockerReasonCode: `jsx-render-context-consumer-target-${dynamicTargetKind}-unsupported`
  };
}

function staticContextTargetReference(text) {
  const value = normalizedContextTargetText(text);
  if (!/^(?:[A-Za-z_$][\w$]*\s*\.\s*)*[A-Za-z_$][\w$]*$/.test(value)) return undefined;
  const normalized = value.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { text: normalized, root: path[0], path, memberPath: path.slice(1) };
}

function dynamicContextTargetKind(text) {
  const value = normalizedContextTargetText(text);
  if (/\[[\s\S]*\]/.test(value)) return 'computed-reference';
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'call-expression';
  if (/\?\./.test(value)) return 'optional-reference';
  return 'dynamic-expression';
}

function normalizedContextTargetText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }

export { jsxContextTargetClassification };
